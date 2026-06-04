import logoUrl from '@icons/icon.svg'
import { ExternalLink, FolderOpen } from 'lucide-solid'
import { createEffect, createSignal, Show } from 'solid-js'
import { useTranslation } from '../lib/i18n/useTranslation'

type WelcomeProps = {
  appName: string
  appVersionLabel: string | null
  error: string | null
  onOpen: () => void
}

export function Welcome(props: WelcomeProps) {
  const { t } = useTranslation()
  const [firstRun, setFirstRun] = createSignal(false)

  createEffect(() => {
    void window.openpi.getFirstRun().then((isFirst) => setFirstRun(isFirst))
  })

  return (
    <div class="welcome-screen">
      <div class="welcome-logo-stage">
        <img class="welcome-logo" src={logoUrl} alt="OpenPi" />
        <span class="welcome-logo-scan" aria-hidden="true" />
      </div>
      <div class="eyebrow">{props.appName}</div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.subtitle')}</p>

      <Show when={firstRun()}>
        <div class="welcome-onboarding">
          <p class="welcome-onboarding-intro">
            <strong>{t('welcome.gettingStarted')}</strong> {t('welcome.onboardingIntro')}
          </p>
          <div class="welcome-onboarding-steps">
            <div class="welcome-step">
              <span class="welcome-step-num">1</span>
              <span innerHTML={t('welcome.step1')} />
            </div>
            <div class="welcome-step">
              <span class="welcome-step-num">2</span>
              <span innerHTML={t('welcome.step2')} />
            </div>
            <div class="welcome-step">
              <span class="welcome-step-num">3</span>
              <span innerHTML={t('welcome.step3')} />
            </div>
          </div>

          <div class="welcome-deepseek-card">
            <div class="welcome-deepseek-header">
              <span class="welcome-deepseek-badge">{t('providers.deepseekRecommended')}</span>
            </div>
            <h3>{t('welcome.deepseekQuickStart.title')}</h3>
            <p>{t('welcome.deepseekQuickStart.description')}</p>
            <div class="welcome-deepseek-steps">
              <div class="welcome-deepseek-step">
                <span>1.</span> {t('welcome.deepseekQuickStart.step1')}
              </div>
              <div class="welcome-deepseek-step">
                <span>2.</span> {t('welcome.deepseekQuickStart.step2')}
              </div>
              <div class="welcome-deepseek-step">
                <span>3.</span> {t('welcome.deepseekQuickStart.step3')}
              </div>
            </div>
            <a
              href="https://platform.deepseek.com"
              target="_blank"
              rel="noopener noreferrer"
              class="welcome-link"
            >
              <ExternalLink size={13} /> {t('welcome.deepseekQuickStart.connectButton')}
            </a>
          </div>

          <div class="welcome-onboarding-links">
            <a
              href="https://github.com/earendil-works/pi"
              target="_blank"
              rel="noopener noreferrer"
              class="welcome-link"
            >
              <ExternalLink size={13} /> {t('welcome.piRepo')}
            </a>
            <a
              href="https://github.com/heyhuynhgiabuu/openpi"
              target="_blank"
              rel="noopener noreferrer"
              class="welcome-link"
            >
              <ExternalLink size={13} /> {t('welcome.openpiSource')}
            </a>
          </div>
        </div>
      </Show>

      <div class="welcome-actions">
        <button type="button" class="button-primary" onClick={props.onOpen}>
          <FolderOpen size={15} /> {t('welcome.openWorkspace')}
        </button>
      </div>

      <Show when={props.error}>
        <div class="error-banner">{props.error}</div>
      </Show>
      <Show when={props.appVersionLabel}>
        {(versionLabel) => <span class="welcome-version">{versionLabel()}</span>}
      </Show>
    </div>
  )
}
