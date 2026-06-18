export const meta = {
  name: 'weekly-build',
  description: 'Run the builder agent against an approved SPEC.md to produce the app',
  phases: [
    { title: 'Pre-build', detail: 'Checklist — spec ingestion, component inventory, ambiguity check' },
    { title: 'Build', detail: 'Screen by screen per SPEC.md' },
    { title: 'Self-QA', detail: 'Verify every success criterion' },
    { title: 'Review', detail: 'Manager build quality check before human handoff' },
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
    scope_violations:  { type: 'array', items: { type: 'string' } },
    qa_failures:       { type: 'array', items: { type: 'string' } },
    items_for_human:   { type: 'array', items: { type: 'string' } },
    overall_status:    { type: 'string', enum: ['clean', 'needs_attention', 'blocked'] },
    checkpoint_notes:  { type: 'string' },
  },
  required: ['scope_violations', 'qa_failures', 'items_for_human', 'overall_status', 'checkpoint_notes'],
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
1. Complete the full Pre-Build Checklist from agents/prompts/builder.md before writing any code
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
}

// ─── Phase 4: Manager build quality check ────────────────────────────────────

phase('Review')

const check = await agent(
  `Read the file agents/prompts/manager.md — specifically the "Build Quality Check" section.

Apply every check to this build result:
${JSON.stringify(buildResult, null, 2)}

Also read ${appDir}/SPEC.md to verify that screens_built matches mvp_screens exactly.

Return your findings as structured JSON.`,
  { schema: BUILD_CHECK_SCHEMA }
)

log(`Build quality check: ${check.overall_status}`)

return {
  buildResult,
  check,
  appDir,
  checkpoint_message: buildCheckpointMessage(buildResult, check, appDir),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCheckpointMessage(result, check, dir) {
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

  const flagSection = [
    ...(check.scope_violations.length > 0
      ? check.scope_violations.map(v => `❌ Scope violation: ${v}`)
      : []),
    ...(check.qa_failures.length > 0
      ? check.qa_failures.map(f => `❌ QA failure: ${f}`)
      : []),
    ...(check.items_for_human.length > 0
      ? check.items_for_human.map(i => `⚠️  ${i}`)
      : []),
    ...(check.scope_violations.length === 0 && check.qa_failures.length === 0 && check.items_for_human.length === 0
      ? ['✅ No issues found']
      : []),
  ].join('\n')

  return `## Build Review: ${dir}

**Status:** ${result.status} (${check.overall_status})
**Screens built:** ${result.screens_built.length} — ${result.screens_built.join(', ')}
${sharedSection}

**Self-QA:**
${qaTable}
${blockerSection}

**Manager check:**
${flagSection}

**Notes from builder:**
${result.notes || 'None'}

---
Build written to: ${dir}/

${result.status === 'complete' && check.overall_status === 'clean'
  ? 'To approve: run weekly-publish.js (Phase 5) or manually test and publish via EAS Submit'
  : result.status === 'blocked'
  ? 'To unblock: resolve the blockers above, then re-run weekly-build.js'
  : 'To address issues: review the flags above and decide which to fix before publishing'
}`
}
