<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { NButton, NInput, NModal, NSelect, NTag } from 'naive-ui';
import AdminPageHeader from './components/AdminPageHeader.vue';
import AdminFilterBar from './components/AdminFilterBar.vue';
import AdminPagination from './components/AdminPagination.vue';
import AdminConfirmDialog from './components/AdminConfirmDialog.vue';
import { queryPage, queryPageSize, readRouteQuery, updateRouteQuery } from './hash-query';

type Project = { id: string; name: string; customerId?: string | null; customerName?: string; area?: number; schemeType?: string };
type Customer = { id: string; name: string; phone?: string };
type DesignSummary = { furniture?: number; devices?: number; placed?: number; pending?: number; zones?: number; circuits?: number };
type DesignVersion = {
  id: string; designId: string; designName?: string; projectId?: string; versionNo: number; name: string;
  ruleVersion: string; status: string; summary: DesignSummary; createdAt: string;
};
type Design = {
  id: string; name: string; projectId: string; projectName: string; customerId: string; customerName: string;
  status: string; ruleVersion: string; latestVersionNo: number; versionCount: number;
  summary: DesignSummary; createdAt: string; updatedAt: string; versions?: DesignVersion[];
};

const props = defineProps<{ path: string; projects: Project[]; customers: Customer[] }>();
const emit = defineEmits<{ navigate: [path: string]; changed: []; notice: [message: string] }>();

const designs = ref<Design[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(30);
const search = ref('');
const linked = ref('all');
const statusFilter = ref('全部');
const projectFilter = ref('');
const loading = ref(false);
const detailLoading = ref(false);
const detail = ref<Design | null>(null);
const saving = ref(false);
const formError = ref('');
const showForm = ref(false);
const editingId = ref('');
const form = ref({ name: '', projectId: '', customerId: '', status: '设计中', ruleVersion: '2026-10-21-V1' });
const confirmState = ref({ show: false, title: '', message: '', detail: '', confirmText: '确认归档', danger: true });
let confirmResolver: ((value: boolean) => void) | null = null;

const cleanPath = computed(() => props.path.split('?')[0]);
const detailId = computed(() => /^\/designs\/([^/]+)$/.exec(cleanPath.value)?.[1] || '');
const linkedOptions = [
  { label: '全部方案', value: 'all' },
  { label: '已关联项目', value: 'linked' },
  { label: '独立方案', value: 'standalone' },
];
const statusOptions = ['全部', '设计中', '已定稿', '已归档'].map(value => ({ label: value, value }));
const projectOptions = computed(() => [{ label: '不关联项目', value: '' }, ...props.projects.map(item => ({ label: `${item.name}${item.customerName ? ` · ${item.customerName}` : ''}`, value: item.id }))]);
const customerOptions = computed(() => [{ label: '不关联客户', value: '' }, ...props.customers.map(item => ({ label: `${item.name}${item.phone ? ` · ${item.phone}` : ''}`, value: item.id }))]);
const dateTime = (value: string) => value ? new Date(value).toLocaleString('zh-CN') : '—';
const fullDate = (value: string) => value ? new Date(value).toLocaleDateString('zh-CN') : '—';
const summaryText = (summary: DesignSummary = {}) => `家具 ${summary.furniture || 0} · 设备 ${summary.devices || 0} · 已布置 ${summary.placed || 0} · 待处理 ${summary.pending || 0} · 回路 ${summary.circuits || 0}`;
// 列表列宽有限，只保留最能判断方案规模的三个口径；完整口径在方案详情里展示。
const listSummaryText = (summary: DesignSummary = {}) => `家具 ${summary.furniture || 0} · 设备 ${summary.devices || 0} · 待处理 ${summary.pending || 0}`;
const statusType = (status: string) => status === '已定稿' ? 'success' : status === '已归档' ? 'default' : 'warning';
const projectName = (design: Design) => design.projectName || (design.projectId ? props.projects.find(item => item.id === design.projectId)?.name || design.projectId : '');

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = options?.body == null ? {} : { 'content-type': 'application/json' };
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options?.headers as Record<string, string> || {}) } });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) window.dispatchEvent(new CustomEvent('qone-auth-expired'));
  if (!response.ok) throw new Error(body.error || body.message || `请求失败 ${response.status}`);
  return body;
}

function applyRoute(path: string) {
  if (detailId.value) { loadDetail(); return; }
  const query = readRouteQuery(path);
  search.value = query.get('search') || '';
  linked.value = query.get('linked') || 'all';
  statusFilter.value = query.get('status') || '全部';
  projectFilter.value = query.get('projectId') || '';
  page.value = queryPage(query.get('page'));
  pageSize.value = queryPageSize(query.get('pageSize'));
  loadList();
}

async function loadList() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      search: search.value,
      linked: linked.value,
      status: statusFilter.value,
      page: String(page.value),
      pageSize: String(pageSize.value),
    });
    if (projectFilter.value) params.set('projectId', projectFilter.value);
    const data = await api<{ designs: Design[]; total: number }>(`/api/admin/designs?${params}`);
    designs.value = data.designs;
    total.value = data.total;
  } catch (error) {
    emit('notice', error instanceof Error ? error.message : '设计方案读取失败');
  } finally {
    loading.value = false;
  }
}

async function loadDetail() {
  if (!detailId.value) { detail.value = null; return; }
  detailLoading.value = true;
  try {
    detail.value = await api<Design>(`/api/admin/designs/${encodeURIComponent(detailId.value)}`);
  } catch (error) {
    detail.value = null;
    emit('notice', error instanceof Error ? error.message : '设计方案详情读取失败');
  } finally {
    detailLoading.value = false;
  }
}

function queryList() {
  page.value = 1;
  updateRouteQuery({ page: 1, pageSize: pageSize.value, search: search.value || null, linked: linked.value === 'all' ? null : linked.value, status: statusFilter.value === '全部' ? null : statusFilter.value, projectId: projectFilter.value || null });
  loadList();
}
function resetFilters() {
  search.value = '';
  linked.value = 'all';
  statusFilter.value = '全部';
  projectFilter.value = '';
  queryList();
}
function changePage(value: number) {
  page.value = value;
  updateRouteQuery({ page: value, pageSize: pageSize.value, search: search.value || null, linked: linked.value === 'all' ? null : linked.value, status: statusFilter.value === '全部' ? null : statusFilter.value, projectId: projectFilter.value || null });
  loadList();
}
function changePageSize(value: number) {
  pageSize.value = value;
  page.value = 1;
  updateRouteQuery({ page: 1, pageSize: value, search: search.value || null, linked: linked.value === 'all' ? null : linked.value, status: statusFilter.value === '全部' ? null : statusFilter.value, projectId: projectFilter.value || null });
  loadList();
}

function openCreate() {
  editingId.value = '';
  formError.value = '';
  form.value = { name: '', projectId: projectFilter.value || '', customerId: '', status: '设计中', ruleVersion: '2026-10-21-V1' };
  syncCustomerFromProject();
  showForm.value = true;
}
function openEdit(design: Design) {
  editingId.value = design.id;
  formError.value = '';
  form.value = { name: design.name, projectId: design.projectId || '', customerId: design.customerId || '', status: design.status, ruleVersion: design.ruleVersion };
  showForm.value = true;
}
function syncCustomerFromProject() {
  if (!form.value.projectId) return;
  const project = props.projects.find(item => item.id === form.value.projectId);
  if (project?.customerId) form.value.customerId = project.customerId;
}
async function saveDesign() {
  if (saving.value) return;
  if (!form.value.name.trim()) { formError.value = '请填写方案名称'; return; }
  saving.value = true;
  formError.value = '';
  try {
    const editing = editingId.value;
    const saved = await api<Design>(editing ? `/api/admin/designs/${encodeURIComponent(editing)}` : '/api/admin/designs', {
      method: editing ? 'PUT' : 'POST',
      body: JSON.stringify(form.value),
    });
    showForm.value = false;
    emit('notice', editing ? '设计方案已更新' : '设计方案已创建，可进入工作台开始布置');
    emit('changed');
    if (editing) { await loadDetail(); await loadList(); }
    else emit('navigate', `/designs/${saved.id}`);
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '设计方案保存失败';
  } finally {
    saving.value = false;
  }
}

function openDesign(design: Design, version?: DesignVersion) {
  const params = new URLSearchParams({ design: design.id, restore: '1' });
  if (version) params.set('version', version.id);
  window.location.href = `/app/?${params.toString()}`;
}

function confirmAction(options: { title: string; message: string; detail?: string; confirmText?: string; danger?: boolean }) {
  confirmState.value = { show: true, title: options.title, message: options.message, detail: options.detail || '', confirmText: options.confirmText || '确认归档', danger: options.danger !== false };
  return new Promise<boolean>(resolve => { confirmResolver = resolve; });
}
function settleConfirm(value: boolean) {
  confirmState.value = { ...confirmState.value, show: false };
  confirmResolver?.(value);
  confirmResolver = null;
}
async function setStatus(design: Design, status: string) {
  if (status === '已归档') {
    const approved = await confirmAction({
      title: '归档设计方案',
      message: `确认归档「${design.name}」？`,
      detail: '归档后仍可查看历史版本，但需恢复为「设计中」才能继续保存新版本。',
      confirmText: '确认归档',
    });
    if (!approved) return;
  }
  try {
    detail.value = await api<Design>(`/api/admin/designs/${encodeURIComponent(design.id)}`, { method: 'PUT', body: JSON.stringify({ status }) });
    emit('notice', status === '已归档' ? '设计方案已归档' : `方案状态已更新为${status}`);
    emit('changed');
  } catch (error) {
    emit('notice', error instanceof Error ? error.message : '方案状态更新失败');
  }
}

watch(() => props.path, applyRoute);
onMounted(() => applyRoute(props.path));
</script>

<template>
  <template v-if="detailId">
    <div class="admin-breadcrumb design-breadcrumb">
      <button type="button" class="crumb-link" @click="emit('navigate', '/designs')">设计方案</button> /
      <strong>{{ detail?.name || detailId }}</strong>
    </div>
    <div v-if="detailLoading" class="loading-state detail-loading">正在读取设计方案…</div>
    <template v-else-if="detail">
      <AdminPageHeader :title="detail.name" description="设计方案是独立对象，可关联客户项目，也可脱离项目单独维护。">
        <template #meta><div class="design-meta-line"><NTag :type="statusType(detail.status)" :bordered="false">{{ detail.status }}</NTag><span>{{ detail.id }}</span><span v-if="detail.projectId">关联项目 {{ detail.projectName || detail.projectId }}</span><span v-else>独立方案 · 未关联项目</span></div></template>
        <template #actions>
          <NButton @click="openEdit(detail)">编辑信息</NButton>
          <NButton v-if="detail.status === '设计中'" @click="setStatus(detail, '已定稿')">标记定稿</NButton>
          <NButton v-if="detail.status !== '已归档'" @click="setStatus(detail, '已归档')">归档</NButton>
          <NButton v-else @click="setStatus(detail, '设计中')">恢复设计</NButton>
          <NButton type="primary" @click="openDesign(detail)">打开设计</NButton>
        </template>
      </AdminPageHeader>

      <section class="panel design-detail-card">
        <div class="design-detail-grid">
          <div><span>关联项目</span><strong v-if="detail.projectId"><button class="table-link" @click="emit('navigate', `/projects/${detail.projectId}`)">{{ detail.projectName || detail.projectId }}</button></strong><strong v-else>未关联项目</strong></div>
          <div><span>客户</span><strong>{{ detail.customerName || '未关联客户' }}</strong></div>
          <div><span>规则版本</span><strong>{{ detail.ruleVersion }}</strong></div>
          <div><span>最新版本</span><strong>{{ detail.latestVersionNo ? `V${detail.latestVersionNo}` : '尚未保存' }} · 共 {{ detail.versionCount }} 个</strong></div>
          <div><span>创建时间</span><strong>{{ dateTime(detail.createdAt) }}</strong></div>
          <div><span>最近更新</span><strong>{{ dateTime(detail.updatedAt) }}</strong></div>
          <div class="design-detail-span"><span>方案规模</span><strong>{{ summaryText(detail.summary) }}</strong></div>
        </div>
      </section>

      <section class="panel table-panel design-version-panel">
        <div class="panel-head"><div><span class="panel-kicker">DESIGN VERSIONS</span><h3>历史版本</h3></div><span class="panel-note">从任意版本继续设计会生成新的版本，不覆盖历史快照</span></div>
        <table>
          <thead><tr><th>版本</th><th>版本名称</th><th>方案规模</th><th>规则版本</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="version in detail.versions" :key="version.id">
              <td><span class="design-version-badge">V{{ version.versionNo }}</span></td>
              <td><strong>{{ version.name }}</strong><small>{{ version.id }}</small></td>
              <td><span class="design-summary-cell">{{ summaryText(version.summary) }}</span></td>
              <td>{{ version.ruleVersion }}</td>
              <td><NTag size="small" :bordered="false">{{ version.status }}</NTag></td>
              <td>{{ dateTime(version.createdAt) }}</td>
              <td><div class="table-actions"><button class="table-link" @click="openDesign(detail)">打开最新</button><button class="table-link" @click="openDesign(detail, version)">从此版本继续</button></div></td>
            </tr>
            <tr v-if="!detail.versions?.length"><td colspan="7"><div class="empty">还没有设计版本。打开设计后点击「保存方案版本」生成第一个版本。</div></td></tr>
          </tbody>
        </table>
      </section>
    </template>
  </template>

  <template v-else>
    <AdminPageHeader title="设计方案" description="2D 布置方案独立管理；可关联客户项目，也可作为独立方案单独保存版本。">
      <template #actions><NButton type="primary" @click="openCreate">＋ 新建设计方案</NButton></template>
    </AdminPageHeader>
    <AdminFilterBar label="设计方案筛选">
      <NInput v-model:value="search" clearable placeholder="搜索方案、项目或客户" @keyup.enter="queryList" />
      <NSelect v-model:value="linked" :options="linkedOptions" style="width: 150px" />
      <NSelect v-model:value="statusFilter" :options="statusOptions" style="width: 130px" />
      <NSelect v-if="projectFilter" v-model:value="projectFilter" :options="projectOptions" style="width: 240px" @update:value="queryList" />
      <NButton @click="queryList">搜索</NButton>
      <NButton v-if="search || linked !== 'all' || statusFilter !== '全部' || projectFilter" quaternary @click="resetFilters">重置</NButton>
      <template #summary>共 {{ total }} 个设计方案 · {{ designs.filter(item => !item.projectId).length }} 个独立方案</template>
    </AdminFilterBar>

    <section class="panel table-panel design-plan-table" :aria-busy="loading">
      <table>
        <thead><tr><th>方案</th><th>关联项目 / 客户</th><th>版本 / 规则</th><th>方案规模</th><th>状态</th><th>最近更新</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="design in designs" :key="design.id">
            <td><button class="project-name-link" @click="emit('navigate', `/designs/${design.id}`)"><strong>{{ design.name }}</strong><small>{{ design.id }}</small></button></td>
            <td><button v-if="design.projectId" class="table-link" @click="emit('navigate', `/projects/${design.projectId}`)">{{ projectName(design) }}</button><span v-else class="design-standalone-tag">独立方案</span><small class="design-nowrap">客户 {{ design.customerName || '未关联' }}</small></td>
            <td><strong>{{ design.latestVersionNo ? `V${design.latestVersionNo}` : '尚未保存' }}</strong><small class="design-nowrap">共 {{ design.versionCount }} 个 · {{ design.ruleVersion }}</small></td>
            <td><span class="design-summary-cell design-nowrap">{{ listSummaryText(design.summary) }}</span></td>
            <td><NTag size="small" :type="statusType(design.status)" :bordered="false">{{ design.status }}</NTag></td>
            <td class="design-nowrap">{{ fullDate(design.updatedAt) }}</td>
            <td><div class="table-actions"><button class="table-link" @click="emit('navigate', `/designs/${design.id}`)">查看</button><button class="table-link" @click="openDesign(design)">打开设计</button><button class="table-link" @click="openEdit(design)">编辑</button></div></td>
          </tr>
          <tr v-if="!designs.length"><td colspan="7"><div class="empty">{{ search || projectFilter || linked !== 'all' || statusFilter !== '全部' ? '没有匹配的设计方案，请调整筛选条件。' : '还没有设计方案，先新建一个独立方案或从项目进入设计。' }}</div></td></tr>
        </tbody>
      </table>
    </section>
    <AdminPagination v-if="total" :page="page" :page-size="pageSize" :total="total" :current-count="designs.length" label="设计方案" :disabled="loading" @update:page="changePage" @update:page-size="changePageSize" />
  </template>

  <NModal v-model:show="showForm" preset="card" :title="editingId ? '编辑设计方案' : '新建设计方案'" style="width: min(560px, calc(100vw - 32px))" :bordered="false">
    <div class="design-form">
      <label><span>方案名称 <i>*</i></span><NInput v-model:value="form.name" placeholder="例如：李女士 · 三室两厅方案 A" /></label>
      <label><span>关联项目</span><NSelect v-model:value="form.projectId" :options="projectOptions" placeholder="可选择不关联项目" @update:value="syncCustomerFromProject" /></label>
      <label><span>关联客户</span><NSelect v-model:value="form.customerId" :options="customerOptions" placeholder="可选择不关联客户" /></label>
      <div class="design-form-row">
        <label><span>规则版本</span><NInput v-model:value="form.ruleVersion" /></label>
        <label><span>方案状态</span><NSelect v-model:value="form.status" :options="statusOptions.filter(item => item.value !== '全部')" /></label>
      </div>
      <p class="design-form-hint">设计方案是独立对象；关联项目后，项目详情会同步显示该方案的版本。不关联项目也可以正常保存 2D 布置和版本。</p>
      <p v-if="formError" class="form-error">{{ formError }}</p>
    </div>
    <template #footer>
      <div class="modal-actions design-modal-actions">
        <NButton @click="showForm = false">取消</NButton>
        <NButton type="primary" :loading="saving" @click="saveDesign">{{ editingId ? '保存修改' : '创建方案' }}</NButton>
      </div>
    </template>
  </NModal>

  <AdminConfirmDialog
    :show="confirmState.show"
    :title="confirmState.title"
    :message="confirmState.message"
    :detail="confirmState.detail"
    :confirm-text="confirmState.confirmText"
    :danger="confirmState.danger"
    @confirm="settleConfirm(true)"
    @update:show="value => { if (!value) settleConfirm(false); }"
  />
</template>
