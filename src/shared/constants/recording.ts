/* ── circular-motion recording + post-processing ── */

/**
 * Generous safety cap (ms) on a single recording session. The continuous
 * head-sweep flow has no hard timeout; this only prevents an indefinitely
 * running session if the user never completes coverage.
 */
export const RECORDING_SAFETY_CAP_MS = 60000;

/**
 * Combined yaw/pitch magnitude (degrees) below which the head is considered
 * near-centered and no ring tick fills. Keeps small jitter from lighting ticks.
 */
export const SWEEP_DEADZONE_MAG = 3;

/**
 * Angular half-width (degrees) around the head's ring angle within which ticks
 * fill, so a slow continuous sweep covers ticks without exact pixel aim.
 */
export const SWEEP_FILL_TOLERANCE_DEG = 25;

/**
 * How long the fully-covered, all-green progress ring is held on screen before
 * transitioning to post-processing, so the user sees a clear "complete" state.
 */
export const COMPLETE_HOLD_MS = 700;

/**
 * Cadence (ms) of the lightweight live coverage detection loop while
 * recording. Kept low-frequency so recording stays smooth.
 */
export const COVERAGE_DETECT_INTERVAL_MS = 250;

/**
 * Interval (ms of video time) at which the recorded blob is sampled into
 * frames during post-processing.
 */
export const FRAME_SAMPLE_INTERVAL_MS = 60;

/**
 * Max wall-clock time (ms) to wait for a single seek (or the duration-forcing
 * probe) during frame extraction. A stalled seek resolves/skips on timeout so
 * the post-processing pipeline can never hang indefinitely.
 */
export const SEEK_TIMEOUT_MS = 3000;

/** JPEG quality used when rendering a selected frame to a data URL. */
export const CAPTURE_JPEG_QUALITY = 0.8;

/**
 * Pose-match weights for `scorePoseAgainstStep`. Yaw and pitch carry the
 * pose intent; roll is a smaller tie-breaker that rewards an upright head.
 */
export const POSE_WEIGHTS = {
  yaw: 1,
  pitch: 1,
  roll: 0.5,
} as const;
