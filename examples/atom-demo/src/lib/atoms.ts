import { Atom } from "atom-svelte"
import * as Effect from "effect/Effect"

/** Simple writable state atom. */
export const countAtom = Atom.make(0)

/** Derived (read-only) atom. */
export const doubledAtom = Atom.map(countAtom, (n) => n * 2)

const quotes = [
  "Simplicity is prerequisite for reliability.",
  "Programs must be written for people to read.",
  "Make it work, make it right, make it fast.",
  "The best error message is the one that never shows up."
]

/**
 * An effectful atom: its value is a `Result<string>` that starts as
 * `Initial`, becomes `waiting`, then resolves. `registry.refresh` re-runs it.
 */
export const quoteAtom = Atom.make(
  Effect.gen(function*() {
    yield* Effect.sleep("600 millis")
    return quotes[Math.floor(Math.random() * quotes.length)]
  })
)

/** A function atom, callable through `useAtomSet` (optionally promise mode). */
export const greetAtom = Atom.fn((name: string) =>
  Effect.succeed(`Hello, ${name || "stranger"}!`).pipe(Effect.delay("300 millis"))
)
