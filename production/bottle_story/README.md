# Bottle framework film — production sources

The final English film is `../../assets/bottle-framework-film_EN.mp4` (174 seconds, 1920×1080, 30 fps). Its website-ready manifest is `../../assets/bottle-framework-film-manifest.json`.

- `story.json` and `story-notes.md`: scene intent, actual source intervals, control authority, original diagram specification, and evidence boundaries.
- `audio/narration-source.json`: editable English speech.
- `audio/narration.json`, SRT and VTT: final timed narration and captions.
- `audio/synthesize.py`: regenerate natural neural narration; see the audio README for dependencies and provenance.
- `assets/evidence.json`: original asset preparation record. Its `repeat` node is a longer supporting excerpt (1189–1248); the final film narrows node 5 to the final turn/release-check interval1240–1248, as recorded in the final film manifest and story.
- `assets/perception/*-crop-video.mp4`: synchronized real RGB, SAM2.1 video masks, and RTMPose hand landmarks, newly computed on recorded source frames1146–1248. These are offline replay outputs, not evidence of historical live input to Run16.
- `assets/perception/001146_pose_crop.png`: same-source keyframe used in the conceptual relation-transfer panel.

Render with `scripts/render_bottle_story.py`; mux audio, chapters, and provenance with `scripts/finalize_bottle_story.py`. The original human and robot recordings must exist in the sibling `tactile_agent` experiment checkout. They are identified by relative source paths and SHA-256 in the final manifest.

The ignored local intermediates include the silent full render, uncompressed narration, raw clips, per-frame predictions, and contact sheets. The selected perception clips included here are sufficient for the final renderer together with the original experiment recordings. Full inference scripts/prompts and predictions remain in the local preparation directory.

The film uses original layout and diagrams; no reference-video images, music, narration or branding are reused. All authored display text and speech are English.
