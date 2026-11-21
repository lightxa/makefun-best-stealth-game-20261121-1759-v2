// guards.js — one job: move the dock guards and run their suspicion.
// A guard walks its waypoint loop and pauses at each stop, looking
// around. Spotting the player raises suspicion; losing sight lets it
// decay, so a near miss is recoverable. Full suspicion raises the
// alarm: every guard hurries to the last seen spot, searches it, then
// relaxes back to patrol. A guard that touches the player during the
// alarm catches them.

import { GUARD_ROUTES } from './levels.js';
import { guardCanSee } from './vision.js';

export const SUSPICION_SEEN_RATE = 55; // points per second, fully seen
export const SUSPICION_DECAY_RATE = 22; // points per second, unseen
export const SUSPICION_MAX = 100;
export const SEARCH_TIME = 6; // seconds a guard searches the last spot

// One guard, built from its route. Facing starts toward the next stop.
export function createGuard(route, index) {
  const [sx, sy] = route.waypoints[0];
  const [nx, ny] = route.waypoints[1];
  return {
    name: route.name,
    index,
    x: sx,
    y: sy,
    facing: Math.atan2(ny - sy, nx - sx),
    speed: route.speed,
    coneRange: route.coneRange,
    coneHalfAngle: route.coneHalfAngle,
    waypoints: route.waypoints,
    waypointIndex: 1,
    pauseLeft: 0,
    suspicion: 0,
    state: 'patrol', // patrol | search | return
    searchLeft: 0,
    searchX: 0,
    searchY: 0,
    scanPhase: index * 1.7,
    stepPhase: 0,
    facingLocked: false, // staging hook only: freeze the facing for a shot
  };
}

export function createGuards() {
  return GUARD_ROUTES.map((route, i) => createGuard(route, i));
}

// Move one guard along its loop, pausing at each waypoint and scanning
// left and right while it waits, the way a real watchman would.
export function updatePatrol(guard, dt) {
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    if (guard.facingLocked) return;
    guard.scanPhase += dt;
    const sway = Math.sin(guard.scanPhase * 1.4) * 0.9;
    const [tx, ty] = guard.waypoints[guard.waypointIndex];
    const base = Math.atan2(ty - guard.y, tx - guard.x);
    guard.facing = base + sway;
    return;
  }
  const [tx, ty] = guard.waypoints[guard.waypointIndex];
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const step = guard.speed * dt;
  if (dist <= step) {
    guard.x = tx;
    guard.y = ty;
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    const pause = guard.waypoints[guard.waypointIndex][2] ?? 1;
    guard.pauseLeft = pause;
    return;
  }
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.facing = Math.atan2(dy, dx);
  guard.stepPhase += dt * guard.speed * 0.09;
}

// Hurry toward a point at search speed, facing the way it moves.
export function moveToward(guard, x, y, speed, dt) {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 4) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.facing = Math.atan2(dy, dx);
  guard.stepPhase += dt * speed * 0.09;
  return false;
}

// One tick for every guard. Returns an event the game loop reacts to:
// 'alarm' when a guard's suspicion first tops out, 'caught' when a
// guard reaches the player during the alarm, otherwise null.
export function updateGuards(guards, player, dt, alarmActive) {
  let event = null;
  for (const guard of guards) {
    const sees = guardCanSee(guard, player);
    if (sees) {
      const closeness = 1 - Math.min(1, Math.hypot(player.x - guard.x, player.y - guard.y) / guard.coneRange);
      guard.suspicion += SUSPICION_SEEN_RATE * (0.55 + 0.45 * closeness) * dt;
      guard.searchX = player.x;
      guard.searchY = player.y;
    } else {
      guard.suspicion -= SUSPICION_DECAY_RATE * dt;
    }
    guard.suspicion = Math.max(0, Math.min(SUSPICION_MAX, guard.suspicion));

    if (guard.suspicion >= SUSPICION_MAX && !alarmActive) {
      event = 'alarm';
    }

    if (alarmActive || guard.state === 'search') {
      if (guard.state !== 'search') {
        guard.state = 'search';
        guard.searchLeft = SEARCH_TIME;
      }
      const arrived = moveToward(guard, guard.searchX, guard.searchY, guard.speed * 1.7, dt);
      if (arrived) {
        guard.searchLeft -= dt;
        guard.scanPhase += dt;
        guard.facing += Math.sin(guard.scanPhase * 2.2) * dt * 1.8;
        if (guard.searchLeft <= 0) {
          guard.state = 'return';
          guard.suspicion = 30;
        }
      }
      const distToPlayer = Math.hypot(player.x - guard.x, player.y - guard.y);
      if (distToPlayer < 26) event = 'caught';
    } else if (guard.state === 'return') {
      const [tx, ty] = guard.waypoints[guard.waypointIndex];
      const arrived = moveToward(guard, tx, ty, guard.speed, dt);
      if (arrived) {
        guard.state = 'patrol';
        guard.pauseLeft = 1;
      }
    } else {
      updatePatrol(guard, dt);
    }
  }
  return event;
}

// The strongest suspicion among the guards: the HUD's single meter.
export function maxSuspicion(guards) {
  let top = 0;
  for (const guard of guards) top = Math.max(top, guard.suspicion);
  return top;
}
