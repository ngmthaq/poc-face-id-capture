import type { StepDef, StepName } from "../types/steps";

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
