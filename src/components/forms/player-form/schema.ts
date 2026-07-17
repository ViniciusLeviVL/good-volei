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
    .min(1, 'Player name is required.')
    .max(40, 'Player name must be 40 characters or less.'),
  skill: z
    .number()
    .min(MIN_PLAYER_SKILL, `Skill must be at least ${MIN_PLAYER_SKILL}.`)
    .max(MAX_PLAYER_SKILL, `Skill must be at most ${MAX_PLAYER_SKILL}.`)
    .refine(
      (value) =>
        Math.abs(
          value / PLAYER_SKILL_STEP - Math.round(value / PLAYER_SKILL_STEP),
        ) < 1e-8,
      `Skill must use steps of ${PLAYER_SKILL_STEP}.`,
    ),
  gender: z.enum(PLAYER_GENDERS, {
    error: 'Select a gender.',
  }),
})

export type IPlayerFormSchema = z.infer<typeof playerFormSchema>
