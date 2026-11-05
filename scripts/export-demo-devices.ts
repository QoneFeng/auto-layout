import fs from 'node:fs';
import path from 'node:path';
import { DEVICES, SPACES } from '../src/data/catalog';

const root = path.resolve(import.meta.dirname, '..');
const devices = DEVICES.map(d => ({
  key: d.key,
  category1: d.category1,
  category2: d.category2,
  productFamily: d.productFamily,
  legacyType2: d.legacyType2,
  mountSurface: d.mountSurface,
  layoutForm: d.layoutForm,
  routeShape: d.routeShape,
  application: d.application,
  salesUnit: d.salesUnit,
  visual: d.visual,
  glow: d.glow,
  mount: d.mount,
  size: d.size,
  icon: d.icon,
  role: d.role,
  demoExtension: d.demoExtension ?? false,
}));
const text = `/* Generated from src/data/catalog.ts — do not edit by hand. */\n`
  + `window.SMART_DEVICES = ${JSON.stringify(devices, null, 2)};\n`
  + `window.SMART_SPACES = ${JSON.stringify(SPACES, null, 2)};\n`;
fs.writeFileSync(path.join(root, 'app', 'devices.js'), text, 'utf8');
console.log(`devices=${devices.length}`);
