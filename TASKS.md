# Add a tic-tac-toe game

Build a browser tic-tac-toe game with neon visual effects and synthesized Web Audio sounds, deployable as static files. The game is written in TypeScript under `src/` and bundled with esbuild, which is the only new dependency. `npm run build` outputs a hand-written `index.html` (CSS inlined in a `<style>` block, loading the script via `<script type="module">`) next to a minified `game.js` in `dist/`, with no source maps or separate CSS file. `npm run dev` uses esbuild's built-in serve/watch to serve `dist/` locally. Game logic lives in a pure, unit-tested module (`node:test`). One end-to-end test drives the built page through the existing chrome-devtools MCP test utilities. The human player is always X, and the starting player alternates each round in every mode. No effects or audio libraries.

## [ ] 1. Build pipeline and playable two-player board

**Blocked by:** None

**Delivers:** Running `npm run build` produces `dist/index.html` and `dist/game.js`. Opening the HTML shows a 3×3 board where two players on one device alternately click cells to place X and O until someone wins or the board is full, and the result is shown.

- esbuild is added as a pinned dev dependency, `build` bundles and minifies the game into `dist/game.js` and copies the static HTML next to it, and `dev` serves `dist/` with watch
- Win and draw detection live in a pure game-logic module with unit tests covering every winning line, a draw, and an in-progress board
- Occupied cells and cells on a finished board cannot be played
- An end-to-end test builds the game itself (it must not rely on a prior `npm run build`, since `verify` runs tests before the build), loads the page in the browser via the chrome-devtools MCP, plays a game to a win, and asserts the result is shown and there are no console errors
- `npm run verify` passes (format, types, lint incl. knip, licenses, tests, build)

## [ ] 2. Turns, scoreboard, restart and keyboard play

**Blocked by:** 1

**Delivers:** Players see whose turn it is, a session scoreboard of X wins, O wins and draws, and a restart button that starts a new round. The starting player alternates each round. The board can be played fully from the keyboard.

- The turn indicator always reflects the player to move, and shows the result once a round ends
- The scoreboard updates after every finished round and resets only on page reload (not persisted)
- Restart clears the board, keeps the scores, and hands the first move to the other player
- Arrow keys move focus between cells, Enter/Space places a mark, and cells have accessible labels

## [ ] 3. Computer opponent with difficulty

**Blocked by:** 2

**Delivers:** Players can switch between two-player mode and playing against the computer, and choose easy or hard difficulty. The human is X. In vs-computer mode the first move alternates between human and computer each round, with the human starting round 1.

- Easy picks a random legal move. Hard plays perfect minimax
- Unit tests show hard takes an immediate win, blocks an immediate loss, and never loses across all human move sequences
- The computer moves automatically after a short delay, and the human cannot place a mark during the computer's turn
- Switching mode or difficulty starts a fresh round

## [ ] 4. Visual effects

**Blocked by:** 2

**Delivers:** The game has a dark neon look: X and O are drawn as animated SVG strokes when placed, hovering an empty cell previews the current player's mark, a glowing line sweeps across the winning three, a confetti/particle burst plays on a win, and the board shakes on a draw.

- All effects are built with plain CSS, SVG and canvas, with no libraries
- Under `prefers-reduced-motion` the shake and particles are disabled or strongly toned down, and stroke animations are near-instant
- Effects never block input for the next round, and restart clears any running effects

## [ ] 5. Web Audio sounds and mute toggle

**Blocked by:** 2

**Delivers:** Every interaction has a sound synthesized live with the Web Audio API (oscillators and gain envelopes, no audio files): distinct tones for placing X and placing O, a soft tick when hovering an empty cell, a rising arpeggio on a win, a descending "womp" on a draw or a loss to the computer, and a click on restart. A mute toggle silences all sounds and is remembered across reloads.

- The `AudioContext` is created/resumed on the first click or keypress, with no start overlay. Sounds requested before that are silently skipped
- The mute state persists in `localStorage`, and the page still works if storage access throws
- No console errors or warnings from audio, including in the end-to-end test
