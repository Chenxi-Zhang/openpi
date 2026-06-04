import { changeLanguage, initI18n, type SupportedLocale } from '../../src/lib/i18n'

/**
 * Initialize i18next for a specific locale in test context.
 *
 * `initI18n` uses a singleton pattern — the first call initializes the
 * instance and subsequent calls return it. To switch locales after init,
 * use `switchTestLanguage()` (which delegates to `changeLanguage()`).
 */
export async function setupI18nForTest(locale: SupportedLocale = 'zh-CN'): Promise<void> {
  await initI18n(locale)
}

/**
 * Switch the active language at runtime within a test.
 * Safe to call any number of times after `setupI18nForTest()`.
 */
export function switchTestLanguage(locale: SupportedLocale): void {
  changeLanguage(locale)
}
