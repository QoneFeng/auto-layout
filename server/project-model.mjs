// 项目阶段 / 任务模板：门店可在“系统设置 → 项目阶段与任务”里配置，
// 新建项目时按配置生成阶段与任务；已有项目保留自己创建时的快照，不受后续配置修改影响。

export const PROJECT_STATUS_FLOW = ['待设计', '方案设计', '待报价', '施工交付', '已完成'];

// 阶段对应的项目状态：新建阶段时按顺序给出默认值，门店可在设置页调整。
const DEFAULT_STAGE_STATUS = {
  profile: '待设计',
  floorplan: '方案设计',
  solution: '方案设计',
  quote: '待报价',
  delivery: '施工交付',
};
const STATUS_FALLBACK = ['待设计', '方案设计', '待报价', '施工交付'];

export const DEFAULT_PROJECT_JOURNEY = {
  roles: ['导购', '方案顾问', '设计师', '项目负责人'],
  stages: [
    {
      key: 'profile', name: '需求建档', description: '客户、房屋与预算信息', projectStatus: '待设计',
      tasks: [
        { key: 'profile-customer', title: '确认客户与房屋资料', role: '导购' },
        { key: 'profile-requirements', title: '确认需求、预算与计划', role: '方案顾问' },
      ],
    },
    {
      key: 'floorplan', name: '户型设计', description: '户型与软装家具确认', projectStatus: '方案设计',
      tasks: [
        { key: 'floorplan-base', title: '导入或绘制户型图', role: '设计师' },
        { key: 'floorplan-furniture', title: '确认空间与软装家具', role: '设计师' },
      ],
    },
    {
      key: 'solution', name: '智能方案', description: '选品、套餐与智能布点', projectStatus: '方案设计',
      tasks: [
        { key: 'solution-products', title: '完成智能设备选品', role: '方案顾问' },
        { key: 'solution-layout', title: '完成智能设备布点', role: '设计师' },
      ],
    },
    {
      key: 'quote', name: '报价确认', description: '价格核对与客户确认', projectStatus: '待报价',
      tasks: [
        { key: 'quote-pricing', title: '核对设备价格与服务费', role: '导购' },
        { key: 'quote-confirm', title: '客户确认方案与报价', role: '导购' },
      ],
    },
    {
      key: 'delivery', name: '施工交付', description: '施工图、安装与验收', projectStatus: '施工交付',
      tasks: [
        { key: 'delivery-drawings', title: '输出点位与施工交底资料', role: '设计师' },
        { key: 'delivery-handover', title: '完成安装、调试与交付', role: '项目负责人' },
      ],
    },
  ],
};

const STATUS_DONE_COUNT = {
  '待设计': 1,
  '方案设计': 4,
  '待报价': 6,
  '报价确认': 7,
  '施工交付': 8,
  '已完成': 10,
};

const DAY = 24 * 60 * 60 * 1000;
const isoDate = (value = Date.now()) => new Date(value).toISOString().slice(0, 10);
const safeArray = value => Array.isArray(value) ? value : [];
const clone = value => JSON.parse(JSON.stringify(value));
const text = (value, max) => String(value ?? '').trim().slice(0, max);
const KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,39}$/i;
const safeKey = (value, fallback) => {
  const key = String(value ?? '').trim();
  return KEY_PATTERN.test(key) ? key : fallback;
};
const stageStatusFallback = (key, index) => DEFAULT_STAGE_STATUS[key] || STATUS_FALLBACK[Math.min(index, STATUS_FALLBACK.length - 1)];

function stageMetaList(input) {
  const source = safeArray(input).length ? safeArray(input) : DEFAULT_PROJECT_JOURNEY.stages;
  const used = new Set();
  return source.map((raw, index) => {
    const stage = raw && typeof raw === 'object' ? raw : {};
    let key = safeKey(stage.key, `stage-${index + 1}`);
    if (used.has(key)) key = `${key}-${index + 1}`;
    used.add(key);
    return {
      key,
      name: text(stage.name, 24) || `阶段 ${index + 1}`,
      description: text(stage.description, 80),
      projectStatus: PROJECT_STATUS_FLOW.includes(stage.projectStatus) && stage.projectStatus !== '已完成'
        ? stage.projectStatus
        : stageStatusFallback(key, index),
    };
  });
}

/**
 * 统一整理“项目阶段与任务”配置，读和写都走这里：
 * - 读：缺字段的旧配置自动补齐，不打断页面；
 * - 写（strict）：缺阶段名、任务名、负责角色或角色不在字典内时直接报错。
 */
export function normalizeJourneyConfig(input, { strict = false } = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : clone(DEFAULT_PROJECT_JOURNEY);

  const roles = [];
  for (const item of safeArray(source.roles)) {
    const role = text(item, 12);
    if (role && !roles.includes(role)) roles.push(role);
  }
  if (strict && !roles.length) throw new Error('至少需要配置一个负责角色');

  const rawStages = safeArray(source.stages);
  // 读取时缺阶段回退默认模板；保存时 stages 为空数组说明门店确实删光了阶段，必须拦下。
  const stagesInput = rawStages.length ? rawStages : (strict ? [] : clone(DEFAULT_PROJECT_JOURNEY.stages));
  if (strict && !stagesInput.length) throw new Error('至少需要配置一个项目阶段');

  const stageKeys = new Set();
  const taskKeys = new Set();
  const stages = stagesInput.slice(0, 12).map((raw, index) => {
    const stage = raw && typeof raw === 'object' ? raw : {};
    const name = text(stage.name, 24);
    if (!name && strict) throw new Error(`第 ${index + 1} 个阶段缺少名称`);
    let key = safeKey(stage.key, `stage-${index + 1}`);
    if (stageKeys.has(key)) key = `${key}-${index + 1}`;
    stageKeys.add(key);
    const projectStatus = PROJECT_STATUS_FLOW.includes(stage.projectStatus) && stage.projectStatus !== '已完成'
      ? stage.projectStatus
      : stageStatusFallback(key, index);
    const tasks = safeArray(stage.tasks).slice(0, 30).map((rawTask, taskIndex) => {
      const task = rawTask && typeof rawTask === 'object' ? rawTask : {};
      const title = text(task.title, 40);
      if (!title && strict) throw new Error(`阶段「${name || `阶段 ${index + 1}`}」第 ${taskIndex + 1} 项任务缺少名称`);
      let role = text(task.role, 12);
      if (!role && strict) throw new Error(`任务「${title}」缺少负责角色`);
      if (!role) role = roles[0] || DEFAULT_PROJECT_JOURNEY.roles[0];
      if (!roles.includes(role)) {
        if (strict) throw new Error(`任务「${title}」的负责角色「${role}」不在角色列表中`);
        roles.push(role);
      }
      let taskKey = safeKey(task.key, `${key}-task-${taskIndex + 1}`);
      if (taskKeys.has(taskKey)) taskKey = `${taskKey}-${taskIndex + 1}`;
      taskKeys.add(taskKey);
      return { key: taskKey, title: title || `任务 ${taskIndex + 1}`, role };
    });
    return { key, name: name || `阶段 ${index + 1}`, description: text(stage.description, 80), projectStatus, tasks };
  });

  return { roles, stages };
}

export function createProjectPayload(project = {}, journeyInput) {
  const journey = normalizeJourneyConfig(journeyInput);
  const updated = new Date(project.updatedAt || project.updated_at || Date.now()).getTime();
  const stages = journey.stages.map(({ tasks, ...stage }) => ({ ...stage }));
  const total = journey.stages.reduce((sum, stage) => sum + stage.tasks.length, 0);
  const statusDoneCount = STATUS_DONE_COUNT[project.status] ?? 0;
  const hasBasicProfile = Boolean(project.customerId || project.customer_id) && Number(project.area || 0) > 0;
  const doneCount = Math.min(total, project.status === '待设计' ? (hasBasicProfile ? 1 : 0) : statusDoneCount);

  let index = 0;
  const tasks = [];
  for (const stage of journey.stages) {
    for (const task of stage.tasks) {
      tasks.push({
        id: task.key,
        stageKey: stage.key,
        title: task.title,
        owner: task.role,
        dueDate: isoDate(updated + (index + 2) * 3 * DAY),
        done: index < doneCount,
      });
      index += 1;
    }
  }

  return {
    address: project.address || '待补充项目地址',
    houseType: project.houseType || (Number(project.area || 0) >= 180 ? '大平层' : '三室两厅'),
    budget: Number(project.budget || 0) || (Number(project.area || 0) >= 180 ? 180000 : 98000),
    expectedDeliveryDate: project.expectedDeliveryDate || isoDate(updated + 60 * DAY),
    manager: project.manager || '演示门店 · 方案顾问',
    salesChannel: project.salesChannel || '门店到店',
    requirements: Array.isArray(project.requirements) && project.requirements.length ? project.requirements : defaultRequirements(project),
    stages,
    tasks,
    deliverables: [],
    activities: [
      {
        id: `activity-created-${project.id || 'draft'}`,
        time: project.updatedAt || project.updated_at || new Date().toISOString(),
        operator: project.operator || project.manager || '系统',
        operatorAccount: project.operatorAccount || '',
        action: '项目建档',
        target: '项目档案',
        result: '已创建',
        title: '项目已建档',
        description: '已创建本地项目档案，等待继续完善方案。',
      },
    ],
  };
}

function defaultRequirements(project = {}) {
  if (String(project.schemeType || project.scheme_type || '').includes('灯光')) return ['灯光分层设计', '开关与回路控制', '施工交底'];
  if (String(project.schemeType || project.scheme_type || '').includes('网络')) return ['全屋网络覆盖', '弱电设备规划', '安防联动'];
  return ['智能灯光', '全屋网络', '窗帘与场景控制'];
}

/**
 * 已有项目只做“补字段”，不按最新模板追加/删除任务：
 * payload 自带 stages / tasks 时以项目自身快照为准，只有缺失字段时才回退到模板。
 */
export function normalizeProjectPayload(payload, project = {}, journeyInput) {
  const defaults = createProjectPayload(project, journeyInput);
  const source = payload && typeof payload === 'object' ? payload : {};
  const hasOwnStages = Array.isArray(source.stages) && source.stages.length > 0;
  const stages = hasOwnStages ? stageMetaList(source.stages) : defaults.stages;
  const stageKeys = new Set(stages.map(stage => stage.key));

  const normalizeTask = (task, index) => ({
    id: text(task.id, 60) || `${stages[0].key}-task-${index + 1}`,
    stageKey: stageKeys.has(task.stageKey) ? task.stageKey : stages[0].key,
    title: text(task.title, 40) || defaults.tasks[index]?.title || `任务 ${index + 1}`,
    owner: text(task.owner, 12) || defaults.tasks[index]?.owner || '',
    dueDate: text(task.dueDate, 20),
    done: task.done === true,
  });

  let tasks;
  if (hasOwnStages) {
    // 项目已有自己的阶段快照：任务完全以项目为准，不按最新模板增删。
    tasks = Array.isArray(source.tasks) ? source.tasks.filter(task => task && typeof task === 'object').map(normalizeTask) : defaults.tasks;
  } else {
    // 旧项目或空 payload：按模板补齐生命周期任务，同时保留已有完成状态和未知任务。
    const knownTasks = new Map(safeArray(source.tasks).filter(task => task?.id).map(task => [task.id, task]));
    tasks = defaults.tasks.map(task => ({ ...task, ...(knownTasks.get(task.id) || {}) }));
    for (const task of safeArray(source.tasks)) {
      if (task?.id && !tasks.some(item => item.id === task.id)) tasks.push(task);
    }
    tasks = tasks.filter(task => task && typeof task === 'object').map(normalizeTask);
  }

  return {
    ...defaults,
    ...source,
    requirements: safeArray(source.requirements).length ? source.requirements : defaults.requirements,
    stages,
    tasks,
    deliverables: safeArray(source.deliverables),
    activities: safeArray(source.activities).length ? source.activities : defaults.activities,
  };
}

export function projectStatusFromTasks(tasks = [], stagesInput) {
  const list = safeArray(tasks);
  if (!list.length) return '待设计';
  if (list.every(task => task.done)) return '已完成';
  const stages = stageMetaList(stagesInput);
  const keys = new Set(stages.map(stage => stage.key));
  for (const [index, stage] of stages.entries()) {
    if (list.some(task => task.stageKey === stage.key && !task.done)) return stage.projectStatus || stageStatusFallback(stage.key, index);
  }
  const orphanPending = list.some(task => !keys.has(task.stageKey) && !task.done);
  if (orphanPending) return stages.at(-1)?.projectStatus || '施工交付';
  return '方案设计';
}

function derivedDeliverables(payload, project) {
  const completed = new Set(payload.tasks.filter(task => task.done).map(task => task.id));
  // 交付物卡片跟随“阶段”而不是固定任务 id：门店改过任务模板后，状态仍要说得通。
  const stageIndex = (keywords, fallback) => {
    const found = payload.stages.findIndex(stage => keywords.some(keyword => stage.key.includes(keyword) || stage.name.includes(keyword)));
    return found >= 0 ? found : Math.min(fallback, Math.max(0, payload.stages.length - 1));
  };
  const stageState = index => {
    const stage = payload.stages[index];
    if (!stage) return '未开始';
    const tasks = payload.tasks.filter(task => task.stageKey === stage.key);
    if (!tasks.length) return '未开始';
    const done = tasks.filter(task => task.done).length;
    return done === tasks.length ? '已完成' : done > 0 ? '进行中' : '未开始';
  };
  const status = (ready, doing, keywords, fallback) => completed.has(ready)
    ? '已完成'
    : completed.has(doing) ? '进行中' : stageState(stageIndex(keywords, fallback));
  return [
    { key: 'floorplan', title: '户型与空间方案', description: '户型、空间类型和软装家具', status: status('floorplan-furniture', 'floorplan-base', ['floorplan', '户型'], 1), action: '继续户型设计', href: `/app/?project=${project.id}` },
    { key: 'devices', title: '智能设备方案', description: '设备选品、数量与空间清单', status: status('solution-products', 'floorplan-furniture', ['solution', '方案', '选品'], 2), action: '继续设备选品', href: `/app/?project=${project.id}` },
    { key: 'layout', title: '智能点位方案', description: '2D/3D 布点、规则命中与待处理', status: status('solution-layout', 'solution-products', ['solution', '方案', '选品'], 2), action: '继续智能布点', href: `/app/?project=${project.id}` },
    { key: 'quote', title: '项目报价清单', description: '产品价格、服务费与方案总价', status: status('quote-confirm', 'quote-pricing', ['quote', '报价'], 3), action: '进入报价中心', href: `#/quotes?project=${project.id}` },
    { key: 'drawings', title: '施工交底资料', description: '点位图、回路表与安装说明', status: status('delivery-drawings', 'quote-confirm', ['delivery', '施工', '交付'], payload.stages.length - 1), action: '进入方案交付', href: `#/designs?projectId=${project.id}` },
  ];
}

export function projectView(project, payloadInput, journeyInput) {
  const payload = normalizeProjectPayload(payloadInput, project, journeyInput);
  const allTasks = payload.tasks;
  const completed = allTasks.filter(task => task.done).length;
  const total = allTasks.length;
  const progress = total ? Math.round(completed / total * 100) : 0;
  const stages = payload.stages.map((stage, index) => {
    const tasks = allTasks.filter(task => task.stageKey === stage.key);
    const stageCompleted = tasks.filter(task => task.done).length;
    const priorDone = payload.stages.slice(0, index).every(prior => allTasks.filter(task => task.stageKey === prior.key).every(task => task.done));
    // 未配置任务的阶段不阻塞后续阶段，也不显示成“已完成”或“进行中”。
    const status = !tasks.length
      ? 'skipped'
      : stageCompleted === tasks.length
        ? 'done'
        : priorDone ? 'active' : 'pending';
    return { ...stage, status, completed: stageCompleted, total: tasks.length };
  });
  const current = stages.find(stage => stage.status === 'active') || stages.find(stage => stage.status === 'pending') || stages.at(-1);
  const nextTask = allTasks.find(task => !task.done);
  return {
    ...project,
    status: projectStatusFromTasks(allTasks, payload.stages),
    payload: { ...payload, deliverables: derivedDeliverables(payload, project) },
    progress,
    completedTasks: completed,
    totalTasks: total,
    currentStage: current?.name || '已完成',
    nextTask: nextTask?.title || '全部任务已完成',
    deadline: payload.expectedDeliveryDate || '待补充',
    stages,
  };
}
