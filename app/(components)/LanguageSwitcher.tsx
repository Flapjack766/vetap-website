'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { Button } from './ui/button';

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();

  const switchLanguage = () => {
    const newLocale = currentLocale === 'en' ? 'ar' : 'en';
    
    // Replace the locale in the pathname
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    
    router.push(newPath);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLanguage}
      className="gap-2"
      aria-label={currentLocale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium">{currentLocale === 'en' ? 'AR' : 'EN'}</span>
    </Button>
  );
}

