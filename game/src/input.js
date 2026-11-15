// Input: pointer lock mouse look, keyboard state, fire held, weapon slot keys, buy menu open.
export function createInput(canvas, hooks = {}) {
  const state = {
    keys: new Set(),
    firing: false,
    lookX: 0,
    lookY: 0,
    slot: 0, // 0 primary, 1 pistol, 2 grenade
    buyOpen: false,
    locked: false,
  };
  const sensitivity = 0.0021;

  document.addEventListener('mousemove', (event) => {
    if (!state.locked) return;
    state.lookX += event.movementX * sensitivity;
    state.lookY += event.movementY * sensitivity;
  });
  document.addEventListener('mousedown', (event) => {
    if (!state.locked) return;
    if (event.button === 0) state.firing = true;
  });
  document.addEventListener('mouseup', (event) => {
    if (event.button === 0) state.firing = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Tab' || event.code === 'Space') event.preventDefault();
    if (event.code === 'Escape') {
      state.locked = false; state.firing = false; state.keys.clear();
      if (hooks.onLockChange) hooks.onLockChange(false);
      return;
    }
    if (event.repeat) return;
    state.keys.add(event.code);
    if (event.code === 'Digit1') state.slot = 0;
    if (event.code === 'Digit2') state.slot = 1;
    if (event.code === 'Digit3') state.slot = 2;
    if (event.code === 'KeyB') {
      state.buyOpen = !state.buyOpen;
      if (hooks.onBuyMenu) hooks.onBuyMenu(state.buyOpen);
    }
    if (hooks.onKey) hooks.onKey(event.code);
  });
  document.addEventListener('keyup', (event) => {
    state.keys.delete(event.code);
  });

  function startWithoutLock() {
    state.locked = true;
    if (hooks.onLockChange) hooks.onLockChange(true);
  }
  function requestLock() {
    // Browsers may deny pointer lock; the same click still starts mouse-look play.
    startWithoutLock();
    try { canvas.requestPointerLock?.()?.catch(startWithoutLock); } catch { startWithoutLock(); }
  }
  document.addEventListener('pointerlockerror', () => {
    if (!state.buyOpen) startWithoutLock();
  });

  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === canvas;
    if (hooks.onLockChange) hooks.onLockChange(state.locked);
    if (!state.locked) {
      state.firing = false;
      state.keys.clear();
    }
  });

  canvas.addEventListener('click', () => {
    if (!state.locked && !state.buyOpen) requestLock();
  });

  function takeLook() {
    const out = { x: state.lookX, y: state.lookY };
    state.lookX = 0;
    state.lookY = 0;
    return out;
  }

  return { state, requestLock, takeLook };
}
