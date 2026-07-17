export const PLAYER_GENDERS = ['male', 'female'] as const

export type PlayerGender = (typeof PLAYER_GENDERS)[number]

export interface IPlayer {
  readonly id: string
  readonly name: string
  readonly skill: number
  readonly gender: PlayerGender
}
