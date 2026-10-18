# effect-svelte

Bun monorepo: Svelte 5 ports of React bindings for Effect libraries.
`packages/atom-svelte` ports `@effect/atom-react`; `packages/form-svelte` ports
`@lucas-barake/effect-form-react` (v1, Effect v4). The framework-agnostic cores come from npm unchanged —
only the binding layer is reimplemented here.

Project skills (in `.claude/skills/`) — load them at these moments, not after getting stuck:

- Before API changes, read the upstream source in the gitignored `references/` clones.
  Clone `Effect-TS/effect` and `lucas-barake/effect-form` there if absent.
  Atom React bindings live in `references/effect/packages/atom/react/src/`.
- **porting-conventions** — before adding/changing any public API in either package.
- **verify** — before running checks/tests or debugging confusing type errors; covers the
  build-order dependency (form-svelte consumes atom-svelte's built `dist/`) and SSR verification.
- **install-anti-slop** — before updates to the vendored Oxlint rules in `tools/oxlint/anti-slop/`.

Root commands: `bun run build | check | test | build:examples` (they chain build order correctly).

Code quality: `bun run lint` and `bun run format:check`.
For cleanup, run `bun run lint:fix`, then `bun run format`, then both checks.
Preserve the no-semicolon, double-quote style in `.oxfmtrc.json`.
