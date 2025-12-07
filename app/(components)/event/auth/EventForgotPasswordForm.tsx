'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { createEventClient } from '@/lib/supabase/event-client';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import { Mail, CheckCircle2 } from 'lucide-react';

interface EventForgotPasswordFormProps {
  locale: string;
}

export function EventForgotPasswordForm({ locale }: EventForgotPasswordFormProps) {
  const t = useTranslations();
  
  // CRITICAL: Use Event Supabase client (not main project client)
  const supabase = createEventClient();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError(t('EVENT_AUTH_EMAIL_REQUIRED'));
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/event/reset-password`,
      });

      if (resetError) {
        setError(resetError.message || t('EVENT_AUTH_RESET_ERROR'));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err instanceof Error ? err.message : t('EVENT_AUTH_RESET_ERROR'));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold">{t('EVENT_AUTH_RESET_SUCCESS_TITLE')}</h1>
            <p className="mt-2 text-muted-foreground">{t('EVENT_AUTH_RESET_SUCCESS_MESSAGE')}</p>
            <p className="text-sm text-muted-foreground">
              {t('EVENT_AUTH_RESET_SUCCESS_DETAILS')}
            </p>
          </div>
          <Link href={`/${locale}/event/login`}>
            <Button variant="outline" className="w-full">
              {t('EVENT_AUTH_BACK_TO_LOGIN')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('EVENT_APP_NAME')}</h1>
          <p className="mt-2 text-muted-foreground">{t('EVENT_AUTH_FORGOT_PASSWORD_DESCRIPTION')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="email">{t('EVENT_AUTH_EMAIL')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('EVENT_AUTH_EMAIL_PLACEHOLDER')}
              required
              disabled={loading}
              className="mt-1"
              autoComplete="email"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {t('EVENT_AUTH_FORGOT_PASSWORD_HELP')}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('EVENT_AUTH_SENDING') : t('EVENT_AUTH_SEND_RESET_LINK')}
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

