'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError(t('AUTH24'));
      return;
    }
    if (!password) {
      setError(t('AUTH25'));
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || t('AUTH26'));
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : t('AUTH26'));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('AUTH8')}</h1>
          <p className="mt-2 text-muted-foreground">{t('AUTH9')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">{t('AUTH3')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('AUTH3')}
                required
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">{t('AUTH4')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('AUTH4')}
                required
                disabled={loading}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm text-primary hover:underline"
            >
              {t('AUTH12')}
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('AUTH30') : t('AUTH8')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t('AUTH10')}{' '}
            <Link href={`/${locale}/signup`} className="font-medium text-primary hover:underline">
              {t('AUTH11')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

