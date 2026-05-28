import i18next, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ja from "./locales/ja";
import type { FaceRegisterTranslations } from "../types/faceRegister";

let isI18nDebugEnabled = true;

/** Internal — toggles the `[i18n-debug]` log gate shared by every `<FaceRegister>` instance. */
export function setI18nDebugEnabled(enabled: boolean): void {
  isI18nDebugEnabled = enabled;
}

const builtInResources = {
  en: { translation: en },
  ja: { translation: ja },
};

export const libraryI18n: I18nInstance = i18next.createInstance();

libraryI18n.use(initReactI18next).init({
  resources: builtInResources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  initImmediate: false,
  react: { useSuspense: false },
});

export function applyI18nConfig(locale?: string, translations?: FaceRegisterTranslations) {
  if (isI18nDebugEnabled) {
    console.log("[i18n-debug][applyI18nConfig:enter]", {
      locale,
      translations: translations ? Object.keys(translations) : null,
    });
    console.log("[i18n-debug][applyI18nConfig:pre]", {
      language: libraryI18n.language,
      isInitialized: libraryI18n.isInitialized,
      faceRegister: libraryI18n.getResourceBundle(libraryI18n.language, "translation")
        ?.faceRegister,
    });
  }

  if (locale && libraryI18n.language !== locale) {
    const builtIn = builtInResources[locale as keyof typeof builtInResources];
    if (builtIn) {
      if (isI18nDebugEnabled) {
        console.log("[i18n-debug][applyI18nConfig:branch-builtin]", {
          locale,
          builtInKeys: Object.keys(builtIn.translation),
        });
      }
      libraryI18n.addResourceBundle(locale, "translation", builtIn.translation, true, false);
    }
    if (isI18nDebugEnabled) {
      console.log("[i18n-debug][applyI18nConfig:branch-language-change]", {
        from: libraryI18n.language,
        to: locale,
      });
    }
    libraryI18n.changeLanguage(locale);
  }

  if (translations) {
    const lng = locale ?? libraryI18n.language ?? "en";
    if (isI18nDebugEnabled) {
      console.log("[i18n-debug][applyI18nConfig:branch-translations]", {
        locale: lng,
        payload: translations,
      });
    }
    libraryI18n.addResourceBundle(lng, "translation", { faceRegister: translations }, true, true);
  }

  if (isI18nDebugEnabled) {
    console.log("[i18n-debug][applyI18nConfig:post]", {
      language: libraryI18n.language,
      faceRegister: libraryI18n.getResourceBundle(libraryI18n.language, "translation")
        ?.faceRegister,
    });
  }
}

export const ensureI18n = applyI18nConfig;

export default libraryI18n;
