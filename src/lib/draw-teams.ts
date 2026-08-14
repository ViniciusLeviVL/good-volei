import { MIN_TEAMS_FOR_DRAW, SKILL_SIMILARITY_THRESHOLD } from '@/lib/constants'
import {
  diversifyTeamsBySimilarSwaps,
  type IMutableTeamState,
} from '@/lib/diversify-teams'
import { getEnabledPlayers } from '@/lib/team-stats'
import type {
  IDrawVarietySwapConfig,
  IPlayer,
  ITeam,
  PlayerGender,
} from '@/types'

export interface IDrawTeamsInput {
  readonly players: readonly IPlayer[]
  readonly teams: readonly ITeam[]
  readonly balanceByGender: boolean
  readonly drawVarietySwap: IDrawVarietySwapConfig
}

export interface IDrawTeamsResult {
  readonly teams: ITeam[]
}

/**
 * Distributes unlocked enabled players across teams while keeping locked players fixed.
 * Disabled players are ignored entirely (including locked ones left on teams).
 * Fills smaller teams first so sizes stay even, then balances skill and optional gender.
 * Similar-rated players may still swap afterwards for variety.
 */
export function drawTeams(input: IDrawTeamsInput): IDrawTeamsResult {
  const { players, teams, balanceByGender, drawVarietySwap } = input
  const enabledPlayers = getEnabledPlayers(players)

  if (teams.length < MIN_TEAMS_FOR_DRAW) {
    throw new Error(
      `É necessário ter pelo menos ${MIN_TEAMS_FOR_DRAW} times para sortear.`,
    )
  }

  if (enabledPlayers.length === 0) {
    throw new Error('Ative ou adicione pelo menos um jogador antes de sortear.')
  }

  const playerMap = new Map(enabledPlayers.map((player) => [player.id, player]))
  const teamStates = createInitialTeamStates(teams, playerMap)
  const lockedPlayerIds = collectLockedPlayerIds(teamStates)
  const unlockedPlayers = enabledPlayers.filter(
    (player) => !lockedPlayerIds.has(player.id),
  )
  const orderedPlayers = orderPlayersForAssignment(unlockedPlayers)

  for (const player of orderedPlayers) {
    const teamIndex = selectBestTeamIndex(teamStates, player, balanceByGender)
    assignPlayerToTeam(teamStates[teamIndex], player)
  }

  diversifyTeamsBySimilarSwaps({
    teamStates,
    playerMap,
    swapConfig: drawVarietySwap,
    balanceByGender,
  })

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

function collectLockedPlayerIds(
  teams: readonly Pick<ITeam, 'lockedPlayerIds'>[],
): Set<string> {
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

/**
 * Always fills a currently smallest team so sizes differ by at most one,
 * unless locked players already force a larger gap.
 */
function selectBestTeamIndex(
  teams: readonly IMutableTeamState[],
  player: IPlayer,
  balanceByGender: boolean,
): number {
  const candidateIndexes = getSmallestTeamIndexes(teams)
  const scores = candidateIndexes.map((index) =>
    calculateAssignmentCost(teams[index], player, teams, balanceByGender),
  )
  const bestScore = Math.min(...scores)
  const scoreEpsilon = 0.05
  const bestIndexes = candidateIndexes.filter(
    (_, scoreIndex) => scores[scoreIndex] <= bestScore + scoreEpsilon,
  )
  const randomIndex = Math.floor(Math.random() * bestIndexes.length)
  return bestIndexes[randomIndex]
}

function getSmallestTeamIndexes(teams: readonly IMutableTeamState[]): number[] {
  const minCount = Math.min(...teams.map((team) => team.playerIds.length))
  return teams
    .map((team, index) => ({ count: team.playerIds.length, index }))
    .filter(({ count }) => count === minCount)
    .map(({ index }) => index)
}

function calculateAssignmentCost(
  team: IMutableTeamState,
  player: IPlayer,
  allTeams: readonly IMutableTeamState[],
  balanceByGender: boolean,
): number {
  const projectedSkill = team.skillTotal + player.skill
  const otherSkillTotals = allTeams
    .filter((candidate) => candidate.id !== team.id)
    .map((candidate) => candidate.skillTotal)
  const projectedSkills = [...otherSkillTotals, projectedSkill]
  const skillSpread =
    Math.max(...projectedSkills) - Math.min(...projectedSkills)

  let genderCost = 0
  if (balanceByGender) {
    genderCost = calculateGenderCost(team, player.gender, allTeams)
  }

  return skillSpread * 2 + genderCost
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
      reason: 'Ative ou adicione pelo menos um jogador antes de sortear.',
    }
  }

  return { canDraw: true }
}
