'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Ticket,
  Download,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  Ban,
  AlertTriangle,
  FileImage,
  Archive,
  Eye,
  ExternalLink,
  CheckSquare,
  Square,
  UserX,
  Plus,
  Calendar,
  Users,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';
import { hasPermission } from '@/lib/event/permissions';
import type { Event, Pass, Guest, PassStatus, UserRole } from '@/lib/event/types';

interface InviteGenerationProps {
  locale: string;
  eventId: string;
}

interface PassWithGuest extends Pass {
  guest?: Guest;
}

export function InviteGeneration({ locale, eventId }: InviteGenerationProps) {
  const router = useRouter();
  const t = useTranslations();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [passes, setPasses] = useState<PassWithGuest[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generatingInvites, setGeneratingInvites] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const [selectedPasses, setSelectedPasses] = useState<Set<string>>(new Set());
  
  const [inviteFormat, setInviteFormat] = useState<'png' | 'jpg' | 'pdf'>('png');
  const [includeGuestInfo, setIncludeGuestInfo] = useState(false);

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokingPass, setRevokingPass] = useState<PassWithGuest | null>(null);
  const [revoking, setRevoking] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('organizer');

  // Anonymous passes state
  const [showAnonymousForm, setShowAnonymousForm] = useState(false);
  const [anonymousCount, setAnonymousCount] = useState(10);
  const [anonymousPrefix, setAnonymousPrefix] = useState('');
  const [anonymousValidFrom, setAnonymousValidFrom] = useState('');
  const [anonymousValidTo, setAnonymousValidTo] = useState('');
  const [generatingAnonymous, setGeneratingAnonymous] = useState(false);
  const [showAnonymousOnly, setShowAnonymousOnly] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createEventClient();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      // Get user role
      const { data: userData } = await supabase
        .from('event_users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (userData?.role) {
        setUserRole(userData.role as UserRole);
      }

      const eventResponse = await fetch(`/api/event/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const eventData = await eventResponse.json();
      
      if (!eventResponse.ok) {
        throw new Error(eventData.message || t('EVENT_ERROR'));
      }
      setEvent(eventData.event);

      const guestsResponse = await fetch(`/api/event/events/${eventId}/guests`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const guestsData = await guestsResponse.json();
      if (guestsData.guests) {
        setGuests(guestsData.guests);
      }

      const passesResponse = await fetch(`/api/event/events/${eventId}/passes`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const passesData = await passesResponse.json();
      if (passesData.passes) {
        setPasses(passesData.passes);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePasses = async () => {
    try {
      setGenerating(true);
      setError(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const response = await fetch(`/api/event/events/${eventId}/passes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('EVENT_ERROR'));
      }

      if (data.generated > 0) {
        setSuccessMessage(t('EVENT_PASSES_GENERATED', { count: data.generated }));
      }
      
      fetchData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error generating passes:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAnonymousPasses = async () => {
    try {
      setGeneratingAnonymous(true);
      setError(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const payload: any = {
        count: anonymousCount,
      };

      if (anonymousPrefix.trim()) {
        payload.prefix = anonymousPrefix.trim();
      }
      if (anonymousValidFrom) {
        payload.valid_from = new Date(anonymousValidFrom).toISOString();
      }
      if (anonymousValidTo) {
        payload.valid_to = new Date(anonymousValidTo).toISOString();
      }

      const response = await fetch(`/api/event/events/${eventId}/anonymous-passes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('EVENT_ERROR'));
      }

      setSuccessMessage(t('EVENT_ANONYMOUS_GENERATED', { count: data.generated }));
      setShowAnonymousForm(false);
      setAnonymousCount(10);
      setAnonymousPrefix('');
      setAnonymousValidFrom('');
      setAnonymousValidTo('');
      
      fetchData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error generating anonymous passes:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setGeneratingAnonymous(false);
    }
  };

  const handleGenerateInvites = async (passIds?: string[]) => {
    try {
      setGeneratingInvites(true);
      setError(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const response = await fetch('/api/event/invites/batch-generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          pass_ids: passIds || Array.from(selectedPasses),
          format: inviteFormat,
          include_guest_info: includeGuestInfo,
          return_zip: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('EVENT_ERROR'));
      }

      setSuccessMessage(t('EVENT_INVITES_GENERATED', { count: data.generated }));
      setSelectedPasses(new Set());
      fetchData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error generating invites:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setGeneratingInvites(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      setError(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const response = await fetch('/api/event/invites/batch-generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          format: inviteFormat,
          include_guest_info: includeGuestInfo,
          return_zip: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('EVENT_ERROR'));
      }

      if (data.zip_url) {
        window.open(data.zip_url, '_blank');
      } else if (data.zip_error) {
        setError(data.zip_error);
      }

    } catch (err: any) {
      console.error('Error downloading ZIP:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleCopyLink = async (pass: PassWithGuest) => {
    try {
      const inviteUrl = pass.invite_file_url || `${window.location.origin}/event/invite/${pass.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedId(pass.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Error copying link:', err);
    }
  };

  const handleRevokePass = async () => {
    if (!revokingPass) return;

    try {
      setRevoking(true);
      setError(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const { error: updateError } = await supabase
        .from('event_passes')
        .update({ 
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        })
        .eq('id', revokingPass.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccessMessage(t('EVENT_PASS_REVOKED'));
      setShowRevokeModal(false);
      setRevokingPass(null);
      fetchData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error revoking pass:', err);
      setError(err.message || t('EVENT_ERROR'));
    } finally {
      setRevoking(false);
    }
  };

  const togglePassSelection = (passId: string) => {
    const newSelection = new Set(selectedPasses);
    if (newSelection.has(passId)) {
      newSelection.delete(passId);
    } else {
      newSelection.add(passId);
    }
    setSelectedPasses(newSelection);
  };

  const selectAllPasses = () => {
    const allUnusedPassIds = passes
      .filter(p => p.status === 'unused')
      .map(p => p.id);
    setSelectedPasses(new Set(allUnusedPassIds));
  };

  const deselectAllPasses = () => {
    setSelectedPasses(new Set());
  };

  const getStatusColor = (status: PassStatus) => {
    switch (status) {
      case 'unused': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'used': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'revoked': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'expired': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: PassStatus) => {
    switch (status) {
      case 'unused': return t('EVENT_PASS_STATUS_UNUSED');
      case 'used': return t('EVENT_PASS_STATUS_USED');
      case 'revoked': return t('EVENT_PASS_STATUS_REVOKED');
      case 'expired': return t('EVENT_PASS_STATUS_EXPIRED');
      default: return status;
    }
  };

  const stats = {
    total: passes.length,
    unused: passes.filter(p => p.status === 'unused').length,
    used: passes.filter(p => p.status === 'used').length,
    revoked: passes.filter(p => p.status === 'revoked').length,
  };

  const guestsWithoutPasses = guests.filter(
    g => !passes.some(p => p.guest_id === g.id)
  );

  // Permission checks
  const canGenerateInvites = hasPermission(userRole, 'invites.generate');
  const canRevokeInvites = hasPermission(userRole, 'invites.revoke');
  const canDownloadInvites = hasPermission(userRole, 'invites.download');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/${locale}/event/dashboard`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ticket className="h-6 w-6" />
              {t('EVENT_INVITES')}
            </h1>
            {event && <p className="text-muted-foreground">{event.name}</p>}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-500">
          {successMessage}
        </div>
      )}

      {event && !event.template_id && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-yellow-500">{t('EVENT_NO_TEMPLATE_WARNING')}</p>
            <Button 
              variant="link" 
              className="text-yellow-500 p-0 h-auto mt-2"
              onClick={() => router.push(`/${locale}/event/dashboard/events/${eventId}/edit`)}
            >
              {t('EVENT_EDIT_EVENT')} →
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">{t('EVENT_STATS_TOTAL_PASSES')}</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">{t('EVENT_STATS_PASSES_UNUSED')}</div>
          <div className="text-2xl font-bold text-green-500">{stats.unused}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">{t('EVENT_STATS_PASSES_USED')}</div>
          <div className="text-2xl font-bold text-blue-500">{stats.used}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">{t('EVENT_STATS_PASSES_REVOKED')}</div>
          <div className="text-2xl font-bold text-red-500">{stats.revoked}</div>
        </div>
      </div>

      {/* Anonymous Passes Section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <UserX className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t('EVENT_ANONYMOUS_PASSES')}</h2>
              <p className="text-sm text-muted-foreground">{t('EVENT_ANONYMOUS_PASSES_DESC')}</p>
            </div>
          </div>
          {canGenerateInvites && (
            <Button 
              variant={showAnonymousForm ? "outline" : "default"}
              onClick={() => setShowAnonymousForm(!showAnonymousForm)}
              className={showAnonymousForm ? "" : "bg-purple-600 hover:bg-purple-700"}
            >
              {showAnonymousForm ? (
                t('EVENT_CANCEL')
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('EVENT_GENERATE_ANONYMOUS')}
                </>
              )}
            </Button>
          )}
        </div>

        {showAnonymousForm && (
          <div className="mt-4 p-4 bg-card rounded-lg border border-border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_ANONYMOUS_COUNT')}</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={anonymousCount}
                  onChange={(e) => setAnonymousCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_ANONYMOUS_PREFIX')}</label>
                <input
                  type="text"
                  value={anonymousPrefix}
                  onChange={(e) => setAnonymousPrefix(e.target.value)}
                  placeholder={t('EVENT_ANONYMOUS_PREFIX_PLACEHOLDER')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {t('EVENT_ANONYMOUS_VALID_FROM')}
                </label>
                <input
                  type="datetime-local"
                  value={anonymousValidFrom}
                  onChange={(e) => setAnonymousValidFrom(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {t('EVENT_ANONYMOUS_VALID_TO')}
                </label>
                <input
                  type="datetime-local"
                  value={anonymousValidTo}
                  onChange={(e) => setAnonymousValidTo(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAnonymousForm(false)}>
                {t('EVENT_CANCEL')}
              </Button>
              <Button 
                onClick={handleGenerateAnonymousPasses} 
                disabled={generatingAnonymous || anonymousCount < 1}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generatingAnonymous ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('EVENT_GENERATING_ANONYMOUS')}
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    {t('EVENT_GENERATE_ANONYMOUS')} ({anonymousCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {guests.length === 0 && passes.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('EVENT_NO_GUESTS_YET')}</h3>
          <p className="text-muted-foreground mb-4">{t('EVENT_ADD_GUESTS_FIRST')}</p>
          <Button onClick={() => router.push(`/${locale}/event/dashboard/events/${eventId}/guests`)}>
            {t('EVENT_GO_TO_GUESTS')}
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-4">{t('EVENT_GENERATE_INVITES')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('EVENT_INVITE_FORMAT')}</label>
                <select
                  value={inviteFormat}
                  onChange={(e) => setInviteFormat(e.target.value as 'png' | 'jpg' | 'pdf')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="png">{t('EVENT_FORMAT_PNG')}</option>
                  <option value="jpg">{t('EVENT_FORMAT_JPG')}</option>
                  <option value="pdf">{t('EVENT_FORMAT_PDF')}</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-7">
                <input
                  type="checkbox"
                  id="includeGuestInfo"
                  checked={includeGuestInfo}
                  onChange={(e) => setIncludeGuestInfo(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="includeGuestInfo" className="text-sm">
                  {t('EVENT_INCLUDE_GUEST_INFO')}
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              {guestsWithoutPasses.length > 0 && (
                <Button onClick={handleGeneratePasses} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('EVENT_GENERATING_PASSES')}
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4 mr-2" />
                      {t('EVENT_GENERATE_PASSES')} ({guestsWithoutPasses.length})
                    </>
                  )}
                </Button>
              )}

              {selectedPasses.size > 0 && (
                <Button 
                  onClick={() => handleGenerateInvites()} 
                  disabled={generatingInvites || !event?.template_id}
                >
                  {generatingInvites ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('EVENT_GENERATING_INVITES')}
                    </>
                  ) : (
                    <>
                      <FileImage className="h-4 w-4 mr-2" />
                      {t('EVENT_GENERATE_SELECTED')} ({selectedPasses.size})
                    </>
                  )}
                </Button>
              )}

              {passes.length > 0 && event?.template_id && (
                <Button 
                  variant="outline" 
                  onClick={handleDownloadZip} 
                  disabled={downloadingZip}
                >
                  {downloadingZip ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('EVENT_LOADING')}
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      {t('EVENT_DOWNLOAD_ZIP')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {passes.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('EVENT_NO_PASSES')}</h3>
              <p className="text-muted-foreground mb-4">{t('EVENT_NO_PASSES_DESC')}</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-muted/50">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" size="sm" onClick={selectAllPasses}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {t('EVENT_SELECT_ALL')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllPasses}>
                    <Square className="h-4 w-4 mr-2" />
                    {t('EVENT_DESELECT_ALL')}
                  </Button>
                  <div className="h-6 w-px bg-border" />
                  <Button 
                    variant={showAnonymousOnly ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setShowAnonymousOnly(!showAnonymousOnly)}
                    className={showAnonymousOnly ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    {showAnonymousOnly ? t('EVENT_SHOW_ALL_PASSES') : t('EVENT_SHOW_ANONYMOUS_ONLY')}
                  </Button>
                </div>
                {selectedPasses.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {t('EVENT_SELECTED_COUNT', { count: selectedPasses.size })}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-12 px-4 py-3"></th>
                      <th className="text-start px-4 py-3 font-medium">{t('EVENT_GUEST_NAME')}</th>
                      <th className="text-start px-4 py-3 font-medium">{t('EVENT_STATUS')}</th>
                      <th className="text-start px-4 py-3 font-medium">{t('EVENT_INVITE_LINK')}</th>
                      <th className="text-end px-4 py-3 font-medium">{t('EVENT_ACTIONS')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {passes
                      .filter(pass => !showAnonymousOnly || (pass as any).is_anonymous)
                      .map((pass) => (
                      <tr key={pass.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedPasses.has(pass.id)}
                            onChange={() => togglePassSelection(pass.id)}
                            disabled={pass.status !== 'unused'}
                            className="h-4 w-4 rounded border-border"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            {pass.guest?.full_name || '-'}
                            {(pass as any).is_anonymous && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-500 border border-purple-500/30">
                                {t('EVENT_ANONYMOUS_BADGE')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(pass.status)}`}>
                            {getStatusLabel(pass.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {pass.invite_file_url ? (
                            <a 
                              href={pass.invite_file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t('EVENT_OPEN_INVITE')}
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {t('EVENT_NOT_GENERATED')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-end">
                          <div className="flex justify-end gap-2">
                            {pass.invite_file_url && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleCopyLink(pass)}
                                  title={t('EVENT_COPY_LINK')}
                                >
                                  {copiedId === pass.id ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => window.open(pass.invite_file_url, '_blank')}
                                  title={t('EVENT_VIEW_INVITE')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = pass.invite_file_url!;
                                    link.download = `invite-${pass.guest?.full_name || pass.id}.${inviteFormat}`;
                                    link.click();
                                  }}
                                  title={t('EVENT_DOWNLOAD_SINGLE')}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {pass.status === 'unused' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setRevokingPass(pass);
                                  setShowRevokeModal(true);
                                }}
                                title={t('EVENT_REVOKE_PASS')}
                              >
                                <Ban className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showRevokeModal && revokingPass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-sm">
            <div className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('EVENT_REVOKE_PASS')}</h3>
              <p className="text-muted-foreground mb-2">{t('EVENT_CONFIRM_REVOKE')}</p>
              <p className="font-medium mb-4">{revokingPass.guest?.full_name}</p>
              <p className="text-sm text-red-500">{t('EVENT_REVOKE_WARNING')}</p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRevokeModal(false);
                  setRevokingPass(null);
                }} 
                disabled={revoking}
              >
                {t('EVENT_CANCEL')}
              </Button>
              <Button variant="destructive" onClick={handleRevokePass} disabled={revoking}>
                {revoking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t('EVENT_REVOKE')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
