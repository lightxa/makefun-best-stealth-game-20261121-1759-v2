// vision.js — one job: decide what a guard can see.
// A guard sees the player only when three things are true at once:
// the player is inside the cone (range and angle), no wall stands
// between them, and the player is not hidden inside a fog bank.
// Fog also shortens a cone: a cone that crosses a fog bank stops at it.

import { WALLS, FOG_BANKS } from './levels.js';

// True when the segment from (x1, y1) to (x2, y2) crosses any wall.
// Walls are axis-aligned rectangles, so a slab test per wall is enough.
export function lineBlocked(x1, y1, x2, y2) {
  for (const wall of WALLS) {
    if (segmentHitsRect(x1, y1, x2, y2, wall)) return true;
  }
  return false;
}

// Slab test: does the segment cross this rectangle?
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  for (const [origin, delta, lo, hi] of [
    [x1, dx, rect.x, rect.x + rect.w],
    [y1, dy, rect.y, rect.y + rect.h],
  ]) {
    if (Math.abs(delta) < 1e-9) {
      if (origin < lo || origin > hi) return false;
    } else {
      let t1 = (lo - origin) / delta;
      let t2 = (hi - origin) / delta;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

// True when the point is inside any fog bank.
export function pointInFog(x, y) {
  for (const fog of FOG_BANKS) {
    const dx = x - fog.x;
    const dy = y - fog.y;
    if (dx * dx + dy * dy < fog.r * fog.r) return true;
  }
  return false;
}

// Where does this guard's cone end when fog cuts it short? Walk along
// the cone's centre ray and stop at the first fog bank it enters.
export function coneRangeThroughFog(guard) {
  let range = guard.coneRange;
  const step = 6;
  for (let d = step; d <= guard.coneRange; d += step) {
    const x = guard.x + Math.cos(guard.facing) * d;
    const y = guard.y + Math.sin(guard.facing) * d;
    if (pointInFog(x, y)) {
      range = d;
      break;
    }
  }
  return range;
}

// The core question: can this guard see the player right now?
// Returns false fast for the common cases, then does the real checks.
export function guardCanSee(guard, player) {
  if (player.hiddenInFog) return false;
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const distSq = dx * dx + dy * dy;
  const range = coneRangeThroughFog(guard);
  if (distSq > range * range) return false;
  const angleToPlayer = Math.atan2(dy, dx);
  let diff = angleToPlayer - guard.facing;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > guard.coneHalfAngle) return false;
  if (lineBlocked(guard.x, guard.y, player.x, player.y)) return false;
  return true;
}

// How close is the player to being seen: 0 when far outside the cone,
// 1 when dead centre and close. Used for the near-miss warning.
export function coneProximity(guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > guard.coneRange) return 0;
  const angleToPlayer = Math.atan2(dy, dx);
  let diff = angleToPlayer - guard.facing;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const anglePart = 1 - Math.abs(diff) / guard.coneHalfAngle;
  if (anglePart <= 0) return 0;
  const distPart = 1 - dist / guard.coneRange;
  return Math.max(0, Math.min(1, anglePart * 0.5 + distPart * 0.5));
}
