export interface ITeam {
  readonly id: string
  readonly name: string
  readonly playerIds: readonly string[]
  readonly lockedPlayerIds: readonly string[]
}
