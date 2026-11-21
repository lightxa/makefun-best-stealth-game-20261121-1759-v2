// player.js — one job: the smuggler's body and footsteps.
// WASD or arrows move; holding Shift sneaks (slower, quieter, harder
// to spot at the edge of a cone). Walking makes noise: a ring spreads
// from the player that guards can hear, so running past a guard is a
// gamble. Sneaking shrinks the ring to almost nothing. Walls stop the
// player; fog hides them; the boat only counts once every manifest
// is in hand.

import { WALLS, WORLD_W, WORLD_H, MANIFEST_SPOTS, BOAT, PLAYER_START } from './levels.js';
import { pointInFog } from './vision.js';

export const WALK_SPEED = 150;
export const SNEAK_SPEED = 72;
export const PLAYER_RADIUS = 13;
export const NOISE_WALK_RADIUS = 95;
export const NOISE_SNEAK_RADIUS = 26;
export const PICKUP_RADIUS = 30;

export function createPlayer() {
  return {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    facing: 0,
    sneaking: false,
    moving: false,
    noiseRadius: 0,
    noisePulse: 0,
    hiddenInFog: false,
    stepPhase: 0,
    manifests: 0,
    collected: MANIFEST_SPOTS.map(() => false),
  };
}

// A circle (the player) against a rectangle (a wall): push the player
// out along the shortest axis so they slide along walls instead of
// sticking to them.
export function collideWalls(player) {
  for (const wall of WALLS) {
    const nearestX = Math.max(wall.x, Math.min(player.x, wall.x + wall.w));
    const nearestY = Math.max(wall.y, Math.min(player.y, wall.y + wall.h));
    const dx = player.x - nearestX;
    const dy = player.y - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= PLAYER_RADIUS * PLAYER_RADIUS) continue;
    if (distSq < 1e-9) {
      player.y = wall.y - PLAYER_RADIUS;
      continue;
    }
    const dist = Math.sqrt(distSq);
    player.x = nearestX + (dx / dist) * PLAYER_RADIUS;
    player.y = nearestY + (dy / dist) * PLAYER_RADIUS;
  }
  player.x = Math.max(PLAYER_RADIUS, Math.min(WORLD_W - PLAYER_RADIUS, player.x));
  player.y = Math.max(PLAYER_RADIUS, Math.min(WORLD_H - PLAYER_RADIUS, player.y));
}

// Move from the held keys. Returns true when the player actually moved,
// so the game can tick footsteps and noise.
export function updatePlayer(player, keys, dt) {
  let mx = 0;
  let my = 0;
  if (keys.has('arrowleft') || keys.has('a')) mx -= 1;
  if (keys.has('arrowright') || keys.has('d')) mx += 1;
  if (keys.has('arrowup') || keys.has('w')) my -= 1;
  if (keys.has('arrowdown') || keys.has('s')) my += 1;
  player.sneaking = keys.has('shift');
  player.moving = mx !== 0 || my !== 0;
  if (!player.moving) {
    player.noiseRadius = 0;
    player.hiddenInFog = pointInFog(player.x, player.y);
    return false;
  }
  const len = Math.hypot(mx, my);
  const speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
  player.x += (mx / len) * speed * dt;
  player.y += (my / len) * speed * dt;
  player.facing = Math.atan2(my, mx);
  player.stepPhase += dt * speed * 0.11;
  player.noisePulse += dt;
  const target = player.sneaking ? NOISE_SNEAK_RADIUS : NOISE_WALK_RADIUS;
  player.noiseRadius += (target - player.noiseRadius) * Math.min(1, dt * 8);
  collideWalls(player);
  player.hiddenInFog = pointInFog(player.x, player.y);
  return true;
}

// Pick up any manifest within reach. Returns the label of the one
// collected this tick, or null.
export function collectManifests(player) {
  for (const spot of MANIFEST_SPOTS) {
    if (player.collected[spot.id]) continue;
    if (Math.hypot(spot.x - player.x, spot.y - player.y) < PICKUP_RADIUS) {
      player.collected[spot.id] = true;
      player.manifests += 1;
      return spot.label;
    }
  }
  return null;
}

// True when the player stands on the boat's gangplank with all three
// manifests in hand: the win condition.
export function playerOnBoat(player) {
  if (player.manifests < MANIFEST_SPOTS.length) return false;
  return (
    player.x > BOAT.x - 8 &&
    player.x < BOAT.x + BOAT.w + 8 &&
    player.y > BOAT.y - 8 &&
    player.y < BOAT.y + BOAT.h + 8
  );
}
