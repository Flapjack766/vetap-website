'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createEventClient } from '@/lib/supabase/event-client';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { CheckCircle2 } from 'lucide-react';

interface EventResetPasswordFormProps {
  locale: string;
}

export function EventResetPasswordForm({ locale }: EventResetPasswordFormProps) {
  const t = useTranslations();
  const router = useRouter();
  
  // CRITICAL: Use Event Supabase client (not main project client)
  const supabase = createEventClient();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if user has a valid session (from reset link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCheckingSession(false);
      if (!session) {
        router.push(`/${locale}/event/forgot-password`);
      }
    });
  }, [router, locale, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError(t('EVENT_AUTH_PASSWORD_REQUIRED'));
      return;
    }
    if (password.length < 6) {
      setError(t('EVENT_AUTH_PASSWORD_MIN_LENGTH'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('EVENT_AUTH_PASSWORD_MISMATCH'));
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || t('EVENT_AUTH_RESET_PASSWORD_ERROR'));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/event/login`);
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : t('EVENT_AUTH_RESET_PASSWORD_ERROR'));
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md text-center">
          <p className="text-muted-foreground">{t('EVENT_AUTH_CHECKING_SESSION')}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold">{t('EVENT_AUTH_RESET_PASSWORD_SUCCESS_TITLE')}</h1>
            <p className="mt-2 text-muted-foreground">{t('EVENT_AUTH_RESET_PASSWORD_SUCCESS_MESSAGE')}</p>
            <p className="text-sm text-muted-foreground">
              {t('EVENT_AUTH_REDIRECTING')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('EVENT_APP_NAME')}</h1>
          <p className="mt-2 text-muted-foreground">{t('EVENT_AUTH_RESET_PASSWORD_DESCRIPTION')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="password">{t('EVENT_AUTH_NEW_PASSWORD')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('EVENT_AUTH_NEW_PASSWORD_PLACEHOLDER')}
                required
                disabled={loading}
                className="mt-1"
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">{t('EVENT_AUTH_CONFIRM_PASSWORD')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('EVENT_AUTH_CONFIRM_PASSWORD_PLACEHOLDER')}
                required
                disabled={loading}
                className="mt-1"
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('EVENT_AUTH_UPDATING') : t('EVENT_AUTH_UPDATE_PASSWORD')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href={`/${locale}/event/login`} className="font-medium text-primary hover:underline">
              {t('EVENT_AUTH_BACK_TO_LOGIN')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

