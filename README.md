# Palm Light — Make GTA 6 Cover Art

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/astiip/gta6-cover-art-01-bot-v2/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/astiip/gta6-cover-art-01-bot-v2/reward.svg)](https://make.fun/c/gta6-cover-art-01)

A web app that turns your photos into GTA-style cover art: six photo panels,
one giant gradient title, a script subtitle, a star quote, a tagline, a gold
"ORIGINAL COVER ART" seal and a barcode — exported as a PNG to post.

Cover art dulu: the cover comes first. Open the app, the sample set is already
loaded, edit the words, swap in your own photos, pick a grade, export.

## How it works

1. **Photos** — one photo fills all six panels, or click a panel and replace
   just that one. Drag a photo on the cover to move it, scroll to zoom it, or
   use the zoom and offset sliders. Every panel has its own editable label.
2. **Words** — the giant title, script subtitle, tagline and star quote are
   all editable text fields.
3. **Grade** — Sunset, Neon or Dusk: one click re-grades every panel.
4. **Export** — one button writes a PNG at 1920 × 1080, 1080 × 1080 or
   1080 × 1350.

The app is plain static files under `app/` — no network request, no build
step. Photos are read on your own machine and never uploaded. Serve it with
`node serve.ts` and open http://localhost:8080.

## The cover

Original design, original title **PALM LIGHT** with the subtitle
*golden hour, every hour* and the tagline
"SIX FRAMES · ONE CITY · NO CURFEW". No Rockstar logo, artwork or
font is used anywhere. The title lettering is a system heavy sans drawn on
canvas with a sunset gradient; the subtitle is a system italic serif with a
neon-pink glow. The layout is its own: a uniform six-panel grid, the VOL
badge top-left, the gold seal top-right, and the footer line
"A PALM LIGHT PICTURE · STARRING YOU · MADE FROM YOUR OWN PHOTOS".

## Sample photos

- `convertible.jpg`, `neonman.jpg`, `lifeguard.jpg`,
  `boulevard-night.jpg` — made with an image model for this entry, free to use.
- `boulevard.jpg`, `pier.jpg` — the kit's own sample photos, made with an
  image model for make.fun and free to use.

## Files

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/cover.js` — draws the whole poster on canvas (panels, grade,
  title, subtitle, quote, tagline, seal, barcode, footer).
- `app/src/main.js` — wires the editor: photos, crops, words, grade, sizes,
  drag-to-pan, export.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=editor`,
  `?shot=cover&size=…`).
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json`.
