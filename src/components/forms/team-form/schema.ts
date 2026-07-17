import { z } from 'zod'

export const teamFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'O nome do time é obrigatório.')
    .max(40, 'O nome do time deve ter no máximo 40 caracteres.'),
})

export type ITeamFormSchema = z.infer<typeof teamFormSchema>
