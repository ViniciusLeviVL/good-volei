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
import { useTeamDrawStore } from '@/store/team-draw-store'
import { type IPlayer, PLAYER_GENDER_LABELS } from '@/types'

export function PlayersSection() {
  const players = useTeamDrawStore((state) => state.players)
  const addPlayer = useTeamDrawStore((state) => state.addPlayer)
  const updatePlayer = useTeamDrawStore((state) => state.updatePlayer)
  const deletePlayer = useTeamDrawStore((state) => state.deletePlayer)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<IPlayer | null>(null)
  const [deletingPlayer, setDeletingPlayer] = useState<IPlayer | null>(null)

  const existingNames = players.map((player) => player.name)

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

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-semibold text-base">Jogadores</h2>
          <p className="text-muted-foreground text-xs">
            {players.length} cadastrado{players.length === 1 ? '' : 's'}
          </p>
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
              <li className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 ring-1 ring-foreground/10">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-sm">
                      {player.name}
                    </p>
                    <Badge variant="secondary">
                      {PLAYER_GENDER_LABELS[player.gender]}
                    </Badge>
                  </div>
                  <SkillStarsDisplay value={player.skill} />
                </div>
                <div className="flex items-center gap-1">
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
