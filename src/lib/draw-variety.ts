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
import {
  DEFAULT_DRAW_VARIETY_SWAP,
  DRAW_VARIETY_LEVELS,
  type DrawVariety,
  type IDrawVarietySwapConfig,
} from '@/types'

export function getMatchingDrawVarietyPreset(
  config: IDrawVarietySwapConfig,
): DrawVariety | null {
  for (const level of DRAW_VARIETY_LEVELS) {
    if (
      areDrawVarietySwapConfigsEqual(config, DRAW_VARIETY_SWAP_PRESETS[level])
    ) {
      return level
    }
  }
  return null
}

function areDrawVarietySwapConfigsEqual(
  left: IDrawVarietySwapConfig,
  right: IDrawVarietySwapConfig,
): boolean {
  return (
    left.attempts === right.attempts &&
    left.maxSkillDelta === right.maxSkillDelta &&
    left.maxSpreadIncrease === right.maxSpreadIncrease
  )
}

export function normalizeDrawVarietySwapConfig(
  config?: Partial<IDrawVarietySwapConfig>,
): IDrawVarietySwapConfig {
  return {
    attempts: normalizeAttempts(
      config?.attempts ?? DEFAULT_DRAW_VARIETY_SWAP.attempts,
    ),
    maxSkillDelta: normalizeSkillStepValue(
      config?.maxSkillDelta ?? DEFAULT_DRAW_VARIETY_SWAP.maxSkillDelta,
      MIN_DRAW_VARIETY_SKILL_DELTA,
      MAX_DRAW_VARIETY_SKILL_DELTA,
    ),
    maxSpreadIncrease: normalizeSkillStepValue(
      config?.maxSpreadIncrease ?? DEFAULT_DRAW_VARIETY_SWAP.maxSpreadIncrease,
      MIN_DRAW_VARIETY_SPREAD_INCREASE,
      MAX_DRAW_VARIETY_SPREAD_INCREASE,
    ),
  }
}

function normalizeAttempts(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DRAW_VARIETY_SWAP.attempts
  }
  return clampInteger(
    value,
    MIN_DRAW_VARIETY_ATTEMPTS,
    MAX_DRAW_VARIETY_ATTEMPTS,
  )
}

function normalizeSkillStepValue(
  value: number,
  min: number,
  max: number,
): number {
  if (!Number.isFinite(value)) {
    return min
  }
  const stepped = Math.round(value / PLAYER_SKILL_STEP) * PLAYER_SKILL_STEP
  return Math.min(max, Math.max(min, stepped))
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}
