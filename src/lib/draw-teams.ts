import { MIN_TEAMS_FOR_DRAW, SKILL_SIMILARITY_THRESHOLD } from '@/lib/constants'
import type { IPlayer, ITeam, PlayerGender } from '@/types'

export interface IDrawTeamsInput {
  readonly players: readonly IPlayer[]
  readonly teams: readonly ITeam[]
  readonly balanceByGender: boolean
}

export interface IDrawTeamsResult {
  readonly teams: ITeam[]
}

interface IMutableTeamState {
  id: string
  name: string
  playerIds: string[]
  lockedPlayerIds: string[]
  skillTotal: number
  maleCount: number
  femaleCount: number
}

/**
 * Distributes unlocked players across teams while keeping locked players fixed.
 * Balances skill totals, optionally gender, and randomizes similar-rated players.
 */
export function drawTeams(input: IDrawTeamsInput): IDrawTeamsResult {
  const { players, teams, balanceByGender } = input

  if (teams.length < MIN_TEAMS_FOR_DRAW) {
    throw new Error(
      `É necessário ter pelo menos ${MIN_TEAMS_FOR_DRAW} times para sortear.`,
    )
  }

  if (players.length === 0) {
    throw new Error('Adicione pelo menos um jogador antes de sortear.')
  }

  const playerMap = new Map(players.map((player) => [player.id, player]))
  const teamStates = createInitialTeamStates(teams, playerMap)
  const lockedPlayerIds = collectLockedPlayerIds(teams)
  const unlockedPlayers = players.filter(
    (player) => !lockedPlayerIds.has(player.id),
  )
  const orderedPlayers = orderPlayersForAssignment(unlockedPlayers)

  for (const player of orderedPlayers) {
    const teamIndex = selectBestTeamIndex(teamStates, player, balanceByGender)
    assignPlayerToTeam(teamStates[teamIndex], player)
  }

  return {
    teams: teamStates.map((team) => ({
      id: team.id,
      name: team.name,
      playerIds: [...team.playerIds],
      lockedPlayerIds: [...team.lockedPlayerIds],
    })),
  }
}

function createInitialTeamStates(
  teams: readonly ITeam[],
  playerMap: ReadonlyMap<string, IPlayer>,
): IMutableTeamState[] {
  return teams.map((team) => {
    const lockedPlayerIds = team.lockedPlayerIds.filter((playerId) =>
      playerMap.has(playerId),
    )
    const state: IMutableTeamState = {
      id: team.id,
      name: team.name,
      playerIds: [],
      lockedPlayerIds: [...lockedPlayerIds],
      skillTotal: 0,
      maleCount: 0,
      femaleCount: 0,
    }

    for (const playerId of lockedPlayerIds) {
      const player = playerMap.get(playerId)
      if (player) {
        assignPlayerToTeam(state, player)
      }
    }

    return state
  })
}

function collectLockedPlayerIds(teams: readonly ITeam[]): Set<string> {
  return new Set(teams.flatMap((team) => team.lockedPlayerIds))
}

function orderPlayersForAssignment(players: readonly IPlayer[]): IPlayer[] {
  const sorted = [...players].sort((left, right) => {
    if (right.skill !== left.skill) {
      return right.skill - left.skill
    }
    return Math.random() - 0.5
  })

  return shuffleWithinSkillBands(sorted)
}

/**
 * Randomizes players with similar skill so repeated draws are not identical.
 */
function shuffleWithinSkillBands(players: readonly IPlayer[]): IPlayer[] {
  if (players.length <= 1) {
    return [...players]
  }

  const result: IPlayer[] = []
  let bandStart = 0

  for (let index = 1; index <= players.length; index += 1) {
    const isBandEnd =
      index === players.length ||
      Math.abs(players[bandStart].skill - players[index].skill) >
        SKILL_SIMILARITY_THRESHOLD

    if (!isBandEnd) {
      continue
    }

    const band = players.slice(bandStart, index)
    result.push(...shuffleArray(band))
    bandStart = index
  }

  return result
}

function shuffleArray<T>(items: readonly T[]): T[] {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = current
  }

  return result
}

function selectBestTeamIndex(
  teams: readonly IMutableTeamState[],
  player: IPlayer,
  balanceByGender: boolean,
): number {
  const scores = teams.map((team) =>
    calculateAssignmentCost(team, player, teams, balanceByGender),
  )
  const bestScore = Math.min(...scores)
  const scoreEpsilon = 0.05
  const candidateIndexes = scores
    .map((score, index) => ({ score, index }))
    .filter(({ score }) => score <= bestScore + scoreEpsilon)
    .map(({ index }) => index)

  const randomIndex = Math.floor(Math.random() * candidateIndexes.length)
  return candidateIndexes[randomIndex]
}

function calculateAssignmentCost(
  team: IMutableTeamState,
  player: IPlayer,
  allTeams: readonly IMutableTeamState[],
  balanceByGender: boolean,
): number {
  const projectedSkill = team.skillTotal + player.skill
  const projectedCount = team.playerIds.length + 1
  const otherSkillTotals = allTeams
    .filter((candidate) => candidate.id !== team.id)
    .map((candidate) => candidate.skillTotal)
  const projectedSkills = [...otherSkillTotals, projectedSkill]
  const skillSpread =
    Math.max(...projectedSkills) - Math.min(...projectedSkills)

  const otherCounts = allTeams
    .filter((candidate) => candidate.id !== team.id)
    .map((candidate) => candidate.playerIds.length)
  const projectedCounts = [...otherCounts, projectedCount]
  const countSpread =
    Math.max(...projectedCounts) - Math.min(...projectedCounts)

  let genderCost = 0
  if (balanceByGender) {
    genderCost = calculateGenderCost(team, player.gender, allTeams)
  }

  return skillSpread * 2 + countSpread * 0.75 + genderCost
}

function calculateGenderCost(
  team: IMutableTeamState,
  gender: PlayerGender,
  allTeams: readonly IMutableTeamState[],
): number {
  const currentGenderCount =
    gender === 'male' ? team.maleCount : team.femaleCount
  const projectedGenderCount = currentGenderCount + 1
  const otherGenderCounts = allTeams
    .filter((candidate) => candidate.id !== team.id)
    .map((candidate) =>
      gender === 'male' ? candidate.maleCount : candidate.femaleCount,
    )
  const projectedGenderCounts = [...otherGenderCounts, projectedGenderCount]
  const genderSpread =
    Math.max(...projectedGenderCounts) - Math.min(...projectedGenderCounts)

  return genderSpread * 1.5
}

function assignPlayerToTeam(team: IMutableTeamState, player: IPlayer): void {
  team.playerIds.push(player.id)
  team.skillTotal += player.skill
  if (player.gender === 'male') {
    team.maleCount += 1
    return
  }
  team.femaleCount += 1
}

export function canDrawTeams(
  playerCount: number,
  teamCount: number,
): { canDraw: boolean; reason?: string } {
  if (teamCount < MIN_TEAMS_FOR_DRAW) {
    return {
      canDraw: false,
      reason: `Crie pelo menos ${MIN_TEAMS_FOR_DRAW} times antes de sortear.`,
    }
  }

  if (playerCount === 0) {
    return {
      canDraw: false,
      reason: 'Adicione pelo menos um jogador antes de sortear.',
    }
  }

  return { canDraw: true }
}
