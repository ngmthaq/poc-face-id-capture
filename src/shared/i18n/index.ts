import i18next, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ja from "./locales/ja";
import type { FaceRegisterTranslations } from "../types/faceRegister";

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
  if (locale && libraryI18n.language !== locale) {
    const builtIn = builtInResources[locale as keyof typeof builtInResources];
    if (builtIn) {
      libraryI18n.addResourceBundle(locale, "translation", builtIn.translation, true, false);
    }
    libraryI18n.changeLanguage(locale);
  }

  if (translations) {
    const lng = locale ?? libraryI18n.language ?? "en";
    libraryI18n.addResourceBundle(lng, "translation", { faceRegister: translations }, true, true);
  }
}

export const ensureI18n = applyI18nConfig;

export default libraryI18n;
