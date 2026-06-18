---
description: Guidelines for writing meaningful code comments in React Native / Expo projects
alwaysApply: true
---

# Code Comments

## What NOT to Comment

Don't leave comments about conversation-specific or transient changes:

```tsx
// ❌ BAD - conversation-specific, transient
// Made this component more readable
// Refactored for clarity
// Fixed the bug here
// Simplified this logic
// Updated to use new pattern
// Added for the paywall flow
```

## What TO Comment

Focus comments on genuinely useful context:

- **Non-obvious React Native behavior** - platform quirks, layout edge cases
- **Workarounds** - why a hack exists and what it's working around
- **Business logic** - subscription rules, trial durations, access gates
- **External dependencies** - links to Expo docs, Stripe docs, or tickets

```tsx
// ✅ GOOD - explains React Native platform quirk
// KeyboardAvoidingView behavior differs between iOS and Android:
// iOS needs 'padding', Android needs 'height' — do not unify
<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

// ✅ GOOD - documents workaround
// HACK: Expo Router doesn't expose a reliable "stack is empty" check.
// Tracking manually so the back button doesn't escape the onboarding flow.

// ✅ GOOD - explains business logic
// Trial users get 7 days free. Enterprise users provisioned via Stripe
// metadata may have a custom trial_end timestamp — always prefer that over
// the default calculation.

// ✅ GOOD - explains non-obvious animation choice
// Using transform instead of margin/padding here — margin animations
// trigger layout recalculations on Android and cause jank at 60fps.
```

## React Native Specifics

- **Never comment** on why you used `StyleSheet.create` over inline styles — it's the standard
- **Always comment** on `Platform.select` or `Platform.OS` branches unless the reason is blindingly obvious
- **Always comment** on any `useEffect` with a non-empty dependency array that has a subtle timing dependency
- **Comment `zIndex`** — stacking context bugs are silent and non-obvious to future readers

## Principle

If the code is clear, it doesn't need a comment. If it's unclear, either make the code clearer or add a comment explaining *why*, not *what*.
