'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  Users,
  Ticket,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';
import type { Event, Pass, Guest, ScanLog, ScanResult } from '@/lib/event/types';

interface EventStatisticsProps {
  locale: string;
  eventId: string;
}

interface PassWithGuest extends Pass {
  guest?: Guest;
}

export function EventStatistics({ locale, eventId }: EventStatisticsProps) {
  const router = useRouter();
  const t = useTranslations();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [passes, setPasses] = useState<PassWithGuest[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const supabase = createEventClient();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const eventResponse = await fetch(`/api/event/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const eventData = await eventResponse.json();
      
      if (!eventResponse.ok) {
        throw new Error(eventData.message || t('EVENT_STATS_ERROR'));
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

      // Fetch scan logs via API (bypasses RLS issues and keeps consistent with scanners)
      const logsResponse = await fetch(
        `/api/event/events/${eventId}/scan-logs?limit=200`,
        { headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );
      const logsData = await logsResponse.json();
      if (!logsResponse.ok) {
        throw new Error(logsData.message || t('EVENT_STATS_ERROR'));
      }
      if (logsData.logs) {
        setScanLogs(logsData.logs as any);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || t('EVENT_STATS_ERROR'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const passStats = {
      total: passes.length,
      unused: passes.filter(p => p.status === 'unused').length,
      used: passes.filter(p => p.status === 'used').length,
      revoked: passes.filter(p => p.status === 'revoked').length,
      expired: passes.filter(p => p.status === 'expired').length,
    };

    const guestTypeStats = {
      VIP: guests.filter(g => g.type === 'VIP').length,
      Regular: guests.filter(g => g.type === 'Regular').length,
      Staff: guests.filter(g => g.type === 'Staff').length,
      Media: guests.filter(g => g.type === 'Media').length,
      Other: guests.filter(g => g.type === 'Other').length,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCheckIns = scanLogs.filter(log => {
      const scanDate = new Date(log.scanned_at);
      return scanDate >= today && log.result === 'valid';
    }).length;

    const hourlyData: { [key: string]: number } = {};
    scanLogs.forEach(log => {
      if (log.result === 'valid') {
        const hour = new Date(log.scanned_at).getHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        hourlyData[hourKey] = (hourlyData[hourKey] || 0) + 1;
      }
    });

    let peakHour = '-';
    let maxCheckIns = 0;
    Object.entries(hourlyData).forEach(([hour, count]) => {
      if (count > maxCheckIns) {
        maxCheckIns = count;
        peakHour = hour;
      }
    });

    const hoursWithCheckIns = Object.keys(hourlyData).length;
    const avgCheckInsPerHour = hoursWithCheckIns > 0 
      ? Math.round(Object.values(hourlyData).reduce((a, b) => a + b, 0) / hoursWithCheckIns)
      : 0;

    const conversionRate = guests.length > 0 
      ? Math.round((passStats.used / guests.length) * 100) 
      : 0;

    return {
      passStats,
      guestTypeStats,
      todayCheckIns,
      hourlyData,
      peakHour,
      avgCheckInsPerHour,
      conversionRate,
      totalValidScans: scanLogs.filter(l => l.result === 'valid').length,
      totalInvalidScans: scanLogs.filter(l => l.result !== 'valid').length,
    };
  }, [guests, passes, scanLogs]);

  const getScanResultColor = (result: ScanResult) => {
    switch (result) {
      case 'valid': return 'bg-green-500/10 text-green-500';
      case 'already_used': return 'bg-yellow-500/10 text-yellow-500';
      case 'invalid': return 'bg-red-500/10 text-red-500';
      case 'expired': return 'bg-gray-500/10 text-gray-500';
      case 'not_allowed_zone': return 'bg-orange-500/10 text-orange-500';
      case 'revoked': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getScanResultLabel = (result: ScanResult) => {
    switch (result) {
      case 'valid': return t('EVENT_SCAN_RESULT_VALID');
      case 'already_used': return t('EVENT_SCAN_RESULT_ALREADY_USED');
      case 'invalid': return t('EVENT_SCAN_RESULT_INVALID');
      case 'expired': return t('EVENT_SCAN_RESULT_EXPIRED');
      case 'not_allowed_zone': return t('EVENT_SCAN_RESULT_NOT_ALLOWED_ZONE');
      case 'revoked': return t('EVENT_SCAN_RESULT_REVOKED');
      default: return result;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const SimpleBarChart = ({ data, title }: { data: { [key: string]: number }; title: string }) => {
    const maxValue = Math.max(...Object.values(data), 1);
    const sortedEntries = Object.entries(data).sort((a, b) => {
      return a[0].localeCompare(b[0]);
    });

    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4">{title}</h3>
        {sortedEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('EVENT_STATS_NO_SCANS')}</p>
        ) : (
          <div className="space-y-2">
            {sortedEntries.map(([label, value]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-12 text-sm text-muted-foreground">{label}</span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(value / maxValue) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const DistributionDisplay = ({ 
    data, 
    title, 
  }: { 
    data: { label: string; value: number; color: string }[];
    title: string;
  }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4">{title}</h3>
        {total === 0 ? (
          <p className="text-muted-foreground text-sm">{t('EVENT_STATS_NO_SCANS')}</p>
        ) : (
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((item.value / total) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">{t('EVENT_STATS_LOADING')}</p>
        </div>
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
              <BarChart3 className="h-6 w-6" />
              {t('EVENT_STATISTICS')}
            </h1>
            {event && <p className="text-muted-foreground">{event.name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              {t('EVENT_STATS_LAST_UPDATED', { time: formatTime(lastUpdated.toISOString()) })}
            </span>
          )}
          <Button variant="outline" onClick={() => fetchData(true)} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">{t('EVENT_STATS_REFRESH')}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">{t('EVENT_STATS_TOTAL_GUESTS')}</span>
          </div>
          <div className="text-3xl font-bold">{guests.length}</div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Ticket className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">{t('EVENT_STATS_PASSES_UNUSED')}</span>
          </div>
          <div className="text-3xl font-bold text-green-500">{stats.passStats.unused}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">{t('EVENT_STATS_PASSES_USED')}</span>
          </div>
          <div className="text-3xl font-bold text-blue-500">{stats.passStats.used}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-muted-foreground">{t('EVENT_STATS_PASSES_REVOKED')}</span>
          </div>
          <div className="text-3xl font-bold text-red-500">{stats.passStats.revoked}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">{t('EVENT_STATS_CHECK_INS_TODAY')}</span>
          </div>
          <div className="text-2xl font-bold">{stats.todayCheckIns}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-muted-foreground">{t('EVENT_STATS_PEAK_HOUR')}</span>
          </div>
          <div className="text-2xl font-bold">{stats.peakHour}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-cyan-500" />
            <span className="text-sm text-muted-foreground">{t('EVENT_STATS_AVG_CHECKINS')}</span>
          </div>
          <div className="text-2xl font-bold">{stats.avgCheckInsPerHour}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-muted-foreground">{t('EVENT_STATS_CONVERSION_RATE')}</span>
          </div>
          <div className="text-2xl font-bold">{stats.conversionRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart data={stats.hourlyData} title={t('EVENT_STATS_CHECK_INS_HOURLY')} />

        <DistributionDisplay
          title={t('EVENT_STATS_PASS_DISTRIBUTION')}
          data={[
            { label: t('EVENT_STATS_PASSES_UNUSED'), value: stats.passStats.unused, color: 'bg-green-500' },
            { label: t('EVENT_STATS_PASSES_USED'), value: stats.passStats.used, color: 'bg-blue-500' },
            { label: t('EVENT_STATS_PASSES_REVOKED'), value: stats.passStats.revoked, color: 'bg-red-500' },
          ]}
        />
      </div>

      <DistributionDisplay
        title={t('EVENT_STATS_GUEST_TYPES')}
        data={[
          { label: t('EVENT_GUEST_TYPE_VIP'), value: stats.guestTypeStats.VIP, color: 'bg-yellow-500' },
          { label: t('EVENT_GUEST_TYPE_REGULAR'), value: stats.guestTypeStats.Regular, color: 'bg-green-500' },
          { label: t('EVENT_GUEST_TYPE_STAFF'), value: stats.guestTypeStats.Staff, color: 'bg-blue-500' },
          { label: t('EVENT_GUEST_TYPE_MEDIA'), value: stats.guestTypeStats.Media, color: 'bg-purple-500' },
          { label: t('EVENT_GUEST_TYPE_OTHER'), value: stats.guestTypeStats.Other, color: 'bg-gray-500' },
        ]}
      />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">{t('EVENT_STATS_RECENT_SCANS')}</h3>
        </div>
        
        {scanLogs.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{t('EVENT_STATS_NO_SCANS')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-start px-4 py-3 font-medium">{t('EVENT_GUEST_NAME')}</th>
                  <th className="text-start px-4 py-3 font-medium">{t('EVENT_STATS_GATE')}</th>
                  <th className="text-start px-4 py-3 font-medium">{t('EVENT_STATS_RESULT')}</th>
                  <th className="text-start px-4 py-3 font-medium">{t('EVENT_STATS_SCAN_TIME')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scanLogs.slice(0, 20).map((log: any) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {log.pass?.guest?.full_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.gate?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${getScanResultColor(log.result)}`}>
                        {getScanResultLabel(log.result)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatTime(log.scanned_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
