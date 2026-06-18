export const meta = {
  name: 'weekly-brainstorm',
  description: 'Run the brainstorm agent to produce a validated app spec for human review',
  phases: [
    { title: 'Research', detail: 'Market research and competition analysis' },
    { title: 'Validate', detail: 'Kill tests and one-week reality check' },
    { title: 'Spec', detail: 'Write SPEC.md and structured output' },
    { title: 'Review', detail: 'Manager completeness check — retries automatically on hard failures' },
  ],
}

// Args shape: { week: string, appDir: string, category?: string }
// Example: { week: "2026-W26", appDir: "apps/2026-W26", category: "productivity" }
// The human (or cron) provides the week string — the workflow cannot call Date.now()

const APP_SPEC_SCHEMA = {
  type: 'object',
  properties: {
    app_name:                    { type: 'string' },
    problem_statement:           { type: 'string' },
    target_user:                 { type: 'string' },
    why_existing_solutions_fail: { type: 'string' },
    hero_feature:                { type: 'string' },
    out_of_scope:                { type: 'array', items: { type: 'string' }, minItems: 3 },
    monetization: {
      type: 'object',
      properties: {
        free_tier:   { type: 'string' },
        paid_tier:   { type: 'string' },
        price_usd:   { type: 'number' },
        trial_days:  { type: 'integer' },
      },
      required: ['free_tier', 'paid_tier', 'price_usd', 'trial_days'],
    },
    willingness_to_pay_signal: { type: 'string' },
    mvp_screens:        { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 },
    success_criteria:   { type: 'array', items: { type: 'string' }, minItems: 3 },
  },
  required: [
    'app_name', 'problem_statement', 'target_user', 'why_existing_solutions_fail',
    'hero_feature', 'out_of_scope', 'monetization', 'willingness_to_pay_signal',
    'mvp_screens', 'success_criteria',
  ],
}

const SPEC_CHECK_SCHEMA = {
  type: 'object',
  properties: {
    hard_failures: { type: 'array', items: { type: 'string' } },
    soft_flags:    { type: 'array', items: { type: 'string' } },
    confidence:    { type: 'string', enum: ['high', 'medium', 'low'] },
    summary:       { type: 'string' },
  },
  required: ['hard_failures', 'soft_flags', 'confidence', 'summary'],
}

// Normalise args — the runtime may deliver args as a plain object or as a string.
const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const week     = parsedArgs.week     ?? 'unknown-week'
const appDir   = parsedArgs.appDir   ?? 'apps/unknown-week'
const category = parsedArgs.category ?? null

// ─── Retry loop: brainstorm → completeness check → retry with failures as constraints

const MAX_ATTEMPTS = 3
let spec = null
let check = null
let previousFailures = []
let attempt = 0

while (attempt < MAX_ATTEMPTS) {
  attempt++

  // ── Brainstorm ────────────────────────────────────────────────────────────
  phase('Research')
  log(`Brainstorm attempt ${attempt}/${MAX_ATTEMPTS}${previousFailures.length > 0 ? ' (with corrective feedback)' : ''}`)

  const feedbackBlock = previousFailures.length > 0
    ? `\nCONSTRAINTS FROM PREVIOUS ATTEMPT — you must not repeat these mistakes:
${previousFailures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Revise every aspect of the spec that caused these failures before proceeding.
`
    : ''

  spec = await agent(
    `Read the file agents/prompts/brainstorm.md and follow the instructions in it exactly.

Your context for this run:
- Week: ${week}
- App directory: ${appDir}
- Category hint: ${category ?? 'any — pick the strongest problem you find in your research'}
${feedbackBlock}
Steps to complete:
1. Follow the full 8-step process in agents/prompts/brainstorm.md
2. When you reach Step 8, create the directory ${appDir}/ if it does not exist
3. Write SPEC.md to ${appDir}/SPEC.md using the exact format specified in the prompt
4. Return the structured spec JSON

Do not skip research steps to save time. The quality of the spec directly determines whether the app is worth building.`,
    { schema: APP_SPEC_SCHEMA, label: `brainstorm-attempt-${attempt}` }
  )

  log(`Spec generated: "${spec.app_name}" — ${spec.mvp_screens.length} screens, $${spec.monetization.price_usd}/mo`)

  // ── Manager completeness check ────────────────────────────────────────────
  phase('Review')

  check = await agent(
    `Read the file agents/prompts/manager.md — specifically the "Spec Completeness Check" section.

Apply every check to this spec:
${JSON.stringify(spec, null, 2)}

Return your findings as structured JSON.`,
    { schema: SPEC_CHECK_SCHEMA, label: `check-attempt-${attempt}` }
  )

  if (check.hard_failures.length === 0) {
    log(`Spec passed on attempt ${attempt} (confidence: ${check.confidence})`)
    break
  }

  log(`Attempt ${attempt} failed — ${check.hard_failures.length} hard failure(s):`)
  check.hard_failures.forEach(f => log(`  ❌ ${f}`))

  previousFailures = check.hard_failures

  if (attempt < MAX_ATTEMPTS) {
    log(`Retrying automatically with failure feedback...`)
  } else {
    log(`Max attempts (${MAX_ATTEMPTS}) reached. Returning last spec for human review.`)
  }
}

// ─── Return result for human checkpoint ──────────────────────────────────────

return {
  spec,
  check,
  appDir,
  week,
  attempts: attempt,
  checkpoint_message: buildCheckpointMessage(spec, check, attempt),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCheckpointMessage(spec, check, attempts) {
  const attemptNote = attempts > 1 ? `\n> Passed after ${attempts} attempts (auto-retried ${attempts - 1}x with corrective feedback)` : ''

  const flags = [
    ...(check.hard_failures.length > 0
      ? check.hard_failures.map(f => `❌ HARD FAILURE: ${f}`)
      : []),
    ...(check.soft_flags.length > 0
      ? check.soft_flags.map(f => `⚠️  ${f}`)
      : []),
    ...(check.hard_failures.length === 0 && check.soft_flags.length === 0
      ? ['✅ No issues found']
      : []),
  ].join('\n')

  return `## Spec Review: ${spec.app_name}
${attemptNote}

**Idea:** ${spec.problem_statement}
**Target user:** ${spec.target_user}
**Hero feature:** ${spec.hero_feature}
**Price:** $${spec.monetization.price_usd}/month · ${spec.monetization.trial_days}-day trial

**Screens (${spec.mvp_screens.length}):**
${spec.mvp_screens.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Out of scope:**
${spec.out_of_scope.map(s => `- ${s}`).join('\n')}

**Why users will pay:** ${spec.willingness_to_pay_signal}

**Completeness check (confidence: ${check.confidence}):**
${flags}

---
Spec written to: ${appDir}/SPEC.md

${check.hard_failures.length === 0
  ? `To proceed: run weekly-build.js with args { appDir: "${appDir}" }`
  : `Max retries reached. Review failures above and re-run with specific direction.`
}`
}
