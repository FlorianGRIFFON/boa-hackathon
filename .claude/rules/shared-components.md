---
description: Always reuse components from packages/shared-ui before creating new ones.
alwaysApply: true
---

# Shared Component Reuse

This monorepo has a shared UI library at `packages/shared-ui`. It exists to avoid rebuilding the same primitives across every weekly app.

## Before creating any new component

1. Check `packages/shared-ui/src/` for an existing component that covers the use case
2. Check `packages/shared-hooks/` for an existing hook (auth, Stripe, permissions, etc.)
3. If a close match exists, **use it** — do not duplicate it with minor variations

## When to add to shared-ui

Add a component to `packages/shared-ui` when:
- It is generic enough to appear in more than one app (paywall screen, onboarding step, subscription button, loading skeleton, etc.)
- It has no app-specific business logic embedded in it

Do **not** add to `packages/shared-ui` when:
- The component is tightly coupled to this app's specific feature
- It would require passing many app-specific props to be reusable

## Component ownership

When you add a component to `packages/shared-ui`, it belongs to all apps. Do not modify it in a way that breaks existing consumers. Extend via props or composition — not by editing existing behavior.
