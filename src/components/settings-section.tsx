'use client'

import { SettingsIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useTeamDrawStore } from '@/store/team-draw-store'

export function SettingsSection() {
  const settings = useTeamDrawStore((state) => state.settings)
  const updateSettings = useTeamDrawStore((state) => state.updateSettings)

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading font-semibold text-base">Configurações</h2>
        <p className="text-muted-foreground text-xs">
          Ajuste como o sorteio equilibra os times
        </p>
      </div>

      <div className="space-y-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <SettingsIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="balance-by-gender" className="text-sm">
                  Equilibrar por gênero
                </Label>
                <p className="text-muted-foreground text-xs">
                  Prefira uma divisão mais equilibrada de masculino/feminino
                  entre os times.
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
        </div>
      </div>
    </section>
  )
}
