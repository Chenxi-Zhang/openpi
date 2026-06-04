import {
  ArrowUpCircle,
  FileText,
  Folder,
  FolderTree,
  GitBranch,
  GitFork,
  MessageSquareText,
  SquareTerminal,
} from 'lucide-solid'
import { createSignal, Show } from 'solid-js'
import { useTranslation } from '../lib/i18n/useTranslation'
import type { AppUpdateStatus, GoalUpdate } from '../lib/ipc'
import { ChangelogModal } from './ChangelogModal'

export type LeftDrawerMode = 'threads' | 'workspace' | 'tree'

const HOMEBREW_UPGRADE_COMMAND = 'brew update && brew upgrade --cask openpi'

type TFn = (key: string, options?: Record<string, unknown>) => string

function formatGoalLabel(goal: GoalUpdate, t: TFn): string {
  if (!goal.objective || !goal.status) return ''
  const short = goal.objective.length > 40 ? `${goal.objective.slice(0, 37)}…` : goal.objective
  switch (goal.status) {
    case 'active':
      if (goal.tokenBudget != null) {
        return `${short} (${fmtTokens(goal.tokensUsed)} / ${fmtTokens(goal.tokenBudget)})`
      }
      return `${short} (${fmtElapsed(goal.timeUsedSeconds)})`
    case 'paused':
      return t('bottombar.goalPaused')
    case 'budget_limited':
      return goal.tokenBudget != null
        ? t('bottombar.budgetUsedWithTotals', {
            used: fmtTokens(goal.tokensUsed),
            budget: fmtTokens(goal.tokenBudget),
          })
        : t('bottombar.budgetUsed')
    case 'complete':
      return t('bottombar.goalAchieved')
    default:
      return short
  }
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function fmtElapsed(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm === 0 ? `${h}h` : `${h}h ${rm}m`
}

type BottomBarProps = {
  leftDrawerOpen: boolean
  leftDrawerMode: LeftDrawerMode
  onToggleThreads: () => void
  onToggleWorkspace: () => void
  onToggleTree: () => void
  gitPanelOpen: boolean
  onToggleGitPanel: () => void
  filePanelOpen: boolean
  onToggleFilePanel: () => void
  terminalOpen: boolean
  onToggleTerminal: () => void
  /** OpenPi version string e.g. "0.1.12" */
  appVersion?: string
  isStreaming: boolean
  /** Current git sync operation in progress, or null when idle. */
  gitSyncAction?: string | null
  /** Last git sync result message (e.g. "Already up to date."). */
  gitSyncMessage?: string | null
  /** Current goal state from the harness extension, or null when idle. */
  goalUpdate?: GoalUpdate | null
}

export function BottomBar(props: BottomBarProps) {
  const { t } = useTranslation()
  const [changelogOpen, setChangelogOpen] = createSignal(false)
  const [updateStatus, setUpdateStatus] = createSignal<AppUpdateStatus | null>(null)
  const [updateCommandCopied, setUpdateCommandCopied] = createSignal(false)

  const updateAvailable = () => updateStatus()?.state === 'available'

  const copyUpgradeCommand = async () => {
    try {
      await navigator.clipboard.writeText(HOMEBREW_UPGRADE_COMMAND)
      setUpdateCommandCopied(true)
      setTimeout(() => setUpdateCommandCopied(false), 2000)
    } catch {
      const url = updateStatus()?.releaseUrl
      if (url) window.open(url, '_blank')
    }
  }

  const syncActionLabel = () => {
    switch (props.gitSyncAction) {
      case 'fetch':
        return t('bottombar.fetching')
      case 'pull':
        return t('bottombar.pulling')
      case 'pull-rebase':
        return t('bottombar.pullingRebase')
      case 'push':
        return t('bottombar.pushing')
      default:
        return null
    }
  }

  const syncResultSnippet = () => {
    const msg = props.gitSyncMessage
    if (!msg) return null
    const first = msg.split('\n').find((l) => l.trim()) ?? ''
    return first.length > 48 ? `${first.slice(0, 45)}…` : first
  }

  return (
    <>
      <footer class="bottom-bar no-drag">
        {/* Left: workspace + thread + changelog toggles */}
        <div class="bottom-bar-left">
          <button
            type="button"
            class={`bottom-bar-btn${props.leftDrawerOpen && props.leftDrawerMode === 'workspace' ? ' is-active' : ''}`}
            onClick={props.onToggleWorkspace}
            title={t('bottombar.showWorkspaces')}
            aria-pressed={props.leftDrawerOpen && props.leftDrawerMode === 'workspace'}
          >
            <Folder size={13} />
          </button>
          <button
            type="button"
            class={`bottom-bar-btn${props.leftDrawerOpen && props.leftDrawerMode === 'tree' ? ' is-active' : ''}`}
            onClick={props.onToggleTree}
            title={t('bottombar.showSessionMap')}
            aria-label={t('bottombar.showSessionMap')}
            aria-pressed={props.leftDrawerOpen && props.leftDrawerMode === 'tree'}
          >
            <GitFork size={13} />
          </button>
          <button
            type="button"
            class={`bottom-bar-btn${props.leftDrawerOpen && props.leftDrawerMode === 'threads' ? ' is-active' : ''}`}
            onClick={props.onToggleThreads}
            title={t('bottombar.showThreadHistory')}
            aria-pressed={props.leftDrawerOpen && props.leftDrawerMode === 'threads'}
          >
            <MessageSquareText size={13} />
          </button>
          <button
            type="button"
            class="bottom-bar-btn"
            title={t('bottombar.whatsNew')}
            onClick={() => setChangelogOpen(true)}
          >
            <FileText size={13} />
          </button>
        </div>

        {/* Center: OpenPi version (or update chip, or git sync status) */}
        <div class="bottom-bar-center">
          <Show
            when={syncActionLabel() || syncResultSnippet()}
            fallback={
              <Show
                when={updateAvailable()}
                fallback={
                  <button
                    type="button"
                    class="bottom-bar-version"
                    title={t('bottombar.checkForUpdates')}
                    onClick={() => {
                      void window.openpi.appUpdate.check().then(setUpdateStatus)
                    }}
                  >
                    {props.appVersion ? `v${props.appVersion}` : '…'}
                  </button>
                }
              >
                <button
                  type="button"
                  class="bottom-bar-update-chip"
                  title={t('bottombar.updateAvailableTitle', {
                    version: updateStatus()?.latestVersion ?? '',
                    command: HOMEBREW_UPGRADE_COMMAND,
                  })}
                  onClick={() => void copyUpgradeCommand()}
                >
                  <ArrowUpCircle size={11} />
                  {updateCommandCopied()
                    ? t('bottombar.copiedBrewCommand')
                    : (updateStatus()?.latestVersion ?? t('bottombar.updateAvailable'))}
                </button>
              </Show>
            }
          >
            <Show
              when={syncActionLabel()}
              fallback={<span class="bottom-bar-git-result">{syncResultSnippet()}</span>}
            >
              <span class="bottom-bar-git-pulse" aria-hidden="true">
                ●
              </span>
              <span class="bottom-bar-git-action">{syncActionLabel()}</span>
            </Show>
          </Show>
        </div>

        {/* Right: goal status indicator, panel toggles */}
        <div class="bottom-bar-right">
          <Show when={props.goalUpdate?.status}>
            <span
              class={`bottom-bar-goal status-${props.goalUpdate!.status}`}
              title={props.goalUpdate!.objective ?? ''}
            >
              <span class={`goal-indicator-dot ${props.goalUpdate!.status}`} />
              {formatGoalLabel(props.goalUpdate!, t)}
            </span>
          </Show>
          <Show when={props.isStreaming}>
            <span class="bottom-bar-status-pill is-live" title={t('bottombar.agentRunning')}>
              {t('bottombar.running')}
            </span>
          </Show>
          <button
            type="button"
            class={`bottom-bar-btn${props.gitPanelOpen ? ' is-active' : ''}`}
            onClick={props.onToggleGitPanel}
            title={t('bottombar.toggleSourceControl')}
            aria-pressed={props.gitPanelOpen}
          >
            <GitBranch size={13} />
          </button>
          <button
            type="button"
            class={`bottom-bar-btn${props.filePanelOpen ? ' is-active' : ''}`}
            onClick={props.onToggleFilePanel}
            title={t('bottombar.toggleFileTree')}
            aria-pressed={props.filePanelOpen}
          >
            <FolderTree size={13} />
          </button>
          <button
            type="button"
            class={`bottom-bar-btn${props.terminalOpen ? ' is-active' : ''}`}
            onClick={props.onToggleTerminal}
            title={t('bottombar.toggleTerminal')}
            aria-pressed={props.terminalOpen}
          >
            <SquareTerminal size={13} />
          </button>
        </div>
      </footer>

      <ChangelogModal open={changelogOpen()} onClose={() => setChangelogOpen(false)} />
    </>
  )
}
