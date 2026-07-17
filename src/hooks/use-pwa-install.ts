'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt: () => Promise<void>
}

function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false
  const userAgent = window.navigator.userAgent.toLowerCase()
  const isIpadOs =
    window.navigator.platform === 'MacIntel' &&
    window.navigator.maxTouchPoints > 1
  return /iphone|ipad|ipod/.test(userAgent) || isIpadOs
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const isDisplayModeStandalone = window.matchMedia(
    '(display-mode: standalone)',
  ).matches
  const isIosStandalone =
    'standalone' in window.navigator &&
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone,
    )
  return isDisplayModeStandalone || isIosStandalone
}

export interface IUsePwaInstallResult {
  readonly isReady: boolean
  readonly canInstall: boolean
  readonly showIosHint: boolean
  readonly isStandalone: boolean
  readonly promptInstall: () => Promise<boolean>
}

export function usePwaInstall(): IUsePwaInstallResult {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay())
    setIsIos(isIosDevice())
    setIsReady(true)

    function handleBeforeInstallPrompt(event: Event): void {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled(): void {
      setDeferredPrompt(null)
      setIsStandalone(true)
    }

    function handleDisplayModeChange(event: MediaQueryListEvent): void {
      if (event.matches) {
        setDeferredPrompt(null)
        setIsStandalone(true)
      }
    }

    const displayModeQuery = window.matchMedia('(display-mode: standalone)')
    displayModeQuery.addEventListener('change', handleDisplayModeChange)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      displayModeQuery.removeEventListener('change', handleDisplayModeChange)
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function promptInstall(): Promise<boolean> {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (outcome === 'accepted') {
      setIsStandalone(true)
      return true
    }
    return false
  }

  const canInstall = isReady && Boolean(deferredPrompt) && !isStandalone
  const showIosHint = isReady && isIos && !isStandalone && !canInstall

  return {
    isReady,
    canInstall,
    showIosHint,
    isStandalone,
    promptInstall,
  }
}
