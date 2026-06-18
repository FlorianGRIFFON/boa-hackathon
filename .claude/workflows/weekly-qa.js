export const meta = {
  name: 'weekly-qa',
  description: 'Static code audit + screenshot — Maestro tests run manually by human',
  phases: [
    { title: 'Pre-check', detail: 'Verify app installed, simulator booted, read SPEC.md + BUILD_RESULT.md' },
    { title: 'Screenshot', detail: 'Capture current simulator screen for each major screen' },
    { title: 'Code Audit', detail: 'Read all screen + component files, check against ui-design rules' },
    { title: 'Report', detail: 'Write QA_REPORT.md, return structured report + manual test command' },
  ],
}

// Args shape: { appDir: string }
// Example: { appDir: "apps/2026-W26" }
// Requires: simulator booted, app installed via expo run:ios
// Maestro tests are NOT run here — run them manually:
//   maestro test <appDir>/tests/maestro/

const QA_REPORT_SCHEMA = {
  type: 'object',
  properties: {
    app_dir:         { type: 'string' },
    overall_verdict: { type: 'string', enum: ['pass', 'pass_with_flags', 'fail', 'blocked'] },
    visual_qa: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rule:     { type: 'string' },
          result:   { type: 'string', enum: ['pass', 'fail'] },
          screen:   { type: 'string' },
          evidence: { type: 'string' },
        },
        required: ['rule', 'result', 'screen', 'evidence'],
      },
    },
    known_gaps:          { type: 'array', items: { type: 'string' } },
    blockers:            { type: 'array', items: { type: 'string' } },
    manual_test_command: { type: 'string' },
    summary:             { type: 'string' },
  },
  required: ['app_dir', 'overall_verdict', 'visual_qa', 'known_gaps', 'blockers', 'manual_test_command', 'summary'],
}

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const appDir = parsedArgs.appDir ?? 'apps/unknown-week'

// ─── Phase 1: Pre-check ───────────────────────────────────────────────────────

phase('Pre-check')
log(`Running static QA for ${appDir}`)

const precheck = await agent(
  `Complete the Pre-QA checklist for ${appDir}:

1. Verify the simulator is booted: xcrun simctl list devices | grep Booted
2. Verify the app is installed: xcrun simctl listapps booted | grep <bundle-id from ${appDir}/app.config.ts>
3. Read ${appDir}/SPEC.md — note the mvp_screens and success_criteria
4. Read ${appDir}/BUILD_RESULT.md — note any known gaps the builder flagged

Report: simulator booted (yes/no), app installed (yes/no), any blockers.`,
  { label: 'pre-check' }
)

log(precheck)

// ─── Phase 2: Screenshots ─────────────────────────────────────────────────────

phase('Screenshot')
log('Capturing simulator screenshots')

const screenshots = await agent(
  `Take screenshots of the current simulator state for ${appDir}.

1. Create the directory: mkdir -p ${appDir}/tests/screenshots

2. Take a screenshot of whatever is currently on screen:
   xcrun simctl io booted screenshot ${appDir}/tests/screenshots/current.png

3. If the app is on its home/main screen already, also try to capture:
   - Launch fresh via: xcrun simctl launch booted <bundle-id from app.config.ts>
   - Wait 2 seconds, then screenshot: xcrun simctl io booted screenshot ${appDir}/tests/screenshots/launch.png

Report: which screenshots were successfully saved and their paths. Do not fail if a screenshot cannot be taken — just report it.`,
  { label: 'screenshots' }
)

log(screenshots)

// ─── Phase 3: Code audit ──────────────────────────────────────────────────────

phase('Code Audit')
log('Running static code audit against ui-design rules')

const audit = await agent(
  `Read .claude/rules/ui-design.md in full. Then audit every file in ${appDir}/app/, ${appDir}/components/, and any shared-ui components referenced by this app.

For each rule below, check ALL screen and component files and report pass or fail with exact file + line number evidence:

**Emoji audit**
Rule: No emoji used as UI elements (buttons, labels, section headers, status indicators, empty states, onboarding steps, paywall features).
Check: grep for emoji characters in JSX/TSX. User-generated content fields are exempt.

**Color audit**
Rule: Primary action color must not be indigo/violet/purple (#6366F1, #8B5CF6 family). No gradients as button fills or card backgrounds. Every app must override colors.primary with a domain-specific accent before shipping.
Check: look for color values in StyleSheet, theme overrides, and any hardcoded hex values.

**Em dash audit**
Rule: Maximum 2 em dashes (—) per screen. Never used as a label—value separator.
Check: count em dashes per screen file. Flag any "label — value" pattern.

**Copy audit**
Rule: Banned phrases: "Start your journey", "Level up your", "Boost your productivity", "Track anything", "Your [noun], your way", "Get started" as a primary CTA. Paywall features must be written as outcomes, not feature names.
Check: grep for banned phrases in all screen files.

**Typography audit**
Rule: Maximum 3 distinct font sizes per screen. No letterSpacing on body text (allowed only on uppercase caption/label text at small sizes).
Check: count unique fontSize values rendered on each screen (including imported components). Flag letterSpacing on non-caption text.

**Layout audit**
Rule: One shadow level per app, applied to at most one layer. Pick one border radius and apply it consistently (mixing radius values is a violation). Whitespace over density.
Check: scan for multiple shadowOpacity/elevation values, multiple borderRadius values on the same screen.

**Empty state audit**
Rule: One short sentence only. Not a heading + subtext + illustration + CTA.
Check: look for empty state JSX — flag any that combine a heading element with a subtext element.

For each rule, return:
- rule name
- result: pass or fail
- screen: which file(s) are affected
- evidence: exact line number(s) and the offending code or a confirmation it's clean`,
  { label: 'code-audit' }
)

log(audit)

// ─── Phase 4: Report ──────────────────────────────────────────────────────────

phase('Report')

const report = await agent(
  `Read agents/prompts/qa.md — specifically the "QA Report" section for the report format.

You have these inputs:
- Pre-check: ${precheck}
- Screenshots: ${screenshots}
- Code audit: ${audit}
- App dir: ${appDir}
- BUILD_RESULT.md is at ${appDir}/BUILD_RESULT.md — read it to list known gaps

Your job:
1. Parse the code audit findings into structured visual_qa entries (one entry per rule checked)
2. Determine overall_verdict:
   - "pass" — no rule violations
   - "pass_with_flags" — only soft flags (letterSpacing on labels, purple in data palette, etc.)
   - "fail" — one or more hard rule violations
   - "blocked" — app not installed or simulator not booted
3. Write QA_REPORT.md to ${appDir}/QA_REPORT.md using the format from agents/prompts/qa.md.
   Include a "Run Maestro manually" section at the top with the exact command:
     maestro test ${appDir}/tests/maestro/
4. Return the structured QAReport JSON.`,
  { schema: QA_REPORT_SCHEMA, label: 'compile-report' }
)

return {
  report,
  appDir,
  checkpoint_message: buildCheckpointMessage(report),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCheckpointMessage(report) {
  const verdictIcon = {
    pass:            '✅',
    pass_with_flags: '⚠️',
    fail:            '❌',
    blocked:         '🚫',
  }[report.overall_verdict] ?? '?'

  const visualTable = report.visual_qa.map(v =>
    `${v.result === 'pass' ? '✅' : '❌'} ${v.rule} — ${v.screen}\n   ${v.evidence}`
  ).join('\n')

  const blockerSection = report.blockers.length > 0
    ? `\n**Blockers:**\n${report.blockers.map(b => `- ${b}`).join('\n')}`
    : ''

  return `## QA Report: ${report.app_dir}

**Verdict:** ${verdictIcon} ${report.overall_verdict.toUpperCase()}

**Visual / Code Audit:**
${visualTable || 'No checks ran'}

**Known gaps (not counted as failures):**
${report.known_gaps.map(g => `- ${g}`).join('\n') || 'None'}
${blockerSection}

**Run Maestro tests manually:**
\`\`\`
${report.manual_test_command}
\`\`\`

**Summary:** ${report.summary}

---
Full report: ${report.app_dir}/QA_REPORT.md
Screenshots: ${report.app_dir}/tests/screenshots/

${report.overall_verdict === 'pass' || report.overall_verdict === 'pass_with_flags'
  ? 'To publish: trigger weekly-publish.js (Phase 5) after Maestro passes manually'
  : 'To fix: address violations above, then re-run weekly-qa.js'
}`
}
