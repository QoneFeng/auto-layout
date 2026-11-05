<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { NAlert, NButton, NCascader, NCheckbox, NForm, NInput, NInputNumber, NModal, NSelect, NSwitch, NTag, NUpload, type UploadCustomRequestOptions } from 'naive-ui';
import ProductField from './ProductField.vue';
import AdminPagination from './components/AdminPagination.vue';
import AdminPageHeader from './components/AdminPageHeader.vue';
import { queryPage, queryPageSize, readRouteQuery, updateRouteQuery } from './hash-query';
import { blankProduct, productIssues, specificationFields, STATUSES, UNITS, DATA_STATES, type ProductRecord, type ProductCategory, type ProductAsset } from '../../shared/product-schema.mjs';
import { PRODUCT_STATUS_META, productTransitionsFrom } from '../../shared/product-state.mjs';

const props = defineProps<{ path: string }>();
const emit = defineEmits<{ navigate: [path: string]; changed: []; notice: [message: string] }>();
type Metadata = { categories: ProductCategory[]; spaces: {code: string; name: string}[]; protocols: string[]; ecosystems: string[]; dimming: string[]; surfaces: {label: string; value: string}[]; mountMethods: string[]; routes: {label: string; value: string}[] };
const meta = ref<Metadata>({ categories: [], spaces: [], protocols: [], ecosystems: [], dimming: [], surfaces: [], mountMethods: [], routes: [] });
const rows = ref<ProductRecord[]>([]), platformRows = ref<any[]>([]), busy = ref(false), saving = ref(false), uploading = ref(0), message = ref('');
const total = ref(0), currentPage = ref(1), pageSize = ref(30), listBusy = ref(false);
const platformTotal = ref(0), platformBusy = ref(false), libraryMode = ref<'store'|'platform'>('store');
const search = ref(''), categoryFilter = ref<string | null>(null), statusFilter = ref<string | null>(null), brandFilter = ref<string | null>(null), ecosystemFilter = ref<string | null>(null);
const form = reactive<ProductRecord>(blankProduct()), baseline = ref(''), errors = ref<Record<string, string>>({});
const alternatives = ref<any[]>([]);
const activeSection = ref('basic');
const sections = [{id:'basic', name:'基本信息', sub:'名称、分类与品牌'}, {id:'pricing', name:'价格与计量', sub:'售价、单位与数量'}, {id:'control', name:'协议与控制', sub:'兼容能力与接口'}, {id:'placement', name:'安装与布点', sub:'安装面与实体尺寸'}, {id:'specifications', name:'专业规格', sub:'按产品分类填写'}, {id:'media', name:'图片与附件', sub:'本地保存、离线可用'}];
const mode = computed(() => {
  const path = props.path.split('?')[0] || '';
  if (path === '/products/categories') return 'categories';
  return path.endsWith('/new') ? 'new' : path.endsWith('/edit') ? 'edit' : /^\/products\/[^/]+$/.test(path) ? 'detail' : 'list';
});
const readOnly = computed(() => mode.value === 'detail');
const archived = computed(() => form.status === '归档');
const formLocked = computed(() => readOnly.value || (mode.value === 'edit' && archived.value));
const statusHistory = ref<any[]>([]);
const statusCounts = ref<Record<string, number>>({});
const productStatusBadgeType = computed<'default' | 'success' | 'warning'>(() => (
  form.status === '在售' ? 'success' : form.status === '归档' ? 'default' : 'warning'
));
const statusActions = computed(() => productTransitionsFrom(form.status));
const transitionOpen = ref(false), transitionBusy = ref(false), transitionError = ref('');
const transitionTarget = ref<ProductRecord | null>(null);
const transitionForm = reactive({ action: '', reason: '' });
const transitionDefinition = computed(() => productTransitionsFrom(String(transitionTarget.value?.status || '')).find(item => item.action === transitionForm.action) || null);
const transitionReasonRequired = computed(() => Boolean(transitionDefinition.value?.requiresReason));
const categoryData = ref<any>({ categories: [], ruleItems: [], stats: {} });
const categorySearch = ref(''), categoryLevel = ref<string | null>(null), categoryPage = ref(1), categoryPageSize = ref(30);
const mappingOpen = ref(false), mappingBusy = ref(false), mappingError = ref('');
const mappingRow = ref<any>(null), mappingCode = ref('');
const dirty = computed(() => !readOnly.value && mode.value !== 'list' && !!baseline.value && JSON.stringify(form) !== baseline.value);
const selectedCategory = computed(() => meta.value.categories.find(c => c.id === form.categoryId));
const fields = computed(() => specificationFields(selectedCategory.value?.kind || 'general'));
const options = (values: string[]) => values.map(v => ({label:v, value:v}));
const categoryOptions = computed(() => [...new Set(meta.value.categories.map(c => c.category1))].map(category => ({ label: category, value: `group:${category}`, children: meta.value.categories.filter(c => c.category1 === category).map(c => ({ label: c.label, value: c.id })) })));
const flatCategories = computed(() => meta.value.categories.map(c => ({label: `${c.category1} / ${c.label}`, value:c.id})));
const visibleTotal = computed(() => libraryMode.value === 'store' ? total.value : platformTotal.value);
const visibleCount = computed(() => libraryMode.value === 'store' ? rows.value.length : platformRows.value.length);
const statusFilterOptions = computed(() => STATUSES.map(status => ({ label: `${status}（${statusCounts.value[status] ?? 0}）`, value: status })));
const selectedIds = ref<string[]>([]);
const selectedIdSet = computed(() => new Set(selectedIds.value));
const currentPageIds = computed(() => rows.value.map(item => String(item.id || '')).filter(Boolean));
const allPageSelected = computed(() => currentPageIds.value.length > 0 && currentPageIds.value.every(id => selectedIdSet.value.has(id)));
const somePageSelected = computed(() => currentPageIds.value.some(id => selectedIdSet.value.has(id)) && !allPageSelected.value);
const batchOpen = ref(false), batchBusy = ref(false), batchAction = ref(''), batchReason = ref(''), batchCategoryId = ref<string | null>(null), batchError = ref('');
const batchLabels: Record<string, string> = { publish:'批量上架', withdraw:'批量下架', archive:'批量归档', restore:'批量恢复', category:'批量修改分类' };
const batchTitle = computed(() => batchLabels[batchAction.value] || '批量操作');
const batchConfirmLabel = computed(() => ({ publish:'确认上架', withdraw:'确认下架', archive:'确认归档', restore:'确认恢复', category:'确认修改分类' } as Record<string, string>)[batchAction.value] || '确认');
const categoryLevels = computed(() => [...new Set<string>((categoryData.value.categories || []).map((category: any) => String(category.category1 || '')))]);
const filteredCategoryRows = computed(() => {
  const keyword = categorySearch.value.trim().toLowerCase();
  return categoryData.value.categories.filter((category: any) =>
    (!categoryLevel.value || category.category1 === categoryLevel.value) &&
    (!keyword || [category.category1, category.label, category.itemCode, category.ruleId, ...(category.legacyKeys || [])].join(' ').toLowerCase().includes(keyword)));
});
const pagedCategoryRows = computed(() => filteredCategoryRows.value.slice((categoryPage.value - 1) * categoryPageSize.value, categoryPage.value * categoryPageSize.value));
const categoryStats = computed(() => categoryData.value.stats || {});
const ruleCodeOptions = computed(() => {
  const groups: Record<string, any[]> = {};
  for (const item of categoryData.value.ruleItems || []) (groups[item.ruleCategoryLabel || item.ruleCategory1] ||= []).push({ label: `${item.ruleId} · ${item.label} · ${item.itemCode}`, value: item.itemCode });
  return Object.entries(groups).map(([label, children]) => ({ type: 'group', label, key: label, children }));
});
const mappingRule = computed(() => (categoryData.value.ruleItems || []).find((item: any) => item.itemCode === mappingCode.value) || null);
const categoryLevelOptions = computed(() => categoryLevels.value.map((value: string) => ({ label: value, value })));
function categoryStatus(category: any) {
  if (category.mappingConflict) return '编码冲突';
  if (!category.itemCode) return '未映射';
  if (!category.legacyKeys?.length) return '待规则接入';
  return '已同步';
}
function categoryStatusType(category: any) {
  if (category.mappingConflict) return 'error';
  if (!category.itemCode) return 'warning';
  if (!category.legacyKeys?.length) return 'info';
  return 'success';
}
function changeCategoryPage(value: number) { categoryPage.value = value; }
function changeCategoryPageSize(value: number) { categoryPageSize.value = value; categoryPage.value = 1; }
function openMapping(category: any) { mappingRow.value = category; mappingCode.value = category.itemCode || ''; mappingError.value = ''; mappingOpen.value = true; }
async function saveCategoryMapping(reset = false) {
  if (!mappingRow.value || mappingBusy.value) return;
  mappingBusy.value = true; mappingError.value = '';
  try {
    categoryData.value = await api('/api/admin/product-categories/' + encodeURIComponent(mappingRow.value.id), { method: 'PUT', body: JSON.stringify({ itemCode: reset ? '' : mappingCode.value }) });
    mappingOpen.value = false;
    emit('notice', reset ? '已恢复默认物品编码映射' : '产品分类映射已保存，布点规则将按新编码同步');
    emit('changed');
  } catch (error) { mappingError.value = error instanceof Error ? error.message : '映射保存失败'; }
  finally { mappingBusy.value = false; }
}
const brandOptions = computed(() => options([...new Set(['无品牌', ...rows.value.map(p => p.brand).filter(Boolean), form.brand].filter(Boolean))]));
const effectivePrice = computed(() => form.canPrice ? form.salePrice ?? form.retailPrice : null);
const cover = computed(() => form.assets.find(a => a.role === 'cover'));
const pageTitle = computed(() => mode.value === 'new' ? '新增产品' : mode.value === 'edit' ? '编辑产品' : '产品详情');
const dimensionFields = [{key:'widthMm', label:'宽度 / 长度'}, {key:'depthMm', label:'进深 / 厚度'}, {key:'heightMm', label:'高度'}, {key:'diameterMm', label:'直径'}, {key:'cutoutMm', label:'开孔直径'}, {key:'recessDepthMm', label:'嵌入深度'}] as const;
const importOpen = ref(false), importText = ref(''), importUpdate = ref(false), importBusy = ref(false), importError = ref(''), importFileName = ref('');
const leaveOpen = ref(false); let leaveResolve: ((result: boolean) => void) | undefined;
const riskOpen = ref(false); let riskResolve: ((result: boolean) => void) | undefined;
let loadSequence = 0;
function statusDescription(status: string) { return (PRODUCT_STATUS_META as Record<string, { description?: string }>)[status]?.description || ''; }
function money(value: number | null | undefined) { return value == null ? '待定价' : `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function exportUrl(format: 'csv'|'xls') {
  const params = new URLSearchParams({ search: search.value, category: categoryFilter.value || '', status: statusFilter.value || '', brand: brandFilter.value || '', ecosystem: ecosystemFilter.value || '' });
  return `/api/admin/products/export.${format}?${params}`;
}
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = init?.body == null ? {} : { 'Content-Type': 'application/json' };
  const response = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers as Record<string, string> || {}) } });
  const value = await response.json();
  if (response.status === 401) {
    sessionStorage.removeItem('qone-admin-session');
    window.dispatchEvent(new Event('qone-auth-expired'));
  }
  if (!response.ok) { if (value.fields) errors.value = value.fields; throw new Error(value.error || `请求失败 ${response.status}`); }
  return value;
}
function makeSku() { return `SKU-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,6).toUpperCase()}`; }
function setForm(value: ProductRecord) {
  Object.assign(form, blankProduct(), value);
  errors.value = {}; message.value = ''; activeSection.value = 'basic'; baseline.value = JSON.stringify(form);
}
let listSequence = 0;
function syncListQuery() {
  updateRouteQuery({
    library: libraryMode.value === 'platform' ? 'platform' : null,
    page: currentPage.value > 1 ? currentPage.value : null,
    pageSize: pageSize.value !== 30 ? pageSize.value : null,
    search: search.value || null,
    status: statusFilter.value || null,
    category: categoryFilter.value || null,
    brand: brandFilter.value || null,
    ecosystem: ecosystemFilter.value || null,
  });
}
async function queryList(reset: boolean | Event = true) {
  if (reset) currentPage.value = 1;
  const sequence = ++listSequence; listBusy.value = true;
  const params = new URLSearchParams({ search: search.value, category: categoryFilter.value || '', status: statusFilter.value || '', brand: brandFilter.value || '', ecosystem: ecosystemFilter.value || '', page:String(currentPage.value), pageSize:String(pageSize.value) });
  try {
    const data = await api<{products:ProductRecord[];total:number;page:number}>(`/api/admin/products?${params}`);
    if (sequence !== listSequence) return;
    rows.value = data.products; total.value = data.total; currentPage.value = data.page;
    syncListQuery();
    message.value = '';
  } catch (e) { if (sequence === listSequence) message.value = e instanceof Error ? e.message : '产品列表读取失败，请重试'; }
  finally { if (sequence === listSequence) listBusy.value = false; }
}
async function queryPlatform(reset: boolean | Event = true) {
  if (reset) currentPage.value = 1;
  platformBusy.value = true;
  const params = new URLSearchParams({ search: search.value, category: categoryFilter.value || '', brand: brandFilter.value || '', ecosystem: ecosystemFilter.value || '', page:String(currentPage.value), pageSize:String(pageSize.value) });
  try {
    const data = await api<{products:any[];total:number;page:number}>(`/api/admin/platform-products?${params}`);
    platformRows.value = data.products; platformTotal.value = data.total; currentPage.value = data.page; message.value = '';
    syncListQuery();
  } catch (e) { message.value = e instanceof Error ? e.message : '平台设备库读取失败'; }
  finally { platformBusy.value = false; }
}
function clearSelection() { selectedIds.value = []; }
function togglePageSelection(checked: boolean) {
  if (!checked) { const page = new Set(currentPageIds.value); selectedIds.value = selectedIds.value.filter(id => !page.has(id)); return; }
  selectedIds.value = [...new Set([...selectedIds.value, ...currentPageIds.value])];
}
function toggleRowSelection(id: string, checked: boolean) {
  selectedIds.value = checked ? [...new Set([...selectedIds.value, id])] : selectedIds.value.filter(value => value !== id);
}
function runListQuery(reset: boolean | Event = true) {
  if (reset) clearSelection();
  return libraryMode.value === 'store' ? queryList(reset) : queryPlatform(reset);
}
function switchLibrary(value: 'store'|'platform') { libraryMode.value = value; currentPage.value = 1; statusFilter.value = null; runListQuery(); }
function changePage(value: number) { currentPage.value = value; runListQuery(false); }
function changePageSize(value: number) { pageSize.value = value; runListQuery(); }
function openBatch(action: string) {
  if (!selectedIds.value.length) { emit('notice', '请先勾选需要批量处理的产品'); return; }
  batchAction.value = action; batchReason.value = ''; batchCategoryId.value = null; batchError.value = ''; batchOpen.value = true;
}
async function submitBatch() {
  if (batchBusy.value) return;
  if (batchAction.value === 'archive' && !batchReason.value.trim()) { batchError.value = '请填写归档原因'; return; }
  if (batchAction.value === 'category' && !batchCategoryId.value) { batchError.value = '请选择目标产品分类'; return; }
  batchBusy.value = true; batchError.value = '';
  try {
    const result = await api<{ total:number; updated:number; failed:Array<{id:string;name:string;error:string}> }>('/api/admin/products/batch', {
      method: 'POST',
      body: JSON.stringify({ ids: selectedIds.value, action: batchAction.value, categoryId: batchCategoryId.value, reason: batchReason.value.trim() }),
    });
    batchOpen.value = false;
    const failed = result.failed || [];
    if (failed.length) {
      message.value = `批量操作完成：成功 ${result.updated} 项，失败 ${failed.length} 项。${failed.slice(0, 3).map(item => `${item.name || item.id}：${item.error}`).join('；')}`;
    } else {
      emit('notice', `${batchTitle.value}完成：共处理 ${result.updated} 项`);
    }
    clearSelection();
    emit('changed');
    await Promise.all([runListQuery(), loadStatusSummary()]);
  } catch (error) { batchError.value = error instanceof Error ? error.message : '批量操作失败'; }
  finally { batchBusy.value = false; }
}
async function addPlatformProduct(id: string) {
  try {
    const saved = await api<ProductRecord>(`/api/admin/platform-products/${encodeURIComponent(id)}/copy`, { method:'POST', body:'{}' });
    emit('changed'); emit('notice', `已加入门店库草稿：${saved.name}`); libraryMode.value = 'store';
    navigate(`/products/${saved.id}/edit`);
  } catch (e) { message.value = e instanceof Error ? e.message : '加入门店库失败'; }
}
async function loadCategories() {
  categoryData.value = await api<any>('/api/admin/product-categories');
}
async function loadStatusSummary() {
  const data = await api<{ counts: Record<string, number> }>('/api/admin/product-status-summary');
  statusCounts.value = data.counts || {};
}
async function loadStatusHistory(id = form.id || '') {
  if (!id) { statusHistory.value = []; return; }
  const data = await api<{ history: any[] }>(`/api/admin/products/${encodeURIComponent(id)}/status-history`);
  statusHistory.value = data.history || [];
}
function openTransition(action: string, product: ProductRecord = form) {
  if (!product.id) { emit('notice', '请先保存产品后再执行状态操作'); return; }
  transitionTarget.value = product;
  transitionForm.action = action;
  transitionForm.reason = '';
  transitionError.value = '';
  transitionOpen.value = true;
}
async function submitTransition() {
  const target = transitionTarget.value, definition = transitionDefinition.value;
  if (!target?.id || !definition || transitionBusy.value) return;
  if (definition.requiresReason && !transitionForm.reason.trim()) { transitionError.value = '请填写操作原因'; return; }
  transitionBusy.value = true; transitionError.value = '';
  try {
    const saved = await api<ProductRecord>(`/api/admin/products/${encodeURIComponent(target.id)}/transition`, {
      method: 'POST',
      body: JSON.stringify({ action: definition.action, expectedStatus: target.status, reason: transitionForm.reason.trim() }),
    });
    transitionOpen.value = false;
    emit('changed');
    emit('notice', `产品已${definition.label}：${saved.name}`);
    if (mode.value === 'list') {
      await Promise.all([runListQuery(false), loadStatusSummary()]);
    } else if (saved.id === form.id) {
      setForm(saved);
      await loadStatusHistory(saved.id);
    }
  } catch (error) { transitionError.value = error instanceof Error ? error.message : '状态操作失败'; }
  finally { transitionBusy.value = false; }
}
async function loadPath() {
  const sequence = ++loadSequence; busy.value = true; message.value = '';
  try {
    if (mode.value === 'categories') {
      await loadCategories();
      return;
    }
    if (!meta.value.categories.length) meta.value = await api<Metadata>('/api/admin/product-metadata');
    if (mode.value === 'list') {
      const query = readRouteQuery(props.path);
      libraryMode.value = query.get('library') === 'platform' ? 'platform' : 'store';
      search.value = query.get('search') || '';
      statusFilter.value = query.get('status') || null;
      categoryFilter.value = query.get('category') || null;
      brandFilter.value = query.get('brand') || null;
      ecosystemFilter.value = query.get('ecosystem') || null;
      currentPage.value = queryPage(query.get('page'));
      pageSize.value = queryPageSize(query.get('pageSize'));
      await Promise.all([runListQuery(false), loadStatusSummary()]);
    }
    else if (mode.value === 'new') {
      const copyId = new URLSearchParams(props.path.split('?')[1]).get('copy');
      const p = copyId ? await api<ProductRecord>(`/api/admin/products/${encodeURIComponent(copyId)}`) : blankProduct();
      if (sequence !== loadSequence) return;
      setForm({ ...p, id: undefined, revision: undefined, sku: makeSku(), status:'草稿', name: copyId ? `${p.name}（副本）` : p.name });
      statusHistory.value = [];
    } else {
      const id = props.path.split('/')[2];
      const p = await api<ProductRecord>(`/api/admin/products/${encodeURIComponent(id || '')}`);
      if (sequence !== loadSequence) return;
      setForm(p);
      await loadStatusHistory(p.id || '');
      alternatives.value = mode.value === 'detail' ? (await api<{alternatives:any[]}>(`/api/admin/products/${encodeURIComponent(id || '')}/alternatives`)).alternatives : [];
    }
  } catch (e) { if (sequence === loadSequence) message.value = e instanceof Error ? e.message : '读取失败'; }
  finally { if (sequence === loadSequence) busy.value = false; }
}
function confirmLeave(): Promise<boolean> {
  if (saving.value || uploading.value) { emit('notice', '正在保存或上传，请稍候'); return Promise.resolve(false); }
  if (!dirty.value) return Promise.resolve(true);
  if (leaveResolve) return Promise.resolve(false);
  leaveOpen.value = true; return new Promise(resolve => { leaveResolve = resolve; });
}
function finishLeave(allow: boolean) { leaveOpen.value = false; leaveResolve?.(allow); leaveResolve = undefined; }
defineExpose({ confirmLeave });
function navigate(path: string) { emit('navigate', path); }
function jump(section: string) { activeSection.value = section; document.getElementById(`product-section-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function updateActiveSection() {
  if (mode.value === 'list' || mode.value === 'categories') return;
  let current = sections[0].id;
  const anchor = Math.min(420, window.innerHeight * 0.35);
  for (const section of sections) {
    const element = document.getElementById(`product-section-${section.id}`);
    if (!element) continue;
    if (element.getBoundingClientRect().top <= anchor) current = section.id;
    else break;
  }
  if (activeSection.value !== current) activeSection.value = current;
}
let sectionFrame = 0;
function onSectionScroll() {
  if (sectionFrame) return;
  sectionFrame = window.requestAnimationFrame(() => { sectionFrame = 0; updateActiveSection(); });
}
function changeCategory(value: string | number | null) {
  const c = meta.value.categories.find(c => c.id === value);
  form.categoryId = String(value || '');
  if (!c) return;
  form.salesUnit = c.unit; form.quantityMode = c.unit === '米' ? 'length' : 'piece'; form.minOrderQty = form.orderStep = c.unit === '米' ? .1 : 1;
  form.mountSurfaces = [...c.surfaces];
  // Keep old specifications as source material; only active-template fields are consumed.
  form.photometryStatus = ['track', 'panel', 'network', 'sensor', 'curtain', 'driver'].includes(c.kind) ? 'not_applicable' : 'missing';
  if (c.kind === 'driver') form.canPlace = false;
}
function specNumber(key: string) { const v = form.specs[key]; return typeof v === 'number' ? v : null; }
async function save(status: string, continueNew = false) {
  if (saving.value || uploading.value) return;
  if (mode.value === 'edit' && archived.value) { emit('notice', '归档产品需先恢复为草稿后才能编辑'); return; }
  message.value = ''; errors.value = {};
  const payload = { ...JSON.parse(JSON.stringify(form)), status: mode.value === 'edit' ? form.status : status } as ProductRecord;
  errors.value = productIssues(payload, meta.value.categories);
  if (Object.keys(errors.value).length) { message.value = '请先修正标红字段'; document.querySelector('.product-workspace')?.scrollIntoView({block:'start'}); return; }
  if (status === '在售' && payload.canPrice && (effectivePrice.value === 0 || (payload.costPrice !== null && effectivePrice.value !== null && effectivePrice.value < payload.costPrice))) {
    riskOpen.value = true;
    if (!await new Promise<boolean>(resolve => { riskResolve = resolve; })) return;
  }
  saving.value = true;
  try {
    const saved = await api<ProductRecord>(form.id ? `/api/admin/products/${encodeURIComponent(form.id)}` : '/api/admin/products', { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    setForm(saved); emit('changed'); emit('notice', status === '在售' ? '产品已保存并上架' : '产品已保存');
    await loadStatusHistory(saved.id || '');
    saving.value = false;
    if (continueNew && mode.value === 'new') { setForm({ ...blankProduct(), sku: makeSku() }); window.scrollTo({top:0}); }
    else navigate(continueNew ? '/products/new' : `/products/${saved.id}`);
  } catch (e) { message.value = e instanceof Error ? e.message : '保存失败'; }
  finally { saving.value = false; }
}
function finishRisk(allow: boolean) { riskOpen.value = false; riskResolve?.(allow); riskResolve = undefined; }
async function upload(options: UploadCustomRequestOptions) {
  const file = options.file.file;
  if (!file) return options.onError();
  if (file.size > 10 * 1024 * 1024) { message.value = '单个附件不能超过10MB'; options.onError(); return; }
  uploading.value++;
  try {
    const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] || ''); reader.onerror = reject; reader.readAsDataURL(file); });
    const a = await api<ProductAsset>('/api/admin/product-assets', {method:'POST', body:JSON.stringify({name:file.name, base64})});
    const role = a.mime.startsWith('image/') ? form.assets.some(a => a.role === 'cover') ? 'image' : 'cover' : /\.(ies|ldt)$/i.test(a.name) ? 'photometry' : /\.glb$/i.test(a.name) ? 'model' : 'document';
    if (role === 'image' && form.assets.filter(a => a.role === 'image').length >= 8) throw new Error('附图最多8张');
    form.assets.push({...a, role}); options.onFinish();
  } catch (e) { message.value = e instanceof Error ? e.message : '上传失败'; options.onError(); }
  finally { uploading.value--; }
}
function removeAsset(id: string) { form.assets = form.assets.filter(a => a.id !== id); }
function asCover(id: string) { form.assets = form.assets.map(a => ({...a, role:a.id === id ? 'cover' : a.role === 'cover' ? 'image' : a.role})); }
function splitCell(value: unknown) { return String(value || '').split(/[、,，;；/]/).map(item => item.trim()).filter(Boolean); }
function numberCell(value: unknown) { const parsed = Number(String(value ?? '').replace(/[¥￥,]/g,'')); return Number.isFinite(parsed) ? parsed : null; }
function boolCell(value: unknown, fallback = false) { const text=String(value ?? '').trim().toLowerCase(); return text ? ['是','true','1','yes','y'].includes(text) : fallback; }
function tabularProduct(row: Record<string, unknown>) {
  const read = (...keys: string[]) => keys.map(key => row[key]).find(value => value !== undefined && value !== '');
  const categoryText = String(read('产品分类','分类','category','categoryId') || '').trim();
  const category = meta.value.categories.find(item => item.id === categoryText || item.label === categoryText || `${item.category1} / ${item.label}` === categoryText);
  const product = blankProduct();
  Object.assign(product, {
    sku:String(read('产品编码','SKU','sku') || '').trim(), name:String(read('产品名称','名称','name') || '').trim(), categoryId:category?.id || categoryText,
    brand:String(read('品牌','brand') || '').trim(), model:String(read('型号','model') || '').trim(), status:String(read('产品状态','状态','status') || '草稿').trim(),
    ecosystems:splitCell(read('平台生态','支持平台','ecosystems')), communicationProtocols:splitCell(read('通信协议','protocols')),
    salesUnit:String(read('销售单位','单位','salesUnit') || category?.unit || '个').trim(), retailPrice:numberCell(read('建议零售价','零售价','retailPrice')),
    salePrice:numberCell(read('门店售价','销售价','salePrice')), canPrice:boolCell(read('独立计价','canPrice'),true), canPlace:boolCell(read('可上点位图','canPlace'),true),
    source:String(read('资料来源','数据来源','source') || `本地表格导入 ${importFileName.value}`).trim(), isSimulated:boolCell(read('模拟资料','isSimulated'),false),
    geometryStatus:String(read('几何状态','geometryStatus') || 'unknown'), parameterStatus:String(read('参数状态','parameterStatus') || 'unknown'), compatibilityStatus:String(read('兼容状态','compatibilityStatus') || 'unknown'),
  });
  return product;
}
async function readImportFile(event: Event) {
  const input = event.target as HTMLInputElement, file=input.files?.[0]; if (!file) return;
  importError.value=''; importFileName.value=file.name;
  try {
    const buffer=await file.arrayBuffer(), lower=file.name.toLowerCase(); let products:any[];
    if (lower.endsWith('.json')) { const parsed=JSON.parse(new TextDecoder('utf-8').decode(buffer)); if (!Array.isArray(parsed)) throw new Error('JSON 顶层必须是产品数组'); products=parsed; }
    else {
      const XLSX=await import('xlsx');
      const workbook=XLSX.read(buffer,{type:'array'}), first=workbook.SheetNames[0]; if (!first) throw new Error('工作簿没有可读取的工作表');
      const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(workbook.Sheets[first],{defval:''}); products=rows.map(tabularProduct);
    }
    if (!products.length) throw new Error('文件中没有产品数据');
    importText.value=JSON.stringify(products,null,2);
  } catch(e) { importError.value=e instanceof Error ? e.message : '文件读取失败'; }
  input.value='';
}
function openImport() { importText.value = JSON.stringify([{sku:'SKU-EXAMPLE-001', name:'示例智能筒灯', categoryId:meta.value.categories.find(c => c.label === '筒灯')?.id, retailPrice:99, status:'草稿', isSimulated:true}],null,2); importError.value=''; importFileName.value=''; importUpdate.value=false; importOpen.value=true; }
async function importRows() {
  if (importBusy.value) return;
  importError.value=''; importBusy.value=true;
  try {
    const products: unknown = JSON.parse(importText.value);
    if (!Array.isArray(products)) throw new Error('请输入产品数组');
    const result = await api<{count:number;created:number;updated:number}>('/api/admin/products/import', {method:'POST',body:JSON.stringify({products,updateExisting:importUpdate.value})});
    importOpen.value=false; emit('notice', `导入完成：新增${result.created}，更新${result.updated}`); emit('changed'); await queryList();
  } catch(e) { importError.value = e instanceof Error ? e.message : '导入失败'; }
  finally { importBusy.value=false; }
}
function beforeUnload(e: BeforeUnloadEvent) { if (dirty.value || uploading.value || saving.value) { e.preventDefault(); e.returnValue=''; } }
watch(() => props.path, loadPath, {immediate:true});
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload);
  window.addEventListener('scroll', onSectionScroll, { passive: true });
  window.requestAnimationFrame(updateActiveSection);
});
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload);
  window.removeEventListener('scroll', onSectionScroll);
  if (sectionFrame) window.cancelAnimationFrame(sectionFrame);
  leaveResolve?.(false); riskResolve?.(false);
});
</script>

<template>
  <div class="product-workspace">
    <NAlert v-if="message" type="error" closable class="product-alert" @close="message=''">{{ message }} <NButton v-if="busy === false && !baseline && mode !== 'list'" text @click="loadPath">重新读取</NButton></NAlert>
    <template v-if="mode === 'categories'">
      <div class="page-toolbar">
        <div>
          <h2>产品分类 <span class="product-count">{{ categoryStats.categoryCount || 0 }}</span></h2>
          <p>分类由布置规则正式物品编码生成，不允许新增或删除；维护映射后，产品上架校验与点位规则会按同一编码同步。</p>
        </div>
        <div class="toolbar-buttons"><NButton :loading="busy" @click="loadPath">刷新</NButton></div>
      </div>
      <div class="product-category-stats">
        <span><b>{{ categoryStats.ruleItemCount || 0 }}</b> 规则物品编码</span>
        <span><b>{{ categoryStats.mappedCount || 0 }}</b> 已映射分类</span>
        <span><b>{{ categoryStats.unmappedCount || 0 }}</b> 未映射</span>
        <span><b>{{ categoryStats.conflictCount || 0 }}</b> 编码冲突</span>
        <span><b>{{ categoryStats.onSaleCount || 0 }}</b> 在售产品</span>
        <span><b>{{ categoryStats.placeableCount || 0 }}</b> 可布点产品</span>
      </div>
      <div class="product-filter product-category-filter">
        <NInput v-model:value="categorySearch" clearable placeholder="搜索分类、物品编码或规则设备分类" aria-label="搜索产品分类" />
        <NSelect v-model:value="categoryLevel" :options="categoryLevelOptions" clearable placeholder="全部一级分类" aria-label="一级分类筛选" />
        <NButton @click="categoryPage = 1">筛选</NButton>
      </div>
      <section class="panel table-panel product-category-table" :aria-busy="busy">
        <table>
          <thead><tr><th>一级分类</th><th>产品分类</th><th>物品编码</th><th>规则设备分类</th><th>关联产品</th><th>可布点</th><th>同步状态</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="category in pagedCategoryRows" :key="category.id">
              <td>{{ category.category1 }}</td>
              <td><strong>{{ category.label }}</strong><small>{{ category.kind }} · 计量单位 {{ category.unit }}</small></td>
              <td><code>{{ category.itemCode || '未映射' }}</code><small>{{ category.ruleId || '—' }}</small></td>
              <td><span class="product-rule-keys">{{ (category.legacyKeys || []).join('、') || '暂无独立设备，等待规则接入' }}</span></td>
              <td>{{ category.productCount }}<small>在售 {{ category.onSaleCount }}</small></td>
              <td>{{ category.placeableCount }}</td>
              <td><NTag size="small" :type="categoryStatusType(category)" :bordered="false">{{ categoryStatus(category) }}</NTag><small>{{ category.mappingSource === 'custom' ? '自定义映射' : '默认映射' }}</small></td>
              <td><NButton text size="small" @click="openMapping(category)">编辑映射</NButton></td>
            </tr>
          </tbody>
        </table>
        <div v-if="!pagedCategoryRows.length && !busy" class="empty">没有匹配的产品分类。</div>
      </section>
      <AdminPagination :page="categoryPage" :page-size="categoryPageSize" :total="filteredCategoryRows.length" :current-count="pagedCategoryRows.length" label="产品分类" :disabled="busy" @update:page="changeCategoryPage" @update:page-size="changeCategoryPageSize" />
    </template>
    <template v-else-if="mode === 'list'">
      <AdminPageHeader
        title="产品库"
        :count="visibleTotal"
        :description="libraryMode==='store' ? '管理门店产品、销售价格和本地资料，选品与布点各有依据。' : '浏览随安装包发布的只读平台设备库；加入门店库后先作为草稿复核。'"
      >
        <template #actions>
          <template v-if="libraryMode==='store'">
            <a class="secondary link-button" :href="exportUrl('csv')">导出 CSV</a>
            <a class="secondary link-button" :href="exportUrl('xls')">导出 Excel</a>
            <NButton @click="openImport">批量导入</NButton>
            <NButton type="primary" @click="navigate('/products/new')">＋ 新增产品</NButton>
          </template>
          <NTag v-else type="warning" :bordered="false">离线镜像 · 模拟参考</NTag>
        </template>
      </AdminPageHeader>
      <div class="admin-tabs product-library-tabs"><button :class="{active:libraryMode==='store'}" @click="switchLibrary('store')">门店设备库</button><button :class="{active:libraryMode==='platform'}" @click="switchLibrary('platform')">平台设备库（离线镜像）</button></div>
      <div class="product-filter">
        <NInput v-model:value="search" clearable placeholder="搜索产品名称、编码、品牌或型号" :input-props="{'aria-label':'搜索产品'}" @keyup.enter="runListQuery" />
        <NSelect v-model:value="categoryFilter" :options="flatCategories" filterable clearable placeholder="全部分类" aria-label="产品分类筛选" />
        <NSelect v-model:value="brandFilter" :options="brandOptions" filterable tag clearable placeholder="全部品牌" aria-label="产品品牌筛选" />
        <NSelect v-model:value="ecosystemFilter" :options="options(meta.ecosystems)" filterable clearable placeholder="全部平台" aria-label="产品平台筛选" />
        <NSelect v-if="libraryMode==='store'" v-model:value="statusFilter" :options="statusFilterOptions" clearable placeholder="全部状态" aria-label="产品状态筛选" />
        <div v-else class="platform-filter-note">平台镜像只读</div>
        <NButton :loading="busy || listBusy || platformBusy" @click="runListQuery">筛选</NButton>
      </div>
      <div v-if="libraryMode==='store'" class="product-batch-bar">
        <span class="product-batch-count">已选 <b>{{ selectedIds.length }}</b> 项</span>
        <NButton size="small" :disabled="!selectedIds.length" @click="openBatch('publish')">批量上架</NButton>
        <NButton size="small" :disabled="!selectedIds.length" @click="openBatch('withdraw')">批量下架</NButton>
        <NButton size="small" :disabled="!selectedIds.length" @click="openBatch('restore')">批量恢复</NButton>
        <NButton size="small" :disabled="!selectedIds.length" @click="openBatch('archive')">批量归档</NButton>
        <NButton size="small" type="primary" :disabled="!selectedIds.length" @click="openBatch('category')">批量修改分类</NButton>
        <NButton v-if="selectedIds.length" text size="small" @click="clearSelection">清除选择</NButton>
        <span class="product-batch-hint">跨页保留选择；筛选条件变化会清空</span>
      </div>
      <section class="panel table-panel product-list-table" :aria-busy="busy">
        <table><thead><tr><th v-if="libraryMode==='store'" class="product-select-col"><NCheckbox :checked="allPageSelected" :indeterminate="somePageSelected" :disabled="!rows.length" aria-label="全选当前页产品" @update:checked="togglePageSelection" /></th><th>产品信息</th><th>分类 / 品牌型号</th><th>销售单位</th><th>有效售价</th><th>状态</th><th>操作</th></tr></thead>
          <tbody v-if="libraryMode==='store'"><tr v-for="p in rows" :key="p.id">
            <td class="product-select-col"><NCheckbox :checked="selectedIdSet.has(String(p.id))" :aria-label="`选择${p.name}`" @update:checked="value => toggleRowSelection(String(p.id), value)" /></td>
            <td><div class="product-list-info"><img v-if="p.assets.find(a=>a.role==='cover')" :src="p.assets.find(a=>a.role==='cover')?.url" alt="产品主图"><span v-else class="product-placeholder" aria-hidden="true">◇</span><div><button class="product-name-link" @click="navigate(`/products/${p.id}`)">{{ p.name }}</button><small>{{ p.sku }}</small></div></div></td>
            <td>{{ p.category }}<small>{{ [p.brand,p.model].filter(Boolean).join(' · ') || '品牌 / 型号未填写' }}</small></td><td>{{ p.salesUnit }}</td><td class="price">{{ p.canPrice ? money(p.price) : '不单独计价' }}<small v-if="p.canPrice">/ {{ p.salesUnit }}</small></td>
            <td><NTag size="small" :type="p.status==='在售'?'success':p.status==='下架'?'warning':p.status==='归档'?'default':'info'" :bordered="false">{{ p.status }}</NTag></td>
            <td><div class="product-row-actions">
              <NButton text size="small" @click="navigate(`/products/${p.id}`)">详情</NButton>
              <NButton v-if="p.status !== '归档'" text size="small" @click="navigate(`/products/${p.id}/edit`)">编辑</NButton>
              <NButton text size="small" @click="navigate(`/products/new?copy=${p.id}`)">复制新增</NButton>
              <NButton v-if="p.status==='草稿' || p.status==='下架'" text size="small" @click="openTransition('publish', p)">上架</NButton>
              <NButton v-if="p.status==='在售'" text size="small" @click="openTransition('withdraw', p)">下架</NButton>
              <NButton v-if="p.status!=='归档'" text size="small" @click="openTransition('archive', p)">归档</NButton>
              <NButton v-if="p.status==='归档'" text size="small" @click="openTransition('restore', p)">恢复</NButton>
            </div></td>
          </tr></tbody>
          <tbody v-else><tr v-for="p in platformRows" :key="p.id">
            <td><div class="product-list-info"><span class="product-placeholder" aria-hidden="true">◇</span><div><strong>{{ p.name }}</strong><small>{{ p.platformCode }}</small></div></div></td>
            <td>{{ p.category }}<small>{{ p.brand }} · {{ p.model }}</small></td><td>{{ p.salesUnit }}</td><td class="price">{{ money(p.price) }}<small>/ {{ p.salesUnit }}</small></td>
            <td><NTag size="small" type="warning" :bordered="false">平台参考</NTag><small>模拟参数 · 加入后需审核</small></td>
            <td><NButton size="small" type="primary" @click="addPlatformProduct(p.id)">加入门店库</NButton></td>
          </tr></tbody>
        </table><div v-if="!visibleCount && !busy && !platformBusy" class="empty">没有匹配的产品，请调整筛选条件。</div><div v-if="busy || platformBusy" class="empty">正在读取本地产品…</div>
      </section>
      <AdminPagination :page="currentPage" :page-size="pageSize" :total="visibleTotal" :current-count="visibleCount" label="产品" :disabled="busy || listBusy || platformBusy" @update:page="changePage" @update:page-size="changePageSize" />
    </template>
    <div v-else-if="busy" class="loading-state">正在读取产品资料…</div>
    <template v-else-if="baseline">
      <div class="page-toolbar product-editor-title"><div><div class="admin-breadcrumb">产品管理 / 产品库 / {{ pageTitle }}</div><h2>{{ pageTitle }} <NTag size="small" :bordered="false">{{ form.status }}</NTag></h2><p>{{ readOnly ? '查看销售规格、安装能力与资料来源。' : archived ? '产品已归档，需先恢复为草稿后才能编辑。' : '先录入基本信息，专业参数按需补充；不完整资料可保存草稿。' }}</p></div><div class="toolbar-buttons"><NButton @click="navigate('/products')">返回产品库</NButton><NButton v-if="readOnly" @click="navigate(`/products/new?copy=${form.id}`)">复制新增</NButton><NButton v-if="readOnly && !archived" type="primary" @click="navigate(`/products/${form.id}/edit`)">编辑产品</NButton><template v-if="readOnly"><NButton v-for="action in statusActions" :key="action.action" :type="action.tone==='danger'?'error':action.tone==='primary'?'primary':'default'" :disabled="saving || uploading>0" @click="openTransition(action.action)">{{ action.label }}</NButton></template></div></div>
      <div class="product-editor-grid">
        <nav class="product-section-nav" aria-label="产品字段分组"><button v-for="(section,index) in sections" :key="section.id" :class="{active:activeSection===section.id}" @click="jump(section.id)"><span>0{{ index+1 }}</span><div>{{ section.name }}<small>{{ section.sub }}</small></div></button></nav>
        <NForm class="product-editor-form" label-placement="top" :disabled="formLocked || saving" :show-require-mark="!readOnly" @submit.prevent>
          <section id="product-section-basic" class="panel product-form-section"><header><span>01</span><div><h3>基本信息</h3></div></header><div class="product-fields-grid">
            <ProductField label="产品名称" field="name" :errors="errors" required class="product-span-2"><NInput v-model:value="form.name" :input-props="{id:'product-name'}" placeholder="例如：超薄防眩筒灯 7W 3000K" :maxlength="100" show-count /></ProductField>
            <ProductField label="产品编码" field="sku" :errors="errors" required hint="自动生成，可修改；编码重复不会覆盖已有产品。"><NInput v-model:value="form.sku" :input-props="{id:'product-sku'}" :maxlength="80" /></ProductField>
            <ProductField label="产品分类" field="categoryId" :errors="errors" :required="form.status==='在售'" hint="选择当前系统分类。"><NCascader :value="form.categoryId || null" :options="categoryOptions" filterable clearable placeholder="选择一级 / 二级分类" data-field="categoryId" @update:value="changeCategory" /></ProductField>
            <ProductField label="品牌" field="brand" hint="可输入本地品牌；无品牌请选择“无品牌”。"><NSelect v-model:value="form.brand" filterable tag :options="brandOptions" placeholder="选择或输入品牌" /></ProductField>
            <ProductField label="产品型号" field="model"><NInput v-model:value="form.model" :input-props="{id:'product-model'}" placeholder="厂商型号，如 DL-7W-30K" /></ProductField>
            <ProductField label="产品系列" field="series"><NInput v-model:value="form.series" :input-props="{id:'product-series'}" placeholder="选填" /></ProductField>
            <ProductField label="检索标签" field="tags"><NSelect v-model:value="form.tags" multiple tag filterable :options="[]" placeholder="输入标签后回车" /></ProductField>
            <ProductField label="产品简介" field="description" class="product-span-2"><NInput v-model:value="form.description" type="textarea" :autosize="{minRows:3,maxRows:6}" :input-props="{id:'product-description'}" placeholder="面向导购和客户的产品介绍" :maxlength="500" show-count /></ProductField>
            <ProductField label="产品状态" field="status" :errors="errors" hint="状态通过上方“上架 / 下架 / 归档 / 恢复”操作流转，编辑保存不会隐式改状态。"><div class="product-status-readonly"><NTag :type="productStatusBadgeType" :bordered="false">{{ form.status }}</NTag><small>{{ statusDescription(form.status) }}</small></div></ProductField>
            <ProductField label="展示排序" field="sortOrder"><NInputNumber v-model:value="form.sortOrder" :min="-99999" :max="99999" :precision="0" :input-props="{id:'product-sortOrder'}" /></ProductField>
            <div class="product-switch-row product-span-2"><NSwitch v-model:value="form.recommended" aria-label="推荐展示" /><div><b>推荐展示</b><small>用于选品展示推荐。</small></div></div>
          </div></section>

          <section id="product-section-pricing" class="panel product-form-section"><header><span>02</span><div><h3>价格与计量</h3></div></header><div class="product-fields-grid">
            <ProductField label="建议零售价（元）" field="retailPrice" :errors="errors" :required="form.canPrice && form.status==='在售'"><NInputNumber v-model:value="form.retailPrice" :min="0" :max="100000000" :precision="2" :show-button="false" :input-props="{id:'product-retailPrice'}" placeholder="未填写不等于0元" /></ProductField>
            <ProductField label="门店售价（元）" field="salePrice" :errors="errors" hint="未填则使用建议零售价。"><NInputNumber v-model:value="form.salePrice" :min="0" :max="100000000" :precision="2" :show-button="false" :input-props="{id:'product-salePrice'}" placeholder="选填" /></ProductField>
            <ProductField label="进货成本（元）" field="costPrice" :errors="errors" hint="内部资料，不进入客户清单。"><NInputNumber v-model:value="form.costPrice" :min="0" :max="100000000" :precision="2" :show-button="false" :input-props="{id:'product-costPrice'}" placeholder="选填" /></ProductField>
            <ProductField label="销售单位" field="salesUnit" :errors="errors"><NSelect v-model:value="form.salesUnit" :options="options(UNITS)" /></ProductField>
            <ProductField label="计量方式" field="quantityMode"><NSelect v-model:value="form.quantityMode" :options="[{label:'按件',value:'piece'},{label:'按长度',value:'length'},{label:'按面积',value:'area'},{label:'套装',value:'bundle'}]" /></ProductField>
            <ProductField label="最小购买量" field="minOrderQty" :errors="errors"><NInputNumber v-model:value="form.minOrderQty" :min="0.001" :input-props="{id:'product-minOrderQty'}" /></ProductField>
            <ProductField label="数量递增量" field="orderStep" :errors="errors"><NInputNumber v-model:value="form.orderStep" :min="0.001" :input-props="{id:'product-orderStep'}" /></ProductField>
            <ProductField label="标准段长（mm）" field="standardLengthMm" :errors="errors" hint="例如1米轨道填1000，不是图上实际路径长度。"><NInputNumber v-model:value="form.standardLengthMm" :min="1" :input-props="{id:'product-standardLengthMm'}" placeholder="按段销售时填写" /></ProductField>
            <ProductField label="每包装数量" field="packQuantity" :errors="errors"><NInputNumber v-model:value="form.packQuantity" :min="0.001" :input-props="{id:'product-packQuantity'}" placeholder="选填" /></ProductField>
            <div class="product-switch-row"><NSwitch v-model:value="form.canPrice" aria-label="独立计价" /><div><b>独立计价</b><small>关闭后清单保留数量，标记不单独计价。</small></div></div>
          </div></section>

          <section id="product-section-control" class="panel product-form-section"><header><span>03</span><div><h3>协议与控制</h3></div></header><div class="product-fields-grid">
            <ProductField label="通信协议" field="communicationProtocols"><NSelect v-model:value="form.communicationProtocols" multiple :options="options(meta.protocols)" placeholder="选择支持的协议" /></ProductField>
            <ProductField label="支持平台生态" field="ecosystems"><NSelect v-model:value="form.ecosystems" multiple :options="options(meta.ecosystems)" placeholder="选填" /></ProductField>
            <ProductField label="调光 / 驱动接口" field="dimmingInterfaces"><NSelect v-model:value="form.dimmingInterfaces" multiple :options="options(meta.dimming)" /></ProductField>
            <ProductField label="网关依赖" field="gatewayRequirement"><NSelect v-model:value="form.gatewayRequirement" :options="[{label:'未知 / 待确认',value:'unknown'},{label:'不需要',value:'none'},{label:'需要兼容网关',value:'required'}]" /></ProductField>
            <ProductField v-if="selectedCategory?.kind==='panel'" label="面板控制功能" field="controlFunctions"><NSelect v-model:value="form.controlFunctions" multiple :options="options(['开关','调光','场景','窗帘'])" /></ProductField>
            <ProductField label="兼容资料状态" field="compatibilityStatus"><NSelect v-model:value="form.compatibilityStatus" :options="DATA_STATES" /></ProductField>
            <ProductField label="兼容系列 / 网关要求" field="compatibilityNote" class="product-span-2"><NInput v-model:value="form.compatibilityNote" :input-props="{id:'product-compatibilityNote'}" placeholder="注明兼容型号或厂商条件，不自动判定任意网关可用" /></ProductField>
            <ProductField v-if="form.compatibilityStatus==='reviewed'" label="兼容验证证据" field="compatibilityEvidence" :errors="errors" required class="product-span-2"><NInput v-model:value="form.compatibilityEvidence" :input-props="{id:'product-compatibilityEvidence'}" placeholder="报告编号 / 验证条件 / 附件说明" /></ProductField>
          </div></section>

          <section id="product-section-placement" class="panel product-form-section"><header><span>04</span><div><h3>安装与布点</h3></div></header><div class="product-fields-grid">
            <div class="product-switch-row product-span-2"><NSwitch v-model:value="form.canPlace" aria-label="可上点位图" /><div><b>可上点位图</b><small>关闭后仍可用于报价，不参与设备布点。</small></div></div>
            <ProductField label="规则产品族" field="productFamily"><NInput :value="selectedCategory?.family || '尚未选择分类'" readonly /></ProductField>
            <ProductField label="适用空间" field="spaceCodes"><NSelect v-model:value="form.spaceCodes" multiple :options="meta.spaces.map(s=>({label:s.name,value:s.code}))" placeholder="选择15类空间中的适用范围" /></ProductField>
            <div class="product-span-2 product-space-actions" v-if="!readOnly"><NButton text size="small" @click="form.spaceCodes=meta.spaces.map(s=>s.code)">全屋适用</NButton><NButton text size="small" @click="form.spaceCodes=[]">清空空间选择</NButton></div>
            <ProductField label="安装方式" field="mountMethods"><NSelect v-model:value="form.mountMethods" multiple :options="options(meta.mountMethods)" /></ProductField>
            <ProductField label="支持安装面" field="mountSurfaces"><NSelect v-model:value="form.mountSurfaces" multiple :options="meta.surfaces" /></ProductField>
            <ProductField v-for="dim in dimensionFields" :key="dim.key" :label="`${dim.label}（mm）`" :field="dim.key" :errors="errors"><NInputNumber v-model:value="form[dim.key]" :min="1" :input-props="{id:`product-${dim.key}`}" placeholder="未提供" /></ProductField>
            <ProductField label="几何资料状态" field="geometryStatus"><NSelect v-model:value="form.geometryStatus" :options="DATA_STATES" /></ProductField>
            <ProductField v-if="form.geometryStatus==='reviewed'" label="几何复核依据" field="geometryEvidence" :errors="errors" required><NInput v-model:value="form.geometryEvidence" :input-props="{id:'product-geometryEvidence'}" placeholder="尺寸报告 / 现场复核记录" /></ProductField>
            <ProductField label="安装限制与说明" field="installationNote" class="product-span-2"><NInput v-model:value="form.installationNote" type="textarea" :autosize="{minRows:2,maxRows:5}" :input-props="{id:'product-installationNote'}" placeholder="最小净距、底盒要求、禁止安装环境等" /></ProductField>
            <NAlert v-if="form.canPlace && !selectedCategory?.legacyKeys.length" type="warning" class="product-span-2">当前分类尚无布点映射。可先保存草稿，或关闭“可上点位图”用于报价；不会伪装成可自动落位。</NAlert>
          </div></section>

          <section id="product-section-specifications" class="panel product-form-section"><header><span>05</span><div><h3>专业规格 <NTag v-if="selectedCategory" size="small" :bordered="false">{{ selectedCategory.label }}</NTag></h3></div></header><div class="product-fields-grid">
            <ProductField v-for="field in fields" :key="field.key" :label="`${field.label}${field.unit ? `（${field.unit}）` : ''}`" :field="`specs.${field.key}`" :errors="errors"><NInputNumber :value="specNumber(field.key)" :min="0" :max="field.max" :input-props="{id:`product-specs.${field.key}`}" placeholder="未提供" @update:value="form.specs[field.key]=$event" /></ProductField>
            <ProductField v-if="['strip','track','light'].includes(selectedCategory?.kind || '')" label="接口 / 配套系列" field="interfaceSeries"><NInput v-model:value="form.interfaceSeries" :input-props="{id:'product-interfaceSeries'}" placeholder="轨道截面系列、电源适配要求等" /></ProductField>
            <ProductField v-if="selectedCategory?.kind==='strip'" label="支持路径形态" field="supportedRouteShapes"><NSelect v-model:value="form.supportedRouteShapes" multiple :options="meta.routes" /></ProductField>
            <ProductField v-if="selectedCategory?.kind==='strip'" label="支持用途" field="applications"><NSelect v-model:value="form.applications" multiple :options="[{label:'通用',value:'general'},{label:'灯槽',value:'cove'},{label:'窗帘盒',value:'curtain_box'},{label:'柜体',value:'cabinet'},{label:'低位',value:'low_position'},{label:'洗墙',value:'wash_wall'}]" /></ProductField>
            <ProductField label="参数资料状态" field="parameterStatus"><NSelect v-model:value="form.parameterStatus" :options="DATA_STATES" /></ProductField>
            <ProductField v-if="form.parameterStatus==='reviewed'" label="实测报告依据" field="parameterEvidence" :errors="errors" required><NInput v-model:value="form.parameterEvidence" :input-props="{id:'product-parameterEvidence'}" /></ProductField>
            <ProductField v-if="['light','strip'].includes(selectedCategory?.kind || '')" label="IES / LDT 数据状态" field="photometryStatus"><NSelect v-model:value="form.photometryStatus" :options="[{label:'缺真实配光',value:'missing'},{label:'合成 / 模拟配光',value:'synthetic'},{label:'厂商提供（项目效果待验证）',value:'manufacturer'},{label:'不适用（被动载体）',value:'not_applicable'}]" /></ProductField>
            <ProductField label="其他规格 / 原始资料" field="specificationNote" class="product-span-2"><NInput v-model:value="form.specificationNote" type="textarea" :autosize="{minRows:2,maxRows:5}" :input-props="{id:'product-specificationNote'}" placeholder="补充材质、防护等级、供电要求或旧规格说明" /></ProductField>
          </div></section>

          <section id="product-section-media" class="panel product-form-section"><header><span>06</span><div><h3>图片与附件</h3></div></header><div class="product-fields-grid">
            <div class="product-span-2" v-if="!readOnly"><NUpload :custom-request="upload" :show-file-list="false" :disabled="saving" accept=".png,.jpg,.jpeg,.webp,.pdf,.ies,.ldt,.glb" multiple><NButton :loading="uploading>0">＋ 添加图片 / 资料</NButton></NUpload><p class="product-field-hint">支持图片、PDF、IES/LDT、GLB，单文件≤10MB；第一张图片默认主图。上传后请保存产品。移除只解除引用，不物理删除本地文件。</p></div>
            <div v-if="!form.assets.length" class="product-empty-media product-span-2">暂无资料，允许稍后补充。图片缺失不阻止保存草稿。</div>
            <div v-for="a in form.assets" :key="a.id" class="product-asset product-span-2"><img v-if="a.mime.startsWith('image/')" :src="a.url" :alt="a.name"><span v-else class="product-placeholder">文</span><div><a :href="a.url" target="_blank" rel="noopener">{{ a.name }}</a><small>{{ (a.size/1024).toFixed(1) }} KB · {{ a.role==='cover'?'主图':a.role==='image'?'附图':'本地附件' }}</small></div><NButton v-if="!readOnly && a.mime.startsWith('image/') && a.role!=='cover'" text @click="asCover(a.id)">设主图</NButton><NButton v-if="!readOnly" text @click="removeAsset(a.id)">移除引用</NButton></div>
            <ProductField label="资料来源" field="source"><NInput v-model:value="form.source" :input-props="{id:'product-source'}" placeholder="厂商目录 / 门店录入等" /></ProductField>
            <div class="product-switch-row"><NSwitch v-model:value="form.isSimulated" aria-label="模拟产品资料" /><div><b>模拟产品资料</b><small>开启后标记为演示资料。</small></div></div>
            <ProductField label="内部备注" field="internalNote" class="product-span-2"><NInput v-model:value="form.internalNote" type="textarea" :autosize="{minRows:2,maxRows:5}" :input-props="{id:'product-internalNote'}" placeholder="门店内部说明，不进入客户导出" /></ProductField>
          </div></section>
        </NForm>
        <aside class="product-preview">
          <section class="panel"><div class="product-preview-heading">产品预览 <NTag v-if="form.isSimulated" size="small" type="warning" :bordered="false">模拟</NTag></div><div class="product-cover"><img v-if="cover" :src="cover.url" alt="当前产品主图"><div v-else><span>◇</span><small>{{ selectedCategory?.label || '等待添加产品' }}</small></div></div><div class="product-preview-body"><h3>{{ form.name || '产品名称' }}</h3><p>{{ [form.brand,form.model].filter(Boolean).join(' · ') || '品牌 / 型号' }}</p><strong>{{ form.canPrice ? money(effectivePrice) : '不单独计价' }} <small v-if="form.canPrice">/ {{ form.salesUnit }}</small></strong><code>{{ form.sku }}</code></div></section>
          <section v-if="readOnly" class="panel product-alternatives"><div class="product-preview-heading">同类在售替代 <NTag size="small" :bordered="false">{{ alternatives.length }}</NTag></div><div class="product-alternatives-body"><p v-if="!alternatives.length" class="product-alternatives-empty">同分类暂无其他在售产品。</p><button v-for="item in alternatives" :key="item.id" @click="navigate(`/products/${item.id}`)"><div><strong>{{ item.name }}</strong><small>{{ item.sku }} · {{ item.reason }}</small></div><span>{{ money(item.price) }}<em>匹配 {{ item.score }}</em></span></button></div></section>
          <div class="product-preview-note"><p v-if="form.id">版本 {{ form.revision }} · {{ new Date(form.updatedAt || '').toLocaleDateString('zh-CN') }}</p></div>
        </aside>
      </div>
      <section v-if="readOnly && statusHistory.length" class="panel product-status-events">
        <header class="product-status-events-head"><div><span class="panel-kicker">AUDIT TRAIL</span><h3>状态流转记录</h3></div><span class="panel-note">共 {{ statusHistory.length }} 条</span></header>
        <div class="product-status-events-table">
          <table><thead><tr><th>时间</th><th>操作人</th><th>变更</th><th>动作</th><th>原因 / 说明</th></tr></thead><tbody>
            <tr v-for="event in statusHistory" :key="event.id">
              <td>{{ new Date(event.createdAt).toLocaleString('zh-CN') }}</td>
              <td>{{ event.actor || '—' }}</td>
              <td>{{ event.fromStatus ? `${event.fromStatus} → ${event.toStatus}` : event.toStatus }}</td>
              <td><code>{{ event.action }}</code></td>
              <td>{{ event.reason || '—' }}</td>
            </tr>
          </tbody></table>
        </div>
      </section>
      <footer v-if="!readOnly" class="product-savebar"><span>{{ archived ? '归档产品只读，恢复为草稿后可继续编辑' : dirty ? '有未保存的修改' : '草稿可随时保存' }}<small v-if="uploading"> · 正在上传{{ uploading }}个附件</small></span><div>
        <NButton :disabled="saving || uploading>0" @click="navigate('/products')">取消</NButton>
        <template v-if="mode==='new'">
          <NButton :loading="saving" :disabled="uploading>0" @click="save('草稿')">保存草稿</NButton>
          <NButton :disabled="saving || uploading>0" @click="save('草稿',true)">保存并继续新增</NButton>
          <NButton type="primary" :loading="saving" :disabled="uploading>0" @click="save('在售')">保存并上架</NButton>
        </template>
        <template v-else>
          <NButton v-for="action in statusActions" :key="action.action" :disabled="saving || uploading>0" @click="openTransition(action.action)">{{ action.label }}</NButton>
          <NButton v-if="!archived" type="primary" :loading="saving" :disabled="uploading>0" @click="save(form.status)">保存修改</NButton>
        </template>
      </div></footer>
    </template>
    <NModal v-model:show="leaveOpen" preset="dialog" title="离开未保存的产品？" content="当前修改尚未保存。放弃后不会写入产品库；已上传文件仍保留在本地。" positive-text="放弃修改" negative-text="继续编辑" :mask-closable="false" @positive-click="finishLeave(true)" @negative-click="finishLeave(false)" @close="finishLeave(false)" />
    <NModal v-model:show="riskOpen" preset="dialog" title="确认销售价格" content="当前有效售价为0元或低于进货成本。确认这是有意设置后再上架。" positive-text="确认价格并上架" negative-text="返回检查" :mask-closable="false" @positive-click="finishRisk(true)" @negative-click="finishRisk(false)" @close="finishRisk(false)" />
    <NModal v-model:show="batchOpen" preset="card" :title="batchTitle" class="product-batch-modal" :mask-closable="!batchBusy">
      <div class="product-batch-body">
        <p class="product-batch-modal-note">已选 <b>{{ selectedIds.length }}</b> 个产品。批量操作会逐项执行，失败项不会写入，并在操作完成后列出原因。</p>
        <template v-if="batchAction === 'category'">
          <label class="product-transition-label">目标产品分类</label>
          <NCascader :value="batchCategoryId" :options="categoryOptions" filterable clearable placeholder="选择一级 / 二级分类" @update:value="value => batchCategoryId = value ? String(value) : null" />
          <NAlert type="info" :show-icon="false">归档产品不会修改分类；在售产品会重新校验分类、单位、售价和布点映射。</NAlert>
        </template>
        <template v-else-if="batchAction === 'archive'">
          <label class="product-transition-label">归档原因（必填）</label>
          <NInput v-model:value="batchReason" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="例如：批次下柜 / 型号停产 / 重复录入" aria-label="批量归档原因" />
        </template>
        <NAlert v-else type="info" :show-icon="false">{{ batchTitle }}会按当前状态逐项校验；不满足条件的产品保持原状态。</NAlert>
        <NAlert v-if="batchError" type="error">{{ batchError }}</NAlert>
      </div>
      <template #footer>
        <div class="product-import-actions">
          <NButton :disabled="batchBusy" @click="batchOpen = false">取消</NButton>
          <NButton type="primary" :loading="batchBusy" @click="submitBatch">{{ batchConfirmLabel }}</NButton>
        </div>
      </template>
    </NModal>
    <NModal v-model:show="transitionOpen" preset="card" title="产品状态流转" class="product-transition-modal" :mask-closable="!transitionBusy">
      <div v-if="transitionTarget && transitionDefinition" class="product-transition-body">
        <div class="product-transition-flow"><strong>{{ transitionTarget.name }}</strong><span>{{ transitionTarget.status }}</span><b>→</b><span class="target">{{ transitionDefinition.to }}</span></div>
        <p class="product-transition-note">{{ transitionDefinition.label }}：{{ statusDescription(transitionDefinition.to) }}</p>
        <NAlert v-if="transitionDefinition.validatesProduct" type="info" :show-icon="false">上架前会重新校验分类、计量单位、售价与布点映射；不完整的资料不会进入在售。</NAlert>
        <label class="product-transition-label">操作原因{{ transitionReasonRequired ? '（必填）' : '（选填）' }}</label>
        <NInput v-model:value="transitionForm.reason" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" :placeholder="transitionReasonRequired ? '请说明归档原因，便于后续追溯' : '可填写交接、价格调整或客户原因' " :input-props="{ 'aria-label': '状态流转原因' }" />
        <NAlert v-if="transitionError" type="error">{{ transitionError }}</NAlert>
      </div>
      <template #footer>
        <div class="product-import-actions">
          <NButton :disabled="transitionBusy" @click="transitionOpen=false">取消</NButton>
          <NButton type="primary" :loading="transitionBusy" @click="submitTransition">确认{{ transitionDefinition?.label || '流转' }}</NButton>
        </div>
      </template>
    </NModal>
    <NModal v-model:show="mappingOpen" preset="card" title="编辑产品分类物品编码映射" class="product-mapping-modal" :mask-closable="!mappingBusy">
      <div v-if="mappingRow" class="product-mapping-body">
        <p class="product-mapping-current">当前分类：<strong>{{ mappingRow.category1 }} / {{ mappingRow.label }}</strong><small>分类本体只读；这里只调整它对应的规则正式物品编码。</small></p>
        <NSelect v-model:value="mappingCode" :options="ruleCodeOptions" filterable placeholder="选择规则正式物品编码" aria-label="选择物品编码" />
        <div v-if="mappingRule" class="product-mapping-preview">
          <span><b>{{ mappingRule.ruleId }}</b> {{ mappingRule.label }}</span>
          <small>规则设备分类：{{ (mappingRule.legacyKeys || []).join('、') || '暂无独立设备，等待规则接入' }}</small>
        </div>
        <NAlert v-if="mappingError" type="error">{{ mappingError }}</NAlert>
        <p class="product-field-hint">同一物品编码只能映射一个产品分类。保存后，产品上架校验、一键套餐和点位规则会读取新映射。</p>
      </div>
      <template #footer>
        <div class="product-import-actions">
          <NButton v-if="mappingRow?.mappingSource === 'custom'" :disabled="mappingBusy" @click="saveCategoryMapping(true)">恢复默认</NButton>
          <NButton :disabled="mappingBusy" @click="mappingOpen=false">取消</NButton>
          <NButton type="primary" :loading="mappingBusy" @click="saveCategoryMapping(false)">保存映射</NButton>
        </div>
      </template>
    </NModal>
    <NModal v-model:show="importOpen" :mask-closable="!importBusy" preset="card" title="批量导入产品 · Excel / CSV / JSON" class="product-import-modal"><NAlert type="info" :show-icon="false">支持 .xlsx、.xls、.csv 和 JSON。Excel 首行使用“产品编码、产品名称、产品分类、品牌、型号、门店售价”等字段；整批校验失败则不写入。</NAlert><label class="product-import-file"><span>选择本地文件</span><input type="file" accept=".xlsx,.xls,.csv,.json" :disabled="importBusy" @change="readImportFile"><b>{{ importFileName || '尚未选择文件，可直接编辑下方 JSON' }}</b></label><NInput v-model:value="importText" type="textarea" :autosize="{minRows:10,maxRows:18}" :disabled="importBusy" :input-props="{'aria-label':'产品导入数据'}" /><NCheckbox v-model:checked="importUpdate" :disabled="importBusy">明确允许更新相同编码的已有产品（默认不覆盖）</NCheckbox><NAlert v-if="importError" type="error">{{ importError }}</NAlert><div class="product-import-actions"><NButton :disabled="importBusy" @click="importOpen=false">取消</NButton><NButton type="primary" :loading="importBusy" @click="importRows">校验并导入</NButton></div></NModal>
  </div>
</template>
