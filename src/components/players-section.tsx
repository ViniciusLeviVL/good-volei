'use client'

import { PencilIcon, PlusIcon, Trash2Icon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { EmptyState } from '@/components/empty-state'
import { PlayerForm } from '@/components/forms/player-form'
import type { IPlayerFormSchema } from '@/components/forms/player-form/schema'
import { SkillStarsDisplay } from '@/components/skill-rating-input'
import { Badge } from '@/components/ui/badge'
import { BlurFade } from '@/components/ui/blur-fade'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useTeamDrawStore } from '@/store/team-draw-store'
import { type IPlayer, PLAYER_GENDER_LABELS } from '@/types'

export function PlayersSection() {
  const players = useTeamDrawStore((state) => state.players)
  const addPlayer = useTeamDrawStore((state) => state.addPlayer)
  const updatePlayer = useTeamDrawStore((state) => state.updatePlayer)
  const deletePlayer = useTeamDrawStore((state) => state.deletePlayer)
  const togglePlayerEnabled = useTeamDrawStore(
    (state) => state.togglePlayerEnabled,
  )

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<IPlayer | null>(null)
  const [deletingPlayer, setDeletingPlayer] = useState<IPlayer | null>(null)

  const existingNames = players.map((player) => player.name)
  const enabledCount = players.filter((player) => player.isEnabled).length
  const disabledCount = players.length - enabledCount

  function handleCreate(values: IPlayerFormSchema): void {
    try {
      addPlayer(values)
      setIsCreateOpen(false)
      toast.success('Jogador adicionado')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível adicionar o jogador.',
      )
    }
  }

  function handleUpdate(values: IPlayerFormSchema): void {
    if (!editingPlayer) {
      return
    }

    try {
      updatePlayer({ id: editingPlayer.id, ...values })
      setEditingPlayer(null)
      toast.success('Jogador atualizado')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o jogador.',
      )
    }
  }

  function handleToggleEnabled(player: IPlayer): void {
    togglePlayerEnabled(player.id)
  }

  function getRosterSummary(): string {
    if (players.length === 0) {
      return '0 cadastrados'
    }

    const totalLabel = `${players.length} cadastrado${players.length === 1 ? '' : 's'}`
    if (disabledCount === 0) {
      return totalLabel
    }

    return `${totalLabel} · ${enabledCount} ativo${enabledCount === 1 ? '' : 's'}`
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-semibold text-base">Jogadores</h2>
          <p className="text-muted-foreground text-xs">{getRosterSummary()}</p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Adicionar
        </Button>
      </div>

      {players.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Nenhum jogador ainda"
          description="Adicione jogadores com nome, habilidade e gênero para começar a montar times equilibrados."
          action={
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              Adicionar primeiro jogador
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {players.map((player, index) => (
            <BlurFade key={player.id} delay={0.02 * index} inView>
              <li
                className={cn(
                  'flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 ring-1 ring-foreground/10 transition-opacity',
                  !player.isEnabled && 'opacity-50',
                )}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-sm">
                      {player.name}
                    </p>
                    <Badge variant="secondary">
                      {PLAYER_GENDER_LABELS[player.gender]}
                    </Badge>
                    {!player.isEnabled ? (
                      <Badge variant="outline">Desativado</Badge>
                    ) : null}
                  </div>
                  <SkillStarsDisplay value={player.skill} />
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-2 pr-1">
                    <Label
                      htmlFor={`player-enabled-${player.id}`}
                      className="sr-only"
                    >
                      Ativo
                    </Label>
                    <Switch
                      id={`player-enabled-${player.id}`}
                      size="sm"
                      checked={player.isEnabled}
                      aria-label={
                        player.isEnabled
                          ? `Desativar ${player.name}`
                          : `Ativar ${player.name}`
                      }
                      onCheckedChange={() => handleToggleEnabled(player)}
                    />
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Editar ${player.name}`}
                    onClick={() => setEditingPlayer(player)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Excluir ${player.name}`}
                    onClick={() => setDeletingPlayer(player)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            </BlurFade>
          ))}
        </ul>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar jogador</DialogTitle>
            <DialogDescription>
              Defina a habilidade de 0 a 5 estrelas em passos de meia estrela.
            </DialogDescription>
          </DialogHeader>
          <PlayerForm
            submitLabel="Adicionar jogador"
            existingNames={existingNames}
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingPlayer)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPlayer(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar jogador</DialogTitle>
            <DialogDescription>
              Atualize o nome, a habilidade ou o gênero deste jogador.
            </DialogDescription>
          </DialogHeader>
          {editingPlayer ? (
            <PlayerForm
              key={editingPlayer.id}
              submitLabel="Salvar alterações"
              existingNames={existingNames}
              excludeName={editingPlayer.name}
              defaultValues={{
                name: editingPlayer.name,
                skill: editingPlayer.skill,
                gender: editingPlayer.gender,
              }}
              onCancel={() => setEditingPlayer(null)}
              onSubmit={handleUpdate}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deletingPlayer)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPlayer(null)
          }
        }}
        title="Excluir jogador?"
        description={`Isso removerá ${deletingPlayer?.name ?? 'este jogador'} de todos os times.`}
        onConfirm={() => {
          if (!deletingPlayer) {
            return
          }
          deletePlayer(deletingPlayer.id)
          toast.success('Jogador excluído')
        }}
      />
    </section>
  )
}
