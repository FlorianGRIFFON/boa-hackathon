export const meta = {
  name: 'weekly-build',
  description: 'Run the builder agent against an approved SPEC.md to produce the app',
  phases: [
    { title: 'Pre-build', detail: 'Checklist — spec ingestion, component inventory, ambiguity check' },
    { title: 'Build', detail: 'Screen by screen per SPEC.md' },
    { title: 'Self-QA', detail: 'Verify every success criterion' },
    { title: 'Review', detail: 'Manager check — sends fixable issues back to builder (max 2 rounds)' },
    { title: 'Fix', detail: 'Builder resolves manager-flagged issues' },
  ],
}

// Args shape: { appDir: string }
// Example: { appDir: "apps/2026-W26-focus-timer" }
// Run this after the human approves the spec from weekly-brainstorm.js

const BUILD_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    status:      { type: 'string', enum: ['complete', 'blocked'] },
    app_dir:     { type: 'string' },
    screens_built: { type: 'array', items: { type: 'string' } },
    components_reused: { type: 'array', items: { type: 'string' } },
    components_added_to_shared: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:   { type: 'string' },
          path:   { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['name', 'path', 'reason'],
      },
    },
    components_app_specific: { type: 'array', items: { type: 'string' } },
    self_qa: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          criterion: { type: 'string' },
          passed:    { type: 'boolean' },
          evidence:  { type: 'string' },
        },
        required: ['criterion', 'passed', 'evidence'],
      },
    },
    blockers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          screen:   { type: 'string' },
          question: { type: 'string' },
          options:  { type: 'array', items: { type: 'string' } },
        },
        required: ['screen', 'question', 'options'],
      },
    },
    notes: { type: 'string' },
  },
  required: [
    'status', 'app_dir', 'screens_built', 'components_reused',
    'components_added_to_shared', 'components_app_specific', 'self_qa', 'blockers',
  ],
}

const BUILD_CHECK_SCHEMA = {
  type: 'object',
  properties: {
    // Issues the builder can fix in code without human input
    fixable_issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file:        { type: 'string' },
          description: { type: 'string' },
          rule:        { type: 'string' },
        },
        required: ['file', 'description', 'rule'],
      },
    },
    // Violations that require a native rebuild (expo run:ios) — report only, do not loop
    native_rebuild_required: { type: 'boolean' },
    native_rebuild_reason:   { type: 'string' },
    // Items to surface to the human (ambiguities, spec inconsistencies, deliberate trade-offs)
    items_for_human:   { type: 'array', items: { type: 'string' } },
    overall_status:    { type: 'string', enum: ['clean', 'needs_attention', 'blocked'] },
    checkpoint_notes:  { type: 'string' },
  },
  required: ['fixable_issues', 'native_rebuild_required', 'native_rebuild_reason', 'items_for_human', 'overall_status', 'checkpoint_notes'],
}

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const appDir = parsedArgs.appDir ?? 'apps/unknown-week'

// ─── Phase 1, 2, 3: Builder agent ────────────────────────────────────────────

phase('Pre-build')
log(`Starting build for ${appDir}`)

const buildResult = await agent(
  `Read the file agents/prompts/builder.md and follow the instructions in it exactly.

Your context for this build:
- App directory: ${appDir}
- SPEC.md location: ${appDir}/SPEC.md

Steps to complete:
1. Complete the full Pre-Build Checklist from agents/prompts/builder.md before writing any code.
   IMPORTANT — Native module dependencies: expo-router requires these packages in package.json or
   the app will crash on launch. Ensure they are listed as dependencies before writing any screens:
     expo-linking (~7.x for SDK 53)
     react-native-screens (~4.x for SDK 53)
     react-native-safe-area-context (5.x for SDK 53)
   Also ensure expo, react, react-native, expo-router, expo-status-bar match SDK 53 versions:
     expo: ~53.0.0 | react: 19.0.0 | react-native: 0.79.6
     expo-router: ~5.1.11 | expo-status-bar: ~2.2.3

2. If you find blockers during the checklist, return immediately with status "blocked"
3. If no blockers, proceed to build all screens in the order specified in the Build Protocol
4. After building, run Self-QA against every success_criteria item in SPEC.md
5. Write BUILD_RESULT.md to ${appDir}/BUILD_RESULT.md
6. Return the structured BuildResult JSON

Do not commit any changes. Stage all files.`,
  { schema: BUILD_RESULT_SCHEMA }
)

log(`Build ${buildResult.status}: ${buildResult.screens_built.length} screens built, ${buildResult.self_qa.filter(q => q.passed).length}/${buildResult.self_qa.length} QA criteria passed`)

if (buildResult.status === 'blocked') {
  log(`Build blocked — ${buildResult.blockers.length} blocker(s) require human input`)
  return {
    buildResult,
    check: null,
    appDir,
    checkpoint_message: `## Build Blocked: ${appDir}\n\n${buildResult.blockers.map(b => `- [${b.screen}] ${b.question}`).join('\n')}`,
  }
}

// ─── Phase 4 + 5: Manager review → fix loop (max 2 rounds) ───────────────────

phase('Review')

const MAX_FIX_ROUNDS = 2
let currentBuildResult = buildResult
let check
let fixRound = 0

while (fixRound <= MAX_FIX_ROUNDS) {
  check = await agent(
    `Read agents/prompts/manager.md — specifically the "Build Quality Check" section.
Read .claude/rules/ui-design.md in full.

Apply every check to the files in ${appDir}. Do NOT rely solely on the build result JSON —
read the actual source files to find ui-design violations.

Check for:
1. **Navigation crash risk** — are expo-linking, react-native-screens, react-native-safe-area-context
   present in ${appDir}/package.json? If any are missing, flag as fixable (builder adds them).
2. **UI design rule violations** — emoji in UI, wrong primary color, gradients, em dashes,
   font size count per screen (max 3), letterSpacing on body text, banned copy, empty state format,
   border radius inconsistency, shadow count, colors.primary not overridden.
3. **Scope violations** — screens built that are not in SPEC.md mvp_screens (flag for human, do not loop on these).
4. **TypeScript errors** — obvious type mismatches or missing props that would cause a crash.

Classify each issue:
- fixable_issues: the builder can fix this in code right now (wrong color, wrong font size, missing dep in package.json, bad copy, emoji, etc.)
- native_rebuild_required: true if missing native deps were added to package.json by the builder — the human must run expo run:ios again
- items_for_human: spec inconsistencies, ambiguities, deliberate trade-offs the human should know about

Build result for context (but read actual files — do not trust this alone):
${JSON.stringify(currentBuildResult, null, 2)}

Return structured JSON.`,
    { schema: BUILD_CHECK_SCHEMA, label: fixRound === 0 ? 'manager-review' : `manager-review-round-${fixRound}` }
  )

  log(`Round ${fixRound} — manager check: ${check.overall_status}, ${check.fixable_issues.length} fixable issue(s)`)

  // If nothing fixable or we've used all rounds, exit the loop
  if (check.fixable_issues.length === 0 || fixRound === MAX_FIX_ROUNDS) break

  // Send fixable issues back to the builder
  phase('Fix')
  fixRound++
  log(`Fix round ${fixRound} — sending ${check.fixable_issues.length} issue(s) to builder`)

  const fixResult = await agent(
    `You are fixing issues flagged by the manager in ${appDir}.

Issues to fix (fix ALL of them — do not skip any):
${check.fixable_issues.map((i, n) => `${n + 1}. [${i.rule}] ${i.file}: ${i.description}`).join('\n')}

Rules:
- Read each file before editing
- Fix only what is listed — do not refactor unrelated code
- Do not add new screens or features
- Do not commit. Stage changes.
- After fixing, briefly confirm each fix with file + line reference.`,
    { label: `fix-round-${fixRound}` }
  )

  log(`Fix round ${fixRound} complete: ${fixResult}`)

  // Go back for another manager review
  phase('Review')
}

return {
  buildResult: currentBuildResult,
  check,
  appDir,
  fixRoundsUsed: fixRound,
  checkpoint_message: buildCheckpointMessage(currentBuildResult, check, appDir, fixRound),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCheckpointMessage(result, check, dir, fixRounds) {
  const qaTable = result.self_qa.map(q =>
    `${q.passed ? '✅' : '❌'} ${q.criterion}\n   ${q.evidence}`
  ).join('\n')

  const blockerSection = result.blockers.length > 0
    ? `\n**Blockers requiring your input:**\n${result.blockers.map(b =>
        `- [${b.screen}] ${b.question}\n  Options: ${b.options.join(' / ')}`
      ).join('\n')}`
    : ''

  const sharedSection = result.components_added_to_shared.length > 0
    ? `\n**New shared-ui components added:**\n${result.components_added_to_shared.map(c =>
        `- ${c.name} (${c.path}) — ${c.reason}`
      ).join('\n')}`
    : ''

  const nativeNote = check.native_rebuild_required
    ? `\n⚠️  **Native rebuild required before QA:** ${check.native_rebuild_reason}\nRun: \`cd ${dir} && npx expo run:ios\``
    : ''

  const fixNote = fixRounds > 0 ? `\n_(${fixRounds} fix round(s) completed automatically)_` : ''

  const remainingIssues = check.fixable_issues.length > 0
    ? `\n**Remaining issues after ${fixRounds} fix round(s):**\n${check.fixable_issues.map(i => `- [${i.rule}] ${i.file}: ${i.description}`).join('\n')}`
    : ''

  const humanItems = check.items_for_human.length > 0
    ? `\n**For your review:**\n${check.items_for_human.map(i => `⚠️  ${i}`).join('\n')}`
    : ''

  return `## Build Review: ${dir}

**Status:** ${result.status} (${check.overall_status})${fixNote}
**Screens built:** ${result.screens_built.length} — ${result.screens_built.join(', ')}
${sharedSection}${nativeNote}

**Self-QA:**
${qaTable}
${blockerSection}${remainingIssues}${humanItems}

**Notes from builder:**
${result.notes || 'None'}

---
Build written to: ${dir}/

${check.native_rebuild_required
  ? `Next step: run \`cd ${dir} && npx expo run:ios\` to install native deps, then run weekly-qa.js`
  : result.status === 'complete' && check.overall_status === 'clean'
  ? 'Next step: run weekly-qa.js (then Maestro manually)'
  : result.status === 'blocked'
  ? 'To unblock: resolve the blockers above, then re-run weekly-build.js'
  : 'Next step: review remaining items above, then run weekly-qa.js'
}`
}
