'use client'

import { useTeamDrawStore } from '@/store/team-draw-store'

export function useHasHydrated(): boolean {
  return useTeamDrawStore((state) => state.hasHydrated)
}
