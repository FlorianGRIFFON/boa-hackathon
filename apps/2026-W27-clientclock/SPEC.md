# ClientClock — App Spec

## Problem Statement

When I am mid-task and need to switch from billing one client to another, I struggle to stop my current timer and start a new one in time because opening a time tracking app, finding the right project, stopping one entry, and starting another takes 6+ taps and enough friction that I skip it—leaving gaps in my timesheet I have to reconstruct from memory at the end of the day, usually underestimating what I actually worked.

## Target User

A freelance designer, developer, or consultant who bills hourly, works across 3–8 concurrent client projects on any given day, and primarily manages their work from their iPhone. They lose billable time not because they are disorganized but because switching contexts mid-task makes timer management feel like a second job.

## Why Existing Solutions Fail

Toggl Track handles desktop time tracking well but its iPhone app requires 4–6 taps to switch a running timer between clients, and it has no mechanism to surface the gaps in your day—untracked intervals that represent lost billable hours. Users end up reconstructing their day from memory at 6pm, a method with documented error rates above 70%. Timery (a Toggl frontend) reduces the taps but still requires an active Toggl subscription and does not show gap visualization. TallyHo is manual-entry only—there is no running real-time timer, so it cannot detect the exact moment a switch was missed.

## Hero Feature

A single-tap client switcher: from one screen, the currently running timer is always visible, and tapping any other client in the list instantly stops the current timer and starts a new one for that client, with the exact second recorded—no navigation, no confirmation dialogs, no extra steps.

## Out of Scope

- iOS home screen widget (requires native build complexity; deliver in v2 after core tracking is validated)
- Invoice generation and sending (adds backend/email infrastructure; the weekly report is a paste-ready summary, not a PDF invoice)
- Calendar integration to auto-detect client from meeting title (requires calendar permissions and significant matching logic; out of scope for week 1)
- Cloud sync and multi-device access (local storage is sufficient for MVP; sync requires a backend)
- Team or shared billing (this is a solo freelancer tool; shared projects add user management complexity)

## Monetization

- **Free tier:** Track time for up to 2 clients; view today's log with total hours per client
- **Paid tier:** Unlimited clients, end-of-day gap visualization showing untracked intervals, weekly per-client hours summary formatted for copy-paste into any invoice
- **Price:** $6.99/month
- **Trial:** 14 days

## Willingness to Pay Signal

Freelancers billing $75/hour who lose just 3 untracked hours per week lose $11,700 per year. A Reddit user in r/freelance reported losing $10,000 in a year from forgotten timers. At $6.99/month ($83.88/year), recovering even one missed hour per month pays for the subscription 8x over. Comparable iOS-only solo productivity apps charge $4.99–$9.99/month. $6.99 is mid-range and justified by direct dollar-value recovery.

## MVP Screens

1. **Home** — Running timer display showing active client, elapsed time, and a scrollable client list where one tap switches the billing target instantly
2. **Clients** — Add, edit, and archive clients with optional hourly rate; maximum 2 shown in free tier
3. **Day View** — Chronological timeline of today's entries with untracked gaps highlighted (paid feature); tap a gap to assign it to a client
4. **Weekly Report** — Per-client hour totals for the current week, formatted as a plain-text summary ready to copy into any invoice or email (paid feature)
5. **Paywall** — Shown when a free-tier user attempts to add a third client or access Day View or Weekly Report; lists the three concrete outcomes of the paid tier, no feature names

## Success Criteria

- Switching a running timer from one client to another completes in exactly 1 tap from the Home screen, with the new timer started and the previous entry closed within 200ms of the tap
- The Home screen is reachable and the running timer visible within 2 taps from any screen in the app
- The Paywall screen appears when a free-tier user attempts to add a third client or navigates to Day View or Weekly Report, and does not appear at any other time
- The Day View correctly identifies and highlights all intervals of 5 minutes or longer between logged entries as untracked gaps
- The onboarding flow (client setup to first running timer) completes in 3 steps or fewer
- The Weekly Report output is plain text that can be selected and copied with a single long-press, containing each client name and total hours for the week
