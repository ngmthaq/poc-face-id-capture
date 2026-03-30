import {
  SVG_HEIGHT,
  FACE_CENTER_Y,
} from "../constants";

interface Point {
  x: number;
  y: number;
}

export interface SvgDims {
  svgWidth: number;
  svgHeight: number;
  ovalCx: number;
}

/**
 * Compute SVG viewBox dimensions that match the video's aspect ratio.
 * Height is always SVG_HEIGHT (600). Width scales proportionally.
 * The oval stays horizontally centered.
 */
export function getSvgDims(videoWidth: number, videoHeight: number): SvgDims {
  const svgHeight = SVG_HEIGHT;
  const svgWidth = (videoWidth / videoHeight) * svgHeight;
  return { svgWidth, svgHeight, ovalCx: svgWidth / 2 };
}

export function getEyeCenter(eyePoints: Point[]): Point {
  return {
    x: eyePoints.reduce((s, p) => s + p.x, 0) / eyePoints.length,
    y: eyePoints.reduce((s, p) => s + p.y, 0) / eyePoints.length,
  };
}

export function calcYaw(
  noseTipX: number,
  eyeMidX: number,
  faceWidth: number,
): number {
  return ((noseTipX - eyeMidX) / (faceWidth * 0.5)) * 45;
}

export function calcPitch(
  noseTipY: number,
  eyeMidY: number,
  faceHeight: number,
): number {
  return ((noseTipY - eyeMidY) / faceHeight - 0.21) * 80;
}

export function calcRoll(
  leftEyeCenter: Point,
  rightEyeCenter: Point,
): number {
  return (
    Math.atan2(
      rightEyeCenter.y - leftEyeCenter.y,
      rightEyeCenter.x - leftEyeCenter.x,
    ) *
    (180 / Math.PI)
  );
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

export function checkFaceCentered(
  positions: Point[],
  videoWidth: number,
  videoHeight: number,
  dims: SvgDims,
): boolean {
  const faceCenterX =
    (1 - (positions[27].x + positions[8].x) / 2 / videoWidth) * dims.svgWidth;
  const faceCenterY =
    ((positions[27].y + positions[8].y) / 2 / videoHeight) * dims.svgHeight;
  const offCenterX = Math.abs(faceCenterX - dims.ovalCx);
  const offCenterY = Math.abs(faceCenterY - FACE_CENTER_Y);
  return offCenterX < 30 && offCenterY < 40;
}

/**
 * Check whether the nose position (SVG coords) is inside the double-ring
 * crosshair area centered at the step target.
 */
export function checkNoseInRing(
  nosePos: Point,
  target: Point,
  svgWidth: number,
  ringRadius: number = 35,
): boolean {
  // Apply the same x-offset used by SvgOverlay to map the 400-wide
  // coordinate system to the dynamic SVG width.
  const xOffset = (svgWidth - 400) / 2;
  const tx = target.x + xOffset;
  const ty = target.y;
  const dx = nosePos.x - tx;
  const dy = nosePos.y - ty;
  return dx * dx + dy * dy <= ringRadius * ringRadius;
}

export function checkMask(
  upperLipY: number,
  lowerLipY: number,
  faceHeight: number,
): boolean {
  const lipGap = Math.abs(lowerLipY - upperLipY) / faceHeight;
  return lipGap < 0.105;
}
