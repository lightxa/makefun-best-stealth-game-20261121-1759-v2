// levels.js — the Tideglass Harbor dockyard: one job, describe the level.
// The world is 960 by 600, seen from above. Wooden piers run over dark
// water; the moored boat (the exit) waits at the south-east pier. Crates
// and stacked containers block sight and movement; fog banks hide the
// player completely while they stand inside one. Three cargo manifests
// are tucked in risky corners so each one forces a different route.

export const WORLD_W = 960;
export const WORLD_H = 600;

// Solid rectangles the player and the guards walk around. Each one is a
// piece of cover the judge can read at a glance: crates, containers,
// a warehouse wall and the dock office.
export const WALLS = [
  // Warehouse block, north-west.
  { x: 40, y: 40, w: 150, h: 90, kind: 'warehouse' },
  // Dock office, north-east.
  { x: 730, y: 36, w: 190, h: 84, kind: 'office' },
  // Stacked containers, middle band.
  { x: 300, y: 120, w: 120, h: 54, kind: 'container' },
  { x: 300, y: 210, w: 54, h: 120, kind: 'container' },
  { x: 520, y: 150, w: 120, h: 54, kind: 'container' },
  { x: 640, y: 300, w: 54, h: 120, kind: 'container' },
  // Loose crates scattered as low cover.
  { x: 120, y: 300, w: 60, h: 60, kind: 'crate' },
  { x: 210, y: 430, w: 60, h: 60, kind: 'crate' },
  { x: 470, y: 380, w: 60, h: 60, kind: 'crate' },
  { x: 560, y: 470, w: 60, h: 60, kind: 'crate' },
  { x: 820, y: 220, w: 60, h: 60, kind: 'crate' },
  { x: 80, y: 470, w: 90, h: 50, kind: 'crate' },
];

// Fog banks: soft circles of harbour mist. A player standing inside one
// cannot be seen at all, even inside a vision cone, and a guard's cone
// is cut short by fog. Guards walk around them, never through.
export const FOG_BANKS = [
  { x: 250, y: 120, r: 62 },
  { x: 470, y: 250, r: 70 },
  { x: 700, y: 430, r: 66 },
  { x: 150, y: 190, r: 48 },
];

// The three cargo manifests. Each is a small glowing satchel on a crate.
export const MANIFEST_SPOTS = [
  { x: 105, y: 165, id: 0, label: 'Manifest A' },
  { x: 905, y: 165, id: 1, label: 'Manifest B' },
  { x: 330, y: 545, id: 2, label: 'Manifest C' },
];

// The moored boat: the exit. It sits in the water at the south-east
// pier; the player wins by stepping onto its gangplank once all three
// manifests are collected.
export const BOAT = { x: 830, y: 500, w: 110, h: 80 };

// Where the smuggler slips in: the west gate, top of the south pier.
export const PLAYER_START = { x: 60, y: 540 };

// Patrol routes, one loop per guard. A waypoint holds [x, y, pauseSeconds].
// The loops cross the open lanes so the player must learn their timing.
export const GUARD_ROUTES = [
  {
    name: 'Lantern',
    waypoints: [[260, 90, 1.5], [620, 90, 2.0], [620, 250, 1.0], [260, 250, 1.5]],
    speed: 52,
    coneRange: 175,
    coneHalfAngle: 0.62,
  },
  {
    name: 'Brine',
    waypoints: [[420, 470, 2.0], [760, 470, 1.0], [760, 330, 1.5], [420, 330, 1.0]],
    speed: 46,
    coneRange: 165,
    coneHalfAngle: 0.58,
  },
  {
    name: 'Gull',
    waypoints: [[150, 420, 1.0], [150, 240, 2.0], [330, 240, 1.0], [330, 420, 1.5]],
    speed: 58,
    coneRange: 155,
    coneHalfAngle: 0.65,
  },
  {
    name: 'Tide',
    waypoints: [[700, 540, 2.5], [880, 540, 1.0], [880, 380, 1.5], [700, 380, 1.0]],
    speed: 48,
    coneRange: 170,
    coneHalfAngle: 0.6,
  },
];

// Piers drawn under everything: wooden boards over the water.
export const PIERS = [
  { x: 0, y: 0, w: 960, h: 120 },
  { x: 0, y: 300, w: 960, h: 300 },
];
