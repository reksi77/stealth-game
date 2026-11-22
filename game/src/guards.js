// Shadow Vault — the guards.
// One job: patrol, get suspicious, investigate, chase, and give up.
// States: 'calm' (walking the patrol), 'suspicious' (heard or glimpsed
// something — walks to look), 'alert' (chasing the player), 'returning'
// (lost the player, walking back to the patrol).

import {
  GUARD_PATROL_SPEED,
  GUARD_SUSPICIOUS_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_RADIUS,
  GUARD_HEARING_RADIUS,
  DETECTION_SUSPICIOUS_AT,
  DETECTION_ALERT_AT,
  TILE,
} from './config.js';
import { moveCircle } from './world.js';
import { angleDiff, canGuardSeePlayer } from './vision.js';

export function createGuard(def, spawnIndex) {
  const start = def.waypoints[0];
  return {
    x: start[0] * TILE + TILE / 2,
    y: start[1] * TILE + TILE / 2,
    angle: 0,
    state: 'calm',
    waypointIndex: 1 % def.waypoints.length,
    pauseTimer: 0,
    waypoints: def.waypoints.map(([tx, ty]) => ({
      x: tx * TILE + TILE / 2,
      y: ty * TILE + TILE / 2,
    })),
    pause: def.pause,
    investigateX: null,
    investigateY: null,
    loseTimer: 0,
    id: spawnIndex,
  };
}

function turnTowards(guard, targetAngle, dt) {
  const turnRate = guard.state === 'alert' ? 7 : 4;
  const diff = angleDiff(targetAngle, guard.angle);
  const step = Math.max(-turnRate * dt, Math.min(turnRate * dt, diff));
  guard.angle += step;
}

function moveTowards(guard, world, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  const moved = moveCircle(world, guard.x, guard.y, GUARD_RADIUS, nx - guard.x, ny - guard.y);
  guard.x = moved.x;
  guard.y = moved.y;
  turnTowards(guard, Math.atan2(dy, dx), dt);
  return dist <= step + 1;
}

export function updateGuard(world, guard, player, detection, dt, hearNoiseAt) {
  const sight = canGuardSeePlayer(world, guard, player);
  const heard =
    hearNoiseAt &&
    Math.hypot(hearNoiseAt.x - guard.x, hearNoiseAt.y - guard.y) < GUARD_HEARING_RADIUS;

  if (guard.state === 'calm') {
    if (detection >= DETECTION_ALERT_AT && sight.seen) {
      guard.state = 'alert';
      guard.loseTimer = 0;
    } else if (detection >= DETECTION_SUSPICIOUS_AT && sight.seen) {
      guard.state = 'suspicious';
      guard.investigateX = player.x;
      guard.investigateY = player.y;
    } else if (heard) {
      guard.state = 'suspicious';
      guard.investigateX = hearNoiseAt.x;
      guard.investigateY = hearNoiseAt.y;
    } else {
      patrolStep(world, guard, dt);
    }
  }

  if (guard.state === 'suspicious') {
    if (detection >= DETECTION_ALERT_AT && sight.seen) {
      guard.state = 'alert';
      guard.loseTimer = 0;
    } else {
      const arrived = moveTowards(
        guard, world, guard.investigateX, guard.investigateY, GUARD_SUSPICIOUS_SPEED, dt,
      );
      if (arrived) {
        guard.pauseTimer += dt;
        // Look around for a moment, then walk back to the patrol.
        guard.angle += dt * 1.8;
        if (guard.pauseTimer > 1.6) {
          guard.pauseTimer = 0;
          guard.state = 'returning';
        }
      }
    }
  }

  if (guard.state === 'alert') {
    if (sight.seen) {
      guard.loseTimer = 0;
      moveTowards(guard, world, player.x, player.y, GUARD_CHASE_SPEED, dt);
    } else {
      guard.loseTimer += dt;
      if (guard.loseTimer > 2.5 || detection < DETECTION_SUSPICIOUS_AT) {
        guard.state = 'returning';
        guard.loseTimer = 0;
      } else {
        // Keep pushing toward where the player was last seen.
        moveTowards(guard, world, player.x, player.y, GUARD_SUSPICIOUS_SPEED, dt);
      }
    }
    // A chasing guard that touches the player catches them.
    if (Math.hypot(player.x - guard.x, player.y - guard.y) < GUARD_RADIUS + 14) {
      return 'caught';
    }
  }

  if (guard.state === 'returning') {
    const target = guard.waypoints[guard.waypointIndex];
    const arrived = moveTowards(guard, world, target.x, target.y, GUARD_PATROL_SPEED, dt);
    if (arrived) {
      guard.state = 'calm';
      guard.pauseTimer = 0;
    }
  }

  return null;
}

function patrolStep(world, guard, dt) {
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  const arrived = moveTowards(guard, world, target.x, target.y, GUARD_PATROL_SPEED, dt);
  if (arrived) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseTimer = guard.pause;
  }
}

/** The guard's current alert colour, for the cone and the body. */
export function guardState(guard, detection) {
  if (guard.state === 'alert' || detection >= DETECTION_ALERT_AT) return 'alert';
  if (guard.state !== 'calm' || detection >= DETECTION_SUSPICIOUS_AT) return 'suspicious';
  return 'calm';
}
