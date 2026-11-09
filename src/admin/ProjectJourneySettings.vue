<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NButton, NInput, NSelect, NTag } from 'naive-ui';
import AdminConfirmDialog from './components/AdminConfirmDialog.vue';
import AdminActionIcon from './components/AdminActionIcon.vue';

type JourneyTask = { key: string; title: string; role: string };
type JourneyStage = { key: string; name: string; description: string; projectStatus: string; tasks: JourneyTask[] };
type Journey = { roles: string[]; stages: JourneyStage[] };
type JourneyPayload = { journey: Journey; defaults: Journey; statuses: string[]; projects: { total: number; active: number } };

const emit = defineEmits<{ notice: [message: string] }>();

const draft = ref<Journey>({ roles: [], stages: [] });
const serverJourney = ref<Journey>({ roles: [], stages: [] });
const baseline = ref('');
const defaults = ref<Journey | null>(null);
const statuses = ref<string[]>([]);
const projectStats = ref({ total: 0, active: 0 });
const loading = ref(true);
const loadError = ref('');
const saving = ref(false);
const error = ref('');
const showRoles = ref(false);
const newRole = ref('');
const confirmState = ref({ show: false, title: '', message: '', detail: '', confirmText: '确认', danger: true });
let confirmResolver: ((value: boolean) => void) | null = null;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const dirty = computed(() => JSON.stringify(draft.value) !== baseline.value);
const taskCount = computed(() => draft.value.stages.reduce((sum, stage) => sum + stage.tasks.length, 0));
const statusOptions = computed(() => statuses.value.filter(status => status !== '已完成').map(status => ({ label: status, value: status })));
const roleOptions = computed(() => draft.value.roles.map(role => ({ label: role, value: role })));
const roleUsage = computed<Record<string, number>>(() => {
  const usage: Record<string, number> = {};
  for (const stage of draft.value.stages) for (const task of stage.tasks) usage[task.role] = (usage[task.role] || 0) + 1;
  return usage;
});

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

function applyPayload(data: JourneyPayload) {
  draft.value = clone(data.journey);
  serverJourney.value = clone(data.journey);
  baseline.value = JSON.stringify(data.journey);
  defaults.value = clone(data.defaults);
  statuses.value = data.statuses || [];
  projectStats.value = data.projects || { total: 0, active: 0 };
  loadError.value = '';
}

async function load() {
  loading.value = true;
  loadError.value = '';
  error.value = '';
  try { applyPayload(await api<JourneyPayload>('/api/admin/settings/project-journey')); }
  catch (e) { loadError.value = e instanceof Error ? e.message : '项目阶段与任务读取失败'; }
  finally { loading.value = false; }
}

function confirmAction(options: { title: string; message: string; detail?: string; confirmText?: string; danger?: boolean }) {
  confirmState.value = { show: true, title: options.title, message: options.message, detail: options.detail || '', confirmText: options.confirmText || '确认', danger: options.danger !== false };
  return new Promise<boolean>(resolve => { confirmResolver = resolve; });
}
function settleConfirm(value: boolean) {
  confirmState.value = { ...confirmState.value, show: false };
  confirmResolver?.(value);
  confirmResolver = null;
}

function stageKey() { return `stage-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`; }
function taskKey(stage: JourneyStage) { return `${stage.key}-task-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`; }

function addStage() {
  if (draft.value.stages.length >= 12) { error.value = '最多配置 12 个项目阶段'; return; }
  const used = new Set(draft.value.stages.map(stage => stage.name));
  let index = draft.value.stages.length + 1;
  while (used.has(`新阶段 ${index}`)) index += 1;
  draft.value.stages.push({ key: stageKey(), name: `新阶段 ${index}`, description: '', projectStatus: statusOptions.value[Math.min(draft.value.stages.length, statusOptions.value.length - 1)]?.value || '方案设计', tasks: [] });
}
async function removeStage(index: number) {
  if (draft.value.stages.length <= 1) { error.value = '至少需要保留一个项目阶段'; return; }
  const stage = draft.value.stages[index];
  if (stage.tasks.length && !(await confirmAction({ title: '删除阶段', message: `确认删除阶段「${stage.name}」？`, detail: `该阶段下的 ${stage.tasks.length} 项任务会一并删除，保存后生效。`, confirmText: '删除阶段' }))) return;
  draft.value.stages.splice(index, 1);
}
function moveStage(index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= draft.value.stages.length) return;
  const [stage] = draft.value.stages.splice(index, 1);
  draft.value.stages.splice(target, 0, stage);
}
function addTask(stage: JourneyStage, afterIndex = stage.tasks.length - 1) {
  if (stage.tasks.length >= 30) { error.value = '单个阶段最多配置 30 项任务'; return; }
  const insertAt = Math.min(Math.max(afterIndex + 1, 0), stage.tasks.length);
  stage.tasks.splice(insertAt, 0, {
    key: taskKey(stage),
    title: `新任务 ${stage.tasks.length + 1}`,
    role: stage.tasks[afterIndex]?.role || draft.value.roles[0] || '',
  });
}
async function removeTask(stage: JourneyStage, index: number) {
  const task = stage.tasks[index];
  if (task.title && !(await confirmAction({ title: '删除任务', message: `确认删除任务「${task.title}」？`, detail: '保存后，新建项目将不再生成该任务；已有项目保留原任务记录。', confirmText: '删除任务' }))) return;
  stage.tasks.splice(index, 1);
}
function moveTask(stage: JourneyStage, index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= stage.tasks.length) return;
  const [task] = stage.tasks.splice(index, 1);
  stage.tasks.splice(target, 0, task);
}

function addRole() {
  const role = newRole.value.trim().slice(0, 12);
  if (!role) return;
  if (draft.value.roles.includes(role)) { error.value = '角色名称不能重复'; return; }
  if (draft.value.roles.length >= 20) { error.value = '负责角色最多 20 个'; return; }
  draft.value.roles.push(role);
  newRole.value = '';
  error.value = '';
}
function renameRole(index: number, value: string) {
  const next = String(value ?? '').trim().slice(0, 12);
  const previous = draft.value.roles[index];
  if (!next) { draft.value.roles = [...draft.value.roles]; return; }
  if (next === previous) return;
  if (draft.value.roles.includes(next)) {
    error.value = '角色名称不能重复';
    draft.value.roles = [...draft.value.roles];
    return;
  }
  draft.value.roles[index] = next;
  for (const stage of draft.value.stages) for (const task of stage.tasks) if (task.role === previous) task.role = next;
  error.value = '';
}
async function removeRole(index: number) {
  const role = draft.value.roles[index];
  const usage = roleUsage.value[role] || 0;
  if (usage) { error.value = `「${role}」仍负责 ${usage} 项任务，请先把这些任务改成其他角色`; return; }
  if (draft.value.roles.length <= 1) { error.value = '至少需要保留一个负责角色'; return; }
  if (!(await confirmAction({ title: '删除角色', message: `确认删除负责角色「${role}」？`, detail: '角色只用于标注任务归属，不影响员工账号与权限。', confirmText: '删除角色' }))) return;
  draft.value.roles.splice(index, 1);
}

async function resetToDefault() {
  if (!defaults.value) return;
  if (!(await confirmAction({ title: '恢复默认模板', message: '确认把阶段、任务和负责角色恢复为系统默认？', detail: '只影响当前编辑内容，点击“保存设置”后才会写入并用于新建项目。', confirmText: '恢复默认', danger: false }))) return;
  draft.value = clone(defaults.value);
  error.value = '';
}

function validate() {
  if (!draft.value.stages.length) return '至少需要保留一个项目阶段';
  if (!draft.value.roles.length) return '至少需要保留一个负责角色';
  for (const [index, stage] of draft.value.stages.entries()) {
    if (!stage.name.trim()) return `第 ${index + 1} 个阶段缺少名称`;
    for (const [taskIndex, task] of stage.tasks.entries()) {
      if (!task.title.trim()) return `阶段「${stage.name}」第 ${taskIndex + 1} 项任务缺少名称`;
      if (!task.role) return `任务「${task.title}」还没有选择负责角色`;
    }
  }
  return '';
}

async function save() {
  if (saving.value) return;
  const message = validate();
  if (message) { error.value = message; return; }
  saving.value = true;
  error.value = '';
  try {
    applyPayload(await api<JourneyPayload>('/api/admin/settings/project-journey', { method: 'PUT', body: JSON.stringify({ journey: draft.value }) }));
    emit('notice', `项目阶段与任务已保存：${draft.value.stages.length} 个阶段 / ${taskCount.value} 项任务`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '项目阶段与任务保存失败';
    emit('notice', error.value);
  }
  finally { saving.value = false; }
}
function cancel() {
  draft.value = clone(serverJourney.value);
  error.value = '';
}

onMounted(load);
</script>

<template>
  <div v-if="loading" class="loading-state">正在读取项目阶段与任务…</div>
  <section v-else-if="loadError" class="panel journey-load-error">
    <div class="panel-head"><div><h3>项目阶段与任务读取失败</h3></div></div>
    <div class="admin-panel-body">
      <p>当前未能读取阶段任务配置，请先重新加载；在配置读取成功前不要编辑，避免覆盖原配置。</p>
      <code>{{ loadError }}</code>
      <div class="button-row"><NButton size="small" type="primary" @click="load">重新加载</NButton></div>
    </div>
  </section>

  <template v-else>
    <section class="panel journey-panel">
      <div class="panel-head">
        <div><h3>项目阶段与任务</h3></div>
        <div class="journey-head-tools">
          <NTag :bordered="false">{{ draft.stages.length }} 个阶段 · {{ taskCount }} 项任务</NTag>
          <NButton size="small" secondary @click="showRoles = true">负责角色（{{ draft.roles.length }}）</NButton>
          <NButton size="small" secondary @click="addStage">新增阶段</NButton>
        </div>
      </div>
      <p class="journey-panel-note">
        每个任务在任务行内选择负责角色。保存后用于<strong>新建项目</strong>自动生成阶段任务；已有 {{ projectStats.total }} 个项目（进行中 {{ projectStats.active }} 个）保留建档时的记录，不会被改写。
      </p>
      <div class="journey-stage-list">
        <article v-for="(stage, stageIndex) in draft.stages" :key="stage.key" class="journey-stage-card">
          <header class="journey-stage-head">
            <span class="journey-stage-index" aria-hidden="true">{{ stageIndex + 1 }}</span>
            <div class="journey-stage-fields">
              <div class="journey-field">
                <span class="journey-field-label">阶段名称</span>
                <NInput v-model:value="stage.name" :maxlength="24" class="journey-stage-name" placeholder="例如：需求建档" aria-label="阶段名称" />
              </div>
              <div class="journey-field">
                <span class="journey-field-label">阶段描述</span>
                <NInput v-model:value="stage.description" :maxlength="80" placeholder="例如：客户、房屋与预算信息" aria-label="阶段描述" />
              </div>
            </div>
            <label class="journey-status-field">
              <span class="journey-field-label">对应项目状态</span>
              <NSelect v-model:value="stage.projectStatus" :options="statusOptions" aria-label="阶段对应的项目状态" />
            </label>
            <div class="journey-stage-actions">
              <button type="button" class="journey-icon-btn" title="上移阶段" aria-label="上移阶段" :disabled="stageIndex === 0" @click="moveStage(stageIndex, -1)"><AdminActionIcon name="up" /></button>
              <button type="button" class="journey-icon-btn" title="下移阶段" aria-label="下移阶段" :disabled="stageIndex === draft.stages.length - 1" @click="moveStage(stageIndex, 1)"><AdminActionIcon name="down" /></button>
              <button type="button" class="journey-icon-btn danger" title="删除阶段" aria-label="删除阶段" @click="removeStage(stageIndex)"><AdminActionIcon name="close" /></button>
            </div>
          </header>
          <div class="journey-task-section">
            <div v-if="stage.tasks.length" class="journey-task-columns" aria-hidden="true"><span></span><span>任务名称</span><span>负责角色</span><span></span></div>
            <div v-if="stage.tasks.length" class="journey-task-rows">
              <div v-for="(task, taskIndex) in stage.tasks" :key="task.key" class="journey-task-row">
                <span class="journey-task-no">{{ stageIndex + 1 }}.{{ taskIndex + 1 }}</span>
                <NInput v-model:value="task.title" :maxlength="40" size="small" placeholder="任务名称" aria-label="任务名称" />
                <NSelect v-model:value="task.role" :options="roleOptions" size="small" placeholder="选择负责角色" aria-label="负责角色" />
                <div class="journey-stage-actions">
                  <button type="button" class="journey-icon-btn" title="上移任务" aria-label="上移任务" :disabled="taskIndex === 0" @click="moveTask(stage, taskIndex, -1)"><AdminActionIcon name="up" /></button>
                  <button type="button" class="journey-icon-btn" title="下移任务" aria-label="下移任务" :disabled="taskIndex === stage.tasks.length - 1" @click="moveTask(stage, taskIndex, 1)"><AdminActionIcon name="down" /></button>
                  <button type="button" class="journey-icon-btn" title="在下方新增任务" aria-label="在下方新增任务" @click="addTask(stage, taskIndex)"><AdminActionIcon name="plus" /></button>
                  <button type="button" class="journey-icon-btn danger" title="删除任务" aria-label="删除任务" @click="removeTask(stage, taskIndex)"><AdminActionIcon name="close" /></button>
                </div>
              </div>
            </div>
            <div v-else class="journey-task-empty">
              <p>该阶段还没有任务。没有任务的阶段不会阻塞后续阶段，项目详情会显示“未配置任务”。</p>
              <NButton size="tiny" secondary @click="addTask(stage, -1)">新增任务</NButton>
            </div>
          </div>
        </article>
      </div>
      <div v-if="!draft.stages.length" class="empty">还没有项目阶段，先新增一个阶段。</div>
    </section>

    <div v-if="error" class="journey-error">{{ error }}</div>
  </template>

  <div v-if="!loading && !loadError" class="admin-form-footer journey-footer">
    <NButton attr-type="button" :disabled="saving || !dirty" @click="cancel">取消</NButton>
    <NButton type="primary" :loading="saving" :disabled="!dirty" @click="save">保存设置</NButton>
    <NButton attr-type="button" secondary :disabled="saving" @click="resetToDefault">恢复默认模板</NButton>
    <span class="journey-footer-note">{{ dirty ? '有未保存的修改，切换页面前请先保存。' : '当前配置已保存。' }}</span>
  </div>

  <div v-if="showRoles" class="modal-backdrop" @click.self="showRoles = false">
    <div class="modal business-form-modal journey-role-modal" role="dialog" aria-label="负责角色">
      <div class="modal-head">
        <div>
          <div class="admin-breadcrumb">项目阶段与任务 / 负责角色</div>
          <h3>负责角色</h3>
          <p>角色用于标注“哪项任务由谁负责”，不会改变员工账号的权限。</p>
        </div>
        <button type="button" aria-label="关闭" @click="showRoles = false">×</button>
      </div>
      <div class="journey-role-manage">
        <div v-for="(role, index) in draft.roles" :key="role" class="journey-role-manage-row">
          <NInput :value="role" maxlength="12" size="small" aria-label="角色名称" @change="value => renameRole(index, value)" />
          <span class="journey-role-usage">{{ roleUsage[role] || 0 }} 项任务</span>
          <button type="button" class="danger-link" :disabled="Boolean(roleUsage[role])" :title="roleUsage[role] ? '该角色仍被任务使用，不能删除' : '删除角色'" @click="removeRole(index)">删除</button>
        </div>
        <p v-if="!draft.roles.length" class="journey-task-empty">还没有负责角色，先添加一个。</p>
      </div>
      <div class="journey-role-add">
        <NInput v-model:value="newRole" size="small" maxlength="12" placeholder="新增角色，例如：灯光顾问" @keyup.enter="addRole" />
        <NButton size="small" secondary @click="addRole">添加</NButton>
      </div>
      <div class="modal-actions">
        <NButton attr-type="button" type="primary" @click="showRoles = false">完成</NButton>
      </div>
    </div>
  </div>

  <AdminConfirmDialog
    :show="confirmState.show"
    :title="confirmState.title"
    :message="confirmState.message"
    :detail="confirmState.detail"
    :confirm-text="confirmState.confirmText"
    :danger="confirmState.danger"
    @update:show="value => { if (!value) settleConfirm(false); }"
    @confirm="settleConfirm(true)"
  />
</template>
