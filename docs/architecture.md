# Tactile Agent

## One demonstration. Object-relative interaction. Task-specific tactile supervision.

Tactile Agent is a modular framework for turning a human RGB-D demonstration into an interpretable robot task. A demonstration describes what to accomplish, how the task progresses, and how the hand engages an object at important contact events. The robot grounds those relations in the current scene, generates its own motion, and uses task-specific contact evidence to decide whether an interaction can continue.

The central design separates three responsibilities: **an agent chooses stage goals, relative geometry constrains object interaction, and tactile predicates supervise stage progress**. MoveIt converts robot goals into trajectories; a deterministic executor carries out the selected actions. A language model does not command the robot's joints at servo frequency.

This is a systems architecture, not a newly trained end-to-end policy. It combines pretrained perception adapters, geometry, semantic task contracts, motion planning, sensor processing, and task-specific execution code. The current demonstrations use a Franka Research 3, a Robotiq Hand-E, an external Intel RealSense D435, and two ViTai GF220 tactile sensors.

## 1. What a single demonstration provides

The input is an RGB-D recording with aligned metric depth, camera intrinsics, and timestamps. Perception identifies the hand and task objects, follows their motion, and estimates the contact geometry where the hand grasps, presses, twists, or releases.

The compiler produces a sequence of semantic stages rather than a dense trajectory to replay. Each stage records its purpose, reference frame, required observations, target policy, completion condition, and failure response. For example, approaching a cup is a free-space planning problem; pinching its rim is an object-relative interaction; separating nested cups requires a contact-aware decision.

Human trajectories remain useful evidence for segmentation, continuity checks, hand-object coupling, and understanding intent. They are retained for diagnostics, but the current task contracts do not consume those paths as robot TCP waypoints. The robot's kinematics, starting configuration, and surrounding geometry differ from the human demonstrator's.

“One demonstration” describes the source of task intent and interaction geometry. It does not mean the entire system learns from one example without pretrained models, sensor calibration, engineering, or task-specific configuration. The recorded trials include reviewed target poses and tuned parameters. Their role must remain visible when presenting the results.

## 2. Perception is modular and evidence-dependent

The repository contains adapters for SAM 3 object discovery, SAM 2.1 video masks, RTMPose-m Hand5 keypoints, WAPR and FoundationPose for known-object pose, and GraspGenX grasp candidates. These are interchangeable tools within the architecture; they are not all executed in every demonstrated task.

The cup analysis includes SAM2 hand/object tracking, RTMPose hand keypoints, and aligned RGB-D geometry. The fast real-robot die experiment used a supported-object depth component instead of SAM 3. The safety-cap experiment localizes a cap within a reviewed image region and uses a robot-aligned task frame. The black circular cap does not provide a uniquely observable yaw, so execution preserves a reviewed grasp direction rather than inferring a nonexistent visual orientation.

This distinction matters: a segmentation mask identifies relevant pixels, but it does not automatically yield a complete six-degree-of-freedom pose. An RGB-D point cloud may provide a center and support geometry while leaving rotation ambiguous. Transparent objects can also produce unreliable depth. The system should carry those missing quantities forward explicitly instead of treating every detected object as a fully observed rigid frame.

## 3. Transfer the interaction relation

At a contact-critical event, the useful invariant is the relationship between the object and the hand's effective pinch point. The compiler extracts a grasp location, a jaw-closing direction, an approach constraint, and any object symmetry. Robot-specific adaptation then supplies the actual TCP transform, feasible gripper opening, and geometric constraints for the installed end effector.

When a complete object frame is observed, the transfer can be written as:

```text
T_base_object = T_base_camera · T_camera_object
T_base_tcp    = T_base_object · T_object_tcp
```

Here `T_parent_child` maps points from the child frame into the parent frame. The first equation grounds perception in the robot base; the second places the robot's contact frame relative to the object. For a cup, the reference may be a local rim frame. For a bottle, pressing and twisting are defined around its axis.

The formula is conditional on the information available. A translation-only anchor can move a grasp with the object but cannot correctly rotate it with an arbitrarily reoriented object. A cylindrical tube also leaves rotation around its axis ambiguous. That freedom should remain a candidate family for reachability and collision selection, rather than being silently filled with an arbitrary orientation.

The architecture therefore keeps **demonstrated geometry**, **current scene grounding**, and **robot-specific adaptation** separate. A human pinch width is not automatically a Hand-E opening command, and the legacy stock Franka Hand transform cannot be reused for the installed Hand-E.

## 4. From semantic stages to robot motion

The agent layer reasons about the current task state: where to approach, which clearance to establish, what to observe again, and which declared recovery to choose. MoveIt handles inverse kinematics, planning-scene collision checking, and trajectory generation for the configured robot model.

The executor advances through named states using measured feedback. It combines motion completion, TCP residuals, gripper state, object observations, and valid contact predicates. An execution contract can express `continue`, `complete`, `hold`, `reobserve`, or a bounded retry. Motion steps, timeouts, displacement budgets, and retry counts remain explicit.

These roles operate at different timescales. High-level interpretation and planning establish goals; deterministic routines execute contact steps and evaluate sensor windows. A stage transition can occur automatically after its predicate passes. It does not require a conversational agent to watch each frame and issue the next command.

The implemented hardware routes remain task-specific. The generic `TaskSkill` and `AgentLoop` express a broader architecture, but are still review-only. The die picker, cup video runner, and bottle runner are separate implementations with different capabilities. MoveIt collision checking also only covers the geometry actually present in its planning scene; the recorded runs acknowledge an arm-only collision model.

## 5. Tactile supervision has three layers

The first layer is **sensor data**: corrected tactile images, differences from an unloaded reference, deformation estimates, marker motion, slip estimates, and six-dimensional force outputs. Each channel needs its own identity, timestamp, freshness, calibration provenance, and validity. A repeated cached frame is not a new observation, and a missing channel is not evidence of no contact.

The second layer is **contact primitives**: contact presence, patch location and shape, per-finger load, shear, indentation, motion across a fingertip, or a resistance trend. These describe measurable local events. Their interpretation depends on the sensor installation and task geometry.

The third layer is a **task predicate**: whether the rim interaction matches an expected role, whether pressing has established contact, whether contact remains during twisting, or whether a release candidate has persisted. Predicates evaluate fresh temporal windows, not isolated sample thresholds. They return evidence and validity together with the decision.

The supervisor does not generate arbitrary robot targets. It permits or rejects progress and requests a declared recovery. For example, a suspected deep rim contact can request unloading before an upward correction. The executor owns the corresponding bounded motion.

Different tasks need different representations. Images describe where and how contact occurs; relative force changes describe whether resistance develops or disappears. The intended calibrated wrench path transforms each sensor into a common task frame before combining forces and moments. Raw SDK channels do not become newtons, newton-metres, or a task-axis torque merely because those names appear in an API.

## 6. Example: extracting the top nested cup

The human demonstration supplies the local hand-to-rim relation. The intended skill grounds the top rim, approaches it, aligns the pinch, gently closes, separates the target cup, verifies continued holding, and establishes lift clearance. Later transport and placement are represented in the demonstration and contract.

The two fingers have different roles: one contacts the inner rim, the other the outer rim. Their tactile images and loads need not be symmetric. The intended image-based supervisor checks each role against its own contact template, looking at location, shape, contact bands, and temporal consistency. No contact can prompt a small additional probe; a suspected deep or mismatched contact can prompt unloading and a bounded correction.

A second optical band is not proof that two cups were grasped: a single rolled rim can create several image edges. Likewise, contact presence alone does not establish a stable grasp. These are hypotheses that require qualified task evidence.

The published Cup Run08 is a concrete motion demonstration with a clear boundary. It uses a reviewed, hardcoded successful grasp pose and a scripted deliberately low probe. The robot closes without lifting, unloads, raises its TCP by **6 mm**, closes again, and lifts approximately **67 mm**. Front RGB and operator review confirm one cup moved. Both tactile image streams were recorded and evaluated offline in shadow mode; they did not trigger the retry in this take. Robot footage ends at lift/hold, not at a completed placement.

## 7. Example: opening a press-and-turn cap

The bottle demonstration begins with the bottle already upright. It shows cap contact, pressing, twisting, wrist reset and regrasp, and eventual lifting. The robot compiles this into a loop rather than requiring the exact number of human wrist strokes.

In Bottle Run16, complete `FORCE6D` windows are logged, while online decisions use session-relative raw SDK `Fz` proxies. A fresh baseline is established around contact and after regrasp. A sufficient pressure-related change allows twisting; contact presence remains supervised during the loop. Available wrist travel determines the segment length. At its limit, the robot unloads, resets, regrasps, and presses again.

The demonstrated run executes **54 increments of 10 degrees**, totaling **540 degrees**, arranged as six 90-degree segments with five automatic regrasp cycles. After more than one turn, release checking requires a previously established resistance peak, persistently lower fresh readings, retained contact, and a stationary verification window. The release predicate passes before a **30 mm** axial cap lift.

These values are session-relative sensor evidence, not calibrated physical force or torque. Run16 did not record synchronized tactile RGB video; the explanatory trace is reconstructed from its action log. The run ends at `LIFT_CAP` and does not demonstrate placing the cap aside. It nevertheless provides actual online evidence that tactile feedback can control stage progression in a task-specific runner.

## 8. What the framework contributes—and what remains

The framework's organizing principle is the explicit division of authority: **intent for task structure, relative geometry for interaction, planning for free motion, and touch for contact-dependent progress**. An inspectable contract connects these components and preserves the observations, decisions, and outcomes behind an execution.

The two featured tasks illustrate different maturity levels. The cup demonstrates the relation-guided motion pattern and synchronized tactile evidence, with a scripted retry. The cap demonstrates an online tactile-gated interaction loop. The current test-tube extension is an offline task contract, geometry analysis, and predicate/runtime implementation; it has not established real-robot task completion. Its apparent 45-degree reference is presently an image-plane axis target, not a tactile measurement of a world-frame angle.

Remaining work includes calibrated and qualified tactile semantics across objects, dependable live adapters for generic stage execution, complete end-effector collision geometry, and broader evaluation across initial conditions and failures. The current recordings are illustrative experiments, not a benchmark success rate. Keeping those distinctions visible makes the architecture's demonstrated capabilities and research direction understandable.

## Source map

The architecture is grounded in the source repository's `docs/refined_real_robot_framework.md`, `docs/agentic_control.md`, `docs/tactile_supervision.md`, `docs/top_cup_stage_plan.md`, and `docs/nested_cup_top_pick.md`; `src/demo2gripper/task_skill.py`; and the English video manifests and task execution logs. See [claim-evidence.md](claim-evidence.md) for the exact provenance and [video-script.md](video-script.md) for the presentation storyboard.
