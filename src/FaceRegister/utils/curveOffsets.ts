import type { StepName } from "../constants";

const CURVE_AMOUNT = 30;

export function getCurveOffsets(stepName: StepName): {
  vCurve: number;
  hCurve: number;
} {
  switch (stepName) {
    case "left":
      return { vCurve: -CURVE_AMOUNT, hCurve: 0 };
    case "right":
      return { vCurve: CURVE_AMOUNT, hCurve: 0 };
    case "up":
      return { vCurve: 0, hCurve: -CURVE_AMOUNT };
    case "down":
      return { vCurve: 0, hCurve: CURVE_AMOUNT };
    case "tilt":
      return {
        vCurve: -CURVE_AMOUNT * 0.7,
        hCurve: -CURVE_AMOUNT * 0.7,
      };
    default:
      return { vCurve: 0, hCurve: 0 };
  }
}
