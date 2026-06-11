- Author: Root Agent
- Title: Plan — Continuous head-sweep ring fill (per-tick) in the capture step
- Classification: feature (refactor of live coverage behavior)
- Description: Replace the 6-discrete-pose ring fill with a continuous angular sweep where each of the 30 ring ticks fills only when the head actually points in that tick's direction, gated by an initial center alignment, with no hard recording timeout.

---

## Approach Summary

- Today, hitting 5 directional `check()` poses lights _all_ ticks in each region at once (5 poses ⇒ full ring). We replace that with a per-tick model: every detection frame maps the head pose to a ring angle `θ = atan2(pitch, -yaw)` with magnitude `hypot(yaw, pitch)`; ticks whose angle falls within a tolerance of `θ` are marked covered, but only once magnitude clears a deadzone (so resting near-center fills nothing).
- Flow becomes two-phase: (1) user aligns face → `center.check()` passes (alignment gate); (2) ring ticks fill as the user slowly rotates their head around the full circle. Completion = `center` covered AND all 30 ticks covered.
- `STEPS` and post-processing are left untouched — only the _live_ coverage hook and the ring rendering change. Frame selection for the final captures still uses the existing directional steps.

## Functional Requirements

1. Each of the 30 ticks fills independently, only when the detected head direction points within `SWEEP_FILL_TOLERANCE_DEG` of that tick's ring angle and magnitude ≥ `SWEEP_DEADZONE_MAG`.
2. Tolerance is wide enough (covers the nearest ~1–2 ticks) that a smooth, continuous sweep fills all 30 without dead gaps, but narrow enough that a single static pose cannot fill the whole ring.
3. `center` remains a required initial alignment; ring ticks do not begin filling until `center` is covered.
4. Completion fires only when `center` + all 30 ticks are covered; the existing `COMPLETE_HOLD_MS` green-hold before advancing is preserved.
5. No hard recording timeout — capture runs until complete or the user backs out (a generous 60s safety cap remains to prevent runaway MediaRecorder buffers).
6. HUD progress shows tick coverage (e.g. `12 / 30`); instruction text shows "align" before center, "slowly rotate to fill the circle" during the sweep; mask warning behavior unchanged.
7. Red nose-position dot behavior unchanged.

## Non-Functional Requirements

- Match existing conventions: types live in `src/shared/types/` (not constants), tuning values in constants, pose math in `utils/faceCalculations.ts`. Clean-code: no duplicated angle math.
- `tsc -b` must pass; no new runtime deps.
- Detection loop stays at `COVERAGE_DETECT_INTERVAL_MS` cadence — no perf regression.

## Files in Scope

- `src/shared/utils/faceCalculations.ts` — add `poseToRingAngle(yaw, pitch)` + `ticksForAngle(angleDeg, count, toleranceDeg)` helpers.
- `src/shared/constants/recording.ts` — add `SWEEP_DEADZONE_MAG`, `SWEEP_FILL_TOLERANCE_DEG`, `RECORDING_SAFETY_CAP_MS` (60s); neutralize the `MAX_RECORDING_MS` hard-stop usage.
- `src/shared/hooks/useCaptureCoverage.ts` — replace directional-step loop with center-gate + per-tick angular fill; return `coveredTicks: Set<number>` + `centerCovered: boolean`.
- `src/shared/types/captureCoverage.ts` — update `CaptureCoverage` shape (`coveredTicks`, `centerCovered`).
- `src/molecules/ProgressRing/index.tsx` — render ticks from `coveredTicks` (drop `STEP_ANGLES`/`tickSteps`), drive outline from `centerCovered`.
- `src/organisms/CaptureScreen/index.tsx` — derive HUD progress/instruction from `coveredTicks`/`centerCovered` instead of `nextStep`.
- `src/templates/FaceRegister/index.tsx` — thread the new fields through.
- `src/shared/constants/steps.ts` — remove now-dead `STEP_ANGLES` (only if no other consumer remains).

## Risks & Assumptions

- Assumption (tuning): `SWEEP_DEADZONE_MAG ≈ 6°` and `SWEEP_FILL_TOLERANCE_DEG ≈ 12°` are starting values; exposed as named constants for easy tuning after a live test.
- Assumption: Direction mapping `θ = atan2(pitch, -yaw)` matches the mirrored on-screen orientation; validated against red-dot direction during verification.
- Risk (no timeout): "Run until complete" means a user who never finishes the sweep records indefinitely. Mitigation: generous 60s safety cap + Back button.
- Risk: Pitch range is asymmetric (looking down is shallow), so bottom ticks (~+90°) may be harder to reach; tolerance/deadzone tuning addresses this.
- Note: Project is Skip-Testing with no automated test framework; verification is `tsc` typecheck + manual checklist.

## Open Questions / Blockers

- None. Proceeding with the 60s safety cap under "run until complete".

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task                                                                                                                                                                                       | Responsible Role    | Dependencies | Skills        |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | ------------ | ------------- |
| 1   | TODO   | Add `poseToRingAngle()` + `ticksForAngle()` helpers to `faceCalculations.ts`; add `SWEEP_DEADZONE_MAG`/`SWEEP_FILL_TOLERANCE_DEG`/`RECORDING_SAFETY_CAP_MS` to `recording.ts`              | developer           | none         | `clean-code`  |
| 2   | TODO   | Refactor `useCaptureCoverage.ts` to center-gate + per-tick angular fill; return `coveredTicks`/`centerCovered`; replace hard-timeout with 60s safety cap; update `captureCoverage.ts` type | developer           | 1            | `clean-code`  |
| 3   | TODO   | Update `ProgressRing.tsx` to render from `coveredTicks`/`centerCovered`; drop `STEP_ANGLES`/`tickSteps`; remove dead `STEP_ANGLES` from `steps.ts`                                         | developer           | 2            | `clean-code`  |
| 4   | TODO   | Update `CaptureScreen.tsx` + `FaceRegister.tsx` to thread new fields and HUD progress/instruction (`n/30`)                                                                                 | developer           | 2            | `clean-code`  |
| 5   | TODO   | Verify: `tsc -b` passes + manual checklist (center gate, sweep fills 30 ticks, single pose can't complete, no timeout, completion hold)                                                    | Root Agent (review) | 3,4          | `aaa-testing` |
