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

Root commands: `bun run build | check | test | build:examples | test:examples` (they chain build order correctly).

Code quality: `bun run lint` uses Oxlint. `bun run format:check` uses Oxfmt.
For cleanup, run `bun run lint:fix`, then `bun run format`, then both checks.
Preserve the no-semicolon, double-quote style in `.oxfmtrc.json`.

## Analysis and verification

Use Fallow for unused code, dependency, duplication, and complexity analysis.
Run `bun run analyze` from this repository to analyze both packages and the example apps.
Use `bun run analyze dead-code`, `bun run analyze health`, or `bun run analyze dupes` for individual analyses.
The local Fallow dependency and `.fallowrc.json` make analysis independent of a parent workspace.
The configuration includes source entry points and excludes generated output, reference clones, and vendored rules.
Report unavailable tooling. Do not claim that analysis ran when it did not.
Add local tooling only when the task authorizes configuration or dependency changes.
Before removing reported unused exports, check package entry points, Svelte components, and external API compatibility.
Do not treat public exports as unused solely because this repository has no internal consumers.

Keep browser, SSR, and subscription lifecycle behavior covered by tests.
Use the verification skill to select checks. Documentation-only changes do not require a complete package rebuild.

## Documentation

- Document all new or changed code, including module purpose, API contracts, and non-obvious internal behavior.
- Use TypeDoc-compatible `/** ... */` comments for exported functions, types, classes, and members.
- Include `@param`, `@returns`, `@typeParam`, `@throws`, and `@example` where applicable.
- Document component props and snippets. State component initialization requirements, reactive getter behavior, SSR constraints, and cleanup ownership.
- Document Effect error channels separately from thrown exceptions.
- Keep README examples and React-to-Svelte differences synchronized with behavior.
- Use Simplified Technical English for documentation, comments, and software messages.
- Use active voice and consistent terms. Limit procedure sentences to 20 words and descriptive sentences to 25 words.
- Preserve API names and exact technical meaning. Explain constraints instead of repeating code.

## Repository workflow

This repository is public. Use synthetic fixtures and generic examples.
Do not include private consumer data, endpoints, identifiers, logs, or workspace paths in repository content or publication metadata.
Review outgoing changes and commit history before publication.
Use a feature branch and a pull request for changes.
Do not commit, push, publish, or merge without task authorization.
