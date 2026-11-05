import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { createProductStore, productMetadata, decodeAsset } from './products.mjs';
import { blankProduct, productIssues } from '../shared/product-schema.mjs';

let db, store;
const category = name => productMetadata.categories.find(c => c.label === name);
const product = overrides => ({ ...blankProduct(), name: '测试产品', sku: 'TEST-001', ...overrides });
beforeEach(() => {
  db = new Database(':memory:');
  db.exec("CREATE TABLE products(id TEXT PRIMARY KEY,sku TEXT NOT NULL UNIQUE,name TEXT NOT NULL,category TEXT NOT NULL,space TEXT,price REAL,status TEXT,source TEXT,specs_json TEXT,updated_at TEXT)");
  store = createProductStore(db);
});
afterEach(() => db.close());

describe('offline product store', () => {
  it('产品主分类使用当前系统分类，客户分类只保留为来源证据', () => {
    const p = store.save(product({canPlace:false,source:'客户原表',specs:{_sourceCategory1:'电工产品',_sourceCategory2:'普通插座',_fieldProvenance:'[{"origin":"simulated","field":"heightMm"}]'}}));
    const current = category('控制面板');
    const assigned = store.save({...p,categoryId:current.id,revision:p.revision},p.id);
    expect(assigned.category).toBe('控制 / '+current.label); expect(assigned.categoryId).toBe(current.id); expect(assigned.canPlace).toBe(false);
    expect(assigned.specs._sourceCategory1).toBe('电工产品'); expect(assigned.specs._sourceCategory2).toBe('普通插座');
    expect(store.list({category:current.id})).toHaveLength(1);
    expect(store.get(p.id).specs._fieldProvenance).toContain('simulated');
  });
  it('大产品库分页、筛选计数与越界页稳定', () => {
    for (let i=0;i<65;i++) store.save(product({sku:`PAGE-${i}`,name:`产品${i}`,brand:i<5?'品牌A':'品牌B'}));
    expect(store.page({page:1,pageSize:30})).toMatchObject({page:1,pageSize:30,total:65});
    expect(store.page({page:3,pageSize:30}).products).toHaveLength(5);
    expect(store.page({page:99,pageSize:30}).page).toBe(3);
    expect(store.page({page:2,pageSize:30,brand:'品牌A'})).toMatchObject({page:1,total:5});
  });
  it('客户单位原价保留，平方米按面积计量，原表状态不升级为实测', () => {
    const p=store.save(product({salesUnit:'平方米',quantityMode:'area',orderStep:.1,retailPrice:88,geometryStatus:'imported'}));
    expect(p.salesUnit).toBe('平方米'); expect(p.price).toBe(88); expect(p.geometryStatus).toBe('imported');
    expect(store.save(product({sku:'CM',salesUnit:'厘米',quantityMode:'length',retailPrice:.8})).price).toBe(.8);
  });
  it('导入保留声明来源，不能被默认值覆盖', () => {
    store.importRows([product({source:'乐归本地原表'})]); expect(store.list()[0].source).toBe('乐归本地原表');
  });
  it('草稿只要求名称，价格缺失不伪造0元', () => {
    const p = store.save(product({ retailPrice: null }));
    expect(p.status).toBe('草稿'); expect(p.price).toBeNull(); expect(p.retailPrice).toBeNull();
    expect(store.get(p.id).name).toBe('测试产品');
  });
  it('名称为空不可保存', () => expect(() => store.save(product({name:''}))).toThrow('产品名称'));
  it('上架必须选择分类和价格', () => {
    expect(() => store.save(product({status:'在售'}))).toThrow();
    expect(() => store.save(product({status:'在售',categoryId:category('筒灯').id}))).toThrow('建议零售价');
  });
  it('0元是有效显式价格，不回退零售价', () => {
    const p = store.save(product({status:'在售',categoryId:category('筒灯').id,retailPrice:99,salePrice:0}));
    expect(p.price).toBe(0);
  });
  it('新增重复编码和大小写变体都不覆盖', () => {
    store.save(product());
    expect(() => store.save(product({name:'新名称'}))).toThrow('编码已存在');
    expect(() => store.save(product({sku:'test-001'}))).toThrow('编码已存在');
    expect(store.list()[0].name).toBe('测试产品'); expect(store.list()).toHaveLength(1);
  });
  it('同名不同SKU允许保存', () => { store.save(product()); store.save(product({sku:'TEST-002'})); expect(store.list()).toHaveLength(2); });
  it('编辑保留扩展规格和来源，递增版本', () => {
    const p=store.save(product({specs:{ports:8,oldVendorField:'保留'},source:'演示产品目录',isSimulated:true}));
    const edited=store.save({...p,name:'改名称'},p.id);
    expect(edited.specs.oldVendorField).toBe('保留'); expect(edited.isSimulated).toBe(true); expect(edited.revision).toBe(2);
  });
  it('过期编辑不能覆盖新版本', () => {
    const p=store.save(product()); store.save({...p,name:'新版本'},p.id);
    expect(() => store.save({...p,name:'旧版本'},p.id)).toThrow('其他页面'); expect(store.get(p.id).name).toBe('新版本');
  });
  it('编辑时显式null可以清除旧选填价格', () => {
    const p=store.save(product({salePrice:50,retailPrice:100}));
    expect(store.save({...p,salePrice:null},p.id).price).toBe(100);
  });
  it('灯带分类合并但保留全部旧布点分类键', () => {
    expect(category('灯带').legacyKeys).toContain('口字灯带'); expect(category('灯带').legacyKeys).toContain('柜体灯带');
    expect(productMetadata.spaces).toHaveLength(15);
  });
  it('灯带销售长度与规格保留，不生成项目路径', () => {
    const p=store.save(product({categoryId:category('灯带').id,salesUnit:'米',quantityMode:'length',orderStep:.1,minOrderQty:.1,standardLengthMm:5000,supportedRouteShapes:['rectangle'],specs:{wattPerMeter:10,cutStepMm:50}}));
    expect(p.standardLengthMm).toBe(5000); expect(p.specs.wattPerMeter).toBe(10); expect(p).not.toHaveProperty('path');
  });
  it('无布点映射的配件只能关掉布点后上架', () => {
    const p=product({categoryId:category('电源 / 驱动').id,status:'在售',retailPrice:100});
    expect(() => store.save(p)).toThrow('布点映射'); expect(store.save({...p,canPlace:false}).status).toBe('在售');
  });
  it('非法数值和计量步长拒绝', () => {
    for (const p of [{retailPrice:-1},{widthMm:-2},{orderStep:0},{minOrderQty:.5},{retailPrice:'99'}]) expect(() => store.save(product(p))).toThrow();
  });
  it('专业参数上下限和整数校验', () => {
    expect(() => store.save(product({categoryId:category('筒灯').id,specs:{cri:120}}))).toThrow();
    expect(() => store.save(product({categoryId:category('控制面板').id,specs:{keyCount:1.2}}))).toThrow();
    expect(() => store.save(product({categoryId:category('筒灯').id,specs:{cctMin:6000,cctMax:3000}}))).toThrow();
  });
  it('已复核必须有证据；模拟状态可保存', () => {
    expect(() => store.save(product({geometryStatus:'reviewed'}))).toThrow('证据');
    expect(store.save(product({geometryStatus:'simulated',isSimulated:true})).geometryStatus).toBe('simulated');
  });
  it('批量导入任意一行错误则整批回滚', () => {
    expect(() => store.importRows([product(),product({sku:'TEST-002',name:''})])).toThrow('第2行'); expect(store.list()).toHaveLength(0);
  });
  it('批量导入默认不覆盖；明确允许才更新', () => {
    store.save(product());
    expect(() => store.importRows([product({name:'导入更新'})])).toThrow('明确勾选');
    expect(store.importRows([product({name:'导入更新'})],true)).toMatchObject({created:0,updated:1});
    expect(store.list()[0].name).toBe('导入更新');
  });
  it('导入仅填旧price时承接金额，批内重复SKU拒绝', () => {
    store.importRows([{sku:'OLD',name:'旧数据',price:25}]); expect(store.list()[0].retailPrice).toBe(25);
    expect(() => store.importRows([product(),product()])).toThrow('文件内产品编码重复');
  });
  it('不存在的附件不能关联，媒体与来源回读不丢失', () => {
    expect(() => store.save(product({assets:[{id:'missing',role:'cover'}]}))).toThrow('附件不存在');
    store.addAsset({id:'asset-1',name:'产品.png',mime:'image/png',size:100,sha256:'hash',createdAt:new Date().toISOString()});
    const p=store.save(product({assets:[{id:'asset-1',role:'cover'}]}));
    expect(store.get(p.id).assets[0].url).toBe('/api/admin/product-assets/asset-1'); expect(store.assetBackup()).toHaveLength(1);
  });
  it('伪装图片、脚本、超限与不支持文件拒绝', () => {
    expect(() => decodeAsset({name:'test.png',base64:Buffer.from('<script>').toString('base64')})).toThrow();
    expect(() => decodeAsset({name:'test.svg',base64:Buffer.from('<svg/>').toString('base64')})).toThrow();
    const image=decodeAsset({name:'sample.png',base64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII='});
    expect(image.info.mime).toBe('image/png'); expect(image.info.sha256).toHaveLength(64);
  });
  it('共享校验器在前端也保持同样的上架缺口', () => {
    const issues=productIssues(product({status:'在售'}),productMetadata.categories);
    expect(issues.categoryId).toBeTruthy(); expect(issues.retailPrice).toBeTruthy();
  });
  it('产品分类与45个规则物品编码一一对应且映射可互换', () => {
    const overview = store.categoryOverview();
    expect(overview.ruleItems).toHaveLength(45);
    expect(overview.categories).toHaveLength(45);
    expect(new Set(overview.categories.map(c => c.itemCode)).size).toBe(45);
    expect(overview.stats).toMatchObject({ mappedCount:45, unmappedCount:0, conflictCount:0 });
    const downlight = overview.categories.find(c => c.label === '筒灯');
    const driver = overview.categories.find(c => c.label === '电源 / 驱动');
    const swapped = store.updateCategoryMapping(downlight.id, 'PowerSupplyDriver');
    const nextDownlight = swapped.categories.find(c => c.id === downlight.id);
    const nextDriver = swapped.categories.find(c => c.id === driver.id);
    expect(nextDownlight.itemCode).toBe('PowerSupplyDriver');
    expect(nextDriver.itemCode).toBe('DownLight');
    expect(nextDownlight.mappingConflict || nextDriver.mappingConflict).toBe(false);
    expect(new Set(swapped.categories.map(c => c.itemCode)).size).toBe(45);
    const reset = store.updateCategoryMapping(downlight.id, '');
    expect(reset.categories.find(c => c.id === downlight.id).itemCode).toBe('DownLight');
  });
  it('产品状态机按动作流转并记录完整历史', () => {
    const created = store.save(product({ status:'草稿', categoryId:category('筒灯').id, canPlace:true, retailPrice:99 }));
    expect(created.status).toBe('草稿');
    expect(() => store.transition(created.id, { action:'withdraw', expectedStatus:'草稿' })).toThrow('不支持');
    const published = store.transition(created.id, { action:'publish', expectedStatus:'草稿', actor:'店长' });
    expect(published.status).toBe('在售');
    expect(() => store.transition(created.id, { action:'publish', expectedStatus:'草稿' })).toThrow('状态已变化');
    const withdrawn = store.transition(created.id, { action:'withdraw', expectedStatus:'在售' });
    expect(withdrawn.status).toBe('下架');
    const republished = store.transition(created.id, { action:'publish', expectedStatus:'下架' });
    expect(republished.status).toBe('在售');
    expect(() => store.transition(created.id, { action:'archive', expectedStatus:'在售' })).toThrow('原因');
    const archived = store.transition(created.id, { action:'archive', expectedStatus:'在售', reason:'型号停产' });
    expect(archived.status).toBe('归档');
    expect(() => store.transition(created.id, { action:'publish', expectedStatus:'归档' })).toThrow('不支持');
    const restored = store.transition(created.id, { action:'restore', expectedStatus:'归档' });
    expect(restored.status).toBe('草稿');
    const history = store.statusHistory(created.id);
    expect(history.map(item => item.toStatus)).toEqual(['草稿','在售','下架','在售','归档','草稿']);
    expect(history.find(item => item.action === 'archive').reason).toBe('型号停产');
    expect(store.statusSummary()).toMatchObject({ 草稿:1, 在售:0, 下架:0, 归档:0 });
  });
  it('新品不能直接归档，编辑保存不能绕过状态机', () => {
    expect(() => store.save(product({ status:'归档' }))).toThrow('草稿或直接上架');
    const created = store.save(product({ status:'草稿', categoryId:category('筒灯').id, canPlace:true, retailPrice:99 }));
    expect(() => store.save({ ...created, status:'下架' }, created.id)).toThrow('状态流转');
  });
  it('设计目录优先使用门店默认设备型号', () => {
    db.exec('CREATE TABLE system_settings(key TEXT PRIMARY KEY, value_json TEXT, updated_at TEXT)');
    const cheap = store.save(product({ sku:'DL-CHEAP', name:'低价筒灯', status:'在售', categoryId:category('筒灯').id, canPlace:true, retailPrice:50 }));
    const preferred = store.save(product({ sku:'DL-PREF', name:'指定筒灯', status:'在售', categoryId:category('筒灯').id, canPlace:true, retailPrice:120 }));
    db.prepare('INSERT INTO system_settings VALUES (?,?,?)').run('defaultDeviceModels', JSON.stringify({ [category('筒灯').id]: { productId: preferred.id, brand:'测试', model:'DL-PREF' } }), new Date().toISOString());
    const catalog = store.designCatalog();
    expect(catalog.devices.find(item => item.legacyKey === '筒灯').productId).toBe(preferred.id);
    expect(catalog.devices.find(item => item.legacyKey === '筒灯').productId).not.toBe(cheap.id);
  });
  it('只设置默认品牌时优先选择该品牌，而不是最低价产品', () => {
    db.exec('CREATE TABLE system_settings(key TEXT PRIMARY KEY, value_json TEXT, updated_at TEXT)');
    store.save(product({ sku:'DL-BRAND-B', name:'低价筒灯', brand:'品牌B', status:'在售', categoryId:category('筒灯').id, canPlace:true, retailPrice:50 }));
    const brandA = store.save(product({ sku:'DL-BRAND-A', name:'品牌A筒灯', brand:'品牌A', status:'在售', categoryId:category('筒灯').id, canPlace:true, retailPrice:200 }));
    db.prepare('INSERT INTO system_settings VALUES (?,?,?)').run('defaultDeviceModels', JSON.stringify({ [category('筒灯').id]: { productId:'', brand:'品牌A', model:'' } }), new Date().toISOString());
    const catalog = store.designCatalog();
    expect(catalog.devices.find(item => item.legacyKey === '筒灯').productId).toBe(brandA.id);
  });
  it('推荐、模拟和价格都相同时，默认型号按最近更新优先', () => {
    db.exec('CREATE TABLE system_settings(key TEXT PRIMARY KEY, value_json TEXT, updated_at TEXT)');
    const older = store.save(product({ sku:'DL-TIE-A', name:'旧款筒灯', status:'在售', categoryId:category('筒灯').id, canPlace:true, retailPrice:100 }));
    const newer = store.save(product({ sku:'DL-TIE-B', name:'新款筒灯', status:'在售', categoryId:category('筒灯').id, canPlace:true, retailPrice:100 }));
    db.prepare('UPDATE products SET updated_at=? WHERE id=?').run('2026-01-01T00:00:00.000Z', older.id);
    db.prepare('UPDATE products SET updated_at=? WHERE id=?').run('2026-02-01T00:00:00.000Z', newer.id);
    const catalog = store.designCatalog();
    expect(catalog.devices.find(item => item.legacyKey === '筒灯').productId).toBe(newer.id);
  });
  it('全部条件并列且更新时间相同时，默认型号按 SKU 升序稳定选择', () => {
    db.exec('CREATE TABLE system_settings(key TEXT PRIMARY KEY, value_json TEXT, updated_at TEXT)');
    const first = store.save(product({ sku:'DL-SAME-A', name:'并列筒灯 A', status:'在售', categoryId:category('筒灯').id, canPlace:true, retailPrice:100 }));
    store.save(product({ sku:'DL-SAME-B', name:'并列筒灯 B', status:'在售', categoryId:category('筒灯').id, canPlace:true, retailPrice:100 }));
    const sameTime = '2026-03-01T00:00:00.000Z';
    db.prepare("UPDATE products SET updated_at=? WHERE sku LIKE 'DL-SAME-%'").run(sameTime);
    const catalog = store.designCatalog();
    expect(catalog.devices.find(item => item.legacyKey === '筒灯').productId).toBe(first.id);
  });
  it('批量上架逐项执行状态机并返回失败项', () => {
    const good = store.save(product({ sku:'BATCH-OK', name:'可上架筒灯', status:'草稿', categoryId:category('筒灯').id, canPlace:true, retailPrice:99 }));
    const bad = store.save(product({ sku:'BATCH-BAD', name:'缺分类筒灯', status:'草稿', canPlace:true }));
    const result = store.batchUpdate({ ids:[good.id, bad.id], action:'publish', actor:'店长' });
    expect(result).toMatchObject({ total:2, updated:1 });
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].id).toBe(bad.id);
    expect(store.get(good.id).status).toBe('在售');
    expect(store.get(bad.id).status).toBe('草稿');
    expect(store.statusHistory(good.id).at(-1)).toMatchObject({ action:'publish', actor:'店长' });
  });
  it('批量修改分类不改归档产品，并在售产品重新校验', () => {
    const draft = store.save(product({ sku:'BATCH-CAT-1', name:'待改分类', status:'草稿', categoryId:category('筒灯').id, canPlace:true, retailPrice:99 }));
    const archived = store.save(product({ sku:'BATCH-CAT-2', name:'已归档', status:'草稿', categoryId:category('筒灯').id, canPlace:true, retailPrice:99 }));
    store.transition(archived.id, { action:'archive', expectedStatus:'草稿', reason:'测试归档' });
    const result = store.batchUpdate({ ids:[draft.id, archived.id], action:'category', categoryId:category('射灯').id });
    expect(result.updated).toBe(1);
    expect(result.failed[0].id).toBe(archived.id);
    expect(store.get(draft.id).categoryId).toBe(category('射灯').id);
    expect(store.get(archived.id).categoryId).toBe(category('筒灯').id);
  });
  it('批量归档必须填写原因', () => {
    const p = store.save(product({ sku:'BATCH-ARC', status:'草稿' }));
    expect(() => store.batchUpdate({ ids:[p.id], action:'archive' })).toThrow('原因');
    const result = store.batchUpdate({ ids:[p.id], action:'archive', reason:'批量下柜' });
    expect(result.updated).toBe(1);
    expect(store.get(p.id).status).toBe('归档');
  });
});
