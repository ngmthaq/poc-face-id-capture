export type StepName = "center" | "top" | "topLeft" | "topRight" | "left" | "right";
export type Screen = "intro" | "capture" | "result";

export interface Capture {
  step: StepName;
  labelKey: string;
  data: string;
}

export interface StepDef {
  name: StepName;
  labelKey: string;
  instructionKey: string;
  target: { x: number; y: number };
  check: (yaw: number, pitch: number, roll: number) => boolean;
  countdown?: number;
}

export interface FaceRegisterTranslations {
  introTitle?: string;
  introSub?: string;
  introStep1?: string;
  introStep2?: string;
  introStep3?: string;
  getStarted?: string;
  hudTitle?: string;
  hudProgress?: string;
  stepCenter?: string;
  stepTop?: string;
  stepTopLeft?: string;
  stepTopRight?: string;
  stepLeft?: string;
  stepRight?: string;
  outsideOval?: string;
  maskWarning?: string;
  maskWarningDetail?: string;
  labelCenter?: string;
  labelTop?: string;
  labelTopLeft?: string;
  labelTopRight?: string;
  labelLeft?: string;
  labelRight?: string;
  resultTitle?: string;
  resultSub?: string;
  registerAgain?: string;
  save?: string;
  loadingModels?: string;
  back?: string;
  discard?: string;
}

export interface FaceRegisterProps {
  onComplete?: (captures: Capture[]) => void;
  onExit?: () => void;
  locale?: string;
  translations?: FaceRegisterTranslations;
}

export const STEPS: StepDef[] = [
  {
    name: "center",
    labelKey: "faceRegister.labelCenter",
    instructionKey: "faceRegister.stepCenter",
    target: { x: 200, y: 300 },
    check: (y, p, r) =>
      Math.abs(y) < 12 && Math.abs(p) < 12 && Math.abs(r) < 12,
  },
  {
    name: "top",
    labelKey: "faceRegister.labelTop",
    instructionKey: "faceRegister.stepTop",
    target: { x: 200, y: 260 },
    check: (_y, p) => p < -3,
  },
  {
    name: "topLeft",
    labelKey: "faceRegister.labelTopLeft",
    instructionKey: "faceRegister.stepTopLeft",
    target: { x: 160, y: 260 },
    check: (y, p) => y > 5 && p < -2,
  },
  {
    name: "topRight",
    labelKey: "faceRegister.labelTopRight",
    instructionKey: "faceRegister.stepTopRight",
    target: { x: 240, y: 260 },
    check: (y, p) => y < -5 && p < -2,
  },
  {
    name: "left",
    labelKey: "faceRegister.labelLeft",
    instructionKey: "faceRegister.stepLeft",
    target: { x: 160, y: 300 },
    check: (y) => y > 5,
  },
  {
    name: "right",
    labelKey: "faceRegister.labelRight",
    instructionKey: "faceRegister.stepRight",
    target: { x: 240, y: 300 },
    check: (y) => y < -5,
  },
];

export const ACCENT = "#4fffb0";
export const BG = "#0b0d0f";
export const COUNTDOWN_MS = 1000;
export const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
export const SVG_WIDTH = 400;
export const SVG_HEIGHT = 600;
export const OVAL_CX = 200;
export const OVAL_CY = 270;
export const OVAL_RX = 130;
export const OVAL_RY = 170;
export const MISS_GRACE = 3;
export const MASK_THRESHOLD = 5;
export const FACE_CENTER_Y = 320;
