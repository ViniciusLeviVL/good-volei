'use client'

import { AppHeader } from '@/components/app-header'
import { DrawSection } from '@/components/draw-section'
import { PlayersSection } from '@/components/players-section'
import { SettingsSection } from '@/components/settings-section'
import { TeamsSection } from '@/components/teams-section'
import { useHasHydrated } from '@/hooks/use-has-hydrated'

function AppSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <div className="h-16 animate-pulse rounded-xl bg-muted/70" />
      <div className="h-40 animate-pulse rounded-xl bg-muted/70" />
      <div className="h-40 animate-pulse rounded-xl bg-muted/70" />
      <div className="h-24 animate-pulse rounded-xl bg-muted/70" />
    </div>
  )
}

export function TeamDrawApp() {
  const hasHydrated = useHasHydrated()

  if (!hasHydrated) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <AppHeader />
        <AppSkeleton />
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6 pb-10">
        <DrawSection />
        <TeamsSection />
        <PlayersSection />
        <SettingsSection />
      </main>
    </div>
  )
}
