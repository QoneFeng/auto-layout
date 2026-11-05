<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { NButton, NInput, NInputNumber, NSelect, NTag } from 'naive-ui';
import DesignDeliveryWorkspace from './DesignDeliveryWorkspace.vue';
import ProjectJourneySettings from './ProjectJourneySettings.vue';
import AdminConfirmDialog from './components/AdminConfirmDialog.vue';
import AdminPagination from './components/AdminPagination.vue';
import AdminStatusHistory from './components/AdminStatusHistory.vue';
import { queryPage, queryPageSize, readRouteQuery, updateRouteQuery } from './hash-query';

type Mode = 'quotes' | 'designs' | 'operations' | 'store' | 'settings';
type Project = { id: string; name: string; area: number; schemeType: string; status: string; progress?: number; currentStage?: string; customerId?: string | null };
type QuoteLine = { id?: string; productId?: string; sku: string; name: string; category: string; brand?: string; model?: string; quantity: number; unit: string; unitPrice: number; discount: number; amount?: number; source?: string; status?: string; reason?: string; space?: string };

const props = withDefaults(defineProps<{ mode: Mode; routePath: string; projects: Project[]; overview: Record<string, unknown>; projectId?: string; embedded?: boolean; permissions?: string[]; currentUserId?: string }>(), {
  projectId: '',
  embedded: false,
  permissions: () => [],
  currentUserId: '',
});
const emit = defineEmits<{ notice: [message: string]; changed: []; openDesignPlans: [projectId: string]; openDesignObject: [designId: string] }>();

const busy = ref(false), message = ref('');
const confirmState = ref({ show: false, title: '', message: '', detail: '', confirmText: '确认删除', danger: true });
let confirmResolver: ((value: boolean) => void) | null = null;
function confirmAction(options: { title: string; message: string; detail?: string; confirmText?: string; danger?: boolean }) {
  confirmState.value = {
    show: true,
    title: options.title,
    message: options.message,
    detail: options.detail || '',
    confirmText: options.confirmText || '确认删除',
    danger: options.danger !== false,
  };
  return new Promise<boolean>(resolve => { confirmResolver = resolve; });
}
function settleConfirm(value: boolean) {
  confirmState.value = { ...confirmState.value, show: false };
  confirmResolver?.(value);
  confirmResolver = null;
}
const quotes = ref<any[]>([]), templates = ref<any[]>([]), quoteDetail = ref<any | null>(null);
const quotePageRecord = ref<any | null>(null);
const quoteEditForm = ref<any>({ name:'', projectId:'', customerId:'', overallDiscount:100, items:[] });
const quoteTab = ref<'list'|'templates'>('list');
const quoteMode = ref<'quick'|'manual'|'smart'>('quick');
const showQuoteAssociation = ref(false);
const showQuoteTransition = ref(false);
// Legacy modal state remains referenced by an unreachable compatibility block.
const showQuoteBuilder = ref(false);
const showTemplateForm = ref(false);
const quoteSearch = ref(''), quoteStatus = ref('全部'), quoteProjectFilter = ref('');
const designTab = ref<'versions'|'artifacts'|'files'|'packages'>('versions');
const operationTab = ref<'inventory'|'purchase'|'payments'>('inventory');
const storeTab = ref<'profile'|'staff'|'roles'>('profile');
const settingsTab = ref<'pricing'|'devices'|'journey'|'construction'|'backup'|'audit'>('pricing');
const showPurchaseForm = ref(false), showPaymentForm = ref(false), showUserForm = ref(false), showProjectConfigForm = ref(false), showRoleForm = ref(false);
const selectedProjectId = ref(''), selectedTemplateId = ref(''), overallDiscount = ref(100);
const manualLines = ref<QuoteLine[]>([]), productSearch = ref(''), productOptions = ref<any[]>([]);
const customers = ref<any[]>([]);
const quoteCatalog = ref<any[]>([]);
const quoteAssociationForm = ref({ quoteId: '', projectId: '', customerId: '' });
const quoteTransitionForm = ref({ quoteId: '', action: '', expectedStatus: '', reason: '' });
const quoteDraft = ref({
  name: '',
  projectId: '',
  customerId: '',
  templateId: '',
  area: 120,
  schemeType: '全屋智能',
  overallDiscount: 100,
  rooms: { living: 1, dining: 1, bedroom: 3, bathroom: 2, kitchen: 1, balcony: 1 },
  platforms: ['米家'],
  scenes: ['智能灯控', '客厅智能调光', '卧室窗帘'],
  spaces: ['客厅','餐厅','主卧','书房','卧室','老人房','儿童房','玄关','厨房','卫生间','过道','阳台','衣帽间','卧室卫生间','茶室'],
  brands: [] as string[],
  priceStandard: '最低总价',
});
const spaceOptions = ['客厅','餐厅','主卧','书房','卧室','老人房','儿童房','玄关','厨房','卫生间','过道','阳台','衣帽间','卧室卫生间','茶室'];
const platformOptions = ['米家','Aqara','HomeKit','涂鸦智能','华为鸿蒙智联','天猫精灵','小度','三翼鸟','美的美居','欧瑞博','摩根','杜亚','UIOT超级智慧家'];
const sceneOptions = ['智能灯控', '客厅智能调光', '卧室窗帘', '客厅窗帘', '智能门锁', '安防摄像头', '中央空调', '燃气监测', '烟感监测', '水浸监测'];
const priceStandards = ['最低总价', '最高总价', '随机组合'];
const roomFields = [
  { key: 'living', label: '客厅' }, { key: 'dining', label: '餐厅' }, { key: 'bedroom', label: '卧室' },
  { key: 'bathroom', label: '卫生间' }, { key: 'kitchen', label: '厨房' }, { key: 'balcony', label: '阳台' },
] as const;
const versions = ref<any[]>([]), packages = ref<any[]>([]), attachments = ref<any[]>([]), capabilities = ref<any[]>([]), floorplanAssists = ref<any[]>([]);
const store = ref<any>({}), users = ref<any[]>([]), roles = ref<any[]>([]);
const logoInput = ref<HTMLInputElement | null>(null), logoUploading = ref(false);
const settings = ref<any>({ serviceFees: [], defaultDevices: {}, constructionStages: [], constructionNotes: [], projectConfig: {} });
const deviceCategories = ref<any[]>([]), deviceProducts = ref<Record<string, any[]>>({});
const deviceSearch = ref(''), deviceLevel = ref<string | null>(null), devicePage = ref(1), devicePageSize = ref(30);
const logs = ref<any[]>([]), restorePreview = ref<any | null>(null), restorePayload = ref<any | null>(null);
const operationSummary = ref<any>({ lowStock:0, openPurchaseOrders:0, quoted:0, received:0, outstanding:0 });
const inventory = ref<any[]>([]), purchaseOrders = ref<any[]>([]), payments = ref<any[]>([]), inventorySearch = ref(''), lowOnly = ref(false);
const stockDrafts = ref<Record<string,{quantity:number;safetyStock:number}>>({});
const showInventoryForm = ref(false);
const inventoryForm = ref({ productId:'', quantity:0, safetyStock:2, reason:'门店库存盘点' });
const purchaseForm = ref({ id:'', supplier:'本地演示供应商', productId:'', quantity:1, note:'', status:'草稿' });
const paymentForm = ref({ id:'', projectId:'', quoteId:'', amount:0, method:'银行卡', note:'', paidAt:'' });
const userForm = ref({ name: '', account: '', phone: '', pin: '0000', roleId: 'ROLE-SALES', status: '启用' });
const editingUserId = ref('');
const roleForm = ref({ id: '', name: '', description: '', permissions: [] as string[] });
const templateForm = ref({ id: '', name: '', schemeType: '全屋智能', description: '', status: '启用', lines: [{ label: '基础照明', category: '灯光', formula: 'ceil(area/12)' }] });
const permissionLabels: Record<string, string> = {
  '*':'全部权限',
  'customer.read':'客户查看','customer.write':'客户编辑',
  'project.read':'项目查看','project.write':'项目编辑',
  'design.read':'方案查看','design.write':'方案编辑',
  'quote.read':'报价查看','quote.write':'报价编辑','quote.confirm':'报价确认','quote.void':'报价作废',
  'product.read':'产品查看','product.write':'产品编辑',
  'delivery.read':'交付查看','delivery.write':'交付编辑',
  'operations.read':'经营管理查看','operations.write':'经营管理编辑','payment.write':'收款登记',
  'store.read':'店铺查看','store.write':'店铺编辑',
  'settings.read':'设置查看','settings.write':'设置编辑',
};
const permissionLabel = (code: string) => permissionLabels[code] || code;
const permissionOptions = Object.entries(permissionLabels).map(([value, label]) => ({ label, value }));

const projectOptions = computed(() => props.projects.map(project => ({ label: `${project.name} · ${project.area}㎡`, value: project.id })));
const customerOptions = computed(() => customers.value.map(customer => ({ label: `${customer.name}${customer.phone ? ` · ${customer.phone}` : ''}`, value: customer.id })));
const roleOptions = computed(() => roles.value.map(role => ({ label: role.name, value: role.id })));
const canWriteStore = computed(() => (props.permissions || []).includes('*') || (props.permissions || []).includes('store.write'));
const roleUsage = computed<Record<string, number>>(() => users.value.reduce((map, user) => {
  const key = String(user.roleId || '');
  map[key] = (map[key] || 0) + 1;
  return map;
}, {} as Record<string, number>));
const staffSummary = computed(() => ({
  total: users.value.length,
  active: users.value.filter(user => user.status === '启用').length,
  disabled: users.value.filter(user => user.status !== '启用').length,
  admin: users.value.filter(user => user.roleId === 'ROLE-ADMIN').length,
}));
const storeTitle = computed(() => storeTab.value === 'staff' ? '员工账号' : storeTab.value === 'roles' ? '角色权限' : '门店资料');
const storeDescription = computed(() => storeTab.value === 'staff'
  ? '维护员工账号、角色与启用状态。'
  : storeTab.value === 'roles'
    ? '按业务职责划分角色权限，员工账号绑定角色后新登录会话生效。'
    : '维护门店名称、编码、联系方式与 LOGO。');
const settingsTitle = computed(() => ({
  pricing: '报价与费用',
  devices: '默认设备',
  journey: '项目阶段与任务',
  construction: '施工模板',
  backup: '数据备份',
  audit: '操作审计',
}[settingsTab.value]));
const settingsDescription = computed(() => ({
  pricing: '维护服务费、税率与报价有效期。',
  devices: '设置各设备分类的默认品牌与型号。',
  journey: '配置新项目自动生成的阶段、任务与负责角色。',
  construction: '维护施工阶段与施工图注意事项。',
  backup: '导出或恢复本机业务数据。',
  audit: '查看最近操作记录。',
}[settingsTab.value]));
const templateOptions = computed(() => templates.value.filter(item => item.status === '启用').map(item => ({ label: item.name, value: item.id })));
const quoteProjectOptions = computed(() => [{ label: '全部项目', value: '' }, ...props.projects.map(project => ({ label: `${project.name} · ${project.area}㎡`, value: project.id }))]);
const quoteStatusOptions = [{ label: '全部状态', value: '全部' }, { label: '草稿', value: '草稿' }, { label: '待确认', value: '待确认' }, { label: '已确认', value: '已确认' }, { label: '已作废', value: '已作废' }];
const associationQuoteOptions = computed(() => quotes.value.map(quote => ({ label: `${quote.quoteNo || quote.id} · ${quote.name} · ${quote.projectName || '独立报价'}`, value: quote.id })));
const filteredQuotes = computed(() => {
  const keyword = quoteSearch.value.trim().toLowerCase();
  return quotes.value.filter(quote => {
    const text = `${quote.name || ''} ${quote.projectName || ''} ${quote.mode || ''}`.toLowerCase();
    return (!keyword || text.includes(keyword)) && (quoteStatus.value === '全部' || quote.status === quoteStatus.value) && (!quoteProjectFilter.value || quote.projectId === quoteProjectFilter.value);
  });
});
const quotePage = ref(1), quotePageSize = ref(30);
const pagedQuotes = computed(() => filteredQuotes.value.slice((quotePage.value - 1) * quotePageSize.value, quotePage.value * quotePageSize.value));
function syncPaging(page: number, size: number, extra: Record<string, string | number | boolean | null | undefined> = {}) {
  updateRouteQuery({ page: page > 1 ? page : null, pageSize: size !== 30 ? size : null, ...extra });
}
function quoteQueryExtra() {
  return {
    q: quoteSearch.value || null,
    status: quoteStatus.value !== '全部' ? quoteStatus.value : null,
    project: quoteProjectFilter.value || null,
  };
}
watch([quoteSearch, quoteStatus, quoteProjectFilter], () => {
  quotePage.value = 1;
  syncPaging(quotePage.value, quotePageSize.value, quoteQueryExtra());
});
function changeQuotePage(page: number) { quotePage.value = page; syncPaging(page, quotePageSize.value, quoteQueryExtra()); }
function changeQuotePageSize(size: number) { quotePageSize.value = size; quotePage.value = 1; syncPaging(quotePage.value, size, quoteQueryExtra()); }
const templatePage = ref(1), templatePageSize = ref(30);
const pagedTemplates = computed(() => templates.value.slice((templatePage.value - 1) * templatePageSize.value, templatePage.value * templatePageSize.value));
function changeTemplatePage(page: number) { templatePage.value = page; syncPaging(page, templatePageSize.value); }
function changeTemplatePageSize(size: number) { templatePageSize.value = size; templatePage.value = 1; syncPaging(templatePage.value, size); }
const purchasePage = ref(1), paymentPage = ref(1), staffPage = ref(1), rolePage = ref(1), auditPage = ref(1);
const listPageSize = ref(30);
const pagedPurchases = computed(() => purchaseOrders.value.slice((purchasePage.value - 1) * listPageSize.value, purchasePage.value * listPageSize.value));
const pagedPayments = computed(() => payments.value.slice((paymentPage.value - 1) * listPageSize.value, paymentPage.value * listPageSize.value));
const pagedUsers = computed(() => users.value.slice((staffPage.value - 1) * listPageSize.value, staffPage.value * listPageSize.value));
const pagedRoles = computed(() => roles.value.slice((rolePage.value - 1) * listPageSize.value, rolePage.value * listPageSize.value));
const pagedLogs = computed(() => logs.value.slice((auditPage.value - 1) * listPageSize.value, auditPage.value * listPageSize.value));
const listPageRefs = { purchase: purchasePage, payment: paymentPage, staff: staffPage, role: rolePage, audit: auditPage };
function changeListPage(target: keyof typeof listPageRefs, page: number) { listPageRefs[target].value = page; syncPaging(page, listPageSize.value); }
function changeListPageSize(target: keyof typeof listPageRefs, size: number) { listPageSize.value = size; listPageRefs[target].value = 1; syncPaging(1, size); }
const inventoryPage = ref(1), inventoryPageSize = ref(30), inventoryTotal = ref(0), inventoryOptions = ref<any[]>([]);
const inventoryQueryExtra = () => ({ search: inventorySearch.value || null, low: lowOnly.value ? 1 : null });
const changeInventoryPage = (page: number) => { inventoryPage.value = page; syncPaging(page, inventoryPageSize.value, inventoryQueryExtra()); loadInventoryPage(); };
const changeInventoryPageSize = (size: number) => { inventoryPageSize.value = size; inventoryPage.value = 1; syncPaging(1, size, inventoryQueryExtra()); loadInventoryPage(); };
const selectedProject = computed(() => props.projects.find(project => project.id === selectedProjectId.value));
const quoteRoute = computed(() => props.routePath.split('?')[0].replace(/\/+$/, '') || '/quotes');
const isQuoteMethodPage = computed(() => props.mode === 'quotes' && quoteRoute.value === '/quotes/new');
const isQuickQuotePage = computed(() => props.mode === 'quotes' && quoteRoute.value === '/quotes/new/quick');
const isManualQuotePage = computed(() => props.mode === 'quotes' && quoteRoute.value === '/quotes/new/manual');
const isQuoteNewPage = computed(() => props.mode === 'quotes' && quoteRoute.value.startsWith('/quotes/new'));
const isTemplateNewPage = computed(() => props.mode === 'quotes' && quoteRoute.value === '/quotes/templates/new');
const quoteDetailRouteId = computed(() => {
  const match = /^\/quotes\/([^/]+)$/.exec(quoteRoute.value);
  return match && !['new','templates'].includes(match[1]) ? match[1] : '';
});
const quoteEditRouteId = computed(() => /^\/quotes\/([^/]+)\/edit$/.exec(quoteRoute.value)?.[1] || '');
const isQuoteDetailPage = computed(() => Boolean(quoteDetailRouteId.value));
const isQuoteEditPage = computed(() => Boolean(quoteEditRouteId.value));
const templateEditId = computed(() => new URLSearchParams(props.routePath.split('?')[1] || '').get('id') || '');
const quoteDraftProject = computed(() => props.projects.find(project => project.id === quoteDraft.value.projectId));
const operationTitle = computed(() => operationTab.value === 'purchase' ? '采购管理' : operationTab.value === 'payments' ? '收款记录' : '库存管理');
const quoteProductBrand = (product: any) => String(product?.brand || product?.manufacturer || product?.source || '通用 / 未标注品牌').trim();
const quoteBrandOptions = computed(() => [...new Set(quoteCatalog.value.map(quoteProductBrand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN')));
const manualEstimatedArea = computed(() => {
  const rooms = quoteDraft.value.rooms;
  return rooms.living * 24 + rooms.dining * 12 + rooms.bedroom * 16 + rooms.bathroom * 5 + rooms.kitchen * 8 + rooms.balcony * 6;
});
const manualPreview = computed(() => buildManualLines().slice(0, 8));
const manualPreviewTotal = computed(() => buildManualLines().reduce((sum, line) => sum + line.quantity * line.unitPrice * line.discount / 100, 0));
const quotePageTitle = computed(() => isTemplateNewPage.value ? (templateEditId.value ? '编辑报价模板' : '新建报价模板') : isQuoteMethodPage.value ? '选择报价方式' : isQuickQuotePage.value ? '快速报价' : isManualQuotePage.value ? '手动选品报价' : '报价中心');
const quoteTransitionTitle = computed(() => ({ submit:'提交确认', return:'退回修改', confirm:'确认报价', void:'作废报价' } as Record<string,string>)[quoteTransitionForm.value.action] || '状态操作');
function canQuoteAction(action: 'submit'|'return'|'confirm'|'void') {
  const permissions = props.permissions || [];
  if (permissions.includes('*')) return true;
  return permissions.includes(action === 'confirm' ? 'quote.confirm' : action === 'void' ? 'quote.void' : 'quote.write');
}
type QuoteActionKey = 'view'|'edit'|'associate'|'submit'|'confirm'|'return'|'copy'|'void';
type QuoteAction = { key: QuoteActionKey; label: string };
function quoteActions(quote: any, includeView = true): QuoteAction[] {
  if (!quote) return [];
  const actions: QuoteAction[] = includeView ? [{ key:'view', label:'查看' }] : [];
  if (quote.status === '草稿') {
    actions.push({ key:'edit', label:'编辑' });
    actions.push({ key:'associate', label:quote.projectId ? '调整关联' : '关联项目' });
    if (canQuoteAction('submit')) actions.push({ key:'submit', label:'提交确认' });
    actions.push({ key:'copy', label:'复制' });
    if (canQuoteAction('void')) actions.push({ key:'void', label:'作废' });
  } else if (quote.status === '待确认') {
    if (canQuoteAction('confirm')) actions.push({ key:'confirm', label:'确认' });
    if (canQuoteAction('return')) actions.push({ key:'return', label:'退回' });
    if (canQuoteAction('void')) actions.push({ key:'void', label:'作废' });
  } else if (quote.status === '已确认') {
    actions.push({ key:'copy', label:'复制新版本' });
    if (canQuoteAction('void')) actions.push({ key:'void', label:'作废' });
  }
  return actions;
}
function runQuoteAction(quote: any, action: QuoteActionKey) {
  if (action === 'view') return openQuotePage(quote.id);
  if (action === 'edit') return openQuoteEditPage(quote.id);
  if (action === 'associate') return openQuoteAssociation(quote);
  if (action === 'copy') return copyQuote(quote.id);
  return openQuoteTransition(quote, action);
}
const quoteStatusStages = ['草稿','待确认','已确认'];
const quoteStatusBadgeLabel = computed(() => {
  const status = quotePageRecord.value?.status;
  if (status === '已作废') return '终止 · 已作废';
  const index = status ? quoteStatusStages.indexOf(status) : -1;
  return index >= 0 ? `${index + 1} ${status}` : '—';
});
const quoteStatusBadgeType = computed<'default' | 'success' | 'warning' | 'error'>(() => {
  const status = quotePageRecord.value?.status;
  if (status === '已确认') return 'success';
  if (status === '待确认') return 'warning';
  if (status === '已作废') return 'error';
  return 'default';
});
const quoteStatusSteps = computed(() => {
  const quote = quotePageRecord.value;
  if (!quote) return [];
  const history = Array.isArray(quote.statusHistory) ? quote.statusHistory : [];
  const status = quote.status;
  const currentIndex = quoteStatusStages.indexOf(status);
  const steps: any[] = quoteStatusStages.map((stage, index) => {
    const event = [...history].reverse().find((item: any) => item.toStatus === stage);
    let state: 'done' | 'current' | 'pending' = 'pending';
    if (status === '已作废') state = event ? 'done' : 'pending';
    else if (index === currentIndex) state = 'current';
    else if (index < currentIndex) state = 'done';
    return { key: stage, label: stage, state, actor: event?.actor || '', at: event ? dateTime(event.createdAt) : '', note: event?.reason || '' };
  });
  if (status === '已作废') {
    const event = [...history].reverse().find((item: any) => item.toStatus === '已作废');
    steps.push({ key: 'void', label: '已作废', state: 'void', terminal: true, actor: event?.actor || '', at: event ? dateTime(event.createdAt) : '', note: event?.reason || '' });
  }
  return steps;
});
const inventoryProductOptions = computed(() => inventoryOptions.value.slice(0, 100).map(item => ({ label:`${item.name} · 库存 ${item.quantity}`, value:item.id })));
const projectQuoteOptions = computed(() => quotes.value.filter(item => item.projectId === paymentForm.value.projectId).map(item => ({ label:`${item.name} · ${money(item.total)}`, value:item.id })));
const projectQuery = computed(() => {
  const query = props.routePath.split('?')[1] || '';
  return new URLSearchParams(query).get('project') || '';
});
const money = (value: number) => `¥${Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateTime = (value: string) => value ? new Date(value).toLocaleString('zh-CN') : '—';

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = options?.body == null ? {} : { 'content-type': 'application/json' };
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options?.headers as Record<string, string> || {}) } });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    sessionStorage.removeItem('qone-admin-session');
    window.dispatchEvent(new Event('qone-auth-expired'));
  }
  if (!response.ok) throw new Error(body.error || body.message || `请求失败 ${response.status}`);
  return body;
}
function notify(text: string) { message.value = text; emit('notice', text); window.setTimeout(() => { if (message.value === text) message.value = ''; }, 2600); }

async function loadQuotes() {
  const [quoteData, templateData] = await Promise.all([
    api<{quotes:any[]}>(`/api/admin/quotes${quoteProjectFilter.value ? `?projectId=${encodeURIComponent(quoteProjectFilter.value)}` : ''}`),
    api<{templates:any[]}>('/api/admin/quote-templates'),
  ]);
  quotes.value = quoteData.quotes; templates.value = templateData.templates;
  if (!selectedTemplateId.value) selectedTemplateId.value = templates.value.find(item => item.schemeType === selectedProject.value?.schemeType)?.id || templates.value[0]?.id || '';
}
async function loadQuoteReferences() {
  const [customerData, productData] = await Promise.all([
    api<{ customers:any[] }>('/api/admin/customers'),
    api<{ products:any[] }>('/api/admin/products?page=1&pageSize=100&status=在售'),
  ]);
  customers.value = customerData.customers || [];
  quoteCatalog.value = (productData.products || []).filter(product => product.price !== null && product.status === '在售');
  if (projectQuery.value) {
    const project = props.projects.find(item => item.id === projectQuery.value);
    quoteDraft.value.projectId = project?.id || projectQuery.value;
    quoteDraft.value.customerId = project?.customerId || '';
    quoteDraft.value.area = project?.area || 120;
    quoteDraft.value.schemeType = project?.schemeType || '全屋智能';
  }
  quoteDraft.value.templateId ||= templates.value.find(item => item.status === '启用')?.id || '';
  if (templateEditId.value) {
    const template = templates.value.find(item => item.id === templateEditId.value);
    if (template) templateForm.value = { id: template.id, name: template.name, schemeType: template.schemeType, description: template.description || '', status: template.status, lines: template.lines.map((line:any) => ({ ...line })) };
  }
}
async function loadDesigns() {
  const capabilityData = await api<{capabilities:any[]}>('/api/admin/capabilities');
  capabilities.value = capabilityData.capabilities;
  if (!selectedProjectId.value) { versions.value = []; packages.value = []; attachments.value = []; return; }
  const [v, p, a] = await Promise.all([
    api<{versions:any[]}>(`/api/admin/projects/${encodeURIComponent(selectedProjectId.value)}/design-versions`),
    api<{packages:any[]}>(`/api/admin/delivery-packages?projectId=${encodeURIComponent(selectedProjectId.value)}`),
    api<{attachments:any[]}>(`/api/admin/projects/${encodeURIComponent(selectedProjectId.value)}/attachments`),
  ]);
  versions.value = v.versions; packages.value = p.packages; attachments.value = a.attachments;
  floorplanAssists.value = (await api<{assists:any[]}>(`/api/admin/projects/${encodeURIComponent(selectedProjectId.value)}/floorplan-assists`)).assists;
}
async function loadInventoryPage() {
  const params = new URLSearchParams({
    search: inventorySearch.value,
    lowOnly: String(lowOnly.value),
    page: String(inventoryPage.value),
    pageSize: String(inventoryPageSize.value),
  });
  const data = await api<{ inventory: any[]; total: number }>(`/api/admin/inventory?${params}`);
  inventory.value = data.inventory || [];
  inventoryTotal.value = data.total || 0;
  stockDrafts.value = Object.fromEntries(inventory.value.map(item => [item.id, { quantity: item.quantity, safetyStock: item.safetyStock }]));
}
async function loadInventoryOptions() {
  const data = await api<{ inventory: any[] }>('/api/admin/inventory?page=1&pageSize=100');
  inventoryOptions.value = data.inventory || [];
  if (!purchaseForm.value.productId) purchaseForm.value.productId = inventoryOptions.value[0]?.id || '';
}
async function loadOperations() {
  const [summaryData, purchaseData, paymentData, quoteData] = await Promise.all([
    api<any>('/api/admin/operations/summary'), api<{purchaseOrders:any[]}>('/api/admin/purchase-orders'), api<{payments:any[]}>('/api/admin/payments'), api<{quotes:any[]}>('/api/admin/quotes'),
  ]);
  operationSummary.value=summaryData; purchaseOrders.value=purchaseData.purchaseOrders; payments.value=paymentData.payments; quotes.value=quoteData.quotes;
  await Promise.all([loadInventoryPage(), loadInventoryOptions()]);
  if (!paymentForm.value.projectId) paymentForm.value.projectId=props.projects[0]?.id || '';
}
function queryInventory() {
  inventoryPage.value = 1;
  loadOperations();
}
async function loadStore() {
  const [profile, userData, roleData] = await Promise.all([api<any>('/api/admin/store'), api<{users:any[]}>('/api/admin/users'), api<{roles:any[]}>('/api/admin/roles')]);
  store.value = profile; users.value = userData.users; roles.value = roleData.roles;
}
const deviceLevels = computed(() => [...new Set(deviceCategories.value.map(category => category.category1))]);
const filteredDeviceRows = computed(() => {
  const keyword = deviceSearch.value.trim().toLowerCase();
  return deviceCategories.value.filter(category =>
    (!deviceLevel.value || category.category1 === deviceLevel.value) &&
    (!keyword || [category.category1, category.label, category.itemCode, category.ruleId].join(' ').toLowerCase().includes(keyword)));
});
const pagedDeviceRows = computed(() => filteredDeviceRows.value.slice((devicePage.value - 1) * devicePageSize.value, devicePage.value * devicePageSize.value));
const deviceLevelOptions = computed(() => deviceLevels.value.map(value => ({ label: value, value })));
const configuredDeviceCount = computed(() => Object.values(settings.value.defaultDeviceModels || {}).filter((value: any) => value?.productId || value?.brand || value?.model).length);
function defaultDevice(categoryId: string) {
  return settings.value.defaultDeviceModels?.[categoryId] || { productId: '', brand: '', model: '' };
}
function setDefaultBrand(categoryId: string, brand: string) {
  const current = defaultDevice(categoryId);
  const keepModel = current.brand === brand;
  settings.value.defaultDeviceModels = {
    ...(settings.value.defaultDeviceModels || {}),
    [categoryId]: { productId: keepModel ? current.productId : '', brand: brand || '', model: keepModel ? current.model : '' },
  };
}
function setDefaultModel(categoryId: string, productId: string) {
  const current = defaultDevice(categoryId);
  const product = (deviceProducts.value[categoryId] || []).find(item => item.id === productId);
  settings.value.defaultDeviceModels = {
    ...(settings.value.defaultDeviceModels || {}),
    [categoryId]: { productId: productId || '', brand: product?.brand || (productId ? current.brand : ''), model: product?.model || product?.name || '' },
  };
}
function deviceBrandOptions(categoryId: string) {
  const brands = [...new Set((deviceProducts.value[categoryId] || []).map(item => item.brand).filter(Boolean))];
  return [{ label: '自动：同分类在售优先', value: '' }, ...brands.map(value => ({ label: value, value }))];
}
function deviceModelOptions(categoryId: string) {
  const brand = defaultDevice(categoryId).brand;
  const products = (deviceProducts.value[categoryId] || []).filter(item => !brand || item.brand === brand);
  return [
    { label: '自动选择型号', value: '' },
    ...products.map(item => ({ label: `${item.model || item.name} · ${item.status}${item.canPrice && item.price != null ? ` · ¥${item.price}` : ''}`, value: item.id })),
  ];
}
const deviceQueryExtra = () => ({ search: deviceSearch.value || null, level: deviceLevel.value || null });
function changeDevicePage(value: number) { devicePage.value = value; syncPaging(value, devicePageSize.value, deviceQueryExtra()); }
function changeDevicePageSize(value: number) { devicePageSize.value = value; devicePage.value = 1; syncPaging(1, value, deviceQueryExtra()); }
async function loadSettings() {
  const [settingData, logData, deviceData] = await Promise.all([api<any>('/api/admin/settings'), api<{logs:any[]}>('/api/admin/audit-logs?limit=80'), api<any>('/api/admin/settings/default-devices-options')]);
  settings.value = settingData; logs.value = logData.logs;
  settings.value.defaultDeviceModels ||= {};
  deviceCategories.value = deviceData.categories || [];
  deviceProducts.value = deviceData.productsByCategory || {};
}
function applyRoutePaging() {
  const query = readRouteQuery(props.routePath);
  const page = queryPage(query.get('page'));
  const size = queryPageSize(query.get('pageSize'));
  if (props.mode === 'quotes') {
    quoteSearch.value = query.get('q') || '';
    quoteStatus.value = query.get('status') || '全部';
    quoteProjectFilter.value = query.get('project') || '';
    quotePage.value = page;
    quotePageSize.value = size;
    templatePage.value = page;
    templatePageSize.value = size;
  } else if (props.mode === 'operations') {
    inventorySearch.value = query.get('search') || '';
    lowOnly.value = query.get('low') === '1';
    inventoryPage.value = page;
    inventoryPageSize.value = size;
    purchasePage.value = page;
    paymentPage.value = page;
  } else if (props.mode === 'store') {
    staffPage.value = page;
    rolePage.value = page;
  } else if (props.mode === 'settings') {
    deviceSearch.value = query.get('search') || '';
    deviceLevel.value = query.get('level') || null;
    devicePage.value = page;
    devicePageSize.value = size;
    auditPage.value = page;
  }
}
async function load() {
  applyRoutePaging();
  busy.value = true;
  try {
    if (props.projectId) selectedProjectId.value = props.projectId;
    else if (projectQuery.value) selectedProjectId.value = projectQuery.value;
    if (props.mode === 'quotes' && projectQuery.value) quoteProjectFilter.value = projectQuery.value;
    if (props.mode === 'quotes') {
      quoteMode.value = quoteRoute.value === '/quotes/new/manual' ? 'manual' : 'quick';
      quoteTab.value = quoteRoute.value.startsWith('/quotes/templates') ? 'templates' : 'list';
    }
    if (!selectedProjectId.value && props.projects.length && props.mode !== 'quotes') selectedProjectId.value = props.projects[0].id;
    if (props.mode === 'quotes') {
      await loadQuotes();
      await loadQuoteReferences();
      if (isQuoteDetailPage.value || isQuoteEditPage.value) await loadQuotePageRecord();
    }
    if (props.mode === 'designs') await loadDesigns();
    if (props.mode === 'operations') {
      const segment = quoteRoute.value.split('/')[2];
      operationTab.value = segment === 'purchase' ? 'purchase' : segment === 'payments' ? 'payments' : 'inventory';
      await loadOperations();
    }
    if (props.mode === 'store') {
      const segment = quoteRoute.value.split('/')[2];
      storeTab.value = segment === 'staff' ? 'staff' : segment === 'roles' ? 'roles' : 'profile';
      await loadStore();
    }
    if (props.mode === 'settings') {
      const segment = quoteRoute.value.split('/')[2];
      settingsTab.value = segment === 'project-journey' ? 'journey' : ['pricing', 'devices', 'journey', 'construction', 'backup', 'audit'].includes(segment)
        ? segment as 'pricing' | 'devices' | 'journey' | 'construction' | 'backup' | 'audit'
        : 'pricing';
      await loadSettings();
    }
  } catch (error) { message.value = error instanceof Error ? error.message : '数据加载失败'; }
  finally { busy.value = false; }
}

function goQuotePage(path: string) { window.location.hash = path; }
function crumbGo(path: string) { window.location.hash = path; }
function openSelectedDesign() { if (selectedProjectId.value) window.location.href = `/app/?project=${selectedProjectId.value}&restore=1`; }

function quotePayloadBase(mode: '快速报价' | '手动选品报价') {
  return {
    projectId: quoteDraft.value.projectId || '',
    customerId: quoteDraft.value.customerId || '',
    name: quoteDraft.value.name.trim(),
    mode,
    templateId: quoteDraft.value.templateId,
    schemeType: quoteDraft.value.schemeType,
    area: quoteDraft.value.area,
    overallDiscount: quoteDraft.value.overallDiscount,
  };
}

async function createQuickQuote() {
  if (!quoteDraft.value.templateId) return notify('请选择报价模板');
  if (!quoteDraft.value.spaces.length) return notify('请选择需要报价的空间');
  busy.value = true;
  try {
    const quote = await api<any>('/api/admin/quotes', {
      method: 'POST',
      body: JSON.stringify({
        ...quotePayloadBase('快速报价'),
        context: { quoteType: '模板规则快速匹配', spaces: quoteDraft.value.spaces, platform: quoteDraft.value.platforms, scenes: quoteDraft.value.scenes, rooms: quoteDraft.value.rooms },
        explanation: '快速报价按所选模板的数量规则和本地在售产品生成，数量、匹配依据与价格快照可回放。',
      }),
    });
    await loadQuotes(); emit('changed');
    notify(`快速报价已生成 ${quote.quoteNo || quote.id}`);
    goQuotePage(`/quotes/${encodeURIComponent(quote.id)}`);
  } catch (error) { message.value = error instanceof Error ? error.message : '快速报价生成失败'; }
  finally { busy.value = false; }
}

function quoteCandidates(keywords: string[]) {
  const brandPool = new Set(quoteDraft.value.brands);
  const all = quoteCatalog.value.filter(product => keywords.some(keyword => `${product.name} ${product.category}`.includes(keyword)));
  const branded = brandPool.size ? all.filter(product => brandPool.has(quoteProductBrand(product))) : [];
  return branded.length ? branded : all;
}

function pickQuoteProduct(keywords: string[], sequence: number) {
  const candidates = quoteCandidates(keywords);
  if (!candidates.length) return null;
  const ordered = [...candidates].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  if (quoteDraft.value.priceStandard === '最高总价') return ordered[ordered.length - 1];
  if (quoteDraft.value.priceStandard === '随机组合') return ordered[sequence % ordered.length];
  return ordered[0];
}

function plannedLine(label: string, keywords: string[], quantity: number, reason: string, sequence: number, space = '按房间配置'): QuoteLine {
  const product = pickQuoteProduct(keywords, sequence);
  return {
    productId: product?.id || '',
    sku: product?.sku || 'PENDING',
    name: product?.name || `${label}（待选产品）`,
    category: product?.category || label,
    brand: product?.brand || '',
    model: product?.model || '',
    quantity: Math.max(1, Math.ceil(quantity)),
    unit: product?.salesUnit || '件',
    unitPrice: Number(product?.price || 0),
    discount: 100,
    source: '手动选品报价 / 场景规划',
    status: product ? '已匹配' : '待选产品',
    space,
    reason: `${reason}；${product ? `按“${quoteDraft.value.priceStandard}”匹配本地产品 ${product.name}` : '本地库未匹配到符合品牌与场景条件的产品'}`,
  };
}

function buildManualLines(): QuoteLine[] {
  const rooms = quoteDraft.value.rooms;
  const area = Math.max(1, quoteDraft.value.area || manualEstimatedArea.value);
  const scenes = new Set(quoteDraft.value.scenes);
  const lines: QuoteLine[] = [];
  let sequence = 0;
  const push = (label: string, keywords: string[], quantity: number, reason: string, space = '按房间配置') => lines.push(plannedLine(label, keywords, quantity, reason, sequence++, space));
  if (scenes.has('智能灯控') || !scenes.size) {
    push('基础照明', ['筒灯', '射灯', '智能照明', '磁吸泛光'], Math.ceil(area / 12), `按报价面积 ${area}㎡ 和基础照明密度估算`);
    push('智能控制面板', ['智能电工', '开关', '面板', '控制'], Math.ceil(area / 25), '按键面板覆盖主要空间与场景控制');
  }
  if (scenes.has('客厅智能调光')) push('客厅调光模块', ['调光', '智能照明', '灯具'], rooms.living || 1, '客厅调光场景需要可调光驱动或模块', '客厅');
  if (scenes.has('卧室窗帘')) push('卧室窗帘电机', ['窗帘', '电机', '遮阳'], rooms.bedroom, '每个卧室配置一套电动窗帘', '卧室');
  if (scenes.has('客厅窗帘')) push('客厅窗帘电机', ['窗帘', '电机', '遮阳'], rooms.living, '客厅窗帘纳入场景联动', '客厅');
  if (scenes.has('智能门锁')) push('智能门锁', ['门锁', '锁'], 1, '入户门配置智能门锁', '玄关');
  if (scenes.has('安防摄像头')) push('安防摄像头', ['摄像', '监控', '安防'], Math.max(2, Math.ceil((rooms.living + rooms.bedroom) / 2)), '公共区与主要房间配置可视化安防', '公共区');
  if (scenes.has('中央空调')) push('中央空调控制', ['空调', '暖通', 'VRF'], Math.max(1, Math.ceil((rooms.living + rooms.bedroom) / 3)), '按主要空间配置空调控制', '全屋');
  if (scenes.has('燃气监测')) push('燃气监测', ['燃气', '气体'], 1, '厨房配置燃气安全监测', '厨房');
  if (scenes.has('烟感监测')) push('烟感监测', ['烟感', '烟雾'], Math.max(1, rooms.bedroom + rooms.kitchen), '卧室与厨房配置烟感', '卧室 / 厨房');
  if (scenes.has('水浸监测')) push('水浸监测', ['水浸', '漏水'], Math.max(1, rooms.bathroom + rooms.kitchen), '卫生间与厨房配置水浸监测', '卫生间 / 厨房');
  push('全屋网络基础包', ['网络', '路由', 'AP', '交换机', '网关'], Math.max(3, 1 + Math.ceil(area / 100) * 2), '报价默认包含路由、交换机与无线覆盖基础包', '全屋');
  return lines;
}

async function createManualQuote() {
  const items = buildManualLines();
  if (!items.length) return notify('请至少选择一个智能化场景');
  busy.value = true;
  try {
    const quote = await api<any>('/api/admin/quotes', {
      method: 'POST',
      body: JSON.stringify({
        ...quotePayloadBase('手动选品报价'),
        items,
        priceStandard: quoteDraft.value.priceStandard,
        context: {
          rooms: quoteDraft.value.rooms,
          platforms: quoteDraft.value.platforms,
          scenes: quoteDraft.value.scenes,
          brands: quoteDraft.value.brands,
          priceStandard: quoteDraft.value.priceStandard,
          estimatedArea: quoteDraft.value.area || manualEstimatedArea.value,
        },
        explanation: `根据 ${Object.values(quoteDraft.value.rooms).reduce((sum, value) => sum + Number(value || 0), 0)} 个空间、${quoteDraft.value.scenes.length} 个智能场景和“${quoteDraft.value.priceStandard}”生成；品牌筛选为 ${quoteDraft.value.brands.length ? quoteDraft.value.brands.join('、') : '不限'}。`,
      }),
    });
    await loadQuotes(); emit('changed');
    notify(`手动选品报价已生成 ${quote.quoteNo || quote.id}`);
    goQuotePage(`/quotes/${encodeURIComponent(quote.id)}`);
  } catch (error) { message.value = error instanceof Error ? error.message : '手动选品报价生成失败'; }
  finally { busy.value = false; }
}

function toggleQuoteValue(target: 'platforms' | 'scenes' | 'brands', value: string) {
  const list = quoteDraft.value[target] as string[];
  const index = list.indexOf(value);
  if (index >= 0) list.splice(index, 1); else list.push(value);
}
function toggleAllScenes(checked: boolean) { quoteDraft.value.scenes = checked ? [...sceneOptions] : []; }
function toggleAllSpaces(checked: boolean) { quoteDraft.value.spaces = checked ? [...spaceOptions] : []; }
function toggleAllBrands(checked: boolean) { quoteDraft.value.brands = checked ? [...quoteBrandOptions.value] : []; }
function selectPlatform(platform: string) { quoteDraft.value.platforms = [platform]; }

function openQuoteBuilder(mode: 'quick'|'manual'|'smart' = 'quick') {
  const normalized = mode === 'manual' ? 'manual' : 'quick';
  quoteMode.value = normalized;
  goQuotePage(mode === 'smart' ? '/quotes/new' : normalized === 'manual' ? '/quotes/new/manual' : '/quotes/new/quick');
}

function openTemplateEditor(template?: any) {
  templateForm.value = template
    ? { id: template.id, name: template.name, schemeType: template.schemeType, description: template.description || '', status: template.status || '启用', lines: template.lines.map((line:any) => ({ ...line })) }
    : { id: '', name: '', schemeType: '全屋智能', description: '', status: '启用', lines: [{ label: '基础照明', category: '灯光', formula: 'ceil(area/12)' }] };
  goQuotePage(template ? `/quotes/templates/new?id=${encodeURIComponent(template.id)}` : '/quotes/templates/new');
}

function openQuoteAssociation(quote: any) {
  quoteAssociationForm.value = { quoteId: quote.id, projectId: quote.projectId || '', customerId: quote.customerId || '' };
  showQuoteAssociation.value = true;
}
async function saveQuoteAssociation() {
  try {
    const updated = await api<any>(`/api/admin/quotes/${encodeURIComponent(quoteAssociationForm.value.quoteId)}`, { method: 'PUT', body: JSON.stringify(quoteAssociationForm.value) });
    showQuoteAssociation.value = false;
    if (isQuoteDetailPage.value && quotePageRecord.value?.id === updated.id) quotePageRecord.value = updated;
    await loadQuotes();
    emit('changed');
    notify(updated.projectName ? `报价已关联项目 ${updated.projectName}` : '报价关联信息已更新');
  } catch (error) { message.value = error instanceof Error ? error.message : '报价关联失败'; }
}
function openQuoteTransition(quote: any, action: 'submit'|'return'|'confirm'|'void') {
  quoteTransitionForm.value = { quoteId:quote.id, action, expectedStatus:quote.status, reason:'' };
  showQuoteTransition.value = true;
}
async function submitQuoteTransition() {
  const form = quoteTransitionForm.value;
  try {
    const updated = await api<any>(`/api/admin/quotes/${encodeURIComponent(form.quoteId)}/transition`, {
      method:'POST',
      body: JSON.stringify({ action:form.action, expectedStatus:form.expectedStatus, reason:form.reason }),
    });
    showQuoteTransition.value = false;
    if (quotePageRecord.value?.id === updated.id) quotePageRecord.value = updated;
    await loadQuotes();
    emit('changed');
    notify(`报价状态已更新为“${updated.status}”`);
  } catch (error) { message.value = error instanceof Error ? error.message : '报价状态更新失败'; }
}
function closeQuoteBuilder() { showQuoteBuilder.value = false; }
async function searchProducts() { /* Replaced by the full quote planning page. */ }
function addManualProduct(_product?: any) { /* Replaced by scenario-driven planning. */ }
function removeManualLine(_index?: number) { /* Replaced by scenario-driven planning. */ }
async function generateQuote(_mode?: string) { /* Replaced by quick and manual page actions. */ }
async function openQuote(id: string) { quoteDetail.value = await api(`/api/admin/quotes/${encodeURIComponent(id)}`); }
async function loadQuotePageRecord() {
  const id = quoteDetailRouteId.value || quoteEditRouteId.value;
  if (!id) { quotePageRecord.value = null; return; }
  quotePageRecord.value = await api(`/api/admin/quotes/${encodeURIComponent(id)}`);
  if (isQuoteEditPage.value) {
    const quote = quotePageRecord.value;
    quoteEditForm.value = {
      name: quote.name,
      projectId: quote.projectId || '',
      customerId: quote.customerId || '',
      overallDiscount: Number(quote.discount ?? 100),
      items: (quote.payload.items || []).map((item:any) => ({ ...item })),
    };
  }
}
function openQuotePage(id: string) { goQuotePage(`/quotes/${encodeURIComponent(id)}`); }
function openQuoteEditPage(id: string) { goQuotePage(`/quotes/${encodeURIComponent(id)}/edit`); }
async function saveQuoteDraft() {
  const id = quoteEditRouteId.value;
  if (!id) return;
  try {
    const updated = await api<any>(`/api/admin/quotes/${encodeURIComponent(id)}/draft`, { method:'PUT', body: JSON.stringify(quoteEditForm.value) });
    quotePageRecord.value = updated;
    await loadQuotes();
    emit('changed');
    notify('报价草稿已保存');
    goQuotePage(`/quotes/${encodeURIComponent(id)}`);
  } catch (error) { message.value = error instanceof Error ? error.message : '报价草稿保存失败'; }
}
async function copyQuote(id: string) {
  try { const quote = await api<any>(`/api/admin/quotes/${encodeURIComponent(id)}/copy`, { method:'POST', body:'{}' }); await loadQuotes(); emit('changed'); notify(`已复制为报价 V${quote.versionNo}`); goQuotePage(`/quotes/${encodeURIComponent(quote.id)}`); }
  catch (error) { message.value = error instanceof Error ? error.message : '报价复制失败'; }
}
async function saveTemplate() {
  try {
    if (!templateForm.value.name.trim()) throw new Error('模板名称不能为空');
    if (!templateForm.value.lines.length) throw new Error('至少配置一条数量规则');
    if (templateForm.value.lines.some(line => !line.label.trim() || !line.category.trim() || !line.formula.trim())) throw new Error('每条规则都需要填写名称、分类和计算公式');
    const rows = templateForm.value.lines.map(line => ({ ...line, label: line.label.trim(), category: line.category.trim(), formula: line.formula.trim() }));
    const body = JSON.stringify({ name: templateForm.value.name.trim(), schemeType: templateForm.value.schemeType, description: templateForm.value.description, status: templateForm.value.status, lines: rows });
    if (templateForm.value.id) await api(`/api/admin/quote-templates/${encodeURIComponent(templateForm.value.id)}`, { method: 'PUT', body });
    else await api('/api/admin/quote-templates', { method: 'POST', body });
    await loadQuotes();
    emit('changed');
    notify(`报价模板已${templateForm.value.id ? '更新' : '创建'}`);
    goQuotePage('/quotes/templates');
  } catch (error) { message.value = error instanceof Error ? error.message : '模板保存失败'; }
}

async function createDelivery() {
  if (!selectedProjectId.value) return notify('请选择项目');
  busy.value = true;
  try { const item = await api<any>(`/api/admin/projects/${encodeURIComponent(selectedProjectId.value)}/delivery-packages`, { method: 'POST', body: '{}' }); await loadDesigns(); notify(`交付包已生成：${item.name}`); }
  catch (error) { message.value = error instanceof Error ? error.message : '交付包生成失败'; }
  finally { busy.value = false; }
}
async function uploadProjectAttachment(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]; if (!file || !selectedProjectId.value) return;
  await uploadProjectAttachmentFile(file);
  input.value='';
}
async function uploadProjectAttachmentFile(file: File) {
  if (!file || !selectedProjectId.value) return;
  if (file.size > 10 * 1024 * 1024) { message.value = '单个项目附件不能超过 10MB'; return; }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer()); let binary='';
    for (let offset=0;offset<bytes.length;offset+=32768) binary += String.fromCharCode(...bytes.subarray(offset,offset+32768));
    await api(`/api/admin/projects/${encodeURIComponent(selectedProjectId.value)}/attachments`, { method:'POST', body:JSON.stringify({ name:file.name, base64:btoa(binary), category:file.type.startsWith('image/')?'现场照片':'项目文件' }) });
    await loadDesigns(); notify('项目附件已保存到本机');
  } catch (error) { message.value = error instanceof Error ? error.message : '附件上传失败'; }
}
async function copyProject() {
  if (!selectedProjectId.value) return;
  try { const created = await api<any>(`/api/admin/projects/${encodeURIComponent(selectedProjectId.value)}/copy`, { method: 'POST', body: JSON.stringify({ copyDesign: true }) }); emit('changed'); notify(`已复制项目：${created.name}`); }
  catch (error) { message.value = error instanceof Error ? error.message : '项目复制失败'; }
}
async function saveStock(item: any) {
  const draft=stockDrafts.value[item.id]; if (!draft) return;
  try { await api(`/api/admin/inventory/${encodeURIComponent(item.id)}`,{method:'PUT',body:JSON.stringify({...draft,reason:'门店库存盘点'})}); await loadOperations(); notify(`已更新 ${item.name} 库存`); }
  catch(error) { message.value=error instanceof Error?error.message:'库存保存失败'; }
}
function openInventoryForm(item?: any) {
  inventoryForm.value = item
    ? { productId:item.id, quantity:Number(item.quantity || 0), safetyStock:Number(item.safetyStock ?? 2), reason:'门店库存盘点' }
    : { productId:inventory.value[0]?.id || '', quantity:0, safetyStock:2, reason:'新增库存盘点' };
  showInventoryForm.value = true;
}
async function saveInventoryForm() {
  if (!inventoryForm.value.productId) return notify('请选择产品');
  try {
    await api(`/api/admin/inventory/${encodeURIComponent(inventoryForm.value.productId)}`, { method:'PUT', body:JSON.stringify({ quantity:inventoryForm.value.quantity, safetyStock:inventoryForm.value.safetyStock, reason:inventoryForm.value.reason }) });
    showInventoryForm.value = false;
    await loadOperations();
    notify('库存盘点已保存');
  } catch(error) { message.value=error instanceof Error?error.message:'库存保存失败'; }
}
async function deleteInventory(item: any) {
  if (!(await confirmAction({ title: '清除库存盘点', message: `确认清除“${item.name}”的库存盘点记录？`, detail: '产品本身不会被删除，只会清除库存数量与安全库存记录。', confirmText: '确认清除' }))) return;
  try { await api(`/api/admin/inventory/${encodeURIComponent(item.id)}`, { method:'DELETE' }); await loadOperations(); notify('库存盘点记录已清除'); }
  catch(error) { message.value=error instanceof Error?error.message:'库存记录清除失败'; }
}
async function createPurchase() {
  if (!purchaseForm.value.productId) return notify('请选择采购产品');
  try { const editingId=purchaseForm.value.id; const url=editingId?`/api/admin/purchase-orders/${encodeURIComponent(editingId)}`:'/api/admin/purchase-orders'; await api(url,{method:editingId?'PUT':'POST',body:JSON.stringify({supplier:purchaseForm.value.supplier,note:purchaseForm.value.note,status:purchaseForm.value.status,items:[{productId:purchaseForm.value.productId,quantity:purchaseForm.value.quantity}]})}); showPurchaseForm.value=false; purchaseForm.value={id:'',supplier:'本地演示供应商',productId:'',quantity:1,note:'',status:'草稿'}; await loadOperations(); notify(editingId?'采购单已更新':'采购单已创建'); }
  catch(error) { message.value=error instanceof Error?error.message:'采购单创建失败'; }
}
function openPurchaseForm(order?: any) {
  const first = order?.items?.[0];
  purchaseForm.value = order
    ? { id:order.id, supplier:order.supplier, productId:first?.productId || '', quantity:first?.quantity || 1, note:order.note || '', status:order.status || '草稿' }
    : { id:'', supplier:'本地演示供应商', productId:inventoryOptions.value[0]?.id || '', quantity:1, note:'', status:'草稿' };
  showPurchaseForm.value = true;
}
async function deletePurchase(order: any) {
  if (!(await confirmAction({ title: '删除采购单', message: `确认删除采购单 ${order.id}？`, detail: '已入库采购单不能删除；删除后不可恢复。' }))) return;
  try { await api(`/api/admin/purchase-orders/${encodeURIComponent(order.id)}`, { method:'DELETE' }); await loadOperations(); notify('采购单已删除'); }
  catch(error) { message.value=error instanceof Error?error.message:'采购单删除失败'; }
}
async function receivePurchase(order: any) {
  try { await api(`/api/admin/purchase-orders/${encodeURIComponent(order.id)}`,{method:'PUT',body:JSON.stringify({...order,status:'已入库'})}); await loadOperations(); notify('采购单已入库，库存已同步增加'); }
  catch(error) { message.value=error instanceof Error?error.message:'采购入库失败'; }
}
async function createPayment() {
  try { const editingId=paymentForm.value.id; const url=editingId?`/api/admin/payments/${encodeURIComponent(editingId)}`:'/api/admin/payments'; await api(url,{method:editingId?'PUT':'POST',body:JSON.stringify(paymentForm.value)}); showPaymentForm.value=false; paymentForm.value={id:'',projectId:'',quoteId:'',amount:0,method:'银行卡',note:'',paidAt:''}; await loadOperations(); notify(editingId?'收款记录已更新':'收款记录已保存'); }
  catch(error) { message.value=error instanceof Error?error.message:'收款登记失败'; }
}
function openPaymentForm(payment?: any) {
  paymentForm.value = payment
    ? { id:payment.id, projectId:payment.projectId, quoteId:payment.quoteId || '', amount:payment.amount, method:payment.method, note:payment.note || '', paidAt:payment.paidAt || '' }
    : { id:'', projectId:props.projects[0]?.id || '', quoteId:'', amount:0, method:'银行卡', note:'', paidAt:new Date().toISOString().slice(0,10) };
  showPaymentForm.value = true;
}
async function deletePayment(payment: any) {
  if (!(await confirmAction({ title: '删除收款记录', message: `确认删除收款记录 ${payment.projectName || payment.projectId} 的 ${money(payment.amount)}？`, detail: '删除后项目收款合计会同步减少。' }))) return;
  try { await api(`/api/admin/payments/${encodeURIComponent(payment.id)}`, { method:'DELETE' }); await loadOperations(); notify('收款记录已删除'); }
  catch(error) { message.value=error instanceof Error?error.message:'收款记录删除失败'; }
}
async function assistFloorplan(event: Event) {
  const input=event.target as HTMLInputElement,file=input.files?.[0]; if (!file || !selectedProjectId.value) return;
  await assistFloorplanFile(file);
  input.value='';
}
async function assistFloorplanFile(file: File) {
  if (!file || !selectedProjectId.value) return;
  try {
    const size=await new Promise<{width:number;height:number}>(resolve => { if (!file.type.startsWith('image/')) return resolve({width:0,height:0}); const url=URL.createObjectURL(file),image=new Image(); image.onload=()=>{ const value={width:image.naturalWidth,height:image.naturalHeight}; URL.revokeObjectURL(url); resolve(value); }; image.onerror=()=>{URL.revokeObjectURL(url);resolve({width:0,height:0});}; image.src=url; });
    await api(`/api/admin/projects/${encodeURIComponent(selectedProjectId.value)}/floorplan-assists`,{method:'POST',body:JSON.stringify({fileName:file.name,imageWidth:size.width,imageHeight:size.height})});
    await loadDesigns(); notify('已生成离线候选空间，请进入工作台复核墙体、门窗和比例尺');
  } catch(error) { message.value=error instanceof Error?error.message:'户型辅助识别失败'; }
}

async function saveStore() {
  try { store.value = await api('/api/admin/store', { method: 'PUT', body: JSON.stringify(store.value) }); notify('门店资料已保存'); }
  catch (error) { message.value = error instanceof Error ? error.message : '门店资料保存失败'; }
}
function pickStoreLogo() { if (canWriteStore.value) logoInput.value?.click(); }
function readImageBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('读取图片失败，请重新选择'));
    reader.readAsDataURL(file);
  });
}
async function handleStoreLogoFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { message.value = '门店 LOGO 仅支持 PNG / JPG / WebP 图片'; return; }
  if (file.size > 2 * 1024 * 1024) { message.value = '门店 LOGO 图片需小于 2MB'; return; }
  logoUploading.value = true;
  try {
    const base64 = await readImageBase64(file);
    store.value = await api('/api/admin/store/logo', { method: 'POST', body: JSON.stringify({ name: file.name, base64 }) });
    notify('门店 LOGO 已更新，系统标识已同步');
    emit('changed');
  }
  catch (error) { message.value = error instanceof Error ? error.message : '门店 LOGO 上传失败'; }
  finally { logoUploading.value = false; }
}
async function removeStoreLogo() {
  if (!canWriteStore.value) return;
  if (!(await confirmAction({ title: '移除门店 LOGO', message: '确认移除当前门店 LOGO？', detail: '移除后登录页、后台侧栏和浏览器标签恢复默认图标；原图片文件保留在本机数据目录，不物理删除。', confirmText: '移除 LOGO' }))) return;
  try {
    store.value = await api('/api/admin/store/logo', { method: 'DELETE' });
    notify('门店 LOGO 已移除，系统标识恢复默认');
    emit('changed');
  }
  catch (error) { message.value = error instanceof Error ? error.message : '门店 LOGO 移除失败'; }
}
const emptyUserForm = () => ({ name: '', account: '', phone: '', pin: '0000', roleId: roles.value[0]?.id || 'ROLE-SALES', status: '启用' });
function openUserForm(user: any | null = null) {
  editingUserId.value = user?.id || '';
  userForm.value = user
    ? { name: user.name || '', account: user.account || '', phone: user.phone || '', pin: '', roleId: user.roleId || '', status: user.status || '启用' }
    : emptyUserForm();
  showUserForm.value = true;
}
function closeUserForm() { showUserForm.value = false; editingUserId.value = ''; userForm.value = emptyUserForm(); }
async function saveUser() {
  if (!userForm.value.name.trim() || !userForm.value.account.trim()) return notify('员工姓名和登录账号不能为空');
  if (!editingUserId.value && !/^\d{4}$/.test(userForm.value.pin)) return notify('新建员工必须设置 4 位数字 PIN');
  if (editingUserId.value && userForm.value.pin && !/^\d{4}$/.test(userForm.value.pin)) return notify('PIN 必须是 4 位数字');
  try {
    if (editingUserId.value) await api(`/api/admin/users/${encodeURIComponent(editingUserId.value)}`, { method: 'PUT', body: JSON.stringify(userForm.value) });
    else await api('/api/admin/users', { method: 'POST', body: JSON.stringify(userForm.value) });
    const edited = Boolean(editingUserId.value);
    closeUserForm();
    await loadStore();
    notify(edited ? '员工账号已更新' : '员工账号已创建，可使用设置的 PIN 登录');
  }
  catch (error) { message.value = error instanceof Error ? error.message : '员工保存失败'; }
}
async function deleteUser(user: any) {
  if (user.id === props.currentUserId) return notify('不能删除当前登录账号');
  if (!(await confirmAction({ title: '删除员工账号', message: `确认删除员工“${user.name}（${user.account}）”？`, detail: '删除后该账号无法登录；当前登录账号与最后一名门店管理员不可删除。' }))) return;
  try { await api(`/api/admin/users/${encodeURIComponent(user.id)}`, { method: 'DELETE' }); await loadStore(); notify('员工账号已删除'); }
  catch (error) { message.value = error instanceof Error ? error.message : '员工删除失败'; }
}
function openRoleForm(role: any | null = null) {
  if (role?.id === 'ROLE-ADMIN') return notify('门店管理员为系统内置角色，不可修改');
  roleForm.value = role
    ? { id: role.id, name: role.name || '', description: role.description || '', permissions: [...(role.permissions || [])] }
    : { id: '', name: '', description: '', permissions: ['project.read'] };
  showRoleForm.value = true;
}
async function saveRoleForm() {
  if (!roleForm.value.name.trim()) return notify('角色名称不能为空');
  if (!roleForm.value.permissions.length) return notify('角色至少需要一项权限');
  try {
    if (roleForm.value.id) await api(`/api/admin/roles/${encodeURIComponent(roleForm.value.id)}`, { method: 'PUT', body: JSON.stringify(roleForm.value) });
    else await api('/api/admin/roles', { method: 'POST', body: JSON.stringify(roleForm.value) });
    const roleName = roleForm.value.name;
    showRoleForm.value = false;
    await loadStore();
    notify(roleForm.value.id ? `角色“${roleName}”已更新` : `角色“${roleName}”已创建`);
  }
  catch (error) { message.value = error instanceof Error ? error.message : '角色保存失败'; }
}
async function deleteRole(role: any) {
  if (role.id === 'ROLE-ADMIN') return notify('门店管理员角色不能删除');
  const usage = roleUsage.value[role.id] || 0;
  if (usage > 0) return notify(`该角色仍被 ${usage} 个员工使用，不能删除`);
  if (!(await confirmAction({ title: '删除角色', message: `确认删除角色“${role.name}”？`, detail: '仍被员工使用的角色不能删除；系统内置门店管理员角色不可删除。' }))) return;
  try { await api(`/api/admin/roles/${encodeURIComponent(role.id)}`, { method: 'DELETE' }); await loadStore(); notify('角色已删除'); }
  catch (error) { message.value = error instanceof Error ? error.message : '角色删除失败'; }
}
async function toggleUser(user: any) {
  try { await api(`/api/admin/users/${encodeURIComponent(user.id)}`, { method: 'PUT', body: JSON.stringify({ ...user, roleId: user.roleId, status: user.status === '启用' ? '停用' : '启用' }) }); await loadStore(); notify('账号状态已更新'); }
  catch (error) { message.value = error instanceof Error ? error.message : '账号更新失败'; }
}

async function saveSettings() {
  try { settings.value = await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(settings.value) }); await loadSettings(); notify('配置已保存，新项目将使用最新模板'); }
  catch (error) { message.value = error instanceof Error ? error.message : '配置保存失败'; }
}
function addFee() { settings.value.serviceFees.push({ key: `fee-${Date.now()}`, name: '新增费用', mode: 'fixed', value: 0, enabled: true }); }
function addStage() { settings.value.constructionStages.push('新增施工阶段'); }
function addNote() { settings.value.constructionNotes.push('新增施工注意事项'); }
async function readBackupFile(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]; if (!file) return;
  try {
    restorePayload.value = file;
    const response = await fetch('/api/admin/restore/preview', { method:'POST', headers:{'content-type':'application/octet-stream'}, body:file });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || '备份校验失败');
    restorePreview.value = body;
    notify('备份校验通过，请核对数量后再恢复');
  } catch (error) { restorePayload.value = null; restorePreview.value = null; message.value = error instanceof Error ? error.message : '备份文件无法识别'; }
  input.value = '';
}
async function restoreBackup() {
  if (!restorePayload.value) return;
  if (!(await confirmAction({ title: '恢复并覆盖本机数据', message: '恢复会用备份内容替换当前本机业务数据，是否继续？', detail: `将覆盖：客户 ${restorePreview.value?.counts.customers ?? 0}、项目 ${restorePreview.value?.counts.projects ?? 0}、产品 ${restorePreview.value?.counts.products ?? 0}、报价 ${restorePreview.value?.counts.quotes ?? 0}。`, confirmText: '确认恢复并覆盖' }))) return;
  try {
    const response = await fetch('/api/admin/restore', { method:'POST', headers:{'content-type':'application/octet-stream'}, body:restorePayload.value });
    const body = await response.json(); if (!response.ok) throw new Error(body.error || '备份恢复失败');
    restorePayload.value = null; restorePreview.value = null; emit('changed'); await loadSettings(); notify('备份已恢复并完成数量回读');
  }
  catch (error) { message.value = error instanceof Error ? error.message : '备份恢复失败'; }
}

watch(() => [props.mode, props.routePath, props.projects.length, props.projectId], load);
watch([deviceSearch, deviceLevel], () => { devicePage.value = 1; syncPaging(1, devicePageSize.value, deviceQueryExtra()); });
watch(quoteProjectFilter, async () => { if (props.mode === 'quotes') await loadQuotes(); });
watch(() => props.routePath, () => {
  showQuoteAssociation.value = false;
  showQuoteTransition.value = false;
  showPurchaseForm.value = false;
  showPaymentForm.value = false;
  showUserForm.value = false;
  showRoleForm.value = false;
  showProjectConfigForm.value = false;
  quoteDetail.value = null;
});
watch(selectedProjectId, async () => { if (props.mode === 'designs') await loadDesigns(); });
watch(showTemplateForm, value => { if (value) { showTemplateForm.value = false; openTemplateEditor(); } });
watch(() => quoteDraft.value.projectId, projectId => {
  if (!projectId) return;
  const project = props.projects.find(item => item.id === projectId);
  if (!project) return;
  quoteDraft.value.customerId = project.customerId || '';
  quoteDraft.value.area = project.area;
  quoteDraft.value.schemeType = project.schemeType;
});
watch(() => quoteAssociationForm.value.projectId, projectId => {
  if (!projectId) return;
  const project = props.projects.find(item => item.id === projectId);
  if (project?.customerId) quoteAssociationForm.value.customerId = project.customerId;
});
onMounted(load);
</script>

<template>
  <div class="business-workspace" :class="{ 'design-page-active': mode === 'designs' }">
    <div v-if="message" class="module-message">{{ message }}</div>
    <DesignDeliveryWorkspace
      v-if="mode === 'designs'"
      :embedded="embedded"
      :project-id="selectedProjectId"
      :project="selectedProject"
      :versions="versions"
      :packages="packages"
      :attachments="attachments"
      :floorplan-assists="floorplanAssists"
      :busy="busy"
      @open-design="openSelectedDesign"
      @open-design-object="designId => emit('openDesignObject', designId)"
      @open-design-plans="emit('openDesignPlans', selectedProjectId)"
      @create-delivery="createDelivery"
      @copy-project="copyProject"
      @upload-attachment="uploadProjectAttachmentFile"
      @assist-floorplan="assistFloorplanFile"
    />

    <template v-if="mode === 'quotes' && (isQuoteNewPage || isTemplateNewPage || isQuoteDetailPage || isQuoteEditPage)">
      <template v-if="isQuoteMethodPage">
        <div class="admin-page-head quote-page-head">
          <div>
<div class="admin-breadcrumb"><button type="button" class="crumb-link" @click="crumbGo('/quotes')">报价中心</button> / <button type="button" class="crumb-link" @click="crumbGo('/quotes')">报价单列表</button> / <strong>新建报价单</strong></div>
            <h2>选择报价方式</h2>
            <p>先确定报价生成方式，进入对应表单后完成项目关联、房间场景和产品规划。</p>
          </div>
          <div class="admin-page-actions"><NButton @click="goQuotePage('/quotes')">← 返回报价单列表</NButton></div>
        </div>
        <div class="quote-method-page">
          <button class="panel quote-method-card" @click="goQuotePage('/quotes/new/quick')">
            <span class="quote-method-index">01</span>
            <div><span class="panel-kicker">QUICK QUOTE</span><h3>快速报价</h3><p>选择报价模板，按模板中的数量公式和计价面积快速生成整单报价。</p></div>
            <ul><li>适合已知面积与方案类型的首轮报价</li><li>自动匹配本地在售产品</li><li>金额、数量与匹配依据可追溯</li></ul>
            <b>进入快速报价 →</b>
          </button>
          <button class="panel quote-method-card" @click="goQuotePage('/quotes/new/manual')">
            <span class="quote-method-index">02</span>
            <div><span class="panel-kicker">MANUAL SELECTION</span><h3>手动选品报价</h3><p>按房间数量、智能平台、场景、品牌和总价标准规划设备，再生成报价单。</p></div>
            <ul><li>适合客户已明确场景与品牌要求</li><li>支持卧室、卫浴、阳台等空间数量</li><li>生成前可查看设备规划与预估金额</li></ul>
            <b>进入手动选品 →</b>
          </button>
        </div>
      </template>

      <template v-else-if="isQuickQuotePage || isManualQuotePage">
        <div class="admin-page-head quote-page-head">
          <div>
<div class="admin-breadcrumb"><button type="button" class="crumb-link" @click="crumbGo('/quotes')">报价中心</button> / <button type="button" class="crumb-link" @click="crumbGo('/quotes/new')">新建报价单</button> / <strong>{{ isQuickQuotePage ? '快速报价' : '手动选品报价' }}</strong></div>
            <h2>{{ isQuickQuotePage ? '快速报价' : '手动选品报价' }}</h2>
            <p>{{ isQuickQuotePage ? '选择报价模板，按模板数量规则生成整单报价。' : '按房间、平台、场景、品牌和总价标准规划产品并生成报价。' }}</p>
          </div>
          <div class="admin-page-actions"><NButton @click="goQuotePage('/quotes/new')">← 更换报价方式</NButton><NButton @click="goQuotePage('/quotes')">返回报价单列表</NButton></div>
        </div>

        <div v-if="isQuickQuotePage" class="quote-quick-page">
          <section class="panel quote-plan-sheet">
            <div class="quote-form-row">
              <div class="quote-row-label">报价单名称</div>
              <div class="quote-row-content"><NInput v-model:value="quoteDraft.name" class="quote-name-input" placeholder="选填，留空自动生成" /></div>
            </div>
            <div class="quote-form-row">
              <div class="quote-row-label">关联信息</div>
              <div class="quote-row-content quote-inline-fields">
                <NSelect v-model:value="quoteDraft.projectId" class="quote-project-select" :options="projectOptions" filterable clearable placeholder="关联项目（可留空）" />
                <NSelect v-model:value="quoteDraft.customerId" class="quote-customer-select" :options="customerOptions" filterable clearable placeholder="关联客户（可留空）" />
                <span class="quote-inline-hint">关联项目后自动带出客户、面积和方案类型</span>
              </div>
            </div>
            <div class="quote-form-row">
              <div class="quote-row-label">报价空间</div>
              <div class="quote-row-content">
                <div class="quote-check-grid quote-space-grid">
                  <label class="quote-check-option quote-check-all"><input type="checkbox" :checked="quoteDraft.spaces.length===spaceOptions.length" @change="toggleAllSpaces(($event.target as HTMLInputElement).checked)"><span>全选</span></label>
                  <label v-for="space in spaceOptions" :key="space" class="quote-check-option"><input v-model="quoteDraft.spaces" type="checkbox" :value="space"><span>{{ space }}</span></label>
                </div>
                <p class="quote-row-hint">已选 {{ quoteDraft.spaces.length }} 个空间，快速报价仅按所选空间生成方案口径。</p>
              </div>
            </div>
            <div class="quote-form-row">
              <div class="quote-row-label">报价规则</div>
              <div class="quote-row-content quote-inline-fields">
                <label class="quote-inline-field"><span>报价模板</span><NSelect v-model:value="quoteDraft.templateId" :options="templateOptions" placeholder="请选择报价模板" /></label>
                <label class="quote-inline-field"><span>方案类型</span><NSelect v-model:value="quoteDraft.schemeType" :options="['全屋智能','灯光智能化','网络与安防','影音娱乐'].map(value=>({label:value,value}))" /></label>
                <label class="quote-inline-field"><span>计价面积</span><NInputNumber v-model:value="quoteDraft.area" :min="1" button-placement="both" /><em>㎡</em></label>
                <label class="quote-inline-field"><span>整单折扣</span><NInputNumber v-model:value="quoteDraft.overallDiscount" :min="0" :max="100" button-placement="both" /><em>%</em></label>
              </div>
            </div>
            <div class="quote-form-row">
              <div class="quote-row-label">计算口径</div>
              <div class="quote-row-content"><div class="quote-info-note quote-info-note-inline"><b>按模板数量公式生成</b><span>读取所选模板的数量规则，以计价面积计算设备数量，再从本地在售产品中匹配。没有匹配产品的行会保留为“待选产品”，不会虚构价格。</span></div></div>
            </div>
          </section>
          <div class="page-submit-bar">
            <NButton @click="goQuotePage('/quotes')">取消</NButton>
            <NButton type="primary" :loading="busy" :disabled="!quoteDraft.templateId || !quoteDraft.spaces.length" @click="createQuickQuote">生成快速报价</NButton>
          </div>
        </div>

        <div v-else class="quote-manual-page">
          <section class="panel quote-plan-sheet">
            <div class="quote-form-row">
              <div class="quote-row-label">报价单名称</div>
              <div class="quote-row-content">
                <NInput v-model:value="quoteDraft.name" class="quote-name-input" placeholder="例如：王先生 · 全屋智能方案" />
              </div>
            </div>
            <div class="quote-form-row">
              <div class="quote-row-label">关联信息</div>
              <div class="quote-row-content quote-inline-fields">
                <NSelect v-model:value="quoteDraft.projectId" class="quote-project-select" :options="projectOptions" filterable clearable placeholder="关联项目（可留空）" />
                <NSelect v-model:value="quoteDraft.customerId" class="quote-customer-select" :options="customerOptions" filterable clearable placeholder="关联客户（可留空）" />
                <span class="quote-inline-hint">不关联也可以生成独立报价单号，后续再补充</span>
              </div>
            </div>
            <div class="quote-form-row">
              <div class="quote-row-label">房间情况</div>
              <div class="quote-row-content">
                <div class="quote-room-line">
                  <label v-for="room in roomFields" :key="room.key" class="quote-room-item">
                    <NInputNumber v-model:value="quoteDraft.rooms[room.key]" :min="0" :max="20" button-placement="both" />
                    <span>{{ room.label }}</span>
                  </label>
                </div>
                <p class="quote-row-hint">默认包含客厅、餐厅、厨房各 1 个；估算计价面积 {{ manualEstimatedArea }}㎡，生成前可继续调整。</p>
              </div>
            </div>
            <div class="quote-form-row">
              <div class="quote-row-label">智能平台</div>
              <div class="quote-row-content">
                <div class="quote-option-line">
                  <button v-for="platform in platformOptions" :key="platform" class="quote-option-chip" :class="{active:quoteDraft.platforms[0]===platform}" @click="selectPlatform(platform)">{{ platform }}</button>
                </div>
              </div>
            </div>
            <div class="quote-form-row">
              <div class="quote-row-label">智能化场景</div>
              <div class="quote-row-content">
                <div class="quote-check-grid quote-scene-grid-inline">
                  <label class="quote-check-option quote-check-all"><input type="checkbox" :checked="quoteDraft.scenes.length===sceneOptions.length" @change="toggleAllScenes(($event.target as HTMLInputElement).checked)"><span>全选</span></label>
                  <label v-for="scene in sceneOptions" :key="scene" class="quote-check-option"><input v-model="quoteDraft.scenes" type="checkbox" :value="scene"><span>{{ scene }}</span></label>
                </div>
                <p class="quote-row-hint">已选 {{ quoteDraft.scenes.length }} 项，用于决定报价中的设备类型与数量。</p>
              </div>
            </div>
            <div class="quote-form-row">
              <div class="quote-row-label">设备品牌要求</div>
              <div class="quote-row-content">
                <div class="quote-check-grid quote-brand-grid-inline">
                  <label class="quote-check-option quote-check-all"><input type="checkbox" :checked="quoteDraft.brands.length===quoteBrandOptions.length && quoteBrandOptions.length>0" @change="toggleAllBrands(($event.target as HTMLInputElement).checked)"><span>全选</span></label>
                  <label v-for="brand in quoteBrandOptions" :key="brand" class="quote-check-option"><input v-model="quoteDraft.brands" type="checkbox" :value="brand"><span>{{ brand }}</span></label>
                </div>
                <p v-if="!quoteBrandOptions.length" class="quote-row-hint">当前产品库没有可用于报价的品牌资料，将按全部本地产品匹配。</p>
                <p v-else class="quote-row-hint">不选代表不限品牌；已选品牌不满足时会保留待选产品行。</p>
              </div>
            </div>
            <div class="quote-form-row">
              <div class="quote-row-label">方案总价标准</div>
              <div class="quote-row-content">
                <div class="quote-option-line">
                  <button v-for="standard in priceStandards" :key="standard" class="quote-option-chip" :class="{active:quoteDraft.priceStandard===standard}" @click="quoteDraft.priceStandard=standard">{{ standard }}</button>
                </div>
                <div class="quote-inline-fields quote-price-meta">
                  <label><span>计价面积</span><NInputNumber v-model:value="quoteDraft.area" :min="1" /><em>㎡</em></label>
                  <label><span>整单折扣</span><NInputNumber v-model:value="quoteDraft.overallDiscount" :min="0" :max="100" /><em>%</em></label>
                </div>
              </div>
            </div>
            <div class="quote-form-row quote-preview-row-block">
              <div class="quote-row-label">报价预览</div>
              <div class="quote-row-content">
                <div class="quote-preview-summary"><span>共 {{ buildManualLines().length }} 行</span><strong>预估 {{ money(manualPreviewTotal) }}</strong></div>
                <div class="quote-preview-table-wrap">
                  <table class="quote-preview-table">
                    <thead><tr><th>规划设备</th><th>匹配依据</th><th>数量</th><th>金额</th></tr></thead>
                    <tbody>
                      <tr v-for="line in buildManualLines()" :key="line.name">
                        <td><strong>{{ line.name }}</strong><small>{{ line.space }}</small></td>
                        <td>{{ line.reason }}</td>
                        <td>{{ line.quantity }}{{ line.unit }}</td>
                        <td>{{ money(line.quantity * line.unitPrice * line.discount / 100) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p class="quote-row-hint">预览按当前场景、品牌和价格标准实时计算；生成后保存产品与价格快照。</p>
              </div>
            </div>
          </section>
          <div class="page-submit-bar">
            <NButton @click="goQuotePage('/quotes')">取消</NButton>
            <NButton type="primary" size="large" :loading="busy" :disabled="!quoteDraft.scenes.length" @click="createManualQuote">开始生成报价单</NButton>
          </div>
        </div>
      </template>

      <template v-else-if="isQuoteDetailPage">
        <div class="admin-page-head quote-page-head">
          <div>
<div class="admin-breadcrumb"><button type="button" class="crumb-link" @click="crumbGo('/quotes')">报价中心</button> / <button type="button" class="crumb-link" @click="crumbGo('/quotes')">报价单列表</button> / <strong>报价详情</strong></div>
            <h2>{{ quotePageRecord?.name || '报价详情' }}</h2>
            <p>{{ quotePageRecord?.quoteNo || quotePageRecord?.id }} · V{{ quotePageRecord?.versionNo }} · {{ quotePageRecord?.mode }} · {{ quotePageRecord?.status }}</p>
          </div>
          <div class="admin-page-actions">
            <NButton @click="goQuotePage('/quotes')">← 返回报价单列表</NButton>
            <NButton v-for="action in quoteActions(quotePageRecord, false)" :key="action.key" :type="action.key==='void'?'error':(['submit','confirm'].includes(action.key)?'primary':'default')" :secondary="action.key==='void'" @click="runQuoteAction(quotePageRecord, action.key)">{{ action.label }}</NButton>
          </div>
        </div>
        <div v-if="quotePageRecord" class="quote-detail-page">
          <section class="panel quote-detail-summary">
            <div class="quote-detail-meta"><span>关联项目</span><strong>{{ quotePageRecord.projectName || '未关联项目' }}</strong><small>{{ quotePageRecord.projectId || '独立报价' }}</small></div>
            <div class="quote-detail-meta"><span>关联客户</span><strong>{{ quotePageRecord.customerName || '未关联客户' }}</strong><small>{{ quotePageRecord.customerId || '可后续补充' }}</small></div>
            <div class="quote-detail-meta"><span>计价口径</span><strong>{{ quotePageRecord.payload?.pricingBasis==='design_snapshot'?'设计设备快照':quotePageRecord.payload?.pricingBasis==='manual_selection'?'手动选品规划':'模板规则报价' }}</strong><small>{{ quotePageRecord.payload?.items?.length || 0 }} 项产品</small></div>
            <div class="quote-detail-meta total"><span>报价合计</span><strong>{{ money(quotePageRecord.total) }}</strong><small>有效期至 {{ quotePageRecord.payload?.validUntil || '—' }}</small></div>
          </section>
          <section class="panel quote-status-panel">
            <AdminStatusHistory :steps="quoteStatusSteps" :badge="quoteStatusBadgeLabel" :badge-type="quoteStatusBadgeType" />
          </section>
          <section class="panel">
            <div class="panel-head"><div><span class="panel-kicker">QUOTE ITEMS</span><h3>报价明细</h3></div></div>
            <div class="quote-table-wrap"><table class="quote-detail-page-table"><thead><tr><th>产品</th><th>空间 / 来源</th><th>数量</th><th>单价</th><th>折扣</th><th>金额</th><th>状态</th></tr></thead><tbody>
              <tr v-for="item in quotePageRecord.payload?.items || []" :key="item.id"><td><strong>{{ item.name }}</strong><small>{{ item.sku }} · {{ item.category }}</small><em>{{ item.reason }}</em></td><td>{{ item.space || '按方案' }}<small>{{ item.source }}</small></td><td>{{ item.quantity }}{{ item.unit }}</td><td>{{ money(item.unitPrice) }}</td><td>{{ item.discount }}%</td><td>{{ money(item.amount) }}</td><td><NTag size="small" :type="item.status==='待选产品'?'warning':'success'" :bordered="false">{{ item.status }}</NTag></td></tr>
            </tbody></table></div>
          </section>
          <section class="panel quote-detail-totals"><div><span>产品小计</span><strong>{{ money(quotePageRecord.subtotal) }}</strong></div><div><span>服务费用</span><strong>{{ money(quotePageRecord.feeTotal) }}</strong></div><div><span>整单折扣</span><strong>{{ quotePageRecord.discount }}%</strong></div><div><span>报价合计</span><strong>{{ money(quotePageRecord.total) }}</strong></div></section>
          <div class="page-submit-bar"><a class="secondary link-button" :href="`/api/admin/quotes/${quotePageRecord.id}/export.csv`">导出 CSV</a><a class="secondary link-button" :href="`/api/admin/quotes/${quotePageRecord.id}/export.xls`">导出 Excel</a><a class="primary link-button" target="_blank" :href="`/api/admin/quotes/${quotePageRecord.id}/print`">打印 / PDF</a></div>
        </div>
      </template>

      <template v-else-if="isQuoteEditPage">
        <div class="admin-page-head quote-page-head">
          <div>
<div class="admin-breadcrumb"><button type="button" class="crumb-link" @click="crumbGo('/quotes')">报价中心</button> / <button type="button" class="crumb-link" @click="crumbGo('/quotes')">报价单列表</button> / <strong>编辑草稿</strong></div>
            <h2>编辑报价草稿</h2>
            <p>{{ quotePageRecord?.quoteNo || quoteEditRouteId }} · 保存后将更新当前草稿版本，不新增报价单号。</p>
          </div>
          <div class="admin-page-actions"><NButton @click="goQuotePage(`/quotes/${encodeURIComponent(quoteEditRouteId)}`)">← 返回报价详情</NButton></div>
        </div>
        <div v-if="quotePageRecord" class="quote-edit-page">
          <section class="panel quote-plan-sheet">
            <div class="quote-form-row"><div class="quote-row-label">报价单名称</div><div class="quote-row-content"><NInput v-model:value="quoteEditForm.name" class="quote-name-input" /></div></div>
            <div class="quote-form-row"><div class="quote-row-label">关联信息</div><div class="quote-row-content quote-inline-fields"><NSelect v-model:value="quoteEditForm.projectId" class="quote-project-select" :options="projectOptions" filterable clearable placeholder="关联项目" /><NSelect v-model:value="quoteEditForm.customerId" class="quote-customer-select" :options="customerOptions" filterable clearable placeholder="关联客户" /></div></div>
            <div class="quote-form-row"><div class="quote-row-label">整单折扣</div><div class="quote-row-content"><label class="quote-inline-field"><NInputNumber v-model:value="quoteEditForm.overallDiscount" :min="0" :max="100" button-placement="both" /><em>%</em></label></div></div>
            <div class="quote-form-row quote-edit-items-row">
              <div class="quote-row-label">报价明细</div>
              <div class="quote-row-content">
                <div class="quote-table-wrap"><table class="quote-edit-table"><thead><tr><th>产品</th><th>空间</th><th>数量</th><th>单价</th><th>折扣</th><th>金额</th><th>操作</th></tr></thead><tbody>
                  <tr v-for="(item,index) in quoteEditForm.items" :key="item.id || index"><td><strong>{{ item.name }}</strong><small>{{ item.sku }}</small></td><td>{{ item.space || '按方案' }}</td><td><NInputNumber v-model:value="item.quantity" :min="0" button-placement="both" /></td><td>{{ money(item.unitPrice) }}</td><td><NInputNumber v-model:value="item.discount" :min="0" :max="100" button-placement="both" /></td><td>{{ money(item.quantity * item.unitPrice * item.discount / 100) }}</td><td><button class="table-link danger-link" @click="quoteEditForm.items.splice(index,1)">删除</button></td></tr>
                </tbody></table></div>
              </div>
            </div>
          </section>
          <div class="page-submit-bar"><NButton @click="goQuotePage(`/quotes/${encodeURIComponent(quoteEditRouteId)}`)">取消</NButton><NButton type="primary" :loading="busy" @click="saveQuoteDraft">保存草稿修改</NButton></div>
        </div>
      </template>

      <template v-else-if="isTemplateNewPage">
        <div class="admin-page-head quote-page-head">
          <div>
<div class="admin-breadcrumb"><button type="button" class="crumb-link" @click="crumbGo('/quotes')">报价中心</button> / <button type="button" class="crumb-link" @click="crumbGo('/quotes/templates')">报价模板配置</button> / <strong>{{ templateForm.id ? '编辑模板' : '新建模板' }}</strong></div>
            <h2>{{ templateForm.id ? '编辑报价模板' : '新建报价模板' }}</h2>
            <p>模板由多条数量规则组成，快速报价会逐条计算公式并匹配本地产品。</p>
          </div>
          <div class="admin-page-actions"><NButton @click="goQuotePage('/quotes/templates')">← 返回模板列表</NButton></div>
        </div>
        <div class="quote-template-page">
          <section class="panel">
            <div class="panel-head"><div><span class="panel-kicker">TEMPLATE PROFILE</span><h3>模板信息</h3></div></div>
            <div class="quote-form-grid template-profile-grid">
              <label class="quote-field"><span>模板名称</span><NInput v-model:value="templateForm.name" placeholder="例如：全屋智能基础模板" /></label>
              <label class="quote-field"><span>方案类型</span><NSelect v-model:value="templateForm.schemeType" :options="['全屋智能','灯光智能化','网络与安防','影音娱乐'].map(value=>({label:value,value}))" /></label>
              <label class="quote-field"><span>状态</span><NSelect v-model:value="templateForm.status" :options="['启用','停用'].map(value=>({label:value,value}))" /></label>
              <label class="quote-field quote-field-wide"><span>模板说明</span><NInput v-model:value="templateForm.description" type="textarea" placeholder="说明适用场景和报价口径" /></label>
            </div>
          </section>
          <section class="panel">
            <div class="panel-head"><div><span class="panel-kicker">QUANTITY RULES</span><h3>数量规则</h3></div><NButton type="primary" @click="templateForm.lines.push({ label:'', category:'灯光', formula:'ceil(area/12)' })">＋ 添加规则</NButton></div>
            <div class="quote-rule-table-wrap">
              <table class="quote-rule-table">
                <thead><tr><th>规则名称</th><th>产品分类</th><th>数量公式</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="(line,index) in templateForm.lines" :key="index">
                    <td><NInput v-model:value="line.label" placeholder="例如：基础照明" /></td>
                    <td><NSelect v-model:value="line.category" :options="['灯光','控制','窗帘','传感器','网络','安防','影音','其他'].map(value=>({label:value,value}))" /></td>
                    <td><NInput v-model:value="line.formula" placeholder="例如：ceil(area/12)" /></td>
                    <td><button class="table-link quote-danger-link" @click="templateForm.lines.splice(index,1)">删除</button></td>
                  </tr>
                  <tr v-if="!templateForm.lines.length"><td colspan="4"><div class="empty">还没有数量规则，请添加至少一条。</div></td></tr>
                </tbody>
              </table>
            </div>
            <div class="quote-rule-help">
              <b>可用公式</b>
              <span><code>ceil(area/12)</code> 按面积向上取整</span>
              <span><code>area&gt;=160?6:4</code> 条件数量</span>
              <span><code>4</code> 固定数量</span>
            </div>
          </section>
          <div class="page-submit-bar">
            <NButton @click="goQuotePage('/quotes/templates')">取消</NButton>
            <NButton type="primary" :loading="busy" @click="saveTemplate">{{ templateForm.id ? '保存模板' : '创建模板' }}</NButton>
          </div>
        </div>
      </template>
    </template>

    <template v-else-if="mode === 'quotes'">
      <div class="admin-page-head quote-page-head"><div><div class="admin-breadcrumb"><button type="button" class="crumb-link" @click="crumbGo('/quotes')">报价中心</button> / <strong>{{ quoteTab==='list' ? '报价单列表' : '报价模板配置' }}</strong></div><h2>{{ quoteTab==='list' ? '报价单列表' : '报价模板配置' }}</h2><p>{{ quoteTab==='list' ? '查看和管理项目报价、独立报价及历史版本。' : '配置快速报价使用的方案类型、数量公式和启停状态。' }}</p></div><div class="admin-page-actions"><NButton v-if="quoteTab==='templates'" type="primary" @click="openTemplateEditor()">＋ 新建模板</NButton><NButton v-else type="primary" @click="openQuoteBuilder('smart')">＋ 新建报价单</NButton></div></div>

      <template v-if="quoteTab==='list'">
        <div class="filter-row quote-list-toolbar"><div class="quote-filter-group"><NInput v-model:value="quoteSearch" clearable placeholder="搜索报价单、项目或报价方式" /><NSelect v-model:value="quoteProjectFilter" class="quote-project-filter" :options="quoteProjectOptions" /><NSelect v-model:value="quoteStatus" class="quote-status-filter" :options="quoteStatusOptions" /></div><div class="quote-list-summary">共 {{ filteredQuotes.length }} 张报价单</div></div>
        <section class="panel quote-list-panel">
          <div class="quote-table-wrap"><table class="quote-table">
            <thead><tr><th>报价单</th><th>关联项目</th><th>报价方式</th><th>报价金额</th><th>状态</th><th>最近更新</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="quote in pagedQuotes" :key="quote.id">
                <td><button class="quote-name-button" @click="openQuotePage(quote.id)"><strong>{{ quote.name }}</strong><small>{{ quote.quoteNo || quote.id }} · V{{ quote.versionNo }}</small></button></td>
                <td><strong>{{ quote.projectName || '未关联项目' }}</strong><small>{{ quote.payload?.items?.length || 0 }} 项产品</small></td>
                <td><NTag size="small" :bordered="false">{{ quote.mode }}</NTag></td>
                <td class="quote-total">{{ money(quote.total) }}</td>
                <td><NTag size="small" :type="quote.status==='草稿'?'warning':quote.status==='待确认'?'info':quote.status==='已确认'?'success':quote.status==='已作废'?'error':'default'" :bordered="false">{{ quote.status }}</NTag></td>
                <td class="muted-cell">{{ dateTime(quote.updatedAt) }}</td>
                <td>
                  <div class="table-actions quote-row-actions">
                    <button v-for="action in quoteActions(quote)" :key="action.key" class="table-link" :class="{ 'danger-link': action.key==='void' }" @click="runQuoteAction(quote, action.key)">{{ action.label }}</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!pagedQuotes.length"><td colspan="7"><div class="empty quote-empty"><strong>还没有符合条件的报价单</strong><span>点击右上角“新建报价单”，从项目和产品开始生成第一张报价。</span><NButton type="primary" @click="openQuoteBuilder('smart')">新建报价单</NButton></div></td></tr>
            </tbody>
          </table></div>
        </section>
        <AdminPagination v-if="filteredQuotes.length" :page="quotePage" :page-size="quotePageSize" :total="filteredQuotes.length" :current-count="pagedQuotes.length" label="报价单" @update:page="changeQuotePage" @update:page-size="changeQuotePageSize" />
      </template>

      <template v-else>
        <section class="panel template-settings-panel">
          <div class="panel-head"><div><h3>报价模板库 <small>（共{{ templates.length }} 项）</small></h3></div></div>
          <div class="template-table-wrap"><table class="template-table">
            <thead><tr><th>模板名称</th><th>方案类型</th><th>数量规则</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="item in pagedTemplates" :key="item.id">
                <td><strong>{{ item.name }}</strong><small>{{ item.description || '暂无说明' }}</small></td>
                <td>{{ item.schemeType }}</td>
                <td><details><summary>{{ item.lines.length }} 类计算项 · 查看</summary><div v-for="line in item.lines" :key="line.label">{{ line.label }}：{{ line.formula }}</div></details></td>
                <td><NTag :bordered="false" :type="item.status==='启用'?'success':'default'">{{ item.status }}</NTag></td>
                <td><button class="table-link" @click="openTemplateEditor(item)">编辑</button></td>
              </tr>
              <tr v-if="!pagedTemplates.length"><td colspan="5"><div class="empty">暂无报价模板。</div></td></tr>
            </tbody>
          </table></div>
        </section>
        <AdminPagination v-if="templates.length" :page="templatePage" :page-size="templatePageSize" :total="templates.length" :current-count="pagedTemplates.length" label="报价模板" @update:page="changeTemplatePage" @update:page-size="changeTemplatePageSize" />
      </template>

      <div v-if="showQuoteBuilder" class="modal-backdrop" @click.self="closeQuoteBuilder"><section class="modal quote-builder-modal"><div class="modal-head"><div><span class="panel-kicker">NEW QUOTE</span><h3>新建报价单</h3></div><button @click="closeQuoteBuilder" aria-label="关闭">×</button></div><div class="admin-tabs quote-builder-tabs"><button :class="{active:quoteMode==='smart'}" @click="quoteMode='smart'">快速 / 智能报价</button><button :class="{active:quoteMode==='manual'}" @click="quoteMode='manual';searchProducts()">手动选品报价</button></div><div v-if="quoteMode==='smart'" class="quote-builder-form"><section class="quote-form-main"><label>关联项目<NSelect v-model:value="selectedProjectId" :options="projectOptions" filterable placeholder="请选择客户项目" /></label><label>报价模板<NSelect v-model:value="selectedTemplateId" :options="templateOptions" placeholder="请选择报价模板" /></label><label>整单折扣（%）<NInputNumber v-model:value="overallDiscount" :min="0" :max="100" /></label></section><aside class="quote-builder-aside"><strong>生成内容</strong><span>按项目面积和方案类型计算数量</span><span>匹配当前门店在售产品</span><span>保留报价版本与价格快照</span><div class="button-row"><NButton secondary @click="closeQuoteBuilder">取消</NButton><NButton :loading="busy" @click="generateQuote('快速报价')">快速生成</NButton><NButton type="primary" :loading="busy" @click="generateQuote('智能报价')">生成智能报价</NButton></div></aside></div><div v-else class="admin-workbench manual-quote-builder"><section class="panel"><div class="panel-head"><div><span class="panel-kicker">STORE PRODUCTS</span><h3>从店铺产品库选品</h3></div></div><div class="inline-search"><NInput v-model:value="productSearch" placeholder="搜索产品名称、编码或品牌" @keyup.enter="searchProducts" /><NButton @click="searchProducts">搜索</NButton></div><div class="product-pick-list"><button v-for="product in productOptions" :key="product.id" @click="addManualProduct(product)"><div><strong>{{ product.name }}</strong><small>{{ product.sku }} · {{ product.category }}</small></div><span>{{ money(product.price) }}/{{ product.salesUnit }}</span><b>＋</b></button></div></section><section class="panel"><div class="panel-head"><div><span class="panel-kicker">MANUAL QUOTE</span><h3>手动报价清单</h3></div><span class="panel-note">{{ manualLines.length }} 行</span></div><div v-if="!manualLines.length" class="empty">从左侧本地产品库添加产品。</div><div v-for="(line,index) in manualLines" :key="line.productId" class="manual-line"><div><strong>{{ line.name }}</strong><small>{{ line.sku }} · {{ money(line.unitPrice) }}/{{ line.unit }}</small></div><NInputNumber v-model:value="line.quantity" :min="1" /><NInputNumber v-model:value="line.discount" :min="0" :max="100" /><button @click="removeManualLine(index)" aria-label="关闭">×</button></div><div class="button-row"><NButton secondary @click="closeQuoteBuilder">取消</NButton><NButton type="primary" :disabled="!manualLines.length" @click="generateQuote('手动报价')">保存手动报价版本</NButton></div></section></div></section></div>

      <div v-if="quoteDetail" class="modal-backdrop" @click.self="quoteDetail=null"><section class="modal quote-detail-modal"><div class="modal-head"><div><h3>{{ quoteDetail.name }}</h3><p>{{ quoteDetail.mode }} · 设计版本 {{ quoteDetail.designVersionId || '未绑定' }} · {{ quoteDetail.payload.pricingBasis==='design_snapshot'?'按设计设备快照':quoteDetail.payload.pricingBasis==='manual_selection'?'手动选品':'按面积模板' }}</p></div><button @click="quoteDetail=null" aria-label="关闭">×</button></div><div class="quote-summary"><span>产品小计 <b>{{ money(quoteDetail.subtotal) }}</b></span><span>服务费用 <b>{{ money(quoteDetail.feeTotal) }}</b></span><span>产品成本 <b>{{ money(quoteDetail.payload.costTotal || 0) }}</b></span><span>预估毛利 <b>{{ money(quoteDetail.payload.grossProfit || 0) }}</b></span><span>毛利率 <b>{{ quoteDetail.payload.grossMargin || 0 }}%</b></span><span>报价合计 <b>{{ money(quoteDetail.total) }}</b></span></div><div class="quote-detail-table"><table><thead><tr><th>产品 / 原因</th><th>来源</th><th>数量</th><th>单价</th><th>成本</th><th>金额</th><th>状态</th></tr></thead><tbody><tr v-for="item in quoteDetail.payload.items" :key="item.id"><td><strong>{{ item.name }}</strong><small>{{ item.sku }} · {{ item.category }}</small><em>{{ item.reason }}</em></td><td>{{ item.source }}</td><td>{{ item.quantity }}{{ item.unit }}</td><td>{{ money(item.unitPrice) }}</td><td>{{ money(item.costAmount || 0) }}</td><td>{{ money(item.amount) }}</td><td><NTag size="small" :type="item.status==='待选产品'?'warning':'success'" :bordered="false">{{ item.status }}</NTag></td></tr></tbody></table></div><div class="modal-actions"><NButton secondary @click="copyQuote(quoteDetail.id)">复制为新版本</NButton><a class="secondary link-button" :href="`/api/admin/quotes/${quoteDetail.id}/export.csv`">导出 CSV</a><a class="secondary link-button" :href="`/api/admin/quotes/${quoteDetail.id}/export.xls`">导出 Excel</a><a class="primary link-button" target="_blank" :href="`/api/admin/quotes/${quoteDetail.id}/print`">打印 / PDF</a></div></section></div>
      <div v-if="showTemplateForm" class="modal-backdrop" @click.self="showTemplateForm=false"><form class="modal template-form-modal" @submit.prevent="saveTemplate"><div class="modal-head"><div><div class="admin-breadcrumb">报价模板库 / 新建模板</div><h3>新建报价模板</h3></div><button type="button" @click="showTemplateForm=false" aria-label="关闭">×</button></div><label>模板名称<NInput v-model:value="templateForm.name" placeholder="例如：全屋智能基础模板" /></label><label>方案类型<NSelect v-model:value="templateForm.schemeType" :options="['全屋智能','灯光智能化','网络与安防'].map(v=>({label:v,value:v}))" /></label><label>模板说明<NInput v-model:value="templateForm.description" type="textarea" placeholder="说明适用场景" /></label><div class="modal-actions"><NButton secondary attr-type="button" @click="showTemplateForm=false">取消</NButton><NButton type="primary" attr-type="submit">保存模板</NButton></div></form></div>
    </template>

    <template v-else-if="mode === 'designs'">
      <div class="project-delivery-head">
        <div><span class="admin-page-kicker">DESIGN & DELIVERY</span><h2>设计与交付</h2><p>设计版本、项目文件与施工成果统一归档在当前客户项目中。</p></div>
        <div class="admin-page-actions"><NSelect v-if="!embedded" v-model:value="selectedProjectId" :options="projectOptions" filterable class="design-project-select" /><a v-if="selectedProjectId" class="primary link-button" :href="`/app/?project=${selectedProjectId}&restore=1`">打开设计工作台</a></div>
      </div>
      <div class="admin-tabs"><button :class="{active:designTab==='versions'}" @click="designTab='versions'">设计版本</button><button :class="{active:designTab==='artifacts'}" @click="designTab='artifacts'">施工成果</button><button :class="{active:designTab==='files'}" @click="designTab='files'">项目文件</button><button :class="{active:designTab==='packages'}" @click="designTab='packages'">交付包</button></div>

      <template v-if="designTab==='versions'">
        <section class="capability-strip"><article v-for="domain in capabilities" :key="domain.key"><span>✓</span><div><strong>{{ domain.name }}</strong><small>{{ domain.features.join(' · ') }}</small></div></article></section>
        <div class="admin-workbench design-version-workbench"><section class="panel"><div class="panel-head"><div><span class="panel-kicker">DESIGN VERSIONS</span><h3>设计版本</h3></div><NButton secondary @click="copyProject">复制历史项目</NButton></div><div v-if="!versions.length" class="empty">还没有设计版本。进入工作台后点击“保存项目版本”。</div><article v-for="version in versions" :key="version.id" class="version-card"><div class="version-no">V{{ version.versionNo }}</div><div><strong>{{ version.name }}</strong><small>{{ dateTime(version.createdAt) }} · 规则 {{ version.ruleVersion }}</small><p>家具 {{ version.summary.furniture }} · 设备 {{ version.summary.devices }} · 已布置 {{ version.summary.placed }} · 待处理 {{ version.summary.pending }} · 回路 {{ version.summary.circuits }}</p></div><NTag :bordered="false">{{ version.status }}</NTag></article></section><aside class="panel version-summary"><span class="panel-kicker">CURRENT PROJECT</span><h3>{{ selectedProject?.name || '请选择项目' }}</h3><p>{{ selectedProject?.area || 0 }}㎡ · {{ selectedProject?.schemeType }} · {{ selectedProject?.currentStage }}</p><dl><div><dt>设计版本</dt><dd>{{ versions.length }}</dd></div><div><dt>交付包</dt><dd>{{ packages.length }}</dd></div><div><dt>项目进度</dt><dd>{{ selectedProject?.progress || 0 }}%</dd></div></dl><NButton type="primary" :disabled="!versions.length" :loading="busy" @click="createDelivery">生成施工交付包</NButton></aside></div>
      </template>
      <section v-else-if="designTab==='artifacts'" class="panel artifact-panel"><div class="panel-head"><div><span class="panel-kicker">DESIGN ARTIFACTS</span><h3>方案图层与施工成果</h3></div><span class="panel-note">同一设计版本生成，避免图纸口径不一致</span></div><div class="artifact-grid"><a v-for="item in [{key:'overview',title:'设备总览图',desc:'按空间汇总产品、数量和状态'},{key:'points',title:'智能点位图',desc:'坐标、安装面、规则和待处理'},{key:'lighting',title:'灯光交底图',desc:'灯具、障碍、光效与控制组'},{key:'water',title:'水电交底图',desc:'供电、底盒、开孔与安装高度'},{key:'network',title:'网络布线图',desc:'弱电箱、交换机、AP 与链路'},{key:'woodwork',title:'木工交底图',desc:'柜体灯带、窗帘盒与检修口'}]" :key="item.key" :href="selectedProjectId?`/app/?project=${selectedProjectId}&restore=1&rtab=${item.key==='network'?'circuit':'smart'}`:'#'"><span>{{ item.key==='lighting'?'✦':item.key==='network'?'⌁':'▦' }}</span><div><strong>{{ item.title }}</strong><small>{{ item.desc }}</small></div><b>打开 →</b></a></div></section>
      <div v-else-if="designTab==='files'" class="admin-workbench file-workbench"><section class="panel floorplan-assist-panel"><div class="panel-head"><div><span class="panel-kicker">LOCAL FLOORPLAN ASSIST</span><h3>本地户型辅助识别</h3></div><label class="secondary link-button file-button">选择户型图<input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" @change="assistFloorplan"></label></div><p>离线读取图片尺寸并生成候选空间；候选结果必须进入工作台人工框选和校准比例尺。</p><div v-if="!floorplanAssists.length" class="empty">尚未生成候选空间。</div><article v-for="item in floorplanAssists" :key="item.id" class="assist-result"><div><strong>{{ item.fileName }}</strong><small>{{ dateTime(item.createdAt) }} · {{ item.method }} · 置信度 {{ Math.round(item.confidence*100) }}%</small></div><NTag type="warning" :bordered="false">{{ item.status }}</NTag><p>{{ item.rooms.map((room:any)=>room.name).join('、') }}</p><small>{{ item.warnings.join(' ') }}</small><a class="table-link" :href="`/app/space.html?space=ALL&project=${selectedProjectId}`">打开全屋模板复核 →</a></article></section><section class="panel"><div class="panel-head"><div><span class="panel-kicker">PROJECT FILES</span><h3>户型图、合同与现场照片</h3></div><label class="secondary link-button file-button">上传附件<input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" @change="uploadProjectAttachment"></label></div><div v-if="!attachments.length" class="empty">还没有项目附件。</div><div v-for="item in attachments" :key="item.id" class="delivery-row"><div><strong>{{ item.name }}</strong><small>{{ item.category }} · {{ Math.ceil(item.size/1024) }}KB · {{ dateTime(item.createdAt) }}</small></div><a class="table-link" target="_blank" :href="item.url">查看</a></div></section></div>
      <section v-else class="panel"><div class="panel-head"><div><span class="panel-kicker">DELIVERY PACKAGES</span><h3>交付包记录</h3></div><NButton type="primary" :disabled="!versions.length" :loading="busy" @click="createDelivery">生成施工交付包</NButton></div><div v-if="!packages.length" class="empty">保存设计版本后可生成 `.shp` 离线交付包。</div><article v-for="item in packages" :key="item.id" class="delivery-package-card"><div class="delivery-row"><div><strong>{{ item.name }}</strong><small>{{ dateTime(item.createdAt) }} · {{ item.manifest.artifacts.filter((a:any)=>a.status==='已生成' && a.size>0).length }} 类可下载成果 · {{ item.status }}</small></div><a class="secondary link-button" :href="`/api/admin/delivery-packages/${item.id}/download`">下载整包</a></div><div v-if="item.manifest.artifacts.some((a:any)=>a.status==='已生成' && a.size>0)" class="delivery-artifacts"><a v-for="artifact in item.manifest.artifacts.filter((a:any)=>a.status==='已生成' && a.size>0)" :key="artifact.key" :href="`/api/admin/delivery-packages/${item.id}/artifacts/${artifact.key}`">{{ artifact.name }}<small>{{ Math.ceil(artifact.size/1024) }}KB</small></a></div><small v-else class="panel-note">旧演示交付包仅保留清单说明；请重新生成以获得可下载成果文件。</small></article></section>
    </template>

    <template v-else-if="mode === 'operations'">
      <div class="admin-page-head">
        <div><div class="admin-breadcrumb">经营管理 / <strong>{{ operationTitle }}</strong></div><h2>{{ operationTitle }}</h2><p>{{ operationTab==='inventory' ? '维护产品当前库存、安全库存和补货建议。' : operationTab==='purchase' ? '管理采购单、入库和采购金额。' : '登记项目收款并核对报价待收金额。' }}</p></div>
        <div class="admin-page-actions">
          <NButton secondary :loading="busy" @click="loadOperations">刷新数据</NButton>
          <NButton v-if="operationTab==='inventory'" type="primary" @click="openInventoryForm()">＋ 新增盘点</NButton>
          <NButton v-if="operationTab==='purchase'" type="primary" @click="openPurchaseForm()">＋ 新建采购单</NButton>
          <NButton v-if="operationTab==='payments'" type="primary" @click="openPaymentForm()">＋ 登记收款</NButton>
        </div>
      </div>
      <div class="admin-summary-strip">
        <template v-if="operationTab==='inventory'"><article><span>低库存产品</span><strong>{{ operationSummary.lowStock }}</strong><small>低于安全库存</small></article><article><span>当前页已盘点</span><strong>{{ inventory.filter(item=>item.tracked).length }}</strong><small>当前页 {{ inventory.length }} 条</small></article><article><span>当前页未盘点</span><strong>{{ inventory.filter(item=>!item.tracked).length }}</strong><small>待建立安全库存</small></article><article><span>筛选结果总数</span><strong>{{ inventoryTotal }}</strong><small>服务端分页</small></article></template>
        <template v-else-if="operationTab==='purchase'"><article><span>待处理采购单</span><strong>{{ operationSummary.openPurchaseOrders }}</strong><small>草稿 / 已下单</small></article><article><span>采购单总数</span><strong>{{ purchaseOrders.length }}</strong><small>本机记录</small></article><article><span>采购金额</span><strong>{{ money(purchaseOrders.reduce((sum,order)=>sum+Number(order.total||0),0)) }}</strong><small>全部采购单</small></article><article><span>已入库</span><strong>{{ purchaseOrders.filter(order=>order.status==='已入库').length }}</strong><small>已完成入库</small></article></template>
        <template v-else><article><span>累计收款</span><strong>{{ money(operationSummary.received) }}</strong><small>本机登记记录</small></article><article><span>报价待收</span><strong>{{ money(operationSummary.outstanding) }}</strong><small>按最新报价估算</small></article><article><span>收款笔数</span><strong>{{ payments.length }}</strong><small>历史记录</small></article><article><span>涉及项目</span><strong>{{ new Set(payments.map(item=>item.projectId)).size }}</strong><small>已登记收款项目</small></article></template>
      </div>

      <template v-if="operationTab==='inventory'">
      <section class="panel inventory-panel">
        <div class="panel-head"><div><span class="panel-kicker">INVENTORY</span><h3>产品库存与安全库存</h3></div><div class="admin-section-tools"><div class="compact-filter"><button :class="{active:!lowOnly}" @click="lowOnly=false;queryInventory()">全部</button><button :class="{active:lowOnly}" @click="lowOnly=true;queryInventory()">低库存</button></div><NInput v-model:value="inventorySearch" clearable placeholder="搜索产品、SKU、分类" class="inventory-search" @keyup.enter="queryInventory" /></div></div>
        <div class="operations-table"><table><thead><tr><th>产品</th><th>分类</th><th>当前库存</th><th>安全库存</th><th>建议采购</th><th>状态</th><th>操作</th></tr></thead><tbody>
          <tr v-for="item in inventory" :key="item.id"><td><strong>{{ item.name }}</strong><small>{{ item.sku }}</small></td><td>{{ item.category }}</td><td><NInputNumber v-model:value="stockDrafts[item.id].quantity" :min="0" button-placement="both" /></td><td><NInputNumber v-model:value="stockDrafts[item.id].safetyStock" :min="0" button-placement="both" /></td><td><NTag v-if="item.tracked" :type="item.lowStock?'warning':'success'" :bordered="false">{{ item.suggestedPurchase }}</NTag><NTag v-else :bordered="false">未盘点</NTag></td><td>{{ item.tracked ? (item.lowStock ? '低库存':'正常') : '未建立库存' }}</td><td><div class="table-actions"><button class="table-link" @click="openInventoryForm(item)">编辑</button><button class="table-link" @click="saveStock(item)">{{ item.tracked?'保存':'开始盘点' }}</button><button v-if="item.tracked" class="table-link danger-link" @click="deleteInventory(item)">清除</button></div></td></tr>
        </tbody></table><div v-if="!inventory.length" class="empty">没有匹配的库存产品。</div></div>
      </section>
      <AdminPagination v-if="inventoryTotal" :page="inventoryPage" :page-size="inventoryPageSize" :total="inventoryTotal" :current-count="inventory.length" label="库存产品" :disabled="busy" @update:page="changeInventoryPage" @update:page-size="changeInventoryPageSize" />
      </template>

      <template v-else-if="operationTab==='purchase'">
      <section class="panel">
        <div class="panel-head"><div><span class="panel-kicker">PURCHASE</span><h3>采购单</h3></div><NTag :bordered="false">{{ purchaseOrders.length }} 单</NTag></div>
        <div class="operations-table"><table><thead><tr><th>采购单</th><th>供应商</th><th>采购内容</th><th>金额</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>
          <tr v-for="order in pagedPurchases" :key="order.id"><td><strong>{{ order.id }}</strong><small>{{ dateTime(order.createdAt) }}</small></td><td>{{ order.supplier }}</td><td>{{ order.items.map((item:any)=>`${item.name} ×${item.quantity}`).join('、') }}</td><td>{{ money(order.total) }}</td><td><NTag :bordered="false" :type="order.status==='已入库'?'success':order.status==='已取消'?'error':'warning'">{{ order.status }}</NTag></td><td>{{ dateTime(order.updatedAt) }}</td><td><div class="table-actions"><button v-if="order.status==='草稿'" class="table-link" @click="openPurchaseForm(order)">编辑</button><button v-if="order.status!=='已入库' && order.status!=='已取消'" class="table-link" @click="receivePurchase(order)">确认入库</button><button v-if="order.status!=='已入库'" class="table-link danger-link" @click="deletePurchase(order)">删除</button><span v-if="order.status==='已入库'" class="muted-cell">已完成</span></div></td></tr>
        </tbody></table><div v-if="!pagedPurchases.length" class="empty">还没有采购单。</div></div>
      </section>
      <AdminPagination v-if="purchaseOrders.length" :page="purchasePage" :page-size="listPageSize" :total="purchaseOrders.length" :current-count="pagedPurchases.length" label="采购单" @update:page="page => changeListPage('purchase', page)" @update:page-size="size => changeListPageSize('purchase', size)" />
      </template>

      <template v-else>
      <section class="panel">
        <div class="panel-head"><div><span class="panel-kicker">PAYMENTS</span><h3>收款记录</h3></div><NTag :bordered="false">{{ payments.length }} 笔</NTag></div>
        <div class="operations-table"><table><thead><tr><th>项目</th><th>收款金额</th><th>收款时间</th><th>方式</th><th>关联报价</th><th>备注</th><th>操作</th></tr></thead><tbody>
          <tr v-for="payment in pagedPayments" :key="payment.id"><td><strong>{{ payment.projectName }}</strong><small>{{ payment.projectId }}</small></td><td class="price">{{ money(payment.amount) }}</td><td>{{ payment.paidAt }}</td><td>{{ payment.method }}</td><td>{{ payment.quoteName || '未绑定报价' }}</td><td>{{ payment.note || '—' }}</td><td><div class="table-actions"><button class="table-link" @click="openPaymentForm(payment)">编辑</button><button class="table-link danger-link" @click="deletePayment(payment)">删除</button></div></td></tr>
        </tbody></table><div v-if="!pagedPayments.length" class="empty">还没有收款记录。</div></div>
      </section>
      <AdminPagination v-if="payments.length" :page="paymentPage" :page-size="listPageSize" :total="payments.length" :current-count="pagedPayments.length" label="收款记录" @update:page="page => changeListPage('payment', page)" @update:page-size="size => changeListPageSize('payment', size)" />
      </template>
    </template>

    <template v-else-if="mode === 'store'">
      <div class="admin-page-head"><div><div class="admin-breadcrumb">店铺管理 / <strong>{{ storeTitle }}</strong></div><h2>{{ storeTitle }}</h2><p>{{ storeDescription }}</p></div><div class="admin-page-actions"><NButton v-if="storeTab==='staff'" type="primary" @click="openUserForm()">＋ 新增员工</NButton><NButton v-if="storeTab==='roles'" type="primary" @click="openRoleForm()">＋ 新增角色</NButton></div></div>

      <template v-if="storeTab==='profile'">
        <div class="store-profile-layout">
          <section class="panel module-card admin-form-panel">
            <div class="panel-head"><div><span class="panel-kicker">STORE PROFILE</span><h3>门店基础资料</h3></div><span class="panel-note">用于报价、合同与交付文件抬头，并作为系统品牌标识</span></div>
            <div class="admin-form-body">
              <div class="store-logo-field">
                <div class="store-logo-preview" :class="{ empty: !store.logoUrl }">
                  <img v-if="store.logoUrl" :src="store.logoUrl" :alt="`${store.name || '门店'} LOGO`">
                  <span v-else aria-hidden="true">⌂</span>
                </div>
                <div class="store-logo-copy">
                  <strong>门店 LOGO</strong>
                  <p>PNG / JPG / WebP，建议正方形，单张不超过 2MB。上传后立即同步到登录页、后台侧栏和浏览器标签。</p>
                  <div class="store-logo-actions">
                    <NButton size="small" :loading="logoUploading" :disabled="!canWriteStore" @click="pickStoreLogo">{{ store.logoUrl ? '更换 LOGO' : '上传 LOGO' }}</NButton>
                    <NButton v-if="store.logoUrl" size="small" quaternary type="error" :disabled="!canWriteStore" @click="removeStoreLogo">移除</NButton>
                    <span v-if="!canWriteStore" class="store-logo-hint">当前角色无“店铺编辑”权限</span>
                    <span v-else-if="store.logo" class="store-logo-hint">最近更新 {{ dateTime(store.logo.updatedAt) }}</span>
                  </div>
                </div>
                <input ref="logoInput" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="handleStoreLogoFile">
              </div>
              <label>门店名称<NInput v-model:value="store.name" /></label>
              <div class="field-pair"><label>门店编码<NInput v-model:value="store.code" /></label><label>联系电话<NInput v-model:value="store.phone" /></label></div>
              <label>门店地址<NInput v-model:value="store.address" /></label>
              <div class="field-pair"><label>联系人<NInput v-model:value="store.contactName" /></label><label>经营标识<NInput v-model:value="store.licenseNo" /></label></div>
            </div>
          </section>
          <aside class="panel store-facts-card"><div class="panel-head"><div><span class="panel-kicker">STORE OVERVIEW</span><h3>门店使用概况</h3></div></div><dl class="store-facts"><div><dt>员工账号</dt><dd>{{ users.length }} 人</dd></div><div><dt>角色</dt><dd>{{ roles.length }} 个</dd></div><div><dt>在售产品</dt><dd>{{ overview.products ?? 0 }}</dd></div><div><dt>客户</dt><dd>{{ overview.customers ?? 0 }}</dd></div><div><dt>报价版本</dt><dd>{{ overview.quotes ?? 0 }}</dd></div></dl></aside>
        </div>
        <div class="admin-form-footer"><NButton type="primary" @click="saveStore">保存门店资料</NButton></div>
      </template>

      <template v-else-if="storeTab==='staff'">
        <div class="metric-grid store-metrics"><div class="metric-card"><span>员工总数</span><strong>{{ staffSummary.total }}</strong><small>本机账号</small></div><div class="metric-card olive"><span>启用中</span><strong>{{ staffSummary.active }}</strong><small>可正常登录</small></div><div class="metric-card orange"><span>已停用</span><strong>{{ staffSummary.disabled }}</strong><small>保留历史记录</small></div><div class="metric-card dark"><span>门店管理员</span><strong>{{ staffSummary.admin }}</strong><small>至少保留 1 个</small></div></div>
        <section class="panel"><div class="panel-head"><div><span class="panel-kicker">STAFF ACCOUNTS</span><h3>员工账号</h3></div><NTag :bordered="false">{{ users.length }} 人</NTag></div><div class="operations-table"><table><thead><tr><th>员工</th><th>登录账号</th><th>手机号</th><th>角色</th><th>状态</th><th>最近登录</th><th>操作</th></tr></thead><tbody>
          <tr v-for="user in pagedUsers" :key="user.id"><td><strong>{{ user.name }}</strong><small>{{ user.id }}</small></td><td>{{ user.account }}</td><td>{{ user.phone || '—' }}</td><td><NTag size="small" :bordered="false">{{ user.roleName }}</NTag></td><td><span class="status-tag" :data-status="user.status">{{ user.status }}</span></td><td>{{ user.lastLoginAt ? dateTime(user.lastLoginAt) : '从未登录' }}</td><td><div class="table-actions"><button class="table-link" @click="openUserForm(user)">编辑</button><button class="table-link" @click="toggleUser(user)">{{ user.status==='启用'?'停用':'启用' }}</button><button class="table-link danger-link" :disabled="user.id===currentUserId || (user.roleId==='ROLE-ADMIN' && staffSummary.admin<=1)" :title="user.id===currentUserId ? '不能删除当前登录账号' : user.roleId==='ROLE-ADMIN' && staffSummary.admin<=1 ? '至少保留一个门店管理员账号' : ''" @click="deleteUser(user)">删除</button></div></td></tr>
        </tbody></table><div v-if="!pagedUsers.length" class="empty">还没有员工账号。</div></div></section>
        <AdminPagination v-if="users.length" :page="staffPage" :page-size="listPageSize" :total="users.length" :current-count="pagedUsers.length" label="员工" @update:page="page => changeListPage('staff', page)" @update:page-size="size => changeListPageSize('staff', size)" />
      </template>

      <template v-else>
        <section class="panel"><div class="panel-head"><div><span class="panel-kicker">ROLE PERMISSIONS</span><h3>角色与权限</h3></div><span class="panel-note">权限变更在员工下次登录后生效</span></div><div class="operations-table"><table><thead><tr><th>角色</th><th>角色说明</th><th>权限项</th><th>使用员工</th><th>操作</th></tr></thead><tbody>
          <tr v-for="role in pagedRoles" :key="role.id"><td><strong>{{ role.name }}</strong><small>{{ role.id === 'ROLE-ADMIN' ? '系统内置 · 不可修改' : role.id }}</small></td><td>{{ role.description || '—' }}</td><td><span class="role-permission-summary">{{ role.permissions.slice(0,3).map(permissionLabel).join(' · ') }}<em v-if="role.permissions.length>3"> +{{ role.permissions.length-3 }}</em></span></td><td>{{ roleUsage[role.id] || 0 }} 人</td><td><div class="table-actions"><button class="table-link" :disabled="role.id==='ROLE-ADMIN'" :title="role.id==='ROLE-ADMIN' ? '门店管理员为系统内置角色' : ''" @click="openRoleForm(role)">编辑</button><button class="table-link danger-link" :disabled="role.id==='ROLE-ADMIN' || (roleUsage[role.id]||0)>0" :title="role.id==='ROLE-ADMIN' ? '门店管理员角色不能删除' : (roleUsage[role.id]||0)>0 ? '仍有员工使用该角色，不能删除' : ''" @click="deleteRole(role)">删除</button></div></td></tr>
        </tbody></table><div v-if="!pagedRoles.length" class="empty">还没有角色。</div></div></section>
        <AdminPagination v-if="roles.length" :page="rolePage" :page-size="listPageSize" :total="roles.length" :current-count="pagedRoles.length" label="角色" @update:page="page => changeListPage('role', page)" @update:page-size="size => changeListPageSize('role', size)" />
      </template>
    </template>

    <template v-else>
      <div class="admin-page-head"><div><div class="admin-breadcrumb">系统设置 / <strong>{{ settingsTitle }}</strong></div><h2>{{ settingsTitle }}</h2><p>{{ settingsDescription }}</p></div></div>
<div v-if="settingsTab==='pricing'" class="settings-page-section"><section class="panel"><div class="panel-head"><div><span class="panel-kicker">SERVICE FEES</span><h3>服务费配置</h3></div><NButton size="small" @click="addFee">新增费用</NButton></div><div class="admin-panel-body"><div v-for="fee in settings.serviceFees" :key="fee.key" class="setting-line"><NInput v-model:value="fee.name" /><NSelect v-model:value="fee.mode" :options="[{label:'固定金额',value:'fixed'},{label:'按产品小计百分比',value:'percent'}]" /><NInputNumber v-model:value="fee.value" :min="0" /><label class="switch-label"><input v-model="fee.enabled" type="checkbox">启用</label></div></div></section><section class="panel project-config-list"><div class="panel-head"><div><span class="panel-kicker">PROJECT CONFIG</span><h3>项目与报价配置</h3></div><NButton secondary @click="showProjectConfigForm=true">编辑配置</NButton></div><dl><div><dt>币种</dt><dd>{{ settings.projectConfig.currency || 'CNY' }}</dd></div><div><dt>默认税率</dt><dd>{{ settings.projectConfig.taxRate ?? 0 }}%</dd></div><div><dt>报价有效期</dt><dd>{{ settings.projectConfig.quoteValidityDays ?? 30 }} 天</dd></div><div><dt>生成报价前保存设计版本</dt><dd>{{ settings.projectConfig.requireDesignVersionBeforeQuote ? '是' : '否' }}</dd></div></dl></section></div>
      <ProjectJourneySettings v-else-if="settingsTab==='journey'" @notice="notify" />
      <section v-else-if="settingsTab==='devices'" class="panel settings-devices-panel">
        <div class="panel-head"><div><span class="panel-kicker">DEFAULT DEVICES</span><h3>设备型号默认配置</h3></div><span class="panel-note">未指定时自动选择同分类在售产品</span></div>
        <div class="settings-device-toolbar">
          <NInput v-model:value="deviceSearch" clearable placeholder="搜索设备分类或物品编码" aria-label="搜索默认设备分类" />
          <NSelect v-model:value="deviceLevel" :options="deviceLevelOptions" clearable placeholder="全部一级分类" aria-label="默认设备一级分类筛选" />
          <NTag :bordered="false">{{ configuredDeviceCount }} / {{ deviceCategories.length }} 已配置</NTag>
        </div>
        <div class="settings-device-table table-panel">
          <table>
            <thead><tr><th>设备类别</th><th>在售 / 全部</th><th>默认品牌</th><th>默认型号</th></tr></thead>
            <tbody>
              <tr v-for="category in pagedDeviceRows" :key="category.id">
                <td><strong>{{ category.label }}</strong><small>{{ category.category1 }} · {{ category.itemCode || '未映射' }} · {{ category.ruleId || '—' }}</small></td>
                <td>{{ category.onSaleCount }}<small>共 {{ category.productCount }} 个产品</small></td>
                <td><NSelect :value="defaultDevice(category.id).brand" :options="deviceBrandOptions(category.id)" filterable tag clearable placeholder="自动" aria-label="默认品牌" @update:value="value => setDefaultBrand(category.id, value || '')" /></td>
                <td><NSelect :value="defaultDevice(category.id).productId" :options="deviceModelOptions(category.id)" filterable clearable placeholder="自动" aria-label="默认型号" @update:value="value => setDefaultModel(category.id, value || '')" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!pagedDeviceRows.length" class="empty">没有匹配的设备分类。</div>
        <AdminPagination :page="devicePage" :page-size="devicePageSize" :total="filteredDeviceRows.length" :current-count="pagedDeviceRows.length" label="设备分类" @update:page="changeDevicePage" @update:page-size="changeDevicePageSize" />
      </section>
      <div v-else-if="settingsTab==='construction'" class="admin-workbench"><section class="panel"><div class="panel-head"><div><span class="panel-kicker">CONSTRUCTION</span><h3>施工进度模板</h3></div><NButton size="small" @click="addStage">新增阶段</NButton></div><div class="admin-panel-body"><div class="stage-editor"><label v-for="(_,index) in settings.constructionStages" :key="index"><span>{{ Number(index)+1 }}</span><NInput v-model:value="settings.constructionStages[index]" /><button @click="settings.constructionStages.splice(index,1)" aria-label="关闭">×</button></label></div></div></section><aside class="panel"><div class="panel-head"><div><span class="panel-kicker">NOTICES</span><h3>施工图注意事项</h3></div><NButton size="small" @click="addNote">新增提示</NButton></div><div class="admin-panel-body"><div v-for="(_,index) in settings.constructionNotes" :key="index" class="note-editor"><NInput v-model:value="settings.constructionNotes[index]" type="textarea" autosize /><button @click="settings.constructionNotes.splice(index,1)" aria-label="关闭">×</button></div></div></aside></div>
      <section v-else-if="settingsTab==='backup'" class="panel backup-card danger-zone"><div class="panel-head"><div><span class="panel-kicker">BACKUP & RESTORE</span><h3>数据备份与迁移</h3></div><NTag type="warning" :bordered="false">恢复会覆盖本机数据</NTag></div><div class="admin-panel-body"><p>导出客户、项目、产品、设计版本、报价、员工、设置和附件索引。恢复前先校验并显示数量。</p><div class="button-row"><a class="primary link-button" href="/api/admin/backup/file">导出 `.shp` 完整备份</a><label class="secondary link-button file-button">选择备份恢复<input type="file" accept=".shp,.json,application/json" @change="readBackupFile"></label></div><div v-if="restorePreview" class="restore-preview"><strong>备份校验通过</strong><span>客户 {{ restorePreview.counts.customers }}</span><span>项目 {{ restorePreview.counts.projects }}</span><span>产品 {{ restorePreview.counts.products }}</span><span>设计版本 {{ restorePreview.counts.designVersions }}</span><span>报价 {{ restorePreview.counts.quotes }}</span><NButton type="error" @click="restoreBackup">确认恢复并覆盖当前数据</NButton></div><code>{{ overview.storage }}</code></div></section>
      <section v-else class="panel audit-panel"><div class="panel-head"><div><span class="panel-kicker">LOCAL AUDIT LOG</span><h3>本地操作审计</h3></div><span class="panel-note">最近 {{ logs.length }} 条</span></div><div class="audit-table"><table><thead><tr><th>时间</th><th>操作人</th><th>动作</th><th>对象</th><th>说明</th></tr></thead><tbody><tr v-for="log in pagedLogs" :key="log.id"><td>{{ dateTime(log.createdAt) }}</td><td>{{ log.actor }}</td><td><code>{{ log.action }}</code></td><td>{{ log.targetType }} {{ log.targetId }}</td><td>{{ log.summary }}</td></tr></tbody></table></div></section>
      <AdminPagination v-if="settingsTab==='audit' && logs.length" :page="auditPage" :page-size="listPageSize" :total="logs.length" :current-count="pagedLogs.length" label="审计记录" @update:page="page => changeListPage('audit', page)" @update:page-size="size => changeListPageSize('audit', size)" />
      <div v-if="!['backup','audit','journey'].includes(settingsTab)" class="admin-form-footer"><NButton type="primary" @click="saveSettings">保存设置</NButton><span class="panel-note">切换页面前请先保存。</span></div>
    </template>

    <div v-if="showQuoteTransition" class="modal-backdrop" @click.self="showQuoteTransition=false"><form class="modal business-form-modal quote-transition-modal" @submit.prevent="submitQuoteTransition"><div class="modal-head"><div><div class="admin-breadcrumb">报价中心 / 状态操作</div><h3>{{ quoteTransitionTitle }}</h3><p>当前状态：{{ quoteTransitionForm.expectedStatus }}。状态变化会写入操作人和时间记录。</p></div><button type="button" @click="showQuoteTransition=false" aria-label="关闭">×</button></div><label v-if="['return','void'].includes(quoteTransitionForm.action)">{{ quoteTransitionForm.action==='void'?'作废原因':'退回原因' }}<NInput v-model:value="quoteTransitionForm.reason" type="textarea" :autosize="{minRows:3,maxRows:5}" placeholder="必填，说明业务原因" /></label><div v-else class="logic-note"><b>{{ quoteTransitionForm.action==='submit'?'提交后价格和明细将锁定':'确认后报价将不可原地修改' }}</b><span>{{ quoteTransitionForm.action==='submit'?'提交后进入待确认，可退回修改或继续确认。':'需要修改时请从已确认报价复制新版本。' }}</span></div><div class="modal-actions"><NButton secondary attr-type="button" @click="showQuoteTransition=false">取消</NButton><NButton :type="quoteTransitionForm.action==='void'?'error':'primary'" attr-type="submit">{{ quoteTransitionTitle }}</NButton></div></form></div>
    <div v-if="showQuoteAssociation" class="modal-backdrop" @click.self="showQuoteAssociation=false"><form class="modal business-form-modal" @submit.prevent="saveQuoteAssociation"><div class="modal-head"><div><div class="admin-breadcrumb">报价中心 / 关联项目</div><h3>关联报价单</h3><p>独立报价可以在此关联项目与客户；取消项目关联会恢复为独立报价。</p></div><button type="button" @click="showQuoteAssociation=false" aria-label="关闭">×</button></div><label>报价单<NSelect v-model:value="quoteAssociationForm.quoteId" :options="associationQuoteOptions" filterable /></label><label>关联项目<NSelect v-model:value="quoteAssociationForm.projectId" :options="projectOptions" filterable clearable placeholder="不关联项目" /></label><label>关联客户<NSelect v-model:value="quoteAssociationForm.customerId" :options="customerOptions" filterable clearable placeholder="不关联客户" /></label><div class="modal-actions"><NButton secondary attr-type="button" @click="showQuoteAssociation=false">取消</NButton><NButton type="primary" attr-type="submit" :disabled="!quoteAssociationForm.quoteId">保存关联</NButton></div></form></div>
    <div v-if="showInventoryForm" class="modal-backdrop" @click.self="showInventoryForm=false"><form class="modal business-form-modal" @submit.prevent="saveInventoryForm"><div class="modal-head"><div><div class="admin-breadcrumb">库存管理 / 库存盘点</div><h3>库存盘点</h3></div><button type="button" @click="showInventoryForm=false" aria-label="关闭">×</button></div><label>产品<NSelect v-model:value="inventoryForm.productId" filterable :options="inventoryProductOptions" /></label><div class="form-grid"><label>当前库存<NInputNumber v-model:value="inventoryForm.quantity" :min="0" button-placement="both" /></label><label>安全库存<NInputNumber v-model:value="inventoryForm.safetyStock" :min="0" button-placement="both" /></label></div><label>盘点说明<NInput v-model:value="inventoryForm.reason" /></label><div class="modal-actions"><NButton secondary attr-type="button" @click="showInventoryForm=false">取消</NButton><NButton type="primary" attr-type="submit">保存盘点</NButton></div></form></div>
    <div v-if="showPurchaseForm" class="modal-backdrop" @click.self="showPurchaseForm=false"><form class="modal business-form-modal" @submit.prevent="createPurchase"><div class="modal-head"><div><div class="admin-breadcrumb">采购管理 / {{ purchaseForm.id ? '编辑采购单' : '新建采购单' }}</div><h3>{{ purchaseForm.id ? '编辑采购单' : '新建采购单' }}</h3></div><button type="button" @click="showPurchaseForm=false" aria-label="关闭">×</button></div><label>供应商<NInput v-model:value="purchaseForm.supplier" /></label><label>产品<NSelect v-model:value="purchaseForm.productId" filterable :options="inventoryProductOptions" /></label><div class="form-grid"><label>数量<NInputNumber v-model:value="purchaseForm.quantity" :min="1" button-placement="both" /></label><label>状态<NSelect v-model:value="purchaseForm.status" :options="['草稿','已下单','已取消'].map(value=>({label:value,value}))" /></label></div><label>备注<NInput v-model:value="purchaseForm.note" /></label><div class="modal-actions"><NButton secondary attr-type="button" @click="showPurchaseForm=false">取消</NButton><NButton type="primary" attr-type="submit">{{ purchaseForm.id ? '保存修改' : '创建采购单' }}</NButton></div></form></div>
    <div v-if="showPaymentForm" class="modal-backdrop" @click.self="showPaymentForm=false"><form class="modal business-form-modal" @submit.prevent="createPayment"><div class="modal-head"><div><div class="admin-breadcrumb">收款记录 / {{ paymentForm.id ? '编辑收款' : '登记收款' }}</div><h3>{{ paymentForm.id ? '编辑收款记录' : '登记项目收款' }}</h3></div><button type="button" @click="showPaymentForm=false" aria-label="关闭">×</button></div><label>项目<NSelect v-model:value="paymentForm.projectId" filterable :options="projectOptions" /></label><label>关联报价<NSelect v-model:value="paymentForm.quoteId" clearable :options="projectQuoteOptions" /></label><div class="form-grid"><label>金额<NInputNumber v-model:value="paymentForm.amount" :min="0.01" button-placement="both" /></label><label>收款日期<input v-model="paymentForm.paidAt" type="date" class="native-date-input"></label></div><label>方式<NSelect v-model:value="paymentForm.method" :options="['银行卡','微信','支付宝','现金','其他'].map(value=>({label:value,value}))" /></label><label>备注<NInput v-model:value="paymentForm.note" /></label><div class="modal-actions"><NButton secondary attr-type="button" @click="showPaymentForm=false">取消</NButton><NButton type="primary" attr-type="submit">{{ paymentForm.id ? '保存修改' : '保存收款记录' }}</NButton></div></form></div>
    <div v-if="showUserForm" class="modal-backdrop" @click.self="closeUserForm"><form class="modal business-form-modal" @submit.prevent="saveUser"><div class="modal-head"><div><div class="admin-breadcrumb">员工账号 / {{ editingUserId ? '编辑员工' : '新增员工' }}</div><h3>{{ editingUserId ? '编辑员工账号' : '新增员工' }}</h3><p v-if="editingUserId">PIN 留空表示不修改，修改登录账号时必须同时重设 PIN。</p></div><button type="button" @click="closeUserForm" aria-label="关闭">×</button></div><label>姓名<NInput v-model:value="userForm.name" /></label><label>登录账号<NInput v-model:value="userForm.account" /></label><label>手机号<NInput v-model:value="userForm.phone" /></label><label>{{ editingUserId ? '重设 4 位 PIN（留空不修改）' : '4 位 PIN' }}<NInput v-model:value="userForm.pin" type="password" maxlength="4" :placeholder="editingUserId ? '留空表示沿用原 PIN' : '默认 0000'" /></label><div class="form-grid"><label>角色<NSelect v-model:value="userForm.roleId" :options="roleOptions" /></label><label>状态<NSelect v-model:value="userForm.status" :options="['启用','停用'].map(value=>({label:value,value}))" /></label></div><div class="modal-actions"><NButton secondary attr-type="button" @click="closeUserForm">取消</NButton><NButton type="primary" attr-type="submit">{{ editingUserId ? '保存修改' : '创建本地账号' }}</NButton></div></form></div>
    <div v-if="showRoleForm" class="modal-backdrop" @click.self="showRoleForm=false"><form class="modal business-form-modal" @submit.prevent="saveRoleForm"><div class="modal-head"><div><div class="admin-breadcrumb">角色权限 / {{ roleForm.id ? '编辑角色' : '新增角色' }}</div><h3>{{ roleForm.id ? '编辑角色' : '新增角色' }}</h3><p>角色名称不能重复；权限项决定该角色可访问的菜单与操作。</p></div><button type="button" @click="showRoleForm=false" aria-label="关闭">×</button></div><label>角色名称<NInput v-model:value="roleForm.name" placeholder="例如：方案顾问" /></label><label>角色说明<NInput v-model:value="roleForm.description" placeholder="说明该角色的业务职责" /></label><label>权限项<NSelect v-model:value="roleForm.permissions" multiple filterable tag :options="permissionOptions" placeholder="至少选择一项权限" /></label><div class="modal-actions"><NButton secondary attr-type="button" @click="showRoleForm=false">取消</NButton><NButton type="primary" attr-type="submit">{{ roleForm.id ? '保存修改' : '创建角色' }}</NButton></div></form></div>
    <div v-if="showProjectConfigForm" class="modal-backdrop" @click.self="showProjectConfigForm=false"><form class="modal business-form-modal" @submit.prevent="showProjectConfigForm=false"><div class="modal-head"><div><div class="admin-breadcrumb">项目与报价配置 / 编辑配置</div><h3>编辑项目与报价配置</h3></div><button type="button" @click="showProjectConfigForm=false" aria-label="关闭">×</button></div><label>币种<NSelect v-model:value="settings.projectConfig.currency" :options="[{label:'人民币 CNY',value:'CNY'}]" /></label><label>默认税率（%）<NInputNumber v-model:value="settings.projectConfig.taxRate" :min="0" :max="100" /></label><label>报价有效期（天）<NInputNumber v-model:value="settings.projectConfig.quoteValidityDays" :min="1" :max="365" /></label><label class="switch-label"><input v-model="settings.projectConfig.requireDesignVersionBeforeQuote" type="checkbox">生成报价前强制保存设计版本</label><div class="modal-actions"><NButton secondary attr-type="button" @click="showProjectConfigForm=false">取消</NButton><NButton type="primary" attr-type="submit">完成</NButton></div></form></div>
    <AdminConfirmDialog
      :show="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :detail="confirmState.detail"
      :confirm-text="confirmState.confirmText"
      :danger="confirmState.danger"
      @update:show="value => { if (!value) settleConfirm(false) }"
      @confirm="settleConfirm(true)"
    />
  </div>
</template>
