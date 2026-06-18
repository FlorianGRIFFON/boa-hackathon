---
description: UI design constraints for all apps — no emojis, no AI-default colors, restrained punctuation, handmade feel.
alwaysApply: true
---

# UI Design Rules

These rules apply to every screen in every app. The goal is UI that looks like a thoughtful person designed it for one specific purpose — not a product generated from a template.

---

## Color

**No AI-default palettes.** These color choices read immediately as AI-generated and are banned:
- Indigo / violet / purple as the primary action color (`#6366F1`, `#8B5CF6`, and similar)
- Gradients as button fills or card backgrounds
- Neon or oversaturated accent colors
- "Glass morphism" (blurred translucent cards with colored glow borders)

**What to do instead:**
- Pick one accent color per app that comes from the app's domain — a time tracker might use a warm amber, a wellness app a muted sage, a finance app a deep teal
- Neutrals should be warm (zinc/stone family) or app-specific, not generic cool grays
- Never use more than 3 named colors in a single screen
- The default theme in `packages/shared-ui` is a neutral starting point — every app must override `colors.primary` with its own accent before shipping

---

## Emojis

**No emojis in UI elements.** This includes:
- Buttons and CTAs
- List item prefixes or decorations
- Section headers or screen titles
- Feature bullet points on paywall screens
- Onboarding steps
- Empty states

Use `Icon` and `Checkbox` from `@boa/shared-ui` — not emoji, not raw `@expo/vector-icons` imports in app code. Both wrap Feather internally.

The only acceptable emoji use is in user-generated content that the user themselves typed.

---

## Punctuation — em dashes

**Limit em dash (—) usage in UI copy.** One or two per screen maximum. Never use it as a default separator between a label and its value. Rewrite the copy so it reads as a complete thought instead.

```
❌  Sessions — 12 this week
✅  12 sessions this week

❌  Morning — done · Evening — pending
✅  Morning done  /  Evening pending

❌  TapTrack — Time tracking for freelancers
✅  Time tracking for freelancers
```

---

## Typography

- System font by default (SF Pro on iOS, Roboto on Android). Add a custom font only if it meaningfully changes the character of the app — not as decoration.
- Three text sizes maximum per screen: one heading, one body, one caption. Do not use 5 different font sizes to create hierarchy.
- Bold is for the one most important thing on a screen, not for every label.
- Avoid `letterSpacing` on body text — it signals "I'm trying to look designed."

---

## Layout

**Whitespace over density.** If a screen feels full, remove an element rather than reducing padding.

**Avoid card-everywhere layouts.** Not every list item needs a white rounded card with a shadow. Flat lists with a thin separator or generous spacing look more intentional.

**Shadows:** one shadow level per app, used on at most one layer (e.g. the bottom action bar, not every card). Use `elevation: 2` on Android, `shadowOpacity: 0.06` on iOS — not the default heavy shadows.

**Border radius:** pick one radius and apply it consistently. Do not mix `borderRadius: 8`, `borderRadius: 12`, `borderRadius: 16`, and `borderRadius: 9999` across different elements on the same screen.

---

## Copy and microcopy

**No generic SaaS copy.** These phrases are banned from all UI:
- "Start your journey"
- "Level up your [anything]"
- "Boost your productivity"
- "Track anything"
- "Your [noun], your way"
- "Get started" as a primary CTA (use a specific verb: "Log time", "Start ritual", "Add project")

**Empty states:** one short sentence. Not a heading + subtext + illustration + CTA.

**Feature lists on the paywall screen:** write them as outcomes, not feature names.
```
❌  Advanced analytics
✅  See exactly where your time went each week
```

---

## What "AI-generated" looks like — avoid these patterns

- Large emoji centered on screen + gradient card + "Start your journey" button
- Stat cards: white rounded card, drop shadow, large colored number, small gray label below
- Onboarding with emoji illustration on each step + "✨ Feature name" bullet list
- Bottom tab bar with emoji icons
- Every interactive element has a colored background — buttons, tags, chips, all filled

## What "handmade" looks like — aim for these patterns

- Flat layout, high contrast text on white or off-white, deliberate vertical rhythm
- Typography carries the hierarchy — one bold heading, everything else body weight
- One element per screen earns color; everything else is black, white, or near-neutral
- Copy sounds like a person wrote it for one specific user, not a product brief
- Interactions feel direct: tap a thing, that thing responds — no intermediary loading states for local operations
