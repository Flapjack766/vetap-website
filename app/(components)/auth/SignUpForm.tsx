'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { generateUniqueRandomUsername } from '@/lib/supabase/utils';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';

interface SignUpFormProps {
  locale: string;
}

export function SignUpForm({ locale }: SignUpFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email) {
      setError(t('AUTH24'));
      return;
    }
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
      // Sign up user WITHOUT trigger dependency
      // We'll create profile manually after signup
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/dashboard`,
          // Disable automatic profile creation if trigger exists
          data: {
            skip_trigger: true,
          },
        },
      });

      if (signUpError) {
        console.error('Sign up error details:', signUpError);
        
        // More specific error messages
        if (signUpError.message?.includes('500') || signUpError.message?.includes('Internal Server Error') || signUpError.message?.includes('Database error')) {
          setError('Database configuration error. Please ensure Supabase tables are created. Check README_AUTH_SETUP.md for setup instructions.');
        } else if (signUpError.message?.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else if (signUpError.message?.includes('Password')) {
          setError(signUpError.message);
        } else {
          setError(signUpError.message || t('AUTH26'));
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Create profile manually (don't rely on trigger)
        // Generate unique random username (u + 10 chars)
        const randomUsername = await generateUniqueRandomUsername(supabase);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            email: authData.user.email,
            username_random: randomUsername,
            template_id: 1,
            links: {},
          });

        if (profileError) {
          // Check if error is actually meaningful (not just empty object)
          const hasRealError = profileError.message || 
                              profileError.code || 
                              (Object.keys(profileError).length > 0 && JSON.stringify(profileError) !== '{}');
          
          if (hasRealError) {
            console.error('Profile creation error:', profileError);
            
            // If profile creation fails, still allow user to proceed
            // They can complete profile setup later
            if (profileError.code === '23505') {
              // Unique constraint violation - username already exists, try again
              const retryUsername = await generateUniqueRandomUsername(supabase);
              const { error: retryError } = await supabase
                .from('profiles')
                .insert({
                  user_id: authData.user.id,
                  email: authData.user.email,
                  username_random: retryUsername,
                  template_id: 1,
                  links: {},
                });
              
              if (retryError && (retryError.message || retryError.code)) {
                console.error('Retry profile creation failed:', retryError);
                // Continue anyway - profile can be created later
              }
            } else if (profileError.message?.includes('relation "profiles" does not exist')) {
              setError('Database tables not found. Please run the SQL schema in Supabase. See README_AUTH_SETUP.md');
              setLoading(false);
              return;
            } else {
              // Other errors - log but continue
              console.warn('Profile creation warning:', profileError);
            }
          }
          // If error is empty object, assume it worked and continue
        }

        // Redirect to dashboard
        router.push(`/${locale}/dashboard`);
        router.refresh();
      }
    } catch (err) {
      console.error('Sign up error:', err);
      const errorMessage = err instanceof Error ? err.message : t('AUTH26');
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('AUTH1')}</h1>
          <p className="mt-2 text-muted-foreground">{t('AUTH2')}</p>
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
            {loading ? t('AUTH29') : t('AUTH1')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t('AUTH6')}{' '}
            <Link href={`/${locale}/login`} className="font-medium text-primary hover:underline">
              {t('AUTH7')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

