export const meta = {
  name: 'weekly-icon',
  description: 'Generate app icon PNG and splash screen from app domain and primary color',
  phases: [
    { title: 'Icon', detail: 'Analyze app, design symbol, render PNG via Python/Pillow' },
  ],
}

// Args: { appDir: string }
// Example: { appDir: "apps/2026-W28-dose-check" }
//
// Outputs:
//   assets/icon.png          — 1024×1024 app icon
//   assets/adaptive-icon.png — 1024×1024 Android foreground layer (transparent bg)
//   assets/splash.png        — 1284×2778 splash screen

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const appDir = parsedArgs.appDir ?? 'apps/unknown-week'

phase('Icon')
log(`Generating icon for ${appDir}`)

const result = await agent(
  `Generate the app icon for ${appDir}. Follow every step exactly.

## Step 1 — Understand the app

Read ${appDir}/SPEC.md. Extract:
- app_name
- hero_feature (what does this app DO? e.g. reminds, tracks, logs, times)
- problem domain (medications, time, water, sleep, money, etc.)

Find the app's primary color:
- grep -r "primary" ${appDir}/app/ --include="*.ts" --include="*.tsx" | grep "#" | head -5
- Use the hex value found. If none, pick a domain-appropriate color (NOT purple/indigo/violet).

## Step 2 — Design the icon symbol

Pick ONE simple symbol representing the hero action. Rules:
- Single shape or 2-3 combined shapes maximum
- No text, no letters, no app name
- Must read clearly at 48×48px — nothing finer than a bold stroke
- Symbol is white (#FFFFFF) on the primary color background
- Background: rounded square at 1024×1024 with corner radius ~180px

Good symbols by domain:
- medication/pill: a capsule (rounded rect, two halves, one slightly lighter)
- time/clock: circle outline with two line hands
- water/hydration: teardrop shape
- sleep: crescent moon (two overlapping circles, subtract)
- habit/streak: bold checkmark inside a circle
- finance: simple coin circle with a line through
- fitness: lightning bolt

## Step 3 — Install Pillow if needed

python3 -c "import PIL" 2>/dev/null || pip3 install Pillow --quiet

## Step 4 — Write and run /tmp/gen_icon.py

The script must:
1. Create a 1024×1024 RGBA image (white background)
2. Draw the rounded square in the primary color (corner radius 180px)
   Use the rounded_rect helper:
   \`\`\`python
   def rounded_rect(draw, xy, radius, fill):
       x0, y0, x1, y1 = xy
       draw.rectangle([x0+radius, y0, x1-radius, y1], fill=fill)
       draw.rectangle([x0, y0+radius, x1, y1-radius], fill=fill)
       draw.ellipse([x0, y0, x0+radius*2, y0+radius*2], fill=fill)
       draw.ellipse([x1-radius*2, y0, x1, y0+radius*2], fill=fill)
       draw.ellipse([x0, y1-radius*2, x0+radius*2, y1], fill=fill)
       draw.ellipse([x1-radius*2, y1-radius*2, x1, y1], fill=fill)
   \`\`\`
3. Draw the chosen symbol in white, centered, at ~460×460px size
4. Save to /tmp/icon.png as PNG

Run it: python3 /tmp/gen_icon.py

## Step 5 — Create adaptive icon (transparent background)

Write /tmp/gen_adaptive.py — same symbol on a TRANSPARENT (0,0,0,0) background.
Run it. Save to /tmp/adaptive-icon.png

## Step 6 — Create splash screen

Write /tmp/gen_splash.py:
- 1284×2778 RGBA image
- Fill entire background with the primary color
- Draw the same symbol at center, white, ~200×200px
- Save to /tmp/splash.png

Run it.

## Step 7 — Copy to app

cp /tmp/icon.png ${appDir}/assets/icon.png
cp /tmp/adaptive-icon.png ${appDir}/assets/adaptive-icon.png
cp /tmp/splash.png ${appDir}/assets/splash.png

## Step 8 — Verify

ls -lh ${appDir}/assets/
Confirm all three files exist and are > 5KB each.

Report: color used (hex), symbol chosen, file sizes.`,
  { label: 'generate-icon' }
)

log(result)

return { appDir, result }
