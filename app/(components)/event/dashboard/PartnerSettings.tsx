'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Settings,
  Webhook,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Send,
  Clock,
  XCircle,
  ArrowLeft,
  Save,
  Info,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';
import type { WebhookEventType } from '@/lib/event/types';

interface PartnerSettingsProps {
  locale: string;
}

interface Partner {
  id: string;
  name: string;
  webhook_url: string | null;
  webhook_secret: string | null;
  webhook_events: string[];
  api_key?: string;
}

interface WebhookLog {
  id: string;
  event_type: string;
  sent_at: string;
  response_status: number | null;
  error_message: string | null;
}

const WEBHOOK_EVENTS: { value: WebhookEventType; labelKey: string; descKey: string }[] = [
  { value: 'on_pass_generated', labelKey: 'WEBHOOK_EVENT_PASS_GENERATED', descKey: 'WEBHOOK_EVENT_PASS_GENERATED_DESC' },
  { value: 'on_check_in_valid', labelKey: 'WEBHOOK_EVENT_CHECKIN_VALID', descKey: 'WEBHOOK_EVENT_CHECKIN_VALID_DESC' },
  { value: 'on_check_in_invalid', labelKey: 'WEBHOOK_EVENT_CHECKIN_INVALID', descKey: 'WEBHOOK_EVENT_CHECKIN_INVALID_DESC' },
  { value: 'on_event_created', labelKey: 'WEBHOOK_EVENT_CREATED', descKey: 'WEBHOOK_EVENT_CREATED_DESC' },
  { value: 'on_event_updated', labelKey: 'WEBHOOK_EVENT_UPDATED', descKey: 'WEBHOOK_EVENT_UPDATED_DESC' },
];

export function PartnerSettings({ locale }: PartnerSettingsProps) {
  const router = useRouter();
  const t = useTranslations();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showSecret, setShowSecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchPartnerData();
  }, []);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createEventClient();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      // Get user's partner
      const { data: userData } = await supabase
        .from('event_users')
        .select('partner_id')
        .eq('id', session.user.id)
        .single();

      if (!userData?.partner_id) {
        setError(t('WEBHOOK_NO_PARTNER'));
        setLoading(false);
        return;
      }

      // Get partner details
      const { data: partnerData } = await supabase
        .from('event_partners')
        .select('id, name, webhook_url, webhook_secret, webhook_events')
        .eq('id', userData.partner_id)
        .single();

      if (partnerData) {
        setPartner(partnerData as Partner);
        setWebhookUrl(partnerData.webhook_url || '');
        setWebhookSecret(partnerData.webhook_secret || '');
        setSelectedEvents(partnerData.webhook_events || []);
      }

      // Get API key
      const { data: apiKeyData } = await supabase
        .from('event_api_keys')
        .select('key')
        .eq('partner_id', userData.partner_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (apiKeyData && partnerData) {
        setPartner({ ...partnerData as Partner, api_key: apiKeyData.key });
      }

      // Get recent webhook logs
      const { data: logsData } = await supabase
        .from('event_webhook_logs')
        .select('id, event_type, sent_at, response_status, error_message')
        .eq('partner_id', userData.partner_id)
        .order('sent_at', { ascending: false })
        .limit(10);

      if (logsData) {
        setWebhookLogs(logsData);
      }
    } catch (err: any) {
      console.error('Error fetching partner data:', err);
      setError(err.message || t('WEBHOOK_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!partner) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const response = await fetch('/api/event/partners/webhook', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook_url: webhookUrl || null,
          webhook_secret: webhookSecret || null,
          webhook_events: selectedEvents,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('WEBHOOK_SAVE_ERROR'));
      }

      setSuccess(t('WEBHOOK_SAVED'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving webhook:', err);
      setError(err.message || t('WEBHOOK_SAVE_ERROR'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      setError(t('WEBHOOK_URL_REQUIRED'));
      return;
    }

    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch('/api/event/partners/webhook/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhook_url: webhookUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('WEBHOOK_TEST_FAILED'));
      }

      setSuccess(t('WEBHOOK_TEST_SUCCESS'));
      fetchPartnerData(); // Refresh logs
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error testing webhook:', err);
      setError(err.message || t('WEBHOOK_TEST_FAILED'));
    } finally {
      setTesting(false);
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      setSaving(true);
      setError(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch('/api/event/partners/api-key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('WEBHOOK_API_KEY_ERROR'));
      }

      if (partner) {
        setPartner({ ...partner, api_key: data.api_key });
      }
      setSuccess(t('WEBHOOK_API_KEY_GENERATED'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error generating API key:', err);
      setError(err.message || t('WEBHOOK_API_KEY_ERROR'));
    } finally {
      setSaving(false);
    }
  };

  const generateWebhookSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = 'whsec_';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setWebhookSecret(secret);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const toggleEvent = (eventType: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventType)
        ? prev.filter(e => e !== eventType)
        : [...prev, eventType]
    );
  };

  const getStatusIcon = (status: number | null, error: string | null) => {
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (status && status >= 200 && status < 300) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            {t('WEBHOOK_SETTINGS_TITLE')}
          </h1>
          <p className="text-muted-foreground">{t('WEBHOOK_SETTINGS_DESC')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-2 text-green-500">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* API Key Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="h-5 w-5" />
          {t('WEBHOOK_API_KEY')}
        </h2>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('WEBHOOK_API_KEY_DESC')}</p>

          {partner?.api_key ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-lg px-4 py-3 font-mono text-sm">
                {showApiKey ? partner.api_key : '••••••••••••••••••••••••••••••••'}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(partner.api_key!, 'apiKey')}
              >
                {copiedField === 'apiKey' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">{t('WEBHOOK_NO_API_KEY')}</div>
          )}

          <Button onClick={handleGenerateApiKey} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {partner?.api_key ? t('WEBHOOK_REGENERATE_API_KEY') : t('WEBHOOK_GENERATE_API_KEY')}
          </Button>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          {t('WEBHOOK_CONFIG')}
        </h2>

        <div className="space-y-6">
          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('WEBHOOK_URL')}</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-domain.com/webhooks/vetap"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-sm text-muted-foreground mt-1">{t('WEBHOOK_URL_HINT')}</p>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('WEBHOOK_SECRET')}</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary pr-20"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="outline" onClick={generateWebhookSecret}>
                {t('WEBHOOK_GENERATE')}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => webhookSecret && copyToClipboard(webhookSecret, 'secret')}
              >
                {copiedField === 'secret' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{t('WEBHOOK_SECRET_HINT')}</p>
          </div>

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">{t('WEBHOOK_EVENTS')}</label>
            <div className="space-y-3">
              {WEBHOOK_EVENTS.map((event) => (
                <label
                  key={event.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedEvents.includes(event.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.value)}
                    onChange={() => toggleEvent(event.value)}
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{t(event.labelKey)}</div>
                    <div className="text-sm text-muted-foreground">{t(event.descKey)}</div>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                      {event.value}
                    </code>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <Button onClick={handleSaveWebhook} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {t('WEBHOOK_SAVE')}
            </Button>
            <Button variant="outline" onClick={handleTestWebhook} disabled={testing || !webhookUrl}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              {t('WEBHOOK_TEST')}
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Webhook Logs */}
      {webhookLogs.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('WEBHOOK_RECENT_LOGS')}
          </h2>

          <div className="space-y-2">
            {webhookLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.response_status, log.error_message)}
                  <div>
                    <code className="text-sm font-medium">{log.event_type}</code>
                    {log.error_message && (
                      <p className="text-xs text-red-500 mt-0.5">{log.error_message}</p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(log.sent_at).toLocaleString(locale)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Documentation Link */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-500">{t('WEBHOOK_API_DOCS_TITLE')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('WEBHOOK_API_DOCS_DESC')}</p>
            <Button
              variant="link"
              className="text-blue-500 p-0 h-auto mt-2"
              onClick={() => router.push(`/${locale}/event/docs/api`)}
            >
              {t('WEBHOOK_VIEW_DOCS')} →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

