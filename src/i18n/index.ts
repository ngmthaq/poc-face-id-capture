import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ja from "./locales/ja";

let initialized = false;

/**
 * Ensures i18next is initialized with the face-register translations.
 * If the consumer has already initialized i18next, this only adds the
 * resource bundles without overwriting their configuration.
 */
export function ensureI18n() {
  if (initialized) return;
  initialized = true;

  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        ja: { translation: ja },
      },
      lng: "en",
      fallbackLng: "en",
      interpolation: {
        escapeValue: false,
      },
    });
  } else {
    // Add our translations to the existing i18n instance
    i18n.addResourceBundle("en", "translation", en, true, false);
    i18n.addResourceBundle("ja", "translation", ja, true, false);
  }
}

export default i18n;
