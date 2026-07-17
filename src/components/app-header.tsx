import Image from 'next/image'

import logo from '@/assets/logo.png'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-border/60 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
        <Image
          src={logo}
          alt="Good Vôlei"
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-full object-cover"
          priority
        />
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
