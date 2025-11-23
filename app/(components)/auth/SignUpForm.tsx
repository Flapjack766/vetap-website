'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2 } from 'lucide-react';
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
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Suppress rate limit errors and empty profile creation errors in console
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const errorHandler = (...args: any[]) => {
      const errorString = String(args[0] || '');
      const errorMessage = errorString.toLowerCase();
      
      // Check if it's an empty object error (Profile creation error: {})
      const isProfileCreationError = errorString.includes('profile creation error') || 
                                     errorString.includes('profile creation');
      
      // Check if second argument is empty object
      const hasEmptyObjectArg = args.length > 1 && 
                                typeof args[1] === 'object' && 
                                args[1] !== null && 
                                Object.keys(args[1]).length === 0;
      
      // Check if error string contains empty object pattern
      const hasEmptyObjectPattern = errorString.includes(': {}') || 
                                    errorString.includes(':{}') ||
                                    (errorString.includes('{}') && isProfileCreationError);
      
      const isEmptyObjectError = isProfileCreationError && (hasEmptyObjectPattern || hasEmptyObjectArg);
      
      // Don't log rate limit errors or empty profile creation errors to console
      if (!errorMessage.includes('rate limit') && 
          !errorMessage.includes('email rate limit exceeded') &&
          !errorMessage.includes('security purposes') &&
          !errorMessage.includes('only request this after') &&
          !isEmptyObjectError) {
        originalError.apply(console, args);
      }
    };
    
    const warnHandler = (...args: any[]) => {
      const warnString = String(args[0] || '');
      const warnMessage = warnString.toLowerCase();
      
      // Check if it's an empty object warning
      const isEmptyObjectWarning = warnString.includes('profile creation') && 
                                    (warnString.includes(': {}') || warnString.includes(':{}'));
      
      // Don't log rate limit warnings or empty profile creation warnings to console
      if (!warnMessage.includes('rate limit') && 
          !warnMessage.includes('email rate limit exceeded') &&
          !warnMessage.includes('security purposes') &&
          !isEmptyObjectWarning) {
        originalWarn.apply(console, args);
      }
    };

    console.error = errorHandler;
    console.warn = warnHandler;

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      setError(null);
    }
  }, [countdown]);

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
        // Get error message
        const errorMessage = signUpError.message || String(signUpError);
        const errorMessageLower = errorMessage.toLowerCase();
        
        // More specific error messages
        if (errorMessageLower.includes('500') || errorMessageLower.includes('internal server error') || errorMessageLower.includes('database error')) {
          console.error('Sign up error details:', signUpError);
          setError('Database configuration error. Please ensure Supabase tables are created. Check README_AUTH_SETUP.md for setup instructions.');
        } else if (errorMessageLower.includes('already registered') || errorMessageLower.includes('already exists') || errorMessageLower.includes('user already registered')) {
          setError(t('AUTH40'));
        } else if (errorMessageLower.includes('password')) {
          setError(errorMessage);
        } else if (errorMessageLower.includes('email rate limit') || errorMessageLower.includes('rate limit exceeded') || errorMessageLower.includes('too many emails')) {
          // Email rate limit exceeded - show user-friendly message with countdown
          setError(t('AUTH42'));
          // Start countdown (typically 60 seconds for email rate limit)
          setCountdown(60);
        } else if (errorMessageLower.includes('security purposes') || errorMessageLower.includes('only request this after') || errorMessageLower.includes('rate limit') || errorMessageLower.includes('too many requests')) {
          // Extract seconds from error message if available (no console.error for rate limits)
          const secondsMatch = errorMessage.match(/(\d+)\s*seconds?/i);
          const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 30;
          setError(t('AUTH41', { seconds: String(seconds) }));
          // Start countdown
          setCountdown(seconds);
        } else {
          // Only log unexpected errors
          console.error('Sign up error details:', signUpError);
          setError(errorMessage || t('AUTH26'));
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Check if profile already exists for this user
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        // If profile doesn't exist, create one
        if (!existingProfile) {
          // Create profile manually (don't rely on trigger)
          // Generate unique random username (u + 10 chars)
          const randomUsername = await generateUniqueRandomUsername(supabase);
          
          const { error: profileError, data: profileData } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              email: authData.user.email,
              username_random: randomUsername,
              template_id: 1,
              links: {},
            })
            .select();

          // Link account to visitor analytics
          if (profileData && profileData[0]) {
            try {
              const sessionId = sessionStorage.getItem('analytics_session_id');
              await fetch('/api/analytics/link-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: authData.user.id,
                  profile_id: profileData[0].id,
                  session_id: sessionId || undefined,
                  action: 'signup',
                }),
              });
            } catch (err) {
              // Silently fail - analytics linking shouldn't block signup
              console.error('Error linking account to analytics:', err);
            }
          }

          // Helper function to check if error is actually meaningful
          const isRealError = (error: any): boolean => {
            if (!error) return false;
            
            // Check if error is empty object
            const errorString = JSON.stringify(error);
            if (errorString === '{}' || errorString === 'null' || errorString === '""') return false;
            
            // Check if error has no properties
            if (typeof error === 'object' && error !== null && Object.keys(error).length === 0) {
              return false;
            }
            
            // Check if error is just an empty object with no meaningful content
            try {
              const stringified = JSON.stringify(error);
              if (stringified === '{}' || stringified === 'null' || stringified === '""') {
                return false;
              }
            } catch {
              // If stringify fails, it might be a real error
            }
            
            // Check if error has meaningful properties
            const hasMessage = error?.message && typeof error.message === 'string' && error.message.trim().length > 0;
            const hasCode = error?.code && typeof error.code === 'string' && error.code.trim().length > 0;
            const hasDetails = error?.details && typeof error.details === 'string' && error.details.trim().length > 0;
            const hasHint = error?.hint && typeof error.hint === 'string' && error.hint.trim().length > 0;
            
            return hasMessage || hasCode || hasDetails || hasHint;
          };

          // If data was returned, operation succeeded (ignore error object completely)
          if (profileData && Array.isArray(profileData) && profileData.length > 0) {
            // Profile created successfully, continue silently
          } else if (profileError) {
            // Check if it's a real error (not empty object)
            const isReal = isRealError(profileError);
            
            if (isReal) {
              // Only process if it's a real error (not empty object)
              // If profile creation fails, still allow user to proceed
              // They can complete profile setup later
              if (profileError.code === '23505') {
                // Unique constraint violation - username already exists, try again
                const retryUsername = await generateUniqueRandomUsername(supabase);
                const { error: retryError, data: retryData } = await supabase
                  .from('profiles')
                  .insert({
                    user_id: authData.user.id,
                    email: authData.user.email,
                    username_random: retryUsername,
                    template_id: 1,
                    links: {},
                  })
                  .select();
                
                // If retry data was returned, operation succeeded
                if (retryData && Array.isArray(retryData) && retryData.length > 0) {
                  // Retry succeeded, continue silently
                } else if (retryError && isRealError(retryError)) {
                  // Only log if it's a real error
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
            // If error is empty object, ignore it completely (no console.error)
          }
          // If error is empty object or data was returned, assume it worked and continue (no console.error)
        }
        // If profile already exists or was created successfully, show success message
        // Show success message instead of redirecting
        setSuccess(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Sign up error:', err);
      const errorMessage = err instanceof Error ? err.message : t('AUTH26');
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold">{t('AUTH33')}</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {t('AUTH34')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('AUTH35')}
            </p>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('AUTH36')}</p>
              <p className="text-sm text-muted-foreground">{t('AUTH37')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-center text-sm font-medium">{t('AUTH38')}</p>
            <Button
              onClick={() => router.push(`/${locale}/login`)}
              className="w-full"
              variant="default"
            >
              {t('AUTH7')}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t('AUTH39')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('AUTH1')}</h1>
          <p className="mt-2 text-muted-foreground">{t('AUTH2')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive space-y-2">
              <div>{error}</div>
              {countdown !== null && countdown > 0 && (
                <div className="text-xs font-medium opacity-80">
                  {t('AUTH43', { seconds: countdown })}
                </div>
              )}
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

