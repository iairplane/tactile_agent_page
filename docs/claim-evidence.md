# Public claims and their evidence

This matrix supports the project page and video script. Source paths below are relative to the research repository `iairplane/tactile_agent`, whose local checkout was reviewed at the reviewed source checkout. Large run artifacts and machine-specific calibration are not assumed to be publicly available in that repository. The project page should provide published clips and clear evidence labels instead of broken links to local experiment paths.

## Claim matrix

| Public wording | Status | Source evidence | Required qualification |
|---|---|---|---|
| “A modular framework combines demonstration intent, relative interaction geometry, planning, and tactile supervision.” | Architecture implemented across modules | `docs/refined_real_robot_framework.md`; `docs/agentic_control.md`; `docs/tactile_supervision.md`; `src/demo2gripper/task_skill.py` | A system architecture, not a newly trained end-to-end model. |
| “The demonstration supplies semantic stages and contact-critical relations.” | Implemented task contracts and analyses | `scripts/compile_agentic_skill.py`; `src/demo2gripper/task_skill.py`; cup rim relation and stage plan; bottle stage plan | Stage extraction includes reviewed analysis; do not imply fully unsupervised compilation of arbitrary tasks. |
| “Human trajectories are retained as diagnostic evidence rather than replayed robot waypoints.” | Explicit contract | `docs/agentic_control.md`; `docs/refined_real_robot_framework.md`; `src/demo2gripper/task_skill.py` module contract | Does not imply every trial used newly inferred targets; Cup Run08 used reviewed hardcoded poses. |
| “The architecture includes pretrained segmentation, hand-pose, object-pose, and grasp-candidate adapters.” | Available adapters | `AGENTS.md`; `configs/backends.lock.json`; `docs/backends.md` | Do not imply all backends were used in the featured real runs. |
| “Cup demonstration analysis uses SAM2, RTMPose, and aligned RGB-D.” | Recorded diagnostic artifact | `runs/live/cup_top_demo_20261023_01/diagnostics/sam2_rtmpose_rgbd.mp4`; `scripts/render_cup_framework_showcase_en.py` | Analysis evidence; not a claim about the Run08 tactile classifier. |
| “Object-relative geometry composes with a live object pose.” | Mathematical/data contract | `AGENTS.md` coordinate contract; `src/demo2gripper/runtime_grasp.py` | Full SE(3) transfer requires an observed object orientation. Translation-only grounding cannot support arbitrary rotation. |
| “The agent specifies stage goals, and MoveIt plans robot motion.” | Architecture and task-specific hardware routes | `docs/refined_real_robot_framework.md`; robot execution scripts | General `TaskSkill`/`AgentLoop` remains review-only; do not claim a universal robot skill interpreter. |
| “Task predicates automatically advance the safety-cap loop.” | Real execution | `runs/live/medicine_bottle_execution_20261023_16_video_fast/stage_report.json`; `action_log.json`; `src/demo2gripper/medicine_bottle_tactile_presence.py` | Task-specific runner with session-specific setup; not generic autonomy across objects. |
| “Tactile modalities are selected by task.” | Design plus complementary experiments | `docs/tactile_supervision.md`; `docs/nested_cup_top_pick.md`; bottle runtime | Cup image semantics are shadow/design; bottle raw Fz gates are online. |
| “Inner and outer cup-rim contact should be assessed separately.” | Implemented design contract | `docs/top_cup_stage_plan.md`; `src/demo2gripper/tactile_rim_probe.py`; `src/demo2gripper/cup_tactile_gate.py` | No image or force symmetry assumption. Requires task-qualified templates before autonomous use. |
| “Run08 performs a low probe, a 6 mm upward correction, and approximately 67 mm lift.” | Real motion recording | `runs/live/cup_tactile_demo_20261023_08/action_log.json`; pose/execute JSONs; `outputs/framework_videos_20261023/README_EN.md` | Retry is scripted and final pose is hardcoded from a reviewed successful grasp. |
| “One cup is lifted in Cup Run08.” | Observed outcome | `runs/live/cup_tactile_demo_20261023_08/visual_outcome.json`; rendered robot recording | Front-RGB/operator confirmation, not an online tactile cup-count classification. |
| “Cup tactile images are shown alongside robot execution.” | Recorded shadow evidence | Run08 `action_log.json` tactile semantics; rendered clip | Images recorded via raw UVC and evaluated offline; the shadow gate did not control this take. |
| “Run16 twists 540 degrees with five automatic regrasp cycles.” | Real logged execution | Bottle Run16 `stage_report.json` reports 54 twist steps and 5 regrasps; action log; English timeline | 54 × 10°, six 90° segments. This is one run, not a benchmark statistic. |
| “Run16 uses session-relative raw SDK Fz proxies to gate contact, pressing, and release.” | Online runtime and log | `src/demo2gripper/medicine_bottle_tactile_presence.py`; Bottle Run16 action log | Complete FORCE6D windows logged, but decision values are not calibrated newtons or task-frame torque. |
| “A release predicate passes before a 30 mm cap lift.” | Real logged execution | Bottle Run16 report `twist_loop_status=release_verified`; action log; English timeline | Requires retained contact and fresh stationary low-resistance evidence; mechanism identity is not proven from force alone. |
| “Bottle release peak 1.102; limit 0.386; final stationary proxy 0.057.” | Logged scalar values, rounded | `medicine_bottle_task_framework_timeline_EN.json`; renderer validates against action log | Label all values as relative raw sensor units. Do not compare to another installation as physical force. |
| “The bottle video shows tactile feedback.” | Logged trace shown in video | `medicine_bottle_task_framework_script_EN.md`; renderer | No synchronized tactile RGB was recorded for Run16. Trace reconstructed from log. |
| “The test-tube task has an offline staged contract and tested predicates.” | Offline development only | `outputs/test_tube_preflight_20261023/README.md`; `compiled_plan.json` | No real-robot task success. World-frame 45° not established; current reference is an image-axis target. |
| “The executor preserves per-stage evidence and outcomes.” | Implemented logs/contracts | Die and bottle stage/action logs; test-tube runtime receipts | Logging does not itself establish task success or physical calibration. |

## Precisely supported quantitative details

### Cup Run08

- Public English clip duration: **72.6 s**, H.264, 1280 × 720, 30 fps.
- Scripted correction: **+6 mm** in TCP height.
- Subsequent lift: approximately **67 mm**.
- Outcome: **one cup lifted**, visually confirmed.
- Tactile authority: **shadow only**.
- Endpoint shown: **LIFT / HOLD**.

### Bottle Run16

- Public English clip duration: **66.0 s**, H.264, 1280 × 720, 30 fps.
- Logged twist steps: **54**, at **10°** each; total **540°**.
- Segments and resets: **6 × 90°**, **5** automatic regrasp cycles.
- Peak resistance proxy: `1.1020157608973933`.
- Release limit: `0.3857055163140876`.
- Final stationary resistance proxy: `0.05672473664418365`.
- Retained contact proxy: `0.3182583798223816`; contact minimum: `0.015675945806702035`.
- Lift after release verification: **30 mm** along the bottle axis.
- Endpoint shown: **LIFT_CAP**.
- No synchronized tactile RGB recorded for this run.

### Test-tube extension

- Demonstration: **670 frames**, approximately **45 s**.
- Semantic decomposition: **7 stages**.
- Current compiled state: `offline_task_contract_ready=true`, `moveit_plan_only_ready=false`, `hardware_execution_ready=false`.
- The offline RGB tracker follows **61/61 frames** in its reviewed demonstration interval. This is a single-recording diagnostic, not a robot-held tracking benchmark.
- No claim of tactile-only angle estimation, measured physical 45° inclination, or robot execution is supported.

## Suggested public evidence badges

| Display context | Badge |
|---|---|
| Framework diagram | “System architecture” |
| Cup policy illustration | “Designed supervision policy” |
| Cup robot clip | “Scripted retry · Shadow tactile” |
| Cup outcome | “Single cup · Visually confirmed” |
| Bottle robot clip | “Online tactile-gated execution” |
| Bottle plot | “Session-relative raw sensor units” |
| Bottle release | “Logged release predicate” |
| Tube preview | “Offline task contract” |

## Wording to avoid

Avoid “zero-shot,” “fully autonomous from one video,” “general-purpose learned policy,” “state-of-the-art performance,” “tactile-only cup counting,” “calibrated force/torque control,” “complete collision model,” and “all tasks successfully executed” unless future evidence specifically supports them. Do not invent an institutional affiliation, author list, paper acceptance, benchmark success rate, or citation record.

The defensible central claim is: **the framework separates demonstration-derived intent, object-relative interaction constraints, robot motion planning, and task-conditioned tactile supervision, with complementary real-robot evidence from nested-cup and safety-cap experiments.**
