'use client'

import {
  CheckIcon,
  CopyIcon,
  ImageIcon,
  Loader2Icon,
  MessageCircleIcon,
  Share2Icon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
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
  copyOrDownloadDrawImage,
  copyTextToClipboard,
  createDrawResultsImageBlob,
  formatWhatsAppDrawText,
  hasShareableDrawResults,
} from '@/lib/share-draw-results'
import { useTeamDrawStore } from '@/store/team-draw-store'

type ShareAction = 'text' | 'image' | null

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

function ShareResultsDialog({ open, onOpenChange }: IShareResultsDialogProps) {
  const players = useTeamDrawStore((state) => state.players)
  const teams = useTeamDrawStore((state) => state.teams)
  const [activeAction, setActiveAction] = useState<ShareAction>(null)
  const [copiedAction, setCopiedAction] = useState<ShareAction>(null)
  const isBusy = activeAction !== null

  const shareTeams = useMemo(
    () => buildShareTeamResults(teams, players),
    [players, teams],
  )

  function markCopied(action: ShareAction): void {
    setCopiedAction(action)
    window.setTimeout(() => {
      setCopiedAction((current) => (current === action ? null : current))
    }, 1800)
  }

  async function handleCopyText(): Promise<void> {
    setActiveAction('text')
    try {
      const text = formatWhatsAppDrawText(shareTeams)
      await copyTextToClipboard(text)
      markCopied('text')
      toast.success('Texto copiado')
    } catch {
      toast.error('Não foi possível copiar o texto.')
    } finally {
      setActiveAction(null)
    }
  }

  async function handleCopyImage(): Promise<void> {
    setActiveAction('image')
    try {
      const blob = await createDrawResultsImageBlob(shareTeams)
      const result = await copyOrDownloadDrawImage(blob)

      if (result === 'copied') {
        markCopied('image')
        toast.success('Imagem copiada')
      } else {
        toast.success('Imagem baixada')
      }
    } catch {
      toast.error('Não foi possível gerar a imagem.')
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar resultado</DialogTitle>
          <DialogDescription>
            Envie os times e jogadores por imagem ou por texto pronto para o
            WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Button
            variant="outline"
            className="h-auto justify-start gap-3 px-3 py-3 text-left"
            disabled={isBusy}
            onClick={handleCopyImage}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {activeAction === 'image' ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : copiedAction === 'image' ? (
                <CheckIcon className="size-4" />
              ) : (
                <ImageIcon className="size-4" />
              )}
            </span>
            <span className="min-w-0 flex-1 space-y-0.5">
              <span className="block font-medium text-sm">
                {copiedAction === 'image' ? 'Imagem copiada' : 'Copiar imagem'}
              </span>
              <span className="block text-muted-foreground text-xs">
                Card com times e participantes
              </span>
            </span>
            <CopyIcon className="size-4 shrink-0 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            className="h-auto justify-start gap-3 px-3 py-3 text-left"
            disabled={isBusy}
            onClick={handleCopyText}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {activeAction === 'text' ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : copiedAction === 'text' ? (
                <CheckIcon className="size-4" />
              ) : (
                <MessageCircleIcon className="size-4" />
              )}
            </span>
            <span className="min-w-0 flex-1 space-y-0.5">
              <span className="block font-medium text-sm">
                {copiedAction === 'text'
                  ? 'Texto copiado'
                  : 'Copiar texto'}
              </span>
              <span className="block text-muted-foreground text-xs">
                Formatação com negrito e lista
              </span>
            </span>
            <CopyIcon className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
