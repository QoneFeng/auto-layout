// Adapted from floorplan-3d (MIT, Copyright (c) 2026 wuyi). See NOTICE.md.
import * as THREE from 'three';
import { MaterialKit } from './materials';

export interface LightingRig {
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  apply: (lightsOn: boolean) => void;
  dispose: () => void;
}

export function createLighting(scene: THREE.Scene, renderer: THREE.WebGLRenderer, size: number, mats: MaterialKit): LightingRig {
  const hemi = new THREE.HemisphereLight(0xffffff, 0xdbe6f2, 0.85);
  const sun = new THREE.DirectionalLight(0xfff1dd, 1.8);
  sun.position.set(size, size * 1.6, size * 0.9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -size;
  sun.shadow.camera.right = size;
  sun.shadow.camera.top = size;
  sun.shadow.camera.bottom = -size;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = size * 5;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(hemi, sun, sun.target);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 12, size * 12),
    new THREE.MeshStandardMaterial({ color: 0xeaf2fa, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  if (mats.environment) scene.environment = mats.environment;
  scene.environmentIntensity = 0.42;

  const apply = (lightsOn: boolean) => {
    renderer.toneMappingExposure = lightsOn ? 1.15 : 0.95;
    hemi.intensity = lightsOn ? 0.35 : 0.75;
    sun.intensity = lightsOn ? 0.25 : 1.8;
    scene.environmentIntensity = lightsOn ? 0.28 : 0.42;
  };

  return {
    hemi,
    sun,
    apply,
    dispose: () => {
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      sun.shadow.map?.dispose();
    },
  };
}
