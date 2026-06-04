import { beforeAll, describe, expect, it } from 'vitest'
import { changeLanguage, getCurrentLanguage, t } from '../../src/lib/i18n'
import { setupI18nForTest } from './helpers'

describe('i18n', () => {
  beforeAll(async () => {
    await setupI18nForTest('zh-CN')
  })

  describe('zh-CN locale', () => {
    it('returns Chinese text for welcome.title', () => {
      const result = t('welcome.title')
      expect(result).toContain('Pi')
      expect(result).not.toBe('welcome.title')
    })

    it('returns exact Chinese text for welcome.openWorkspace', () => {
      expect(t('welcome.openWorkspace')).toBe('打开工作区')
    })
  })

  describe('en locale', () => {
    it('returns English text after switching', () => {
      changeLanguage('en')
      expect(getCurrentLanguage()).toBe('en')
      expect(t('welcome.openWorkspace')).toBe('Open workspace')
    })

    it('returns English text for welcome.title containing Pi coding agent', () => {
      const result = t('welcome.title')
      expect(result).toContain('Pi coding agent')
    })
  })

  describe('fallback', () => {
    it('returns the key for nonexistent translations', () => {
      expect(t('nonexistent.key.deeply.nested')).toBe('nonexistent.key.deeply.nested')
    })
  })

  describe('interpolation', () => {
    it('interpolates count in sidebar.loadMore (zh-CN)', () => {
      changeLanguage('zh-CN')
      const result = t('sidebar.loadMore', { count: 5 })
      expect(result).toContain('5')
    })

    it('interpolates count in sidebar.loadMore (en)', () => {
      changeLanguage('en')
      const result = t('sidebar.loadMore', { count: 10 })
      expect(result).toContain('10')
    })
  })

  describe('language switching', () => {
    it('switches between zh-CN and en', () => {
      changeLanguage('zh-CN')
      const zhText = t('welcome.openWorkspace')
      changeLanguage('en')
      const enText = t('welcome.openWorkspace')
      expect(zhText).not.toBe(enText)
      expect(zhText).toBe('打开工作区')
      expect(enText).toBe('Open workspace')
    })
  })
})
