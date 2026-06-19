export const meta = {
  name: 'weekly-assets',
  description: 'Generate app icon and Play Store listing — runs weekly-icon then weekly-store-listing',
  phases: [
    { title: 'Icon', detail: 'Design and render app icon to PNG' },
    { title: 'Listing', detail: 'Write Play Store title, descriptions, and keywords' },
  ],
}

// Args: { appDir: string }
// Example: { appDir: "apps/2026-W28-dose-check" }

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const appDir = parsedArgs.appDir ?? 'apps/unknown-week'

phase('Icon')
const iconResult = await workflow('weekly-icon', { appDir })
log(`Icon done`)

phase('Listing')
const listingResult = await workflow('weekly-store-listing', { appDir })
log(`Listing done`)

return {
  appDir,
  iconResult,
  listingResult,
  message: `Assets complete.\nIcon → ${appDir}/assets/\nStore listing → ${appDir}/store/listing.md`,
}
