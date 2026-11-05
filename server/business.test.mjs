import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBusinessStore } from './business.mjs';

let db, dir, store;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qone-business-'));
  db = new Database(':memory:');
  db.pragma('foreign_keys=ON');
  db.exec(`
    CREATE TABLE customers(id TEXT PRIMARY KEY,name TEXT);
    CREATE TABLE projects(id TEXT PRIMARY KEY,name TEXT,customer_id TEXT,area REAL,status TEXT,scheme_type TEXT,updated_at TEXT,payload_json TEXT);
    CREATE TABLE products(id TEXT PRIMARY KEY,sku TEXT,name TEXT,category TEXT,space TEXT,price REAL,status TEXT,source TEXT,specs_json TEXT,details_json TEXT,updated_at TEXT);
    INSERT INTO projects VALUES ('P1','测试全屋项目',NULL,128,'方案设计','全屋智能','2026-11-02T00:00:00.000Z','{}');
    INSERT INTO products VALUES ('L1','LIGHT-1','演示智能筒灯','灯光 / 筒灯','全屋',199,'在售','测试','{"salesUnit":"个"}','{"canPrice":true,"canPlace":true}', '2026-11-02T00:00:00.000Z');
    INSERT INTO products VALUES ('C1','CTRL-1','四键控制面板','控制 / 控制面板','全屋',399,'在售','测试','{"salesUnit":"个"}','{"canPrice":true,"canPlace":true}', '2026-11-02T00:00:00.000Z');
    INSERT INTO products VALUES ('C2','CTRL-2','六键控制面板','控制 / 控制面板','全屋',459,'在售','测试','{"salesUnit":"个"}','{"canPrice":true,"canPlace":true,"communicationProtocols":["KNX"],"spaceCodes":["living"]}', '2026-11-02T00:00:00.000Z');
    INSERT INTO products VALUES ('N1','NET-1','面板 AP','网络 / 面板 AP','全屋',699,'在售','测试','{"salesUnit":"个"}','{"canPrice":true,"canPlace":true}', '2026-11-02T00:00:00.000Z');
    INSERT INTO products VALUES ('N2','NET-2','8口 PoE 交换机','网络 / 弱电箱 · PoE 交换机','全屋',1299,'在售','测试','{"salesUnit":"台"}','{"canPrice":true,"canPlace":true}', '2026-11-02T00:00:00.000Z');
    INSERT INTO products VALUES ('N3','NET-3','全屋 Mesh 网关','网络 / 蓝牙 Mesh 网关','全屋',899,'在售','测试','{"salesUnit":"台"}','{"canPrice":true,"canPlace":true}', '2026-11-02T00:00:00.000Z');
  `);
  store = createBusinessStore(db, { dataDir: dir, productStore: {} });
});
afterEach(() => { db.close(); fs.rmSync(dir, { recursive: true, force: true }); });

describe('offline store business capabilities', () => {
  it('covers every competitor capability domain', () => {
    expect(store.capabilities().map(item => item.key)).toEqual(['marketing','projects','products','design','store','settings']);
    expect(store.capabilities().every(item => item.status === 'available' && item.offline)).toBe(true);
  });

  it('stores and clears the store logo used as the system brand', () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64');
    const saved = store.saveStoreLogo({ name: '门店LOGO.png', base64: png.toString('base64') });
    expect(saved.logo).toMatchObject({ name: '门店LOGO.png', mime: 'image/png', size: png.length });
    expect(saved.logoUrl).toContain('/api/admin/store/logo?v=');
    expect(store.branding()).toMatchObject({ storeName: saved.name, logoUrl: saved.logoUrl });
    expect(fs.existsSync(store.storeLogoFile().path)).toBe(true);
    expect(store.auditLogs().some(item => item.action === 'store.logo.update')).toBe(true);
    store.updateStore({ payload: { logo: { id: '../../server/index.mjs' }, businessHours: '10:00-19:00' } });
    expect(store.storeProfile().logo.id).toBe(saved.logo.id);
    expect(store.storeProfile().payload.businessHours).toBe('10:00-19:00');
    const quote = store.saveQuote({ projectId:'P1', mode:'智能报价' });
    expect(store.quotePrintHtml(quote.id)).toContain('class="logo"');
    expect(() => store.saveStoreLogo({ name: '门店LOGO.pdf', base64: Buffer.from('%PDF-1.4').toString('base64') })).toThrow('仅支持');
    const cleared = store.removeStoreLogo();
    expect(cleared.logo).toBeNull();
    expect(cleared.logoUrl).toBe('');
    expect(store.storeLogoFile()).toBeNull();
    expect(store.auditLogs().some(item => item.action === 'store.logo.remove')).toBe(true);
  });

  it('paginates inventory without dropping or duplicating matching rows', () => {
    const first = store.inventoryPage({}, 1, 2);
    const second = store.inventoryPage({}, 2, 2);
    expect(first.total).toBe(6);
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(2);
    expect(new Set([...first.items, ...second.items].map(item => item.id)).size).toBe(4);
    store.updateInventory('L1', { quantity: 0, safetyStock: 2 });
    expect(store.inventoryPage({ lowOnly: true }, 1, 30).total).toBe(1);
  });

  it('persists a traceable design version with quantity summary', () => {
    const version = store.saveDesign('P1', { snapshot: { furniture: [
      { id:'sofa', type:'sofa' },
      { id:'dev1', type:'dev:筒灯', smart:{ status:'placed', locked:true, lighting:{ circuitId:'C-01' } } },
      { id:'dev2', type:'dev:射灯', smart:{ status:'pending' } },
    ], zones:[{id:'z1'}] } });
    expect(version.versionNo).toBe(1);
    expect(version.summary).toMatchObject({ furniture:1, devices:2, placed:1, pending:1, locked:1, zones:1, circuits:1 });
    expect(store.latestDesign('P1').snapshot.furniture).toHaveLength(3);
  });

  it('keeps design plans as first-class objects that can link to a project later', () => {
    const projectVersion = store.saveDesign('P1', { snapshot: { furniture: [{ id:'sofa', type:'sofa' }] } });
    expect(projectVersion.designId).toBeTruthy();
    expect(projectVersion.designName).toContain('设计方案');

    const standalone = store.createDesign({ name:'独立客厅方案' });
    expect(standalone).toMatchObject({ projectId:'', status:'设计中', latestVersionNo:0, versionCount:0 });
    const first = store.saveDesignVersion(standalone.id, { snapshot: { furniture: [{ id:'chairs', type:'chair' }] } });
    expect(first.versionNo).toBe(1);
    expect(store.designPage({ linked:'standalone' })).toMatchObject({ total:1 });
    expect(store.getDesign(standalone.id).versions).toHaveLength(1);

    const linked = store.updateDesign(standalone.id, { projectId:'P1' });
    expect(linked).toMatchObject({ projectId:'P1', customerName:'' });
    expect(store.designPage({ projectId:'P1' }).total).toBe(2);
    expect(store.designVersions('P1').map(item => item.id)).toContain(first.id);

    const second = store.saveDesignVersion(standalone.id, { snapshot: { furniture: [] } });
    expect(second.versionNo).toBe(2);
    expect(store.getDesign(standalone.id).latestVersionNo).toBe(2);
    expect(store.latestDesignVersion(standalone.id).id).toBe(second.id);

    store.updateDesign(standalone.id, { status:'已归档' });
    expect(() => store.saveDesignVersion(standalone.id, { snapshot: { furniture: [] } })).toThrow('已归档');
    expect(() => store.saveDesignVersion('DSN-MISSING', { snapshot: { furniture: [] } })).toThrow('设计方案不存在');
  });

  it('generates an explainable smart quote and preserves its price snapshot', () => {
    const quote = store.saveQuote({ projectId:'P1', mode:'智能报价' });
    expect(quote.payload.items.length).toBeGreaterThan(0);
    const networkItems = quote.payload.items.filter(item => item.source === '全屋网络基础包');
    expect(networkItems).toHaveLength(3);
    expect(networkItems.find(item => item.ruleCode === 'QUOTE-网络交换机')?.name.toUpperCase()).toContain('POE');
    expect(quote.payload.items.every(item => item.reason)).toBe(true);
    expect(quote.total).toBeGreaterThan(0);
    db.prepare("UPDATE products SET price=9999 WHERE id='L1'").run();
    expect(store.getQuote(quote.id).payload.items.find(item => item.productId === 'L1').unitPrice).toBe(199);
    expect(store.quoteCsv(quote.id)).toContain('产品名称');
  });

  it('keeps settings, users, templates and audit events in sqlite', () => {
    store.updateSettings({ projectConfig:{ quoteValidityDays:45, currency:'CNY' } });
    store.saveUser({ name:'新设计师', account:'new-designer', roleId:'ROLE-DESIGNER' });
    store.saveRole({ name:'方案设计师', description:'设计与交付', permissions:['project.read','design.write','delivery.read'] }, 'ROLE-DESIGNER');
    store.saveQuoteTemplate({ name:'门店自定义模板', schemeType:'全屋智能', lines:[] });
    expect(store.settings().projectConfig.quoteValidityDays).toBe(45);
    expect(store.users().some(item => item.account === 'new-designer')).toBe(true);
    expect(store.roles().find(item => item.id === 'ROLE-DESIGNER')).toMatchObject({ description:'设计与交付', permissions:['project.read','design.write','delivery.read'] });
    expect(store.quoteTemplates().some(item => item.name === '门店自定义模板')).toBe(true);
    expect(store.auditLogs().length).toBeGreaterThanOrEqual(3);
  });

  it('creates, updates and deletes roles with unique-name and usage protection', () => {
    const created = store.saveRole({ name:'店长助理', description:'协助门店运营', permissions:['project.read','quote.read'] });
    expect(created.id).toMatch(/^ROLE-/);
    expect(store.roles().some(item => item.id === created.id)).toBe(true);
    const updated = store.saveRole({ name:'店长助理', description:'运营复核', permissions:['project.read','quote.confirm'] }, created.id);
    expect(updated).toMatchObject({ description:'运营复核', permissions:['project.read','quote.confirm'] });
    expect(() => store.saveRole({ name:'店长助理', permissions:['project.read'] })).toThrow('角色名称已存在');
    expect(() => store.saveRole({ name:'空权限角色', permissions:[] })).toThrow('至少需要一项权限');
    expect(() => store.saveRole({ description:'尝试修改内置角色' }, 'ROLE-ADMIN')).toThrow('系统内置角色');
    expect(() => store.deleteRole('ROLE-ADMIN')).toThrow('不能删除');
    expect(store.deleteRole(created.id)).toMatchObject({ deleted:true });
    expect(store.roles().some(item => item.id === created.id)).toBe(false);
  });

  it('blocks deleting a role that is still assigned to staff', () => {
    const role = store.saveRole({ name:'临时角色', permissions:['project.read'] });
    const user = store.saveUser({ name:'临时员工', account:'temp-staff', roleId:role.id, pin:'1234' });
    expect(() => store.deleteRole(role.id)).toThrow('仍被 1 个员工使用');
    store.deleteUser(user.id, 'USR-ADMIN');
    expect(store.deleteRole(role.id).deleted).toBe(true);
  });

  it('edits staff accounts, keeps the PIN when blank and protects the last administrator', () => {
    const created = store.saveUser({ name:'新顾问', account:'advisor-1', phone:'13800000009', roleId:'ROLE-SALES', pin:'2468' });
    const updated = store.saveUser({ name:'新顾问甲', account:'advisor-1', phone:'13800000010', roleId:'ROLE-DESIGNER' }, created.id);
    expect(updated).toMatchObject({ name:'新顾问甲', phone:'13800000010', roleId:'ROLE-DESIGNER', status:'启用' });
    expect(store.login('advisor-1', '2468').name).toBe('新顾问甲');
    expect(() => store.saveUser({ account:'advisor-2' }, created.id)).toThrow('修改登录账号需要同时设置新的 4 位 PIN');
    expect(() => store.deleteUser(created.id, created.id)).toThrow('不能删除当前登录账号');
    const admin = store.users().find(item => item.roleId === 'ROLE-ADMIN');
    expect(() => store.deleteUser(admin.id, created.id)).toThrow('至少需要保留一个门店管理员');
    expect(store.deleteUser(created.id, 'USR-ADMIN').deleted).toBe(true);
  });

  it('supports offline account login and rejects a wrong pin', () => {
    expect(store.login('admin','0000')).toMatchObject({ account:'admin', roleName:'门店管理员' });
    expect(() => store.login('admin','9999')).toThrow('账号或 PIN');
  });

  it('closes inventory, purchase and payment loops locally', () => {
    store.updateInventory('C1', { quantity:1, safetyStock:2 });
    expect(store.inventory({ lowOnly:true }).find(item => item.id === 'C1')).toMatchObject({ quantity:1, safetyStock:2, lowStock:true, suggestedPurchase:3 });
    const order = store.savePurchaseOrder({ supplier:'测试供应商', items:[{ productId:'C1', quantity:4 }] });
    store.savePurchaseOrder({ ...order, status:'已入库' }, order.id);
    expect(store.inventory({ search:'CTRL-1' }).find(item => item.id === 'C1').quantity).toBe(5);
    const quote = store.saveQuote({ projectId:'P1', mode:'智能报价' });
    store.savePayment({ projectId:'P1', quoteId:quote.id, amount:1000, method:'银行卡' });
    expect(store.operationsSummary()).toMatchObject({ received:1000, openPurchaseOrders:0 });
  });

  it('paginates inventory with an auditable filtered total', () => {
    const all = store.inventoryPage({}, 1, 100);
    const first = store.inventoryPage({}, 1, 2);
    expect(first.total).toBe(all.total);
    expect(first.items).toHaveLength(2);
    expect(first.page).toBe(1);
    expect(first.pageSize).toBe(2);
    const lastPage = Math.ceil(all.total / 2);
    const last = store.inventoryPage({}, lastPage, 2);
    expect(last.items).toHaveLength(all.total - (lastPage - 1) * 2);
    const ids = [...first.items, ...last.items].map(item => item.id);
    expect(new Set(ids).size).toBe(first.items.length + last.items.length);
    // lowOnly 在 SQL 层过滤，未盘点产品不应被算作低库存。
    expect(store.inventoryPage({ lowOnly:true }, 1, 30).total).toBe(0);
    store.updateInventory('C1', { quantity:1, safetyStock:2 });
    expect(store.inventoryPage({ lowOnly:true }, 1, 30)).toMatchObject({ total:1 });
  });

  it('supports create update and delete for inventory purchase and payments', () => {
    store.updateInventory('C1', { quantity:5, safetyStock:2 });
    expect(store.deleteInventory('C1')).toMatchObject({ deleted:true, productId:'C1' });
    expect(store.inventory({ search:'CTRL-1' }).find(item => item.id === 'C1').tracked).toBe(false);
    const purchase = store.savePurchaseOrder({ supplier:'CRUD 供应商', items:[{ productId:'C1', quantity:2 }] });
    const edited = store.savePurchaseOrder({ ...purchase, supplier:'CRUD 供应商-已编辑', items:[{ productId:'C1', quantity:3 }] }, purchase.id);
    expect(edited).toMatchObject({ supplier:'CRUD 供应商-已编辑' });
    expect(edited.items[0].quantity).toBe(3);
    expect(store.deletePurchaseOrder(purchase.id)).toMatchObject({ deleted:true });
    const payment = store.savePayment({ projectId:'P1', amount:500, method:'现金', note:'原始' });
    const updated = store.savePayment({ ...payment, amount:800, method:'微信', note:'已编辑' }, payment.id);
    expect(updated).toMatchObject({ amount:800, method:'微信', note:'已编辑' });
    expect(store.deletePayment(payment.id)).toMatchObject({ deleted:true });
  });

  it('provides explainable alternatives and a reviewable local floorplan assist', () => {
    const alternatives = store.productAlternatives('C1');
    expect(alternatives[0]).toMatchObject({ id:'C2' });
    expect(alternatives[0].reason).toContain('同产品分类');
    const assist = store.assistFloorplan('P1', { fileName:'三室两厅.png', imageWidth:1600, imageHeight:1000 });
    expect(assist.method).toBe('local_heuristic_demo');
    expect(assist.status).toBe('待复核');
    expect(assist.rooms.some(room => room.name === '客厅')).toBe(true);
    expect(assist.warnings.join('')).toContain('不等同于训练模型识别');
  });

  it('quotes the saved design device snapshot and exposes cost and profit', () => {
    const design = store.saveDesign('P1', { snapshot: { furniture: [
      { id:'dev1', type:'dev:筒灯', name:'筒灯', cx:100, cy:100, smart:{ status:'placed', source:'manual', roomId:'living', ruleCode:'KT-DL-01', product:{ productId:'L1', sku:'LIGHT-1', productName:'演示智能筒灯', legacyKey:'筒灯' }, quote:{ inputQuantity:2 } } },
    ] } });
    const quote = store.saveQuote({ projectId:'P1', mode:'智能报价', designVersionId:design.id });
    expect(quote.payload.pricingBasis).toBe('design_snapshot');
    expect(quote.payload.items[0]).toMatchObject({ productId:'L1', quantity:2, source:'客户选品设计快照', ruleCode:'KT-DL-01' });
    expect(quote.payload).toMatchObject({ costTotal:0, grossProfit:quote.total });
    const copied = store.copyQuote(quote.id);
    expect(copied.versionNo).toBe(2);
    expect(copied.mode).toBe('复制报价');
  });

  it('creates a standalone quote and assigns it to a project later', () => {
    db.prepare("INSERT INTO customers VALUES ('CUST-1','王先生')").run();
    const standalone = store.saveQuote({ mode:'快速报价', customerId:'CUST-1', area:120, name:'独立报价验收' });
    expect(standalone).toMatchObject({ projectId:null, customerId:'CUST-1', mode:'快速报价' });
    expect(standalone.quoteNo).toMatch(/^QTE-/);
    expect(standalone.payload.items.length).toBeGreaterThan(0);
    const assigned = store.updateQuoteAssociation(standalone.id, { projectId:'P1' });
    expect(assigned).toMatchObject({ projectId:'P1', projectName:'测试全屋项目', customerId:'CUST-1' });
    expect(store.quotes('P1').some(item => item.id === standalone.id)).toBe(true);
  });

  it('persists configurable quote template quantity rules', () => {
    const template = store.saveQuoteTemplate({
      name:'分空间照明模板',
      schemeType:'全屋智能',
      lines:[
        { label:'基础照明', category:'灯光', formula:'ceil(area/10)' },
        { label:'控制面板', category:'控制', formula:'ceil(area/30)' },
      ],
    });
    expect(template.lines).toEqual([
      { label:'基础照明', category:'灯光', formula:'ceil(area/10)' },
      { label:'控制面板', category:'控制', formula:'ceil(area/30)' },
    ]);
    const updated = store.saveQuoteTemplate({ lines:[{ label:'网络基础包', category:'网络', formula:'4' }] }, template.id);
    expect(updated.lines).toHaveLength(1);
    expect(updated.lines[0].formula).toBe('4');
  });

  it('updates a draft quote in place without creating a new quote number', () => {
    const draft = store.saveQuote({ projectId:'P1', mode:'快速报价' });
    const updated = store.updateQuoteDraft(draft.id, {
      name:'草稿编辑验收',
      overallDiscount:90,
      items:[{ ...draft.payload.items[0], quantity:3, discount:80 }],
    });
    expect(updated).toMatchObject({ id:draft.id, quoteNo:draft.quoteNo, name:'草稿编辑验收', discount:90 });
    expect(updated.payload.items).toHaveLength(1);
    expect(updated.payload.items[0]).toMatchObject({ quantity:3, discount:80 });
    expect(store.quotes('P1').filter(item => item.id === draft.id)).toHaveLength(1);
  });

  it('runs the quote state machine with conflict protection and audit history', () => {
    const quote = store.saveQuote({ projectId:'P1', mode:'快速报价' });
    expect(() => store.transitionQuote(quote.id, { action:'submit', expectedStatus:'草稿', _permissions:['quote.read'] })).toThrow('权限');
    const pending = store.transitionQuote(quote.id, { action:'submit', expectedStatus:'草稿', _permissions:['*'] });
    expect(pending.status).toBe('待确认');
    expect(pending.statusHistory.length).toBe(2);
    expect(() => store.transitionQuote(quote.id, { action:'return', expectedStatus:'待确认', _permissions:['*'] })).toThrow('必须填写原因');
    expect(() => store.transitionQuote(quote.id, { action:'submit', expectedStatus:'草稿', _permissions:['*'] })).toThrow('状态已变化');
    try { store.transitionQuote(quote.id, { action:'submit', expectedStatus:'草稿', _permissions:['*'] }); }
    catch (error) { expect(error.statusCode).toBe(409); }
    const confirmed = store.transitionQuote(quote.id, { action:'confirm', expectedStatus:'待确认', _permissions:['*'] });
    expect(confirmed).toMatchObject({ status:'已确认' });
    expect(confirmed.confirmedBy).toBeTruthy();
    expect(confirmed.confirmedAt).toBeTruthy();
    expect(() => store.updateQuoteDraft(quote.id, { name:'不允许修改' })).toThrow('只有草稿报价可以编辑');
    const voided = store.transitionQuote(quote.id, { action:'void', expectedStatus:'已确认', reason:'客户取消', _permissions:['*'] });
    expect(voided).toMatchObject({ status:'已作废', voidReason:'客户取消' });
    expect(voided.statusHistory.map(item => item.toStatus)).toEqual(['草稿','待确认','已确认','已作废']);
  });

  it('creates downloadable artifacts inside a delivery package', () => {
    const design = store.saveDesign('P1', { snapshot: { furniture: [
      { id:'dev1', type:'dev:筒灯', name:'筒灯', cx:100, cy:200, smart:{ z:2750, status:'placed', source:'manual', roomId:'living', ruleCode:'KT-DL-01', lighting:{ circuitId:'DEMO-C-01', daliAddress:3 } } },
    ] } });
    const delivery = store.createDelivery('P1', { designVersionId:design.id });
    expect(delivery.manifest.artifacts.some(item => item.key === 'smart-points' && item.status === '已生成')).toBe(true);
    const artifact = store.getDeliveryArtifact(delivery.id, 'smart-points');
    expect(artifact.name).toContain('智能点位');
    expect(artifact.content).toContain('KT-DL-01');
  });
});
