'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';

interface ResetPasswordFormProps {
  locale: string;
}

export function ResetPasswordForm({ locale }: ResetPasswordFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has a valid session (from reset link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push(`/${locale}/forgot-password`);
      }
    });
  }, [router, locale, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError(t('AUTH25'));
      return;
    }
    if (password.length < 6) {
      setError(t('AUTH21'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('AUTH22'));
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || t('AUTH26'));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : t('AUTH26'));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <h1 className="text-3xl font-bold">{t('AUTH17')}</h1>
            <p className="mt-2 text-muted-foreground">{t('AUTH28')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('AUTH17')}</h1>
          <p className="mt-2 text-muted-foreground">{t('AUTH18')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="password">{t('AUTH19')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('AUTH19')}
                required
                disabled={loading}
                className="mt-1"
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">{t('AUTH5')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('AUTH5')}
                required
                disabled={loading}
                className="mt-1"
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('AUTH32') : t('AUTH20')}
          </Button>
        </form>
      </div>
    </div>
  );
}

