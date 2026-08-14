'use client'

import { ShuffleIcon } from 'lucide-react'
import { useState } from 'react'

import { DrawVarietySwapField } from '@/components/draw-variety-swap-field'
import { Button } from '@/components/ui/button'
import {
  DRAW_VARIETY_SWAP_PRESETS,
  MAX_DRAW_VARIETY_ATTEMPTS,
  MAX_DRAW_VARIETY_SKILL_DELTA,
  MAX_DRAW_VARIETY_SPREAD_INCREASE,
  MIN_DRAW_VARIETY_ATTEMPTS,
  MIN_DRAW_VARIETY_SKILL_DELTA,
  MIN_DRAW_VARIETY_SPREAD_INCREASE,
  PLAYER_SKILL_STEP,
} from '@/lib/constants'
import { getMatchingDrawVarietyPreset } from '@/lib/draw-variety'
import { cn } from '@/lib/utils'
import { useTeamDrawStore } from '@/store/team-draw-store'
import {
  DRAW_VARIETY_LABELS,
  DRAW_VARIETY_LEVELS,
  DRAW_VARIETY_SWAP_FIELD_DESCRIPTIONS,
  DRAW_VARIETY_SWAP_FIELD_LABELS,
  type DrawVariety,
} from '@/types'

export function DrawVarietySettings() {
  const settings = useTeamDrawStore((state) => state.settings)
  const updateSettings = useTeamDrawStore((state) => state.updateSettings)
  const swapConfig = settings.drawVarietySwap
  const activePreset = getMatchingDrawVarietyPreset(swapConfig)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  function handlePresetClick(level: DrawVariety): void {
    updateSettings({ drawVarietySwap: DRAW_VARIETY_SWAP_PRESETS[level] })
  }

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <ShuffleIcon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-0.5">
          <p className="font-medium text-sm">Mistura dos times</p>
          <p className="text-muted-foreground text-xs">
            Troca jogadores de nível parecido para as formações não se
            repetirem, sem um time ficar bem mais forte.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {DRAW_VARIETY_LEVELS.map((level) => {
            const isSelected = activePreset === level
            return (
              <button
                key={level}
                type="button"
                aria-pressed={isSelected}
                className={cn(
                  'min-h-9 w-full rounded-lg border px-1 py-1.5 text-center font-medium text-[11px] leading-tight transition-colors sm:text-xs',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted',
                )}
                onClick={() => handlePresetClick(level)}
              >
                {DRAW_VARIETY_LABELS[level]}
              </button>
            )
          })}
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0"
            aria-expanded={isAdvancedOpen}
            onClick={() => setIsAdvancedOpen((isOpen) => !isOpen)}
          >
            {isAdvancedOpen
              ? 'Ocultar configurações avançadas'
              : 'Mostrar configurações avançadas'}
          </Button>
        </div>

        {isAdvancedOpen ? (
          <div className="space-y-3">
            <DrawVarietySwapField
              id="draw-variety-attempts"
              label={DRAW_VARIETY_SWAP_FIELD_LABELS.attempts}
              description={DRAW_VARIETY_SWAP_FIELD_DESCRIPTIONS.attempts}
              value={swapConfig.attempts}
              min={MIN_DRAW_VARIETY_ATTEMPTS}
              max={MAX_DRAW_VARIETY_ATTEMPTS}
              step={1}
              onChange={(attempts) =>
                updateSettings({ drawVarietySwap: { attempts } })
              }
            />
            <DrawVarietySwapField
              id="draw-variety-skill-delta"
              label={DRAW_VARIETY_SWAP_FIELD_LABELS.maxSkillDelta}
              description={DRAW_VARIETY_SWAP_FIELD_DESCRIPTIONS.maxSkillDelta}
              value={swapConfig.maxSkillDelta}
              min={MIN_DRAW_VARIETY_SKILL_DELTA}
              max={MAX_DRAW_VARIETY_SKILL_DELTA}
              step={PLAYER_SKILL_STEP}
              onChange={(maxSkillDelta) =>
                updateSettings({ drawVarietySwap: { maxSkillDelta } })
              }
            />
            <DrawVarietySwapField
              id="draw-variety-spread-increase"
              label={DRAW_VARIETY_SWAP_FIELD_LABELS.maxSpreadIncrease}
              description={
                DRAW_VARIETY_SWAP_FIELD_DESCRIPTIONS.maxSpreadIncrease
              }
              value={swapConfig.maxSpreadIncrease}
              min={MIN_DRAW_VARIETY_SPREAD_INCREASE}
              max={MAX_DRAW_VARIETY_SPREAD_INCREASE}
              step={PLAYER_SKILL_STEP}
              onChange={(maxSpreadIncrease) =>
                updateSettings({ drawVarietySwap: { maxSpreadIncrease } })
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
