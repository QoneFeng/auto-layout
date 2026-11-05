import { describe, expect, it } from 'vitest';
import { createProjectPayload, normalizeJourneyConfig, normalizeProjectPayload, projectStatusFromTasks, projectView } from './project-model.mjs';

describe('project lifecycle model', () => {
  const project = { id: 'PRJ-TEST', area: 128, status: '方案设计', schemeType: '全屋智能', updatedAt: '2026-11-02T08:00:00.000Z' };

  it('creates a five-stage, ten-task project payload', () => {
    const payload = createProjectPayload(project);
    expect(payload.stages).toHaveLength(5);
    expect(payload.tasks).toHaveLength(10);
    expect(payload.tasks.filter(task => task.done)).toHaveLength(4);
  });

  it('does not pretend an unlinked new project has confirmed customer data', () => {
    const payload = createProjectPayload({ id: 'PRJ-NEW', area: 120, status: '待设计', schemeType: '全屋智能' });
    expect(payload.tasks.filter(task => task.done)).toHaveLength(0);
  });

  it('preserves unknown payload fields while filling lifecycle defaults', () => {
    const payload = normalizeProjectPayload({ custom: 'keep', tasks: [{ id: 'profile-customer', done: true }] }, project);
    expect(payload.custom).toBe('keep');
    expect(payload.tasks).toHaveLength(10);
    expect(payload.tasks.find(task => task.id === 'profile-customer').done).toBe(true);
  });

  it('derives progress, current stage and next task from task state', () => {
    const view = projectView(project, createProjectPayload(project));
    expect(view.progress).toBe(40);
    expect(view.currentStage).toBe('智能方案');
    expect(view.nextTask).toBe('完成智能设备选品');
    expect(view.payload.deliverables).toHaveLength(5);
  });

  it('records operator and action on the creating activity', () => {
    const payload = createProjectPayload({ ...project, operator: '门店管理员' });
    expect(payload.activities[0]).toMatchObject({ operator: '门店管理员', action: '项目建档', target: '项目档案', result: '已创建' });
  });

  it('moves a fully completed project to completed state', () => {
    const tasks = createProjectPayload(project).tasks.map(task => ({ ...task, done: true }));
    expect(projectStatusFromTasks(tasks)).toBe('已完成');
  });

  const customJourney = {
    roles: ['设计师', '项目经理'],
    stages: [
      { key: 'survey', name: '现场勘察', description: '上门测量', projectStatus: '待设计', tasks: [{ key: 'survey-measure', title: '上门测量', role: '设计师' }] },
      { key: 'handover', name: '交付验收', description: '安装验收', projectStatus: '施工交付', tasks: [{ key: 'handover-check', title: '组织验收', role: '项目经理' }] },
    ],
  };

  it('creates stages and tasks from the configured journey', () => {
    const payload = createProjectPayload({ id: 'PRJ-CUSTOM', area: 100, status: '待设计' }, customJourney);
    expect(payload.stages.map(stage => stage.name)).toEqual(['现场勘察', '交付验收']);
    expect(payload.stages[1]).toMatchObject({ key: 'handover', projectStatus: '施工交付' });
    expect(payload.tasks.map(task => [task.id, task.stageKey, task.owner])).toEqual([
      ['survey-measure', 'survey', '设计师'],
      ['handover-check', 'handover', '项目经理'],
    ]);
  });

  it('derives project status from the stage mapping of the configured journey', () => {
    const payload = createProjectPayload({ id: 'PRJ-CUSTOM', area: 100, status: '待设计' }, customJourney);
    expect(projectStatusFromTasks(payload.tasks, payload.stages)).toBe('待设计');
    const doneFirst = payload.tasks.map((task, index) => ({ ...task, done: index === 0 }));
    expect(projectStatusFromTasks(doneFirst, payload.stages)).toBe('施工交付');
    expect(projectStatusFromTasks(doneFirst.map(task => ({ ...task, done: true })), payload.stages)).toBe('已完成');
  });

  it('keeps an existing project snapshot when the configured journey changes', () => {
    const payload = createProjectPayload(project);
    const view = projectView(project, payload, customJourney);
    expect(view.stages.map(stage => stage.name)).toEqual(['需求建档', '户型设计', '智能方案', '报价确认', '施工交付']);
    expect(view.totalTasks).toBe(10);
  });

  it('marks a stage without tasks as skipped without blocking later stages', () => {
    const journey = {
      roles: ['设计师'],
      stages: [
        { key: 'empty', name: '待补充', description: '', projectStatus: '待设计', tasks: [] },
        { key: 'work', name: '执行', description: '', projectStatus: '方案设计', tasks: [{ key: 'work-do', title: '执行任务', role: '设计师' }] },
      ],
    };
    const payload = createProjectPayload({ id: 'PRJ-EMPTY', area: 80, status: '待设计' }, journey);
    const view = projectView({ id: 'PRJ-EMPTY', area: 80 }, payload, journey);
    expect(view.stages[0]).toMatchObject({ status: 'skipped', total: 0 });
    expect(view.stages[1].status).toBe('active');
    expect(view.currentStage).toBe('执行');
  });

  it('rejects invalid journey configuration on save', () => {
    expect(() => normalizeJourneyConfig({ roles: ['设计师'], stages: [] }, { strict: true })).toThrow('至少需要配置一个项目阶段');
    expect(() => normalizeJourneyConfig({ roles: [], stages: [{ name: '阶段', tasks: [] }] }, { strict: true })).toThrow('至少需要配置一个负责角色');
    expect(() => normalizeJourneyConfig({ roles: ['设计师'], stages: [{ name: '阶段', tasks: [{ title: '任务' }] }] }, { strict: true })).toThrow('缺少负责角色');
    expect(() => normalizeJourneyConfig({ roles: ['设计师'], stages: [{ name: '阶段', tasks: [{ title: '任务', role: '其他' }] }] }, { strict: true })).toThrow('不在角色列表中');
  });
});
