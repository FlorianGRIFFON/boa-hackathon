export const meta = {
  name: 'weekly-store-listing',
  description: 'Generate Google Play Store listing copy (title, description, keywords) from SPEC.md',
  phases: [
    { title: 'Listing', detail: 'Write Play Store title, descriptions, keywords, and release notes' },
  ],
}

// Args: { appDir: string }
// Example: { appDir: "apps/2026-W28-dose-check" }
//
// Outputs in apps/<appDir>/store/:
//   title.txt            — max 30 chars
//   short-description.txt — max 80 chars
//   description.txt      — max 4000 chars, plain text
//   keywords.txt         — comma-separated ASO terms
//   release-notes.txt    — max 500 chars ("What's new")
//   listing.md           — human-readable review of all the above

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const appDir = parsedArgs.appDir ?? 'apps/unknown-week'

phase('Listing')
log(`Generating Play Store listing for ${appDir}`)

const result = await agent(
  `Generate the Google Play Store listing for ${appDir}.

## Step 1 — Read context

Read ${appDir}/SPEC.md in full.
Read ${appDir}/BUILD_RESULT.md if it exists (for feature notes).

## Step 2 — Create store directory

mkdir -p ${appDir}/store

## Step 3 — Write each file

### ${appDir}/store/title.txt — HARD LIMIT: 30 characters
Use app_name from spec. Add a short functional subtitle after a colon if it fits.
Count every character before writing. Must be ≤30. Truncate if needed.

### ${appDir}/store/short-description.txt — HARD LIMIT: 80 characters
One punchy sentence. Outcome-focused (what the user achieves), not feature-focused.
Example: "Never miss a dose again — no account, no ads, just your alarm."
Count characters. Must be ≤80.

### ${appDir}/store/description.txt — plain text, max 4000 characters
No markdown, no asterisks, no bullet symbols — Play Store renders plain text only.
Use plain dashes (-) for bullets.

Structure:
Opening hook (2-3 sentences): the problem from the user's perspective, specific and relatable.

What you get:
- [outcome 1 — user benefit, not a feature name]
- [outcome 2]
- [outcome 3]
- [outcome 4]

Why it's different:
One paragraph grounded in why_existing_solutions_fail from the spec.
Name the competitor(s) and what they get wrong. Be specific.

Completely free. No account. No ads.
[One sentence restating the promise.]

Copy rules:
- Banned phrases: "Start your journey", "Level up", "Boost your productivity",
  "Track anything", "Your [noun] your way", "Get started"
- Write for one specific person, not a product brief
- No emoji

### ${appDir}/store/keywords.txt — 20-30 terms, comma-separated
- Exact search terms the target user types (from the problem domain in spec)
- Competitor names people search as alternatives (from why_existing_solutions_fail)
- Condition/context terms from target_user in the spec
- Hero feature in plain language
- Avoid: "app", "free", "best", "top", "new"

### ${appDir}/store/release-notes.txt — max 500 characters
First release. 1-2 sentences. What the app is and does — not "initial release" or "v1.0".
Example: "DoseCheck is a medication reminder that won't stop ringing until you confirm you've taken your dose. Set up in under 60 seconds, no account needed."

### ${appDir}/store/listing.md — review file
Combine all the above with section headers and character counts for easy review.

Format:
# [app_name] — Play Store Listing

## Title (N/30 chars)
[content]

## Short Description (N/80 chars)
[content]

## Full Description (N/4000 chars)
[content]

## Keywords (N terms)
[content]

## Release Notes (N/500 chars)
[content]

## Step 4 — Report character counts

Print exact character counts for title, short-description, description, and release notes.
Confirm all 6 files were written to ${appDir}/store/.`,
  { label: 'store-listing' }
)

log(result)

return { appDir, result }
