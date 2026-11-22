// Shadow Vault — shared tuning constants.
// One job: every number the rest of the game balances on lives here.

export const TILE = 40;
export const VIEW_W = 960;
export const VIEW_H = 640;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 150; // px per second, normal stride
export const PLAYER_SNEAK_SPEED = 78; // px per second, Shift held: slow and silent
export const PLAYER_NOISE_RADIUS = 150; // guards hear a running step inside this
export const PLAYER_SNEAK_NOISE_RADIUS = 0;

export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_SUSPICIOUS_SPEED = 95;
export const GUARD_CHASE_SPEED = 132;
export const GUARD_VISION_RANGE = 235;
export const GUARD_VISION_HALF_ANGLE = 0.52; // ~30 degrees each side
export const GUARD_HEARING_RADIUS = 170;

export const DETECTION_RISE_CLOSE = 80; // per second, player near and in the open
export const DETECTION_RISE_FAR = 34; // per second, player at the edge of a cone
export const DETECTION_FALL = 26; // per second, unseen and quiet
export const DETECTION_SUSPICIOUS_AT = 30;
export const DETECTION_ALERT_AT = 70;
export const DETECTION_CAUGHT_AT = 100;
export const HIDDEN_RISE_MULTIPLIER = 0.12; // crouched in bush / shadow: barely seen

export const SHARD_SCORE = 250;
export const LEVEL_CLEAR_BONUS = 1000;
export const TIME_BONUS_PER_SECOND = 10;
export const MAX_ATTEMPTS = 3;

export const COLORS = {
  floor: '#2b2f3a',
  floorAlt: '#262a34',
  wall: '#171a21',
  wallTop: '#3a4152',
  shadowZone: '#14161d',
  bush: '#1e4d2e',
  bushLeaf: '#2f7a44',
  crate: '#6b4a26',
  crateEdge: '#8a6234',
  exit: '#37e08b',
  exitGlow: 'rgba(55, 224, 139, 0.25)',
  shard: '#ffd94a',
  player: '#e8e6df',
  playerCloak: '#4a5d8a',
  guard: '#ff5a4e',
  guardCalm: '#ff8a5c',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneSuspicious: 'rgba(255, 150, 40, 0.30)',
  coneAlert: 'rgba(255, 60, 40, 0.38)',
  hudText: '#e8e6df',
  hudDim: '#9aa3b2',
};
