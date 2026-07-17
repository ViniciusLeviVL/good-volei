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
import type { IPlayer } from '@/types'

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
      toast.success('Player added')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to add player.',
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
      toast.success('Player updated')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update player.',
      )
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-semibold text-base">Players</h2>
          <p className="text-muted-foreground text-xs">
            {players.length} registered
          </p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Add
        </Button>
      </div>

      {players.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No players yet"
          description="Add players with name, skill, and gender to start building balanced teams."
          action={
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              Add first player
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
                    <Badge variant="secondary" className="capitalize">
                      {player.gender}
                    </Badge>
                  </div>
                  <SkillStarsDisplay value={player.skill} />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Edit ${player.name}`}
                    onClick={() => setEditingPlayer(player)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Delete ${player.name}`}
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
            <DialogTitle>Add player</DialogTitle>
            <DialogDescription>
              Set skill from 0 to 5 stars in half-star steps.
            </DialogDescription>
          </DialogHeader>
          <PlayerForm
            submitLabel="Add player"
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
            <DialogTitle>Edit player</DialogTitle>
            <DialogDescription>
              Update name, skill, or gender for this player.
            </DialogDescription>
          </DialogHeader>
          {editingPlayer ? (
            <PlayerForm
              key={editingPlayer.id}
              submitLabel="Save changes"
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
        title="Delete player?"
        description={`This will remove ${deletingPlayer?.name ?? 'this player'} from all teams.`}
        onConfirm={() => {
          if (!deletingPlayer) {
            return
          }
          deletePlayer(deletingPlayer.id)
          toast.success('Player deleted')
        }}
      />
    </section>
  )
}
