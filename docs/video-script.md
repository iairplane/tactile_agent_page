# Tactile Agent — English introduction video

**Format:** 3:00, 16:9, English narration and authored on-screen text.\
**Title:** Tactile Agent\
**Subtitle:** One demonstration. Object-relative interaction. Task-specific tactile supervision.

The script below is a production storyboard, not a claim that a new narrated movie has already been rendered. Use the existing English experiment videos as evidence inserts. Their captions remain readable; graphics added for this introduction should be placed in separate panels. Mark accelerated footage with its playback factor. Use “recorded shadow signal,” “online predicate,” and “concept diagram” labels where specified.

## Visual grammar

Use generous white space, dark type, one explanation per shot, and smooth diagram reveals. Cyan represents agent/MoveIt planning; gold represents object-relative contact geometry; magenta represents tactile supervision; green marks a passed predicate. Red denotes a recovery request only when supported by the recorded run or explicitly labelled as conceptual. Keep the actual robot footage large. Animate a single active stage, then show the observation that allows its transition.

## Three-minute script

### 00:00–00:13 — The result and the problem

**Narration**

“A robot can see a cup rim or a bottle cap. But seeing where to move does not tell it when contact is right, when to retry, or when a cap is ready to lift.”

**Picture/action:** Split-screen cup extraction and bottle cap lift. Freeze briefly before each successful lift.\
**State overlay:** `CONTACT → ? → LIFT`\
**Tactile overlay:** “What evidence allows the next stage?”\
**Source:** Cup English explainer 56.7–66.6 s; bottle English explainer 59–66 s.

### 00:13–00:29 — The central idea

**Narration**

“Tactile Agent separates those questions. One human demonstration supplies task intent and key interaction relations. The robot plans its own motion, while task-specific tactile predicates supervise contact-dependent progress.”

**Picture/action:** Reveal three colored blocks: intent, relative interaction, tactile supervision. Connect to a robot executor.\
**State overlay:** “Plan goals / Transfer contact geometry / Gate progress”\
**Tactile overlay:** Magenta line connects the supervisor to transition arrows, not to joint commands.\
**Source:** Newly drawn concept diagram.

### 00:29–00:46 — Compile the demonstration

**Narration**

“RGB-D perception follows the hand and object. A compiler turns the demonstration into semantic stages: approach, engage, manipulate, and release. Hand trajectories help explain the action, but they are not replayed as robot waypoints.”

**Picture/action:** Human cup demo, masks and hand keypoints, then a short stage ribbon.\
**State overlay:** `APPROACH → ENGAGE → MANIPULATE → RELEASE`\
**Tactile overlay:** None; do not imply the human contacted robot tactile pads.\
**Source:** Cup English explainer 8–21.6 s; use exact perception footage from the source when possible.

### 00:46–01:03 — Preserve the interaction

**Narration**

“At contact, the important relation is where and how the hand engages the object. We express that relation in an object or local task frame, ground it in the current scene, and adapt it to the robot's actual gripper.”

**Picture/action:** Freeze the rim pinch; draw rim and TCP frames. Move the object-frame graphic while preserving its relation to the contact frame.\
**State overlay:** `T_base_tcp = T_base_object · T_object_tcp`\
**Tactile overlay:** None.\
**Qualification caption:** “Full pose transfer requires an observed object frame.”\
**Source:** Cup English explainer 21.6–27.2 s plus original diagram.

### 01:03–01:19 — Divide control authority

**Narration**

“The agent chooses stage goals. MoveIt computes robot trajectories. A deterministic executor advances when the required evidence arrives. This lets the system replan free-space motion while preserving the geometry that matters at interaction.”

**Picture/action:** Highlight cyan approach, gold contact, and magenta transition. Animate one transition arrow only after its predicate badge turns green.\
**State overlay:** `OBSERVE → GROUND → PLAN → EXECUTE → VERIFY`\
**Tactile overlay:** “Predicates supervise progress.”\
**Source:** Architecture diagram; bottle English explainer 27–36 s. Label generic loop “Architecture”; current hardware routes are task-specific.

### 01:19–01:37 — Select touch for the task

**Narration**

“Touch is not one universal threshold. Tactile images describe contact location and shape. Force signals describe changes in loading and resistance. Fresh sensor windows become contact primitives, then task predicates with explicit validity and recovery rules.”

**Picture/action:** `Sensor channels → Contact primitives → Task predicates`. A cup contact patch branches to role matching; a bottle signal branches to press and release gates.\
**State overlay:** “Continue / Complete / Unload and retry / Hold”\
**Tactile overlay:** “Choose evidence for this interaction.”\
**Source:** Cup tactile images and bottle logged trace. Use “Designed image predicate” for cup and “Online raw proxy” for bottle.

### 01:37–01:57 — Cup experiment

**Narration**

“For nested cups, inner and outer fingers play different roles. The intended supervisor checks each contact pattern separately. This recorded take illustrates a scripted low probe, a six-millimetre correction, and a single-cup lift. Its tactile images were recorded for offline evaluation.”

**Picture/action:** Show probe, unloading, upward correction, and successful lift; place tactile streams beside the robot view.\
**State overlay:** `PROBE → UNLOAD → RAISE 6 mm → REGRASP → LIFT`\
**Tactile overlay:** “Recorded tactile imagery · Shadow evaluation”\
**Persistent evidence caption:** “Scripted retry · One-cup result confirmed from front RGB.”\
**Source:** Cup English explainer 41.8–66.6 s. The robot recording ends at lift/hold.

### 01:57–02:20 — Bottle experiment

**Narration**

“The safety cap uses online tactile feedback. After a contact baseline, a pressure-related change permits rotation. The robot presses and twists, then unloads, resets its wrist, and regrasps. In this run, six segments accumulate five hundred and forty degrees.”

**Picture/action:** Show approach/contact briefly, then six illuminated segment marks with five reset loops.\
**State overlay:** `PRESS → TWIST → UNLOAD → RESET → REGRASP`\
**Tactile overlay:** “Online session-relative Fz proxy · Raw sensor units”\
**Source:** Bottle English explainer 27–50 s. Prefer robot footage and reconstructed action-log trace; there is no synchronized tactile RGB for this run.

### 02:20–02:41 — Show the actual switching evidence

**Narration**

“Lifting requires more than a turn count. Resistance must first build, then remain low in fresh windows while contact stays present. A stationary check confirms the release candidate. Only then does the state machine authorize the thirty-millimetre cap lift.”

**Picture/action:** Trace reveals peak, release limit, two fresh low windows, stationary verification, then the lift. Pause on the predicate before motion resumes.\
**State overlay:** `RELEASE_CANDIDATE → STATIONARY_VERIFY → RELEASE_VERIFIED → LIFT_CAP`\
**Tactile overlay:** “Peak 1.102 / Limit 0.386 / Stationary 0.057”; “Contact retained”; y-axis “Relative raw sensor units.”\
**Source:** Bottle English explainer 50–66 s; values reconstructed from Run16 action log. Do not label the trace as calibrated torque or newtons.

### 02:41–03:00 — Architecture and scope

**Narration**

“These experiments show complementary parts of one architecture: intent from demonstration, interaction in object coordinates, motion from planning, and progress supervised by touch. Today's executors remain task-specific. Every result retains its evidence, so demonstrated capability and the next research step stay clear.”

**Picture/action:** Return to the three-part architecture; end on cup and cap results with their evidence badges.\
**State overlay:** “Demonstration → Task contract → Grounded motion → Evidence”\
**Tactile overlay:** “Cup: shadow imagery / Cap: online predicates”\
**End card:** “Tactile Agent — From a human demonstration to an inspectable robot skill.”\
**Source:** Concept diagram, cup lift, cap lift. Do not add trial-count success rates or an unexecuted test-tube result.

## Optional 60-second cut

| Time | Narration | Visual and evidence label |
|---|---|---|
| 00:00–00:10 | “A human demonstration shows what to do. Tactile Agent turns it into stages, preserving the hand-object relation where contact matters.” | Human cup demo → rim-frame diagram. |
| 00:10–00:21 | “The agent sets goals, MoveIt plans motion, and tactile predicates decide when contact stages can advance. The robot does not replay the human's path.” | Three responsibilities → stage arrow with predicate. |
| 00:21–00:33 | “For cups, contact shape matters. This take shows a scripted probe and correction; tactile images were recorded for offline evaluation.” | Cup probe → +6 mm retry → lift. Persistent “Scripted retry / Shadow tactile.” |
| 00:33–00:47 | “For a safety cap, online relative sensor changes supervise pressing and twisting. Six segments produce five hundred and forty degrees, with five automatic regrasp cycles.” | Bottle loop with 6 segment marks. “Online raw Fz proxy.” |
| 00:47–01:00 | “A sustained resistance drop with contact retained permits the final lift. Intent, relative geometry, and task-specific touch make the execution inspectable.” | Release predicate → 30 mm lift → framework diagram. |

## Editing and narration notes

- Keep the experiment evidence badges visible long enough to read; do not relegate them to a rapidly flashing disclaimer.
- The intended cup predicate is not the cause of the recorded Run08 retry. Show its diagram as the proposed supervision policy, then label the actual recorded motion separately.
- The cap starts upright. Do not use the cap footage to claim a demonstrated bottle-righting skill.
- The cap trace is reconstructed from the execution log. Do not substitute a tactile image from another session and label it as synchronized to Run16.
- The same contact frame graphic may explain transfer, but an animated scene relocation is conceptual unless backed by a corresponding real run.
- Label human footage “Human demonstration” and robot footage “Robot execution.” The recorded robot tasks end at lift/hold and cap lift, respectively.
- Read the full script at a measured pace with short pauses over the equation and predicate trace. Adjust transition holds to reach 3:00 after recording the voiceover; do not rush the evidence labels.

## Source video cue sheet

The following are timestamps **within the existing English explainers**, not timestamps in the new 3:00 storyboard:

| Source | Cue | Interval |
|---|---|---|
| `cup_task_framework_explainer_EN.mp4` | Human demonstration | 8.0–15.4 s |
| same | Perception | 15.4–21.6 s |
| same | Relative relation | 21.6–27.2 s |
| same | Stage graph | 27.2–34.4 s |
| same | Intended tactile policy | 34.4–41.8 s |
| same | Scripted low probe | 41.8–49.7 s |
| same | Reacquire | 49.7–56.7 s |
| same | Single-cup lift | 56.7–66.6 s |
| `medicine_bottle_task_framework_explainer_EN.mp4` | Human demonstration | 4.0–12.5 s |
| same | Task compilation | 12.5–19.5 s |
| same | RGB-D grounding | 19.5–27.0 s |
| same | Approach and contact | 27.0–36.0 s |
| same | Twist/regrasp loop | 36.0–50.0 s |
| same | Release predicate | 50.0–59.0 s |
| same | Cap lift | 59.0–66.0 s |

Original source root: `tactile_agent/outputs/framework_videos_20261023/`. The source renderers, timeline JSONs, English subtitles, and encoding hashes are recorded in `manifest_EN.json`.
