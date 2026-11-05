import { describe, expect, it } from 'vitest';
import { buildDemo15Spaces, buildDemo3Bed } from '../data/samples';
import { DEVICES } from '../data/catalog';
import { allRules, catalogDevicesForRule, placeExistingDevices, rulesForDevice, runLayout } from './engine';
import { explainDevice } from './explain';
import { pointInPolygon, pointToSegmentDistance, polygonEdges } from './geometry';
import type { PlacedDevice } from '../types';

function manualDevice(project: ReturnType<typeof buildDemo15Spaces>, key: string, roomId: string): PlacedDevice {
  const room = project.rooms.find(r => r.id === roomId)!;
  return {
    id: `manual-${key}`,
    ruleCode: 'MANUAL',
    deviceKey: key,
    deviceType2: key,
    category1: '灯光',
    roomId,
    roomName: room.name,
    position: { x: 6000, y: 1800, z: 2750 },
    rotation: 0,
    mount: 'CL',
    priority: 'P4',
    visual: 'point',
    glow: 'point',
    size: { width: 90, depth: 90 },
    status: 'manual',
    source: 'manual',
    locked: false,
    trace: { anchor: 'roomCenter', candidateRank: 0, fallbackStep: 0, confidence: 1, notes: ['MANUAL_PLACEMENT'], warnings: [] },
  };
}

describe('rule catalog', () => {
  it('loads 183 unique rules across 15 spaces', () => {
    const rules = allRules();
    expect(rules).toHaveLength(183);
    expect(new Set(rules.map(r => r.pointCode)).size).toBe(183);
    expect(new Set(rules.map(r => r.spaceCode)).size).toBe(15);
    expect(rules.every(r => r.anchor && r.quantity && r.deviceType2)).toBe(true);
  });

  it('exposes 54 catalog devices plus the 台灯 demo extension', () => {
    expect(DEVICES).toHaveLength(55);
    expect(DEVICES.filter(d => d.demoExtension).map(d => d.category2)).toEqual(['台灯']);
  });

  it('maps every rule to at least one catalog device', () => {
    const unmatched = allRules().filter(r => catalogDevicesForRule(r).length === 0).map(r => r.pointCode);
    expect(unmatched).toEqual([]);
  });

  it('looks up candidate rules by space and device', () => {
    const rules = rulesForDevice('ZW', '射灯');
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.every(r => r.spaceCode === 'ZW')).toBe(true);
    expect(rules.some(r => r.pointCode === 'ZW-SP-01')).toBe(true);
  });

  it('uses measured lengths for the 36 strip / track rules', () => {
    const measured = allRules().filter(r => r.quantity.kind === 'measuredLength');
    expect(measured).toHaveLength(36);
    expect(measured.every(r => r.deviceCanonical)).toBe(true);
  });

  it('gives every catalog device a named rule in every space', () => {
    const spaces = [...new Set(allRules().map(r => r.spaceCode))];
    const missing: string[] = [];
    for (const space of spaces) {
      for (const device of DEVICES) {
        const rules = rulesForDevice(space, device.key);
        if (!rules.length || !rules[0].pointCode) missing.push(`${space}:${device.category2}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('package layout', () => {
  it('executes all 183 rules on the 15-space sample', () => {
    const project = buildDemo15Spaces();
    const result = runLayout(project);
    expect(result.executions).toHaveLength(183);
    expect(result.devices.length).toBeGreaterThan(100);
    expect(result.executions.every(e => e.status !== 'skipped' || e.reasonCode === 'MODE_EXCLUDED')).toBe(true);
    expect(result.executions.some(e => e.status === 'executed')).toBe(true);
  });

  it('is deterministic for the same project and seed', () => {
    const a = runLayout(buildDemo15Spaces());
    const b = runLayout(buildDemo15Spaces());
    expect(a.devices.map(d => `${d.id}:${d.position.x},${d.position.y}`)).toEqual(
      b.devices.map(d => `${d.id}:${d.position.x},${d.position.y}`),
    );
  });

  it('runs the 3-bedroom sample without crashing', () => {
    const result = runLayout(buildDemo3Bed());
    expect(result.executions.length).toBeGreaterThan(100);
    expect(result.devices.length).toBeGreaterThan(40);
  });

  it('keeps line-type devices inside their own room', () => {
    const project = buildDemo15Spaces();
    const result = runLayout(project);
    const onEdge = (p: [number, number], poly: [number, number][]) => pointInPolygon(p, poly)
      || polygonEdges(poly).some(e => pointToSegmentDistance(p, e.a, e.b) <= 30);
    const leaking = result.devices.filter(d => {
      if (!['line', 'track'].includes(d.visual) || d.size.width < 300) return false;
      const room = project.rooms.find(r => r.id === d.roomId);
      if (!room) return false;
      const a = (Math.PI * d.rotation) / 180;
      const half = d.size.width / 2;
      const p1: [number, number] = [d.position.x - Math.cos(a) * half, d.position.y - Math.sin(a) * half];
      const p2: [number, number] = [d.position.x + Math.cos(a) * half, d.position.y + Math.sin(a) * half];
      return !onEdge(p1, room.polygon) || !onEdge(p2, room.polygon);
    });
    expect(leaking.map(d => `${d.ruleCode}:${d.roomName}`)).toEqual([]);
  });

  it('places cove strips as four perimeter segments measured after layout', () => {
    const project = buildDemo15Spaces();
    const result = runLayout(project);
    const execution = result.executions.find(e => e.ruleCode === 'LRF-LS-02');
    expect(execution?.placedCount).toBe(4);
    const strips = result.devices.filter(d => d.ruleCode === 'LRF-LS-02');
    expect(strips).toHaveLength(4);
    expect(strips.every(d => d.size.width > 0 && d.size.width <= 4800)).toBe(true);
  });

  it('scales word-shaped strips to the room area', () => {
    const project = buildDemo15Spaces();
    project.devices = [
      { ...manualDevice(project, '口字灯带', 'living'), visual: 'rect', glow: 'line', size: { width: 1600, depth: 1200 } },
      { ...manualDevice(project, '口字灯带', 'kids'), visual: 'rect', glow: 'line', size: { width: 1600, depth: 1200 } },
    ];
    const result = placeExistingDevices(project, { sources: ['manual'] });
    const living = result.devices.find(d => d.roomId === 'living')!;
    const kids = result.devices.find(d => d.roomId === 'kids')!;
    expect(living.size.width).toBeGreaterThan(1600);
    expect(living.size.depth).toBeGreaterThan(1200);
    expect(living.size.width).toBeGreaterThan(kids.size.width);
  });
});

describe('existing-device layout', () => {
  it('does not create or delete devices', () => {
    const project = buildDemo15Spaces();
    project.devices = [
      manualDevice(project, '筒灯', 'living'),
      { ...manualDevice(project, '口字灯带', 'living'), visual: 'rect', glow: 'line', size: { width: 1600, depth: 1200 } },
    ];
    const before = project.devices.length;
    const result = placeExistingDevices(project, { sources: ['manual'] });
    expect(result.devices).toHaveLength(before);
    expect(result.executions).toHaveLength(2);
    expect(result.devices.every(d => d.status !== 'manual')).toBe(true);
    expect(result.devices.find(d => d.deviceKey === '口字灯带')?.visual).toBe('rect');
  });

  it('keeps locked devices in place', () => {
    const project = buildDemo15Spaces();
    const locked = { ...manualDevice(project, '筒灯', 'living'), id: 'locked-1', locked: true, position: { x: 1234, y: 567, z: 2750 } };
    project.devices = [locked, manualDevice(project, '筒灯', 'living')];
    const result = placeExistingDevices(project, { sources: ['manual'] });
    const kept = result.devices.find(d => d.id === 'locked-1')!;
    expect(kept.position).toEqual({ x: 1234, y: 567, z: 2750 });
  });

  it('returns an empty result when there are no manual devices', () => {
    const result = placeExistingDevices(buildDemo15Spaces(), { sources: ['manual'] });
    expect(result.executions).toHaveLength(0);
    expect(result.devices).toHaveLength(0);
  });

  it('explains a rule-matched device with rule code and reason', () => {
    const project = buildDemo15Spaces();
    const result = runLayout(project);
    const device = result.devices.find(d => d.ruleCode.startsWith('KT-'))!;
    const explanation = explainDevice(device, project, result);
    expect(explanation.kind).toBe('rule');
    expect(explanation.code).toBe(device.ruleCode);
    expect(explanation.why.join('')).toContain('命中');
    expect(explanation.rows.some(r => r.label === '锚点')).toBe(true);
  });

  it('turns a manual device into a rule-matched device after placement', () => {
    const project = buildDemo15Spaces();
    project.devices = [manualDevice(project, '筒灯', 'living')];
    const before = explainDevice(project.devices[0], project, null);
    expect(before.kind).toBe('manual');
    expect(before.candidateRules.length).toBeGreaterThan(0);

    const result = placeExistingDevices(project, { sources: ['manual'] });
    const after = explainDevice(result.devices[0], project, result);
    expect(after.kind).toBe('rule');
    expect(after.code).not.toBe('MANUAL');
  });

  it('matches a device without a space rule to a named cross-space rule', () => {
    const project = buildDemo15Spaces();
    project.devices = [manualDevice(project, '调光旋钮', 'living')];
    const result = placeExistingDevices(project, { sources: ['manual'] });
    const explanation = explainDevice(result.devices[0], project, result);
    expect(result.devices[0].ruleCode).toMatch(/^GEN-CT-/);
    expect(explanation.kind).toBe('rule');
    expect(explanation.why.join('')).toContain('命中');
  });

  it('keeps every input device and leaves overflow pending without moving it to room center', () => {
    const project = buildDemo15Spaces();
    project.devices = Array.from({ length: 30 }, (_, i) => ({
      ...manualDevice(project, '筒灯', 'kids'),
      id: `overflow-${i}`,
      position: { x: 1234, y: 567, z: 2750 },
    }));
    const result = placeExistingDevices(project, { sources: ['manual'] });
    expect(result.devices).toHaveLength(30);
    const pending = result.devices.filter(d => d.status === 'pending');
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every(d => d.position.x === 1234 && d.position.y === 567)).toBe(true);
    expect(result.devices.filter(d => d.status === 'placed' || d.status === 'fallback').length + pending.length).toBe(30);
  });

  it('reconciles rule quantity as placed plus pending', () => {
    const result = runLayout(buildDemo15Spaces());
    const checked = result.executions.filter(e => e.status !== 'skipped' && e.requestedCount !== undefined);
    expect(checked.length).toBeGreaterThan(0);
    for (const e of checked) {
      expect((e.placedCount ?? 0) + (e.pendingCount ?? 0)).toBe(e.requestedCount);
    }
    expect(result.devices.some(d => d.status === 'pending')).toBe(true);
  });

  it('returns the whole-house basic package separately from space rules', () => {
    const result = runLayout(buildDemo3Bed());
    expect(result.wholeHouseDevices).toHaveLength(10);
    expect(result.wholeHouseDevices.every(d => d.source === 'wholeHouse' && d.ruleCode === 'WHOLE-HOUSE')).toBe(true);
    expect(result.wholeHouseDevices.some(d => d.deviceType2 === '弱电箱 · 箱体')).toBe(true);
    expect(result.wholeHouseDevices.some(d => d.deviceType2 === '顶装 AP')).toBe(true);
  });

  it('never falls back to a bedroom when placing whole-house network devices', () => {
    const project = buildDemo3Bed();
    const entry = project.rooms.find(r => r.spaceCode === 'XCW')!;
    entry.spaceCode = 'WS';
    const switchDevice = runLayout(project).wholeHouseDevices.find(d => d.deviceType2 === '交换机')!;
    expect(switchDevice.trace.notes.join(' ')).not.toContain('主卧');
    expect(switchDevice.position.z).toBe(1350);
  });

  it('treats a functional zone as its own space and excludes it from the parent room', () => {
    const project = buildDemo3Bed();
    const living = project.rooms.find(r => r.id === 'living')!;
    const zonePoly: [number, number][] = [[150, 3350], [1100, 3350], [1100, 3900], [150, 3900]];
    const zone = {
      ...living,
      id: 'zone-xcw',
      name: '入户玄关',
      spaceCode: 'XCW' as const,
      polygon: zonePoly,
      excludePolygons: [],
    };
    living.excludePolygons = [zonePoly];
    project.rooms.push(zone);
    const result = runLayout(project);
    const zoneDevices = result.devices.filter(d => d.roomId === 'zone-xcw');
    expect(zoneDevices.some(d => d.ruleCode.startsWith('XCW-'))).toBe(true);
    const parentDevicesInZone = result.devices.filter(d =>
      d.roomId === 'living'
      && d.position.x >= 150 && d.position.x <= 1100
      && d.position.y >= 3350 && d.position.y <= 3900,
    );
    expect(parentDevicesInZone).toHaveLength(0);
  });
});
