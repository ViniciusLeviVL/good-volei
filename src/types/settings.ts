/**
 * Application settings. Designed to grow with additional options.
 */
export const DRAW_VARIETY_LEVELS = ['fair', 'balanced', 'mixed'] as const

export type DrawVariety = (typeof DRAW_VARIETY_LEVELS)[number]

export const DRAW_VARIETY_LABELS: Record<DrawVariety, string> = {
  fair: 'Mais justo',
  balanced: 'Equilibrado',
  mixed: 'Mais misturado',
}

export interface IDrawVarietySwapConfig {
  readonly attempts: number
  readonly maxSkillDelta: number
  readonly maxSpreadIncrease: number
}

export const DRAW_VARIETY_SWAP_FIELD_LABELS: Record<
  keyof IDrawVarietySwapConfig,
  string
> = {
  attempts: 'Tentativas',
  maxSkillDelta: 'Diferença máxima de habilidade',
  maxSpreadIncrease: 'Folga no equilíbrio',
}

export const DRAW_VARIETY_SWAP_FIELD_DESCRIPTIONS: Record<
  keyof IDrawVarietySwapConfig,
  string
> = {
  attempts:
    'Quantas vezes o sorteio tenta trocar jogadores de time. Recusas também entram na conta; mais tentativas aumentam a mistura.',
  maxSkillDelta:
    'Jogadores só trocam se a diferença de nível for no máximo este valor. 0,5 permite 3,0 com 3,5; 1,0 também permite 3 com 4.',
  maxSpreadIncrease:
    'Quanto a diferença de força entre os times pode aumentar depois das trocas. 0 mantém o equilíbrio do sorteio justo.',
}

export interface IAppSettings {
  readonly balanceByGender: boolean
  readonly drawVarietySwap: IDrawVarietySwapConfig
}

export const DEFAULT_DRAW_VARIETY_SWAP: IDrawVarietySwapConfig = {
  attempts: 16,
  maxSkillDelta: 0.5,
  maxSpreadIncrease: 0.5,
}

export const DEFAULT_APP_SETTINGS: IAppSettings = {
  balanceByGender: false,
  drawVarietySwap: DEFAULT_DRAW_VARIETY_SWAP,
}

export function isDrawVariety(value: unknown): value is DrawVariety {
  return (
    typeof value === 'string' &&
    (DRAW_VARIETY_LEVELS as readonly string[]).includes(value)
  )
}
