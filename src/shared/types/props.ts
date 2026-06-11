import type { Capture } from "./capture";
import type { FaceRegisterTranslations } from "./translations";

export interface FaceRegisterProps {
  onComplete?: (captures: Capture[]) => void;
  onExit?: () => void;
  locale: string;
  translations?: FaceRegisterTranslations;
  /** Reserved for future verbose logging. Currently a no-op. Default `true`. */
  enableDebug?: boolean;
}
