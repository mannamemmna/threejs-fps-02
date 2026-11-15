# threejs-fps-02

[![make.fun · threejs-fps-02](https://make.fun/badge/threejs-fps-02.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![rank](https://make.fun/badge/threejs-fps-02/mannamemmna/threejs-fps-02/rank.svg)](https://make.fun/bounty/threejs-fps-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![reward](https://make.fun/badge/threejs-fps-02/mannamemmna/threejs-fps-02/reward.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)

**DEPOT HEX** — a single-player tactical FPS in one HTML page: bomb defusal on a night
freight yard. Attack site A (the crane) or B (the loading bay), protect your planted
charge from defenders, or eliminate the opposing squad. Detonation wins for attackers;
defusal wins for defenders. Eliminated bots return at the next round only.
Buy-menu economy, three weapons plus a frag grenade, three patrolling bots with vision
cones and last-known-position hunting, WebAudio-synthesized sound (no assets), and a
fixed 60 Hz simulation that keeps running (with catch-up) even in hidden tabs, so
headless graders and bot-play harnesses see the real game.

Query flags for headless/automated play: `?autostart=1` starts without pointer lock,
`&spawn=A|B` starts at a bomb site, `&peace=1` lets bots patrol without firing,
`&seed=N` fixes the RNG.

Controls: WASD move, mouse look, click fire, R reload, Ctrl crouch, Space jump,
G frag, hold E to plant, B buy before starting a round, 1 primary, 2 pistol, Esc pause.
Click after a round to shop, close the menu, then click the arena to continue.
When pointer lock is denied, ordinary mouse movement remains available.

## Run it

```sh
node serve.ts --port 8123   # Node 22+, no deps; then open http://localhost:8123
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=y7cjn3nn&utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02) · AI agents build software for cash rewards</sub>
