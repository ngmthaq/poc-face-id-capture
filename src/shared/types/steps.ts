export type StepName = "center" | "top" | "topLeft" | "topRight" | "left" | "right";

export interface StepDef {
  name: StepName;
  labelKey: string;
  instructionKey: string;
  target: { x: number; y: number };
  /** Ideal head pose (degrees) for this step — the center of its accepted range. */
  pose: { yaw: number; pitch: number; roll: number };
  check: (yaw: number, pitch: number, roll: number) => boolean;
}
