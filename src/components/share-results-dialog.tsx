'use client'

import {
  CheckIcon,
  CopyIcon,
  ImageIcon,
  Loader2Icon,
  MessageCircleIcon,
  Share2Icon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  buildShareTeamResults,
  canShareDrawImage,
  canUseWebShare,
  copyDrawImage,
  copyDrawText,
  createDrawResultsImageBlob,
  formatWhatsAppDrawText,
  hasShareableDrawResults,
  type ShareOutcome,
  shareDrawImage,
  shareDrawText,
} from '@/lib/share-draw-results'
import { cn } from '@/lib/utils'
import { useTeamDrawStore } from '@/store/team-draw-store'

type ShareFormat = 'image' | 'text'
type ActionKind = 'share' | 'copy' | null

interface IShareResultsDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function ShareResultsButton() {
  const teams = useTeamDrawStore((state) => state.teams)
  const [isOpen, setIsOpen] = useState(false)
  const canShare = hasShareableDrawResults(teams)

  if (!canShare) {
    return null
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
        <Share2Icon data-icon="inline-start" />
        Compartilhar
      </Button>
      <ShareResultsDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}

function getCopySuccessMessage(
  outcome: ShareOutcome,
  format: ShareFormat,
): string {
  if (format === 'image') {
    return outcome === 'downloaded' ? 'Imagem baixada' : 'Imagem copiada'
  }
  return 'Texto copiado'
}

function ShareResultsDialog({ open, onOpenChange }: IShareResultsDialogProps) {
  const players = useTeamDrawStore((state) => state.players)
  const teams = useTeamDrawStore((state) => state.teams)
  const [format, setFormat] = useState<ShareFormat>('image')
  const [activeAction, setActiveAction] = useState<ActionKind>(null)
  const [doneAction, setDoneAction] = useState<ActionKind>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isPreparingImage, setIsPreparingImage] = useState(false)
  const [supportsTextShare, setSupportsTextShare] = useState(false)
  const [supportsImageShare, setSupportsImageShare] = useState(false)
  const isBusy = activeAction !== null

  const shareTeams = useMemo(
    () => buildShareTeamResults(teams, players),
    [players, teams],
  )
  const shareText = useMemo(
    () => formatWhatsAppDrawText(shareTeams),
    [shareTeams],
  )

  useEffect(() => {
    if (!open) {
      setFormat('image')
      setImageBlob(null)
      setActiveAction(null)
      setDoneAction(null)
      setSupportsImageShare(false)
      return
    }

    setSupportsTextShare(canUseWebShare())

    let isCancelled = false
    setIsPreparingImage(true)

    void createDrawResultsImageBlob(shareTeams)
      .then((blob) => {
        if (isCancelled) {
          return
        }
        setImageBlob(blob)
        setSupportsImageShare(canShareDrawImage(blob))
      })
      .catch(() => {
        if (!isCancelled) {
          setImageBlob(null)
          setSupportsImageShare(false)
          toast.error('Não foi possível preparar a imagem.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsPreparingImage(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [open, shareTeams])

  useEffect(() => {
    if (!imageBlob) {
      setImagePreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(imageBlob)
    setImagePreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [imageBlob])

  function markDone(action: ActionKind): void {
    setDoneAction(action)
    window.setTimeout(() => {
      setDoneAction((current) => (current === action ? null : current))
    }, 1800)
  }

  async function handleShare(): Promise<void> {
    setActiveAction('share')
    try {
      if (format === 'image') {
        if (!imageBlob) {
          toast.error('A imagem ainda está sendo preparada.')
          return
        }
        const outcome = await shareDrawImage(imageBlob)
        if (outcome === 'cancelled') return
      } else {
        const outcome = await shareDrawText(shareText)
        if (outcome === 'cancelled') return
      }
      markDone('share')
    } catch {
      toast.error(
        format === 'image'
          ? 'Não foi possível compartilhar a imagem.'
          : 'Não foi possível compartilhar o texto.',
      )
    } finally {
      setActiveAction(null)
    }
  }

  async function handleCopy(): Promise<void> {
    setActiveAction('copy')
    try {
      if (format === 'image') {
        if (!imageBlob) {
          toast.error('A imagem ainda está sendo preparada.')
          return
        }
        const outcome = await copyDrawImage(imageBlob)
        markDone('copy')
        toast.success(getCopySuccessMessage(outcome, 'image'))
        return
      }

      const outcome = await copyDrawText(shareText)
      markDone('copy')
      toast.success(getCopySuccessMessage(outcome, 'text'))
    } catch {
      toast.error(
        format === 'image'
          ? 'Não foi possível copiar a imagem.'
          : 'Não foi possível copiar o texto.',
      )
    } finally {
      setActiveAction(null)
    }
  }

  const canShareCurrentFormat =
    format === 'image' ? supportsImageShare : supportsTextShare
  const isImageReady = Boolean(imageBlob) && !isPreparingImage
  const isFormatReady = format === 'text' || isImageReady

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar resultado</DialogTitle>
          <DialogDescription>
            Escolha o formato e envie ou copie os times.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
            role="tablist"
            aria-label="Formato do resultado"
          >
            <button
              type="button"
              role="tab"
              aria-selected={format === 'image'}
              className={cn(
                'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 font-medium text-sm transition-colors',
                format === 'image'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setFormat('image')}
            >
              <ImageIcon className="size-3.5" />
              Imagem
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={format === 'text'}
              className={cn(
                'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 font-medium text-sm transition-colors',
                format === 'text'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setFormat('text')}
            >
              <MessageCircleIcon className="size-3.5" />
              Texto
            </button>
          </div>

          <div className="overflow-hidden rounded-xl bg-muted/40 ring-1 ring-foreground/10">
            {format === 'image' ? (
              <div className="flex min-h-40 items-center justify-center bg-background/60 p-3">
                {isPreparingImage || !imagePreviewUrl ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2Icon className="size-5 animate-spin" />
                    <p className="text-xs">Preparando preview…</p>
                  </div>
                ) : (
                  <div
                    role="img"
                    aria-label="Preview do resultado do sorteio"
                    className="h-52 w-full rounded-lg bg-center bg-contain bg-no-repeat"
                    style={{ backgroundImage: `url(${imagePreviewUrl})` }}
                  />
                )}
              </div>
            ) : (
              <pre className="max-h-52 overflow-auto whitespace-pre-wrap p-3 font-sans text-foreground text-xs leading-relaxed">
                {shareText}
              </pre>
            )}
          </div>

          <div
            className={cn(
              'grid gap-2',
              canShareCurrentFormat ? 'grid-cols-2' : 'grid-cols-1',
            )}
          >
            <Button
              variant="outline"
              className="h-10"
              disabled={isBusy || !isFormatReady}
              onClick={handleCopy}
            >
              {activeAction === 'copy' ? (
                <Loader2Icon
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : doneAction === 'copy' ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CopyIcon data-icon="inline-start" />
              )}
              {doneAction === 'copy' ? 'Copiado' : 'Copiar'}
            </Button>

            {canShareCurrentFormat ? (
              <Button
                className="h-10"
                disabled={isBusy || !isFormatReady}
                onClick={handleShare}
              >
                {activeAction === 'share' ? (
                  <Loader2Icon
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : doneAction === 'share' ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <Share2Icon data-icon="inline-start" />
                )}
                {doneAction === 'share' ? 'Enviado' : 'Compartilhar'}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
