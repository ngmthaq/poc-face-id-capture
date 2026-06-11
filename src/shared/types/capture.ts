import type { StepName } from "./steps";

export interface Capture {
  step: StepName;
  labelKey: string;
  data: string;
}
