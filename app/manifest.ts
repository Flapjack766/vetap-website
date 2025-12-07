import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VETAP — Integrated Digital Solutions',
    short_name: 'VETAP',
    description: 'Comprehensive digital solutions including websites, NFC smart cards, and modern web technologies',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icons.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['business', 'technology', 'productivity'],
    lang: 'en',
    dir: 'ltr',
    scope: '/',
    id: '/',
    related_applications: [],
    prefer_related_applications: false,
  };
}

