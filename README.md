# Boa — Weekly Mobile App Factory

## What We're Building

An automated pipeline that ships one production-ready mobile app (iOS + Android) every week. Each app solves one specific problem with one hero feature, built with Expo + React Native, monetized with a free trial + subscription via Stripe.

The pipeline is agent-driven. A human stays in the loop at exactly two points: approving the app idea before build starts, and approving the build before it ships to stores.

---

## Weekly Cycle

```
Monday                  Tue–Thu                 Friday                  Friday (human)
──────────────────────  ──────────────────────  ──────────────────────  ──────────────
Brainstorm agent        Builder agent           QA agent                Review + publish
validates idea,         builds app screen       tests every criterion,  agent submits
produces SPEC.md        by screen               writes QA report        to both stores

        │                       │                       │                      │
  ┌─────▼─────┐           ┌─────▼─────┐           ┌─────▼─────┐        ┌──────▼──────┐
  │  HUMAN 1  │           │  (auto)   │           │  HUMAN 2  │        │   (auto)    │
  │  Approve  │           │           │           │  Approve  │        │             │
  │  SPEC.md  │           │           │           │ QA report │        │             │
  └───────────┘           └───────────┘           └───────────┘        └─────────────┘
```

---

## Agent Architecture

Agents do not talk to each other directly. The workflow script is the message bus. Data flows as structured JSON between phases; files on disk are the persistent layer.

```
.claude/workflows/weekly-brainstorm.js
    │
    ├── spawns → Brainstorm Agent (agents/prompts/brainstorm.md)
    │               reads: args (category hint, app dir)
    │               writes: apps/<name>/SPEC.md
    │               returns: AppSpec JSON
    │
    └── [HUMAN CHECKPOINT 1] — human reads SPEC.md and approves

.claude/workflows/weekly-build.js
    │
    ├── spawns → Builder Agent (agents/prompts/builder.md)
    │               reads: apps/<name>/SPEC.md
    │               writes: entire app under apps/<name>/
    │               returns: BuildResult JSON
    │
    └── [HUMAN CHECKPOINT 2] — human reviews build, then triggers publish

.claude/workflows/weekly-publish.js   [Phase 5 — not yet built]
    │
    ├── spawns → QA Agent (agents/prompts/qa.md)
    └── spawns → Publisher Agent (agents/prompts/publisher.md)
```

### Agent files

| Agent | Prompt | Schema (output) | Status |
|-------|--------|-----------------|--------|
| Brainstorm | `agents/prompts/brainstorm.md` | `agents/schemas/app-spec.schema.json` | ✅ Built |
| Builder | `agents/prompts/builder.md` | `agents/schemas/build-result.schema.json` | ✅ Built |
| Manager | `agents/prompts/manager.md` + workflow scripts | — | ✅ Built |
| QA | `agents/prompts/qa.md` | `agents/schemas/qa-report.schema.json` | ⬜ Phase 4 |
| Publisher | `agents/prompts/publisher.md` | — | ⬜ Phase 5 |

---

## Phase Roadmap

### ✅ Phase 1a — Monorepo Foundation
- Yarn workspaces: `packages/*` and `apps/*`
- `@boa/shared-types` — TypeScript types for all agents and apps
- `@boa/shared-hooks` — `useSubscription`, `useOnboarding`
- `@boa/shared-ui` — `PaywallScreen`, `OnboardingStep`, `SubscriptionButton`, `AppShell`
- Agent rules in `.claude/rules/` (always active for all agents)
- Metro and Expo config templates in `agents/templates/`

### ✅ Phase 1b — Workflow Tool Familiarity
Manual exercise: run the test workflow at `.claude/workflows/test-brainstorm.js` to understand agent chaining, structured schemas, parallel agents, and human checkpoint patterns. See `PHASE_1B_GUIDE.md` for step-by-step.

### ✅ Phase 2 — Core Agents
- Brainstorm agent: market-validated idea → `SPEC.md`
- Builder agent: `SPEC.md` → shipped Expo app
- Manager workflow scripts: orchestrate phases, surface human checkpoints

### ⬜ Phase 3 — Payments & Build Infrastructure
- Wire `useSubscription` in `@boa/shared-hooks` to Stripe or RevenueCat
- EAS project setup (one EAS project per app)
- First real end-to-end run with a live app

### ⬜ Phase 4 — QA Agent
- QA agent prompt and schema
- Automated screen testing (Maestro or Detox)
- Screenshot capture per screen for human review

### ⬜ Phase 5 — Publish Agent
- App Store Connect API key (provided by human)
- Google Play service account JSON (provided by human)
- EAS Submit integration
- Publisher agent submits to both stores automatically

### ⬜ Phase 6 — Weekly Routine
- Claude scheduled routine: Monday 9am → triggers `weekly-brainstorm.js`
- Push notification to human at both checkpoints

---

## Monorepo Structure

```
boa-hackathon/
├── CLAUDE.md                         ← master rules for all agents
├── README.md                         ← this file
├── package.json                      ← yarn workspaces root
├── tsconfig.base.json                ← shared TypeScript config + @boa/* aliases
├── yarn.lock
│
├── .claude/
│   ├── rules/                        ← always-active rules for all agents
│   │   ├── code-comments.md
│   │   ├── no-commits-on-the-fly.md
│   │   ├── scope-discipline.md
│   │   └── shared-components.md
│   └── workflows/                    ← workflow scripts run via Workflow tool
│       ├── weekly-brainstorm.js
│       └── weekly-build.js
│
├── agents/
│   ├── prompts/                      ← system prompts for each agent role
│   │   ├── brainstorm.md
│   │   ├── builder.md
│   │   └── manager.md
│   ├── schemas/                      ← JSON schemas for inter-agent data
│   │   ├── app-spec.schema.json
│   │   └── build-result.schema.json
│   └── templates/                    ← files copied when scaffolding a new app
│       ├── metro.config.template.js
│       └── app.config.template.ts
│
├── packages/
│   ├── shared-types/src/index.ts     ← AppSpec, User, Subscription types
│   ├── shared-hooks/src/             ← useSubscription, useOnboarding
│   └── shared-ui/src/                ← PaywallScreen, OnboardingStep, etc.
│
└── apps/
    └── YYYY-WNN-<app-slug>/          ← one Expo app per weekly build
        ├── SPEC.md                   ← written by brainstorm agent, never modified
        ├── BUILD_RESULT.md           ← written by builder agent
        ├── app/                      ← Expo Router screens
        ├── app.config.ts
        ├── metro.config.js
        └── package.json
```

---

## Development Conventions

### Naming
- App directories: `YYYY-WNN-<slug>` (e.g., `apps/2026-W26-focus-timer`)
- Package names: `@boa/shared-*`
- Screens: `app/<screen-name>.tsx` inside the app directory

### Package manager
Always `yarn`. Never `npm install` inside this repo.

### Expo commands
Run `expo install <package>` inside the app directory — not `yarn add`. Expo install resolves the correct version for the SDK.

### TypeScript
Strict mode throughout. No `any`. No `@ts-ignore`. The `@boa/*` path aliases are configured in `tsconfig.base.json` — each app extends it.

### Shared components rule
Check `packages/shared-ui/src/components/` before creating any new component. See `.claude/rules/shared-components.md`.

### Commits
Stage all changes during a session. One consolidated commit at the end. See `.claude/rules/no-commits-on-the-fly.md`.

### Scope
The builder agent builds what is in `SPEC.md`. Nothing else. See `.claude/rules/scope-discipline.md`.

---

## Human Setup Checklist

These are created by the human and provided as environment variables or secrets — never committed to the repo.

| Item | When Needed | Where to Configure |
|------|-------------|-------------------|
| Stripe account + API keys | Phase 3 | `.env` (not committed) |
| Expo account + EAS CLI login | Phase 3 | `eas login` in terminal |
| Apple Developer account | Phase 5 | App Store Connect |
| App Store Connect API key | Phase 5 | `.env` |
| Google Play Console account | Phase 5 | Google Cloud Console |
| Google Play service account JSON | Phase 5 | `.env` path reference |

---

## Running the Pipeline

### Week N: Generate the spec

```bash
# In Claude Code, run the workflow with the current week and a category hint
# Workflow: .claude/workflows/weekly-brainstorm.js
# Args: { week: "2026-W26", appDir: "apps/2026-W26", category: "productivity" }
```

Review `apps/2026-W26/SPEC.md`. If approved, proceed to build.

### Week N: Build the app

```bash
# Workflow: .claude/workflows/weekly-build.js
# Args: { appDir: "apps/2026-W26" }
```

Review `apps/2026-W26/BUILD_RESULT.md` and test the app. If approved, trigger publish.

---

## Key Design Decisions

**Why one hero feature?** Scope is the primary cause of late or unshipped apps. One feature per week keeps the pipeline sustainable.

**Why Expo?** EAS Build handles iOS/Android CI without a Mac or Xcode locally. EAS Submit handles store upload. No native module maintenance.

**Why shared-ui?** Each weekly app should spend build time on the hero feature, not rebuilding paywall screens and onboarding flows. The shared library grows over time and reduces per-app build time.

**Why human checkpoints?** The brainstorm agent can approve a weak idea. The builder can misinterpret a spec. Human review at two gates catches these before they become wasted publishing cycles or user-facing bugs.

**Why no backend for MVP?** A backend doubles build time and adds ongoing maintenance. Every hero feature is designed to work with local storage first. Sync and sharing are Phase 3+ concerns.
