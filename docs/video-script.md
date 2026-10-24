# Tactile Agent — Bottle framework film

**Duration:** 2:54 (174 seconds). **Format:** 16:9, 1920 × 1080, 30 fps. **Language:** English narration and authored on-screen text.

[Watch or download the film](../assets/bottle-framework-film_EN.mp4)

This is the script and cue sheet for the bottle-specific introduction film. It follows one recorded human demonstration through a video-node task graph, perception, relative interaction transfer, motion planning, tactile primitive selection, a task-policy visualization, and the recorded robot result.

The exact final narration below contains **343 words**. It is generated with a synthetic English voice; it is not a recording of a project author.

## The visual argument

**One demonstration supplies intent and critical interaction geometry. Robot planning supplies feasible motion. Task-specific tactile conditions supervise progress.**

The film makes this division visible before showing the robot result. Each stage is linked to the corresponding part of the human video. Cyan denotes agent planning, gold denotes object-relative geometry, magenta denotes tactile supervision, and green denotes a passed condition. The visual style uses white space, large typography, actual footage, and sequential diagram reveals.

## Final narration and picture

### 00:00–00:08 — One demonstration, three responsibilities

> One demonstration. A robot plans the motion, transfers the interaction, and checks progress through touch.

**Picture:** Human and robot footage appear side by side, introducing intent, relative geometry, and touch.

### 00:08–00:20 — Watch the human task

> Here, a person presses and twists a safety cap, resets their grip, then removes it. The demonstration gives us the structure of a task.

**Picture:** The effective human action plays at its original speed. A stage ribbon follows the approach, grasp/press, twist/regrasp, cap release/lift, and placement.

### 00:20–00:42 — Unfold the video into seven semantic stages

> Each segment becomes a node: approach, grasp and press, twist, reset and regrasp, check release, lift, and place aside. The agent plans free motion. At contact, it preserves object-relative geometry. Touch governs transitions. Placement belongs to the human demonstration; the robot run ends at lift.

**Picture:** Seven cards contain actual clips from the human demonstration. PLAN is cyan, RELATIVE is gold, and TOUCH is magenta. The twist/regrasp loop remains visible. The placement card is marked HUMAN ONLY.

### 00:42–00:58 — Show the hand and object evidence

> Perception locates the object and follows the hand. Masks separate image regions; keypoints describe hand configuration. These overlays connect the task stages to visible evidence in the demonstration.

**Picture:** Three synchronized moving crops show recorded RGB, SAM 2.1 hand/object masks, and RTMPose-m Hand5 landmarks. The outputs are genuine offline reprocessing of source frames 1146–1248, replayed at 0.5x with the source frame displayed.

### 00:58–01:14 — Transfer the interaction relation

> At contact, the hand's position and orientation are expressed relative to the object. A gripper adapter maps this relation to robot geometry. Grounding it in the current scene produces a robot target.

**Picture:** A measured image overlay of the human hand and a recorded robot grasp flank an original interaction-frame diagram. The composition equation appears below. This panel explains retargeting; it does not claim that the symmetric cap provides a fully observed yaw.

### 01:14–01:24 — Plan the robot motion

> For free-space stages, the agent sets a goal. A motion planner connects that goal to the robot's current configuration.

**Picture:** Recorded robot approach at 2.3x sits beside four cards: goal, constraint, trajectory, and transition.

### 01:24–01:46 — Choose tactile primitives for this task

> The tactile library branches into images, forces, and torques. Each supports different contact primitives. For this bottle, select contact, pressing, contact retention, and release. The recorded controller uses changes in raw force channels. Torque is a possible input, but was not used in this run.

**Picture:** A literal tree branches into contact images, force response, and torque response. The agent selects contact/press response and retention/release proxy leaves for this bottle task.

### 01:46–02:04 — Compose the task-specific policy

> The selected primitives become task conditions. This illustrative policy shows the composition: wait for pressing evidence, rotate while contact remains, reset and regrasp when needed, then verify release before lifting. The recorded hardware executor is task-specific.

**Picture:** Four selected conditions appear beside the fourteen-line pseudocode shown below. Code reveals progressively, with an explicit ILLUSTRATIVE PSEUDOCODE label.

### 02:04–02:26 — Execute the recorded twist/regrasp loop

> Now the robot executes. Pressing evidence permits the first twist. The first turn feeds down; later turns follow the thread upward. Between segments, the robot unloads, resets its wrist, and regrasps. Six ninety-degree segments produce five hundred and forty degrees, with five automatic reset cycles.

**Picture:** Run16 plays at 8.7x. The active twist periods align with recorded source-video intervals; unload/reset/regrasp phases are grouped between them. Six 90-degree markers show progress.

### 02:26–02:44 — Authorize the lift from recorded evidence

> Turn count alone does not permit lifting. Resistance must build, then stay low in fresh measurements while contact remains. A stationary check confirms release. The final reading falls below the recorded threshold, and the controller permits a thirty-millimetre lift.

**Picture:** Four actual action-log windows reveal the measured peak, two fresh low windows, and the stationary check. Retained contact is shown separately. Once the conditions pass, the actual 30 mm cap lift plays at 1x.

### 02:44–02:54 — Return to the framework

> Tactile Agent connects demonstrated intent and object-relative interaction with robot motion, supervised by task-specific touch.

**Picture:** The cap-lift result accompanies the three contributions: demonstration to stages, hand-object to gripper-object interaction, and tactile library to stage policy.

## Stage graph and control authority

Seven semantic groups summarize eleven annotated source intervals. The repeated twist and regrasp intervals share two graph nodes; the robot is not required to repeat the human's exact number of strokes.

| Node | Source action | Control labels | Role |
|---|---|---|---|
| 1 | Approach the cap | PLAN | Agent chooses a standoff; planner connects it to the current robot state. |
| 2 | Grasp and press | RELATIVE + TOUCH | Preserve the cap-contact relation and verify a pressing response. |
| 3 | Twist about the axis | RELATIVE + TOUCH | Execute bounded rotation about the bottle axis and check contact. |
| 4 | Reset and regrasp | PLAN + RELATIVE + TOUCH | Replan wrist motion, restore contact geometry, and establish the press gate again. |
| 5 | Check for release | RELATIVE + TOUCH | Test the release candidate before authorizing a lift. |
| 6 | Lift along the axis | PLAN + RELATIVE + TOUCH | Select the lift goal after verification, with the initial motion constrained to the bottle axis. |
| 7 | Place the cap aside | PLAN · HUMAN ONLY | Present in the human demonstration; the recorded robot run ends at cap lift. |

## Policy shown on screen

This fourteen-line policy explains how selected primitives become task conditions. The names are illustrative helpers; the recorded robot uses the repository's task-specific deterministic executor.

```python
policy = select(task="press_and_turn_cap")
released = False
for cycle in bounded_regrasp_cycles:
    require(contact_present(fresh_window()))
    baseline = fresh_prepress_window()
    require(press_until_response(baseline))
    twist_segment(cap_axis, feed=thread_profile)
    signal = fresh_window(relative_raw_Fz)
    require(contact_present(signal))
    if release_candidate(signal):
        released = stationary_confirm()
    if released: break
    unload_reset_regrasp()
if released: lift_along_bottle_axis(30*mm)
```

`require` stops progress if its condition fails. A fresh pre-press baseline is established after every regrasp. `release_candidate` requires a previously observed resistance peak, enough turning, and two fresh low windows with contact retained. `stationary_confirm` reads another fresh window. The final line permits the lift only after release has been verified. The bounded loop condenses the real runner's motion and recovery budgets.

## Recorded evidence and interpretation

The perception panels use actual SAM 2.1 temporal segmentation and per-frame RTMPose-m Hand5 inference on this demonstration, produced offline for the film. Initial manual box prompts are recorded, and occluded joints remain model estimates. The relative-pose equation, tactile tree, and pseudocode explain the architecture; these new overlays are not represented as the historical inputs that controlled Run16. The cap center and bottle axis are observable, while a unique visual yaw is not.

Run16 selected session-relative raw SDK **Fz proxies**, not calibrated newtons or torques. The torque branch shows a possible library representation; it was not the online torque decision signal in this run. The signal plot is reconstructed from discrete logged windows, and no synchronized tactile RGB is claimed for Run16.

| Recorded result | Value |
|---|---:|
| Twist | 54 × 10° = 540° |
| Geometric segments | Six 90° segments |
| Automatic reset/regrasp cycles | Five |
| Resistance-proxy peak | 1.102 |
| Final release threshold | 0.386 |
| Two candidate windows | 0.077, 0.115 |
| Stationary verification window | 0.057 |
| Contact retained | 0.318 > 0.0157 |
| Verified cap lift | 30 mm |

The bottle starts upright. The first revolution uses downfeed, while later revolutions follow an upward thread profile. The human demonstration contains three regrasp intervals; the robot completes five automatic resets. The robot evidence ends at cap lift.

## Production sources

- Human action: `runs/live/medicine_bottle_demo_20261023_01/analysis/demo_trim_1110_1274.mp4`; effective source frames 1119–1265 at 15 fps.

- Task annotations: the same analysis directory's `stage_plan.json` and `stage_contract.review.json`.

- Robot video: `runs/live/medicine_bottle_robot_video_20261023_01/robot_execution_front_full.mp4`.

- Execution evidence: `runs/live/medicine_bottle_execution_20261023_16_video_fast/action_log.json` and `stage_report.json`.

- Film production manifest: `production/bottle_story/story.json`; exact speech and subtitle cues: `production/bottle_story/audio/narration.json`.

- Reproducible renderer: `scripts/render_bottle_story.py`.

## Optional 60-second adaptation

This shorter edit is a script option, not a second rendered deliverable.

| Time | Narration | Picture |
|---|---|---|
| 00:00–00:12 | “One human demonstration becomes a task graph. The agent plans free motion and preserves the hand-object relation where contact matters.” | Human action unfolds into the seven video nodes. |
| 00:12–00:24 | “Hand and object perception describe the interaction. A gripper adapter transfers its geometry, and a motion planner creates the robot path.” | Moving mask/keypoint panels, then the relative-transfer diagram. |
| 00:24–00:37 | “The tactile library offers images, forces, and moments. For this cap, selected contact, pressing, and release conditions become an explicit task policy.” | Tactile tree selects the highlighted policy conditions. |
| 00:37–00:49 | “The robot completes six twist segments and five automatic regrasp cycles. Each new grasp must establish the pressing response again.” | Accelerated recorded loop with stage highlighting. |
| 00:49–01:00 | “A sustained resistance drop, retained contact, and a stationary check permit the final cap lift. Intent, relative interaction, and touch work together.” | Recorded predicate values, cap lift, framework end card. |
