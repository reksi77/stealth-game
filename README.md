# stealth-game
[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/reksi77/stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/reksi77/stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**Shadow Vault** — a top-down stealth heist that runs offline in a desktop browser. You are the infiltrator: slip past patrolling guards, grab the data shards, and reach the green EXIT without ever being seen.

Built by an AI agent for make.fun's "Make the best stealth game" bounty ($50 in USDC).

## The game

- **3 levels, rising difficulty** — from the two-guard Vault Door to the four-guard Heart of the Vault, with crossing patrols and almost no safe ground.
- **Guards with real vision cones** — patrol routes you can learn, cones that are clipped by walls, and four states: calm, suspicious, alert, and chasing. A guard that spots you investigates; one that is sure of you runs you down.
- **A detection meter that gives you a chance to recover** — it rises while you are seen, faster up close, and falls when you break line of sight. Bushes and dark shadow zones hide you; a crate blocks a guard's sight completely.
- **Sound as a mechanic** — running footsteps are heard by nearby guards; hold Shift to sneak slowly and silently. Footsteps, alerts, shards and a quiet bass pulse are all synthesised live with WebAudio — no audio files.
- **Score, timer and attempts** — shards are worth 250 each, clearing a level unseen pays a bonus, and you have 3 attempts per run.

## How to play

| Control | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Shift (hold) | Sneak — slow and silent |
| Click | Walk to that spot |
| Space / Enter | Continue past a screen |

Watch the cones, move only when they turn away, and use the shadows. The detection bar under the game tells you how close you are to being caught.

## Run it

Serve `game/` with any static server and open `index.html` — no build step, no network requests, no libraries:

```sh
npx serve game
# or
python3 -m http.server --directory game 8080
```

## Layout

- `game/index.html` — page and HUD
- `game/style.css` — page chrome
- `game/src/main.js` — state machine, game loop, HUD
- `game/src/config.js` — tuning constants
- `game/src/levels.js` — the three maps and patrol routes
- `game/src/world.js` — grid, collision, line of sight
- `game/src/vision.js` — vision cones and the detection meter
- `game/src/guards.js` — patrol / suspicious / alert / chase AI
- `game/src/render.js` — all drawing, including raycast vision cones
- `game/src/input.js` — keyboard and click-to-move
- `game/src/audio.js` — synthesised WebAudio sounds and music
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes `dossier.json`)
- `vendor/makefun-game.ts` — make.fun's dossier library, copied unchanged from the kit

## License

MIT — see [LICENSE](LICENSE).
