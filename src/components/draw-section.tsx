'use client'

import { DicesIcon, Loader2Icon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { fireBottomConfetti } from '@/components/ui/confetti'
import { canDrawTeams } from '@/lib/draw-teams'
import { getEnabledPlayers } from '@/lib/team-stats'
import { useTeamDrawStore } from '@/store/team-draw-store'

export function DrawSection() {
  const players = useTeamDrawStore((state) => state.players)
  const teams = useTeamDrawStore((state) => state.teams)
  const executeDraw = useTeamDrawStore((state) => state.executeDraw)
  const [isPending, startTransition] = useTransition()
  const [isDrawing, setIsDrawing] = useState(false)

  const enabledPlayerCount = getEnabledPlayers(players).length
  const eligibility = canDrawTeams(enabledPlayerCount, teams.length)
  const isBusy = isPending || isDrawing

  function handleDraw(): void {
    if (!eligibility.canDraw) {
      toast.error(eligibility.reason ?? 'Não foi possível sortear os times.')
      return
    }

    setIsDrawing(true)
    startTransition(() => {
      window.setTimeout(() => {
        const result = executeDraw()
        setIsDrawing(false)

        if (!result.success) {
          toast.error(result.error)
          return
        }

        fireBottomConfetti()
        toast.success('Times sorteados')
      }, 280)
    })
  }

  return (
    <section className="space-y-2">
      <Button
        size="lg"
        className="h-11 w-full text-sm"
        disabled={!eligibility.canDraw || isBusy}
        onClick={handleDraw}
      >
        {isBusy ? (
          <Loader2Icon className="animate-spin" data-icon="inline-start" />
        ) : (
          <DicesIcon data-icon="inline-start" />
        )}
        {isBusy ? 'Sorteando…' : 'Sortear times'}
      </Button>
      {!eligibility.canDraw ? (
        <p className="text-center text-muted-foreground text-xs">
          {eligibility.reason}
        </p>
      ) : (
        <p className="text-center text-muted-foreground text-xs">
          Jogadores desativados ficam de fora. Bloqueados permanecem no time; os
          demais são redistribuídos.
        </p>
      )}
    </section>
  )
}
