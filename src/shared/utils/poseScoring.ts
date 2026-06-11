import { POSE_WEIGHTS, STEPS, type StepDef } from "../constants/faceRegister";
import type { Capture, StepName } from "../types/faceRegister";

export interface ScoredFrame {
  step: StepDef;
  score: number;
  qualifies: boolean;
  data: string;
}

/**
 * Score how well a measured head pose matches a step's ideal pose.
 * Higher is better (best possible is 0); the score is the negated,
 * weighted angular distance so the closest pose scores highest.
 */
export function scorePoseAgainstStep(
  step: StepDef,
  yaw: number,
  pitch: number,
  roll: number,
): number {
  const dYaw = (yaw - step.pose.yaw) * POSE_WEIGHTS.yaw;
  const dPitch = (pitch - step.pose.pitch) * POSE_WEIGHTS.pitch;
  const dRoll = (roll - step.pose.roll) * POSE_WEIGHTS.roll;
  return -Math.sqrt(dYaw * dYaw + dPitch * dPitch + dRoll * dRoll);
}

export interface FrameSelection {
  captures: Capture[];
  missingSteps: StepName[];
}

/**
 * Pick the single best qualifying frame per step. A frame qualifies for a
 * step only if it passed that step's `check()` (encoded in `qualifies`).
 * Steps with no qualifying frame are returned in `missingSteps`.
 */
export function selectBestFramesPerStep(scoredFrames: ScoredFrame[]): FrameSelection {
  const bestByStep = new Map<StepName, ScoredFrame>();

  for (const frame of scoredFrames) {
    if (!frame.qualifies) continue;
    const current = bestByStep.get(frame.step.name);
    if (!current || frame.score > current.score) {
      bestByStep.set(frame.step.name, frame);
    }
  }

  const captures: Capture[] = [];
  const missingSteps: StepName[] = [];

  for (const step of STEPS) {
    const best = bestByStep.get(step.name);
    if (best) {
      captures.push({ step: step.name, labelKey: best.step.labelKey, data: best.data });
    } else {
      missingSteps.push(step.name);
    }
  }

  return { captures, missingSteps };
}
