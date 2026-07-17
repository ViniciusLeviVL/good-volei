export const PLAYER_GENDERS = ['male', 'female'] as const

export type PlayerGender = (typeof PLAYER_GENDERS)[number]

export const PLAYER_GENDER_LABELS: Record<PlayerGender, string> = {
  male: 'Masculino',
  female: 'Feminino',
}

export interface IPlayer {
  readonly id: string
  readonly name: string
  readonly skill: number
  readonly gender: PlayerGender
}
