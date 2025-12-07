'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail, Key, Loader2, AlertCircle, Smartphone, Shield, Scan } from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';

interface GateStaffLoginProps {
  locale: string;
}

type LoginMode = 'email' | 'code';

export function GateStaffLogin({ locale }: GateStaffLoginProps) {
  const router = useRouter();
  const t = useTranslations();
  const isRTL = locale === 'ar';

  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gateCode, setGateCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('CHECKIN_FILL_ALL_FIELDS'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createEventClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!data.user) {
        throw new Error(t('CHECKIN_LOGIN_FAILED'));
      }

      // Verify user is gate_staff or higher
      const { data: userData, error: userError } = await supabase
        .from('event_users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        throw new Error(t('CHECKIN_USER_NOT_FOUND'));
      }

      const allowedRoles = ['owner', 'partner_admin', 'organizer', 'gate_staff'];
      if (!allowedRoles.includes(userData.role)) {
        throw new Error(t('CHECKIN_NO_PERMISSION'));
      }

      // Redirect to event selection
      router.push(`/${locale}/event/check-in/select`);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || t('CHECKIN_LOGIN_FAILED'));
    } finally {
      setLoading(false);
    }
  };

  const handleGateCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateCode) {
      setError(t('CHECKIN_ENTER_GATE_CODE'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verify gate code via API
      const response = await fetch('/api/event/gates/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: gateCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('CHECKIN_INVALID_GATE_CODE'));
      }

      // Store gate info in session storage
      sessionStorage.setItem('gate_session', JSON.stringify({
        gate_id: data.gate.id,
        gate_name: data.gate.name,
        event_id: data.gate.event_id,
        event_name: data.event.name,
      }));

      // Go directly to scanner
      router.push(`/${locale}/event/check-in/scan`);
    } catch (err: any) {
      console.error('Gate code error:', err);
      setError(err.message || t('CHECKIN_INVALID_GATE_CODE'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-16 inset-x-0 bottom-0 bg-background flex flex-col z-40 overflow-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 mb-6">
              <Scan className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('CHECKIN_TITLE')}
            </h1>
            <p className="text-muted-foreground">
              {t('CHECKIN_SUBTITLE')}
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-black/20 overflow-hidden">
            {/* Login Mode Tabs */}
            <div className="p-4 border-b border-border/50">
              <div className="flex bg-muted/50 rounded-xl p-1">
                <button
                  onClick={() => { setLoginMode('email'); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                    loginMode === 'email'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  {t('CHECKIN_EMAIL_LOGIN')}
                </button>
                <button
                  onClick={() => { setLoginMode('code'); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                    loginMode === 'code'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Key className="h-4 w-4" />
                  {t('CHECKIN_GATE_CODE')}
                </button>
              </div>
            </div>

            {/* Login Form */}
            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {loginMode === 'email' ? (
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('CHECKIN_EMAIL')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('CHECKIN_EMAIL_PLACEHOLDER')}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('CHECKIN_PASSWORD')}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('CHECKIN_PASSWORD_PLACEHOLDER')}
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      autoComplete="current-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className={isRTL ? 'mr-2' : 'ml-2'}>{t('CHECKIN_LOGGING_IN')}</span>
                      </>
                    ) : (
                      t('CHECKIN_LOGIN')
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleGateCodeLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('CHECKIN_GATE_CODE_LABEL')}
                    </label>
                    <input
                      type="text"
                      value={gateCode}
                      onChange={(e) => setGateCode(e.target.value.toUpperCase())}
                      placeholder={t('CHECKIN_GATE_CODE_PLACEHOLDER')}
                      className="w-full px-4 py-4 rounded-xl bg-muted/50 border border-border text-foreground text-center text-2xl font-mono tracking-[0.3em] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all uppercase"
                      maxLength={8}
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('CHECKIN_GATE_CODE_HINT')}
                  </p>
                  <Button
                    type="submit"
                    disabled={loading || gateCode.length < 4}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className={isRTL ? 'mr-2' : 'ml-2'}>{t('CHECKIN_VERIFYING')}</span>
                      </>
                    ) : (
                      t('CHECKIN_START_SCANNING')
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/30 border border-border/30">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Scan className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t('CHECKIN_FEATURE_FAST') || 'Fast Scanning'}</p>
                <p className="text-xs text-muted-foreground">{t('CHECKIN_FEATURE_FAST_DESC') || 'Quick QR detection'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/30 border border-border/30">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <Shield className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t('CHECKIN_FEATURE_SECURE') || 'Secure'}</p>
                <p className="text-xs text-muted-foreground">{t('CHECKIN_FEATURE_SECURE_DESC') || 'Verified check-ins'}</p>
              </div>
            </div>
          </div>

          {/* Mobile hint */}
          {/* Mobile hint */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
              <Smartphone className="h-4 w-4" />
              {t('CHECKIN_MOBILE_HINT')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

