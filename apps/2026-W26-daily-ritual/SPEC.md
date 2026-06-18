# DayRitual

## Problem
When I start my workday on my phone or iPad, I struggle to set clear intentions and close the day with an honest review because the apps that do this well (Sunsama) are desktop-first and cost $25/month, while simpler mobile apps (ThreeToday, Structured) skip the guided evening review entirely — leaving me with no accountability loop and no record of what actually got done.

## Target User
A remote freelancer or independent knowledge worker (designer, developer, consultant, writer) who does most of their work from an iPhone or iPad, wants a 2-minute morning ritual to pick 3 daily priorities and a 2-minute evening review to close the day intentionally, but refuses to pay $25/month for Sunsama when the mobile app is widely described as "basically useless" for the actual planning ritual.

## Why Existing Solutions Fail
Sunsama handles desktop daily planning rituals better than any competitor but fails on mobile — 620 users voted for the missing mobile planning feature on its public roadmap, one reviewer called the mobile app "basically useless," and at $25/month with no free tier the price is a hard blocker for freelancers. Structured handles visual time-blocking on iOS well (154K App Store ratings) but has no guided morning ritual ("what are my 3 priorities?") and no evening review — it is a calendar, not a ritual. ThreeToday lets you pick 3 tasks but has no evening review, no streak, and no reflection prompt.

## Hero Feature
A guided two-part daily ritual — a 2-minute morning intention (pick 3 priorities, estimate time) and a 2-minute evening review (mark what got done, carry over incomplete items, answer one reflection prompt) — that runs entirely on mobile with streak tracking to build the habit.

## Out of Scope
- Calendar integration or time-blocking (drag tasks to a timeline) — a local priority list is sufficient for MVP
- Cloud sync or cross-device access — local AsyncStorage is sufficient for week one; sync is v2
- Team or shared daily rituals — this is a solo tool; shared rituals add auth complexity
- Weekly and monthly summary views — daily streak history provides retention; summaries belong in v2
- Integration with external task managers (Todoist, Asana, Notion) to import tasks — manual priority entry is sufficient for MVP

## Monetization
- Free tier: Unlimited morning intentions (pick 3 priorities, mark complete) with 3-day streak history visible
- Paid tier: Evening review flow + full streak history (unlimited days) + one weekly reflection summary card
- Price: $4.99/month
- Trial: 7 days

## Why Users Will Pay
Headspace charges $12.99/month and Calm charges $14.99/month for a guided mindfulness ritual — both have millions of paying subscribers, proving the market pays for a short, structured daily practice. DayRitual's ritual is shorter, more actionable, and tied directly to work output. At $4.99/month it is priced 60% below the cheapest comparable (Headspace) and 80% below Sunsama. The direct willingness-to-pay signal: 620 Sunsama users publicly requested mobile ritual support on a roadmap with no ETA — a $4.99 mobile-first alternative targeting that exact gap has a documented, motivated, underserved audience.

## Screens (MVP)
1. Onboarding — 3 steps: what the ritual is, choose morning reminder time, start free trial
2. Morning Ritual — guided flow to pick 3 priorities and estimate time for each (today's date header, 3 input slots, confirm button)
3. Evening Review — guided flow to mark each priority done/partial/skipped, carry-over selector, one fixed reflection prompt, close day button (paid tier only — paywall gate at entry)
4. Home / Streak Dashboard — today's ritual status (morning done / evening done), current streak count, last 7-day completion dots, shortcut buttons to open morning or evening ritual
5. Paywall — shown when a free-tier user taps Evening Review or tries to view full streak history; free vs paid tier comparison, $4.99/month CTA with 7-day trial

## Success Criteria
1. The morning ritual flow completes in 3 taps or fewer from the Home screen to the confirmation screen (tap "Start Morning," fill 3 priorities, tap "Confirm") — testable by counting taps in the simulator
2. The evening review paywall appears the first time a free-tier user taps "Start Evening Review" — testable by completing onboarding, completing morning ritual, tapping evening review, and verifying the Paywall screen renders before the Evening Review screen
3. The streak counter on the Home screen increments by 1 only after both morning and evening rituals are marked complete for the same calendar day — testable by completing both flows and reading the streak value
4. Completing only the morning ritual without completing the evening review does NOT increment the streak — testable by completing morning only, force-quitting, relaunching, and confirming the streak value is unchanged
5. The onboarding flow has exactly 3 steps and ends on the Home screen — testable by counting screen transitions from fresh install to Home
6. All 3 priority labels entered during Morning Ritual are displayed verbatim on the Evening Review screen — testable by entering distinct strings in each slot and verifying they appear correctly on the review screen
