import { z } from 'zod'

import {
  MAX_PLAYER_SKILL,
  MIN_PLAYER_SKILL,
  PLAYER_SKILL_STEP,
} from '@/lib/constants'
import { normalizeDrawVarietySwapConfig } from '@/lib/draw-variety'
import {
  type IAppSettings,
  type IPlayer,
  type ITeam,
  PLAYER_GENDERS,
} from '@/types'

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
  isEnabled: z.boolean().optional().default(true),
})

const importedTeamSchema = z.object({
  id: z.string().min(1, 'O id do time é obrigatório.'),
  name: z
    .string()
    .trim()
    .min(1, 'O nome do time é obrigatório.')
    .max(40, 'O nome do time deve ter no máximo 40 caracteres.'),
  playerIds: z.array(z.string().min(1)).optional().default([]),
  lockedPlayerIds: z.array(z.string().min(1)).optional().default([]),
})

const importedSettingsSchema = z.object({
  balanceByGender: z.boolean(),
  drawVarietySwap: z.object({
    attempts: z.number(),
    maxSkillDelta: z.number(),
    maxSpreadIncrease: z.number(),
  }),
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
      settings: importedSettingsSchema.optional(),
    }),
  })
  .superRefine((payload, context) => {
    addDuplicateEntityIssues(payload, context)
    addTeamAssignmentIssues(payload, context)
  })

export type ITeamDrawImportSchema = z.infer<typeof teamDrawImportSchema>

export interface ITeamDrawExportPlayer {
  readonly id: string
  readonly name: string
  readonly stars: number
  readonly gender: IPlayer['gender']
  readonly isEnabled: boolean
}

export interface ITeamDrawExportTeam {
  readonly id: string
  readonly name: string
  readonly playerIds: readonly string[]
  readonly lockedPlayerIds: readonly string[]
}

export interface ITeamDrawExportPayload {
  readonly version: typeof TEAM_DRAW_EXPORT_VERSION
  readonly exportedAt: string
  readonly data: {
    readonly players: readonly ITeamDrawExportPlayer[]
    readonly teams: readonly ITeamDrawExportTeam[]
    readonly settings: IAppSettings
  }
}

export interface IImportedTeamDrawData {
  readonly players: IPlayer[]
  readonly teams: ITeam[]
  readonly settings?: IAppSettings
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
 * Builds the v1 export payload from the current roster, teams, and settings.
 */
export function buildExportPayload(
  players: readonly IPlayer[],
  teams: readonly ITeam[],
  settings: IAppSettings,
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
        isEnabled: player.isEnabled,
      })),
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        playerIds: [...team.playerIds],
        lockedPlayerIds: [...team.lockedPlayerIds],
      })),
      settings: {
        balanceByGender: settings.balanceByGender,
        drawVarietySwap: { ...settings.drawVarietySwap },
      },
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
    isEnabled: player.isEnabled,
  }))
  const enabledPlayerIds = new Set(
    players.filter((player) => player.isEnabled).map((player) => player.id),
  )
  const teams: ITeam[] = payload.data.teams.map((team) => {
    const playerIds = team.playerIds.filter((id) => enabledPlayerIds.has(id))
    const playerIdSet = new Set(playerIds)
    return {
      id: team.id,
      name: team.name.trim(),
      playerIds,
      lockedPlayerIds: team.lockedPlayerIds.filter((id) => playerIdSet.has(id)),
    }
  })

  return {
    players,
    teams,
    settings: mapImportedSettings(payload.data.settings),
  }
}

function mapImportedSettings(
  settings: ITeamDrawImportSchema['data']['settings'],
): IAppSettings | undefined {
  if (!settings) {
    return undefined
  }

  return {
    balanceByGender: settings.balanceByGender,
    drawVarietySwap: normalizeDrawVarietySwapConfig(settings.drawVarietySwap),
  }
}

function addDuplicateEntityIssues(
  payload: ITeamDrawImportSchema,
  context: z.RefinementCtx,
): void {
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
}

function addTeamAssignmentIssues(
  payload: ITeamDrawImportSchema,
  context: z.RefinementCtx,
): void {
  const knownPlayerIds = new Set(
    payload.data.players.map((player) => player.id),
  )
  const assignedPlayerIds = new Set<string>()

  for (const [teamIndex, team] of payload.data.teams.entries()) {
    const teamPlayerIds = new Set<string>()
    for (const [playerIndex, playerId] of team.playerIds.entries()) {
      if (!knownPlayerIds.has(playerId)) {
        context.addIssue({
          code: 'custom',
          message: 'Há jogadores atribuídos a times que não existem no elenco.',
          path: ['data', 'teams', teamIndex, 'playerIds', playerIndex],
        })
        continue
      }
      if (teamPlayerIds.has(playerId)) {
        context.addIssue({
          code: 'custom',
          message: 'Há jogadores duplicados no mesmo time.',
          path: ['data', 'teams', teamIndex, 'playerIds', playerIndex],
        })
        continue
      }
      if (assignedPlayerIds.has(playerId)) {
        context.addIssue({
          code: 'custom',
          message: 'Há jogadores atribuídos a mais de um time.',
          path: ['data', 'teams', teamIndex, 'playerIds', playerIndex],
        })
        continue
      }
      teamPlayerIds.add(playerId)
      assignedPlayerIds.add(playerId)
    }

    const lockedPlayerIds = new Set<string>()
    for (const [lockIndex, playerId] of team.lockedPlayerIds.entries()) {
      if (lockedPlayerIds.has(playerId)) {
        context.addIssue({
          code: 'custom',
          message: 'Há jogadores bloqueados duplicados no mesmo time.',
          path: ['data', 'teams', teamIndex, 'lockedPlayerIds', lockIndex],
        })
        continue
      }
      lockedPlayerIds.add(playerId)
      if (!teamPlayerIds.has(playerId)) {
        context.addIssue({
          code: 'custom',
          message: 'Há jogadores bloqueados que não pertencem ao time.',
          path: ['data', 'teams', teamIndex, 'lockedPlayerIds', lockIndex],
        })
      }
    }
  }
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
