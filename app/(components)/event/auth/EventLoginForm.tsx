'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { createEventClient } from '@/lib/supabase/event-client';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';

interface EventLoginFormProps {
  locale: string;
}

export function EventLoginForm({ locale }: EventLoginFormProps) {
  const t = useTranslations();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(!email ? t('EVENT_AUTH_EMAIL_REQUIRED') : t('EVENT_AUTH_PASSWORD_REQUIRED'));
      return;
    }

    setLoading(true);

    try {
      const supabase = createEventClient();
      
      console.log('🔐 Logging in:', email);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Login error:', signInError.message);
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setError(t('EVENT_AUTH_LOGIN_ERROR'));
        setLoading(false);
        return;
      }

      console.log('✅ Login successful:', data.user.id);

      // Check/create event_users record
      const { data: eventUser, error: userError } = await supabase
        .from('event_users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!eventUser && !userError?.message?.includes('does not exist')) {
        // Try to create user via API
        await fetch('/api/event/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            email: data.user.email,
            name: data.user.email,
          }),
        });
      }

      // Redirect to dashboard
      window.location.href = `/${locale}/event/dashboard`;
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(t('EVENT_AUTH_LOGIN_ERROR'));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('EVENT_APP_NAME')}</h1>
          <p className="mt-2 text-muted-foreground">{t('EVENT_AUTH_SIGN_IN_DESCRIPTION')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
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
            </div>

            <div>
              <Label htmlFor="password">{t('EVENT_AUTH_PASSWORD')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('EVENT_AUTH_PASSWORD_PLACEHOLDER')}
                required
                disabled={loading}
                className="mt-1"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href={`/${locale}/event/forgot-password`}
              className="text-sm text-primary hover:underline"
            >
              {t('EVENT_AUTH_FORGOT_PASSWORD')}
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('EVENT_AUTH_SIGNING_IN') : t('EVENT_AUTH_SIGN_IN')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t('EVENT_AUTH_NO_ACCOUNT')}{' '}
            <Link href={`/${locale}/event/signup`} className="font-medium text-primary hover:underline">
              {t('EVENT_AUTH_SIGN_UP')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
