<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { NButton, NConfigProvider, NInput, NInputNumber, NSelect, NTag, zhCN, type GlobalThemeOverrides } from 'naive-ui';
import ProductWorkspace from './admin/ProductWorkspace.vue';
import BusinessWorkspace from './admin/BusinessWorkspace.vue';
import DesignWorkspace from './admin/DesignWorkspace.vue';
import ProjectDetailOverview from './admin/ProjectDetailOverview.vue';
import AdminConfirmDialog from './admin/components/AdminConfirmDialog.vue';
import AdminPagination from './admin/components/AdminPagination.vue';
import AdminPageHeader from './admin/components/AdminPageHeader.vue';
import AdminFilterBar from './admin/components/AdminFilterBar.vue';
import AdminNavIcon from './admin/components/AdminNavIcon.vue';
import AdminBrandMark from './admin/components/AdminBrandMark.vue';
import AdminPageTabs, { type PageTabItem } from './admin/components/AdminPageTabs.vue';
import { queryPage, queryPageSize, readRouteQuery, updateRouteQuery } from './admin/hash-query';

const adminTheme: GlobalThemeOverrides = {
  common: {
    primaryColor: '#0b6cd0',
    primaryColorHover: '#0a5fb8',
    primaryColorPressed: '#084f99',
    primaryColorSuppl: '#0b6cd0',
    borderColor: '#d5d5cf',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  Tag: { borderRadius: '6px' },
  Button: { borderRadiusMedium: '8px', borderRadiusSmall: '6px' },
  Input: { borderRadius: '8px' },
};

type Tab = 'overview' | 'projects' | 'designs' | 'customers' | 'quotes' | 'products' | 'operations' | 'store' | 'settings';
type Customer = { id: string; name: string; phone: string; source: string; note: string; houseType?: string; address?: string; familyMembers?: string; wechat?: string; email?: string };
type ProjectStage = { key: string; name: string; description: string; status: 'done' | 'active' | 'pending' | 'skipped'; completed: number; total: number };
type ProjectTask = { id: string; stageKey: string; title: string; owner: string; dueDate: string; done: boolean };
type ProjectDeliverable = { key: string; title: string; description: string; status: string; action: string; href: string };
type ProjectActivity = { id: string; time: string; operator?: string; operatorAccount?: string; action?: string; target?: string; owner?: string; result?: string; title: string; description: string };
type ProjectPayload = { address: string; houseType: string; budget: number; expectedDeliveryDate: string; manager: string; salesChannel?: string; requirements: string[]; tasks: ProjectTask[]; deliverables: ProjectDeliverable[]; activities: ProjectActivity[] };
type Project = { id: string; name: string; customerId: string | null; customerName: string; customerPhone?: string; customerSource?: string; customerNote?: string; area: number; status: string; schemeType: string; updatedAt: string; progress: number; completedTasks: number; totalTasks: number; currentStage: string; nextTask: string; deadline: string; stages: ProjectStage[]; payload: ProjectPayload };

function normalizeLegacyPath(path: string) {
  if (!path.startsWith('/designs')) return path;
  const projectId = new URLSearchParams(path.split('?')[1] || '').get('project');
  return projectId ? `/projects/${projectId}` : path;
}
const initialPath = normalizeLegacyPath(window.location.hash.slice(1) || '/overview');
if (initialPath !== (window.location.hash.slice(1) || '/overview')) window.history.replaceState(null, '', `#${initialPath}`);
const routePath = ref(initialPath);
const tab = ref<Tab>(routePath.value.startsWith('/products') ? 'products' : routePath.value.startsWith('/projects') ? 'projects' : routePath.value.startsWith('/designs') ? 'designs' : routePath.value.startsWith('/quotes') ? 'quotes' : routePath.value.startsWith('/operations') ? 'operations' : routePath.value.startsWith('/store') ? 'store' : routePath.value.startsWith('/settings') ? 'settings' : 'overview');
const productWorkspace = ref<InstanceType<typeof ProductWorkspace> | null>(null);
const session = ref<any>((() => { try { return JSON.parse(sessionStorage.getItem('qone-admin-session') || 'null'); } catch { return null; } })());
const loginForm = ref({ account: 'admin', pin: '0000' });
const loginError = ref('');
const loggingIn = ref(false);
const projectDetail = ref<Project | null>(null);
const projectLoading = ref(false);
// 项目详情里的“关联方案 / 关联报价”：直接读 designs 与 quotes 两张表，不在项目 JSON 里复制一份。
const projectLinks = ref<{ designs: any[]; quotes: any[] }>({ designs: [], quotes: [] });
const projectLinksLoading = ref(false);
// 项目资料计数：设计版本 / 项目文件 / 交付包并入顶部项目信息，避免在下方再开一个“设计与交付”抬头。
const projectStats = ref({ designs: 0, versions: 0, quotes: 0, files: 0, packages: 0 });
const savingTask = ref('');
let approvedPath = '';
const cleanRoutePath = computed(() => routePath.value.split('?')[0]);
const projectIdFromPath = computed(() => /^\/projects\/([^/]+)$/.exec(cleanRoutePath.value)?.[1] || '');

// 项目动态：接口最多返回 30 条，按页展示，避免把项目页拉到很长。
const activityPage = ref(1);
const activityPageSize = ref(10);
const activityList = computed(() => projectDetail.value?.payload.activities || []);
const activityPageCount = computed(() => Math.max(1, Math.ceil(activityList.value.length / activityPageSize.value)));
const pagedActivities = computed(() => {
  const start = (activityPage.value - 1) * activityPageSize.value;
  return activityList.value.slice(start, start + activityPageSize.value);
});
const activityTodayCount = computed(() => {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return activityList.value.filter(item => new Date(item.time).getTime() >= dayStart).length;
});
const activityWeekCount = computed(() => {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return activityList.value.filter(item => new Date(item.time).getTime() >= cutoff).length;
});
function changeActivityPage(value: number) { activityPage.value = value; }
function changeActivityPageSize(value: number) { activityPageSize.value = value; activityPage.value = 1; }
watch(activityList, () => { if (activityPage.value > activityPageCount.value) activityPage.value = activityPageCount.value; });

// 页面标签：后台是多页面并行的工作台，项目详情 → 设计方案 → 报价单来回切换时
// 不应该每次重建导航路径。标签只保存“页面身份 + 最近一次完整路径”，不复制业务数据。
const PAGE_TABS_KEY = 'qone-admin-page-tabs';
const MAX_PAGE_TABS = 10;
const moduleTitles: Record<string, string> = {
  overview: '工作台', projects: '客户项目', designs: '设计方案', customers: '客户管理',
  quotes: '报价中心', products: '产品管理', operations: '经营管理', store: '店铺管理', settings: '系统设置',
};
const pageTitleRules: Array<[RegExp, string]> = [
  [/^\/overview$/, '工作台'],
  [/^\/projects$/, '客户项目'],
  [/^\/projects\/[^/]+$/, '项目详情'],
  [/^\/designs$/, '设计方案'],
  [/^\/designs\/[^/]+$/, '设计方案详情'],
  [/^\/customers$/, '客户管理'],
  [/^\/quotes$/, '报价单列表'],
  [/^\/quotes\/templates$/, '报价模板配置'],
  [/^\/quotes\/templates\/new$/, '报价模板'],
  [/^\/quotes\/new$/, '新建报价单'],
  [/^\/quotes\/new\/quick$/, '快速报价'],
  [/^\/quotes\/new\/manual$/, '手动选品报价'],
  [/^\/quotes\/new\/design$/, '按设计方案报价'],
  [/^\/quotes\/[^/]+\/edit$/, '编辑报价单'],
  [/^\/quotes\/[^/]+$/, '报价单详情'],
  [/^\/products$/, '产品库'],
  [/^\/products\/new$/, '新增产品'],
  [/^\/products\/categories$/, '产品分类'],
  [/^\/products\/[^/]+\/edit$/, '编辑产品'],
  [/^\/products\/[^/]+$/, '产品详情'],
  [/^\/operations\/inventory$/, '库存管理'],
  [/^\/operations\/purchase$/, '采购管理'],
  [/^\/operations\/payments$/, '收款记录'],
  [/^\/store\/profile$/, '门店资料'],
  [/^\/store\/staff$/, '员工账号'],
  [/^\/store\/roles$/, '角色权限'],
  [/^\/settings\/pricing$/, '报价与费用'],
  [/^\/settings\/project-journey$/, '项目阶段与任务'],
  [/^\/settings\/devices$/, '默认设备'],
  [/^\/settings\/construction$/, '施工模板'],
  [/^\/settings\/backup$/, '数据备份'],
  [/^\/settings\/audit$/, '操作审计'],
];
function pageTabKey(path: string) {
  return path.split('?')[0].replace(/\/+$/, '') || '/overview';
}
function resolvePageTitle(path: string) {
  const key = pageTabKey(path);
  if (key === '/quotes/templates/new') {
    return new URLSearchParams(path.split('?')[1] || '').get('id') ? '编辑报价模板' : '新建报价模板';
  }
  const matched = pageTitleRules.find(([pattern]) => pattern.test(key));
  if (matched) return matched[1];
  return moduleTitles[key.split('/')[1] || 'overview'] || '工作台';
}
function readStoredPageTabs(): PageTabItem[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PAGE_TABS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed
      .filter((item: any) => item && typeof item.key === 'string' && item.key.startsWith('/') && typeof item.path === 'string' && item.path.startsWith('/'))
      .map((item: any) => {
        const key = pageTabKey(item.key);
        return {
          key,
          path: item.path,
          title: typeof item.title === 'string' && item.title.trim() ? item.title.trim().slice(0, 80) : resolvePageTitle(item.key),
          pinned: key === '/overview',
        };
      })
      .filter((item: PageTabItem) => {
        if (seen.has(item.key)) return false;
        seen.add(item.key);
        return true;
      })
      .slice(0, MAX_PAGE_TABS);
  } catch {
    return [];
  }
}
function persistPageTabs() {
  try { sessionStorage.setItem(PAGE_TABS_KEY, JSON.stringify(pageTabs.value)); } catch { /* 隐私模式下不阻塞页面 */ }
}
function ensureHomeTab() {
  const home = pageTabs.value.find(item => item.key === '/overview');
  if (home) { home.pinned = true; return; }
  pageTabs.value.unshift({ key: '/overview', path: '/overview', title: '工作台', pinned: true });
}
function openPageTab(path: string) {
  if (!session.value) return;
  const key = pageTabKey(path);
  const next = (key.split('/')[1] || 'overview') as Tab;
  if (!hasTabAccess(next)) return;
  const existing = pageTabs.value.find(item => item.key === key);
  if (existing) {
    existing.path = path;
    persistPageTabs();
    return;
  }
  const removableCount = pageTabs.value.filter(item => !item.pinned).length;
  if (removableCount >= MAX_PAGE_TABS - 1) {
    const activeKey = pageTabKey(routePath.value);
    const removable = pageTabs.value.findIndex(item => !item.pinned && item.key !== activeKey);
    if (removable >= 0) pageTabs.value.splice(removable, 1);
  }
  const tab: PageTabItem = { key, path, title: resolvePageTitle(path), pinned: key === '/overview' };
  if (tab.pinned) pageTabs.value.unshift(tab);
  else pageTabs.value.push(tab);
  persistPageTabs();
}
function setPageTitle(title: string, key = pageTabKey(routePath.value)) {
  const text = String(title || '').trim().slice(0, 80);
  if (!text) return;
  const item = pageTabs.value.find(entry => entry.key === key);
  if (!item || item.title === text) return;
  item.title = text;
  persistPageTabs();
}
function handlePageTitle(payload: string | { title: string; path?: string }) {
  if (typeof payload === 'string') { setPageTitle(payload); return; }
  if (!payload?.title) return;
  setPageTitle(payload.title, pageTabKey(payload.path || routePath.value));
}
function resetPageTabs() {
  pageTabs.value = [];
  try { sessionStorage.removeItem(PAGE_TABS_KEY); } catch { /* 隐私模式下忽略 */ }
}
const pageTabs = ref<PageTabItem[]>(session.value ? readStoredPageTabs() : []);
if (session.value) ensureHomeTab();
const activePageTabKey = computed(() => pageTabKey(routePath.value));
function activatePageTab(item: PageTabItem) { navigatePath(item.path); }
async function closePageTab(item: PageTabItem) {
  if (item.pinned) return;
  const index = pageTabs.value.findIndex(tab => tab.key === item.key);
  if (index < 0) return;
  if (item.key !== activePageTabKey.value) {
    pageTabs.value.splice(index, 1);
    persistPageTabs();
    return;
  }
  const rest = pageTabs.value.filter(tab => tab.key !== item.key);
  const next = rest[index] || rest[index - 1] || rest[0];
  if (!next) { pageTabs.value = rest; persistPageTabs(); return; }
  // 先走统一导航（含产品未保存确认），用户取消时标签保持原状。
  if (!await navigatePath(next.path)) return;
  pageTabs.value = pageTabs.value.filter(tab => tab.key !== item.key);
  persistPageTabs();
}
function closeOtherPageTabs() {
  pageTabs.value = pageTabs.value.filter(tab => tab.pinned || tab.key === activePageTabKey.value);
  persistPageTabs();
}
// 详情页的标题来自对象本身；项目详情在 AdminApp 内加载，方案/报价/产品由子组件回传。
watch(projectDetail, project => {
  if (project) setPageTitle(`项目 · ${project.name}`, `/projects/${project.id}`);
});

function applyPath(path: string) {
  const normalizedPath = normalizeLegacyPath(path);
  error.value = '';
  showCustomerForm.value = false;
  showProjectForm.value = false;
  showProjectEdit.value = false;
  const key = normalizedPath.split('?')[0].split('/')[1] as Tab;
  const next = ['overview', 'projects', 'designs', 'customers', 'quotes', 'products', 'operations', 'store', 'settings'].includes(key) ? key : 'overview';
  tab.value = hasTabAccess(next) ? next : 'overview';
  syncOpenGroups();
  const query = readRouteQuery(normalizedPath);
  if (next === 'projects') {
    projectSearch.value = query.get('search') || '';
    projectPage.value = queryPage(query.get('page'));
    projectPageSize.value = queryPageSize(query.get('pageSize'));
  }
  if (next === 'customers') {
    customerSearch.value = query.get('search') || '';
    customerPage.value = queryPage(query.get('page'));
    customerPageSize.value = queryPageSize(query.get('pageSize'));
  }
  openPageTab(normalizedPath);
  routePath.value = normalizedPath;
  window.scrollTo({ top: 0 });
}
async function navigatePath(path: string): Promise<boolean> {
  const next = (path.split('?')[0].split('/')[1] || 'overview') as Tab;
  // 登录前直接打开受保护路由时，URL 可能已正确但 tab 仍停在 overview；
  // 此时点击同一路径也要重新应用路由，不能因为 path 相同而吞掉点击。
  if (path === routePath.value && tab.value === next) return true;
  if (!hasTabAccess(next)) { notify('当前角色没有访问该模块的权限'); return false; }
  if (tab.value === 'products' && productWorkspace.value && !await productWorkspace.value.confirmLeave()) return false;
  approvedPath = path;
  window.location.hash = path;
  return true;
}
function openDesignWorkbench(designId: string) {
  window.location.href = `/app/?design=${encodeURIComponent(designId)}&restore=1`;
}
// 一个项目可以有多套方案：标题区「继续设计」进入最近更新的方案，没有方案时先确保有一个（自动命名）。
async function continueProjectDesign(projectId: string) {
  const design = projectLinks.value.designs[0];
  if (design) { openDesignWorkbench(design.id); return; }
  try {
    const created = await api<any>(`/api/admin/projects/${encodeURIComponent(projectId)}/design`, { method: 'POST' });
    await loadProjectLinks();
    notify(`已创建设计方案：${created.name}`);
    openDesignWorkbench(created.id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '创建设计方案失败';
  }
}
async function loadProjectLinks() {
  const projectId = projectIdFromPath.value;
  if (!projectId) { projectLinks.value = { designs: [], quotes: [] }; return; }
  projectLinksLoading.value = true;
  try {
    const [designData, quoteData, packageData, fileData] = await Promise.all([
      api<{ designs: any[] }>(`/api/admin/designs?page=1&pageSize=100&status=全部&projectId=${encodeURIComponent(projectId)}`),
      api<{ quotes: any[] }>(`/api/admin/quotes?projectId=${encodeURIComponent(projectId)}`),
      api<{ packages: any[] }>(`/api/admin/delivery-packages?projectId=${encodeURIComponent(projectId)}`),
      api<{ attachments: any[] }>(`/api/admin/projects/${encodeURIComponent(projectId)}/attachments`),
    ]);
    const designs = designData.designs || [];
    const quotes = quoteData.quotes || [];
    projectLinks.value = { designs, quotes };
    projectStats.value = {
      designs: designs.length,
      versions: designs.reduce((sum, design) => sum + Number(design.versionCount || 0), 0),
      quotes: quotes.length,
      files: (fileData.attachments || []).length,
      packages: (packageData.packages || []).length,
    };
  } catch {
    projectLinks.value = { designs: [], quotes: [] };
    projectStats.value = { designs: 0, versions: 0, quotes: 0, files: 0, packages: 0 };
  } finally {
    projectLinksLoading.value = false;
  }
}
// 项目内新建方案：跳到设计方案列表并直接打开建档弹窗，名称由用户确认（支持同一项目多方案）。
function openProjectDesignForm(projectId: string) {
  navigatePath(`/designs?projectId=${encodeURIComponent(projectId)}&new=1`);
}
function openProjectQuote(projectId: string) {
  // 有设计版本时优先走“按设计方案报价”，没有才回到报价方式选择页。
  const hasVersion = projectLinks.value.designs.some(design => Number(design.latestVersionNo || 0) > 0);
  navigatePath(hasVersion ? `/quotes/new/design?project=${projectId}` : `/quotes/new?project=${projectId}`);
}
// 复制项目属于低频动作，入口在项目标题区「更多」；复制后直接进入新项目，保持与设计交付页一致的行为。
async function copyCurrentProject() {
  if (!projectDetail.value) return;
  try {
    const created = await api<any>(`/api/admin/projects/${encodeURIComponent(projectDetail.value.id)}/copy`, {
      method: 'POST',
      body: JSON.stringify({ copyDesign: true }),
    });
    await loadAll();
    notify(`已复制项目：${created.name}`);
    navigatePath(`/projects/${created.id}`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '复制项目失败';
  }
}
async function loadCurrentProject() {
  if (!projectIdFromPath.value) { projectDetail.value = null; return; }
  activityPage.value = 1;
  projectLoading.value = true;
  try { projectDetail.value = await api<Project>(`/api/admin/projects/${encodeURIComponent(projectIdFromPath.value)}`); }
  catch (e) { projectDetail.value = null; error.value = e instanceof Error ? e.message : '项目详情加载失败'; }
  finally { projectLoading.value = false; }
  await loadProjectLinks();
}
async function onHashChange() {
  const rawPath = window.location.hash.slice(1) || '/overview';
  const next = normalizeLegacyPath(rawPath);
  if (next !== rawPath) window.history.replaceState(null, '', `#${next}`);
  if (next === routePath.value) return;
  if (approvedPath !== next && tab.value === 'products' && productWorkspace.value && !await productWorkspace.value.confirmLeave()) { window.history.replaceState(null, '', `#${routePath.value}`); return; }
  approvedPath = '';
  applyPath(next);
  if (session.value) await Promise.all([loadProjectPage(), loadCustomerPage()]);
  await loadCurrentProject();
}

async function productChanged() { overview.value = await api<typeof overview.value>('/api/admin/overview'); }
async function businessChanged() { await loadAll(); await loadCurrentProject(); }
async function designChanged() { overview.value = await api<typeof overview.value>('/api/admin/overview'); }
const loading = ref(true);
const toast = ref('');
const error = ref('');
const overview = ref({ customers: 0, projects: 0, products: 0, pendingProjects: 0, quotes: 0, designs: 0, designVersions: 0, deliveryPackages: 0, storage: '' });
const customers = ref<Customer[]>([]);
const projects = ref<Project[]>([]);
const customerSearch = ref('');
const projectSearch = ref('');
const projectPage = ref(1);
const projectPageSize = ref(30);
const projectTotal = ref(0);
const pagedProjects = ref<Project[]>([]);
const customerPage = ref(1);
const customerPageSize = ref(30);
const customerTotal = ref(0);
const pagedCustomers = ref<Customer[]>([]);
const confirmLogout = ref(false);
const showCustomerForm = ref(false);
const editingCustomerId = ref('');
const showProjectForm = ref(false);
const showProjectEdit = ref(false);
const customerForm = ref({ name: '', phone: '', source: '门店到店', note: '', houseType: '', address: '', familyMembers: '', wechat: '', email: '' });
const projectForm = ref({ name: '', customerId: '', area: 120, status: '待设计', schemeType: '全屋智能', address: '', houseType: '三室两厅', budget: 100000, expectedDeliveryDate: '', manager: '演示门店 · 方案顾问', salesChannel: '门店到店', requirementsText: '智能灯光、全屋网络、窗帘与场景控制' });
const projectEditForm = ref<any>({});
const savingCustomer = ref(false);
const savingProject = ref(false);
const customerOptions = computed(() => [{ label: '暂不关联客户', value: '' }, ...customers.value.map(item => ({ label: `${item.name} · ${item.phone || '未填写电话'}`, value: item.id }))]);
const sourceOptions = ['门店到店', '老客转介绍', '线上咨询', '设计师渠道', '其他'].map(value => ({ label: value, value }));
const houseTypeOptions = ['三室两厅', '大平层', '别墅', '复式', '商业空间'].map(value => ({ label: value, value }));
const schemeTypeOptions = ['全屋智能', '灯光智能化', '影音娱乐', '网络与安防'].map(value => ({ label: value, value }));
const channelOptions = ['门店到店', '老客转介绍', '线上咨询', '设计师渠道'].map(value => ({ label: value, value }));
type NavIcon = 'overview' | 'projects' | 'designs' | 'customers' | 'quotes' | 'products' | 'operations' | 'store' | 'settings';
type NavItem = { key: Tab; label: string; icon: NavIcon; children?: Array<{ label: string; path: string }> };
// 设计方案是独立对象：可挂客户项目，也可完全脱离项目单独存在，因此在导航中与客户项目平级。
const nav: NavItem[] = [
  { key: 'overview', label: '工作台', icon: 'overview' },
  { key: 'projects', label: '客户项目', icon: 'projects' },
  { key: 'designs', label: '设计方案', icon: 'designs' },
  { key: 'customers', label: '客户管理', icon: 'customers' },
  { key: 'quotes', label: '报价中心', icon: 'quotes', children: [
    { label: '报价单列表', path: '/quotes' },
    { label: '报价模板配置', path: '/quotes/templates' },
  ] },
  { key: 'products', label: '产品管理', icon: 'products', children: [
    { label: '产品库', path: '/products' },
    { label: '产品分类', path: '/products/categories' },
  ] },
  { key: 'operations', label: '经营管理', icon: 'operations', children: [
    { label: '库存管理', path: '/operations/inventory' },
    { label: '采购管理', path: '/operations/purchase' },
    { label: '收款记录', path: '/operations/payments' },
  ] },
  { key: 'store', label: '店铺管理', icon: 'store', children: [
    { label: '门店资料', path: '/store/profile' },
    { label: '员工账号', path: '/store/staff' },
    { label: '角色权限', path: '/store/roles' },
  ] },
  { key: 'settings', label: '系统设置', icon: 'settings', children: [
    { label: '报价与费用', path: '/settings/pricing' },
    { label: '项目阶段与任务', path: '/settings/project-journey' },
    { label: '默认设备', path: '/settings/devices' },
    { label: '施工模板', path: '/settings/construction' },
    { label: '数据备份', path: '/settings/backup' },
    { label: '操作审计', path: '/settings/audit' },
  ] },
];
const tabPermission: Partial<Record<Tab,string>> = { projects:'project.read', designs:'design.read', customers:'customer.read', quotes:'quote.read', products:'product.read', operations:'operations.read', store:'store.read', settings:'settings.read' };
function hasPermission(permission = '') {
  if (!permission || permission === 'overview') return true;
  const permissions = Array.isArray(session.value?.permissions) ? session.value.permissions : [];
  return permissions.includes('*') || permissions.includes(permission) || (permission.endsWith('.read') && permissions.includes(permission.replace('.read','.write')));
}
function hasTabAccess(key: Tab) { return key === 'overview' || hasPermission(tabPermission[key] || ''); }
const childTab = (path: string) => (path.split('?')[0].split('/')[1] || 'overview') as Tab;
const hasNavAccess = (item: NavItem) => hasTabAccess(item.key) || Boolean(item.children?.some(child => hasTabAccess(childTab(child.path))));
const visibleNav = computed(() => nav.filter(hasNavAccess));
const currentTitle = computed(() => {
  if (projectIdFromPath.value) return '项目详情';
  if (cleanRoutePath.value.startsWith('/designs/')) return '设计方案详情';
  if (cleanRoutePath.value.startsWith('/quotes/new')) return '新建报价单';
  if (cleanRoutePath.value.startsWith('/quotes/templates')) return '报价模板配置';
  return nav.find(item => item.key === tab.value)?.label ?? '工作台';
});
function isSubNavActive(path: string) {
  if (path === '/projects') return cleanRoutePath.value === '/projects' || (cleanRoutePath.value.startsWith('/projects/') );
  if (path === '/designs') return cleanRoutePath.value === '/designs' || cleanRoutePath.value.startsWith('/designs/');
  if (path === '/quotes') return cleanRoutePath.value === '/quotes' || cleanRoutePath.value.startsWith('/quotes/new');
  if (path === '/quotes/templates') return cleanRoutePath.value.startsWith('/quotes/templates');
  if (path === '/products') return cleanRoutePath.value === '/products' || (cleanRoutePath.value.startsWith('/products/') && !cleanRoutePath.value.startsWith('/products/categories'));
  if (path === '/products/categories') return cleanRoutePath.value.startsWith('/products/categories');
  if (path.startsWith('/operations/')) return cleanRoutePath.value === path;
  if (path.startsWith('/store/')) return cleanRoutePath.value === path || (path === '/store/profile' && cleanRoutePath.value === '/store');
  if (path.startsWith('/settings/')) return cleanRoutePath.value === path || (path === '/settings/pricing' && cleanRoutePath.value === '/settings');
  return cleanRoutePath.value === path;
}
function hasActiveChild(item: { children?: Array<{ path: string }> }) {
  return !!item.children?.some(child => isSubNavActive(child.path));
}
const openGroups = ref<Record<string, boolean>>({});
function syncOpenGroups() {
  const active = nav.find(item => item.children?.some(child => childTab(child.path) === tab.value));
  openGroups.value = active ? { [active.key]: true } : {};
}
function toggleNavGroup(key: Tab) {
  const item = nav.find(entry => entry.key === key);
  const first = (item?.children || []).find(child => hasTabAccess(childTab(child.path)))?.path;
  if (window.matchMedia('(max-width: 767px)').matches) {
    if (first) navigatePath(first);
    return;
  }
  if (openGroups.value[key]) {
    openGroups.value = {};
    return;
  }
  openGroups.value = { [key]: true };
  const hasActiveChild = (item?.children || []).some(child => isSubNavActive(child.path));
  if (first && !hasActiveChild) navigatePath(first);
}
const recentProjects = computed(() => projects.value.slice(0, 4));
const date = (value: string) => value ? new Date(value).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '—';
const fullDate = (value: string) => value ? new Date(value).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—';
const activityTime = (value: string) => {
  if (!value) return '—';
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return '—';
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())} ${pad(time.getHours())}:${pad(time.getMinutes())}`;
};
// 老数据只有 title / description，这里按文案兜底推断操作功能，避免列表出现空列。
const activityActionRules: Array<[RegExp, string]> = [
  [/复制/, '项目复制'],
  [/建档|创建/, '项目建档'],
  [/已完成|重新打开|任务|阶段/, '任务流转'],
];
// 操作人 = 登录账号（员工名）：admin（门店管理员）。老记录只有员工名，则只显示员工名。
const activityOperator = (item: ProjectActivity) => {
  const name = item.operator?.trim() || '';
  const account = item.operatorAccount?.trim() || '';
  if (!name && !account) return '未记录';
  if (!account) return name;
  if (account === name) return name;
  return `${account}（${name}）`;
};
// 早于「账号留痕」的历史记录没有 operator 字段，不能伪装成「系统」操作。
const activityOperatorMissing = (item: ProjectActivity) => !item.operator?.trim() && !item.operatorAccount?.trim();
const activityAction = (item: ProjectActivity) => {
  if (item.action?.trim()) return item.action;
  const text = `${item.title || ''}${item.description || ''}`;
  return activityActionRules.find(([pattern]) => pattern.test(text))?.[1] || '项目操作';
};
// 操作对象 / 操作结果：新记录直接读字段；旧记录从「已完成：任务名」这类标题里拆出来。
function splitActivityTitle(item: ProjectActivity) {
  const title = item.title || '';
  const matched = /^(已完成|重新打开|已创建|已复制)[:：]\s*(.*)$/.exec(title);
  if (matched) return { result: matched[1], target: matched[2] || '—' };
  if (/复制/.test(title)) return { result: '已复制', target: (item.description || '').replace(/^来源项目：/, '') || '历史项目' };
  if (/建档|创建/.test(title)) return { result: '已创建', target: '项目档案' };
  return { result: '已记录', target: title || '—' };
}
const activityTarget = (item: ProjectActivity) => item.target?.trim() || splitActivityTitle(item).target;
const activityResult = (item: ProjectActivity) => item.result?.trim() || splitActivityTitle(item).result;
// 任务负责角色：只是角色的归属说明（设计师 / 方案顾问 / 导购），不是具体某个人，
// 所以贴在「操作对象」后面做标签，绝不单独占一列去和「操作人」并列。
const activityRole = (item: ProjectActivity) => {
  if (item.owner?.trim()) return item.owner.trim();
  return /^(.+?)更新了项目阶段任务/.exec(item.description || '')?.[1] || '';
};
// 行悬停提示：不再复用会让人误解「谁操作的」的旧描述。
const activityHint = (item: ProjectActivity) => {
  const role = activityRole(item);
  if (role) return `任务负责角色：${role}`;
  return (item.description || '').trim();
};
const money = (value: number) => `¥${Number(value || 0).toLocaleString('zh-CN')}`;

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = options?.body == null ? {} : { 'content-type': 'application/json' };
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options?.headers as Record<string, string> || {}) } });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && url !== '/api/admin/login') {
    sessionStorage.removeItem('qone-admin-session');
    session.value = null;
    resetPageTabs();
  }
  if (!response.ok) throw new Error(body.error || body.message || `请求失败 ${response.status}`);
  return body;
}
const branding = ref({ storeName: '', storeCode: '', logoUrl: '' });
const logoBroken = ref(false);
const brandLogoUrl = computed(() => logoBroken.value ? '' : branding.value.logoUrl);
function applyFavicon(url: string) {
  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  link.href = url || 'data:,';
}
async function loadBranding() {
  try {
    const data = await api<{ storeName?: string; storeCode?: string; logoUrl?: string }>('/api/admin/branding');
    branding.value = { storeName: data.storeName || '', storeCode: data.storeCode || '', logoUrl: data.logoUrl || '' };
    logoBroken.value = false;
    applyFavicon(branding.value.logoUrl);
  } catch {
    // 品牌标识读取失败时保持默认图标，不阻塞登录或业务数据加载。
    applyFavicon('');
  }
}
function notify(message: string) { toast.value = message; window.setTimeout(() => { if (toast.value === message) toast.value = ''; }, 2600); }
function authExpired() {
  sessionStorage.removeItem('qone-admin-session');
  session.value = null;
  resetPageTabs();
  loginError.value = '登录已失效，请重新登录';
}
async function login() {
  loggingIn.value = true; loginError.value = '';
  try {
    session.value = await api('/api/admin/login', { method:'POST', body:JSON.stringify(loginForm.value) });
    sessionStorage.setItem('qone-admin-session', JSON.stringify(session.value));
    // 换账号后不沿用上一个账号的页面标签，避免出现无权限页面。
    resetPageTabs();
    ensureHomeTab();
    persistPageTabs();
    const currentTab = (routePath.value.split('?')[0].split('/')[1] || 'overview') as Tab;
    if (!hasTabAccess(currentTab)) { approvedPath='/overview'; window.location.hash='/overview'; applyPath('/overview'); }
    else applyPath(routePath.value);
    await loadAll(); await loadCurrentProject();
    notify(`欢迎回来，${session.value.name}`);
  }
  catch (e) { loginError.value = e instanceof Error ? e.message : '登录失败'; }
  finally { loggingIn.value = false; }
}
function requestLogout() { confirmLogout.value = true; }
async function logout() {
  confirmLogout.value = false;
  try { await fetch('/api/admin/logout', { method: 'POST' }); } catch { /* 本地服务退出时仍清除前端会话 */ }
  sessionStorage.removeItem('qone-admin-session'); session.value = null;
  resetPageTabs();
}
async function loadProjectPage(reset = false) {
  if (reset) projectPage.value = 1;
  const data = await api<{ projects: Project[]; total: number }>(`/api/admin/projects?search=${encodeURIComponent(projectSearch.value)}&page=${projectPage.value}&pageSize=${projectPageSize.value}`);
  pagedProjects.value = data.projects;
  projectTotal.value = data.total;
}
async function loadCustomerPage(reset = false) {
  if (reset) customerPage.value = 1;
  const data = await api<{ customers: Customer[]; total: number }>(`/api/admin/customers?search=${encodeURIComponent(customerSearch.value)}&page=${customerPage.value}&pageSize=${customerPageSize.value}`);
  pagedCustomers.value = data.customers;
  customerTotal.value = data.total;
}
async function loadAll() {
  loading.value = true;
  error.value = '';
  try {
    await loadBranding();
    const [o, c, p] = await Promise.all([api<typeof overview.value>('/api/admin/overview'), api<{ customers: Customer[] }>('/api/admin/customers'), api<{ projects: Project[] }>('/api/admin/projects')]);
    overview.value = o; customers.value = c.customers; projects.value = p.projects;
    await Promise.all([loadProjectPage(), loadCustomerPage()]);
  } catch (e) { error.value = e instanceof Error ? e.message : '后台数据加载失败'; }
  finally { loading.value = false; }
}
async function queryCustomers() {
  customerPage.value = 1;
  updateRouteQuery({ page: 1, pageSize: customerPageSize.value, search: customerSearch.value || null });
  try { await loadCustomerPage(true); }
  catch (e) { error.value = e instanceof Error ? e.message : '客户列表读取失败'; }
}
async function queryProjects() {
  projectPage.value = 1;
  updateRouteQuery({ page: 1, pageSize: projectPageSize.value, search: projectSearch.value || null });
  try { await loadProjectPage(true); }
  catch (e) { error.value = e instanceof Error ? e.message : '项目列表读取失败'; }
}
async function changeProjectPage(page: number) {
  projectPage.value = page;
  updateRouteQuery({ page, pageSize: projectPageSize.value, search: projectSearch.value || null });
  try { await loadProjectPage(); }
  catch (e) { error.value = e instanceof Error ? e.message : '项目列表读取失败'; }
}
async function changeProjectPageSize(size: number) {
  projectPageSize.value = size;
  projectPage.value = 1;
  updateRouteQuery({ page: 1, pageSize: size, search: projectSearch.value || null });
  try { await loadProjectPage(); }
  catch (e) { error.value = e instanceof Error ? e.message : '项目列表读取失败'; }
}
async function changeCustomerPage(page: number) {
  customerPage.value = page;
  updateRouteQuery({ page, pageSize: customerPageSize.value, search: customerSearch.value || null });
  try { await loadCustomerPage(); }
  catch (e) { error.value = e instanceof Error ? e.message : '客户列表读取失败'; }
}
async function changeCustomerPageSize(size: number) {
  customerPageSize.value = size;
  customerPage.value = 1;
  updateRouteQuery({ page: 1, pageSize: size, search: customerSearch.value || null });
  try { await loadCustomerPage(); }
  catch (e) { error.value = e instanceof Error ? e.message : '客户列表读取失败'; }
}
function openCustomerForm(customer?: Customer) {
  editingCustomerId.value = customer?.id || '';
  customerForm.value = customer ? {
    name: customer.name || '', phone: customer.phone || '', source: customer.source || '门店到店', note: customer.note || '',
    houseType: customer.houseType || '', address: customer.address || '', familyMembers: customer.familyMembers || '', wechat: customer.wechat || '', email: customer.email || '',
  } : { name: '', phone: '', source: '门店到店', note: '', houseType: '', address: '', familyMembers: '', wechat: '', email: '' };
  showCustomerForm.value = true;
}
async function createCustomer() {
  if (savingCustomer.value) return;
  savingCustomer.value = true;
  try {
    const editingId = editingCustomerId.value;
    await api(editingId ? `/api/admin/customers/${encodeURIComponent(editingId)}` : '/api/admin/customers', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(customerForm.value) });
    showCustomerForm.value = false;
    customerForm.value = { name: '', phone: '', source: '门店到店', note: '', houseType: '', address: '', familyMembers: '', wechat: '', email: '' };
    editingCustomerId.value = '';
    notify(editingId ? '客户资料已更新' : '客户已保存');
    await loadAll();
    navigatePath('/customers');
  } catch (e) { error.value = e instanceof Error ? e.message : '客户保存失败'; }
  finally { savingCustomer.value = false; }
}
async function createProject() {
  if (savingProject.value) return;
  savingProject.value = true;
  try {
    const payload = { ...projectForm.value, requirements: projectForm.value.requirementsText.split(/[、,，]/).map(item=>item.trim()).filter(Boolean) };
    const created = await api<Project>('/api/admin/projects', { method: 'POST', body: JSON.stringify(payload) });
    showProjectForm.value = false; projectForm.value = { name: '', customerId: '', area: 120, status: '待设计', schemeType: '全屋智能', address: '', houseType: '三室两厅', budget: 100000, expectedDeliveryDate: '', manager: '演示门店 · 方案顾问', salesChannel: '门店到店', requirementsText: '智能灯光、全屋网络、窗帘与场景控制' };
    notify('项目已创建，已生成默认阶段任务'); await loadAll(); navigatePath(`/projects/${created.id}`);
  } catch (e) { error.value = e instanceof Error ? e.message : '项目保存失败'; }
  finally { savingProject.value = false; }
}
function openProjectEdit() {
  if (!projectDetail.value) return;
  projectEditForm.value = { name:projectDetail.value.name, customerId:projectDetail.value.customerId || '', area:projectDetail.value.area, schemeType:projectDetail.value.schemeType, address:projectDetail.value.payload.address, houseType:projectDetail.value.payload.houseType, budget:projectDetail.value.payload.budget, expectedDeliveryDate:projectDetail.value.payload.expectedDeliveryDate, manager:projectDetail.value.payload.manager, salesChannel:projectDetail.value.payload.salesChannel || '门店到店', requirementsText:projectDetail.value.payload.requirements.join('、') };
  showProjectEdit.value = true;
}
async function saveProjectEdit() {
  if (!projectDetail.value) return;
  if (savingProject.value) return;
  savingProject.value = true;
  try {
    const form = projectEditForm.value;
    projectDetail.value = await api<Project>(`/api/admin/projects/${encodeURIComponent(projectDetail.value.id)}`, { method:'PUT', body:JSON.stringify({ name:form.name, customerId:form.customerId, area:form.area, schemeType:form.schemeType, payload:{ address:form.address, houseType:form.houseType, budget:form.budget, expectedDeliveryDate:form.expectedDeliveryDate, manager:form.manager, salesChannel:form.salesChannel, requirements:String(form.requirementsText||'').split(/[、,，]/).map((item:string)=>item.trim()).filter(Boolean) } }) });
    showProjectEdit.value=false; await loadAll(); notify('项目资料已更新');
  } catch (e) { error.value = e instanceof Error ? e.message : '项目资料保存失败'; }
  finally { savingProject.value = false; }
}
async function toggleProjectTask(task: ProjectTask, done: boolean) {
  if (!projectDetail.value || savingTask.value) return;
  savingTask.value = task.id;
  try {
    projectDetail.value = await api<Project>(`/api/admin/projects/${encodeURIComponent(projectDetail.value.id)}`, { method: 'PUT', body: JSON.stringify({ task: { id: task.id, done } }) });
    projects.value = projects.value.map(item => item.id === projectDetail.value?.id ? projectDetail.value : item) as Project[];
    overview.value = await api<typeof overview.value>('/api/admin/overview');
    notify(done ? '任务已完成，项目进度已更新' : '任务已重新打开');
  } catch (e) { error.value = e instanceof Error ? e.message : '项目进度保存失败'; }
  finally { savingTask.value = ''; }
}
async function downloadBackup() {
  try { const data = await api('/api/admin/backup'); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `smart-home-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); notify('本地备份已导出'); }
  catch (e) { error.value = e instanceof Error ? e.message : '备份导出失败'; }
}
onMounted(async () => {
  applyPath(routePath.value);
  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('qone-auth-expired', authExpired);
  if (session.value) { await loadAll(); await loadCurrentProject(); }
  else { await loadBranding(); loading.value = false; }
});
onBeforeUnmount(() => { window.removeEventListener('hashchange', onHashChange); window.removeEventListener('qone-auth-expired', authExpired); });
</script>

<template>
  <NConfigProvider :locale="zhCN" :theme-overrides="adminTheme">
  <div v-if="!session" class="login-screen"><form class="login-card" @submit.prevent="login"><div class="login-brand"><img v-if="brandLogoUrl" class="login-brand-logo" :src="brandLogoUrl" :alt="`${branding.storeName || '门店'} LOGO`" @error="logoBroken = true"><span v-else><AdminBrandMark /></span><div><b>QoneHome</b><small>智能家电门店管理系统 · 离线版</small></div></div><div><h1>登录本机门店</h1><p>账号、项目和报价只保存在这台电脑。</p></div><label>本地账号<input v-model="loginForm.account" autocomplete="username"></label><label>4 位 PIN<input v-model="loginForm.pin" type="password" inputmode="numeric" autocomplete="current-password"></label><div v-if="loginError" class="login-error">{{ loginError }}</div><NButton type="primary" attr-type="submit" block :loading="loggingIn">登录</NButton><small class="login-hint">演示账号：admin / 0000</small></form></div>
  <div v-else class="admin-shell">
    <aside class="sidebar">
      <a class="admin-brand" href="/" title="QoneHome·智能家电门店管理系统"><img v-if="brandLogoUrl" class="brand-logo" :src="brandLogoUrl" :alt="`${branding.storeName || '门店'} LOGO`" @error="logoBroken = true"><span v-else class="brand-mark"><AdminBrandMark /></span><span><b>QoneHome</b><small>智能家电门店管理系统</small></span></a>
      <nav class="side-nav">
        <template v-for="item in visibleNav" :key="item.key">
          <div v-if="item.children" class="side-nav-group">
            <button class="side-nav-parent" :class="{ active: tab === item.key, open: !!openGroups[item.key], 'has-active-child': hasActiveChild(item) }" :title="item.label" :aria-label="item.label" :aria-expanded="!!openGroups[item.key]" @click="toggleNavGroup(item.key)"><AdminNavIcon :name="item.icon" /><span>{{ item.label }}</span><b aria-hidden="true">⌄</b></button>
            <div v-show="openGroups[item.key]" class="side-sub-nav">
              <button v-for="child in item.children" :key="child.path" :class="{ active: isSubNavActive(child.path) }" :aria-current="isSubNavActive(child.path) ? 'page' : undefined" @click="navigatePath(child.path)">{{ child.label }}</button>
            </div>
          </div>
          <button v-else :class="{ active: tab === item.key }" :title="item.label" :aria-label="item.label" :aria-current="tab === item.key ? 'page' : undefined" @click="navigatePath(`/${item.key}`)"><AdminNavIcon :name="item.icon" /><span>{{ item.label }}</span><em v-if="item.key === 'projects' && overview.pendingProjects">{{ overview.pendingProjects }}</em></button>
        </template>
      </nav>
      <div class="side-bottom">
        <button class="sidebar-session" :title="`${session.name} · ${session.roleName} · 退出`" :aria-label="`${session.name} · ${session.roleName} · 退出登录`" @click="requestLogout">
          <span aria-hidden="true">{{ session.name.slice(0,1) }}</span>
          <div><b>{{ session.name }}</b><small>{{ session.roleName }} · 离线运行</small></div>
          <em>退出</em>
        </button>
      </div>
    </aside>

    <main class="main-area">
      <AdminPageTabs
        :tabs="pageTabs"
        :active-key="activePageTabKey"
        @activate="activatePageTab"
        @close="closePageTab"
        @close-others="closeOtherPageTabs"
      />
      <div v-if="error" class="error-banner">{{ error }} <button @click="error = ''" aria-label="关闭">×</button></div><div v-if="toast" class="toast">{{ toast }}</div><div v-if="loading" class="loading-state">正在读取本地门店数据…</div>

      <section v-else class="page-content" :data-page="tab">
        <template v-if="tab === 'overview'">
          <div class="welcome-row"><div><h2>工作台</h2><p>{{ overview.projects }} 个客户项目 · {{ overview.pendingProjects }} 个待推进</p></div><NButton type="primary" @click="showProjectForm = true">新建项目</NButton></div>
          <div class="metric-grid workbench-metrics"><div class="metric-card lead"><div class="metric-lead-main"><span>在推进项目</span><strong>{{ overview.pendingProjects }}</strong></div><div class="metric-lead-facts"><div><span>客户</span><b>{{ overview.customers }}</b></div><div><span>报价单</span><b>{{ overview.quotes }}</b></div><div><span>项目总数</span><b>{{ overview.projects }}</b></div></div></div><div class="metric-card"><span>在售产品</span><strong>{{ overview.products }}</strong><small>在售状态产品</small></div><div class="metric-card"><span>设计方案</span><strong>{{ overview.designs }}</strong><small>{{ overview.designVersions }} 个版本 · {{ overview.deliveryPackages }} 个交付包</small></div></div>
          <div class="content-grid"><section class="panel large-panel"><div class="panel-head"><div><h3>最近项目</h3></div><button class="text-btn" @click="navigatePath('/projects')">查看全部</button></div><div v-if="!recentProjects.length" class="empty">还没有项目，创建第一个方案吧。</div><button v-for="project in recentProjects" :key="project.id" class="project-row project-row-button" @click="navigatePath(`/projects/${project.id}`)"><div class="project-icon"><AdminNavIcon name="projects" /></div><div class="project-main"><strong>{{ project.name }}</strong><span>{{ project.customerName }} · {{ project.currentStage }} · 下一步：{{ project.nextTask }}</span><div class="row-progress"><i :style="{ width: `${project.progress}%` }"></i></div></div><span class="row-percent">{{ project.progress }}%</span><time>{{ date(project.updatedAt) }}</time><span class="row-arrow" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg></span></button></section><section class="panel quick-panel"><div class="panel-head"><div><h3>快捷入口</h3></div></div><button class="quick-link" @click="navigatePath('/quotes')"><span><AdminNavIcon name="quotes" /></span><div><strong>智能 / 快速报价</strong><small>规则计算、模板和版本快照</small></div><b aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg></b></button><button class="quick-link" @click="navigatePath('/projects')"><span><AdminNavIcon name="projects" /></span><div><strong>客户项目与交付</strong><small>进度、设计版本和施工交付统一管理</small></div><b aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg></b></button><button class="quick-link" @click="navigatePath('/products')"><span><AdminNavIcon name="products" /></span><div><strong>产品管理</strong><small>产品库、分类映射和物品编码同步</small></div><b aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg></b></button></section></div>
        </template>

        <template v-else-if="tab === 'projects' && projectIdFromPath">
          <div v-if="projectLoading" class="loading-state detail-loading">正在读取项目详情…</div>
          <template v-else-if="projectDetail">
            <ProjectDetailOverview :project="projectDetail" :saving-task="savingTask" :stats="projectStats" @toggle-task="toggleProjectTask" @edit="openProjectEdit" @quote="openProjectQuote(projectDetail.id)" @design="continueProjectDesign(projectDetail.id)" @copy-project="copyCurrentProject" @open-design-plans="navigatePath(`/designs?projectId=${projectDetail.id}`)" @back="navigatePath('/projects')" />
            <section class="panel table-panel project-link-panel" :aria-busy="projectLinksLoading">
              <div class="panel-head">
                <div><h3>关联方案与报价</h3></div>
                <div class="project-link-head-actions">
                  <span class="panel-note">设计方案 {{ projectLinks.designs.length }} 个 · 报价单 {{ projectLinks.quotes.length }} 张</span>
                  <NButton size="small" @click="openProjectDesignForm(projectDetail.id)">新建设计方案</NButton>
                  <NButton size="small" type="primary" @click="openProjectQuote(projectDetail.id)">新建报价单</NButton>
                </div>
              </div>
              <table class="project-link-table">
                <thead><tr><th>类型</th><th>名称</th><th>关联信息</th><th>状态</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="design in projectLinks.designs" :key="design.id">
                    <td><span class="project-link-type" data-type="design">设计方案</span></td>
                    <td><button type="button" class="project-link-name" @click="navigatePath(`/designs/${design.id}`)"><strong>{{ design.name }}</strong></button><small>{{ design.id }}</small></td>
                    <td>{{ design.latestVersionNo ? `最新 V${design.latestVersionNo} · 共 ${design.versionCount} 个版本` : '还没有已保存版本' }}<small>规则 {{ design.ruleVersion }}</small></td>
                    <td><NTag size="small" :type="design.status === '已定稿' ? 'success' : design.status === '已归档' ? 'default' : 'warning'" :bordered="false">{{ design.status }}</NTag></td>
                    <td><div class="table-actions">
                      <button type="button" class="table-link" @click="navigatePath(`/designs/${design.id}`)">查看</button>
                      <button type="button" class="table-link" @click="openDesignWorkbench(design.id)">打开设计</button>
                      <button type="button" class="table-link" :disabled="!design.latestVersionNo" :title="design.latestVersionNo ? '按该方案最新版本生成报价' : '先保存设计版本才能报价'" @click="navigatePath(`/quotes/new/design?design=${design.id}`)">生成报价</button>
                    </div></td>
                  </tr>
                  <tr v-for="quote in projectLinks.quotes" :key="quote.id">
                    <td><span class="project-link-type" data-type="quote">报价单</span></td>
                    <td><button type="button" class="project-link-name" @click="navigatePath(`/quotes/${quote.id}`)"><strong>{{ quote.name }}</strong></button><small>{{ quote.quoteNo || quote.id }} · {{ quote.mode }}</small></td>
                    <td>{{ money(quote.total) }}<small>{{ quote.designVersionNo ? `引用方案 V${quote.designVersionNo}` : '未关联方案' }}</small></td>
                    <td><NTag size="small" :type="quote.status === '已确认' ? 'success' : quote.status === '已作废' ? 'default' : 'warning'" :bordered="false">{{ quote.status }}</NTag></td>
                    <td><div class="table-actions">
                      <button type="button" class="table-link" @click="navigatePath(`/quotes/${quote.id}`)">查看</button>
                      <button v-if="quote.status === '草稿' && quote.designId" type="button" class="table-link" @click="navigatePath(`/quotes/new/design?design=${quote.designId}`)">再报一版</button>
                    </div></td>
                  </tr>
                  <tr v-if="!projectLinksLoading && !projectLinks.designs.length && !projectLinks.quotes.length">
                    <td colspan="5"><div class="empty">这个项目还没有设计方案与报价单，先点右上角「新建设计方案」。</div></td>
                  </tr>
                  <tr v-if="projectLinksLoading"><td colspan="5"><div class="empty">正在读取关联对象…</div></td></tr>
                </tbody>
              </table>
            </section>
            <BusinessWorkspace mode="designs" :route-path="routePath" :project-id="projectDetail.id" :projects="projects" :overview="overview" :permissions="session.permissions || []" embedded @changed="businessChanged" @notice="notify" @open-design-plans="projectId => navigatePath(`/designs?projectId=${projectId}`)" />
            <section class="panel activity-panel">
              <div class="panel-head activity-panel-head">
                <div><h3>操作日志</h3></div>
                <div class="activity-summary">
                  <span class="activity-total">共 {{ activityList.length }} 条</span>
                  <span v-if="activityTodayCount">今日 {{ activityTodayCount }} 条</span>
                  <span v-if="activityWeekCount">近 7 天 {{ activityWeekCount }} 条</span>
                  <span class="activity-limit">本地保留最近 30 条</span>
                </div>
              </div>
              <div v-if="!activityList.length" class="empty">项目还没有操作记录，完成任务或复制项目后会记录在这里。</div>
              <template v-else>
                <div class="activity-table-wrap">
                  <table class="activity-table">
                    <colgroup><col class="col-time"><col class="col-operator"><col class="col-action"><col class="col-target"><col class="col-result"></colgroup>
                    <thead><tr><th>时间</th><th>操作人</th><th>操作功能</th><th>操作对象</th><th>操作结果</th></tr></thead>
                    <tbody>
                      <tr v-for="item in pagedActivities" :key="item.id" :title="activityHint(item) || undefined">
                        <td class="activity-time">{{ activityTime(item.time) }}</td>
                        <td class="activity-operator" :class="{ 'is-system': activityOperator(item) === '系统', 'is-empty': activityOperatorMissing(item) }" :title="activityOperatorMissing(item) ? '该记录产生于账号留痕之前，未记录操作人' : undefined">{{ activityOperator(item) }}</td>
                        <td><span class="activity-action" :data-action="activityAction(item)">{{ activityAction(item) }}</span></td>
                        <td class="activity-target">
                          <span class="activity-target-name">{{ activityTarget(item) }}</span>
                          <span v-if="activityRole(item)" class="activity-role-chip">负责角色 · {{ activityRole(item) }}</span>
                        </td>
                        <td><span class="activity-result" :data-result="activityResult(item)">{{ activityResult(item) }}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="activity-pager">
                  <AdminPagination :page="activityPage" :page-size="activityPageSize" :total="activityList.length" :current-count="pagedActivities.length" label="操作" :page-sizes="[10, 20, 30]" @update:page="changeActivityPage" @update:page-size="changeActivityPageSize" />
                </div>
              </template>
            </section>
          </template>
        </template>

        <template v-else-if="tab === 'projects'">
          <AdminPageHeader title="客户项目" description="查看每个项目所处阶段、下一步待办和交付进度。">
            <template #actions><NButton type="primary" @click="showProjectForm = true">新建项目</NButton></template>
          </AdminPageHeader>
          <AdminFilterBar label="项目筛选">
            <NInput v-model:value="projectSearch" clearable placeholder="搜索项目或客户" @keyup.enter="queryProjects" />
            <NButton @click="queryProjects">搜索</NButton>
            <template #summary>共 {{ projectTotal }} 个项目 · {{ projects.filter(item => item.progress < 100).length }} 个进行中</template>
          </AdminFilterBar>
          <section class="panel table-panel project-table" :aria-busy="loading">
            <table>
              <thead><tr><th>项目</th><th>阶段 / 状态</th><th>总体进度</th><th>下一步待办</th><th>计划交付</th><th>最近更新</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="project in pagedProjects" :key="project.id">
                  <td><button class="project-name-link" @click="navigatePath(`/projects/${project.id}`)"><strong>{{ project.name }}</strong><small>{{ project.customerName }} · {{ project.area }}㎡ · {{ project.schemeType }}</small></button></td>
                  <td><strong>{{ project.currentStage }}</strong><small><span class="status-tag" :data-status="project.status">{{ project.status }}</span></small></td>
                  <td><div class="table-progress"><div><i :style="{ width: `${project.progress}%` }"></i></div><strong>{{ project.progress }}%</strong></div><small>{{ project.completedTasks }}/{{ project.totalTasks }} 项完成</small></td>
                  <td class="next-task-cell">{{ project.nextTask }}</td>
                  <td>{{ fullDate(project.deadline) }}</td>
                  <td>{{ date(project.updatedAt) }}</td>
                  <td><div class="table-actions"><button class="table-link" @click="navigatePath(`/projects/${project.id}`)">查看详情</button><a class="table-link muted" :href="`/app/?project=${project.id}`">继续设计</a></div></td>
                </tr>
              </tbody>
            </table>
            <div v-if="!pagedProjects.length" class="empty">{{ projectSearch ? '没有匹配的项目，请调整筛选条件。' : '还没有项目，先创建第一个项目。' }}</div>
          </section>
          <AdminPagination v-if="projectTotal" :page="projectPage" :page-size="projectPageSize" :total="projectTotal" :current-count="pagedProjects.length" label="项目" :disabled="loading" @update:page="changeProjectPage" @update:page-size="changeProjectPageSize" />
        </template>

        <DesignWorkspace v-else-if="tab === 'designs'" :path="routePath" :projects="projects" :customers="customers" @navigate="navigatePath" @changed="designChanged" @notice="notify" @page-title="handlePageTitle" />

        <template v-else-if="tab === 'customers'">
          <AdminPageHeader title="客户管理" description="维护客户基础档案、房型地址、家庭成员和项目关联信息。">
            <template #actions><NButton type="primary" @click="openCustomerForm()">新增客户</NButton></template>
          </AdminPageHeader>
          <AdminFilterBar label="客户筛选">
            <NInput v-model:value="customerSearch" clearable placeholder="搜索姓名、手机号、地址或家庭成员" @keyup.enter="queryCustomers" />
            <NButton @click="queryCustomers">搜索</NButton>
            <template #summary>共 {{ customerTotal }} 位客户</template>
          </AdminFilterBar>
          <section class="panel table-panel customer-table" :aria-busy="loading">
            <table>
              <thead><tr><th>客户</th><th>联系方式</th><th>房型 / 地址</th><th>家庭成员</th><th>来源</th><th>关联项目</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="customer in pagedCustomers" :key="customer.id">
                  <td><strong>{{ customer.name }}</strong><small>{{ customer.id }}</small></td>
                  <td>{{ customer.phone || '—' }}<small>{{ customer.wechat || customer.email || '未填写微信 / 邮箱' }}</small></td>
                  <td>{{ customer.houseType || '未填写房型' }}<small>{{ customer.address || '未填写地址' }}</small></td>
                  <td>{{ customer.familyMembers || '—' }}<small>{{ customer.note || '暂无备注' }}</small></td>
                  <td>{{ customer.source }}</td>
                  <td>{{ projects.filter(p => p.customerId === customer.id).length }} 个</td>
                  <td><button class="table-link" @click="openCustomerForm(customer)">编辑资料</button></td>
                </tr>
                <tr v-if="!pagedCustomers.length"><td colspan="7"><div class="empty">{{ customerSearch ? '没有匹配的客户，请调整筛选条件。' : '还没有客户，先新增第一位客户。' }}</div></td></tr>
              </tbody>
            </table>
          </section>
          <AdminPagination v-if="customerTotal" :page="customerPage" :page-size="customerPageSize" :total="customerTotal" :current-count="pagedCustomers.length" label="客户" :disabled="loading" @update:page="changeCustomerPage" @update:page-size="changeCustomerPageSize" />
        </template>
        <template v-else-if="tab === 'products'"><ProductWorkspace ref="productWorkspace" :path="routePath" @navigate="navigatePath" @changed="productChanged" @notice="notify" @page-title="handlePageTitle" /></template>
        <BusinessWorkspace v-else-if="['quotes','operations','store','settings'].includes(tab)" :mode="tab as 'quotes'|'operations'|'store'|'settings'" :route-path="routePath" :projects="projects" :overview="overview" :permissions="session.permissions || []" :current-user-id="session.id || ''" @changed="businessChanged" @notice="notify" @page-title="handlePageTitle" />
      </section>
    </main>

    <div v-if="showCustomerForm" class="modal-backdrop" @click.self="showCustomerForm = false">
      <form class="modal customer-form-modal" @submit.prevent="createCustomer">
        <div class="modal-head">
          <div>
            <div class="admin-breadcrumb">客户管理 / {{ editingCustomerId ? '编辑客户' : '新增客户' }}</div>
            <h3>{{ editingCustomerId ? '编辑客户资料' : '新增客户' }}</h3>
            <p>仅姓名必填，其余资料可后续补充。</p>
          </div>
          <button type="button" aria-label="关闭" @click="showCustomerForm = false">×</button>
        </div>
        <div class="form-grid">
          <label>客户姓名<NInput v-model:value="customerForm.name" placeholder="例如：王先生" :input-props="{ id: 'customer-name', required: true }" /></label>
          <label>手机号<NInput v-model:value="customerForm.phone" placeholder="例如：13800000000" :input-props="{ id: 'customer-phone' }" /></label>
          <label>客户来源<NSelect v-model:value="customerForm.source" :options="sourceOptions" /></label>
          <label>房型<NInput v-model:value="customerForm.houseType" placeholder="例如：三室两厅 / 大平层" :input-props="{ id: 'customer-house' }" /></label>
          <label>微信号<NInput v-model:value="customerForm.wechat" placeholder="选填" :input-props="{ id: 'customer-wechat' }" /></label>
          <label>邮箱<NInput v-model:value="customerForm.email" placeholder="选填" :input-props="{ id: 'customer-email' }" /></label>
          <label class="full-field">项目地址<NInput v-model:value="customerForm.address" placeholder="小区、楼栋、房号" :input-props="{ id: 'customer-address' }" /></label>
          <label class="full-field">家庭成员<NInput v-model:value="customerForm.familyMembers" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" placeholder="例如：夫妻二人 + 1 个儿童，常驻老人 1 位" /></label>
          <label class="full-field">备注<NInput v-model:value="customerForm.note" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" placeholder="客户关注点、预算偏好、沟通注意事项" /></label>
        </div>
        <div class="modal-actions">
          <NButton attr-type="button" :disabled="savingCustomer" @click="showCustomerForm = false">取消</NButton>
          <NButton type="primary" attr-type="submit" :loading="savingCustomer">{{ editingCustomerId ? '保存修改' : '保存客户' }}</NButton>
        </div>
      </form>
    </div>
    <div v-if="showProjectForm" class="modal-backdrop" @click.self="showProjectForm = false">
      <form class="modal project-form-modal" @submit.prevent="createProject">
        <div class="modal-head">
          <div>
            <div class="admin-breadcrumb">客户项目 / 新建项目</div>
            <h3>新建项目</h3>
            <p>先录入项目与客户，方案参数可进入详情后继续补充。</p>
          </div>
          <button type="button" aria-label="关闭" @click="showProjectForm = false">×</button>
        </div>
        <label>项目名称<NInput v-model:value="projectForm.name" placeholder="例如：张先生 · 180㎡大平层" :input-props="{ id: 'project-name', required: true }" /></label>
        <label>关联客户<NSelect v-model:value="projectForm.customerId" :options="customerOptions" filterable /></label>
        <div class="form-grid">
          <label>建筑面积（㎡）<NInputNumber v-model:value="projectForm.area" :min="0" :show-button="false" /></label>
          <label>户型类型<NSelect v-model:value="projectForm.houseType" :options="houseTypeOptions" /></label>
          <label>方案类型<NSelect v-model:value="projectForm.schemeType" :options="schemeTypeOptions" /></label>
          <label>预算意向（元）<NInputNumber v-model:value="projectForm.budget" :min="0" :show-button="false" /></label>
          <label>销售渠道<NSelect v-model:value="projectForm.salesChannel" :options="channelOptions" /></label>
          <label>负责人<NInput v-model:value="projectForm.manager" /></label>
          <label>计划交付<input v-model="projectForm.expectedDeliveryDate" class="native-date-input" type="date"></label>
        </div>
        <label>项目地址<NInput v-model:value="projectForm.address" placeholder="小区、楼栋或施工地址" /></label>
        <label>需求重点<NInput v-model:value="projectForm.requirementsText" placeholder="用顿号分隔，例如：智能灯光、全屋网络" /></label>
        <div class="modal-actions">
          <NButton attr-type="button" :disabled="savingProject" @click="showProjectForm = false">取消</NButton>
          <NButton type="primary" attr-type="submit" :loading="savingProject">创建并进入项目</NButton>
        </div>
      </form>
    </div>
    <div v-if="showProjectEdit" class="modal-backdrop" @click.self="showProjectEdit = false">
      <form class="modal project-form-modal" @submit.prevent="saveProjectEdit">
        <div class="modal-head">
          <div>
            <div class="admin-breadcrumb">客户项目 / 编辑项目资料</div>
            <h3>编辑项目资料</h3>
            <p>保存后回写项目详情与阶段任务，不改变已完成任务。</p>
          </div>
          <button type="button" aria-label="关闭" @click="showProjectEdit = false">×</button>
        </div>
        <label>项目名称<NInput v-model:value="projectEditForm.name" :input-props="{ id: 'project-edit-name', required: true }" /></label>
        <label>关联客户<NSelect v-model:value="projectEditForm.customerId" :options="customerOptions" filterable /></label>
        <div class="form-grid">
          <label>建筑面积（㎡）<NInputNumber v-model:value="projectEditForm.area" :min="0" :show-button="false" /></label>
          <label>户型类型<NInput v-model:value="projectEditForm.houseType" /></label>
          <label>方案类型<NSelect v-model:value="projectEditForm.schemeType" :options="schemeTypeOptions" /></label>
          <label>预算意向（元）<NInputNumber v-model:value="projectEditForm.budget" :min="0" :show-button="false" /></label>
          <label>销售渠道<NInput v-model:value="projectEditForm.salesChannel" /></label>
          <label>负责人<NInput v-model:value="projectEditForm.manager" /></label>
          <label>计划交付<input v-model="projectEditForm.expectedDeliveryDate" class="native-date-input" type="date"></label>
        </div>
        <label>项目地址<NInput v-model:value="projectEditForm.address" /></label>
        <label>需求重点<NInput v-model:value="projectEditForm.requirementsText" /></label>
        <div class="modal-actions">
          <NButton attr-type="button" :disabled="savingProject" @click="showProjectEdit = false">取消</NButton>
          <NButton type="primary" attr-type="submit" :loading="savingProject">保存项目资料</NButton>
        </div>
      </form>
    </div>
    <AdminConfirmDialog
      :show="confirmLogout"
      title="退出登录"
      message="确认退出当前账号？本机数据已保存，未保存的表单内容会丢失。"
      confirm-text="退出登录"
      @update:show="value => confirmLogout = value"
      @confirm="logout"
    />
  </div>
  </NConfigProvider>
</template>
