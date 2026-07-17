import { VolleyballIcon } from 'lucide-react'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-border/60 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <VolleyballIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-heading font-semibold text-lg tracking-tight">
            Good Vôlei
          </p>
          <p className="text-muted-foreground text-xs">
            Balanced team draws for your next match
          </p>
        </div>
      </div>
    </header>
  )
}
