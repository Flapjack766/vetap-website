'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { Loader2, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { getMarginClass, getDirection } from '@/lib/utils/rtl';

interface ReportsTabProps {
  profile: any;
  locale: string;
}

export function ReportsTab({ profile, locale }: ReportsTabProps) {
  const t = useTranslations();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const isRTL = locale === 'ar';
  const dir = getDirection(locale);
  const [saving, setSaving] = useState(false);
  const [reportSettings, setReportSettings] = useState({
    enabled: false,
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    email: '',
  });
  const [lastSent, setLastSent] = useState<string | null>(null);

  useEffect(() => {
    fetchReportSettings();
  }, [profile.id]); // Re-fetch when profile changes

  const fetchReportSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setReportSettings({
          enabled: data.enabled,
          frequency: data.frequency,
          email: data.email || profile.email || '',
        });
        setLastSent(data.last_sent_at);
      } else {
        // Use profile email as default
        setReportSettings({
          enabled: false,
          frequency: 'weekly',
          email: profile.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching report settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('analytics_reports')
        .upsert({
          profile_id: profile.id,
          enabled: reportSettings.enabled,
          frequency: reportSettings.frequency,
          email: reportSettings.email,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id',
        });

      if (error) {
        throw error;
      }

      alert(t('REPORTS1'));
    } catch (error) {
      console.error('Error saving report settings:', error);
      alert(t('REPORTS2'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <Card>
        <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Mail className="h-5 w-5" />
            {t('REPORTS3')}
          </CardTitle>
          <CardDescription>{t('REPORTS4')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{t('REPORTS5')}</p>
              <p className="text-sm text-muted-foreground">{t('REPORTS6')}</p>
            </div>
            <div className="flex items-center gap-2">
              {reportSettings.enabled ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportSettings.enabled}
                  onChange={(e) => setReportSettings({ ...reportSettings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{t('REPORTS7')}</label>
            <input
              type="email"
              value={reportSettings.email}
              onChange={(e) => setReportSettings({ ...reportSettings, email: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder={t('REPORTS8')}
              dir={dir}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{t('REPORTS9')}</label>
            <select
              value={reportSettings.frequency}
              onChange={(e) => setReportSettings({ ...reportSettings, frequency: e.target.value as any })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              dir={dir}
            >
              <option value="daily">{t('REPORTS10')}</option>
              <option value="weekly">{t('REPORTS11')}</option>
              <option value="monthly">{t('REPORTS12')}</option>
            </select>
          </div>

          {/* Last Sent */}
          {lastSent && (
            <div className={`p-4 bg-muted rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-sm text-muted-foreground">{t('REPORTS13')}</p>
              <p className="font-medium">{formatDate(lastSent)}</p>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || !reportSettings.email}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className={`h-4 w-4 ${getMarginClass(locale, 'mr-2', 'ml-2')} animate-spin`} />
                {t('REPORTS14')}
              </>
            ) : (
              t('REPORTS15')
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

