- Author: Root Agent
- Title: Plan — Circular-motion video capture with post-processed 6-frame selection
- Classification: feature
- Description: Replace the step-by-step crosshair capture with a single circular head motion that records video, then post-processes the recording to select the 6 best-positioned frames.

---

## Approach Summary

- Replace the step-by-step "park your nose on a crosshair x 6" flow with a single fluid motion. The user rolls their head around the oval while we record the camera stream (`MediaRecorder`). A lightweight live face-api loop runs only to drive a progress ring and detect coverage; when the motion has passed through all 6 target poses (or a max timeout hits), recording stops.
- We then post-process the recorded video blob (decode sampled frames, run face-api, score each frame's pose against the 6 targets) and select the single best frame per position as the source of truth. If any of the 6 positions has no acceptable frame, we show a retry screen.
- Output stays the existing `Capture[]` shape with the same 6 `StepName`s, so consumers are unaffected.
- Keeps all existing pose math (`calcYaw/Pitch/Roll`, `checkMask`) and reuses it in two places (live coverage + post-processing), isolating the new selection logic into a pure, testable module.

## Functional Requirements

- User rolls their head once around the circle; no per-step countdown/hold required.
- A progress ring around the oval fills as each of the 6 positions (`center, top, topLeft, topRight, left, right`) is covered in real time.
- Recording stops automatically when all 6 are covered, or at a max timeout (assumed 15s).
- After stop, the recorded video is analyzed and the best frame per position is selected; each becomes a `Capture { step, labelKey, data }`.
- Masked/occluded frames are excluded from selection.
- If >=1 position has no acceptable frame, the user is shown a retry prompt to record again.
- On success, `onComplete(captures: Capture[])` receives exactly 6 captures with the existing fields — no contract change.

## Non-Functional Requirements

- Live loop runs at a reduced cadence to keep recording smooth; heavy analysis happens only post-stop.
- No video blob is persisted or returned — it lives in memory for the analysis pass, then is released.
- New pose-scoring/selection logic is pure (no DOM/camera deps) and unit-tested.
- Follow existing conventions (atoms/molecules/organisms, `S` styles, i18n keys, TS strictness). `clean-code` applied.

## Files in Scope

Modify

- `src/templates/FaceRegister/index.tsx` — new screen state machine: `intro -> capture(recording) -> processing -> result`, with retry back to `capture`.
- `src/shared/constants/faceRegister.ts` — keep `STEPS`; add `MAX_RECORDING_MS`, coverage threshold, frame-sampling interval, pose-match weights.
- `src/shared/types/faceRegister.ts` — extend `Screen`/state types (`"processing"`); `Capture` unchanged.
- `src/organisms/CaptureScreen/index.tsx` — recording UI: progress ring + instruction text; remove crosshair/countdown/dots driving.
- `src/shared/hooks/useCamera.ts` — expose stream helpers needed for recording.
- `src/shared/translations/locales/en.ts` and `ja.ts` — new keys (recording instruction, processing, retry).
- `src/shared/styles/faceRegister.ts` — styles for ring/processing/retry.

Create

- `src/shared/utils/poseScoring.ts` — pure: `scorePoseAgainstStep(step, yaw, pitch, roll)` + `selectBestFramesPerStep(scoredFrames)` -> `{ captures, missingSteps }`.
- `src/shared/utils/videoFrameExtractor.ts` — decode a `Blob` into sampled frames (canvas/`ImageData` + timestamp).
- `src/shared/hooks/useFaceRecorder.ts` — `MediaRecorder` wrapper: `startRecording/stopRecording` -> `Blob`.
- `src/shared/hooks/useCaptureCoverage.ts` — light live face-api loop computing covered-slot set + `nosePos` for the ring.
- `src/shared/hooks/usePostProcess.ts` — orchestrates extractor -> face-api per frame -> `poseScoring` -> captures/missing.
- `src/molecules/ProgressRing/index.tsx` — 6-slot SVG ring that fills as positions are covered.
- `src/organisms/ProcessingScreen/index.tsx` — spinner + "analyzing" text.
- `src/organisms/RetryScreen/index.tsx` — shown when positions are missing.
- Test setup: `vitest` dev dep + config; `src/shared/utils/__tests__/poseScoring.test.ts`.

Likely retire / decouple

- `useFaceDetection.ts` step machine, `SvgOverlay` crosshair/countdown, `checkNoseInRing`, `STEP_ANGLES`/`getCurveOffsets` — kept only if still referenced; otherwise removed in a cleanup task.

## Risks & Assumptions

- No test framework exists today (no test files, no test script in `package.json`). Plan adds a minimal Vitest setup so the pure selection logic is covered. (Assumption: Vitest is acceptable.)
- `MediaRecorder` codec support varies by browser; will feature-detect a supported `mimeType` (webm/vp8/vp9, mp4 fallback on Safari).
- Post-processing two-pass face-api adds CPU time after recording; mitigated by sampling frames (~every 100-150ms of video, not every frame).
- Assumed max recording timeout = 15s and coverage = pose held/passed near target for a short threshold. Tunable.
- `center` is captured as the near-neutral pose the user naturally passes through at the start of the motion.
- Removing the crosshair/countdown UI changes intro copy (`introStep2/3`) — i18n updated accordingly.

## Open Questions / Blockers

- None blocking. Vitest acceptance and the 15s/threshold tuning values are flagged as assumptions.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status  | Task                                                                                                                                                                                            | Responsible Role | Dependencies | Skills        |
| --- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | ------------- |
| 1   | DONE    | Update `constants/faceRegister.ts` + `types/faceRegister.ts`: add `Screen "processing"`, `MAX_RECORDING_MS`, coverage threshold, sampling interval, pose-match weights; keep `STEPS`/`Capture`. | developer        | none         | `clean-code`  |
| 2   | DONE    | Create pure `utils/poseScoring.ts`: `scorePoseAgainstStep` + `selectBestFramesPerStep` -> `{ captures, missingSteps }`.                                                                         | developer        | 1            | `clean-code`  |
| 3   | DONE    | Create `utils/videoFrameExtractor.ts`: decode `Blob` -> sampled `{ frame, timestamp }`.                                                                                                         | developer        | 1            | `clean-code`  |
| 4   | DONE    | Create `hooks/useFaceRecorder.ts`: `MediaRecorder` start/stop -> `Blob`, with mimeType feature-detection.                                                                                       | developer        | 1            | `clean-code`  |
| 5   | DONE    | Create `hooks/useCaptureCoverage.ts`: light live face-api loop -> covered-slot set + `nosePos`; auto-stop signal on full coverage/timeout.                                                      | developer        | 1,2          | `clean-code`  |
| 6   | DONE    | Create post-process orchestrator (`hooks/usePostProcess.ts`): extractor -> face-api per frame -> `poseScoring`, skip masked frames -> captures/missing.                                         | developer        | 2,3          | `clean-code`  |
| 7   | DONE    | Create `molecules/ProgressRing/index.tsx`: 6-slot SVG ring filling on coverage.                                                                                                                 | developer        | 1            | `clean-code`  |
| 8   | DONE    | Update `organisms/CaptureScreen/index.tsx`: recording UI with `ProgressRing` + instruction; drop crosshair/countdown.                                                                           | developer        | 5,7          | `clean-code`  |
| 9   | DONE    | Create `organisms/ProcessingScreen` and `organisms/RetryScreen` (+ styles).                                                                                                                     | developer        | 1            | `clean-code`  |
| 10  | DONE    | Rewire `templates/FaceRegister/index.tsx` state machine: capture->processing->result, retry loop; wire recorder/coverage/post-process.                                                          | developer        | 4,5,6,8,9    | `clean-code`  |
| 11  | DONE    | Add i18n keys to `locales/en.ts` + `ja.ts` (recording instruction, processing, retry); update intro copy.                                                                                       | developer        | 1            | `clean-code`  |
| 12  | DONE    | Cleanup: remove now-unused step-machine code (`useFaceDetection` crosshair path, `checkNoseInRing`, `STEP_ANGLES`, `SvgOverlay` crosshair) only if unreferenced.                                | developer        | 10           | `clean-code`  |
| 13  | SKIPPED | Vitest setup + unit tests for `poseScoring`. Skipped per project convention `Testing Workflow: Skip-Testing` (user-confirmed).                                                                  | tester           | 2            | `aaa-testing` |
| 14  | SKIPPED | Unit tests for post-process selection. Skipped per project convention `Testing Workflow: Skip-Testing` (user-confirmed).                                                                        | tester           | 6,13         | `aaa-testing` |
