import type { IPlayer, ITeam, PlayerGender } from '@/types'

export interface ITeamStats {
  readonly teamId: string
  readonly playerCount: number
  readonly skillTotal: number
  readonly skillAverage: number
  readonly maleCount: number
  readonly femaleCount: number
}

export function createPlayerMap(
  players: readonly IPlayer[],
): ReadonlyMap<string, IPlayer> {
  return new Map(players.map((player) => [player.id, player]))
}

export function getTeamPlayers(
  team: ITeam,
  playerMap: ReadonlyMap<string, IPlayer>,
): IPlayer[] {
  return team.playerIds
    .map((playerId) => playerMap.get(playerId))
    .filter((player): player is IPlayer => player !== undefined)
}

export function getGenderCount(
  players: readonly IPlayer[],
  gender: PlayerGender,
): number {
  return players.filter((player) => player.gender === gender).length
}

export function calculateTeamStats(
  team: ITeam,
  playerMap: ReadonlyMap<string, IPlayer>,
): ITeamStats {
  const teamPlayers = getTeamPlayers(team, playerMap)
  const skillTotal = teamPlayers.reduce((sum, player) => sum + player.skill, 0)
  const playerCount = teamPlayers.length

  return {
    teamId: team.id,
    playerCount,
    skillTotal,
    skillAverage: playerCount === 0 ? 0 : skillTotal / playerCount,
    maleCount: getGenderCount(teamPlayers, 'male'),
    femaleCount: getGenderCount(teamPlayers, 'female'),
  }
}

export function getUnassignedPlayers(
  players: readonly IPlayer[],
  teams: readonly ITeam[],
): IPlayer[] {
  const assignedIds = new Set(teams.flatMap((team) => team.playerIds))

  return players.filter((player) => !assignedIds.has(player.id))
}

export function isPlayerNameTaken(
  name: string,
  players: readonly IPlayer[],
  excludePlayerId?: string,
): boolean {
  const normalizedName = name.trim().toLowerCase()

  return players.some(
    (player) =>
      player.id !== excludePlayerId &&
      player.name.trim().toLowerCase() === normalizedName,
  )
}
