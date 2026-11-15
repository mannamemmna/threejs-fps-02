// Movement: capsule-vs-AABB slide along walls, gravity, jump, crouch, acceleration.
// A fixed-step simulation: the same inputs always produce the same positions.
import * as THREE from 'three';

const GRAVITY = 22;
const JUMP_SPEED = 7.4;
const EYE_STAND = 1.62;
const EYE_CROUCH = 1.06;
const RADIUS = 0.38;
const HEIGHT_STAND = 1.8;
const HEIGHT_CROUCH = 1.2;

export function createPlayer(colliders) {
  const state = {
    position: new THREE.Vector3(0, 0, 21), // T spawn, south side
    velocity: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    eye: EYE_STAND,
    height: HEIGHT_STAND,
    crouching: false,
    grounded: true,
    alive: true,
    money: 800,
    kills: 0,
    deaths: 0,
  };

  function aabbCollide(pos, height) {
    // Push the capsule out of every collider box it overlaps (axis-separated resolution).
    for (let iter = 0; iter < 3; iter += 1) {
      let moved = false;
      const min = new THREE.Vector3(pos.x - RADIUS, pos.y, pos.z - RADIUS);
      const max = new THREE.Vector3(pos.x + RADIUS, pos.y + height, pos.z + RADIUS);
      for (const b of colliders) {
        if (max.x <= b.min.x || min.x >= b.max.x) continue;
        if (max.y <= b.min.y || min.y >= b.max.y) continue;
        if (max.z <= b.min.z || min.z >= b.max.z) continue;
        // Overlap on each axis; resolve along the smallest.
        const pushX = Math.min(max.x - b.min.x, b.max.x - min.x);
        const pushY = Math.min(max.y - b.min.y, b.max.y - min.y);
        const pushZ = Math.min(max.z - b.min.z, b.max.z - min.z);
        if (pushY <= pushX && pushY <= pushZ) {
          if (pos.y + height / 2 > (b.min.y + b.max.y) / 2) pos.y += pushY;
          else pos.y -= pushY;
          state.velocity.y = Math.min(state.velocity.y, 0) === state.velocity.y && pos.y + height / 2 <= (b.min.y + b.max.y) / 2 ? state.velocity.y : state.velocity.y;
        } else if (pushX <= pushZ) {
          pos.x += max.x - b.min.x < b.max.x - min.x ? -pushX : pushX;
        } else {
          pos.z += max.z - b.min.z < b.max.z - min.z ? -pushZ : pushZ;
        }
        moved = true;
      }
      if (!moved) break;
    }
  }

  function groundCheck(pos, height) {
    const probe = 0.06;
    const min = new THREE.Vector3(pos.x - RADIUS, pos.y - probe, pos.z - RADIUS);
    const max = new THREE.Vector3(pos.x + RADIUS, pos.y + 0.02, pos.z + RADIUS);
    for (const b of colliders) {
      if (max.x <= b.min.x || min.x >= b.max.x) continue;
      if (max.y < b.min.y || min.y > b.max.y) continue;
      if (max.z <= b.min.z || min.z >= b.max.z) continue;
      return true;
    }
    return false;
  }

  function step(dt, keys) {
    if (!state.alive) return;
    const wantCrouch = keys.has('ControlLeft') || keys.has('KeyC');
    const speedCap = state.crouching ? 2.4 : keys.has('ShiftLeft') ? 6.9 : 5.2;

    // Wish direction in yaw space.
    let wx = 0;
    let wz = 0;
    if (keys.has('KeyW')) wz -= 1;
    if (keys.has('KeyS')) wz += 1;
    if (keys.has('KeyA')) wx -= 1;
    if (keys.has('KeyD')) wx += 1;
    const len = Math.hypot(wx, wz);
    if (len > 0) {
      wx /= len;
      wz /= len;
      const sin = Math.sin(state.yaw);
      const cos = Math.cos(state.yaw);
      const dx = wx * cos + wz * sin;
      const dz = -wx * sin + wz * cos;
      // Accelerate toward wish speed; friction when grounded.
      const accel = state.grounded ? 42 : 9;
      state.velocity.x += dx * accel * dt;
      state.velocity.z += dz * accel * dt;
    }
    if (state.grounded) {
      const damp = Math.exp(-9.5 * dt);
      state.velocity.x *= damp;
      state.velocity.z *= damp;
    }
    // Clamp horizontal speed.
    const hs = Math.hypot(state.velocity.x, state.velocity.z);
    if (hs > speedCap) {
      state.velocity.x *= speedCap / hs;
      state.velocity.z *= speedCap / hs;
    }
    if (state.grounded && keys.has('Space')) {
      state.velocity.y = JUMP_SPEED;
      state.grounded = false;
    }
    state.velocity.y -= GRAVITY * dt;

    state.position.x += state.velocity.x * dt;
    state.position.z += state.velocity.z * dt;
    state.position.y += state.velocity.y * dt;

    // Crouch height change (eye eases toward target).
    if (wantCrouch !== state.crouching) {
      state.crouching = wantCrouch;
      state.height = wantCrouch ? HEIGHT_CROUCH : HEIGHT_STAND;
    }
    state.eye += ((state.crouching ? EYE_CROUCH : EYE_STAND) - state.eye) * Math.min(1, dt * 12);

    aabbCollide(state.position, state.height);
    state.grounded = groundCheck(state.position, state.height);
    if (state.grounded && state.velocity.y < 0) state.velocity.y = 0;
    // Yard bounds safety.
    state.position.x = Math.max(-25.4, Math.min(25.4, state.position.x));
    state.position.z = Math.max(-25.4, Math.min(25.4, state.position.z));
    if (state.position.y < -4) {
      state.position.set(0, 0, 21);
      state.velocity.set(0, 0, 0);
    }
  }

  function look(dx, dy) {
    state.yaw -= dx;
    state.pitch -= dy;
    state.pitch = Math.max(-1.45, Math.min(1.45, state.pitch));
  }

  function recoil(pitchKick, yawKick) {
    state.pitch += pitchKick;
    state.yaw += yawKick;
    state.pitch = Math.max(-1.45, Math.min(1.45, state.pitch));
  }

  function groundSpeed() {
    return Math.hypot(state.velocity.x, state.velocity.z);
  }

  return { state, step, look, recoil, groundSpeed, RADIUS };
}
