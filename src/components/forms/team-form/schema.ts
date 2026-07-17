import { z } from 'zod'

export const teamFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Team name is required.')
    .max(40, 'Team name must be 40 characters or less.'),
})

export type ITeamFormSchema = z.infer<typeof teamFormSchema>
