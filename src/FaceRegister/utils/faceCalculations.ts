import {
  SVG_WIDTH,
  SVG_HEIGHT,
  OVAL_CX,
  FACE_CENTER_Y,
} from "../constants";

interface Point {
  x: number;
  y: number;
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
): Point {
  return {
    x: (1 - px / videoWidth) * SVG_WIDTH,
    y: (py / videoHeight) * SVG_HEIGHT,
  };
}

export function checkFaceCentered(
  positions: Point[],
  videoWidth: number,
  videoHeight: number,
): boolean {
  const faceCenterX =
    (1 - (positions[27].x + positions[8].x) / 2 / videoWidth) * SVG_WIDTH;
  const faceCenterY =
    ((positions[27].y + positions[8].y) / 2 / videoHeight) * SVG_HEIGHT;
  const offCenterX = Math.abs(faceCenterX - OVAL_CX);
  const offCenterY = Math.abs(faceCenterY - FACE_CENTER_Y);
  return offCenterX < 30 && offCenterY < 40;
}

export function checkMask(
  upperLipY: number,
  lowerLipY: number,
  faceHeight: number,
): boolean {
  const lipGap = Math.abs(lowerLipY - upperLipY) / faceHeight;
  return lipGap < 0.10;
}
