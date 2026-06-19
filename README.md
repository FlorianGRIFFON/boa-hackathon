# boa-hackathon

A monorepo for shipping one free Android app per week using Expo and React Native. Each app solves one specific problem with one hero feature. The pipeline is agent-driven; the only human step is manual QA before publishing.

## How it works

```
weekly.js
  brainstorm -> build -> assets -> (manual QA) -> publish
```

Run the pipeline by invoking the `weekly` workflow with a week string:

```
args: { week: "2026-W28", category: "productivity" }
```

After the workflow completes, test the app manually on an Android device, then run `weekly-publish` to submit to Google Play internal track.

## Agents

Each agent is a prompt in `agents/prompts/` invoked by a workflow script in `.claude/workflows/`.

| Workflow | Agent prompt | What it does |
|---|---|---|
| `weekly-brainstorm` | `brainstorm.md` | Researches a problem, validates the idea, writes `SPEC.md` |
| `weekly-build` | `builder.md` + `manager.md` | Builds all screens from `SPEC.md`, runs self-QA and a manager fix loop |
| `weekly-icon` | inline | Generates `icon.png`, `adaptive-icon.png`, and `splash.png` via Python/Pillow |
| `weekly-store-listing` | inline | Writes Play Store title, description, keywords, and release notes to `store/` |
| `weekly-qa` | `qa.md` | Static code audit against UI rules, captures simulator screenshots |
| `weekly-publish` | inline | Pre-flight check, EAS cloud build, EAS submit to Play internal track |

`weekly` and `weekly-assets` are orchestrators that chain the above in sequence.

## Repo structure

```
.claude/workflows/     workflow scripts (.js)
agents/prompts/        system prompts for each agent role
agents/schemas/        JSON schemas for structured agent output
agents/templates/      files copied when scaffolding a new app
packages/shared-ui/    shared React Native components
packages/shared-hooks/ shared hooks (onboarding, etc.)
packages/shared-types/ shared TypeScript types
apps/YYYY-WNN-slug/    one Expo app per week
```

## Rules

All files in `.claude/rules/` are active for every agent:

- `scope-discipline` -- build only what is in `SPEC.md`
- `shared-components` -- check `packages/shared-ui` before creating any component
- `no-commits-on-the-fly` -- never stage or commit unless explicitly asked
- `code-comments` -- comment the why, not the what
- `ui-design` -- no AI-default palettes, no emoji in UI, deliberate typography

## Stack

- Expo SDK 53, React Native 0.79.6, Expo Router
- EAS Build (Android APK for preview, AAB for production)
- EAS Submit to Google Play
- AsyncStorage for all local data, no backend required
- Yarn workspaces (always use `yarn`, never `npm install`)
