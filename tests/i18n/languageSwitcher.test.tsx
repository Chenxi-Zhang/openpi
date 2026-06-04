/**
 * Language switcher persistence test.
 *
 * Verifies the `useTranslation()` hook end-to-end:
 *   1. `setLocale('en')` reactively changes the rendered text.
 *   2. The new locale is persisted via `window.openpi.setPref('language', ...)`.
 *   3. Subsequent reads from `useTranslation().locale()` reflect the change.
 *   4. Switching back to `zh-CN` also persists and re-renders.
 *
 * The hook shares a module-level signal so all components re-render on
 * language change — we verify that by mounting two consumers and asserting
 * both update together.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTranslation } from '../../src/lib/i18n/useTranslation'
import { setupI18nForTest } from './helpers'

function installOpenPiStub() {
  const stub = {
    setPref: vi.fn().mockResolvedValue(undefined),
    getPref: vi.fn().mockResolvedValue(undefined),
  }
  Object.assign(window, { openpi: stub })
  return stub
}

/** Minimal consumer component exercising the hook. */
function LanguageConsumer() {
  const { t, locale, setLocale } = useTranslation()
  return (
    <div>
      <span data-testid="locale-label">{locale()}</span>
      <span data-testid="translated-open">{t('welcome.openWorkspace')}</span>
      <button type="button" onClick={() => setLocale('en')} data-testid="btn-en">
        EN
      </button>
      <button type="button" onClick={() => setLocale('zh-CN')} data-testid="btn-zh">
        ZH
      </button>
    </div>
  )
}

/** Two independent consumers to verify shared signal reactivity. */
function TwinConsumer() {
  const a = useTranslation()
  const b = useTranslation()
  return (
    <div>
      <span data-testid="a-open">{a.t('welcome.openWorkspace')}</span>
      <span data-testid="b-open">{b.t('welcome.openWorkspace')}</span>
      <button type="button" onClick={() => a.setLocale('en')} data-testid="switch-en">
        EN
      </button>
    </div>
  )
}

describe('Language switcher', () => {
  beforeEach(async () => {
    await setupI18nForTest('zh-CN')
    installOpenPiStub()
  })

  afterEach(() => {
    cleanup()
  })

  it('starts with the seeded locale', () => {
    render(() => <LanguageConsumer />)
    expect(screen.getByTestId('locale-label').textContent).toBe('zh-CN')
    expect(screen.getByTestId('translated-open').textContent).toBe('打开工作区')
  })

  it('switches visible text when setLocale("en") is invoked', () => {
    render(() => <LanguageConsumer />)
    const btn = screen.getByTestId('btn-en') as HTMLButtonElement
    btn.click()
    expect(screen.getByTestId('locale-label').textContent).toBe('en')
    expect(screen.getByTestId('translated-open').textContent).toBe('Open workspace')
  })

  it('persists locale change via window.openpi.setPref', () => {
    const stub = installOpenPiStub()
    render(() => <LanguageConsumer />)
    ;(screen.getByTestId('btn-en') as HTMLButtonElement).click()
    expect(stub.setPref).toHaveBeenCalledWith('language', 'en')
  })

  it('persists zh-CN when switching back from en', () => {
    const stub = installOpenPiStub()
    render(() => <LanguageConsumer />)
    ;(screen.getByTestId('btn-en') as HTMLButtonElement).click()
    ;(screen.getByTestId('btn-zh') as HTMLButtonElement).click()
    expect(stub.setPref).toHaveBeenLastCalledWith('language', 'zh-CN')
    expect(screen.getByTestId('locale-label').textContent).toBe('zh-CN')
  })

  it('reactively updates multiple consumers from a single setLocale call', () => {
    render(() => <TwinConsumer />)
    expect(screen.getByTestId('a-open').textContent).toBe('打开工作区')
    expect(screen.getByTestId('b-open').textContent).toBe('打开工作区')
    ;(screen.getByTestId('switch-en') as HTMLButtonElement).click()
    expect(screen.getByTestId('a-open').textContent).toBe('Open workspace')
    expect(screen.getByTestId('b-open').textContent).toBe('Open workspace')
  })
})
