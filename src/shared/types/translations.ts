import type en from "../translations/locales/en";

export type TranslationBundle = typeof en;

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
  recordingInstruction?: string;
  processingTitle?: string;
  processingSub?: string;
  retryTitle?: string;
  retrySub?: string;
  retryButton?: string;
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
