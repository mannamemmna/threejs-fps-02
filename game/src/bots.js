// Bots: the enemy squad. Waypoint patrol through lanes, vision cone + hearing, react by
// engaging, pushing the last known position, or holding. Head/body hit zones, health, death.
import * as THREE from 'three';
import { PALETTE } from './palette.js';

const BOT_SPEED = 3.6;
const BOT_SIGHT = 26;
const BOT_FOV = Math.cos(1.05); // ~60 deg half-angle
const REACT_TIME = 0.42;

// Patrol loops per bot: lanes through the map, sites included.
const ROUTES = [
  [[-21, 21], [-21, 2], [-14, -12], [-8.5, -8.5], [-6, 2], [-14, 12], [-21, 21]],        // west lane → A
  [[0, 21], [0, 8], [0, -2], [0, -14], [-4, -20], [-8.5, -8.5], [0, -14], [0, 8]],       // mid → A
  [[21, 21], [18, 12], [12, 6], [8.5, 8.5], [14, 0], [16, -6], [12, -14], [8.5, 8.5]],  // east yard → B
  [[21, -21], [14, -16], [8, -10], [8.5, 8.5], [16, 4], [21, 12], [21, -21]],           // north → B
];

export function createBots(scene, world, count = 4) {
  const bots = [];
  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.accent), roughness: 0.7 });
  const darkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#1a1f29'), roughness: 0.8 });
  const visorMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.teal), roughness: 0.3, emissive: new THREE.Color(PALETTE.teal), emissiveIntensity: 0.4 });

  for (let i = 0; i < count; i += 1) {
    const g = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.34), bodyMat);
    torso.position.y = 1.14;
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.78, 0.3), darkMat);
    legs.position.y = 0.39;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), darkMat);
    head.position.y = 1.66;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.05), visorMat);
    visor.position.set(0, 1.68, -0.16);
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.6), darkMat);
    gun.position.set(0.2, 1.2, -0.42);
    g.add(torso, legs, head, visor, gun);
    scene.add(g);

    const bot = {
      id: i,
      group: g,
      head, torso, legs,
      position: new THREE.Vector3(),
      yaw: 0,
      hp: 100,
      alive: true,
      route: ROUTES[i % ROUTES.length],
      wp: 0,
      state: 'patrol', // patrol | engage | hunt | hold
      target: null,
      lastSeen: null,
      reactT: 0,
      fireCd: 0,
      deathT: 0,
      respawnT: 0,
      speed: BOT_SPEED * (0.9 + 0.2 * ((i * 37) % 10) / 10),
    };
    bots.push(bot);
    placeAtWaypoint(bot);
  }

  function placeAtWaypoint(bot) {
    const [x, z] = bot.route[bot.wp];
    bot.position.set(x, 0, z);
    bot.group.position.copy(bot.position);
  }

  function canSee(bot, eyePos) {
    const to = new THREE.Vector3().subVectors(eyePos, bot.position);
    const dist = to.length();
    if (dist > BOT_SIGHT) return false;
    to.normalize();
    const facing = new THREE.Vector3(-Math.sin(bot.yaw), 0, -Math.cos(bot.yaw));
    if (facing.dot(new THREE.Vector3(to.x, 0, to.z).normalize()) < BOT_FOV && dist > 3) return false;
    // Line of sight: ray from bot eye to player eye must clear world geometry.
    const ray = new THREE.Raycaster(
      new THREE.Vector3(bot.position.x, 1.6, bot.position.z),
      new THREE.Vector3().subVectors(eyePos, new THREE.Vector3(bot.position.x, 1.6, bot.position.z)).normalize(),
      0,
      dist,
    );
    const hits = ray.intersectObjects(world.shootables, false);
    return hits.length === 0;
  }

  function damage(bot, amount, part) {
    if (!bot.alive) return false;
    bot.hp -= amount;
    if (bot.hp <= 0) {
      bot.alive = false;
      bot.deathT = 0;
      bot.respawnT = 6;
      return true; // killed
    }
    return false;
  }

  function step(dt, elapsed, playerEye, onShoot, bombPosition) {
    for (const bot of bots) {
      if (!bot.alive) {
        bot.deathT += dt;
        const t = Math.min(1, bot.deathT / 0.4);
        bot.group.rotation.x = t * (Math.PI / 2);
        bot.group.position.y = -0.1 * t;
        // Eliminated defenders return only at the next round.
        continue;
      }
      const sees = canSee(bot, playerEye);
      if (sees) {
        bot.lastSeen = playerEye.clone();
        bot.reactT += dt;
        if (bot.reactT > 0.6 && bot.state !== 'engage') bot.state = 'engage';
      } else {
        bot.reactT = 0;
        if (bot.state === 'engage') bot.state = 'hunt';
      }

      let moveTarget = null;
      if (bot.state === 'engage' && bot.lastSeen) {
        // Face the player, strafe slightly, fire when aimed.
        const dx = playerEye.x - bot.position.x;
        const dz = playerEye.z - bot.position.z;
        bot.yaw = Math.atan2(-dx, -dz);
        bot.fireCd -= dt;
        const dist = Math.hypot(dx, dz);
        if (bot.fireCd <= 0 && dist < 34) {
          bot.fireCd = 0.42 + ((bot.id * 13 + Math.floor(elapsed * 3)) % 7) * 0.05;
          onShoot(bot, playerEye);
        }
        if (dist > 18) moveTarget = bot.lastSeen;
        else {
          // Hold and strafe.
          const strafe = Math.sin(elapsed * 1.7 + bot.id * 2.1) > 0 ? 1 : -1;
          moveTarget = new THREE.Vector3(
            bot.position.x + Math.cos(bot.yaw) * strafe * 2,
            0,
            bot.position.z - Math.sin(bot.yaw) * strafe * 2,
          );
        }
      } else if (bot.state === 'hunt' && bot.lastSeen) {
        moveTarget = bot.lastSeen;
        if (bot.position.distanceTo(bot.lastSeen) < 1.2) {
          bot.lastSeen = null;
          bot.state = 'patrol';
        }
      } else {
        // Patrol the route.
        const [tx, tz] = bot.route[bot.wp];
        moveTarget = new THREE.Vector3(tx, 0, tz);
        if (Math.hypot(bot.position.x - tx, bot.position.z - tz) < 0.9) {
          bot.wp = (bot.wp + 1) % bot.route.length;
        }
        const dx = moveTarget.x - bot.position.x;
        const dz = moveTarget.z - bot.position.z;
        bot.yaw = Math.atan2(-dx, -dz);
      }

      if (bombPosition) {
        moveTarget = bot.position.distanceTo(bombPosition) > 1.8 ? bombPosition : null;
        bot.state = 'defuse';
      }
      if (moveTarget) {
        const dx = moveTarget.x - bot.position.x;
        const dz = moveTarget.z - bot.position.z;
        const d = Math.hypot(dx, dz) || 1;
        const nx = bot.position.x + (dx / d) * bot.speed * dt;
        const nz = bot.position.z + (dz / d) * bot.speed * dt;
        // Slide: try full, then x-only, then z-only (bots keep to lanes; collision is soft).
        const test = new THREE.Vector3(nx, 0.9, nz);
        let blocked = false;
        for (const b of world.colliders) {
          if (test.x > b.min.x - 0.4 && test.x < b.max.x + 0.4 && test.z > b.min.z - 0.4 && test.z < b.max.z + 0.4 && b.max.y > 0.9) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          bot.position.x = nx;
          bot.position.z = nz;
        } else {
          // Try axis-separated moves.
          const tx = new THREE.Vector3(nx, 0.9, bot.position.z);
          let bx = false;
          for (const b of world.colliders) {
            if (tx.x > b.min.x - 0.4 && tx.x < b.max.x + 0.4 && bot.position.z > b.min.z - 0.4 && bot.position.z < b.max.z + 0.4 && b.max.y > 0.9) { bx = true; break; }
          }
          const tz = new THREE.Vector3(bot.position.x, 0.9, nz);
          let bz = false;
          for (const b of world.colliders) {
            if (bot.position.x > b.min.x - 0.4 && bot.position.x < b.max.x + 0.4 && tz.z > b.min.z - 0.4 && tz.z < b.max.z + 0.4 && b.max.y > 0.9) { bz = true; break; }
          }
          if (!bx) bot.position.x = nx;
          if (!bz) bot.position.z = nz;
          if (bot.state === 'patrol') bot.wp = (bot.wp + 1) % bot.route.length;
        }
      }

      bot.group.position.set(bot.position.x, 0, bot.position.z);
      bot.group.rotation.y = bot.yaw;
      // Legs swing while moving.
      const swing = Math.sin(elapsed * 8 + bot.id) * 0.25;
      bot.legs.rotation.x = swing * 0.4;
    }
  }

  function aliveCount() {
    return bots.filter((b) => b.alive).length;
  }

  function reset() {
    for (const bot of bots) {
      bot.alive = true;
      bot.hp = 100;
      bot.state = 'patrol';
      bot.group.rotation.x = 0;
      bot.wp = 0;
      bot.reactT = 0; bot.fireCd = 0; bot.lastSeen = null;
      placeAtWaypoint(bot);
    }
  }

  return { bots, step, damage, aliveCount, reset };
}
