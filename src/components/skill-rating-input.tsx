'use client'

import { StarIcon } from 'lucide-react'

import {
  MAX_PLAYER_SKILL,
  MIN_PLAYER_SKILL,
  PLAYER_SKILL_STEP,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ISkillRatingInputProps {
  readonly value: number
  readonly onChange: (value: number) => void
}

export function SkillRatingInput({ value, onChange }: ISkillRatingInputProps) {
  const starCount = MAX_PLAYER_SKILL

  function handleStarClick(starIndex: number, isHalf: boolean): void {
    const nextValue = isHalf ? starIndex - 0.5 : starIndex
    const clamped = Math.min(
      MAX_PLAYER_SKILL,
      Math.max(MIN_PLAYER_SKILL, nextValue),
    )
    const stepped = Math.round(clamped / PLAYER_SKILL_STEP) * PLAYER_SKILL_STEP
    onChange(stepped)
  }

  return (
    <div className="flex flex-col gap-2">
      <fieldset className="flex items-center gap-1 border-0 p-0">
        <legend className="sr-only">Avaliação de habilidade</legend>
        {Array.from({ length: starCount }, (_, index) => {
          const starValue = index + 1
          const fillAmount = Math.min(1, Math.max(0, value - index))

          return (
            <div
              key={`skill-input-star-${starValue}`}
              className="relative size-8"
            >
              <button
                type="button"
                aria-label={`${starValue - 0.5} estrelas`}
                className="absolute inset-y-0 left-0 z-10 w-1/2"
                onClick={() => handleStarClick(starValue, true)}
              />
              <button
                type="button"
                aria-label={`${starValue} estrelas`}
                className="absolute inset-y-0 right-0 z-10 w-1/2"
                onClick={() => handleStarClick(starValue, false)}
              />
              <StarIcon className="size-8 text-muted-foreground/35" />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillAmount * 100}%` }}
              >
                <StarIcon className="size-8 fill-amber-400 text-amber-400" />
              </div>
            </div>
          )
        })}
      </fieldset>
      <p className="text-muted-foreground text-xs">
        {value.toFixed(1)} / {MAX_PLAYER_SKILL.toFixed(1)}
      </p>
    </div>
  )
}

interface ISkillStarsDisplayProps {
  readonly value: number
  readonly className?: string
}

export function SkillStarsDisplay({
  value,
  className,
}: ISkillStarsDisplayProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: MAX_PLAYER_SKILL }, (_, index) => {
        const starValue = index + 1
        const fillAmount = Math.min(1, Math.max(0, value - index))
        return (
          <div
            key={`skill-display-star-${starValue}`}
            className="relative size-3.5"
          >
            <StarIcon className="size-3.5 text-muted-foreground/30" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillAmount * 100}%` }}
            >
              <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        )
      })}
      <span className="ml-1 text-muted-foreground text-xs tabular-nums">
        {value.toFixed(1)}
      </span>
    </div>
  )
}
