'use client'

import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from 'canvas-confetti'
import confetti from 'canvas-confetti'
import type {
  ComponentProps,
  ComponentPropsWithRef,
  MouseEvent,
  ReactNode,
} from 'react'
import {
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'

import { Button } from '@/components/ui/button'

type Api = {
  fire: (options?: ConfettiOptions) => void
}

type Props = ComponentPropsWithRef<'canvas'> & {
  options?: ConfettiOptions
  globalOptions?: ConfettiGlobalOptions
  manualstart?: boolean
  children?: ReactNode
}

export type ConfettiRef = Api | null

const ConfettiContext = createContext<Api>({} as Api)

/**
 * Magic UI Confetti — wraps canvas-confetti for imperative or auto-fire usage.
 */
const Confetti = forwardRef<ConfettiRef, Props>((props, ref) => {
  const {
    options,
    globalOptions = { resize: true, useWorker: true },
    manualstart = false,
    children,
    ...rest
  } = props
  const instanceRef = useRef<ConfettiInstance | null>(null)

  const canvasRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node !== null) {
        if (instanceRef.current) return
        instanceRef.current = confetti.create(node, {
          ...globalOptions,
          resize: true,
        })
        return
      }
      if (instanceRef.current) {
        instanceRef.current.reset()
        instanceRef.current = null
      }
    },
    [globalOptions],
  )

  const fire = useCallback(
    (opts: ConfettiOptions = {}) => {
      void instanceRef.current?.({ ...options, ...opts })
    },
    [options],
  )

  const api = useMemo(
    () => ({
      fire,
    }),
    [fire],
  )

  useImperativeHandle(ref, () => api, [api])

  useEffect(() => {
    if (!manualstart) fire()
  }, [manualstart, fire])

  return (
    <ConfettiContext.Provider value={api}>
      <canvas ref={canvasRef} {...rest} />
      {children}
    </ConfettiContext.Provider>
  )
})

Confetti.displayName = 'Confetti'

interface ConfettiButtonProps extends ComponentProps<'button'> {
  options?: ConfettiOptions &
    ConfettiGlobalOptions & { canvas?: HTMLCanvasElement }
  children?: ReactNode
}

function ConfettiButton({ options, children, ...props }: ConfettiButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (rect.left + rect.width / 2) / window.innerWidth
    const y = (rect.top + rect.height / 2) / window.innerHeight
    void confetti({
      ...options,
      origin: { x, y },
    })
  }

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  )
}

export { Confetti, ConfettiButton }

/**
 * Fires a subtle confetti burst from the bottom center of the viewport.
 */
export function fireBottomConfetti(): void {
  void confetti({
    particleCount: 50,
    spread: 60,
    startVelocity: 35,
    gravity: 0.9,
    ticks: 120,
    origin: { x: 0.5, y: 1 },
  })
}
