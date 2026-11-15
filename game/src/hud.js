// HUD: health, armour, ammo, round timer, score, money, buy menu, kill feed, hit marker,
// objective prompts. DOM overlay — no canvas text, no textures.
import { WEAPONS } from './weapon.js';
import { PALETTE } from './palette.js';

export function createHud() {
  const root = document.getElementById('hud');
  const buyMenu = document.getElementById('buy-menu');
  const feed = document.getElementById('killfeed');
  const prompt = document.getElementById('prompt');

  function setAmmo(mag, reserve) {
    document.getElementById('ammo').textContent = String(mag).padStart(2, '0');
    document.getElementById('reserve').textContent = `/ ${reserve}`;
  }

  function setWeapon(name) {
    document.getElementById('weapon-name').textContent = name;
  }

  function setHealth(hp, armour) {
    const bar = document.getElementById('health-bar');
    bar.style.width = `${Math.max(0, hp)}%`;
    bar.style.background = hp > 40 ? PALETTE.teal : PALETTE.accent;
    document.getElementById('health-num').textContent = `${Math.max(0, Math.round(hp))}`;
    document.getElementById('armour-num').textContent = `${Math.max(0, Math.round(armour))}`;
  }

  function setMoney(amount) {
    document.getElementById('money').textContent = `$${amount}`;
  }

  function setRoundTimer(text, danger) {
    const el = document.getElementById('round-timer');
    el.textContent = text;
    el.style.color = danger ? PALETTE.accent : PALETTE.ink;
  }

  function setScore(player, enemy) {
    document.getElementById('score-t').textContent = String(player);
    document.getElementById('score-ct').textContent = String(enemy);
  }

  function setBombState(text, show) {
    const el = document.getElementById('bomb-state');
    el.textContent = text;
    el.style.display = show ? 'block' : 'none';
  }

  function showPrompt(text) {
    prompt.textContent = text;
    prompt.style.display = text ? 'block' : 'none';
  }

  function hitMarker(killed) {
    const el = document.getElementById('hitmarker');
    el.style.opacity = '1';
    el.style.color = killed ? PALETTE.accent : '#ffffff';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; }, 120);
  }

  function feedLine(text) {
    const row = document.createElement('div');
    row.className = 'feed-row';
    row.textContent = text;
    feed.prepend(row);
    while (feed.children.length > 4) feed.removeChild(feed.lastChild);
    setTimeout(() => { if (row.parentNode) row.parentNode.removeChild(row); }, 4200);
  }

  function showOverlay(kind, scoreT, scoreCt, money) {
    const ov = document.getElementById('overlay');
    const title = document.getElementById('overlay-title');
    const sub = document.getElementById('overlay-sub');
    if (kind === 'start') {
      title.textContent = 'DEPOT HEX';
      sub.innerHTML = 'DEFUSE: plant at A or B, or stop the push.<br>Click to play · WASD move · B buy menu';
    } else if (kind === 'won') {
      title.textContent = 'ROUND WON';
      sub.textContent = `score ${scoreT} — ${scoreCt} · $${money}`;
    } else if (kind === 'lost') {
      title.textContent = 'ROUND LOST';
      sub.textContent = `score ${scoreT} — ${scoreCt} · $${money}`;
    } else if (kind === 'match') {
      title.textContent = 'MATCH OVER';
      sub.textContent = `final ${scoreT} — ${scoreCt}`;
    } else {
      title.textContent = 'PAUSED';
      sub.textContent = 'click to resume';
    }
    ov.style.display = 'flex';
  }

  function hideOverlay() {
    document.getElementById('overlay').style.display = 'none';
  }

  function showBuy(money, owned) {
    buyMenu.style.display = 'flex';
    const rows = buyMenu.querySelectorAll('.buy-row');
    rows.forEach((row) => {
      const key = row.dataset.weapon;
      const def = WEAPONS[key];
      const price = row.querySelector('.buy-price');
      const afford = money >= def.price;
      price.textContent = def.price === 0 ? 'free' : `$${def.price}`;
      price.style.color = afford ? PALETTE.teal : PALETTE.accent;
      row.style.opacity = owned[key] ? '0.45' : afford ? '1' : '0.55';
    });
    document.getElementById('buy-money').textContent = `$${money}`;
  }

  function hideBuy() {
    buyMenu.style.display = 'none';
  }

  function damageFlash(direction) {
    const el = document.getElementById('damage-flash');
    el.style.opacity = '0.5';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; }, 140);
  }

  return {
    setAmmo, setWeapon, setHealth, setMoney, setRoundTimer, setScore, setBombState,
    showPrompt, hitMarker, feedLine, showOverlay, hideOverlay, showBuy, hideBuy, damageFlash,
  };
}
