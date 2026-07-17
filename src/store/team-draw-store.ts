'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { STORAGE_KEY } from '@/lib/constants'
import { canDrawTeams, drawTeams } from '@/lib/draw-teams'
import { isPlayerNameTaken } from '@/lib/team-stats'
import {
  DEFAULT_APP_SETTINGS,
  type IAppSettings,
  type IPlayer,
  type ITeam,
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

export interface ITeamDrawStore {
  readonly players: IPlayer[]
  readonly teams: ITeam[]
  readonly settings: IAppSettings
  readonly hasHydrated: boolean
  readonly setHasHydrated: (hasHydrated: boolean) => void
  readonly addPlayer: (input: ICreatePlayerInput) => void
  readonly updatePlayer: (input: IUpdatePlayerInput) => void
  readonly deletePlayer: (playerId: string) => void
  readonly addTeam: (input: ICreateTeamInput) => void
  readonly renameTeam: (teamId: string, name: string) => void
  readonly deleteTeam: (teamId: string) => void
  readonly togglePlayerLock: (teamId: string, playerId: string) => void
  readonly updateSettings: (settings: Partial<IAppSettings>) => void
  readonly executeDraw: () =>
    | { success: true }
    | { success: false; error: string }
}

function createId(): string {
  return crypto.randomUUID()
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
          teams: teams.map((team) => ({
            ...team,
            playerIds: team.playerIds.filter((id) => id !== playerId),
            lockedPlayerIds: team.lockedPlayerIds.filter(
              (id) => id !== playerId,
            ),
          })),
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
      togglePlayerLock: (teamId, playerId) => {
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
      updateSettings: (settings) => {
        set({
          settings: {
            ...get().settings,
            ...settings,
          },
        })
      },
      executeDraw: () => {
        const { players, teams, settings } = get()
        const eligibility = canDrawTeams(players.length, teams.length)

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
      partialize: (state) => ({
        players: state.players,
        teams: state.teams,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
          return
        }
        useTeamDrawStore.setState({ hasHydrated: true })
      },
    },
  ),
)
