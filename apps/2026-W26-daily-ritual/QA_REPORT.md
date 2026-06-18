# QA Report — DayRitual (2026-W26)

## Maestro Test Results

All 6 Maestro tests failed. The app could not be exercised at runtime because the simulator binary was built before `expo-linking` was added as a dependency — the native module is missing from the compiled binary. Every test fails at or before the first `Skip` navigation affordance (onboarding step 1), which Maestro cannot find.

| Test | Result | Notes |
|------|--------|-------|
| 01-onboarding.yaml | ❌ Fail | `Assertion is false: "Build your daily ritual" is visible` — app not rendering onboarding screen |
| 02-morning-ritual-taps.yaml | ❌ Fail | `Element not found: Text matching regex: Skip` — cannot reach Morning Ritual screen |
| 03-paywall-gate.yaml | ❌ Fail | `Element not found: Text matching regex: Skip` — cannot reach Evening Review / Paywall |
| 04-streak-both-complete.yaml | ❌ Fail | `Element not found: Text matching regex: Skip` — cannot complete both rituals to verify streak increment |
| 05-streak-morning-only-no-increment.yaml | ❌ Fail | `Element not found: Text matching regex: Skip` — cannot reach Morning Ritual screen |
| 06-priority-verbatim.yaml | ❌ Fail | `Element not found: Text matching regex: Skip` — cannot enter priorities to verify verbatim display |

**Root cause:** The app binary installed on the simulator was compiled before `expo-linking` was added as a dependency. The Metro bundler surfaces a native module linkage error at launch, rendering a Metro error screen instead of the app UI. A full `expo run:ios` rebuild is required before Maestro or manual navigation is possible.

---

## Visual QA — UI Rules Compliance

Visual QA was conducted via static code audit of all source files, since live screenshots showed only Metro error states rather than app screens.

| Rule | Result | Screen | Evidence |
|------|--------|--------|----------|
| No emoji in UI | ❌ Fail | `app/home.tsx` lines 94, 117 | `ritualEmoji` renders `'✅'` / `'🌅'` and `'✅'` / `'🌙'` as ritual card status icons (fontSize 28) |
| No emoji in UI | ❌ Fail | `app/home.tsx` line 131 | `'🔒'` used as lock affordance in `ritualCta` for paid-gated evening ritual |
| No emoji in UI | ❌ Fail | `components/PriorityStatusRow.tsx` lines 41–42 | `option.emoji` rendered in status chip labels — `'✅'`, `'🔶'`, `'⏭️'` for Done / Partial / Skip |
| No emoji in UI | ❌ Fail | `app/evening-review.tsx` line 132 | `'☑️'` / `'⬜️'` used as checkbox UI elements in carry-over selector |
| Em dash limit (max 2 per screen) | ❌ Fail | `app/paywall.tsx` lines 8–10 | 3 em dashes in feature list: `'Evening review — …'`, `'Full streak history — …'`, `'Carry-over selector — …'` |
| Primary color override required | ❌ Fail | All screens | No `colors.primary` override anywhere in the app — default `#18181B` (neutral placeholder) is used throughout |
| Max 3 font sizes per screen | ❌ Fail | `app/home.tsx` | 5+ distinct sizes: 64px streak number, 28px emoji, 18px headings, 14px labels, 12px captions |
| No stat card anti-pattern | ❌ Fail | `app/home.tsx` lines 59–67 | Streak card: colored background, large rounded card, 64px bold primary-colored number, smaller label below — matches the described anti-pattern exactly |
| No letterSpacing on label/body text | ❌ Fail | `app/home.tsx` line 202 | `letterSpacing: 1` on `sectionTitle` (uppercase section label) |
| No letterSpacing on label/body text | ❌ Fail | `app/evening-review.tsx` line 231 | `letterSpacing: 1` on `sectionTitle` |
| No letterSpacing on label/body text | ❌ Fail | `packages/shared-ui/src/components/OnboardingStep.tsx` line 54 | `letterSpacing: 1.5` on 11px `stepLabel` |

**Additional runtime bug (not a UI design rule, but blocking correct rendering):** All screen files reference `colors.gray50`, `colors.gray100`, `colors.gray200`, `colors.gray400`, `colors.gray600`, `colors.gray900` — none of which exist in the shared-ui theme (the theme uses the `zinc` token family). These resolve to `undefined` at runtime, silently breaking all color-dependent styles across every screen.

---

## Known Gaps (from BUILD_RESULT.md)

- `useSubscription` is a Phase 1 placeholder — subscribing sets `status: 'active'` in memory only and resets on app restart. Real payment flow is deferred to Phase 3.
- Evening review has no deep-link guard inside `evening-review.tsx` itself — only the home screen navigation is gated. The spec does not require the inner guard.
- Streak calculation uses local device time (`new Date()`). Cross-midnight edge cases are accepted for MVP; cloud sync is deferred to v2.
- Weekly reflection summary card is listed in the paywall feature copy per spec but the screen itself is intentionally not built — it is not in `mvp_screens`.

---

## Overall Verdict

**FAIL**

The app cannot be verified at runtime. The simulator binary was built before `expo-linking` was added as a dependency, causing a native module error at launch — all 6 Maestro tests fail because the app never renders its UI. A full `expo run:ios` rebuild is required before any functional testing is possible.

Beyond the build issue, the static code audit found 10 UI design rule violations: emoji are used as status indicators and checkboxes across 3 files; the paywall screen has 3 em dashes (limit is 2); there is no domain-specific primary color override; the home screen uses 5+ distinct font sizes (limit is 3); the streak counter card matches the banned stat-card anti-pattern exactly; and `letterSpacing` is applied to label text in 3 locations. There is also a runtime color bug where all `colors.gray*` references resolve to `undefined` because the shared-ui theme uses `zinc` tokens — this would silently break all color styling even if the build issue were resolved.

The builder must: (1) rebuild the native binary with `expo run:ios`, (2) replace all `colors.gray*` references with the correct `colors.zinc*` tokens, (3) remove emoji from UI elements and replace with icon or text equivalents, (4) revise the paywall copy to use at most 2 em dashes, (5) define and apply a domain-specific accent color, (6) reduce font size levels on the home screen to 3, (7) rework the streak card to avoid the stat-card pattern, and (8) remove `letterSpacing` from label and step indicator styles.
