'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { QrCode, Mail, Key, Loader2, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';

interface GateStaffLoginProps {
  locale: string;
}

type LoginMode = 'email' | 'code';

export function GateStaffLogin({ locale }: GateStaffLoginProps) {
  const router = useRouter();
  const t = useTranslations();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 mb-4">
          <QrCode className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('CHECKIN_TITLE')}</h1>
        <p className="text-slate-400 mt-1">{t('CHECKIN_SUBTITLE')}</p>
      </div>

      {/* Login Mode Tabs */}
      <div className="px-6 mb-4">
        <div className="flex bg-slate-800/50 rounded-xl p-1">
          <button
            onClick={() => { setLoginMode('email'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
              loginMode === 'email'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4" />
            {t('CHECKIN_EMAIL_LOGIN')}
          </button>
          <button
            onClick={() => { setLoginMode('code'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
              loginMode === 'code'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="h-4 w-4" />
            {t('CHECKIN_GATE_CODE')}
          </button>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 px-6 pb-6">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700/50">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loginMode === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('CHECKIN_EMAIL')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('CHECKIN_EMAIL_PLACEHOLDER')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('CHECKIN_PASSWORD')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('CHECKIN_PASSWORD_PLACEHOLDER')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {t('CHECKIN_LOGGING_IN')}
                  </>
                ) : (
                  t('CHECKIN_LOGIN')
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleGateCodeLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('CHECKIN_GATE_CODE_LABEL')}
                </label>
                <input
                  type="text"
                  value={gateCode}
                  onChange={(e) => setGateCode(e.target.value.toUpperCase())}
                  placeholder={t('CHECKIN_GATE_CODE_PLACEHOLDER')}
                  className="w-full px-4 py-4 rounded-xl bg-slate-900/50 border border-slate-700 text-white text-center text-2xl font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
                  maxLength={8}
                  autoComplete="off"
                />
              </div>
              <p className="text-sm text-slate-500 text-center">
                {t('CHECKIN_GATE_CODE_HINT')}
              </p>
              <Button
                type="submit"
                disabled={loading || gateCode.length < 4}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {t('CHECKIN_VERIFYING')}
                  </>
                ) : (
                  t('CHECKIN_START_SCANNING')
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Mobile hint */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-slate-500 text-sm">
            <Smartphone className="h-4 w-4" />
            {t('CHECKIN_MOBILE_HINT')}
          </div>
        </div>
      </div>
    </div>
  );
}

