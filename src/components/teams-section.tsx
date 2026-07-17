'use client'

import {
  LockIcon,
  LockOpenIcon,
  PencilIcon,
  PlusIcon,
  ShieldIcon,
  Trash2Icon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { EmptyState } from '@/components/empty-state'
import { TeamForm } from '@/components/forms/team-form'
import type { ITeamFormSchema } from '@/components/forms/team-form/schema'
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
import {
  calculateTeamStats,
  createPlayerMap,
  getTeamPlayers,
} from '@/lib/team-stats'
import { useTeamDrawStore } from '@/store/team-draw-store'
import type { ITeam } from '@/types'

export function TeamsSection() {
  const players = useTeamDrawStore((state) => state.players)
  const teams = useTeamDrawStore((state) => state.teams)
  const addTeam = useTeamDrawStore((state) => state.addTeam)
  const renameTeam = useTeamDrawStore((state) => state.renameTeam)
  const deleteTeam = useTeamDrawStore((state) => state.deleteTeam)
  const togglePlayerLock = useTeamDrawStore((state) => state.togglePlayerLock)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<ITeam | null>(null)
  const [deletingTeam, setDeletingTeam] = useState<ITeam | null>(null)

  const playerMap = useMemo(() => createPlayerMap(players), [players])

  function handleCreate(values: ITeamFormSchema): void {
    addTeam(values)
    setIsCreateOpen(false)
    toast.success('Team created')
  }

  function handleRename(values: ITeamFormSchema): void {
    if (!editingTeam) {
      return
    }
    renameTeam(editingTeam.id, values.name)
    setEditingTeam(null)
    toast.success('Team renamed')
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-semibold text-base">Teams</h2>
          <p className="text-muted-foreground text-xs">
            {teams.length} teams · lock players after a draw
          </p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Add
        </Button>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon={ShieldIcon}
          title="No teams yet"
          description="Create at least two teams, then draw to distribute players fairly."
          action={
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              Create first team
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {teams.map((team, index) => {
            const teamPlayers = getTeamPlayers(team, playerMap)
            const stats = calculateTeamStats(team, playerMap)

            return (
              <BlurFade key={team.id} delay={0.03 * index} inView>
                <article className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                  <div className="flex items-start justify-between gap-3 border-border/60 border-b px-3 py-2.5">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-medium text-sm">
                          {team.name}
                        </h3>
                        <Badge variant="outline">
                          {stats.playerCount} players
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
                        <span>Skill {stats.skillTotal.toFixed(1)}</span>
                        <span>Avg {stats.skillAverage.toFixed(1)}</span>
                        <span>
                          {stats.maleCount}M / {stats.femaleCount}F
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Rename ${team.name}`}
                        onClick={() => setEditingTeam(team)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Delete ${team.name}`}
                        onClick={() => setDeletingTeam(team)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>

                  {teamPlayers.length === 0 ? (
                    <p className="px-3 py-4 text-muted-foreground text-xs">
                      No players assigned yet. Run a draw to fill this team.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {teamPlayers.map((player) => {
                        const isLocked = team.lockedPlayerIds.includes(
                          player.id,
                        )

                        return (
                          <li
                            key={player.id}
                            className="flex items-center gap-2 px-3 py-2"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm">
                                  {player.name}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="capitalize"
                                >
                                  {player.gender}
                                </Badge>
                              </div>
                              <SkillStarsDisplay value={player.skill} />
                            </div>
                            <Button
                              size="icon-sm"
                              variant={isLocked ? 'secondary' : 'ghost'}
                              aria-label={
                                isLocked
                                  ? `Unlock ${player.name}`
                                  : `Lock ${player.name}`
                              }
                              onClick={() =>
                                togglePlayerLock(team.id, player.id)
                              }
                            >
                              {isLocked ? <LockIcon /> : <LockOpenIcon />}
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </article>
              </BlurFade>
            )
          })}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create team</DialogTitle>
            <DialogDescription>
              Give the team a name. You need at least two teams to draw.
            </DialogDescription>
          </DialogHeader>
          <TeamForm
            submitLabel="Create team"
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingTeam)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTeam(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename team</DialogTitle>
            <DialogDescription>
              Update the display name for this team.
            </DialogDescription>
          </DialogHeader>
          {editingTeam ? (
            <TeamForm
              key={editingTeam.id}
              submitLabel="Save name"
              defaultValues={{ name: editingTeam.name }}
              onCancel={() => setEditingTeam(null)}
              onSubmit={handleRename}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deletingTeam)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTeam(null)
          }
        }}
        title="Delete team?"
        description={`Players on ${deletingTeam?.name ?? 'this team'} will become unassigned.`}
        onConfirm={() => {
          if (!deletingTeam) {
            return
          }
          deleteTeam(deletingTeam.id)
          toast.success('Team deleted')
        }}
      />
    </section>
  )
}
