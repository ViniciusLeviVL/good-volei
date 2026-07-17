import { z } from 'zod'

import {
  MAX_PLAYER_SKILL,
  MIN_PLAYER_SKILL,
  PLAYER_SKILL_STEP,
} from '@/lib/constants'
import { type IPlayer, type ITeam, PLAYER_GENDERS } from '@/types'

export const TEAM_DRAW_EXPORT_VERSION = 1 as const

/**
 * Builds the export download filename using the local date as DDMMYYYY.
 * Example: 17/07/2026 → good-volei-dados-17072026.json
 */
export function buildTeamDrawExportFileName(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())
  return `good-volei-dados-${day}${month}${year}.json`
}

const playerStarsSchema = z
  .number()
  .min(MIN_PLAYER_SKILL, `A habilidade deve ser no mínimo ${MIN_PLAYER_SKILL}.`)
  .max(MAX_PLAYER_SKILL, `A habilidade deve ser no máximo ${MAX_PLAYER_SKILL}.`)
  .refine(
    (value) =>
      Math.abs(
        value / PLAYER_SKILL_STEP - Math.round(value / PLAYER_SKILL_STEP),
      ) < 1e-8,
    `A habilidade deve usar passos de ${PLAYER_SKILL_STEP}.`,
  )

const importedPlayerSchema = z.object({
  id: z.string().min(1, 'O id do jogador é obrigatório.'),
  name: z
    .string()
    .trim()
    .min(1, 'O nome do jogador é obrigatório.')
    .max(40, 'O nome do jogador deve ter no máximo 40 caracteres.'),
  stars: playerStarsSchema,
  gender: z.enum(PLAYER_GENDERS, {
    error: 'Selecione um gênero.',
  }),
})

const importedTeamSchema = z.object({
  id: z.string().min(1, 'O id do time é obrigatório.'),
  name: z
    .string()
    .trim()
    .min(1, 'O nome do time é obrigatório.')
    .max(40, 'O nome do time deve ter no máximo 40 caracteres.'),
})

export const teamDrawImportSchema = z
  .object({
    version: z.literal(TEAM_DRAW_EXPORT_VERSION),
    exportedAt: z
      .string()
      .min(1, 'A data de exportação é obrigatória.')
      .refine(
        (value) => !Number.isNaN(Date.parse(value)),
        'A data de exportação é inválida.',
      ),
    data: z.object({
      players: z.array(importedPlayerSchema),
      teams: z.array(importedTeamSchema),
    }),
  })
  .superRefine((payload, context) => {
    const playerIds = new Set<string>()
    const playerNames = new Set<string>()
    for (const player of payload.data.players) {
      if (playerIds.has(player.id)) {
        context.addIssue({
          code: 'custom',
          message: 'Há jogadores com ids duplicados.',
          path: ['data', 'players'],
        })
        break
      }
      playerIds.add(player.id)

      const normalizedName = player.name.trim().toLowerCase()
      if (playerNames.has(normalizedName)) {
        context.addIssue({
          code: 'custom',
          message: 'Há jogadores com nomes duplicados.',
          path: ['data', 'players'],
        })
        break
      }
      playerNames.add(normalizedName)
    }

    const teamIds = new Set<string>()
    for (const team of payload.data.teams) {
      if (teamIds.has(team.id)) {
        context.addIssue({
          code: 'custom',
          message: 'Há times com ids duplicados.',
          path: ['data', 'teams'],
        })
        break
      }
      teamIds.add(team.id)
    }
  })

export type ITeamDrawImportSchema = z.infer<typeof teamDrawImportSchema>

export interface ITeamDrawExportPlayer {
  readonly id: string
  readonly name: string
  readonly stars: number
  readonly gender: IPlayer['gender']
}

export interface ITeamDrawExportTeam {
  readonly id: string
  readonly name: string
}

export interface ITeamDrawExportPayload {
  readonly version: typeof TEAM_DRAW_EXPORT_VERSION
  readonly exportedAt: string
  readonly data: {
    readonly players: readonly ITeamDrawExportPlayer[]
    readonly teams: readonly ITeamDrawExportTeam[]
  }
}

export interface IImportedTeamDrawData {
  readonly players: IPlayer[]
  readonly teams: ITeam[]
}

export interface IParseTeamDrawImportResult {
  readonly success: true
  readonly data: ITeamDrawImportSchema
}

export interface IParseTeamDrawImportError {
  readonly success: false
  readonly error: string
}

/**
 * Builds the v1 export payload from the current roster and team names only.
 */
export function buildExportPayload(
  players: readonly IPlayer[],
  teams: readonly ITeam[],
  exportedAt: string = new Date().toISOString(),
): ITeamDrawExportPayload {
  return {
    version: TEAM_DRAW_EXPORT_VERSION,
    exportedAt,
    data: {
      players: players.map((player) => ({
        id: player.id,
        name: player.name,
        stars: player.skill,
        gender: player.gender,
      })),
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
      })),
    },
  }
}

/**
 * Validates unknown JSON against the import schema.
 */
export function parseTeamDrawImport(
  raw: unknown,
): IParseTeamDrawImportResult | IParseTeamDrawImportError {
  const result = teamDrawImportSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      error: 'Arquivo inválido. Verifique se o JSON é um export do Team Draw.',
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Maps a validated import payload into app state.
 * Structured with a version switch so future formats can migrate here.
 */
export function mapImportToAppState(
  payload: ITeamDrawImportSchema,
): IImportedTeamDrawData {
  switch (payload.version) {
    case 1:
      return mapVersion1ToAppState(payload)
    default: {
      const exhaustiveCheck: never = payload.version
      throw new Error(`Versão de importação não suportada: ${exhaustiveCheck}`)
    }
  }
}

function mapVersion1ToAppState(
  payload: ITeamDrawImportSchema,
): IImportedTeamDrawData {
  const players: IPlayer[] = payload.data.players.map((player) => ({
    id: player.id,
    name: player.name.trim(),
    skill: player.stars,
    gender: player.gender,
    isEnabled: true,
  }))
  const teams: ITeam[] = payload.data.teams.map((team) => ({
    id: team.id,
    name: team.name.trim(),
    playerIds: [],
    lockedPlayerIds: [],
  }))

  return { players, teams }
}

/**
 * Triggers a browser download of the given JSON payload.
 */
export function downloadTeamDrawJson(payload: ITeamDrawExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = buildTeamDrawExportFileName()
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Reads a File as JSON in the browser.
 */
export async function readJsonFile(file: File): Promise<unknown> {
  const text = await file.text()
  return JSON.parse(text) as unknown
}
