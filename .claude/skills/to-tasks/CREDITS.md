# Credits

`to-tasks` is adapted from [Matt Pocock](https://github.com/mattpocock)'s [`to-tickets`](https://github.com/mattpocock/skills/blob/5863806dd4e15c63174bee4e7515a4256792ecfa/skills/engineering/to-tickets/SKILL.md) skill (commit `5863806dd4e15c63174bee4e7515a4256792ecfa`), licensed under MIT (see [LICENSE](LICENSE)).

It keeps the vertical-slice rules, prefactoring first, expand–contract for wide refactors, blocking edges and the user quiz. It drops issue trackers and per-ticket files in favour of a single `TASKS.md`, and requires every task to be exactly one commit after which `npm run verify` passes.
