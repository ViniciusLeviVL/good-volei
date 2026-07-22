import {
  calculateTeamStats,
  createPlayerMap,
  getTeamPlayers,
} from '@/lib/team-stats'
import type { IPlayer, ITeam } from '@/types'

export interface IShareTeamResult {
  readonly name: string
  readonly playerNames: readonly string[]
  readonly playerCount: number
  readonly maleCount: number
  readonly femaleCount: number
}

const IMAGE_WIDTH = 720
const IMAGE_PADDING = 36
const TEAM_GAP = 20
const HEADER_HEIGHT = 92
const FOOTER_HEIGHT = 48
const TEAM_HEADER_HEIGHT = 56
const PLAYER_ROW_HEIGHT = 34
const TEAM_PADDING_Y = 16

const COLORS = {
  background: '#f5fbf8',
  card: '#ffffff',
  primary: '#1f8a72',
  primarySoft: '#e6f5f0',
  foreground: '#1a2e28',
  muted: '#5f746c',
  border: '#d5e6df',
} as const

export function hasShareableDrawResults(teams: readonly ITeam[]): boolean {
  return teams.some((team) => team.playerIds.length > 0)
}

export function buildShareTeamResults(
  teams: readonly ITeam[],
  players: readonly IPlayer[],
): IShareTeamResult[] {
  const playerMap = createPlayerMap(players)

  return teams.map((team) => {
    const teamPlayers = getTeamPlayers(team, playerMap)
    const stats = calculateTeamStats(team, playerMap)

    return {
      name: team.name,
      playerNames: teamPlayers.map((player) => player.name),
      playerCount: stats.playerCount,
      maleCount: stats.maleCount,
      femaleCount: stats.femaleCount,
    }
  })
}

/**
 * Builds a WhatsApp-friendly plain text summary of the draw results.
 */
export function formatWhatsAppDrawText(
  teams: readonly IShareTeamResult[],
): string {
  const lines: string[] = ['🏐 *Good Vôlei — Resultado do sorteio*', '']

  for (const [index, team] of teams.entries()) {
    const playerLabel =
      team.playerCount === 1 ? '1 jogador' : `${team.playerCount} jogadores`
    lines.push(`*${team.name}* (${playerLabel})`)

    if (team.playerNames.length === 0) {
      lines.push('• Sem jogadores')
    } else {
      for (const playerName of team.playerNames) {
        lines.push(`• ${playerName}`)
      }
    }

    if (index < teams.length - 1) {
      lines.push('')
    }
  }

  lines.push('', '_Sorteado com Good Vôlei_')
  return lines.join('\n')
}

export async function copyTextToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

function truncateCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (context.measureText(text).width <= maxWidth) {
    return text
  }

  const ellipsis = '…'
  let truncated = text

  while (truncated.length > 0) {
    truncated = truncated.slice(0, -1)
    if (context.measureText(`${truncated}${ellipsis}`).width <= maxWidth) {
      return `${truncated}${ellipsis}`
    }
  }

  return ellipsis
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.arcTo(x + width, y, x + width, y + height, safeRadius)
  context.arcTo(x + width, y + height, x, y + height, safeRadius)
  context.arcTo(x, y + height, x, y, safeRadius)
  context.arcTo(x, y, x + width, y, safeRadius)
  context.closePath()
}

function calculateImageHeight(teams: readonly IShareTeamResult[]): number {
  const teamsHeight = teams.reduce((total, team) => {
    const playerRows = Math.max(team.playerNames.length, 1)
    return (
      total +
      TEAM_HEADER_HEIGHT +
      TEAM_PADDING_Y * 2 +
      playerRows * PLAYER_ROW_HEIGHT +
      TEAM_GAP
    )
  }, 0)

  return HEADER_HEIGHT + teamsHeight + FOOTER_HEIGHT + IMAGE_PADDING
}

/**
 * Renders draw results into a PNG blob suitable for clipboard or download.
 */
export async function createDrawResultsImageBlob(
  teams: readonly IShareTeamResult[],
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const height = calculateImageHeight(teams)
  const scale = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = IMAGE_WIDTH * scale
  canvas.height = height * scale

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Não foi possível gerar a imagem do resultado.')
  }

  context.scale(scale, scale)
  context.fillStyle = COLORS.background
  context.fillRect(0, 0, IMAGE_WIDTH, height)

  context.fillStyle = COLORS.primary
  context.font = '700 28px system-ui, sans-serif'
  context.fillText('Good Vôlei', IMAGE_PADDING, 44)

  context.fillStyle = COLORS.muted
  context.font = '500 16px system-ui, sans-serif'
  context.fillText('Resultado do sorteio', IMAGE_PADDING, 72)

  let currentY = HEADER_HEIGHT
  const cardWidth = IMAGE_WIDTH - IMAGE_PADDING * 2

  for (const team of teams) {
    const playerRows = Math.max(team.playerNames.length, 1)
    const cardHeight =
      TEAM_HEADER_HEIGHT + TEAM_PADDING_Y * 2 + playerRows * PLAYER_ROW_HEIGHT

    context.save()
    roundRect(context, IMAGE_PADDING, currentY, cardWidth, cardHeight, 18)
    context.clip()

    context.fillStyle = COLORS.card
    context.fillRect(IMAGE_PADDING, currentY, cardWidth, cardHeight)

    context.fillStyle = COLORS.primarySoft
    context.fillRect(IMAGE_PADDING, currentY, cardWidth, TEAM_HEADER_HEIGHT)

    context.restore()

    context.strokeStyle = COLORS.border
    context.lineWidth = 1
    roundRect(context, IMAGE_PADDING, currentY, cardWidth, cardHeight, 18)
    context.stroke()

    const textMaxWidth = cardWidth - 40
    context.fillStyle = COLORS.foreground
    context.font = '700 20px system-ui, sans-serif'
    context.fillText(
      truncateCanvasText(context, team.name, textMaxWidth),
      IMAGE_PADDING + 20,
      currentY + 28,
    )

    const meta = `${team.playerCount} ${team.playerCount === 1 ? 'jogador' : 'jogadores'} · ${team.maleCount}M / ${team.femaleCount}F`
    context.fillStyle = COLORS.muted
    context.font = '500 13px system-ui, sans-serif'
    context.fillText(meta, IMAGE_PADDING + 20, currentY + 48)

    let playerY = currentY + TEAM_HEADER_HEIGHT + TEAM_PADDING_Y + 8

    if (team.playerNames.length === 0) {
      context.fillStyle = COLORS.muted
      context.font = '500 15px system-ui, sans-serif'
      context.fillText('Sem jogadores', IMAGE_PADDING + 20, playerY)
    } else {
      for (const playerName of team.playerNames) {
        context.fillStyle = COLORS.primary
        context.beginPath()
        context.arc(IMAGE_PADDING + 26, playerY - 4, 3.5, 0, Math.PI * 2)
        context.fill()

        context.fillStyle = COLORS.foreground
        context.font = '500 16px system-ui, sans-serif'
        context.fillText(
          truncateCanvasText(context, playerName, textMaxWidth - 20),
          IMAGE_PADDING + 40,
          playerY,
        )
        playerY += PLAYER_ROW_HEIGHT
      }
    }

    currentY += cardHeight + TEAM_GAP
  }

  context.fillStyle = COLORS.muted
  context.font = '500 13px system-ui, sans-serif'
  context.fillText('Sorteado com Good Vôlei', IMAGE_PADDING, height - 20)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Não foi possível gerar a imagem do resultado.'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

function downloadImageBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  anchor.href = url
  anchor.download = `good-volei-sorteio-${stamp}.png`
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Copies the PNG to the clipboard when supported; otherwise downloads the file.
 */
export async function copyOrDownloadDrawImage(
  blob: Blob,
): Promise<'copied' | 'downloaded'> {
  const canWriteImage =
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function'

  if (!canWriteImage) {
    downloadImageBlob(blob)
    return 'downloaded'
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ])
    return 'copied'
  } catch {
    downloadImageBlob(blob)
    return 'downloaded'
  }
}
