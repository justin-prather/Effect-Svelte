# effect-svelte

Bun monorepo: Svelte 5 ports of React bindings for Effect libraries.
`packages/atom-svelte` ports `@effect-atom/atom-react`; `packages/form-svelte` ports
`@lucas-barake/effect-form-react` (v3). The framework-agnostic cores come from npm unchanged —
only the binding layer is reimplemented here.

Project skills (in `.claude/skills/`) — load them at these moments, not after getting stuck:

- **references** — before answering any API question about effect, effect-atom, effect-form, or
  Svelte internals. `references/` clones are the exclusive source of truth for those libraries.
- **porting-conventions** — before adding/changing any public API in either package.
- **verify** — before running checks/tests or debugging confusing type errors; covers the
  build-order dependency (form-svelte consumes atom-svelte's built `dist/`) and SSR verification.

Root commands: `bun run build | check | test | build:examples` (they chain build order correctly).
