<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NCheckbox, NProgress } from 'naive-ui';
import AdminStatusHistory from './components/AdminStatusHistory.vue';

type ProjectTask = { id: string; stageKey: string; title: string; owner: string; dueDate: string; done: boolean };
type ProjectStage = { key: string; name: string; description: string; status: 'done' | 'active' | 'pending' | 'skipped'; completed: number; total: number };
type ProjectDeliverable = { key: string; title: string; description: string; status: string; action: string; href: string };
type Project = {
  id: string;
  name: string;
  customerName: string;
  customerPhone?: string;
  customerSource?: string;
  customerNote?: string;
  area: number;
  status: string;
  schemeType: string;
  updatedAt: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  currentStage: string;
  nextTask: string;
  deadline: string;
  stages: ProjectStage[];
  payload: {
    houseType: string;
    address: string;
    budget: number;
    manager: string;
    requirements: string[];
    tasks: ProjectTask[];
    deliverables: ProjectDeliverable[];
  };
};

const props = defineProps<{ project: Project; savingTask?: string }>();
const emit = defineEmits<{ toggleTask: [task: ProjectTask, done: boolean]; edit: []; quote: []; design: []; back: [] }>();

const money = (value: number) => `¥${Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fullDate = (value: string) => value ? new Date(value).toLocaleDateString('zh-CN') : '—';
const tasksFor = (stage: ProjectStage) => props.project.payload.tasks.filter(task => task.stageKey === stage.key);
const deliverableIcon = (key: string) => key === 'floorplan' ? '▦' : key === 'devices' ? '◇' : key === 'layout' ? '⌁' : key === 'quote' ? '¥' : '▤';
const totalStages = computed(() => props.project.stages.length);
const projectStatusFlow = ['待设计', '方案设计', '待报价', '施工交付', '已完成'];
const statusSteps = computed(() => {
  const status = props.project.status;
  const currentIndex = projectStatusFlow.indexOf(status);
  const steps: any[] = projectStatusFlow.map((label, index) => ({
    key: label,
    label,
    state: index === currentIndex ? 'current' : index < currentIndex ? 'done' : 'pending',
    note: index === currentIndex ? `最近更新 ${fullDate(props.project.updatedAt)}` : '',
  }));
  if (status === '已归档') {
    steps.forEach(step => { step.state = 'done'; });
    steps.push({ key: 'archived', label: '已归档', state: 'void', terminal: true, note: '终态 · 不再推进' });
  }
  return steps;
});
const statusBadge = computed(() => {
  const index = projectStatusFlow.indexOf(props.project.status);
  return index >= 0 ? `${index + 1} ${props.project.status}` : props.project.status;
});
const statusBadgeType = computed<'default' | 'success' | 'warning'>(() => (
  props.project.status === '已完成' ? 'success' : props.project.status === '已归档' ? 'default' : 'warning'
));
</script>

<template>
  <div class="project-detail-backbar">
    <button class="back-link" @click="emit('back')">← 返回客户项目</button>
    <span>客户项目 / {{ project.name }}</span>
  </div>
  <section class="panel project-overview-panel">
    <div class="project-overview-head">
      <div class="overview-identity">
        <div class="hero-icon">⌂</div>
        <div>
          <div class="hero-title">
            <h2>{{ project.name }}</h2>
            <span class="status-tag" :data-status="project.status">{{ project.status }}</span>
          </div>
          <p>{{ project.id }} · {{ project.customerName }} · {{ project.area }}㎡ · {{ project.schemeType }}</p>
          <div class="project-contact-line">
            <span>{{ project.customerPhone || '电话待补充' }}</span>
            <span>{{ project.customerSource || '客户来源待补充' }}</span>
            <span>负责人 {{ project.payload.manager || '待分配' }}</span>
          </div>
        </div>
      </div>
      <div class="overview-progress">
        <div><span>总体进度</span><strong>{{ project.progress }}%</strong></div>
        <NProgress type="line" :percentage="project.progress" :show-indicator="false" color="#1687f5" rail-color="#e7eef5" />
        <small>{{ project.completedTasks }}/{{ project.totalTasks }} 项任务完成 · 当前：{{ project.currentStage }}</small>
      </div>
      <div class="overview-next">
        <span>下一步</span>
        <strong>{{ project.nextTask }}</strong>
        <small>计划交付 {{ fullDate(project.deadline) }}</small>
        <div class="overview-actions">
          <NButton size="small" @click="$emit('edit')">编辑资料</NButton>
          <NButton size="small" @click="$emit('quote')">项目报价</NButton>
          <NButton size="small" type="primary" @click="$emit('design')">继续设计</NButton>
        </div>
      </div>
    </div>
    <div class="project-overview-body">
      <div class="overview-info-block">
        <div class="overview-section-title"><span>客户与项目信息</span><small>用于报价、设计与交付资料</small></div>
        <dl class="project-info-grid">
          <div><dt>客户</dt><dd>{{ project.customerName }}</dd></div>
          <div><dt>联系电话</dt><dd>{{ project.customerPhone || '待补充' }}</dd></div>
          <div><dt>客户来源</dt><dd>{{ project.customerSource || '待补充' }}</dd></div>
          <div><dt>房屋类型</dt><dd>{{ project.payload.houseType }}</dd></div>
          <div><dt>建筑面积</dt><dd>{{ project.area }}㎡</dd></div>
          <div><dt>预算意向</dt><dd>{{ money(project.payload.budget) }}</dd></div>
          <div class="project-info-wide"><dt>项目地址</dt><dd>{{ project.payload.address || '待补充项目地址' }}</dd></div>
          <div><dt>最近更新</dt><dd>{{ fullDate(project.updatedAt) }}</dd></div>
        </dl>
      </div>
      <div class="overview-requirement-block">
        <div class="overview-section-title"><span>需求重点</span><small>当前客户关注方向</small></div>
        <div class="requirement-tags">
          <span v-for="item in project.payload.requirements" :key="item">{{ item }}</span>
        </div>
        <p v-if="project.customerNote">{{ project.customerNote }}</p>
      </div>
    </div>
  </section>

  <section class="panel project-status-panel">
    <AdminStatusHistory :steps="statusSteps" :badge="statusBadge" :badge-type="statusBadgeType" />
  </section>

  <section class="panel project-stage-board">
    <div class="panel-head">
      <div><span class="panel-kicker">PROJECT JOURNEY</span><h3>项目阶段与任务</h3></div>
      <span class="panel-note">{{ project.completedTasks }}/{{ project.totalTasks }} 项完成 · {{ totalStages }} 个阶段</span>
    </div>
    <div class="stage-board-grid">
      <article v-for="(stage, index) in project.stages" :key="stage.key" class="stage-column" :data-status="stage.status">
        <header>
          <div class="stage-marker"><span>{{ stage.status === 'done' ? '✓' : index + 1 }}</span></div>
          <div class="stage-column-title">
            <strong>{{ stage.name }}</strong>
            <small>{{ stage.total ? `${stage.completed}/${stage.total} 项完成` : '暂无任务' }}</small>
          </div>
          <span class="stage-state">{{ stage.status === 'done' ? '已完成' : stage.status === 'active' ? '进行中' : stage.status === 'skipped' ? '未配置任务' : '待开始' }}</span>
        </header>
        <p class="stage-description">{{ stage.description }}</p>
        <div class="stage-task-list">
          <label v-for="task in tasksFor(stage)" :key="task.id" class="stage-task" :class="{ done: task.done }">
            <NCheckbox :checked="task.done" :disabled="savingTask === task.id" @update:checked="value => emit('toggleTask', task, value)" />
            <span>
              <b>{{ task.title }}</b>
              <small>{{ task.owner }} · {{ fullDate(task.dueDate) }}</small>
            </span>
          </label>
          <span v-if="!tasksFor(stage).length" class="stage-task-empty">暂无任务</span>
        </div>
      </article>
    </div>
  </section>

  <section class="panel project-deliverables-panel">
    <div class="panel-head">
      <div><span class="panel-kicker">DELIVERABLES</span><h3>方案成果</h3></div>
      <span class="panel-note">从户型到施工交付的项目资料</span>
    </div>
    <div class="deliverable-grid">
      <article v-for="item in project.payload.deliverables" :key="item.key" class="deliverable-card">
        <div class="deliverable-icon">{{ deliverableIcon(item.key) }}</div>
        <div>
          <span class="deliverable-status" :data-status="item.status">{{ item.status }}</span>
          <h4>{{ item.title }}</h4>
          <p>{{ item.description }}</p>
          <a :href="item.href">{{ item.action }} →</a>
        </div>
      </article>
    </div>
  </section>
</template>
