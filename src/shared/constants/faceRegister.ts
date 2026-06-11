import type { StepName } from "../types/faceRegister";

export type Screen = "intro" | "capture" | "processing" | "retry" | "result";

export interface StepDef {
  name: StepName;
  labelKey: string;
  instructionKey: string;
  target: { x: number; y: number };
  /** Ideal head pose (degrees) for this step — the center of its accepted range. */
  pose: { yaw: number; pitch: number; roll: number };
  check: (yaw: number, pitch: number, roll: number) => boolean;
}

export const STEPS: StepDef[] = [
  {
    name: "center",
    labelKey: "faceRegister.labelCenter",
    instructionKey: "faceRegister.stepCenter",
    target: { x: 200, y: 280 },
    pose: { yaw: 0, pitch: 0, roll: 0 },
    check: (y, p, r) => Math.abs(y) < 12 && Math.abs(p) < 12 && Math.abs(r) < 12,
  },
  {
    name: "top",
    labelKey: "faceRegister.labelTop",
    instructionKey: "faceRegister.stepTop",
    target: { x: 200, y: 255 },
    pose: { yaw: 0, pitch: -10, roll: 0 },
    check: (_y, p) => p < -3 && p > -18 && Math.abs(_y) < 15,
  },
  {
    name: "topLeft",
    labelKey: "faceRegister.labelTopLeft",
    instructionKey: "faceRegister.stepTopLeft",
    target: { x: 180, y: 260 },
    pose: { yaw: 10, pitch: -10, roll: 0 },
    check: (y, p) => y > 3 && y < 18 && p < -2 && p > -18,
  },
  {
    name: "topRight",
    labelKey: "faceRegister.labelTopRight",
    instructionKey: "faceRegister.stepTopRight",
    target: { x: 220, y: 260 },
    pose: { yaw: -10, pitch: -10, roll: 0 },
    check: (y, p) => y < -3 && y > -18 && p < -2 && p > -18,
  },
  {
    name: "left",
    labelKey: "faceRegister.labelLeft",
    instructionKey: "faceRegister.stepLeft",
    target: { x: 180, y: 280 },
    pose: { yaw: 10, pitch: 0, roll: 0 },
    check: (y, p) => y > 3 && y < 18 && Math.abs(p) < 15,
  },
  {
    name: "right",
    labelKey: "faceRegister.labelRight",
    instructionKey: "faceRegister.stepRight",
    target: { x: 220, y: 280 },
    pose: { yaw: -10, pitch: 0, roll: 0 },
    check: (y, p) => y < -3 && y > -18 && Math.abs(p) < 15,
  },
];

/** Angle in degrees for the chevron on the oval edge per step (null = no chevron). */
export const STEP_ANGLES: Record<StepName, number | null> = {
  center: null,
  top: -90,
  topLeft: -135,
  topRight: -45,
  left: 180,
  right: 0,
};

export const ACCENT = "#4f9fff";
export const BG = "#4a4d51";
export const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
export const SVG_WIDTH = 400;
export const SVG_HEIGHT = 600;
export const OVAL_CX = 200;
export const OVAL_CY = 270;
export const OVAL_RX = 130;
export const OVAL_RY = 170;
export const MASK_THRESHOLD = 10;

/* ── circular-motion recording + post-processing ── */

/** Hard cap on a single recording session before auto-stop kicks in. */
export const MAX_RECORDING_MS = 15000;

/**
 * Cadence (ms) of the lightweight live coverage detection loop while
 * recording. Kept low-frequency so recording stays smooth.
 */
export const COVERAGE_DETECT_INTERVAL_MS = 250;

/**
 * Interval (ms of video time) at which the recorded blob is sampled into
 * frames during post-processing.
 */
export const FRAME_SAMPLE_INTERVAL_MS = 120;

/**
 * Max wall-clock time (ms) to wait for a single seek (or the duration-forcing
 * probe) during frame extraction. A stalled seek resolves/skips on timeout so
 * the post-processing pipeline can never hang indefinitely.
 */
export const SEEK_TIMEOUT_MS = 3000;

/** JPEG quality used when rendering a selected frame to a data URL. */
export const CAPTURE_JPEG_QUALITY = 0.92;

/**
 * Pose-match weights for `scorePoseAgainstStep`. Yaw and pitch carry the
 * pose intent; roll is a smaller tie-breaker that rewards an upright head.
 */
export const POSE_WEIGHTS = {
  yaw: 1,
  pitch: 1,
  roll: 0.5,
} as const;
