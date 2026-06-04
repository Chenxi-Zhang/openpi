/**
 * SolidJS reactive translation hook.
 *
 * Provides a singleton language signal shared across all components so that
 * calling `setLocale` in one place re-renders every component that reads
 * `t()` or `locale()`.
 */

import { createSignal } from 'solid-js'
import {
  changeLanguage as changeLanguageCore,
  getCurrentLanguage,
  type SupportedLocale,
  t as staticT,
} from './index'

const [locale, setLocaleSignal] = createSignal<SupportedLocale>(getCurrentLanguage())

/**
 * Reactive translation function. Reads the current locale signal inside the
 * returned `t` closure so that any JSX expression calling `t(key)` in a
 * tracked scope re-runs when the language changes.
 */
function useTranslation() {
  const t = (key: string, options?: Record<string, unknown>): string => {
    void locale() // subscribe to locale signal for SolidJS reactivity
    return staticT(key, options)
  }

  const setLocale = (next: SupportedLocale): void => {
    changeLanguageCore(next)
    setLocaleSignal(next)
    window.openpi.setPref('language', next).catch(() => {})
  }

  return { t, locale, setLocale }
}

export { useTranslation }

/**
 * Sync the module-level locale signal without triggering i18next or pref storage.
 * Use when i18next instance was updated externally to keep the signal in sync.
 */
export function syncLocaleSignal(locale: SupportedLocale): void {
  setLocaleSignal(locale)
}
