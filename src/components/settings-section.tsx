'use client'

import { DownloadIcon, UploadIcon, VenusAndMarsIcon } from 'lucide-react'
import { type ChangeEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { DrawVarietySettings } from '@/components/draw-variety-settings'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  buildExportPayload,
  downloadTeamDrawJson,
  type IImportedTeamDrawData,
  mapImportToAppState,
  parseTeamDrawImport,
  readJsonFile,
} from '@/lib/team-draw-io'
import { useTeamDrawStore } from '@/store/team-draw-store'

export function SettingsSection() {
  const players = useTeamDrawStore((state) => state.players)
  const teams = useTeamDrawStore((state) => state.teams)
  const settings = useTeamDrawStore((state) => state.settings)
  const updateSettings = useTeamDrawStore((state) => state.updateSettings)
  const replacePlayersAndTeams = useTeamDrawStore(
    (state) => state.replacePlayersAndTeams,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] =
    useState<IImportedTeamDrawData | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  function handleExport(): void {
    const payload = buildExportPayload(players, teams)
    downloadTeamDrawJson(payload)
    toast.success('Dados exportados')
  }

  function handleImportClick(): void {
    fileInputRef.current?.click()
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const raw = await readJsonFile(file)
      const parsed = parseTeamDrawImport(raw)
      if (!parsed.success) {
        toast.error(parsed.error)
        return
      }

      setPendingImport(mapImportToAppState(parsed.data))
      setIsImportDialogOpen(true)
    } catch {
      toast.error(
        'Não foi possível ler o arquivo. Selecione um JSON válido do Team Draw.',
      )
    }
  }

  function handleImportDialogOpenChange(open: boolean): void {
    setIsImportDialogOpen(open)
    if (!open) {
      setPendingImport(null)
    }
  }

  function handleConfirmImport(): void {
    if (!pendingImport) {
      return
    }

    replacePlayersAndTeams(pendingImport)
    setPendingImport(null)
    toast.success('Dados importados')
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading font-semibold text-base">Configurações</h2>
        <p className="text-muted-foreground text-xs">
          Ajuste como o sorteio equilibra os times
        </p>
      </div>

      <div className="space-y-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <VenusAndMarsIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="balance-by-gender" className="text-sm">
                Equilibrar por gênero
              </Label>
              <p className="text-muted-foreground text-xs">
                Prefira uma divisão mais equilibrada de masculino/feminino entre
                os times.
              </p>
            </div>
            <Switch
              id="balance-by-gender"
              checked={settings.balanceByGender}
              onCheckedChange={(checked) =>
                updateSettings({ balanceByGender: checked })
              }
            />
          </div>
        </div>

        <Separator />

        <DrawVarietySettings />
      </div>

      <div className="space-y-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <div className="space-y-0.5">
          <p className="font-medium text-sm">Dados</p>
          <p className="text-muted-foreground text-xs">
            Exporte ou importe jogadores e times em um arquivo JSON.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleExport}
          >
            <DownloadIcon data-icon="inline-start" />
            Exportar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleImportClick}
          >
            <UploadIcon data-icon="inline-start" />
            Importar
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <ConfirmDeleteDialog
        open={isImportDialogOpen}
        onOpenChange={handleImportDialogOpenChange}
        title="Importar dados?"
        description="Importar este arquivo substituirá todos os jogadores e times atuais. Esta ação não pode ser desfeita. Deseja continuar?"
        confirmLabel="Importar"
        onConfirm={handleConfirmImport}
      />
    </section>
  )
}
