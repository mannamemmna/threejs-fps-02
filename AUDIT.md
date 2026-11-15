# Artifact and gameplay repair

Baseline: 780725d104fe26b9968964cb5d59ba2c9cbb084a. Official submission 01a1dcaf-93df-7096-80fe-c49472966dac returned valid=0, failed_tests and cost_unpriced. All baseline screenshots were 780×437; RULES requires a minimum short side of 480. `tests/artifact.py` fails on that baseline and passes the replacement 1280×720 browser captures.

Changes repair world-space hit detection, pre-start/pause simulation, mid-round bot respawns, attacker/defender objective outcomes, defender bomb pursuit, ammo HUD after reload, round/match restart, buy-menu layout/state, weapon switching with preserved magazines, objective-label positioning and dark scene lighting. Browser pointer-lock denial has a click-start fallback.

Validation performed on emitted game files, not only repository source:

- Normal URL: start, move, shoot (opponent HP reduced), reload, pause, hostile player death and next-round restart.
- Two losses earn funds; rifle purchase, automatic fire kills an opponent, pistol/rifle switching preserves the partially depleted rifle magazine.
- Active-hostile site-B planting; supplemental peace-mode objective tests confirm detonation attacker win and defender defusal defender win.
- Browser imports confirm translated head bounds and no respawn after ten simulated seconds. All resource URLs are local; external network URLs blocked during smoke play.
- 1280×720 genuine browser screenshots, all below 256 KiB. Lighting reviewed visually.
- Node 22.23.5 output twice: recursive byte comparison identical; artifact checker passes. Server reports Node 22.23.4: host tests are not an official container grade.

Local commands:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
python tests/artifact.py out ../threejs-fps-02-kit
```

The sealed scorer is unavailable locally. Official validity and prize eligibility require a new server result. `cost_unpriced` remains unresolved. Browser input was exercised via browser-dispatched events; trusted pointer lock is denied by this harness. Full match-length play and every map route were not exhaustively tested; bot navigation can still stick against obstacles. No kit file was modified.
