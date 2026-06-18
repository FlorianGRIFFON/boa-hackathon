export const meta = {
  name: 'weekly-publish',
  description: 'Build and submit the app to Google Play internal track',
  phases: [
    { title: 'Pre-flight', detail: 'Verify eas.json, app.config.ts, version bump' },
    { title: 'Build', detail: 'EAS cloud build — Android production AAB' },
    { title: 'Submit', detail: 'EAS submit to Google Play internal track' },
  ],
}

// Args shape: { appDir: string }
// Example: { appDir: "apps/2026-W28-sleep-tracker" }
// Requires: eas login already done, Google Play app created, eas.json present in appDir

const PREFLIGHT_SCHEMA = {
  type: 'object',
  properties: {
    ready:           { type: 'boolean' },
    blockers:        { type: 'array', items: { type: 'string' } },
    app_name:        { type: 'string' },
    package_name:    { type: 'string' },
    version:         { type: 'string' },
    version_code:    { type: 'integer' },
    notes:           { type: 'string' },
  },
  required: ['ready', 'blockers', 'app_name', 'package_name', 'version', 'version_code'],
}

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const appDir = parsedArgs.appDir ?? 'apps/unknown-week'

// ─── Phase 1: Pre-flight ──────────────────────────────────────────────────────

phase('Pre-flight')
log(`Publishing ${appDir} to Google Play`)

const preflight = await agent(
  `Run pre-flight checks before publishing ${appDir} to Google Play.

1. Read ${appDir}/app.config.ts — verify:
   - android.package is set (not APP_SLUG placeholder)
   - version is set
   - android.versionCode is set (integer, increment from last build or set to 1 if first)

2. Check ${appDir}/eas.json exists. If not, copy agents/templates/eas.json.template → ${appDir}/eas.json

3. Run: cd ${appDir} && eas whoami
   Confirm EAS CLI is authenticated. If not authenticated, report as a blocker.

4. Check that google-play-key.json exists in ${appDir}/ (needed for automated submit).
   If missing, note it — submit step will require manual upload instead.

5. If android.versionCode is missing from app.config.ts, add it as 1.
   If it exists, increment it by 1. Edit the file.

Report: ready (true/false), any blockers, app_name, package_name, version, version_code.`,
  { schema: PREFLIGHT_SCHEMA, label: 'pre-flight' }
)

log(`App: ${preflight.app_name} (${preflight.package_name}) v${preflight.version} (${preflight.version_code})`)

if (!preflight.ready || preflight.blockers.length > 0) {
  return {
    status: 'blocked',
    appDir,
    blockers: preflight.blockers,
    checkpoint_message: `## Publish Blocked: ${appDir}\n\n**Blockers:**\n${preflight.blockers.map(b => `- ${b}`).join('\n')}\n\nResolve these then re-run weekly-publish.js`,
  }
}

// ─── Phase 2: Build ───────────────────────────────────────────────────────────

phase('Build')
log('Starting EAS cloud build — this takes 10-20 minutes')

const build = await agent(
  `Run the EAS production build for ${appDir}.

Command: cd ${appDir} && eas build --platform android --profile production --non-interactive

This will take 10-20 minutes. Wait for it to complete.

If the build succeeds: report the build ID and download URL.
If the build fails: report the full error output as a blocker.`,
  { label: 'eas-build' }
)

log(`Build result: ${build}`)

// ─── Phase 3: Submit ──────────────────────────────────────────────────────────

phase('Submit')

const submit = await agent(
  `Submit the Android build to Google Play internal track for ${appDir}.

First check if ${appDir}/google-play-key.json exists:
- If YES: run: cd ${appDir} && eas submit --platform android --profile production --non-interactive
- If NO: the human must upload the AAB manually in Google Play Console.
  Report the manual upload instructions and where to find the AAB file from the build output.

Build context: ${build}

Report the outcome.`,
  { label: 'eas-submit' }
)

log(`Submit result: ${submit}`)

return {
  status: 'complete',
  appDir,
  preflight,
  build,
  submit,
  checkpoint_message: `## Published: ${preflight.app_name} v${preflight.version}

**Package:** ${preflight.package_name}
**Version code:** ${preflight.version_code}

**Build:** ${build}

**Submit:** ${submit}

---
Next: open Google Play Console → Internal testing → promote to production when ready.`,
}
