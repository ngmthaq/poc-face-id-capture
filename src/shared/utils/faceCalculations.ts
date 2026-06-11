import { SVG_HEIGHT } from "../constants/geometry";
import type { Point, SvgDims, FaceLandmarks, PoseMeasurement } from "../types/faceCalculations";

/**
 * Compute SVG viewBox dimensions that match the video's aspect ratio.
 * Height is always SVG_HEIGHT (600). Width scales proportionally.
 * The circle stays horizontally centered.
 */
export function getSvgDims(videoWidth: number, videoHeight: number): SvgDims {
  const svgHeight = SVG_HEIGHT;
  const svgWidth = (videoWidth / videoHeight) * svgHeight;
  return { svgWidth, svgHeight, cx: svgWidth / 2 };
}

export function getEyeCenter(eyePoints: Point[]): Point {
  return {
    x: eyePoints.reduce((s, p) => s + p.x, 0) / eyePoints.length,
    y: eyePoints.reduce((s, p) => s + p.y, 0) / eyePoints.length,
  };
}

export function calcYaw(noseTipX: number, eyeMidX: number, faceWidth: number): number {
  return ((noseTipX - eyeMidX) / (faceWidth * 0.5)) * 45;
}

export function calcPitch(noseTipY: number, eyeMidY: number, faceHeight: number): number {
  return ((noseTipY - eyeMidY) / faceHeight - 0.21) * 80;
}

export function calcRoll(leftEyeCenter: Point, rightEyeCenter: Point): number {
  return (
    Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x) *
    (180 / Math.PI)
  );
}

/** Smallest signed angular difference `a - b` (degrees), normalized to [-180, 180]. */
export function angularDifference(a: number, b: number): number {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

/**
 * Map a head pose to a ring angle (degrees) on the progress circle.
 * Convention: 0° = right (+x), 90° = down (+y), -90° = up. From the step
 * targets, `yaw < 0` points screen-right and `pitch < 0` points up, so the
 * ring angle is `atan2(pitch, -yaw)`.
 */
export function poseToRingAngle(yaw: number, pitch: number): number {
  return Math.atan2(pitch, -yaw) * (180 / Math.PI);
}

/**
 * Indices of all evenly-spaced ticks whose angle `(360/count)*i` lies within
 * `toleranceDeg` of `angleDeg` (smallest signed angular difference).
 */
export function ticksForAngle(angleDeg: number, count: number, toleranceDeg: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    const tickAngle = (360 / count) * i;
    if (Math.abs(angularDifference(angleDeg, tickAngle)) <= toleranceDeg) {
      indices.push(i);
    }
  }
  return indices;
}

export function toSvgCoords(
  px: number,
  py: number,
  videoWidth: number,
  videoHeight: number,
  dims: SvgDims,
): Point {
  return {
    x: (1 - px / videoWidth) * dims.svgWidth,
    y: (py / videoHeight) * dims.svgHeight,
  };
}

export function checkMask(upperLipY: number, lowerLipY: number, faceHeight: number): boolean {
  const lipGap = Math.abs(lowerLipY - upperLipY) / faceHeight;
  return lipGap < 0.105;
}

/**
 * Reduce a face-api landmark set to a head-pose measurement. Reuses the
 * shared yaw/pitch/roll math and mask heuristic so the live coverage loop
 * and the post-processing pass agree on how a frame is interpreted.
 */
export function measurePose(landmarks: FaceLandmarks): PoseMeasurement {
  const { positions } = landmarks;
  const noseTip = positions[30];
  const leftEyeCenter = getEyeCenter(landmarks.getLeftEye());
  const rightEyeCenter = getEyeCenter(landmarks.getRightEye());
  const eyeMidX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
  const eyeMidY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
  const jaw = landmarks.getJawOutline();
  const faceWidth = Math.abs(jaw[jaw.length - 1].x - jaw[0].x);
  const faceHeight = Math.abs(positions[8].y - positions[19].y);

  return {
    yaw: calcYaw(noseTip.x, eyeMidX, faceWidth),
    pitch: calcPitch(noseTip.y, eyeMidY, faceHeight),
    roll: calcRoll(leftEyeCenter, rightEyeCenter),
    masked: checkMask(positions[51].y, positions[57].y, faceHeight),
    noseTip,
  };
}
