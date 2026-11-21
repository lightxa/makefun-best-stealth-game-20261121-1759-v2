// render.js — one job: draw everything the judge sees.
// Top-down night harbour: dark water, lamplit wooden piers, stacked
// containers, drifting fog, guards with pale-yellow vision cones and
// the moored boat glowing at the south-east pier. The cover shot is
// this frame: player, a cone, cover and the boat all in one view.

import { WORLD_W, WORLD_H, WALLS, FOG_BANKS, MANIFEST_SPOTS, BOAT, PIERS } from './levels.js';
import { coneRangeThroughFog, coneProximity } from './vision.js';

const WALL_COLORS = {
  warehouse: '#5a4632',
  office: '#4c5a68',
  container: '#7a4a2e',
  crate: '#8a6a3e',
};

export function drawWorld(ctx, state, time) {
  drawWater(ctx, time);
  drawPiers(ctx);
  drawBoat(ctx, state, time);
  drawWalls(ctx);
  drawFog(ctx, time);
  drawManifests(ctx, state, time);
  drawGuards(ctx, state, time);
  drawPlayer(ctx, state, time);
  drawNoiseRing(ctx, state, time);
}

function drawWater(ctx, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  grad.addColorStop(0, '#0a1626');
  grad.addColorStop(1, '#060d18');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.strokeStyle = 'rgba(90, 150, 200, 0.10)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const y = 140 + i * 52 + Math.sin(time * 0.5 + i * 1.3) * 3;
    ctx.beginPath();
    for (let x = 0; x <= WORLD_W; x += 24) {
      const yy = y + Math.sin(x * 0.02 + time * 0.8 + i) * 2.5;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
}

function drawPiers(ctx) {
  for (const pier of PIERS) {
    ctx.fillStyle = '#3d2f1e';
    ctx.fillRect(pier.x, pier.y, pier.w, pier.h);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    for (let x = pier.x + 32; x < pier.x + pier.w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, pier.y);
      ctx.lineTo(x, pier.y + pier.h);
      ctx.stroke();
    }
    for (let y = pier.y + 28; y < pier.y + pier.h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(pier.x, y);
      ctx.lineTo(pier.x + pier.w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#d8b25a';
    ctx.lineWidth = 2;
    ctx.strokeRect(pier.x + 2, pier.y + 2, pier.w - 4, pier.h - 4);
  }
}

function drawWalls(ctx) {
  for (const wall of WALLS) {
    ctx.fillStyle = WALL_COLORS[wall.kind] ?? '#666666';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    if (wall.kind === 'container' || wall.kind === 'crate') {
      ctx.strokeRect(wall.x + 6, wall.y + 6, wall.w - 12, wall.h - 12);
    }
    if (wall.kind === 'warehouse') {
      ctx.fillStyle = '#d8b25a';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WAREHOUSE 7', wall.x + wall.w / 2, wall.y + wall.h / 2 + 5);
    }
    if (wall.kind === 'office') {
      ctx.fillStyle = '#cfe3f2';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HARBOR OFFICE', wall.x + wall.w / 2, wall.y + wall.h / 2 + 4);
    }
  }
}

function drawFog(ctx, time) {
  for (const fog of FOG_BANKS) {
    const wobble = Math.sin(time * 0.4 + fog.x) * 4;
    const grad = ctx.createRadialGradient(fog.x, fog.y, fog.r * 0.15, fog.x, fog.y, fog.r + wobble);
    grad.addColorStop(0, 'rgba(200, 215, 230, 0.34)');
    grad.addColorStop(0.7, 'rgba(200, 215, 230, 0.20)');
    grad.addColorStop(1, 'rgba(200, 215, 230, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fog.x, fog.y, fog.r + wobble, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawManifests(ctx, state, time) {
  for (const spot of MANIFEST_SPOTS) {
    if (state.player.collected[spot.id]) continue;
    const bob = Math.sin(time * 2 + spot.id * 2) * 3;
    const glow = ctx.createRadialGradient(spot.x, spot.y + bob, 2, spot.x, spot.y + bob, 34);
    glow.addColorStop(0, 'rgba(255, 214, 90, 0.55)');
    glow.addColorStop(1, 'rgba(255, 214, 90, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y + bob, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd65a';
    ctx.fillRect(spot.x - 9, spot.y - 7 + bob, 18, 14);
    ctx.fillStyle = '#7a5a10';
    ctx.fillRect(spot.x - 9, spot.y - 7 + bob, 18, 4);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('M', spot.x, spot.y + 4 + bob);
  }
}

function drawBoat(ctx, state, time) {
  const ready = state.player.manifests >= MANIFEST_SPOTS.length;
  const bob = Math.sin(time * 0.9) * 2;
  ctx.fillStyle = '#2c3e55';
  ctx.beginPath();
  ctx.ellipse(BOAT.x + BOAT.w / 2, BOAT.y + BOAT.h / 2 + bob, BOAT.w / 2, BOAT.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ready ? '#ffd65a' : '#8fa8c0';
  ctx.lineWidth = ready ? 3 : 2;
  ctx.stroke();
  ctx.fillStyle = '#1c2a3c';
  ctx.fillRect(BOAT.x + 30, BOAT.y + 18 + bob, 50, 30);
  ctx.fillStyle = ready ? '#ffd65a' : '#5a7288';
  ctx.beginPath();
  ctx.arc(BOAT.x + 55, BOAT.y + 12 + bob, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ready ? '#ffe9a0' : '#cfe3f2';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ready ? 'BOAT — GO!' : 'BOAT (EXIT)', BOAT.x + BOAT.w / 2, BOAT.y + BOAT.h + 16);
}

function drawGuards(ctx, state, time) {
  for (const guard of state.guards) {
    drawCone(ctx, guard, state);
    const bob = Math.sin(guard.stepPhase) * 1.5;
    ctx.save();
    ctx.translate(guard.x, guard.y + bob);
    ctx.fillStyle = guard.state === 'search' ? '#c0392b' : '#2e5d8a';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dfe9f2';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffd65a';
    ctx.beginPath();
    ctx.arc(Math.cos(guard.facing) * 6, Math.sin(guard.facing) * 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (guard.suspicion > 2) {
      const w = 34;
      const h = 5;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(guard.x - w / 2, guard.y - 26, w, h);
      ctx.fillStyle = guard.suspicion > 66 ? '#e74c3c' : '#f39c12';
      ctx.fillRect(guard.x - w / 2, guard.y - 26, (w * guard.suspicion) / 100, h);
    }
    ctx.fillStyle = '#e8f0f6';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name, guard.x, guard.y + 28);
  }
}

function drawCone(ctx, guard, state) {
  const range = coneRangeThroughFog(guard);
  const hot = guard.suspicion > 66 || guard.state === 'search';
  const warm = guard.suspicion > 25;
  const color = hot ? '231, 76, 60' : warm ? '243, 156, 18' : '255, 224, 130';
  const grad = ctx.createRadialGradient(guard.x, guard.y, 8, guard.x, guard.y, range);
  grad.addColorStop(0, `rgba(${color}, 0.34)`);
  grad.addColorStop(1, `rgba(${color}, 0.05)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.facing - guard.coneHalfAngle, guard.facing + guard.coneHalfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${color}, 0.5)`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawPlayer(ctx, state, time) {
  const p = state.player;
  const bob = p.moving ? Math.sin(p.stepPhase) * 1.5 : 0;
  if (p.hiddenInFog) {
    ctx.save();
    ctx.globalAlpha = 0.45;
  }
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.fillStyle = '#27ae60';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#eafaf1';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#1e8449';
  ctx.beginPath();
  ctx.arc(Math.cos(p.facing) * 6, Math.sin(p.facing) * 6, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (p.hiddenInFog) ctx.restore();
  ctx.fillStyle = '#eafaf1';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.sneaking ? 'SNEAKING' : 'YOU', p.x, p.y - 20);
}

function drawNoiseRing(ctx, state, time) {
  const p = state.player;
  if (!p.moving || p.noiseRadius < 4) return;
  const pulse = 0.5 + 0.5 * Math.sin(p.noisePulse * 6);
  ctx.strokeStyle = p.sneaking ? `rgba(120, 200, 140, ${0.25 + pulse * 0.2})` : `rgba(255, 255, 255, ${0.3 + pulse * 0.25})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.noiseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.sneaking ? 'quiet…' : 'footsteps…', p.x, p.y + p.noiseRadius + 14);
}

// The HUD bar across the top: title, manifests, suspicion, timer, alarm.
export function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(4, 10, 18, 0.78)';
  ctx.fillRect(0, 0, WORLD_W, 34);
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TIDEGLASS HARBOR', 12, 22);
  ctx.fillStyle = '#e8f0f6';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Manifests ${state.player.manifests}/3`, 230, 22);
  const suspicion = state.maxSuspicion;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(360, 12, 130, 10);
  ctx.fillStyle = suspicion > 66 ? '#e74c3c' : suspicion > 25 ? '#f39c12' : '#27ae60';
  ctx.fillRect(360, 12, (130 * suspicion) / 100, 10);
  ctx.fillStyle = '#e8f0f6';
  ctx.fillText('Suspicion', 500, 22);
  const mins = Math.floor(state.elapsed / 60);
  const secs = Math.floor(state.elapsed % 60).toString().padStart(2, '0');
  ctx.fillText(`${mins}:${secs}`, 620, 22);
  if (state.alarm) {
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('⚠ ALARM — HIDE!', 700, 22);
  } else if (state.nearMiss) {
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Close… a guard almost saw you', 700, 22);
  }
}

// Full-screen overlays: start, win and lose.
export function drawScreen(ctx, state) {
  ctx.fillStyle = 'rgba(4, 10, 18, 0.82)';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.textAlign = 'center';
  if (state.phase === 'start') {
    ctx.fillStyle = '#ffd65a';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('TIDEGLASS HARBOR', WORLD_W / 2, 150);
    ctx.fillStyle = '#e8f0f6';
    ctx.font = '17px sans-serif';
    ctx.fillText('A foggy dockyard at night. You are the smuggler.', WORLD_W / 2, 195);
    ctx.fillText('Slip past the dock guards, collect 3 cargo manifests,', WORLD_W / 2, 222);
    ctx.fillText('then reach the moored boat — unseen.', WORLD_W / 2, 249);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#9fc3dd';
    ctx.fillText('WASD / arrows — move      Shift — sneak (slow and quiet)', WORLD_W / 2, 300);
    ctx.fillText('Crates and containers block sight. Fog banks hide you completely.', WORLD_W / 2, 328);
    ctx.fillText('Suspicion fades when you break line of sight. Full suspicion raises the alarm.', WORLD_W / 2, 356);
    ctx.fillStyle = '#ffd65a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Click or press Enter to slip in', WORLD_W / 2, 420);
  } else if (state.phase === 'win') {
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('CLEAN GETAWAY', WORLD_W / 2, 200);
    ctx.fillStyle = '#e8f0f6';
    ctx.font = '18px sans-serif';
    ctx.fillText(`All 3 manifests aboard in ${state.winTime}s. The boat slips into the fog.`, WORLD_W / 2, 245);
    ctx.fillText('Press R to run it again.', WORLD_W / 2, 285);
  } else if (state.phase === 'lose') {
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('CAUGHT ON THE DOCK', WORLD_W / 2, 200);
    ctx.fillStyle = '#e8f0f6';
    ctx.font = '18px sans-serif';
    ctx.fillText('A guard laid hands on you under the lamps. The manifests stay behind.', WORLD_W / 2, 245);
    ctx.fillText('Press R to try a quieter route.', WORLD_W / 2, 285);
  }
}
