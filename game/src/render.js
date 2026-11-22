// Shadow Vault — everything the player sees.
// One job: draw the level, the vision cones, the guards and the player on
// the canvas. No game rules live here; main.js owns the state.

import { TILE, VIEW_W, VIEW_H, COLORS } from './config.js';
import { GUARD_VISION_RANGE, GUARD_VISION_HALF_ANGLE } from './config.js';
import { castRay } from './world.js';
import { guardState } from './guards.js';

function coneColor(state) {
  if (state === 'alert') return COLORS.coneAlert;
  if (state === 'suspicious') return COLORS.coneSuspicious;
  return COLORS.coneCalm;
}

function drawFloor(ctx, world) {
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      const kind = world.tiles[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (kind === 'wall') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(px, py, TILE, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(px, py + 5, TILE, 2);
      } else if (kind === 'shadow') {
        ctx.fillStyle = COLORS.shadowZone;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = 'rgba(120, 150, 255, 0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 6, py + TILE - 6);
        ctx.lineTo(px + TILE - 6, py + 6);
        ctx.moveTo(px + 6, py + 14);
        ctx.lineTo(px + 14, py + 6);
        ctx.stroke();
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      }
    }
  }
}

function drawCover(ctx, world) {
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      const kind = world.tiles[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (kind === 'bush') {
        ctx.fillStyle = COLORS.bush;
        ctx.beginPath();
        ctx.arc(px + 12, py + 22, 11, 0, Math.PI * 2);
        ctx.arc(px + 26, py + 14, 12, 0, Math.PI * 2);
        ctx.arc(px + 28, py + 28, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.bushLeaf;
        ctx.beginPath();
        ctx.arc(px + 14, py + 16, 6, 0, Math.PI * 2);
        ctx.arc(px + 27, py + 24, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 'crate') {
        ctx.fillStyle = COLORS.crate;
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = COLORS.crateEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(px + 3, py + 3);
        ctx.lineTo(px + TILE - 3, py + TILE - 3);
        ctx.moveTo(px + TILE - 3, py + 3);
        ctx.lineTo(px + 3, py + TILE - 3);
        ctx.stroke();
      }
    }
  }
}

function drawExit(ctx, world, time) {
  const e = world.exit;
  const pulse = 0.6 + 0.4 * Math.sin(time * 3);
  ctx.save();
  ctx.shadowColor = COLORS.exit;
  ctx.shadowBlur = 18 * pulse;
  ctx.fillStyle = COLORS.exit;
  ctx.beginPath();
  ctx.arc(e.x, e.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#0b2e1c';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', e.x, e.y);
  ctx.strokeStyle = COLORS.exitGlow;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(e.x, e.y, 21 + 3 * pulse, 0, Math.PI * 2);
  ctx.stroke();
}

function drawShards(ctx, world, time) {
  for (const s of world.shards) {
    if (s.taken) continue;
    const bob = Math.sin(time * 2 + s.x) * 2;
    ctx.save();
    ctx.translate(s.x, s.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.shadowColor = COLORS.shard;
    ctx.shadowBlur = 10;
    ctx.fillStyle = COLORS.shard;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(s.x, s.y + 12, 7, 0, Math.PI);
    ctx.fill();
  }
}

function drawVisionCone(ctx, world, guard, detection) {
  const state = guardState(guard, detection);
  const rays = 26;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  for (let i = 0; i <= rays; i++) {
    const a =
      guard.angle - GUARD_VISION_HALF_ANGLE +
      (2 * GUARD_VISION_HALF_ANGLE * i) / rays;
    const d = castRay(world, guard.x, guard.y, a, GUARD_VISION_RANGE);
    ctx.lineTo(guard.x + Math.cos(a) * d, guard.y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fillStyle = coneColor(state);
  ctx.fill();
  ctx.strokeStyle = state === 'calm' ? 'rgba(255, 214, 90, 0.35)' : 'rgba(255, 90, 60, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawGuard(ctx, guard, detection, time) {
  const state = guardState(guard, detection);
  const bob = Math.sin(time * 6 + guard.id * 2) * 1.5;
  ctx.save();
  ctx.translate(guard.x, guard.y + bob);
  ctx.shadowColor = state === 'alert' ? '#ff3c28' : '#ff8a5c';
  ctx.shadowBlur = state === 'calm' ? 6 : 14;
  ctx.fillStyle = state === 'alert' ? COLORS.guard : COLORS.guardCalm;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Facing tick: a short nose showing where the guard looks.
  ctx.strokeStyle = '#2b0d08';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(
    guard.x + Math.cos(guard.angle) * 20,
    guard.y + Math.sin(guard.angle) * 20,
  );
  ctx.stroke();
  // Eyes.
  const ex = Math.cos(guard.angle);
  const ey = Math.sin(guard.angle);
  const px = -ey;
  const py = ex;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(guard.x + ex * 5 + px * 5, guard.y + ey * 5 + py * 5, 2.6, 0, Math.PI * 2);
  ctx.arc(guard.x + ex * 5 - px * 5, guard.y + ey * 5 - py * 5, 2.6, 0, Math.PI * 2);
  ctx.fill();
  if (state !== 'calm') {
    ctx.fillStyle = state === 'alert' ? '#ff3c28' : '#ffb03a';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(state === 'alert' ? '!' : '?', guard.x, guard.y - 20);
  }
}

function drawPlayer(ctx, player, hidden, time) {
  const bob = Math.sin(time * 8) * 1;
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  if (hidden) ctx.globalAlpha = 0.55;
  ctx.shadowColor = '#7fa0ff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(13, 10);
  ctx.lineTo(-13, 10);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(0, -4, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c2436';
  ctx.beginPath();
  ctx.arc(3, -5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (hidden) {
    ctx.fillStyle = 'rgba(140, 180, 255, 0.85)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', player.x, player.y - 24);
  }
}

export function render(ctx, game, time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, game.world);
  drawExit(ctx, game.world, time);
  drawShards(ctx, game.world, time);
  drawCover(ctx, game.world);
  for (const guard of game.guards) {
    drawVisionCone(ctx, game.world, guard, game.detection);
  }
  for (const guard of game.guards) {
    drawGuard(ctx, guard, game.detection, time);
  }
  const hidden = game.playerHidden;
  drawPlayer(ctx, game.player, hidden, time);
  // Click-to-move marker.
  if (game.clickTarget) {
    ctx.strokeStyle = 'rgba(232, 230, 223, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(game.clickTarget.x, game.clickTarget.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(game.clickTarget.x - 12, game.clickTarget.y);
    ctx.lineTo(game.clickTarget.x + 12, game.clickTarget.y);
    ctx.moveTo(game.clickTarget.x, game.clickTarget.y - 12);
    ctx.lineTo(game.clickTarget.x, game.clickTarget.y + 12);
    ctx.stroke();
  }
  // Red edge vignette while the detection meter is high.
  if (game.detection > DETECTION_VIGNETTE_AT) {
    const a = ((game.detection - DETECTION_VIGNETTE_AT) / (100 - DETECTION_VIGNETTE_AT)) * 0.35;
    const grad = ctx.createRadialGradient(
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35,
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75,
    );
    grad.addColorStop(0, 'rgba(255, 40, 20, 0)');
    grad.addColorStop(1, `rgba(255, 40, 20, ${a})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

const DETECTION_VIGNETTE_AT = 45;
