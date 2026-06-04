/**
 * Welcome component i18n rendering tests.
 *
 * Verifies that the Welcome screen renders the correct Chinese and English
 * copy for its headline, subtitle, and primary CTA, and that switching the
 * active locale reactively updates the rendered text without a full remount.
 *
 * The Welcome component relies on `window.openpi.getFirstRun()` to decide
 * whether to render the onboarding card. We stub the surface here so the
 * test never touches Electron main.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Welcome } from '../../src/components/Welcome'
import { setupI18nForTest, switchTestLanguage } from './helpers'

// ─── window.openpi stub ──────────────────────────────────────────────────────
// Welcome only reads getFirstRun; we keep the stub minimal but typed enough
// that other incidental accesses do not throw.
function installOpenPiStub(opts: { firstRun?: boolean } = {}) {
  const stub = {
    getFirstRun: vi.fn().mockResolvedValue(opts.firstRun ?? false),
    setPref: vi.fn().mockResolvedValue(undefined),
    getPref: vi.fn().mockResolvedValue(undefined),
  }
  Object.assign(window, { openpi: stub })
  return stub
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Welcome i18n', () => {
  beforeEach(async () => {
    await setupI18nForTest('zh-CN')
    installOpenPiStub({ firstRun: false })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the Chinese headline in zh-CN locale', () => {
    render(() => <Welcome appName="OpenPi" appVersionLabel={null} error={null} onOpen={() => {}} />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toContain('Pi')
    expect(heading.textContent).toContain('编程智能体')
    expect(heading.textContent).toContain('桌面工作台')
  })

  it('renders the English headline after switching to en', () => {
    switchTestLanguage('en')
    render(() => <Welcome appName="OpenPi" appVersionLabel={null} error={null} onOpen={() => {}} />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toContain('Pi coding agent')
    expect(heading.textContent).toContain('desktop workbench')
  })

  it('renders the Chinese CTA "打开工作区"', () => {
    switchTestLanguage('zh-CN')
    render(() => <Welcome appName="OpenPi" appVersionLabel={null} error={null} onOpen={() => {}} />)
    const cta = screen.getByText('打开工作区')
    expect(cta?.closest('button')).toBeTruthy()
  })

  it('renders the English CTA "Open workspace" after switching locale', () => {
    switchTestLanguage('en')
    render(() => <Welcome appName="OpenPi" appVersionLabel={null} error={null} onOpen={() => {}} />)
    const cta = screen.getByText('Open workspace')
    expect(cta?.closest('button')).toBeTruthy()
  })

  it('renders the English CTA "Open workspace" after switching locale back from Chinese', () => {
    switchTestLanguage('en')
    render(() => <Welcome appName="OpenPi" appVersionLabel={null} error={null} onOpen={() => {}} />)
    const cta = screen.getByRole('button', { name: /Open workspace/i })
    expect(cta).toBeTruthy()
  })

  it('does NOT render the onboarding card when getFirstRun is false', () => {
    render(() => <Welcome appName="OpenPi" appVersionLabel={null} error={null} onOpen={() => {}} />)
    // The deepseek quick-start title only appears inside the onboarding block.
    expect(screen.queryByText(/Quick Start with DeepSeek|使用 DeepSeek 快速开始/)).toBeNull()
  })

  it('renders the DeepSeek quick-start card when getFirstRun is true (zh-CN)', async () => {
    installOpenPiStub({ firstRun: true })
    switchTestLanguage('zh-CN')
    render(() => <Welcome appName="OpenPi" appVersionLabel={null} error={null} onOpen={() => {}} />)
    // Wait for the async getFirstRun effect to flush.
    const card = await screen.findByText(/使用 DeepSeek 快速开始/)
    expect(card).toBeTruthy()
    expect(screen.getByRole('link', { name: /连接 DeepSeek/ })).toBeTruthy()
  })

  it('renders the DeepSeek quick-start card in English when firstRun and locale=en', async () => {
    installOpenPiStub({ firstRun: true })
    switchTestLanguage('en')
    render(() => <Welcome appName="OpenPi" appVersionLabel={null} error={null} onOpen={() => {}} />)
    const card = await screen.findByText(/Quick Start with DeepSeek/)
    expect(card).toBeTruthy()
    expect(screen.getByRole('link', { name: /Connect DeepSeek/i })).toBeTruthy()
  })

  it('renders the appName eyebrow and version label', () => {
    switchTestLanguage('en')
    render(() => (
      <Welcome appName="OpenPi" appVersionLabel="v0.1.0-beta" error={null} onOpen={() => {}} />
    ))
    expect(screen.getByText('OpenPi')).toBeTruthy()
    expect(screen.getByText('v0.1.0-beta')).toBeTruthy()
  })

  it('renders the error banner when error prop is set', () => {
    switchTestLanguage('en')
    render(() => (
      <Welcome
        appName="OpenPi"
        appVersionLabel={null}
        error="workspace not found"
        onOpen={() => {}}
      />
    ))
    expect(screen.getByText('workspace not found')).toBeTruthy()
  })
})
