'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { createEventClient } from '@/lib/supabase/event-client';
import { Button } from '@/app/(components)/ui/button';
import { Input } from '@/app/(components)/ui/input';
import { Label } from '@/app/(components)/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countries, getCountryName, type Country } from '@/lib/event/countries';

interface EventSignUpFormProps {
  locale: string;
}

export function EventSignUpForm({ locale }: EventSignUpFormProps) {
  const t = useTranslations();
  const currentLocale = useLocale();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name || name.trim().length < 2) {
      setError(t('EVENT_AUTH_NAME_REQUIRED'));
      return;
    }
    if (!email) {
      setError(t('EVENT_AUTH_EMAIL_REQUIRED'));
      return;
    }
    if (!phone || phone.trim().length < 5) {
      setError(t('EVENT_AUTH_PHONE_REQUIRED'));
      return;
    }
    if (!selectedCountry) {
      setError(t('EVENT_AUTH_COUNTRY_REQUIRED'));
      return;
    }
    if (!city || city.trim().length < 2) {
      setError(t('EVENT_AUTH_CITY_REQUIRED'));
      return;
    }
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
      // CRITICAL: Create Event Supabase client (not main project client)
      const supabase = createEventClient();
      
      // Verify we're using Event client
      if ((supabase as any)._isEventClient !== true) {
        console.error('❌ ERROR: Supabase client is not Event client!');
        setError('Configuration error: Supabase client mismatch');
        setLoading(false);
        return;
      }

      // Verify Supabase client is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase Event environment variables');
        setError(t('EVENT_AUTH_CONFIG_ERROR'));
        setLoading(false);
        return;
      }

      console.log('🔍 Attempting signup with:', {
        email,
        supabaseUrl: supabaseUrl,
        supabaseUrlPreview: supabaseUrl.substring(0, 50) + '...',
        hasAnonKey: !!supabaseAnonKey,
        anonKeyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING',
        isEventClient: (supabase as any)._isEventClient,
      });

      // CRITICAL: Verify we're using Event Supabase, not main project
      const mainUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (mainUrl && mainUrl === supabaseUrl) {
        console.error('❌ CRITICAL ERROR: Using main Supabase URL instead of Event URL!');
        console.error('   Main URL:', mainUrl);
        console.error('   Event URL should be different!');
        console.error('   Check .env.local - you may have copied main project keys');
        setError('Configuration error: Using wrong Supabase project. Check .env.local');
        setLoading(false);
        return;
      }
      
      console.log('✅ Verified: Using Event Supabase (not main project)');
      console.log('   Event URL:', supabaseUrl);
      if (mainUrl) {
        console.log('   Main URL (should be different):', mainUrl);
      }

      // Verify the client is actually using Event Supabase
      const clientUrl = (supabase as any)._supabaseUrl || (supabase as any)._eventUrl || 'unknown';
      const expectedUrl = supabaseUrl;
      
      console.log('📤 Sending signup request to Supabase Event...');
      console.log('🔍 Client URL verification:', {
        clientUrl: clientUrl,
        expectedUrl: expectedUrl,
        matches: clientUrl === expectedUrl || clientUrl.includes(expectedUrl.split('.')[0]),
      });
      
      if (clientUrl !== 'unknown' && !clientUrl.includes(expectedUrl.split('.')[0])) {
        console.error('❌ CRITICAL: Client URL does not match Event URL!');
        console.error('   Client URL:', clientUrl);
        console.error('   Expected Event URL:', expectedUrl);
        setError('Configuration error: Supabase client URL mismatch');
        setLoading(false);
        return;
      }
      
      // Sign up user
      // Note: We'll create event_users manually after signup (like VETAP main)
      // This provides better error handling and fallback if trigger fails
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/event/dashboard`,
          data: {
            name: name.trim(),
            phone: phone.trim(),
            phone_country_code: selectedCountry.phoneCode,
            country: selectedCountry.name,
            city: city.trim(),
            skip_trigger: true, // Skip trigger, we'll create event_users manually
          },
        },
      });
      
      // CRITICAL: Log the actual request details
      console.log('📧 Signup request sent to:', {
        url: expectedUrl,
        email: email,
        hasRedirect: true,
        redirectTo: `${window.location.origin}/${locale}/event/dashboard`,
      });

      console.log('Signup response:', {
        hasUser: !!authData?.user,
        userId: authData?.user?.id,
        email: authData?.user?.email,
        error: signUpError ? {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name,
        } : null,
      });

      if (signUpError) {
        console.error('Signup error details:', {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name,
          stack: signUpError.stack,
        });
        
        const errorMessage = signUpError.message || t('EVENT_AUTH_SIGNUP_ERROR');
        const errorMessageLower = errorMessage.toLowerCase();
        
        if (errorMessageLower.includes('already registered') || 
            errorMessageLower.includes('already exists') || 
            errorMessageLower.includes('user already registered')) {
          setError(t('EVENT_AUTH_EMAIL_EXISTS'));
        } else if (errorMessageLower.includes('email rate limit') || 
                   errorMessageLower.includes('rate limit exceeded')) {
          setError(t('EVENT_AUTH_RATE_LIMIT'));
        } else if (errorMessageLower.includes('invalid') && errorMessageLower.includes('url')) {
          setError(t('EVENT_AUTH_INVALID_CONFIG'));
        } else {
          setError(`${t('EVENT_AUTH_SIGNUP_ERROR')}: ${errorMessage}`);
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        console.log('✅ User created successfully in Supabase:', {
          id: authData.user.id,
          email: authData.user.email,
          emailConfirmed: authData.user.email_confirmed_at,
          createdAt: authData.user.created_at,
          rawUserMetaData: authData.user.user_metadata,
        });

        // Check if email confirmation was sent
        if (!authData.user.email_confirmed_at) {
          console.log('📧 Email confirmation should be sent by Supabase automatically');
          console.log('⚠️ If email not received, check:');
          console.log('   1. Supabase Dashboard → Authentication → Settings → Email Auth');
          console.log('   2. "Enable email confirmations" must be ON');
          console.log('   3. Check Spam folder');
          console.log('   4. Check Supabase Dashboard → Authentication → Users → check user status');
        }

        // CRITICAL: Get session after signup to ensure auth.uid() works in RLS
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.warn('⚠️ No session after signup, waiting for trigger...');
          console.warn('   This is normal if email confirmation is required');
        } else {
          console.log('✅ Session obtained after signup:', {
            userId: session.user.id,
            accessToken: session.access_token ? 'Present' : 'Missing',
          });
        }
        
        // Wait a moment for trigger to complete, then verify
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // CRITICAL: Verify client URL before querying
        const clientUrl = (supabase as any)._supabaseUrl || (supabase as any)._eventUrl;
        const expectedUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
        console.log('🔍 Before querying event_users:');
        console.log('   Client URL:', clientUrl);
        console.log('   Expected Event URL:', expectedUrl);
        console.log('   Client isEventClient:', (supabase as any)._isEventClient);
        
        if (clientUrl !== expectedUrl) {
          console.error('❌ CRITICAL: Client URL mismatch!');
          console.error('   Client URL:', clientUrl);
          console.error('   Expected:', expectedUrl);
          setError('Configuration error: Supabase client URL mismatch. Please refresh the page.');
          setLoading(false);
          return;
        }
        
        // Check if event_users record exists (from trigger)
        console.log('📊 Querying event_users from Event Supabase:', expectedUrl);
        const { data: existingEventUser, error: checkError } = await supabase
          .from('event_users')
          .select('id, email, name, phone, country, city, created_at')
          .eq('id', authData.user.id)
          .maybeSingle();

        console.log('📊 Event user check (from trigger):', {
          found: !!existingEventUser,
          data: existingEventUser,
          error: checkError ? {
            message: checkError.message,
            code: checkError.code,
            details: checkError.details,
          } : null,
        });

        // If event_users doesn't exist, create it manually (fallback)
        if (!existingEventUser) {
          console.log('⚠️ Event user not found - creating manually (fallback)...');
          
          // Check if error is because table doesn't exist
          if (checkError && (
            checkError.message?.includes('does not exist') ||
            checkError.code === '42P01' ||
            checkError.message?.includes('relation "event_users"')
          )) {
            console.error('❌ CRITICAL: event_users table does not exist!');
            console.error('   Please run migrations in Supabase SQL Editor');
            console.error('   File: supabase/migrations/ALL_VETAP_EVENT_MIGRATIONS.sql');
            setError('Database tables not found. Please run migrations in Supabase. See documentation.');
            setLoading(false);
            return;
          }

          // Try to create event_users manually (fallback if trigger failed)
          console.log('📝 Attempting to create event_users manually...');
          
          // CRITICAL: Get fresh session before insert to ensure auth.uid() works
          const { data: { session: insertSession }, error: insertSessionError } = await supabase.auth.getSession();
          
          if (insertSessionError || !insertSession) {
            console.warn('⚠️ No session available for manual insert');
            console.warn('   This is normal if email confirmation is required');
            console.warn('   Trying to create via API route with service role key...');
            
            // Try to create via API route (uses service role key, bypasses RLS)
            try {
              const apiResponse = await fetch('/api/event/users/create', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: authData.user.id,
                  email: authData.user.email,
                  name: name.trim(),
                  phone: phone.trim() || null,
                  phone_country_code: selectedCountry?.phoneCode || null,
                  country: selectedCountry?.name || null,
                  city: city.trim() || null,
                }),
              });

              const apiData = await apiResponse.json();

              if (apiResponse.ok && apiData.success) {
                console.log('✅ Event user created via API route:', apiData.user);
                // Continue with success flow
                setSuccess(true);
                setLoading(false);
                return;
              } else {
                console.error('❌ API route failed:', apiData);
                // Continue to show success message anyway (user exists in auth.users)
                console.warn('⚠️ Could not create event_users via API, but user exists in auth.users');
              }
            } catch (apiError) {
              console.error('❌ API route error:', apiError);
              // Continue to show success message anyway (user exists in auth.users)
              console.warn('⚠️ Could not create event_users via API, but user exists in auth.users');
            }
            
            // Show success message anyway (user exists in auth.users, trigger or API will handle event_users)
            setSuccess(true);
            setLoading(false);
            return;
          }
          
          console.log('✅ Session available for manual insert:', {
            userId: insertSession.user.id,
            matchesInsertId: insertSession.user.id === authData.user.id,
          });
          
          // CRITICAL: Verify client URL again before insert
          const insertClientUrl = (supabase as any)._supabaseUrl || (supabase as any)._eventUrl;
          const insertExpectedUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
          console.log('🔍 Before inserting event_users:');
          console.log('   Client URL:', insertClientUrl);
          console.log('   Expected Event URL:', insertExpectedUrl);
          console.log('   Session User ID:', insertSession.user.id);
          console.log('   Insert User ID:', authData.user.id);
          console.log('   IDs match:', insertSession.user.id === authData.user.id);
          
          if (insertClientUrl !== insertExpectedUrl) {
            console.error('❌ CRITICAL: Client URL mismatch before insert!');
            console.error('   Client URL:', insertClientUrl);
            console.error('   Expected:', insertExpectedUrl);
            setError('Configuration error: Supabase client URL mismatch. Please refresh the page.');
            setLoading(false);
            return;
          }
          
          if (insertSession.user.id !== authData.user.id) {
            console.error('❌ CRITICAL: Session user ID does not match signup user ID!');
            console.error('   Session User ID:', insertSession.user.id);
            console.error('   Signup User ID:', authData.user.id);
            setError('Session mismatch. Please try again.');
            setLoading(false);
            return;
          }
          
          console.log('📝 Data to insert:', {
            id: authData.user.id,
            email: authData.user.email,
            name: name.trim(),
            phone: phone.trim() || null,
            phone_country_code: selectedCountry?.phoneCode || null,
            country: selectedCountry?.name || null,
            city: city.trim() || null,
            role: 'organizer',
            partner_id: null,
          });
          console.log('📝 Inserting to Event Supabase with session:', insertExpectedUrl);

          const { data: newEventUser, error: createError } = await supabase
            .from('event_users')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              name: name.trim(),
              phone: phone.trim() || null,
              phone_country_code: selectedCountry?.phoneCode || null,
              country: selectedCountry?.name || null,
              city: city.trim() || null,
              role: 'organizer', // Default role
              partner_id: null, // Will be set by admin later
            })
            .select('id, email, name, phone, country, city, created_at')
            .single();

          if (createError) {
            // Log full error details
            const errorDetails = {
              message: createError.message || 'No message',
              code: createError.code || 'No code',
              details: createError.details || 'No details',
              hint: createError.hint || 'No hint',
              name: (createError as any).name || 'Unknown',
              status: (createError as any).status || 'No status',
            };
            
            console.error('❌ Failed to create event_users manually:');
            console.error('   Full error object:', createError);
            console.error('   Error details:', errorDetails);
            console.error('   Error type:', typeof createError);
            console.error('   Error keys:', Object.keys(createError));
            
            // Try to stringify the error
            try {
              console.error('   Error JSON:', JSON.stringify(createError, null, 2));
            } catch (e) {
              console.error('   Could not stringify error:', e);
            }
            
            // Check if it's a table doesn't exist error
            const errorMessage = String(createError.message || '');
            const errorCode = String(createError.code || '');
            
            if (errorMessage.includes('does not exist') || errorCode === '42P01' || errorMessage.includes('relation "event_users"')) {
              console.error('❌ CRITICAL: event_users table does not exist!');
              console.error('   Please run migrations in Supabase SQL Editor');
              console.error('   File: supabase/migrations/ALL_VETAP_EVENT_MIGRATIONS.sql');
              setError('Database tables not found. Please run migrations in Supabase SQL Editor. See documentation.');
              setLoading(false);
              return;
            }

            // Check if it's an RLS (Row Level Security) error
            if (errorCode === '42501' || 
                errorMessage.includes('permission denied') || 
                errorMessage.includes('new row violates row-level security') ||
                errorMessage.includes('row-level security policy')) {
              console.error('❌ RLS Error: Permission denied to insert into event_users');
              console.error('   Error code:', errorCode);
              console.error('   Error message:', errorMessage);
              console.error('   This might be because RLS policies are too restrictive');
              console.error('   SOLUTION: Run this SQL in Supabase SQL Editor:');
              console.error(`
DROP POLICY IF EXISTS "Users can insert own record" ON event_users;
CREATE POLICY "Users can insert own record" ON event_users
  FOR INSERT
  WITH CHECK (id = auth.uid());
              `);
              setError('Permission denied. Please run the RLS policy fix in Supabase SQL Editor. See console for SQL.');
              setLoading(false);
              return;
            }

            // Check if it's a unique constraint violation (user already exists)
            if (errorCode === '23505' || 
                errorMessage.includes('duplicate key') || 
                errorMessage.includes('unique constraint') ||
                errorMessage.includes('already exists')) {
              console.warn('⚠️ User already exists in event_users (duplicate key)');
              console.warn('   This is OK - the trigger might have created it');
              // Continue - user exists
            } else {
              // Other errors - log but continue (user exists in auth.users)
              console.warn('⚠️ Could not create event_users, but user exists in auth.users');
              console.warn('   Unknown error - continuing anyway');
              console.warn('   Error details:', errorDetails);
            }
          } else if (newEventUser) {
            console.log('✅ Event user created manually (fallback):', newEventUser);
          }
        } else {
          console.log('✅ Event user created successfully by trigger:', existingEventUser);
        }

        // Supabase will send confirmation email automatically
        // Show success message
        setSuccess(true);
        setLoading(false);
      } else {
        console.error('❌ No user returned from signup');
        console.error('This means Supabase did not create the user');
        setError(t('EVENT_AUTH_SIGNUP_ERROR'));
        setLoading(false);
      }
    } catch (err) {
      console.error('Sign up exception:', err);
      setError(err instanceof Error ? err.message : t('EVENT_AUTH_SIGNUP_ERROR'));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold">{t('EVENT_AUTH_SIGNUP_SUCCESS_TITLE')}</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {t('EVENT_AUTH_SIGNUP_SUCCESS_MESSAGE')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('EVENT_AUTH_SIGNUP_SUCCESS_DETAILS')}
            </p>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('EVENT_AUTH_CHECK_EMAIL')}</p>
              <p className="text-sm text-muted-foreground">{t('EVENT_AUTH_VERIFY_EMAIL_MESSAGE')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-center text-sm font-medium">{t('EVENT_AUTH_ALREADY_VERIFIED')}</p>
            <Button
              onClick={() => router.push(`/${locale}/event/login`)}
              className="w-full"
              variant="default"
            >
              {t('EVENT_AUTH_SIGN_IN')}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t('EVENT_AUTH_RESEND_EMAIL')}
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
          <p className="mt-2 text-muted-foreground">{t('EVENT_AUTH_SIGNUP_DESCRIPTION')}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('EVENT_AUTH_NAME')}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('EVENT_AUTH_NAME_PLACEHOLDER')}
                required
                disabled={loading}
                className="mt-1"
                minLength={2}
                autoComplete="name"
              />
            </div>

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
              <Label htmlFor="country">{t('EVENT_AUTH_COUNTRY')}</Label>
              <Select
                value={selectedCountry?.code || ''}
                onValueChange={(value) => {
                  const country = countries.find(c => c.code === value);
                  setSelectedCountry(country || null);
                }}
                disabled={loading}
                required
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('EVENT_AUTH_COUNTRY_PLACEHOLDER')} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{getCountryName(country, currentLocale)}</span>
                        <span className="text-muted-foreground">({country.phoneCode})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">{t('EVENT_AUTH_CITY')}</Label>
              <Input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('EVENT_AUTH_CITY_PLACEHOLDER')}
                required
                disabled={loading}
                className="mt-1"
                minLength={2}
                autoComplete="address-level2"
              />
            </div>

            <div>
              <Label htmlFor="phone">{t('EVENT_AUTH_PHONE')}</Label>
              <div className="mt-1 flex gap-2">
                <div className="w-32">
                  <Input
                    type="text"
                    value={selectedCountry?.phoneCode || ''}
                    disabled
                    className="bg-muted"
                    readOnly
                  />
                </div>
                <div className="flex-1">
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '');
                      setPhone(value);
                    }}
                    placeholder={t('EVENT_AUTH_PHONE_PLACEHOLDER')}
                    required
                    disabled={loading || !selectedCountry}
                    autoComplete="tel"
                  />
                </div>
              </div>
              {!selectedCountry && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('EVENT_AUTH_SELECT_COUNTRY_FIRST')}
                </p>
              )}
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
            {loading ? t('EVENT_AUTH_SIGNING_UP') : t('EVENT_AUTH_SIGN_UP')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t('EVENT_AUTH_ALREADY_HAVE_ACCOUNT')}{' '}
            <Link href={`/${locale}/event/login`} className="font-medium text-primary hover:underline">
              {t('EVENT_AUTH_SIGN_IN')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

