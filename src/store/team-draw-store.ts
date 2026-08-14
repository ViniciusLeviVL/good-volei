'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DRAW_VARIETY_SWAP_PRESETS, STORAGE_KEY } from '@/lib/constants'
import { canDrawTeams, drawTeams } from '@/lib/draw-teams'
import { normalizeDrawVarietySwapConfig } from '@/lib/draw-variety'
import {
  getEnabledPlayers,
  isPlayerNameTaken,
  removePlayerFromTeams,
} from '@/lib/team-stats'
import {
  DEFAULT_APP_SETTINGS,
  type IAppSettings,
  type IDrawVarietySwapConfig,
  type IPlayer,
  type ITeam,
  isDrawVariety,
  type PlayerGender,
} from '@/types'

export interface ICreatePlayerInput {
  readonly name: string
  readonly skill: number
  readonly gender: PlayerGender
}

export interface IUpdatePlayerInput extends ICreatePlayerInput {
  readonly id: string
}

export interface ICreateTeamInput {
  readonly name: string
}

export interface IUpdateSettingsInput {
  readonly balanceByGender?: boolean
  readonly drawVarietySwap?: Partial<IDrawVarietySwapConfig>
}

export interface ITeamDrawStore {
  readonly players: IPlayer[]
  readonly teams: ITeam[]
  readonly settings: IAppSettings
  readonly hasHydrated: boolean
  readonly setHasHydrated: (hasHydrated: boolean) => void
  readonly addPlayer: (input: ICreatePlayerInput) => void
  readonly updatePlayer: (input: IUpdatePlayerInput) => void
  readonly deletePlayer: (playerId: string) => void
  readonly togglePlayerEnabled: (playerId: string) => void
  readonly addTeam: (input: ICreateTeamInput) => void
  readonly renameTeam: (teamId: string, name: string) => void
  readonly deleteTeam: (teamId: string) => void
  readonly clearTeamPlayers: (teamId: string) => void
  readonly togglePlayerLock: (teamId: string, playerId: string) => void
  readonly updateSettings: (settings: IUpdateSettingsInput) => void
  readonly replacePlayersAndTeams: (input: {
    readonly players: IPlayer[]
    readonly teams: ITeam[]
    readonly settings?: IAppSettings
  }) => void
  readonly executeDraw: () =>
    | { success: true }
    | { success: false; error: string }
}

interface IPersistedAppSettings {
  readonly balanceByGender?: boolean
  readonly drawVariety?: unknown
  readonly drawVarietySwap?: Partial<IDrawVarietySwapConfig>
}

interface IPersistedTeamDrawState {
  readonly players?: Array<Partial<IPlayer> & Pick<IPlayer, 'id' | 'name'>>
  readonly teams?: ITeam[]
  readonly settings?: IPersistedAppSettings
}

function createId(): string {
  return crypto.randomUUID()
}

function normalizeSettings(settings?: IPersistedAppSettings): IAppSettings {
  const presetConfig = isDrawVariety(settings?.drawVariety)
    ? DRAW_VARIETY_SWAP_PRESETS[settings.drawVariety]
    : DEFAULT_APP_SETTINGS.drawVarietySwap

  return {
    balanceByGender: settings?.balanceByGender === true,
    drawVarietySwap: normalizeDrawVarietySwapConfig({
      ...presetConfig,
      ...settings?.drawVarietySwap,
    }),
  }
}

/**
 * Ensures persisted players have `isEnabled` and strips disabled players from teams.
 */
function normalizePersistedState(
  state: IPersistedTeamDrawState,
): Pick<ITeamDrawStore, 'players' | 'teams' | 'settings'> {
  const players: IPlayer[] = (state.players ?? []).map((player) => ({
    id: player.id,
    name: player.name,
    skill: typeof player.skill === 'number' ? player.skill : 0,
    gender: player.gender === 'female' ? 'female' : 'male',
    isEnabled: player.isEnabled !== false,
  }))
  const disabledPlayerIds = new Set(
    players.filter((player) => !player.isEnabled).map((player) => player.id),
  )
  const teams = (state.teams ?? []).map((team) => ({
    ...team,
    playerIds: (team.playerIds ?? []).filter(
      (id) => !disabledPlayerIds.has(id),
    ),
    lockedPlayerIds: (team.lockedPlayerIds ?? []).filter(
      (id) => !disabledPlayerIds.has(id),
    ),
  }))

  return {
    players,
    teams,
    settings: normalizeSettings(state.settings),
  }
}

export const useTeamDrawStore = create<ITeamDrawStore>()(
  persist(
    (set, get) => ({
      players: [],
      teams: [],
      settings: DEFAULT_APP_SETTINGS,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated })
      },
      addPlayer: (input) => {
        const { players } = get()
        if (isPlayerNameTaken(input.name, players)) {
          throw new Error('Já existe um jogador com este nome.')
        }

        const player: IPlayer = {
          id: createId(),
          name: input.name.trim(),
          skill: input.skill,
          gender: input.gender,
          isEnabled: true,
        }

        set({ players: [...players, player] })
      },
      updatePlayer: (input) => {
        const { players } = get()
        if (isPlayerNameTaken(input.name, players, input.id)) {
          throw new Error('Já existe um jogador com este nome.')
        }

        set({
          players: players.map((player) =>
            player.id === input.id
              ? {
                  ...player,
                  name: input.name.trim(),
                  skill: input.skill,
                  gender: input.gender,
                }
              : player,
          ),
        })
      },
      deletePlayer: (playerId) => {
        const { players, teams } = get()
        set({
          players: players.filter((player) => player.id !== playerId),
          teams: removePlayerFromTeams(teams, playerId),
        })
      },
      togglePlayerEnabled: (playerId) => {
        const { players, teams } = get()
        const targetPlayer = players.find((player) => player.id === playerId)
        if (!targetPlayer) {
          return
        }

        const nextIsEnabled = !targetPlayer.isEnabled
        const nextPlayers = players.map((player) =>
          player.id === playerId
            ? { ...player, isEnabled: nextIsEnabled }
            : player,
        )

        // Disabling unlocks and removes the player from all current team assignments
        // so inactive players do not appear as if they were playing.
        set({
          players: nextPlayers,
          teams: nextIsEnabled ? teams : removePlayerFromTeams(teams, playerId),
        })
      },
      addTeam: (input) => {
        const team: ITeam = {
          id: createId(),
          name: input.name.trim(),
          playerIds: [],
          lockedPlayerIds: [],
        }
        set({ teams: [...get().teams, team] })
      },
      renameTeam: (teamId, name) => {
        set({
          teams: get().teams.map((team) =>
            team.id === teamId ? { ...team, name: name.trim() } : team,
          ),
        })
      },
      deleteTeam: (teamId) => {
        set({
          teams: get().teams.filter((team) => team.id !== teamId),
        })
      },
      clearTeamPlayers: (teamId) => {
        set({
          teams: get().teams.map((team) =>
            team.id === teamId
              ? {
                  ...team,
                  playerIds: team.playerIds.filter((id) =>
                    team.lockedPlayerIds.includes(id),
                  ),
                }
              : team,
          ),
        })
      },
      togglePlayerLock: (teamId, playerId) => {
        const player = get().players.find((item) => item.id === playerId)
        if (player && !player.isEnabled) {
          return
        }

        set({
          teams: get().teams.map((team) => {
            if (team.id !== teamId) {
              return team
            }

            const isLocked = team.lockedPlayerIds.includes(playerId)
            if (isLocked) {
              return {
                ...team,
                lockedPlayerIds: team.lockedPlayerIds.filter(
                  (id) => id !== playerId,
                ),
              }
            }

            if (!team.playerIds.includes(playerId)) {
              return team
            }

            return {
              ...team,
              lockedPlayerIds: [...team.lockedPlayerIds, playerId],
            }
          }),
        })
      },
      updateSettings: (partial) => {
        const current = get().settings
        set({
          settings: normalizeSettings({
            ...current,
            ...partial,
            drawVarietySwap: {
              ...current.drawVarietySwap,
              ...partial.drawVarietySwap,
            },
          }),
        })
      },
      replacePlayersAndTeams: (input) => {
        set({
          players: input.players,
          teams: input.teams,
          ...(input.settings ? { settings: input.settings } : {}),
        })
      },
      executeDraw: () => {
        const { players, teams, settings } = get()
        const enabledPlayers = getEnabledPlayers(players)
        const eligibility = canDrawTeams(enabledPlayers.length, teams.length)

        if (!eligibility.canDraw) {
          return {
            success: false,
            error: eligibility.reason ?? 'Não foi possível sortear os times.',
          }
        }

        try {
          const result = drawTeams({
            players,
            teams,
            balanceByGender: settings.balanceByGender,
            drawVarietySwap: settings.drawVarietySwap,
          })
          set({ teams: result.teams })
          return { success: true }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Não foi possível sortear os times.'
          return { success: false, error: message }
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return {
            players: [],
            teams: [],
            settings: DEFAULT_APP_SETTINGS,
          }
        }

        return normalizePersistedState(
          persistedState as IPersistedTeamDrawState,
        )
      },
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return currentState
        }

        return {
          ...currentState,
          ...normalizePersistedState(persistedState as IPersistedTeamDrawState),
        }
      },
      partialize: (state) => ({
        players: state.players,
        teams: state.teams,
        settings: state.settings,
      }),
      // Close over store actions — do NOT call `useTeamDrawStore` here.
      // localStorage rehydration is sync and runs during `create()`, before
      // the const binding exists (TDZ), which left hasHydrated stuck at false.
      onRehydrateStorage: (state) => {
        return (_rehydratedState, _error) => {
          state.setHasHydrated(true)
        }
      },
    },
  ),
)
