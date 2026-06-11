import type { RefObject } from "react";

export interface CaptureCoverageOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  active: boolean;
  onComplete: () => void;
}

export interface CaptureCoverage {
  coveredTicks: Set<number>;
  centerCovered: boolean;
  nosePos: { x: number; y: number } | null;
  maskWarning: boolean;
  complete: boolean;
}
