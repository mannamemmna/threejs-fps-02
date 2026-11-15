// Weapons: view-model built from boxes, recoil, spread, reload, ammo, tracers.
// Three weapons: RIFLE (auto), MARKSMAN (semi, scoped), SIDEARM (pistol), plus a frag grenade.
import * as THREE from 'three';
import { PALETTE } from './palette.js';

export const WEAPONS = {
  rifle:     { name: 'KARABIN-7',  price: 2700, mag: 30, reserve: 90, rpm: 600, damage: 30, headMult: 4.0, spreadBase: 0.006, spreadMove: 0.030, reloadTime: 2.3, auto: true,  recoil: 0.011, range: 90 },
  marksman:  { name: 'LONGSIGHT',  price: 4450, mag: 10, reserve: 30, rpm: 180, damage: 88, headMult: 2.6, spreadBase: 0.0012, spreadMove: 0.050, reloadTime: 2.9, auto: false, recoil: 0.028, range: 140 },
  sidearm:   { name: 'WRENCH-9',   price: 0,    mag: 12, reserve: 36, rpm: 320, damage: 22, headMult: 3.2, spreadBase: 0.010, spreadMove: 0.028, reloadTime: 1.7, auto: false, recoil: 0.014, range: 60 },
};

export function createWeapon(camera) {
  const group = new THREE.Group();
  camera.add(group);

  const gunMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#2a2f38'), roughness: 0.55, metalness: 0.35 });
  const accMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.accent), roughness: 0.5, metalness: 0.2 });

  // Receiver, barrel, mag, sight — one view-model, reshaped per weapon.
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.085, 0.46), gunMat);
  receiver.position.set(0.16, -0.13, -0.42);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.34), gunMat);
  barrel.position.set(0.16, -0.115, -0.78);
  const magBox = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.07), gunMat);
  magBox.position.set(0.16, -0.22, -0.38);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.10), accMat);
  sight.position.set(0.16, -0.075, -0.52);
  group.add(receiver, barrel, magBox, sight);

  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0'), transparent: true, opacity: 0 }),
  );
  muzzleFlash.position.set(0.16, -0.115, -0.97);
  group.add(muzzleFlash);

  const state = {
    def: WEAPONS.rifle,
    mag: WEAPONS.rifle.mag,
    reserve: WEAPONS.rifle.reserve,
    cooldown: 0,
    reloading: 0,
    flashT: 0,
    bobT: 0,
  };

  let lastShot = 0;

  function equip(def) {
    state.def = def;
    state.mag = def.mag;
    state.reserve = def.reserve;
    state.reloading = 0;
    // Reshape the view-model a touch per weapon.
    barrel.scale.z = def === WEAPONS.marksman ? 1.7 : def === WEAPONS.sidearm ? 0.55 : 1;
    receiver.scale.x = def === WEAPONS.sidearm ? 0.8 : 1;
  }

  function ready() {
    return state.cooldown <= 0 && state.reloading <= 0 && state.mag > 0;
  }

  function takeRound(now) {
    const minInterval = 60 / state.def.rpm;
    if (now - lastShot < minInterval) return false;
    if (state.reloading > 0 || state.mag <= 0) return false;
    lastShot = now;
    state.mag -= 1;
    state.cooldown = minInterval;
    state.flashT = 0.05;
    return true;
  }

  function reload() {
    if (state.reloading > 0 || state.mag === state.def.mag || state.reserve <= 0) return;
    state.reloading = state.def.reloadTime;
  }

  function pullTrigger() {
    // Recoil kick to the view-model: rises then eases back.
    group.position.z += 0.03;
  }

  function step(dt, moving) {
    state.cooldown = Math.max(0, state.cooldown - dt);
    if (state.reloading > 0) {
      state.reloading -= dt;
      if (state.reloading <= 0) {
        const need = state.def.mag - state.mag;
        const take = Math.min(need, state.reserve);
        state.mag += take;
        state.reserve -= take;
      }
    }
    state.flashT = Math.max(0, state.flashT - dt);
    muzzleFlash.material.opacity = state.flashT > 0 ? 0.9 : 0;
    // View-model easing: recoil recovery + walk bob.
    group.position.z += (0 - group.position.z) * Math.min(1, dt * 14);
    state.bobT += dt * (moving ? 9 : 2);
    group.position.y = Math.sin(state.bobT * 2) * 0.004 * (moving ? 1 : 0.3);
    group.position.x = Math.cos(state.bobT) * 0.005 * (moving ? 1 : 0.3);
  }

  function refill() {
    state.mag = state.def.mag;
    state.reserve = state.def.reserve;
    state.reloading = 0;
  }

  return { state, group, equip, ready, takeRound, reload, pullTrigger, step, refill };
}
