import type { StepDef, StepName } from "./steps";
import type { Capture } from "./capture";

export interface ScoredFrame {
  step: StepDef;
  score: number;
  qualifies: boolean;
  data: string;
}

export interface FrameSelection {
  captures: Capture[];
  missingSteps: StepName[];
}
