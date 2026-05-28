export type StepName = "center" | "top" | "topLeft" | "topRight" | "left" | "right";

export interface Capture {
  step: StepName;
  labelKey: string;
  data: string;
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
  locale: string;
  translations?: FaceRegisterTranslations;
  /** Reserved for future verbose logging. Currently a no-op. Default `true`. */
  enableDebug?: boolean;
}
