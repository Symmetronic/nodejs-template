# Add a zombie rail shooter prototype

A short prototype of a Doom-like zombie shooter for smartphones, played in portrait with touch only. The camera moves automatically along a rail (like classic light-gun arcade games) and stops at encounters; the player taps where they want to shoot. It is 3D with a retro pixel look: Three.js renders into a low-resolution render target (about 160×284) that is upscaled with nearest-neighbour filtering, zombies are billboard sprites, and all textures, sprites and the pixel font are generated in code (no image files). Sounds are synthesized with Web Audio, no soundtrack. Dependencies stay minimal: `three` and `esbuild` only. The output must be deployable as a static `index.html` plus one JS bundle from any host or subpath.

Design decisions:

- **Rail and encounters:** the camera glides along a level's rail of waypoints and stops at each encounter's stop point until all of its zombies are dead, then moves on.
- **Shooting:** a tap raycasts from the tap point. A zombie dies after 2 body hits or 1 head hit. Feedback is a muzzle flash and a hit spark; no crosshair.
- **Ammo:** one pool, no reloading. Start with 12, cap 24. Ammo crates stand along the rail; shooting a crate collects it for +6. Tapping with 0 ammo plays a dry click.
- **Health:** 3 hearts. A zombie at melee range attacks every ~1.5 s for 1 damage; each hit flashes the screen red. At 0 hearts: game over screen, tap to restart. Running out of ammo is not a separate loss.
- **Zombies:** one type. They spawn ahead or from side doorways, shamble straight towards the camera with a 2-frame walk cycle, stop at melee range to attack, flinch when hit, show a fall-down frame on death and fade out.
- **Levels:** each level is a plain data module (rail waypoints, corridor geometry as boxes/segments with a texture name, encounters with stop point, zombie spawn positions and delays, ammo crate positions) registered in a level list, so adding a level means adding one data file. Finishing a level advances to the next; after the last one a "LEVEL CLEAR" screen appears, tap to restart. The prototype ships one level of 60–90 s with 3 encounters of about 3, 5 and 7 zombies.
- **Setting:** dim corridors of an abandoned facility, concrete and brick, distance fog, a few flickering lights, a limited colour palette.
- **Layout:** always a portrait aspect filling the phone screen; on wide screens a centred portrait column with black bars (no rotate prompt). The HUD (hearts, ammo) uses a pixel font drawn into the same low-res frame.
- **Screens:** title ("TAP TO START", also unlocks audio), playing, game over, level clear.
- **Test hook:** the game root element mirrors state as `data-screen` (`title`, `playing`, `gameover`, `clear`), `data-ammo` and `data-hearts`.
- **Testing:** game logic (rail progress, encounters, zombie state, ammo, health, level progression) lives in rendering-free modules with `node:test` unit tests through their public interfaces. One browser smoke test drives the built page through the existing chrome-devtools MCP test helper. Because `npm run verify` runs tests before the build, the smoke test must build the page itself.

## [x] 1. Build pipeline and title screen

**Blocked by:** None

**Delivers:** `npm run build` bundles the game with esbuild into `dist/` (`index.html` plus one JS bundle, linked by relative paths), and `npm run dev` serves it with esbuild's dev server reachable from a phone on the LAN. Opening the page shows a full-height portrait canvas (black bars on wide screens) with a pixel-font "TAP TO START" title.

- `esbuild` and `three` are added as exactly pinned dependencies; license and knip checks pass.
- `dist/` works when served from a subpath.
- The canvas is upscaled with crisp, nearest-neighbour pixels.
- The game root element has `data-screen="title"`.
- A browser smoke test builds the page, loads it, asserts `data-screen="title"` and that there are no console errors.

## [x] 2. Retro corridor and rail movement

**Blocked by:** 1

**Delivers:** tapping the title starts level 1: the camera moves smoothly along the rail through the corridor, rendered in low resolution with procedural brick and concrete textures, distance fog and flickering lights, until it reaches the end of the rail.

- The level data format and level list exist, with level 1 as the first entry.
- Three.js renders into a low-resolution render target, upscaled with nearest-neighbour filtering.
- All textures are generated in code.
- Rail progress logic has unit tests (position and direction along waypoints, reaching the end).
- `data-screen` becomes `playing` after the start tap; the smoke test asserts this.

## [x] 3. Zombies, encounters and dying

**Blocked by:** 2

**Delivers:** the camera stops at each encounter, zombies spawn per the level data, shamble towards the player with a 2-frame walk cycle and attack at melee range. Each hit costs a heart and flashes the screen red; at 0 hearts the game over screen appears and a tap restarts. Encounters cannot be cleared yet.

- Zombie sprites are procedural pixel-art billboards.
- The HUD shows hearts in the low-res frame; `data-hearts` mirrors them.
- `data-screen` becomes `gameover` at 0 hearts and returns to a fresh level on tap.
- Encounter, zombie and health logic have unit tests.

## [ ] 4. Shooting, ammo and level clear

**Blocked by:** 3

**Delivers:** tapping shoots at the tap point with a muzzle flash and hit spark. Zombies take 2 body hits or 1 headshot, flinch when hit, fall and fade out when killed; clearing an encounter sends the camera onward. Ammo is shown in the HUD, tapping with 0 ammo does nothing but a dry click, and shooting an ammo crate collects +6 (cap 24). Finishing a level advances to the next level in the list, or shows "LEVEL CLEAR" after the last one, tap to restart.

- Level 1 has 3 encounters (about 3, 5 and 7 zombies) and enough ammo crates to finish it, taking 60–90 s.
- `data-ammo` mirrors ammo; `data-screen` becomes `clear` after the last level.
- Shooting, ammo, crate and level progression logic have unit tests.
- The smoke test asserts that a tap while playing decreases `data-ammo` by 1.

## [ ] 5. Synthesized sounds

**Blocked by:** 4

**Delivers:** the game plays simple Web Audio sounds, synthesized from oscillators and noise: gunshot, dry click, zombie hit, zombie death, occasional zombie groan, ammo pickup, player hurt, and short level clear and game over jingles. Audio is unlocked by the start tap.

- No audio files and no soundtrack.
- The game still runs without errors when audio is unavailable.
- The smoke test still passes with no console errors.
