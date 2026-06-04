import { Show } from 'solid-js'
import type { AppearancePreferences } from '../../lib/appearancePreferences'
import { DISPLAY_PREFERENCES, type DisplayPreferenceKey } from '../../lib/displayPreferences'
import type { SupportedLocale } from '../../lib/i18n'
import { useTranslation } from '../../lib/i18n/useTranslation'
import {
  NOTIFICATION_PREFERENCES,
  type NotificationPreferenceKey,
} from '../../lib/notificationPreferences'
import type { UpdatePreferenceKey } from '../../lib/updatePreferences'
import { AppearanceSection } from './AppearanceSection'
import { BooleanPreferenceSection } from './BooleanPreferenceSection'
import { DiagnosticsSection } from './DiagnosticsSection'
import type { GeneralPaneProps } from './generalPaneTypes'
import { SoundSection } from './SoundSection'
import { UpdateSection } from './UpdateSection'
import { useGeneralPaneState } from './useGeneralPaneState'

export function GeneralPane(props: GeneralPaneProps) {
  const { t, locale, setLocale } = useTranslation()
  const {
    prefs,
    notificationPrefs,
    soundPrefs,
    updatePrefs,
    updateStatus,
    checkingUpdates,
    installingUpdate,
    installOutput,
    diagnosticsOutput,
    copyingDiagnostics,
    openSoundMenu,
    setOpenSoundMenu,
    savedKey,
    loading,
    closeSoundMenu,
    saveValue,
    resetValue,
    saveNotificationValue,
    resetNotificationValue,
    saveSoundValue,
    resetSoundValue,
    previewSound,
    saveUpdateValue,
    resetUpdateValue,
    checkForUpdates,
    installUpdate,
    copyDiagnostics,
    saveAppearance,
    resetAppearance,
    appearanceRows,
  } = useGeneralPaneState(props)
  return (
    <div class="osp-root">
      <div class="osp-topbar">
        <div class="osp-scope-row">
          <div>
            <div class="osp-title">{t('settings.general')}</div>
          </div>
        </div>
      </div>

      <Show when={!loading()} fallback={<div class="osp-loading">{t('settings.loading')}</div>}>
        <div class="osp-scroll">
          <AppearanceSection
            appearanceRows={appearanceRows()}
            savedKey={savedKey()}
            onSave={(key, value) =>
              saveAppearance(key as keyof AppearancePreferences, value as never)
            }
            onReset={(key) => resetAppearance(key as keyof AppearancePreferences)}
          />
          <BooleanPreferenceSection
            title={t('settings.systemNotifications')}
            items={NOTIFICATION_PREFERENCES}
            values={notificationPrefs()}
            savedKey={savedKey()}
            onSave={(key, value) => saveNotificationValue(key as NotificationPreferenceKey, value)}
            onReset={(key) => resetNotificationValue(key as NotificationPreferenceKey)}
          />

          <SoundSection
            soundPrefs={soundPrefs()}
            openSoundMenu={openSoundMenu()}
            savedKey={savedKey()}
            onOpenSoundMenu={setOpenSoundMenu}
            onSave={saveSoundValue}
            onReset={resetSoundValue}
            onPreview={previewSound}
            onClose={closeSoundMenu}
          />

          <BooleanPreferenceSection
            title={t('settings.timeline')}
            items={DISPLAY_PREFERENCES}
            values={prefs()}
            savedKey={savedKey()}
            onSave={(key, value) => saveValue(key as DisplayPreferenceKey, value)}
            onReset={(key) => resetValue(key as DisplayPreferenceKey)}
          />

          <section class="osp-section">
            <div class="osp-section-head">{t('settings.language')}</div>
            <div class="osp-row">
              <select
                class="osp-select"
                value={locale()}
                onChange={(e) => setLocale(e.currentTarget.value as SupportedLocale)}
              >
                <option value="zh-CN">{t('settings.languageZh')}</option>
                <option value="en">{t('settings.languageEn')}</option>
              </select>
            </div>
          </section>

          <DiagnosticsSection
            diagnosticsOutput={diagnosticsOutput()}
            copyingDiagnostics={copyingDiagnostics()}
            savedKey={savedKey()}
            onCopy={copyDiagnostics}
          />

          <UpdateSection
            updatePrefs={updatePrefs()}
            savedKey={savedKey()}
            updateStatus={updateStatus()}
            checkingUpdates={checkingUpdates()}
            installingUpdate={installingUpdate()}
            installOutput={installOutput()}
            onToggle={(key: string, value: boolean) =>
              saveUpdateValue(key as UpdatePreferenceKey, value)
            }
            onReset={(key: string) => resetUpdateValue(key as UpdatePreferenceKey)}
            onCheck={checkForUpdates}
            onInstall={installUpdate}
          />
        </div>
      </Show>

      <div class="osp-footer">
        {t('settings.preferencesDescription')} {t('settings.themeNote')}
      </div>
    </div>
  )
}
