/**
 * i18n initialization module for OpenPi.
 *
 * Bundles locale resources statically (no HTTP fetch) and exposes a small
 * surface for translation and language switching. The reactive SolidJS
 * integration is added in a separate module (Task 2) via solid-i18next.
 */

import i18next, { type i18n as I18nInstance } from 'i18next'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

/** Locales shipped with OpenPi. */
export type SupportedLocale = 'zh-CN' | 'en'

/** Default locale used when no user preference is stored. */
export const DEFAULT_LOCALE: SupportedLocale = 'zh-CN'

/** Fallback when a key is missing for the active locale. */
export const FALLBACK_LOCALE: SupportedLocale = 'en'

interface BundledResource {
  [namespace: string]: typeof en
}

const resources: Record<SupportedLocale, BundledResource> = {
  'zh-CN': { translation: zhCN },
  en: { translation: en },
}

let instance: I18nInstance | null = null

/**
 * Initialize i18next with bundled resources. Safe to call once; subsequent
 * calls return the existing instance. Resolves once initialization completes.
 */
export async function initI18n(lng: SupportedLocale = DEFAULT_LOCALE): Promise<I18nInstance> {
  if (instance) return instance
  const created = i18next.createInstance()
  await created.init({
    resources,
    lng,
    fallbackLng: FALLBACK_LOCALE,
    interpolation: { escapeValue: false },
  })
  instance = created
  return created
}

/**
 * Switch the active language at runtime.
 */
export function changeLanguage(locale: SupportedLocale): void {
  if (!instance) return
  instance.changeLanguage(locale)
}

/**
 * Direct translation helper. Returns the key unchanged if i18next has not
 * been initialized yet (e.g., during early render before initI18n resolves).
 */
export function t(key: string, options?: Record<string, unknown>): string {
  if (!instance) return key
  return instance.t(key, options)
}

/**
 * Return the currently active language tag, or the default locale if i18next
 * has not been initialized yet.
 */
export function getCurrentLanguage(): SupportedLocale {
  if (!instance) return DEFAULT_LOCALE
  const lng = instance.language
  if (lng === 'en' || lng === 'zh-CN') return lng
  return DEFAULT_LOCALE
}
