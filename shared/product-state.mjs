// 产品状态机：前后端共用同一份状态与动作定义，避免按钮可点但后端不允许。
export const PRODUCT_STATUSES = ['草稿', '在售', '下架', '归档'];

export const PRODUCT_STATUS_META = {
  草稿: { label: '草稿', tone: 'default', description: '资料录入中，不参与选品与布点' },
  在售: { label: '在售', tone: 'success', description: '可被报价与布点规则选中' },
  下架: { label: '下架', tone: 'warning', description: '停止新项目选品，已有项目快照不变' },
  归档: { label: '归档', tone: 'default', description: '终态，默认不再出现在产品库列表' },
};

export const PRODUCT_TRANSITIONS = [
  {
    action: 'publish',
    label: '上架',
    from: ['草稿', '下架'],
    to: '在售',
    tone: 'primary',
    requiresReason: false,
    validatesProduct: true,
  },
  {
    action: 'withdraw',
    label: '下架',
    from: ['在售'],
    to: '下架',
    tone: 'warning',
    requiresReason: false,
    validatesProduct: false,
  },
  {
    action: 'archive',
    label: '归档',
    from: ['草稿', '在售', '下架'],
    to: '归档',
    tone: 'danger',
    requiresReason: true,
    validatesProduct: false,
  },
  {
    action: 'restore',
    label: '恢复为草稿',
    from: ['归档'],
    to: '草稿',
    tone: 'default',
    requiresReason: false,
    validatesProduct: false,
  },
];

export const PRODUCT_TRANSITION_BY_ACTION = Object.fromEntries(PRODUCT_TRANSITIONS.map(item => [item.action, item]));

export function productTransitionsFrom(status) {
  return PRODUCT_TRANSITIONS.filter(item => item.from.includes(status));
}

export function productTransitionFor(status, action) {
  const transition = PRODUCT_TRANSITION_BY_ACTION[action];
  return transition && transition.from.includes(status) ? transition : null;
}

export function productTransitionLabel(from, to) {
  const transition = PRODUCT_TRANSITIONS.find(item => item.from.includes(from) && item.to === to);
  return transition?.label || `${from} → ${to}`;
}
