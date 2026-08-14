import type { IDrawVarietySwapConfig, IPlayer, PlayerGender } from '@/types'

export interface IMutableTeamState {
  id: string
  name: string
  playerIds: string[]
  lockedPlayerIds: string[]
  skillTotal: number
  maleCount: number
  femaleCount: number
}

interface IDiversifyTeamsInput {
  readonly teamStates: IMutableTeamState[]
  readonly playerMap: ReadonlyMap<string, IPlayer>
  readonly swapConfig: IDrawVarietySwapConfig
  readonly balanceByGender: boolean
}

/**
 * Mixes unlocked players of similar skill after the greedy assignment.
 * Stops after a fixed number of attempts, not accepted swaps.
 */
export function diversifyTeamsBySimilarSwaps(
  input: IDiversifyTeamsInput,
): IMutableTeamState[] {
  const { teamStates, playerMap, swapConfig, balanceByGender } = input
  const baselineSpread = getSkillSpread(teamStates)

  for (let attempt = 0; attempt < swapConfig.attempts; attempt += 1) {
    trySimilarPlayerSwap({
      teamStates,
      playerMap,
      balanceByGender,
      maxSkillDelta: swapConfig.maxSkillDelta,
      maxSpreadIncrease: swapConfig.maxSpreadIncrease,
      baselineSpread,
    })
  }

  return teamStates
}

interface ITrySimilarPlayerSwapInput {
  readonly teamStates: IMutableTeamState[]
  readonly playerMap: ReadonlyMap<string, IPlayer>
  readonly balanceByGender: boolean
  readonly maxSkillDelta: number
  readonly maxSpreadIncrease: number
  readonly baselineSpread: number
}

function trySimilarPlayerSwap(input: ITrySimilarPlayerSwapInput): boolean {
  const {
    teamStates,
    playerMap,
    balanceByGender,
    maxSkillDelta,
    maxSpreadIncrease,
    baselineSpread,
  } = input
  const eligibleIndexes = getEligibleTeamIndexes(teamStates, playerMap)
  const teamPair = pickTwoDistinctIndexes(eligibleIndexes)
  if (!teamPair) {
    return false
  }

  const teamA = teamStates[teamPair[0]]
  const teamB = teamStates[teamPair[1]]
  const playerA = pickRandomItem(getSwappablePlayers(teamA, playerMap))
  const playerB = pickRandomItem(getSwappablePlayers(teamB, playerMap))
  if (!playerA || !playerB) {
    return false
  }

  if (!canSwapPlayers({ playerA, playerB, balanceByGender, maxSkillDelta })) {
    return false
  }

  const projectedSpread = getSpreadAfterSwap(
    teamStates,
    teamA,
    teamB,
    playerA,
    playerB,
  )
  if (projectedSpread > baselineSpread + maxSpreadIncrease) {
    return false
  }

  applyPlayerSwap(teamA, teamB, playerA, playerB)
  return true
}

interface ICanSwapPlayersInput {
  readonly playerA: IPlayer
  readonly playerB: IPlayer
  readonly balanceByGender: boolean
  readonly maxSkillDelta: number
}

function canSwapPlayers(input: ICanSwapPlayersInput): boolean {
  const { playerA, playerB, balanceByGender, maxSkillDelta } = input
  if (Math.abs(playerA.skill - playerB.skill) > maxSkillDelta) {
    return false
  }
  if (balanceByGender && playerA.gender !== playerB.gender) {
    return false
  }
  return true
}

function getEligibleTeamIndexes(
  teamStates: readonly IMutableTeamState[],
  playerMap: ReadonlyMap<string, IPlayer>,
): number[] {
  return teamStates
    .map((team, index) => ({ team, index }))
    .filter(({ team }) => getSwappablePlayers(team, playerMap).length > 0)
    .map(({ index }) => index)
}

function getSwappablePlayers(
  team: IMutableTeamState,
  playerMap: ReadonlyMap<string, IPlayer>,
): IPlayer[] {
  const lockedPlayerIds = new Set(team.lockedPlayerIds)
  const players: IPlayer[] = []

  for (const playerId of team.playerIds) {
    if (lockedPlayerIds.has(playerId)) {
      continue
    }
    const player = playerMap.get(playerId)
    if (player) {
      players.push(player)
    }
  }

  return players
}

function pickTwoDistinctIndexes(
  indexes: readonly number[],
): [number, number] | null {
  if (indexes.length < 2) {
    return null
  }

  const firstSlot = Math.floor(Math.random() * indexes.length)
  let secondSlot = Math.floor(Math.random() * (indexes.length - 1))
  if (secondSlot >= firstSlot) {
    secondSlot += 1
  }

  return [indexes[firstSlot], indexes[secondSlot]]
}

function pickRandomItem<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) {
    return undefined
  }

  return items[Math.floor(Math.random() * items.length)]
}

function getSkillSpread(teams: readonly IMutableTeamState[]): number {
  const totals = teams.map((team) => team.skillTotal)
  return Math.max(...totals) - Math.min(...totals)
}

function getSpreadAfterSwap(
  teams: readonly IMutableTeamState[],
  teamA: IMutableTeamState,
  teamB: IMutableTeamState,
  playerA: IPlayer,
  playerB: IPlayer,
): number {
  const totals = teams.map((team) => {
    if (team.id === teamA.id) {
      return team.skillTotal - playerA.skill + playerB.skill
    }
    if (team.id === teamB.id) {
      return team.skillTotal - playerB.skill + playerA.skill
    }
    return team.skillTotal
  })

  return Math.max(...totals) - Math.min(...totals)
}

function applyPlayerSwap(
  teamA: IMutableTeamState,
  teamB: IMutableTeamState,
  playerA: IPlayer,
  playerB: IPlayer,
): void {
  replacePlayerId(teamA.playerIds, playerA.id, playerB.id)
  replacePlayerId(teamB.playerIds, playerB.id, playerA.id)
  teamA.skillTotal += playerB.skill - playerA.skill
  teamB.skillTotal += playerA.skill - playerB.skill
  updateGenderCount(teamA, playerA.gender, -1)
  updateGenderCount(teamA, playerB.gender, 1)
  updateGenderCount(teamB, playerB.gender, -1)
  updateGenderCount(teamB, playerA.gender, 1)
}

function replacePlayerId(
  playerIds: string[],
  fromId: string,
  toId: string,
): void {
  const index = playerIds.indexOf(fromId)
  if (index < 0) {
    return
  }
  playerIds[index] = toId
}

function updateGenderCount(
  team: IMutableTeamState,
  gender: PlayerGender,
  delta: number,
): void {
  if (gender === 'male') {
    team.maleCount += delta
    return
  }
  team.femaleCount += delta
}
