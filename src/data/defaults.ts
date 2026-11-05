import type { DemoDefaults, SpaceCode } from '../types';

export const DEMO_DEFAULTS: DemoDefaults = {
  ruleVersion: '2026-10-21-V1',
  engineVersion: '0.1.0',
  downlight: { rows: 2, rowGap: 500, colGap: 800, wallClearance: 300 },
  spotlight: { min: 4, noTargetFallback: false },
  modes: {
    KT: 'MIXED', CT: 'MAIN', ZW: 'MIXED', SF: 'MIXED', WS: 'MAIN',
    LRF: 'MAIN', XHF: 'MAIN', XCW: 'NO_MAIN', CF: 'NO_MAIN',
    WSJ: 'NO_MAIN', GDYT: 'NO_MAIN', YT: 'NO_MAIN', YMJ: 'NO_MAIN',
    WSWSJ: 'NO_MAIN', CS: 'MAIN',
  } satisfies Record<SpaceCode, 'MAIN' | 'NO_MAIN' | 'MIXED'>,
  maxDevicesPerRule: 12,
  defaultCeilingHeight: 2800,
};

export const PENDING_BUSINESS_CONFIRMATION = [
  '筒灯参数采用 500/800 口径',
  '射灯最小数量采用 4，无目标不做四角兜底',
  '镜前照明暂按“镜柜下沿灯带 + 镜前射灯”组合',
  '老人房启用 age_friendly 安全优先',
  '儿童房开关高度暂按 900~1000',
  '晾衣机/地脚灯/镜前灯等缺口设备按 Demo 扩展或占位',
  '阳台默认配卷帘',
  '厨房面板灯与筒灯二选一',
  '衣帽间柜体灯带按层板+挂衣杆计量',
  '全屋网络设备单独基础包',
  '电视屏幕禁射区 300mm',
  '空调出风口 1.5m 禁布传感器',
  '中控屏默认含情景功能',
  '无吊顶走 CL 回退链',
];
