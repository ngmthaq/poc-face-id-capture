import type { RefObject } from "react";
import type { StepName } from "./steps";

export interface CaptureCoverageOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  active: boolean;
  onComplete: () => void;
}

export interface CaptureCoverage {
  coveredSteps: Set<StepName>;
  nosePos: { x: number; y: number } | null;
  maskWarning: boolean;
}
