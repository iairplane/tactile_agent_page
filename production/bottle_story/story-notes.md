# Bottle film — editorial and evidence notes

The final film is 174 seconds (2:54), in English, at 1920 × 1080 and 30 fps. It uses the press-and-turn bottle task as a single running example: show the human action, unfold its video segments into a task graph, identify which relations must transfer, select tactile primitives from a tree, reveal the resulting policy, and finish with the actual robot execution and release evidence.

The main visual claim is **one demonstration supplies intent and critical interaction geometry; robot planning supplies feasible motion; task-specific tactile predicates supervise transitions**. The code display is an explanatory policy rendering, not a screen recording of an agent generating and deploying an unreviewed program.

## Seven nodes, eleven source intervals

The source video is `analysis/demo_trim_1110_1274.mp4`, at 15 fps. Trim time zero corresponds to source frame 1110 (74.0 seconds in the original capture). All endpoints below are half-open; boundary frames are not duplicated.

| Video node | Source frames | Trim times | Visible badges | What transfers or is planned |
|---|---:|---:|---|---|
| Approach cap | 1119–1142 | 0.600–2.133 s | PLAN | Live cap standoff and robot-feasible approach. |
| Grasp + press | 1142–1152 | 2.133–2.800 s | RELATIVE · TOUCH | Cap-contact relation; press along the bottle axis; gate rotation from tactile response. |
| Twist | 1152–1183; 1189–1222; 1228–1236 | 2.800–4.867; 5.267–7.467; 7.867–8.400 s | RELATIVE · TOUCH | Rotate about the object axis, with robot-specific travel and retained contact. |
| Reset + regrasp | 1183–1189; 1222–1228; 1236–1240 | 4.867–5.267; 7.467–7.867; 8.400–8.667 s | PLAN · RELATIVE · TOUCH | Plan wrist reset; restore cap contact; establish a new press baseline and gate. |
| Final turn + release | 1240–1248 | 8.667–9.200 s | RELATIVE · TOUCH | Task-axis turn and release verification. |
| Lift cap | 1248–1253 | 9.200–9.533 s | PLAN · RELATIVE · TOUCH | Agent selects the lift goal after release; initial displacement remains along the bottle axis. |
| Place aside | 1253–1265 | 9.533–10.333 s | PLAN | Live placement and retreat; present in the human demonstration only. |

Use a seven-card flowchart with the actual video crop inside every card. The twist and reset cards represent multiple intervals, with a curved loop between them. Give the last card a small **Human demonstration only** label. The recorded robot result ends at cap lift. The master is published as `assets/bottle-framework-film_EN.mp4` in the page repository.

The short regrasp and lift intervals may be held, slowed, or replayed in their cards for legibility. If the full demonstration is shown before the graph, use the real sequence once without fake pauses, then let the diagram deliberately freeze and group it. Seven is the count of semantic groups for the film, not a claim that the original annotation contained seven contiguous segments.

## Timeline

| Film time | Scene | Primary visual |
|---|---|---|
| 0–8 s | Hook | Real cap lift, then intent / geometry / touch labels. |
| 8–20 s | Human demonstration | Effective source action with time ribbon. |
| 20–42 s | Stage graph | Seven video cards, loop and colored control badges. |
| 42–58 s | Perception | Same-source moving RGB, mask and hand landmark panels at 0.5x. |
| 58–74 s | Relative transfer | Hand–cap relation → gripper–cap relation → grounded target. |
| 74–84 s | Planning | Free-space plan lane beside constrained interaction lane. |
| 84–106 s | Tactile tree | Images, forces and moments; select four cap-task conditions. |
| 106–124 s | Task policy | Fourteen-line illustrative code with predicate highlights. |
| 124–146 s | Real robot loop | Actual robot footage at 8.7x; six twist segments and five wrist resets. |
| 146–164 s | Release evidence | Actual peak / drop / contact / stationary check, then cap lift at 1x. |
| 164–174 s | Closing | Graph, tactile tree and robot result reunite. |

The final 343-word narration is recorded in `audio/narration.json`, including exact subtitle cues. It uses a synthetic English voice, not a recording of a project author. Use slow, purposeful reveals, not a stream of titles. The intended reference is RAPID's clean academic explanation: white space, visual hierarchy, compact text, source footage, and diagrams animated in the same order as the reasoning. Reuse neither the reference site's branding nor its media.

## Perception and relative geometry

The film uses actual SAM 2.1 Hiera Small temporal video propagation and per-frame RTMPose-m Hand5 inference on source frames 1146–1248. Three synchronized crops show RGB, hand/object segmentation, and the predicted hand landmarks at 0.5x speed. Initial manual box prompts and outputs are recorded in `assets/evidence.json` and its referenced perception files. The overlays are offline reprocessing of the demonstration for this film; they are not claimed to be Run16's historical live input. Occluded landmarks remain model estimates.

The expanded transfer interpretation is:

```text
T_cap_hand = inverse(T_camera_cap) @ T_camera_hand
T_cap_tcp  = retarget(T_cap_hand, gripper_geometry)
T_base_tcp = T_base_cap_live @ T_cap_tcp
```

The final panel is labelled **Architecture diagram · use only observable pose components**. The observed cap center and bottle axis support an axial task frame. The round black cap does not supply a unique visual yaw, and the source contract does not prove a fully recovered human-to-cap SE(3) target. Run16 uses a live robot-aligned cap frame and a reviewed grasp direction. A rotation arrow about the axis describes the intended task, not a measured yaw time series.

The film's equation panel displays the final composition `T_base,tcp = T_base,object · T_object,tcp`, between “Hand relative to the cap” and “Gripper relative to the cap” views. A visible gripper-retargeting block distinguishes contact transfer from directly mapping hand landmarks to robot joints. The three equations above retain the expanded interpretation for accompanying text.

## Tactile tree and selection

Make the representation library a literal tree. Three branches are enough to remain readable:

- **Images:** RGB / WARPED_IMG / DIFF_IMG → contact shape and location; contact area or indentation; marker motion and slip.
- **Forces:** FORCE6D Fx / Fy / Fz → contact presence; press response; resistance change; qualified task-axis or tangential force.
- **Moments:** FORCE6D Tx / Ty / Tz → twisting moment; offset/load moment.

The displayed force branch selects **Contact & press response** and **Retention & release proxy**. These two leaves expand into four policy conditions: `contact_present`, `press_response`, `contact_retained`, and `release_verified`. Their roles are **Contact → Press**, **Press → Twist**, **Continue / Regrasp**, and **Verify → Lift**. Torque remains visible but dimmed. This directly addresses the user's request that the framework choose from image, force, and torque representations instead of using one universal threshold.

For Run16, the selected implementation uses session-relative raw SDK Fz proxies. The full FORCE6D schema being available does not establish calibrated torque in this run. Images from another session may illustrate the library, with their provenance made clear, but must not appear as synchronized cap-execution tactile footage.

## Code panel

The final fourteen-line pseudocode is identical in `story.json`, `docs/video-script.md`, and `scripts/render_bottle_story.py`. Use a small, persistent **Illustrative task policy** label. The helpers are intentionally concise:

- `require` halts progression on a missing contact or failed pressing condition.
- `fresh_prepress_window` establishes the stationary baseline at the start of each segment, including after regrasp.
- `press_until_response` uses bounded axial pressing and fresh tactile evidence to establish engagement.
- `contact_present` admits asymmetric loading; it does not require equal left/right signals.
- `release_candidate` requires a prior resistance peak, sufficient turning, two fresh low windows, and retained contact.
- `stationary_confirm` reads another fresh stationary window before authorizing the lift.
- `twist_segment` uses geometry to choose one bounded wrist segment. The recorded profile uses downfeed during the first revolution and helical upfeed on later turns.
- `bounded_regrasp_cycles` condenses the actual runner's bounds on motion, retries, and reset cycles. The final conditional lift requires `released` to be true.

The tree scene selects the task-relevant leaves; the following scene reveals the code beside the four policy conditions and highlights its lines. Do not visually claim that an online language model approved every transition; the recorded execution uses a predeclared deterministic runner.

## Run16 facts for the final evidence panel

| Quantity | Value |
|---|---:|
| Twist geometry | 54 × 10° = 540° |
| Wrist segments | Six 90° segments |
| Automatic resets/regrasps | Five |
| Global resistance peak | 1.1020157609 |
| Final release limit | 0.3857055163 = 35% of peak |
| Two fresh candidate windows | 0.0773481817; 0.1152006566 |
| Stationary verification window | 0.0567247366 |
| Contact retained | 0.3182583798 > 0.0156759458 |
| Final cap lift | 30 mm along the bottle axis |
| Run result | `release_verified`; completed |

Plot only the actual median-window points. Baselines reset between wrist segments, so avoid a smooth physical-force trace interpolated across resets. The y-axis must say **Relative raw sensor units**, and the caption must say **Reconstructed from the execution log**. No synchronized tactile RGB was recorded for this run.

The human demonstration has three visible regrasp intervals; the robot needed five resets. This is useful evidence of the framework's intent: it preserves the task and interaction, while choosing robot-feasible motions and repetition counts. Do not imply five was copied from the human.

## Evidence provenance

- Human timing and authority: `runs/live/medicine_bottle_demo_20261023_01/analysis/stage_plan.json` and `stage_contract.review.json`.
- Current execution facts: `runs/live/medicine_bottle_execution_20261023_16_video_fast/stage_report.json` and `action_log.json`.
- Actual online scalar evaluator: `src/demo2gripper/medicine_bottle_tactile_presence.py`.
- Runtime motion and stationary release verification: `scripts/run_medicine_bottle_task.py`.
- Public extracted data: `assets/bottle-signal.json` in the page repository.
- Current evidence summary: `outputs/framework_videos_20261023/README_EN.md` in the source project.

The older stage contract is useful for task grouping, but its initial review-only status and unused force/torque rules must not be mistaken for the later Run16 configuration. Use the current scalar evaluator and Run16 action log to explain what actually controlled the robot.
