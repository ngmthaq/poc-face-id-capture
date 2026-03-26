import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ja from "./locales/ja";
import type { FaceRegisterTranslations } from "../FaceRegister/constants";

const builtInResources: Record<string, { faceRegister: Record<string, string> }> = {
  en,
  ja,
};

let baseInitialized = false;

/**
 * Ensures i18next is initialized with the face-register translations.
 * If the consumer has already initialized i18next, this only adds the
 * resource bundles without overwriting their existing keys.
 *
 * Consumer overrides via `translations` are applied on every call so
 * that prop changes are reflected.
 */
export function ensureI18n(
  locale?: string,
  translations?: FaceRegisterTranslations,
) {
  // ── one-time setup: load built-in EN/JA bundles ──
  if (!baseInitialized) {
    baseInitialized = true;

    if (!i18n.isInitialized) {
      i18n.use(initReactI18next).init({
        resources: {
          en: { translation: en },
          ja: { translation: ja },
        },
        lng: locale ?? "en",
        fallbackLng: "en",
        interpolation: {
          escapeValue: false,
        },
        initImmediate: false,
      });
    } else {
      // deep merge, don't overwrite consumer's existing keys
      i18n.addResourceBundle("en", "translation", en, true, false);
      i18n.addResourceBundle("ja", "translation", ja, true, false);
    }
  }

  // ── apply locale change ──
  if (locale && i18n.language !== locale) {
    // If switching to a locale we have built-in translations for,
    // ensure those are loaded
    const builtIn = builtInResources[locale];
    if (builtIn) {
      i18n.addResourceBundle(locale, "translation", builtIn, true, false);
    }
    i18n.changeLanguage(locale);
  }

  // ── merge consumer overrides (deep merge, overwrite existing) ──
  if (translations) {
    const lng = locale ?? i18n.language ?? "en";
    i18n.addResourceBundle(
      lng,
      "translation",
      { faceRegister: translations },
      true,
      true,
    );
  }
}

export default i18n;
