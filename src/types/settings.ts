/**
 * Application settings. Designed to grow with additional options.
 */
export interface IAppSettings {
  readonly balanceByGender: boolean
}

export const DEFAULT_APP_SETTINGS: IAppSettings = {
  balanceByGender: false,
}
