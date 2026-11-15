// The map: DEPOT HEX — a night freight yard. A hexagonal plaza at the centre, three lanes out
// (Long Hall, Crate Yard, Catwalk), a bomb site A under the crane, site B in the loading bay.
// Everything is boxes: each is a collider for movers and a surface a bullet stops on.
import * as THREE from 'three';
import { PALETTE } from './palette.js';

export const BOMB_SITES = {
  A: { x: -8.5, z: -8.5, radius: 3.2, label: 'A — CRANE' },
  B: { x: 8.5, z: 8.5, radius: 3.2, label: 'B — LOADING BAY' },
};

export function createWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const materials = {};
  for (const name of Object.keys(PALETTE)) {
    materials[name] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(PALETTE[name]),
      roughness: name === 'accent' || name === 'teal' ? 0.5 : 0.9,
      metalness: name === 'hairline' ? 0.15 : 0.03,
    });
  }

  const colliders = [];
  const shootables = [];

  function box(width, height, depth, x, y, z, material, opts = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials[material]);
    mesh.position.set(x, y, z);
    if (opts.rotY) mesh.rotation.y = opts.rotY;
    mesh.castShadow = opts.noShadow ? false : true;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (!opts.ghost) {
      colliders.push(new THREE.Box3().setFromObject(mesh));
      shootables.push(mesh);
    }
    return mesh;
  }

  // Ground: 52 x 52 m yard, lit concrete so the night map reads.
  box(52, 0.4, 52, 0, -0.2, 0, 'muted', { noShadow: true });

  // Perimeter walls (4.8 m).
  box(52.4, 4.8, 0.4, 0, 2.4, -26.2, 'surface');
  box(52.4, 4.8, 0.4, 0, 2.4, 26.2, 'surface');
  box(0.4, 4.8, 52.4, -26.2, 2.4, 0, 'surface');
  box(0.4, 4.8, 52.4, 26.2, 2.4, 0, 'surface');

  // Central hexagonal plaza: six low walls arranged around an open middle.
  const hexR = 6.4;
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    const px = Math.cos(a) * hexR;
    const pz = Math.sin(a) * hexR;
    box(5.2, 1.15, 0.5, px, 0.575, pz, 'hairline', { rotY: -a + Math.PI / 2 });
  }
  // Plaza centrepiece: a raised hex platform (jump-up, sightline break).
  const plat = box(4.4, 0.9, 4.4, 0, 0.45, 0, 'surface');
  plat.name = 'plaza-platform';

  // Long Hall lane (west, x < 0): a corridor of containers with a sightline to site A.
  box(2.6, 2.6, 12, -14, 1.3, -12, 'hairline', { rotY: 0.3 });
  box(2.6, 2.6, 12, -18, 1.3, 2, 'hairline', { rotY: -0.2 });
  box(2.6, 2.6, 10, -12, 1.3, 8, 'surface');
  box(2.6, 2.6, 8, -19, 1.3, 14, 'hairline', { rotY: 0.5 });

  // Crate Yard lane (east, x > 0): stacked crates, tight corners toward site B.
  for (const [cx, cz, s, h] of [[13, -10, 2.2, 2.2], [16, -6, 2.2, 1.1], [14, 0, 2.2, 2.2], [18, 4, 2.2, 1.1], [12, 6, 2.2, 2.2], [17, 12, 2.2, 1.6], [10, 14, 2.2, 2.2]]) {
    box(s, h, s, cx, h / 2, cz, 'hairline');
  }

  // Site A — CRANE (north-west): the crane base and its load.
  box(3.4, 0.6, 3.4, BOMB_SITES.A.x, 0.3, BOMB_SITES.A.z, 'surface');
  box(0.7, 5.2, 0.7, BOMB_SITES.A.x - 2.4, 2.6, BOMB_SITES.A.z - 2.4, 'accent');
  box(2.8, 1.5, 1.4, BOMB_SITES.A.x + 3.4, 0.75, BOMB_SITES.A.z + 1.2, 'hairline', { rotY: 0.6 });
  box(1.8, 1.0, 1.8, BOMB_SITES.A.x - 4.2, 0.5, BOMB_SITES.A.z + 3.4, 'surface');

  // Site B — LOADING BAY (south-east): a dock platform and its ramp.
  box(6.4, 1.0, 5.0, BOMB_SITES.B.x + 1.2, 0.5, BOMB_SITES.B.z - 1.2, 'surface');
  box(1.4, 0.5, 3.0, BOMB_SITES.B.x - 2.6, 0.25, BOMB_SITES.B.z - 1.2, 'hairline');
  box(2.2, 1.3, 2.2, BOMB_SITES.B.x + 4.4, 0.65, BOMB_SITES.B.z + 3.0, 'hairline');

  // Mid connectors: catwalk beams over the plaza edges (jump route north-south).
  box(0.9, 0.35, 9.0, -6.4, 2.6, -14, 'surface');
  box(0.9, 0.35, 9.0, 6.4, 2.6, 14, 'surface');
  box(0.9, 2.6, 0.9, -6.4, 1.3, -18.2, 'surface');
  box(0.9, 2.6, 0.9, 6.4, 1.3, 18.2, 'surface');

  // Scattered cover near spawns.
  box(2.0, 1.2, 2.0, -3.4, 0.6, 20.6, 'hairline');
  box(2.0, 1.2, 2.0, 3.4, 0.6, -20.6, 'hairline');
  box(1.4, 2.0, 1.4, 0, 1.0, 22.4, 'surface');
  box(1.4, 2.0, 1.4, 0, 1.0, -22.4, 'surface');

  // Light: cold hemisphere night, one warm floodlight over the plaza, one over each site.
  const sky = new THREE.HemisphereLight(new THREE.Color('#b6c9e8'), new THREE.Color('#586172'), 3.2);
  scene.add(sky);
  const moon = new THREE.DirectionalLight('#d5e4ff', 2.0);
  moon.position.set(-12, 22, 8);
  scene.add(moon);

  function floodlight(x, z, intensity, targetY) {
    const lamp = new THREE.SpotLight(new THREE.Color('#ffd9a0'), intensity, 40, Math.PI / 5, 0.55, 1.4);
    lamp.position.set(x, 7.4, z);
    lamp.target.position.set(x * 0.4, targetY, z * 0.4);
    lamp.castShadow = true;
    lamp.shadow.mapSize.set(1024, 1024);
    scene.add(lamp);
    scene.add(lamp.target);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 10),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe7c0') }),
    );
    bulb.position.set(x, 7.4, z);
    group.add(bulb);
  }
  floodlight(0, 0, 900, 0);
  floodlight(BOMB_SITES.A.x, BOMB_SITES.A.z, 600, 0);
  floodlight(BOMB_SITES.B.x, BOMB_SITES.B.z, 600, 0);

  // Amber site markers on the ground so the objective reads at a glance.
  for (const key of Object.keys(BOMB_SITES)) {
    const site = BOMB_SITES[key];
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(site.radius - 0.25, site.radius, 40),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.accent), transparent: true, opacity: 0.55 }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(site.x, key === 'A' ? 0.62 : 1.02, site.z);
    group.add(ring);
  }

  scene.fog = new THREE.Fog(new THREE.Color(PALETTE.canvas), 30, 95);

  return { colliders, shootables, group, materials };
}
