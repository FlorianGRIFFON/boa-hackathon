export const meta = {
  name: 'weekly',
  description: 'Full weekly pipeline: brainstorm → build → assets. Stops after assets for manual QA.',
  phases: [
    { title: 'Brainstorm', detail: 'Research, validate, write SPEC.md' },
    { title: 'Build', detail: 'Scaffold, build screens, self-QA, manager review' },
    { title: 'Assets', detail: 'Generate app icon and Play Store listing copy' },
  ],
}

// Args shape: { week: string, category?: string }
// Example: { week: "2026-W28", category: "productivity" }
//
// No human checkpoint between brainstorm and build — runs fully automated.
// After this workflow completes, do your manual QA, then run weekly-publish.js.

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const week     = parsedArgs.week     ?? 'unknown-week'
const category = parsedArgs.category ?? null

// ─── Phase 1: Brainstorm ──────────────────────────────────────────────────────

phase('Brainstorm')
log(`Week ${week}${category ? ` · category: ${category}` : ''}`)

const brainstormResult = await workflow('weekly-brainstorm', { week, category })

if (brainstormResult.check?.hard_failures?.length > 0) {
  log(`Brainstorm hit max retries — hard failures remain. Stopping before build.`)
  return {
    status: 'brainstorm_failed',
    week,
    brainstormResult,
    message: brainstormResult.checkpoint_message,
  }
}

const appDir = brainstormResult.appDir
log(`Spec ready: "${brainstormResult.spec?.app_name}" → ${appDir}`)

// ─── Phase 2: Build ───────────────────────────────────────────────────────────

phase('Build')
log(`Starting build for ${appDir}`)

const buildResult = await workflow('weekly-build', { appDir })

log(`Build complete: ${buildResult.buildResult?.status ?? 'unknown'}`)

// ─── Phase 3: Assets ──────────────────────────────────────────────────────────

phase('Assets')
log(`Generating icon and store listing for ${appDir}`)

const assetsResult = await workflow('weekly-assets', { appDir })

log(`Assets complete`)

return {
  status: buildResult.buildResult?.status ?? 'unknown',
  week,
  appDir,
  spec: brainstormResult.spec,
  buildResult,
  assetsResult,
  message: buildResult.checkpoint_message,
}
