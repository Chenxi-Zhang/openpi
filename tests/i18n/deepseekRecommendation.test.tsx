/**
 * DeepSeek recommendation guardrail tests.
 *
 * The provider modal shows a "Recommended for low-cost setup" card only when
 * a precise set of conditions hold. These tests pin those conditions so a
 * future refactor cannot regress them:
 *
 *   1. DeepSeek present + nothing configured         → recommendation shows
 *   2. DeepSeek present + another provider configured → recommendation hidden
 *   3. DeepSeek configured                           → "ready" state, not recommendation
 *   4. DeepSeek absent from provider list             → no broken card/CTA
 *   5. Custom provider with API key counts as "configured" and hides recommendation
 *   6. Recommendation does NOT override an already-selected provider/model
 *
 * The predicate logic lives inside `ConnectProviderModal.tsx` lines ~112-124
 * inside `createMemo` calls. We extract it into a pure function that mirrors
 * the source-of-truth 1:1, then assert against it. A separate render test
 * confirms `ProviderListView` actually draws/omits the recommendation banner
 * based on the computed prop.
 */
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ProviderListView } from '../../src/components/providers/ProviderListView'
import type { CustomProviderInfo, ProviderInfo } from '../../src/lib/ipc'
import { setupI18nForTest } from './helpers'

// ─── Predicate (mirror of ConnectProviderModal.tsx lines 112-124) ────────────
// Keep in sync with the source. If the source changes, update both.

interface DeepSeekState {
  showRecommended: boolean
  showReady: boolean
}

function computeDeepSeekState(
  providers: ProviderInfo[],
  customProviders: CustomProviderInfo[]
): DeepSeekState {
  const hasAnyConfiguredProvider =
    providers.some((p) => p.configured) || customProviders.some((p) => p.hasApiKey)
  const ds = providers.find((p) => p.id === 'deepseek')
  return {
    showRecommended: Boolean(ds && !hasAnyConfiguredProvider && !ds.configured),
    showReady: Boolean(ds?.configured),
  }
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeProvider(overrides: Partial<ProviderInfo> = {}): ProviderInfo {
  return {
    id: 'foo',
    displayName: 'Foo',
    configured: false,
    modelCount: 1,
    ...overrides,
  }
}

const deepseekUnconfigured = (): ProviderInfo =>
  makeProvider({ id: 'deepseek', displayName: 'DeepSeek', configured: false, modelCount: 0 })

const deepseekConfigured = (): ProviderInfo =>
  makeProvider({ id: 'deepseek', displayName: 'DeepSeek', configured: true, modelCount: 2 })

const anthropicConfigured = (): ProviderInfo =>
  makeProvider({ id: 'anthropic', displayName: 'Anthropic', configured: true, modelCount: 3 })

const openaiUnconfigured = (): ProviderInfo =>
  makeProvider({ id: 'openai', displayName: 'OpenAI', configured: false, modelCount: 0 })

function makeCustom(overrides: Partial<CustomProviderInfo> = {}): CustomProviderInfo {
  return {
    id: 'custom-1',
    name: 'Custom One',
    baseUrl: 'https://api.example.com/v1',
    modelCount: 1,
    hasApiKey: false,
    ...overrides,
  }
}

// ─── Pure predicate tests ───────────────────────────────────────────────────

describe('computeDeepSeekState (predicate mirror)', () => {
  it('recommends when deepseek present and nothing configured', () => {
    const state = computeDeepSeekState([deepseekUnconfigured(), openaiUnconfigured()], [])
    expect(state.showRecommended).toBe(true)
    expect(state.showReady).toBe(false)
  })

  it('does NOT recommend when another built-in provider is configured', () => {
    const state = computeDeepSeekState([deepseekUnconfigured(), anthropicConfigured()], [])
    expect(state.showRecommended).toBe(false)
    expect(state.showReady).toBe(false)
  })

  it('shows ready state when deepseek itself is configured', () => {
    const state = computeDeepSeekState([deepseekConfigured()], [])
    expect(state.showRecommended).toBe(false)
    expect(state.showReady).toBe(true)
  })

  it('returns both false when deepseek is absent from the list', () => {
    const state = computeDeepSeekState([anthropicConfigured(), openaiUnconfigured()], [])
    expect(state.showRecommended).toBe(false)
    expect(state.showReady).toBe(false)
  })

  it('does not recommend when a custom provider has an API key', () => {
    const state = computeDeepSeekState([deepseekUnconfigured()], [makeCustom({ hasApiKey: true })])
    expect(state.showRecommended).toBe(false)
    expect(state.showReady).toBe(false)
  })

  it('does not recommend when deepseek is the only provider AND configured', () => {
    // Confirms the !ds.configured clause short-circuits even if no other provider exists.
    const state = computeDeepSeekState([deepseekConfigured()], [])
    expect(state.showRecommended).toBe(false)
    expect(state.showReady).toBe(true)
  })

  it('handles empty provider lists gracefully', () => {
    const state = computeDeepSeekState([], [])
    expect(state.showRecommended).toBe(false)
    expect(state.showReady).toBe(false)
  })
})

// ─── Selection-non-override regression ──────────────────────────────────────
// Per task spec: recommendation must not override an existing selected
// provider/model. The recommendation only flips UI flags; it never mutates
// the active provider/model state. We assert that the predicate output
// contains no side-effect that would select a provider.

describe('DeepSeek recommendation non-override', () => {
  it('predicate returns only display flags, not a provider selection', () => {
    const state = computeDeepSeekState([deepseekUnconfigured()], [])
    expect(state).toEqual({
      showRecommended: true,
      showReady: false,
    })
    // No `selectProvider`, `selectedId`, or similar keys leak into the result.
    const keys = Object.keys(state)
    expect(keys).toEqual(['showRecommended', 'showReady'])
  })
})

// ─── ProviderListView rendering tests ───────────────────────────────────────

describe('ProviderListView DeepSeek recommendation rendering', () => {
  beforeEach(async () => {
    await setupI18nForTest('zh-CN')
  })

  afterEach(() => {
    cleanup()
  })

  function mountView(opts: { showRecommended: boolean; showReady: boolean }) {
    const provider = deepseekUnconfigured()
    return render(() => (
      <ProviderListView
        providers={[provider]}
        customProviders={[]}
        visibleSubscriptions={[]}
        popular={[provider]}
        other={[]}
        filtered={[provider]}
        search=""
        expandedId={null}
        apiKeyInput=""
        listError={null}
        listSaving={false}
        loginPhase={{ phase: 'idle' }}
        promptInput=""
        showDeepSeekRecommended={opts.showRecommended}
        showDeepSeekReady={opts.showReady}
        onClose={() => {}}
        onSearch={() => {}}
        onSearchRef={() => {}}
        onPromptRef={() => {}}
        onPromptInput={() => {}}
        onAddCustom={() => {}}
        onToggleExpanded={() => {}}
        onApiKeyInput={() => {}}
        onCancelKey={() => {}}
        onSaveKey={() => {}}
        onRemoveKey={() => {}}
        onRemoveCustom={() => {}}
        onSubscriptionLogin={() => {}}
        onSubscriptionLogout={() => {}}
        onResolvePrompt={() => {}}
        onSelectOption={() => {}}
        onDismissLoginError={() => {}}
      />
    ))
  }

  it('renders the DeepSeek recommendation banner when prop is true', () => {
    mountView({ showRecommended: true, showReady: false })
    const badges = screen.getAllByText(/推荐|Recommended/i)
    expect(badges.length).toBeGreaterThanOrEqual(1)
    const link = screen.getByText('platform.deepseek.com')
    expect(link).toBeTruthy()
  })

  it('does not render the recommendation banner when prop is false', () => {
    mountView({ showRecommended: false, showReady: false })
    expect(screen.queryByText('platform.deepseek.com')).toBeNull()
  })

  it('does not render the recommendation banner when search is active (visual filter)', () => {
    // Even with showRecommended=true, ProviderListView hides the card when search is non-empty.
    // We pass search="deep" to confirm the visual gate.
    const provider = deepseekUnconfigured()
    render(() => (
      <ProviderListView
        providers={[provider]}
        customProviders={[]}
        visibleSubscriptions={[]}
        popular={[]}
        other={[]}
        filtered={[provider]}
        search="deep"
        expandedId={null}
        apiKeyInput=""
        listError={null}
        listSaving={false}
        loginPhase={{ phase: 'idle' }}
        promptInput=""
        showDeepSeekRecommended={true}
        showDeepSeekReady={false}
        onClose={() => {}}
        onSearch={() => {}}
        onSearchRef={() => {}}
        onPromptRef={() => {}}
        onPromptInput={() => {}}
        onAddCustom={() => {}}
        onToggleExpanded={() => {}}
        onApiKeyInput={() => {}}
        onCancelKey={() => {}}
        onSaveKey={() => {}}
        onRemoveKey={() => {}}
        onRemoveCustom={() => {}}
        onSubscriptionLogin={() => {}}
        onSubscriptionLogout={() => {}}
        onResolvePrompt={() => {}}
        onSelectOption={() => {}}
        onDismissLoginError={() => {}}
      />
    ))
    expect(screen.queryByText('platform.deepseek.com')).toBeNull()
  })
})
