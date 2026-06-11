import { STEPS } from "../constants/steps";
import { POSE_WEIGHTS } from "../constants/recording";
import type { StepDef, StepName } from "../types/steps";
import type { Capture } from "../types/capture";
import type { ScoredFrame, FrameSelection } from "../types/poseScoring";

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

/**
 * Pick the single highest-scoring frame per step regardless of qualification,
 * so the frame closest to each step's ideal pose always wins. Steps with no
 * scored frame at all are returned in `missingSteps`.
 */
export function selectBestFramesPerStep(scoredFrames: ScoredFrame[]): FrameSelection {
  const bestByStep = new Map<StepName, ScoredFrame>();

  for (const frame of scoredFrames) {
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
