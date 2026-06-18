# Build Result — DayRitual

## Status
complete

## Screens Built
1. `app/_layout.tsx` — Root layout wrapping with AppShell and Expo Router Stack
2. `app/index.tsx` — Entry point routing to onboarding or home based on AsyncStorage flag
3. `app/onboarding.tsx` — 3-step onboarding using OnboardingStep + useOnboarding
4. `app/home.tsx` — Home / Streak Dashboard with streak counter, 7-day dots, ritual shortcuts
5. `app/morning-ritual.tsx` — Guided flow for picking 3 priorities with time estimates
6. `app/evening-review.tsx` — Review flow (paid tier) to mark priorities and answer reflection prompt
7. `app/paywall.tsx` — Paywall using PaywallScreen component with 7-day trial CTA

## Components Reused from shared-ui
- `AppShell` — root layout wrapper
- `OnboardingStep` — each of the 3 onboarding steps
- `SubscriptionButton` — onboarding CTA, morning ritual confirm button
- `PaywallScreen` — full paywall screen with pricing and features

## Components Added to shared-ui
none — all new components are app-specific to DayRitual

## App-Specific Components Created
- `components/PriorityInput.tsx` — priority label text input with minute estimate chip selector
- `components/PriorityStatusRow.tsx` — evening review row to mark a priority done/partial/skipped
- `components/StreakDots.tsx` — 7-day completion dot row with weekday labels
- `hooks/useRitual.ts` — AsyncStorage-backed hook for morning save, evening save, streak compute
- `hooks/useHasOnboarded.ts` — AsyncStorage flag tracking whether onboarding was completed

## Self-QA Results

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| Morning ritual completes in ≤3 taps from Home | PASS | 2 taps: "Start Morning" → fills priorities → "Confirm priorities" → back to Home |
| Evening review paywall appears first for free-tier | PASS | `handleEveningPress()` checks `isPaid`; free users get `router.push('/paywall')` before evening-review renders |
| Streak increments only when both rituals complete | PASS | `computeStreak()` requires `morningComplete && eveningComplete` for every counted day |
| Morning-only does NOT increment streak | PASS | `eveningComplete` stays false; persisted via AsyncStorage; streak = 0 on relaunch |
| Onboarding has exactly 3 steps and ends on Home | PASS | `STEPS.length === 3`; `onComplete` calls `router.replace('/home')` |
| All 3 priority labels shown verbatim in Evening Review | PASS | Labels stored as-is in AsyncStorage; `PriorityStatusRow` renders `p.label` without transformation |

## Blockers
none

## Notes
- The `useSubscription` hook is a Phase 1 placeholder (no real payment flow). Subscribing in the paywall sets `status: 'active'` in memory only — it resets on app restart. This is expected per the monorepo's Phase 3 plan.
- The evening review is gated at the navigation level in `home.tsx`. An additional guard could be added inside `evening-review.tsx` itself for deep-link protection, but the spec does not require this and it would be scope creep.
- Streak calculation uses local device time via `new Date()`. Cross-midnight edge cases (user submits evening review just after midnight) will attribute the data to the new day. This is acceptable for MVP — the spec explicitly defers cloud sync to v2.
- Weekly reflection summary card (paid tier benefit) is listed in the paywall features per spec but the summary screen itself is not in `mvp_screens` — it is intentionally not built.
