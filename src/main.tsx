/* @refresh reload */
import { render } from 'solid-js/web'
import App from './App'
import './index.css'
import '@xterm/xterm/css/xterm.css'
import { initI18n, type SupportedLocale } from './lib/i18n'

async function bootstrap(): Promise<void> {
  const saved = await window.openpi.getPref('language').catch(() => null)
  const locale: SupportedLocale | undefined =
    saved === 'en' || saved === 'zh-CN' ? saved : undefined
  await initI18n(locale)

  const root = document.getElementById('root')
  if (!root) throw new Error('Root element not found')
  render(() => <App />, root)
}

void bootstrap()
