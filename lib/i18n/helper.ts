import { locales, type Locale } from './config';

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleFromPath(pathname: string): Locale | null {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && isValidLocale(firstSegment)) {
    return firstSegment;
  }
  
  return null;
}

export function removeLocaleFromPath(pathname: string, locale: Locale): string {
  return pathname.replace(`/${locale}`, '') || '/';
}

export function addLocaleToPath(pathname: string, locale: Locale): string {
  return `/${locale}${pathname}`;
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

