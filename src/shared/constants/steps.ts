import type { StepDef, StepName } from "../types/steps";

export const STEPS: StepDef[] = [
  {
    name: "center",
    labelKey: "faceRegister.labelCenter",
    instructionKey: "faceRegister.stepCenter",
    target: { x: 200, y: 280 },
    pose: { yaw: 0, pitch: 0, roll: 0 },
    check: (y, p) => Math.abs(y) < 12 && Math.abs(p) < 10,
  },
  {
    name: "top",
    labelKey: "faceRegister.labelTop",
    instructionKey: "faceRegister.stepTop",
    target: { x: 200, y: 255 },
    pose: { yaw: 0, pitch: -13, roll: 0 },
    check: (y, p) => p < -4 && p > -28 && Math.abs(y) < 18,
  },
  {
    name: "topLeft",
    labelKey: "faceRegister.labelTopLeft",
    instructionKey: "faceRegister.stepTopLeft",
    target: { x: 180, y: 260 },
    pose: { yaw: 16, pitch: -12, roll: 0 },
    check: (y, p) => y > 4 && p < -2 && p > -28,
  },
  {
    name: "topRight",
    labelKey: "faceRegister.labelTopRight",
    instructionKey: "faceRegister.stepTopRight",
    target: { x: 220, y: 260 },
    pose: { yaw: -16, pitch: -12, roll: 0 },
    check: (y, p) => y < -4 && p < -2 && p > -28,
  },
  {
    name: "left",
    labelKey: "faceRegister.labelLeft",
    instructionKey: "faceRegister.stepLeft",
    target: { x: 180, y: 280 },
    pose: { yaw: 18, pitch: 0, roll: 0 },
    check: (y, p) => y > 4 && p >= -2 && p < 20,
  },
  {
    name: "right",
    labelKey: "faceRegister.labelRight",
    instructionKey: "faceRegister.stepRight",
    target: { x: 220, y: 280 },
    pose: { yaw: -18, pitch: 0, roll: 0 },
    check: (y, p) => y < -4 && p >= -2 && p < 20,
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
