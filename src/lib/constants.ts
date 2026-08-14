import {
  DEFAULT_DRAW_VARIETY_SWAP,
  type DrawVariety,
  type IDrawVarietySwapConfig,
} from '@/types'

export const MIN_TEAMS_FOR_DRAW = 2
export const MIN_PLAYER_SKILL = 0
export const MAX_PLAYER_SKILL = 5
export const PLAYER_SKILL_STEP = 0.5
export const STORAGE_KEY = 'good-volei-team-draw'
export const SKILL_SIMILARITY_THRESHOLD = 0.5

export const MIN_DRAW_VARIETY_ATTEMPTS = 0
export const MAX_DRAW_VARIETY_ATTEMPTS = 64
export const MIN_DRAW_VARIETY_SKILL_DELTA = 0
export const MAX_DRAW_VARIETY_SKILL_DELTA = MAX_PLAYER_SKILL
export const MIN_DRAW_VARIETY_SPREAD_INCREASE = 0
export const MAX_DRAW_VARIETY_SPREAD_INCREASE = MAX_PLAYER_SKILL

export const DRAW_VARIETY_SWAP_PRESETS: Record<
  DrawVariety,
  IDrawVarietySwapConfig
> = {
  fair: {
    attempts: 8,
    maxSkillDelta: 0.5,
    maxSpreadIncrease: 0,
  },
  balanced: { ...DEFAULT_DRAW_VARIETY_SWAP },
  mixed: {
    attempts: 32,
    maxSkillDelta: 1,
    maxSpreadIncrease: 1,
  },
}
