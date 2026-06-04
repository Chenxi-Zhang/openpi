// biome-ignore-all lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: preserves existing provider modal backdrop click behavior.
import { ArrowLeft, Plus, Trash2, X } from 'lucide-solid'
import { For, Show } from 'solid-js'
import { useTranslation } from '../../lib/i18n/useTranslation'
import type { FormErrors, FormState, HeaderRow, ModelRow } from './providerHelpers'

interface CustomProviderFormViewProps {
  form: FormState
  formErrors: FormErrors
  formSaving: boolean
  onClose: () => void
  onBack: () => void
  onUpdateForm: (patch: Partial<FormState>) => void
  onTouch: (field: string) => void
  onAddModel: () => void
  onRemoveModel: (index: number) => void
  onUpdateModel: (index: number, patch: Partial<ModelRow>) => void
  onAddHeader: () => void
  onRemoveHeader: (index: number) => void
  onUpdateHeader: (index: number, patch: Partial<HeaderRow>) => void
  onSubmit: () => void
}

export function CustomProviderFormView(props: CustomProviderFormViewProps) {
  const { t } = useTranslation()

  return (
    <div
      class="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) props.onClose()
      }}
    >
      <div class="modal-sheet cp-sheet">
        <div class="cp-header">
          <div class="cp-header-left">
            <button
              type="button"
              class="cp-back-btn"
              onClick={props.onBack}
              title={t('providers.backToList')}
            >
              <ArrowLeft size={14} strokeWidth={2} />
            </button>
            <h2 class="cp-title">{t('providers.customProviderTitle')}</h2>
          </div>
          <button type="button" class="modal-close-btn" onClick={props.onClose}>
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        <div class="cp-custom-form-body">
          <p class="cp-custom-form-desc">
            {t('providers.customProviderDesc')}
            <a
              class="cp-custom-form-link"
              href="https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('providers.seeDocs')}
            </a>
            .
          </p>

          <ProviderIdField {...props} t={t} />
          <DisplayNameField form={props.form} onUpdateForm={props.onUpdateForm} t={t} />
          <BaseUrlField {...props} t={t} />
          <ApiKeyField form={props.form} onUpdateForm={props.onUpdateForm} t={t} />
          <ModelsField {...props} t={t} />
          <HeadersField {...props} t={t} />

          <Show when={props.formErrors.submit}>
            <p class="cp-key-error" style={{ 'margin-bottom': '8px' }}>
              {props.formErrors.submit}
            </p>
          </Show>

          <div class="cp-custom-form-actions">
            <button
              type="button"
              class="cp-key-save"
              disabled={props.formSaving}
              onClick={props.onSubmit}
            >
              {props.formSaving ? t('providers.adding') : t('providers.addProvider')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FieldProps extends CustomProviderFormViewProps {
  t: (key: string, options?: Record<string, unknown>) => string
}

function ProviderIdField(props: FieldProps) {
  return (
    <div class="cp-form-field">
      <label class="cp-form-label" for="provider-id">
        {props.t('providers.providerId')}
      </label>
      <input
        id="provider-id"
        class={`cp-form-input ${props.formErrors.providerId ? 'is-error' : ''}`}
        placeholder="myprovider"
        value={props.form.providerId}
        onInput={(event) => props.onUpdateForm({ providerId: event.currentTarget.value })}
        onBlur={() => props.onTouch('providerId')}
        autofocus
        spellcheck={false}
      />
      <Show
        when={props.formErrors.providerId}
        fallback={<p class="cp-form-hint">{props.t('providers.providerIdHint')}</p>}
      >
        <p class="cp-form-hint is-error">{props.t(`providers.${props.formErrors.providerId}`)}</p>
      </Show>
    </div>
  )
}

interface BasicFieldProps {
  form: FormState
  onUpdateForm: (patch: Partial<FormState>) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

function DisplayNameField(props: BasicFieldProps) {
  return (
    <div class="cp-form-field">
      <label class="cp-form-label" for="provider-display-name">
        {props.t('providers.displayName')}
      </label>
      <input
        id="provider-display-name"
        class="cp-form-input"
        placeholder="My AI Provider"
        value={props.form.displayName}
        onInput={(event) => props.onUpdateForm({ displayName: event.currentTarget.value })}
      />
    </div>
  )
}

function BaseUrlField(props: FieldProps) {
  return (
    <div class="cp-form-field">
      <label class="cp-form-label" for="provider-base-url">
        {props.t('providers.baseUrl')}
      </label>
      <input
        id="provider-base-url"
        class={`cp-form-input ${props.formErrors.baseUrl ? 'is-error' : ''}`}
        placeholder="https://api.myprovider.com/v1"
        value={props.form.baseUrl}
        onInput={(event) => props.onUpdateForm({ baseUrl: event.currentTarget.value })}
        onBlur={() => props.onTouch('baseUrl')}
        spellcheck={false}
      />
      <Show when={props.formErrors.baseUrl}>
        <p class="cp-form-hint is-error">{props.t(`providers.${props.formErrors.baseUrl}`)}</p>
      </Show>
    </div>
  )
}

function ApiKeyField(props: BasicFieldProps) {
  return (
    <div class="cp-form-field">
      <label class="cp-form-label" for="provider-api-key">
        {props.t('providers.apiKey')}
      </label>
      <input
        id="provider-api-key"
        class="cp-form-input"
        type="password"
        placeholder="API key"
        value={props.form.apiKey}
        onInput={(event) => props.onUpdateForm({ apiKey: event.currentTarget.value })}
        autocomplete="off"
      />
      <p class="cp-form-hint">{props.t('providers.apiKeyOptional')}</p>
    </div>
  )
}

function ModelsField(props: FieldProps) {
  return (
    <div class="cp-form-field">
      <span class="cp-form-label">{props.t('providers.models')}</span>
      <Show when={props.formErrors.models}>
        <p class="cp-form-hint is-error" style={{ 'margin-bottom': '6px' }}>
          {props.t(`providers.${props.formErrors.models}`)}
        </p>
      </Show>
      <div class="cp-models-list">
        <For each={props.form.models}>
          {(model, index) => (
            <div class="cp-model-row">
              <div class="cp-model-inputs">
                <input
                  class={`cp-form-input cp-model-id-input ${props.formErrors[`model_${index()}` as const] ? 'is-error' : ''}`}
                  placeholder="model-id"
                  value={model.id}
                  onInput={(event) =>
                    props.onUpdateModel(index(), { id: event.currentTarget.value })
                  }
                  onBlur={() => props.onTouch(`model_${index()}`)}
                  spellcheck={false}
                />
                <input
                  class="cp-form-input cp-model-name-input"
                  placeholder="Display Name"
                  value={model.name}
                  onInput={(event) =>
                    props.onUpdateModel(index(), { name: event.currentTarget.value })
                  }
                />
              </div>
              <Show when={props.form.models.length > 1}>
                <button
                  type="button"
                  class="cp-model-remove-btn"
                  onClick={() => props.onRemoveModel(index())}
                  title={props.t('providers.removeModel')}
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </Show>
            </div>
          )}
        </For>
      </div>
      <button type="button" class="cp-add-row-btn" onClick={props.onAddModel}>
        <Plus size={12} strokeWidth={2.5} />
        {props.t('providers.addModel')}
      </button>
    </div>
  )
}

function HeadersField(props: FieldProps) {
  return (
    <div class="cp-form-field">
      <span class="cp-form-label">
        {props.t('providers.headers')}{' '}
        <span class="cp-form-label-optional">{props.t('providers.headersOptional')}</span>
      </span>
      <Show when={props.form.headers.length > 0}>
        <div class="cp-models-list">
          <For each={props.form.headers}>
            {(header, index) => (
              <div class="cp-model-row">
                <div class="cp-model-inputs">
                  <input
                    class="cp-form-input cp-model-id-input"
                    placeholder="Header-Name"
                    value={header.key}
                    onInput={(event) =>
                      props.onUpdateHeader(index(), { key: event.currentTarget.value })
                    }
                    spellcheck={false}
                  />
                  <input
                    class="cp-form-input cp-model-name-input"
                    placeholder="value"
                    value={header.value}
                    onInput={(event) =>
                      props.onUpdateHeader(index(), { value: event.currentTarget.value })
                    }
                    spellcheck={false}
                  />
                </div>
                <button
                  type="button"
                  class="cp-model-remove-btn"
                  onClick={() => props.onRemoveHeader(index())}
                  title={props.t('providers.removeHeader')}
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>
      <button type="button" class="cp-add-row-btn" onClick={props.onAddHeader}>
        <Plus size={12} strokeWidth={2.5} />
        {props.t('providers.addHeader')}
      </button>
    </div>
  )
}
