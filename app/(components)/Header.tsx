'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check authentication status
    const checkUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push(`/${locale}`);
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { href: '/services', label: t('A3') }, // Services
    // { href: '/portfolio', label: t('A4') }, // Portfolio - مخفي مؤقتاً
    { href: '/about', label: t('A5') }, // About
    { href: '/contact', label: t('A6') }, // Contact
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="vetap-container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Image
            src="/icons/logo.png"
            alt="VETAP Logo"
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <span className="text-xl font-bold tracking-tight">VETAP</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-foreground/80"
            >
              {item.label}
            </Link>
          ))}
          <LanguageSwitcher />
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      {t('HEADER1')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        {t('HEADER2')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('HEADER3')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild size="sm">
                  <Link href={`/${locale}/signup`}>{t('HEADER4')}</Link>
                </Button>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-4 md:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={mobileMenuOpen ? t('A196') : t('A195')}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border md:hidden"
          >
            <div className="vetap-container space-y-1 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 space-y-2">
                {!loading && (
                  <>
                    {user ? (
                      <>
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/${locale}/dashboard`} onClick={() => setMobileMenuOpen(false)}>
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            {t('HEADER2')}
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {t('HEADER3')}
                        </Button>
                      </>
                    ) : (
                      <Button asChild className="w-full">
                        <Link href={`/${locale}/signup`} onClick={() => setMobileMenuOpen(false)}>
                          {t('HEADER4')}
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

