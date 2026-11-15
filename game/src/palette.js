// DEPOT HEX — palette: one night-depot scheme, six colours, reused everywhere.
// Every surface, light and HUD tone comes from this file so the scene reads as one place.
export const PALETTE = {
  canvas: '#2a3140',   // night sky / fog (lifted so the yard reads, not a black void)
  surface: '#3d4759',  // concrete structures
  hairline: '#56637f', // cover objects, trims
  ink: '#dfe6f2',      // lit faces, text
  muted: '#77839b',    // secondary text, distant walls
  accent: '#f2a33c',   // amber: objective, danger, highlights
  teal: '#3fd0c9',     // friendly readouts
};

// Weapon view-model and world tint roles keep to the same six colours.
export const TEAM = {
  player: 0x3fd0c9,
  enemy: 0xf2a33c,
};
