'use client'

import { useEffect } from 'react'

import { useTeamDrawStore } from '@/store/team-draw-store'

const HYDRATION_FALLBACK_MS = 250

/**
 * Returns whether the persisted team-draw store has finished rehydrating.
 * Includes a client-side fallback so the UI never stays on skeletons forever
 * if rehydration fails or never completes.
 */
export function useHasHydrated(): boolean {
  const hasHydrated = useTeamDrawStore((state) => state.hasHydrated)

  useEffect(() => {
    function markHydrated(): void {
      useTeamDrawStore.getState().setHasHydrated(true)
    }

    const unsubscribe = useTeamDrawStore.persist.onFinishHydration(markHydrated)

    if (useTeamDrawStore.persist.hasHydrated()) {
      markHydrated()
    }

    const timeoutId = window.setTimeout(markHydrated, HYDRATION_FALLBACK_MS)

    return () => {
      unsubscribe()
      window.clearTimeout(timeoutId)
    }
  }, [])

  return hasHydrated
}
