// Shadow Vault — the game itself.
// One job: own the state machine (title / playing / caught / level-clear /
// win), run the loop, move the player, and keep the HUD honest. The rules
// live in world.js, vision.js and guards.js; the pixels in render.js.
//
// Screenshot staging (used only to take the entry's screenshots of real
// renders): ?shot=cover|patrol|alert|win&level=1..3 sets the game up in that
// moment before the first frame.

import { LEVELS } from './levels.js';
import { parseLevel, moveCircle } from './world.js';
import { updateDetection, playerIsHidden } from './vision.js';
import { createGuard, updateGuard } from './guards.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { render } from './render.js';
import {
  VIEW_W,
  VIEW_H,
  PLAYER_RADIUS,
  PLAYER_WALK_SPEED,
  PLAYER_SNEAK_SPEED,
  PLAYER_NOISE_RADIUS,
  SHARD_SCORE,
  LEVEL_CLEAR_BONUS,
  TIME_BONUS_PER_SECOND,
  MAX_ATTEMPTS,
  DETECTION_SUSPICIOUS_AT,
  DETECTION_ALERT_AT,
  DETECTION_CAUGHT_AT,
} from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hud = {
  level: document.getElementById('hud-level'),
  shards: document.getElementById('hud-shards'),
  score: document.getElementById('hud-score'),
  attempts: document.getElementById('hud-attempts'),
  timer: document.getElementById('hud-timer'),
  detectionFill: document.getElementById('detection-fill'),
  detectionLabel: document.getElementById('detection-label'),
};

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayButton = document.getElementById('overlay-button');

const input = createInput(canvas);
const audio = createAudio();

const game = {
  screen: 'title', // title | playing | caught | levelclear | win
  levelIndex: 0,
  world: null,
  guards: [],
  player: { x: 0, y: 0 },
  clickTarget: null,
  detection: 0,
  score: 0,
  shardsTaken: 0,
  attemptsLeft: MAX_ATTEMPTS,
  levelTime: 0,
  totalTime: 0,
  playerHidden: false,
  noiseAt: null,
  noiseTimer: 0,
  wasSuspicious: false,
  wasAlert: false,
};

function loadLevel(index) {
  const def = LEVELS[index];
  game.levelIndex = index;
  game.world = parseLevel(def);
  game.guards = def.guards.map((g, i) => createGuard(g, i));
  game.player = { x: game.world.playerStart.x, y: game.world.playerStart.y };
  game.clickTarget = null;
  game.detection = 0;
  game.shardsTaken = 0;
  game.levelTime = 0;
  game.playerHidden = false;
  game.noiseAt = null;
  game.wasSuspicious = false;
  game.wasAlert = false;
  for (const s of game.world.shards) s.taken = false;
}

function showOverlay(title, text, buttonLabel, onButton) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayButton.textContent = buttonLabel;
  overlay.classList.remove('hidden');
  overlayButton.onclick = () => {
    audio.unlock();
    audio.click();
    onButton();
  };
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function showTitle() {
  game.screen = 'title';
  showOverlay(
    'SHADOW VAULT',
    'A top-down stealth heist. Slip past the guards, grab the data shards, and reach the green EXIT unseen. WASD or arrows to move, Shift to sneak, click to walk there. Bushes and dark shadow hide you — running feet are heard.',
    'Start the heist',
    () => {
      hideOverlay();
      loadLevel(0);
      game.score = 0;
      game.attemptsLeft = MAX_ATTEMPTS;
      game.totalTime = 0;
      game.screen = 'playing';
    },
  );
}

function showCaught() {
  game.screen = 'caught';
  audio.caught();
  game.attemptsLeft -= 1;
  const text =
    game.attemptsLeft > 0
      ? `Spotted! The guards caught you in ${LEVELS[game.levelIndex].name}. ${game.attemptsLeft} ${game.attemptsLeft === 1 ? 'attempt' : 'attempts'} left — watch the cones, use the shadows.`
      : 'Spotted, and the crew is out of attempts. The vault keeps its secrets… this time.';
  showOverlay('CAUGHT!', text, game.attemptsLeft > 0 ? 'Try again' : 'Back to title', () => {
    hideOverlay();
    if (game.attemptsLeft > 0) {
      loadLevel(game.levelIndex);
      game.screen = 'playing';
    } else {
      showTitle();
    }
  });
}

function showLevelClear() {
  game.screen = 'levelclear';
  audio.levelClear();
  const def = LEVELS[game.levelIndex];
  const timeBonus = Math.max(
    0,
    Math.round((def.parTime - game.levelTime) * TIME_BONUS_PER_SECOND),
  );
  const bonus = LEVEL_CLEAR_BONUS + timeBonus;
  game.score += bonus;
  const last = game.levelIndex === LEVELS.length - 1;
  showOverlay(
    last ? 'THE VAULT IS YOURS' : 'CLEAN GETAWAY',
    last
      ? `You cleared ${def.name} unseen — ${game.shardsTaken} shards, ${formatTime(game.levelTime)}. Level bonus +${bonus}. The whole vault is open to you now.`
      : `You cleared ${def.name} unseen — ${game.shardsTaken} shards, ${formatTime(game.levelTime)}. Level bonus +${bonus}.`,
    last ? 'See the score' : 'Next level',
    () => {
      hideOverlay();
      if (last) {
        game.screen = 'win';
        showWin();
      } else {
        loadLevel(game.levelIndex + 1);
        game.screen = 'playing';
      }
    },
  );
}

function showWin() {
  game.screen = 'win';
  const minutes = Math.floor(game.totalTime / 60);
  const seconds = Math.floor(game.totalTime % 60);
  showOverlay(
    'GHOST — NEVER SEEN',
    `All three levels cleared unseen. Final score ${game.score} in ${minutes}:${String(seconds).padStart(2, '0')}. Not a single guard ever laid a hand on you.`,
    'Play again',
    () => {
      hideOverlay();
      game.score = 0;
      game.attemptsLeft = MAX_ATTEMPTS;
      game.totalTime = 0;
      loadLevel(0);
      game.screen = 'playing';
    },
  );
}

function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function detectionWord() {
  if (game.detection >= DETECTION_CAUGHT_AT) return 'CAUGHT';
  if (game.detection >= DETECTION_ALERT_AT) return 'ALERT — RUN!';
  if (game.detection >= DETECTION_SUSPICIOUS_AT) return 'SUSPICIOUS';
  if (game.detection > 4) return 'GLIMPSED';
  return game.playerHidden ? 'HIDDEN' : 'UNSEEN';
}

function updateHud() {
  const def = LEVELS[game.levelIndex];
  hud.level.textContent = def.name;
  hud.shards.textContent = `◆ ${game.shardsTaken}/${game.world.shards.length}`;
  hud.score.textContent = `Score ${game.score}`;
  hud.attempts.textContent = `Attempts ${'●'.repeat(game.attemptsLeft)}${'○'.repeat(MAX_ATTEMPTS - game.attemptsLeft)}`;
  hud.timer.textContent = formatTime(game.levelTime);
  hud.detectionFill.style.width = `${game.detection}%`;
  hud.detectionFill.style.background =
    game.detection >= DETECTION_ALERT_AT
      ? '#ff3c28'
      : game.detection >= DETECTION_SUSPICIOUS_AT
        ? '#ffb03a'
        : '#37e08b';
  hud.detectionLabel.textContent = detectionWord();
}

function updatePlayer(dt) {
  const sneaking = input.sneaking();
  const speed = sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
  let dir = input.keyVector();
  const clicked = input.takeClickTarget();
  if (clicked) game.clickTarget = clicked;

  if (dir) {
    game.clickTarget = null;
  } else if (game.clickTarget) {
    const dx = game.clickTarget.x - game.player.x;
    const dy = game.clickTarget.y - game.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      game.clickTarget = null;
    } else {
      dir = { x: dx / dist, y: dy / dist };
    }
  }
  if (!dir) return;

  const moved = moveCircle(
    game.world,
    game.player.x,
    game.player.y,
    PLAYER_RADIUS,
    dir.x * speed * dt,
    dir.y * speed * dt,
  );
  const actuallyMoved =
    Math.abs(moved.x - game.player.x) > 0.01 || Math.abs(moved.y - game.player.y) > 0.01;
  game.player.x = moved.x;
  game.player.y = moved.y;

  if (actuallyMoved) {
    audio.step(sneaking);
    // Running steps are heard: guards nearby turn to look.
    game.noiseTimer -= dt;
    if (!sneaking && game.noiseTimer <= 0) {
      game.noiseTimer = 0.45;
      game.noiseAt = { x: game.player.x, y: game.player.y, radius: PLAYER_NOISE_RADIUS };
    }
  }
}

function collectShards() {
  for (const shard of game.world.shards) {
    if (shard.taken) continue;
    if (Math.hypot(shard.x - game.player.x, shard.y - game.player.y) < 26) {
      shard.taken = true;
      game.shardsTaken += 1;
      game.score += SHARD_SCORE;
      audio.shard();
    }
  }
}

function update(dt) {
  if (game.screen !== 'playing') return;
  game.levelTime += dt;
  game.totalTime += dt;
  game.playerHidden = playerIsHidden(game.world, game.player);

  updatePlayer(dt);
  collectShards();

  game.detection = updateDetection(game.world, game.guards, game.player, game.detection, dt);
  if (game.detection >= DETECTION_SUSPICIOUS_AT && !game.wasSuspicious) {
    audio.spotted();
  }
  game.wasSuspicious = game.detection >= DETECTION_SUSPICIOUS_AT;
  game.wasAlert = game.detection >= DETECTION_ALERT_AT;

  const noise = game.noiseAt;
  game.noiseAt = null;
  for (const guard of game.guards) {
    const result = updateGuard(game.world, guard, game.player, game.detection, dt, noise);
    if (result === 'caught') {
      game.detection = DETECTION_CAUGHT_AT;
      updateHud();
      showCaught();
      return;
    }
  }

  if (game.detection >= DETECTION_CAUGHT_AT) {
    showCaught();
    return;
  }

  const exit = game.world.exit;
  if (Math.hypot(exit.x - game.player.x, exit.y - game.player.y) < 26) {
    showLevelClear();
    return;
  }

  audio.musicTick(dt);
  updateHud();
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  if (game.screen === 'title' || game.screen === 'playing') {
    render(ctx, game, now / 1000);
  }
  requestAnimationFrame(loop);
}

/** Stage a moment for a screenshot: real game state, no edits. */
function applyShotParam() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const level = Math.max(1, Math.min(3, parseInt(params.get('level') || '1', 10))) - 1;
  if (!shot) return false;
  loadLevel(level);
  game.screen = 'playing';
  hideOverlay();
  if (shot === 'patrol') {
    // Guards mid-patrol on level 2: just let them walk.
    return true;
  }
  if (shot === 'cover') {
    // Player tucked beside a crate on level 1, a guard's cone sweeping past.
    game.player.x = 4 * 40 + 20;
    game.player.y = 4 * 40 + 20;
    game.guards[0].x = 12 * 40 + 20;
    game.guards[0].y = 6 * 40 + 20;
    game.guards[0].angle = Math.PI;
    return true;
  }
  if (shot === 'alert') {
    // Near-miss: detection high but not full, a guard closing in.
    // Kept below 100 so the moment stays a near miss, not a caught screen.
    game.detection = 68;
    game.player.x = 10 * 40 + 20;
    game.player.y = 8 * 40 + 20;
    game.guards[0].x = 15 * 40 + 20;
    game.guards[0].y = 8 * 40 + 20;
    game.guards[0].angle = Math.PI;
    game.guards[0].state = 'alert';
    return true;
  }
  if (shot === 'win') {
    game.score = 4850;
    game.totalTime = 312;
    showWin();
    return true;
  }
  return false;
}

// Boot: title screen behind the overlay, unless a shot is staged.
loadLevel(0);
game.screen = 'title';
if (!applyShotParam()) {
  showTitle();
}
updateHud();
requestAnimationFrame(loop);

// Test hooks: the play-test drives the game through these.
window.__shadowVault = {
  game,
  input,
  loadLevel,
  startPlaying() {
    hideOverlay();
    loadLevel(0);
    game.score = 0;
    game.attemptsLeft = MAX_ATTEMPTS;
    game.totalTime = 0;
    game.screen = 'playing';
  },
};
