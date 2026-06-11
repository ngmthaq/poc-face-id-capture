import { createContext, useContext, type ReactNode } from "react";
import type { FaceRegisterTranslations, TranslationBundle } from "../types/translations";
import en from "./locales/en";
import ja from "./locales/ja";

export const TRANSLATIONS: Record<string, TranslationBundle> = { en, ja };

export function resolveTranslations(
  locale: string,
  overrides?: FaceRegisterTranslations,
): TranslationBundle {
  const base = TRANSLATIONS[locale] ?? TRANSLATIONS.en;
  if (!overrides) return base;
  return {
    ...base,
    faceRegister: { ...base.faceRegister, ...overrides },
  };
}

export function translate(
  bundle: TranslationBundle,
  key: string,
  params?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let node: unknown = bundle;
  for (const p of parts) {
    if (node && typeof node === "object" && p in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  if (typeof node !== "string") return key;
  if (!params) return node;
  return node.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name];
    return value === undefined ? `{{${name}}}` : String(value);
  });
}

const TranslationContext = createContext<TranslationBundle>(TRANSLATIONS.en);

interface TranslationProviderProps {
  value: TranslationBundle;
  children: ReactNode;
}

export function TranslationProvider({ value, children }: TranslationProviderProps) {
  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslate() {
  const bundle = useContext(TranslationContext);
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(bundle, key, params);
  return { t };
}
