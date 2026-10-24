# Tactile Agent · Project website

An English research project page explaining demonstration-guided manipulation through stage intent, object-relative interaction, agentic motion planning, and task-conditioned tactile supervision.

Repository: <https://github.com/iairplane/tactile_agent_page>\
Intended GitHub Pages address: <https://iairplane.github.io/tactile_agent_page/> (available after Pages is enabled and deployment succeeds).

## Included

- An original responsive project page with an interactive architecture diagram.
- A 2:54 English narrated framework film: seven video stages, genuine hand segmentation/keypoints, relative interaction, a tactile primitive tree, task-policy code, and recorded bottle execution.
- Two English experiment explainers: top nested cup (72.6 s) and press-and-turn cap (66 s).
- A silent 16.5 s real-robot preview, with playback speeds and experiment status labelled.
- Interactive experiment stages that seek to the relevant video segment.
- A plot of 25 real action-log sensor windows and an illustrative transition explorer.
- A detailed English architecture article, a three-minute introduction storyboard, and a 60-second script.
- Source provenance, evidence distinctions, editable Markdown, and media reproduction tooling.

The author block is deliberately omitted. The owner's provisional information is in `docs/editorial-notes.md`, pending confirmation.

## Framework film

`assets/bottle-framework-film_EN.mp4` is the final 1920×1080, 30 fps film with English neural narration, burned-in word-timed captions, and embedded chapters. Separate SRT/VTT and a provenance manifest accompany it. The website offers chapter seeking.

The human demonstration is segmented into seven semantic video nodes. New SAM 2.1 / RTMPose outputs are genuine offline reprocessing on that recording. The film explicitly labels the architecture illustration and the recorded task-specific controller. The torque branch is visible but unselected for Run16.

Editable narration and story are under `production/bottle_story/`; large editing intermediates stay local. To reproduce the render with the original sibling research recordings available:

```bash
python scripts/render_bottle_story.py --preview
python scripts/render_bottle_story.py
# Regenerate narration with production/bottle_story/audio/synthesize.py if needed.
python scripts/finalize_bottle_story.py
```

Requires Python with Pillow, NumPy and OpenCV; FFmpeg; and Lato/DejaVu fonts. Narration regeneration also requires `edge-tts` and network access. The final website has no synthesis or model dependencies.

## Preview locally

The deployed website is buildless HTML/CSS/JavaScript with self-hosted media and no external runtime dependencies.

```bash
npm ci
npm run serve
```

Open the printed `http://127.0.0.1:4173` URL. The local server supports byte ranges so video chapter seeking behaves as it does on static hosting.

## Edit and validate

```bash
npm run build:docs
npm run check
npm test
```

`npm test` uses Playwright with `/usr/bin/google-chrome`. Set `CHROME_PATH` if the browser is installed elsewhere. The tests cover desktop/mobile layout, experiment switching, actual video chapter seeking, interactive gates, keyboard tab navigation, reduced-motion behavior, and the detailed documents.

Edit `docs/architecture.md` and `docs/video-script.md`, then run `npm run build:docs` to regenerate `architecture.html` and `video-script.html`.

Reproduce media from a local checkout of the experimental repository:

```bash
python scripts/prepare_media.py --source ../tactile_agent
```

This optional step requires FFmpeg, Pillow, and the original recordings. The published repository already includes the resulting media and needs no access to the robot or source machine.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` validates and publishes the static site from `main`. For a new repository, an administrator must enable **Settings → Pages → Build and deployment → Source: GitHub Actions** once:

<https://github.com/iairplane/tactile_agent_page/settings/pages>

After enabling, rerun the `Publish project page` workflow or push a new commit. Deployment does not require secrets in this repository. If Pages is already configured, pushes to `main` deploy automatically.

## Evidence and scope

- **Cup Run08:** reviewed hardcoded grasp location, scripted low-probe retry, +6 mm correction, ~67 mm lift; tactile imagery recorded in shadow mode. Front RGB/operator review confirm a single cup.
- **Bottle Run16:** online gates use session-relative raw SDK Fz proxies, not calibrated force or torque. 540° total rotation, six segments, five automatic regrasp cycles, release verification, then a 30 mm cap lift. No synchronized tactile RGB in this take.
- **Tube:** offline preparation only.
- **General framework:** real executors are task-specific. An arbitrary-task generic hardware interpreter and broader tactile qualification remain under development.

See `docs/claim-evidence.md` and `assets/media-manifest.json`. No aggregate success rate, publication venue, or unverified authorship is claimed.

## Files

```text
index.html                       Main project page
styles.css / app.js              Layout and interactions
architecture.html                Generated technical walkthrough
video-script.html                Generated introduction storyboard
docs/                            Editable content and editorial records
assets/                          Videos, captions, posters, measured signal data
scripts/build-docs.mjs            Markdown to static HTML
scripts/check-site.mjs            Local reference and content checks
scripts/serve.mjs                 Local HTTP preview with range support
scripts/prepare_media.py          Reproducible video/poster extraction
tests/site.spec.js                Browser integration checks
.github/workflows/pages.yml      Static Pages deployment
```

Visual clarity was inspired by the owner-supplied [RAPID project page](https://yuyaoliu.me/projects/rapid/). All page text, diagrams, layout code, and experiment media here are original to this project; no RAPID research results or media are reused.
