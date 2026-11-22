// Shadow Vault — the level as a grid.
// One job: parse a level's text map, answer "is this tile solid / hiding?",
// move circles without passing through walls, and test line of sight.

import { TILE } from './config.js';

export function parseLevel(def) {
  const rows = def.map.length;
  const cols = def.map[0].length;
  const tiles = [];
  let playerStart = null;
  let exit = null;
  const shards = [];
  const guardSpawns = [];
  for (let y = 0; y < rows; y++) {
    tiles[y] = [];
    for (let x = 0; x < cols; x++) {
      const ch = def.map[y][x];
      let kind = 'floor';
      if (ch === '#') kind = 'wall';
      else if (ch === ',') kind = 'shadow';
      else if (ch === 'B') kind = 'bush';
      else if (ch === 'C') kind = 'crate';
      tiles[y][x] = kind;
      const px = x * TILE + TILE / 2;
      const py = y * TILE + TILE / 2;
      if (ch === 'P') playerStart = { x: px, y: py };
      if (ch === 'E') exit = { x: px, y: py, tileX: x, tileY: y };
      if (ch === 'S') shards.push({ x: px, y: py, taken: false });
      if (ch === 'G') guardSpawns.push({ x: px, y: py });
    }
  }
  return { def, rows, cols, tiles, playerStart, exit, shards, guardSpawns };
}

export function tileAt(world, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= world.cols || ty >= world.rows) return 'wall';
  return world.tiles[ty][tx];
}

export function isSolidTile(kind) {
  return kind === 'wall' || kind === 'crate';
}

export function isHidingTile(kind) {
  return kind === 'bush' || kind === 'shadow';
}

export function tileAtPixel(world, px, py) {
  return tileAt(world, Math.floor(px / TILE), Math.floor(py / TILE));
}

export function isSolidAtPixel(world, px, py) {
  return isSolidTile(tileAtPixel(world, px, py));
}

/** Move a circle by (dx, dy), sliding along walls. Returns the new position. */
export function moveCircle(world, x, y, radius, dx, dy) {
  let nx = x + dx;
  if (collides(world, nx, y, radius)) nx = x;
  let ny = y + dy;
  if (collides(world, x, ny, radius)) ny = y;
  // Corner case: both axes blocked separately but the diagonal is free.
  if (nx === x && ny === y && (dx !== 0 || dy !== 0)) {
    if (!collides(world, nx, ny, radius)) {
      nx = x + dx;
      ny = y + dy;
    }
  }
  return { x: nx, y: ny };
}

export function collides(world, x, y, radius) {
  const minTx = Math.floor((x - radius) / TILE);
  const maxTx = Math.floor((x + radius) / TILE);
  const minTy = Math.floor((y - radius) / TILE);
  const maxTy = Math.floor((y + radius) / TILE);
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (!isSolidTile(tileAt(world, tx, ty))) continue;
      const cx = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
      const cy = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
      const ddx = x - cx;
      const ddy = y - cy;
      if (ddx * ddx + ddy * ddy < radius * radius) return true;
    }
  }
  return false;
}

/**
 * Line of sight between two points: true when no wall or crate blocks the
 * segment. Sampled finely enough that a 40px tile can never be jumped over.
 */
export function hasLineOfSight(world, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isSolidAtPixel(world, x0 + dx * t, y0 + dy * t)) return false;
  }
  return true;
}

/** Distance from (x, y) along `angle` until a solid tile, capped at maxDist. */
export function castRay(world, x, y, angle, maxDist) {
  const step = 6;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let d = step; d <= maxDist; d += step) {
    if (isSolidAtPixel(world, x + cos * d, y + sin * d)) return d;
  }
  return maxDist;
}

/** Flood fill from the player start over walkable tiles; used by tests. */
export function reachableTiles(world) {
  const seen = new Set();
  const startTx = Math.floor(world.playerStart.x / TILE);
  const startTy = Math.floor(world.playerStart.y / TILE);
  const queue = [[startTx, startTy]];
  seen.add(startTx + ',' + startTy);
  while (queue.length > 0) {
    const [tx, ty] = queue.pop();
    const neighbours = [[tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1]];
    for (const [nx, ny] of neighbours) {
      if (nx < 0 || ny < 0 || nx >= world.cols || ny >= world.rows) continue;
      if (seen.has(nx + ',' + ny)) continue;
      if (isSolidTile(world.tiles[ny][nx])) continue;
      seen.add(nx + ',' + ny);
      queue.push([nx, ny]);
    }
  }
  return seen;
}
