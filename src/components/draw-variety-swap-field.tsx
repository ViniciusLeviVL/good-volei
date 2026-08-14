'use client'

import type { ChangeEvent } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface IDrawVarietySwapFieldProps {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly onChange: (value: number) => void
}

export function DrawVarietySwapField({
  id,
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: IDrawVarietySwapFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const nextValue = event.target.valueAsNumber
    if (!Number.isFinite(nextValue)) {
      return
    }
    onChange(nextValue)
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode={step < 1 ? 'decimal' : 'numeric'}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
      />
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  )
}
