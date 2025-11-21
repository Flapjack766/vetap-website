'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';

interface ForgotPasswordFormProps {
  locale: string;
}

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const t = useTranslations();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError(t('AUTH24'));
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message || t('AUTH26'));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err instanceof Error ? err.message : t('AUTH26'));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <h1 className="text-3xl font-bold">{t('AUTH13')}</h1>
            <p className="mt-2 text-muted-foreground">{t('AUTH27')}</p>
          </div>
          <Link href={`/${locale}/login`}>
            <Button variant="outline">{t('AUTH16')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('AUTH12')}</h1>
          <p className="mt-2 text-muted-foreground">{t('AUTH14')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('AUTH31') : t('AUTH15')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href={`/${locale}/login`} className="font-medium text-primary hover:underline">
              {t('AUTH16')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

