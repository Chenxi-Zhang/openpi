import { Check, Plus, X } from 'lucide-solid'
import { Show } from 'solid-js'
import { useTranslation } from '../../lib/i18n/useTranslation'
import type { ProviderInfo } from '../../lib/ipc'
import { getProviderLabel } from '../../lib/providers'
import { PROVIDER_DESCRIPTIONS } from './providerHelpers'

interface BuiltInProviderRowProps {
  provider: ProviderInfo
  expanded: boolean
  apiKeyInput: string
  listError: string | null
  listSaving: boolean
  showDeepSeekRecommended: boolean
  showDeepSeekReady: boolean
  onExpand: () => void
  onApiKeyInput: (value: string) => void
  onCancel: () => void
  onSave: () => void
  onRemove: () => void
}

export function BuiltInProviderRow(props: BuiltInProviderRowProps) {
  const { t } = useTranslation()
  const description = () => PROVIDER_DESCRIPTIONS[props.provider.id]

  return (
    <div class={`cp-provider-row ${props.provider.configured ? 'is-connected' : ''}`}>
      <div class="cp-provider-header">
        <div class="cp-provider-info">
          <span class="cp-provider-name">
            {getProviderLabel(props.provider.id)}
            <Show when={props.showDeepSeekRecommended}>
              <span class="cp-provider-badge cp-provider-badge--recommended">
                {t('providers.deepseekRecommended')}
              </span>
            </Show>
          </span>
          <Show when={description()}>
            <span class="cp-provider-desc">{description()}</span>
          </Show>
        </div>
        <div class="cp-provider-actions">
          <span class="cp-model-count">{props.provider.modelCount}m</span>
          <Show
            when={props.provider.configured}
            fallback={
              <button
                type="button"
                class={`cp-connect-btn ${props.expanded ? 'is-active' : ''}`}
                onClick={props.onExpand}
                title={t('providers.addApiKey')}
              >
                <Plus size={12} strokeWidth={2.5} />
              </button>
            }
          >
            <div
              class="cp-connected-badge"
              title={props.showDeepSeekReady ? t('providers.deepseekReady') : undefined}
            >
              <Check size={11} strokeWidth={2.5} />
              <span>{t('providers.connected')}</span>
              <button
                type="button"
                class="cp-disconnect-btn"
                onClick={props.onRemove}
                title={t('providers.disconnect')}
              >
                <X size={10} strokeWidth={2} />
              </button>
            </div>
          </Show>
        </div>
      </div>

      <Show when={props.expanded}>
        <div class="cp-key-form">
          <input
            autofocus
            type="password"
            class="cp-key-input"
            placeholder={`${props.provider.displayName} API key`}
            value={props.apiKeyInput}
            onInput={(e) => props.onApiKeyInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') props.onSave()
            }}
          />
          <Show when={props.listError}>
            <p class="cp-key-error">{props.listError}</p>
          </Show>
          <div class="cp-key-actions">
            <button type="button" class="cp-key-cancel" onClick={props.onCancel}>
              {t('providers.cancel')}
            </button>
            <button
              type="button"
              class="cp-key-save"
              disabled={!props.apiKeyInput.trim() || props.listSaving}
              onClick={props.onSave}
            >
              {props.listSaving ? t('providers.saving') : t('providers.save')}
            </button>
          </div>
        </div>
      </Show>
    </div>
  )
}
