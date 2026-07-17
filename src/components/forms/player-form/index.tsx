'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { SkillRatingInput } from '@/components/skill-rating-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { PlayerGender } from '@/types'

import { type IPlayerFormSchema, playerFormSchema } from './schema'

interface IPlayerFormProps {
  readonly defaultValues?: Partial<IPlayerFormSchema>
  readonly submitLabel: string
  readonly onSubmit: (values: IPlayerFormSchema) => void
  readonly onCancel?: () => void
  readonly existingNames: readonly string[]
  readonly excludeName?: string
}

const GENDER_OPTIONS: { value: PlayerGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export function PlayerForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
  existingNames,
  excludeName,
}: IPlayerFormProps) {
  const form = useForm<IPlayerFormSchema>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      skill: defaultValues?.skill ?? 3,
      gender: defaultValues?.gender ?? 'male',
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = form

  const skill = watch('skill')
  const gender = watch('gender')

  function handleFormSubmit(values: IPlayerFormSchema): void {
    const normalizedName = values.name.trim().toLowerCase()
    const isDuplicate = existingNames.some((name) => {
      if (
        excludeName &&
        name.trim().toLowerCase() === excludeName.trim().toLowerCase()
      ) {
        return false
      }
      return name.trim().toLowerCase() === normalizedName
    })

    if (isDuplicate) {
      setError('name', {
        type: 'manual',
        message: 'A player with this name already exists.',
      })
      return
    }

    onSubmit(values)
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="player-name">Name</Label>
        <Input
          id="player-name"
          placeholder="Player name"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name ? (
          <p className="text-destructive text-xs">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Skill</Label>
        <SkillRatingInput
          value={skill}
          onChange={(value) =>
            setValue('skill', value, { shouldValidate: true })
          }
        />
        {errors.skill ? (
          <p className="text-destructive text-xs">{errors.skill.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Gender</Label>
        <div className="grid grid-cols-2 gap-2">
          {GENDER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                'h-9 rounded-lg border font-medium text-sm transition-colors',
                gender === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted',
              )}
              onClick={() =>
                setValue('gender', option.value, { shouldValidate: true })
              }
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.gender ? (
          <p className="text-destructive text-xs">{errors.gender.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
