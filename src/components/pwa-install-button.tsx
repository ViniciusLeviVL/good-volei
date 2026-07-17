'use client'

import { DownloadIcon, ShareIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { usePwaInstall } from '@/hooks/use-pwa-install'

export function PwaInstallButton() {
  const { isReady, canInstall, showIosHint, isStandalone, promptInstall } =
    usePwaInstall()

  if (isReady && isStandalone) return null
  if (!canInstall && !showIosHint) return null

  return (
    <div className="flex flex-col gap-3">
      {canInstall ? (
        <Button
          type="button"
          size="lg"
          className="w-full sm:w-auto sm:self-center"
          onClick={() => {
            void promptInstall()
          }}
        >
          <DownloadIcon data-icon="inline-start" />
          Instalar aplicativo
        </Button>
      ) : null}

      {showIosHint ? (
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShareIcon className="size-4" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-sm">Adicionar à Tela de Início</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              No Safari, toque em{' '}
              <span className="font-medium text-foreground">Compartilhar</span>{' '}
              e depois em{' '}
              <span className="font-medium text-foreground">
                Adicionar à Tela de Início
              </span>{' '}
              para instalar o Good Vôlei.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
