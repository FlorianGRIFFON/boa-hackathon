# Build Result — ClientClock

## Status
complete

## Screens Built

1. Onboarding (`app/onboarding.tsx`) — 3-step flow: welcome, add first client, start timer
2. Home (`app/index.tsx`) — Running timer display + single-tap client switcher
3. Clients (`app/clients.tsx`) — Add, edit, archive clients; free tier gate at 2 clients
4. Day View (`app/day-view.tsx`) — Chronological timeline with gap detection; paid gate
5. Weekly Report (`app/weekly-report.tsx`) — Per-client hour totals, selectable plain text; paid gate
6. Paywall (`app/paywall.tsx`) — 14-day trial, 3 outcome-focused feature bullets

## Components Reused from shared-ui

- `AppShell` — wraps every screen for safe area + status bar
- `OnboardingStep` — used in all 3 onboarding steps
- `PaywallScreen` — the full paywall UI
- `SubscriptionButton` — used inside PaywallScreen
- `colors`, `spacing`, `typography`, `radius`, `shadow` — design tokens throughout

## Components Added to shared-ui

None. All new components are app-specific.

## App-Specific Components

- `components/TimerDisplay.tsx` — Running client name + elapsed HH:MM:SS ticker
- `components/ClientRow.tsx` — Single tappable row in the home switcher list
- `components/ClientForm.tsx` — Bottom-sheet modal for add/edit client

## App-Specific Hooks

- `hooks/useClients.ts` — Client CRUD with AsyncStorage persistence
- `hooks/useTimeEntries.ts` — Time entry management, gap detection, weekly totals
- `hooks/useElapsedTime.ts` — 1-second ticker that returns elapsed ms from a timestamp
- `hooks/useOnboardingComplete.ts` — Persists the onboarding-done flag across restarts

## Self-QA Results

| Criterion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| Switching timer completes in 1 tap within 200ms | PASS | `handleClientTap` calls `switchClient` synchronously — no async work precedes the state update. AsyncStorage write is non-blocking. |
| Home screen reachable within 2 taps from any screen | PASS | Home is always the first tab; 1 tap from any other tab. |
| Paywall appears on third-client add or Day View / Weekly Report navigation | PASS | `clients.tsx` gates add at `FREE_TIER_CLIENT_LIMIT=2`; `day-view.tsx` and `weekly-report.tsx` render paywall gate when `!isPaid`. |
| Day View highlights gaps of 5 minutes or longer | PASS | `gapsForDay` filters by `GAP_THRESHOLD_MS = 5 * 60 * 1000`; gaps render with amber highlight and "Untracked gap" label. |
| Onboarding completes in 3 steps or fewer | PASS | 3 steps: welcome (step 0), add client (step 1), start (step 2). Skip is always available. |
| Weekly Report output is selectable plain text with client name and hours | PASS | Text block uses `selectable` prop; `buildReportText` formats `${name}: ${hours}` per client. |

## Maestro Tests

- `tests/maestro/01-single-tap-switch.yaml`
- `tests/maestro/02-home-reachable.yaml`
- `tests/maestro/03-paywall-gate.yaml`
- `tests/maestro/04-gap-detection.yaml` — partial; Phase 3 TODO for data seeding
- `tests/maestro/05-onboarding-steps.yaml`
- `tests/maestro/06-weekly-report-selectable.yaml` — partial; Phase 3 TODO for subscription mock

## Blockers

None.

## Notes

- The Home screen shows an "Upgrade" button only to free-tier users; paid users see nothing in that slot (no dead space because the button uses conditional rendering with no layout placeholder).
- Tapping the currently running client on the Home screen stops the timer rather than switching — this is the natural inverse of the switch action and matches the spec's intent without adding extra UI.
- Gap detection covers only intervals between existing entries within a day, not the gap before the first entry or after the last — the spec does not define workday boundaries, and detecting those gaps would require assumptions.
- The `assignGap` function creates a new completed time entry covering the gap; it does not modify the surrounding entries.
- Color assignment to clients uses a cycling palette of 8 domain-appropriate colors (teal, blue, amber, green, orange variants). This is not configurable — out of scope per spec.
- The onboarding adds the first client directly to the `useClients` hook and immediately starts a timer via `useTimeEntries.switchClient`. Both calls share the same closure-bound `addClient` result to ensure the IDs match.
- Weekly Report includes archived clients if they have entries in the current week — this is correct behavior for accurate historical billing.
