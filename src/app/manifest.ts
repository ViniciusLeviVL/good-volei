import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Good Vôlei | Sorteio de Times',
    short_name: 'Good Vôlei',
    description:
      'Cadastre jogadores e times e sorteie equipes de vôlei equilibradas, tudo localmente.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5fbf8',
    theme_color: '#1f8a72',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
