import { z } from 'zod'

import {
  MAX_PLAYER_SKILL,
  MIN_PLAYER_SKILL,
  PLAYER_SKILL_STEP,
} from '@/lib/constants'
import { PLAYER_GENDERS } from '@/types'

export const playerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'O nome do jogador é obrigatório.')
    .max(40, 'O nome do jogador deve ter no máximo 40 caracteres.'),
  skill: z
    .number()
    .min(
      MIN_PLAYER_SKILL,
      `A habilidade deve ser no mínimo ${MIN_PLAYER_SKILL}.`,
    )
    .max(
      MAX_PLAYER_SKILL,
      `A habilidade deve ser no máximo ${MAX_PLAYER_SKILL}.`,
    )
    .refine(
      (value) =>
        Math.abs(
          value / PLAYER_SKILL_STEP - Math.round(value / PLAYER_SKILL_STEP),
        ) < 1e-8,
      `A habilidade deve usar passos de ${PLAYER_SKILL_STEP}.`,
    ),
  gender: z.enum(PLAYER_GENDERS, {
    error: 'Selecione um gênero.',
  }),
})

export type IPlayerFormSchema = z.infer<typeof playerFormSchema>
