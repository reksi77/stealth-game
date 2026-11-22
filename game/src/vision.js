// Shadow Vault — seeing and being seen.
// One job: decide whether a guard can see the player, and how fast the
// detection meter moves when it can.

import {
  GUARD_VISION_RANGE,
  GUARD_VISION_HALF_ANGLE,
  DETECTION_RISE_CLOSE,
  DETECTION_RISE_FAR,
  DETECTION_FALL,
  HIDDEN_RISE_MULTIPLIER,
} from './config.js';
import { hasLineOfSight, isHidingTile, tileAtPixel } from './world.js';

/** Angle difference wrapped to [-PI, PI]. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Is the player inside this guard's vision cone and line of sight? */
export function canGuardSeePlayer(world, guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_VISION_RANGE) return { seen: false, dist, closeness: 0 };
  const angleToPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(angleToPlayer, guard.angle)) > GUARD_VISION_HALF_ANGLE) {
    return { seen: false, dist, closeness: 0 };
  }
  if (!hasLineOfSight(world, guard.x, guard.y, player.x, player.y)) {
    return { seen: false, dist, closeness: 0 };
  }
  const closeness = 1 - dist / GUARD_VISION_RANGE;
  return { seen: true, dist, closeness };
}

/** Is the player standing in cover that hides them (bush or shadow zone)? */
export function playerIsHidden(world, player) {
  return isHidingTile(tileAtPixel(world, player.x, player.y));
}

/**
 * Advance the shared detection meter for one frame.
 * Returns the new meter value (0..100).
 */
export function updateDetection(world, guards, player, meter, dt) {
  let worst = null;
  for (const guard of guards) {
    const sight = canGuardSeePlayer(world, guard, player);
    if (sight.seen && (!worst || sight.closeness > worst.closeness)) worst = sight;
  }
  if (worst) {
    const hidden = playerIsHidden(world, player);
    const rise =
      (DETECTION_RISE_FAR + (DETECTION_RISE_CLOSE - DETECTION_RISE_FAR) * worst.closeness) *
      (hidden ? HIDDEN_RISE_MULTIPLIER : 1);
    meter = Math.min(100, meter + rise * dt);
  } else {
    meter = Math.max(0, meter - DETECTION_FALL * dt);
  }
  return meter;
}
