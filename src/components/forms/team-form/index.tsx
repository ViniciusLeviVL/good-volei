'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { type ITeamFormSchema, teamFormSchema } from './schema'

interface ITeamFormProps {
  readonly defaultValues?: Partial<ITeamFormSchema>
  readonly submitLabel: string
  readonly onSubmit: (values: ITeamFormSchema) => void
  readonly onCancel?: () => void
}

export function TeamForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ITeamFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ITeamFormSchema>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
    },
  })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-name">Nome</Label>
        <Input
          id="team-name"
          placeholder="Nome do time"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name ? (
          <p className="text-destructive text-xs">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
