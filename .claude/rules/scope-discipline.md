---
description: Agents must stay strictly within the app spec. No feature invention, no scope creep.
alwaysApply: true
---

# Scope Discipline

Every app in this monorepo is built from a validated spec located at `apps/<app-name>/SPEC.md`. The spec is the single source of truth.

## Hard rules

- **Only build screens listed in `mvp_screens`** in the spec. Do not add screens, tabs, or flows not listed there.
- **Only implement the `hero_feature`** described in the spec. Do not extend, enhance, or generalize it.
- **`out_of_scope` is a blocklist.** If a feature appears there, do not build it, even if it seems like a natural addition.
- **If a requirement is ambiguous**, stop and flag it with a question. Do not invent a solution and proceed silently.

## What counts as scope creep (never do these without explicit spec change)

- Adding a settings screen not in `mvp_screens`
- Adding social sharing, notifications, or analytics hooks not in the spec
- Building a "nice to have" UI flourish that wasn't asked for
- Expanding the hero feature with sub-features ("while I'm here...")
- Adding error states beyond what the spec's `success_criteria` requires

## When in doubt

Refer back to the spec's `problem_statement` and `hero_feature`. If the thing you're about to build doesn't directly serve those two fields, don't build it.
