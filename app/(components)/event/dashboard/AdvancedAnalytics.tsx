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
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  DoorOpen,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  ArrowLeft,
  Loader2,
  Activity,
  PieChart,
  BarChart,
  LineChart,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';
import type { Event, ScanResult } from '@/lib/event/types';

interface AdvancedAnalyticsProps {
  locale: string;
  eventId?: string;
}

interface EventStats {
  event: Event;
  total_guests: number;
  total_passes: number;
  passes_used: number;
  passes_unused: number;
  passes_revoked: number;
  attendance_rate: number;
  invalid_attempts: number;
  total_scans: number;
}

interface GateStats {
  gate_id: string;
  gate_name: string;
  total_scans: number;
  valid_scans: number;
  invalid_scans: number;
  activity_percentage: number;
}

interface HourlyStats {
  hour: number;
  count: number;
  valid: number;
  invalid: number;
}

interface DailyStats {
  date: string;
  count: number;
  valid: number;
  invalid: number;
}

interface GuestTypeStats {
  type: string;
  count: number;
  checked_in: number;
  percentage: number;
}

interface ScanLogEntry {
  id: string;
  result: ScanResult;
  scanned_at: string;
  guest_name?: string;
  gate_name?: string;
}

export function AdvancedAnalytics({ locale, eventId }: AdvancedAnalyticsProps) {
  const router = useRouter();
  const t = useTranslations();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || '');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [gateStats, setGateStats] = useState<GateStats[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [guestTypeStats, setGuestTypeStats] = useState<GuestTypeStats[]>([]);
  const [recentScans, setRecentScans] = useState<ScanLogEntry[]>([]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAnalytics();
    }
  }, [selectedEventId, dateRange]);

  const fetchEvents = async () => {
    try {
      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${locale}/event/login`);
        return;
      }

      const response = await fetch('/api/event/events', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await response.json();

      if (data.events) {
        setEvents(data.events);
        if (!selectedEventId && data.events.length > 0) {
          setSelectedEventId(data.events[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (isRefresh = false) => {
    if (!selectedEventId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      setError(null);

      const supabase = createEventClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(
        `/api/event/analytics/${selectedEventId}?range=${dateRange}`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('ANALYTICS_ERROR'));
      }

      setEventStats(data.event_stats);
      setGateStats(data.gate_stats || []);
      setHourlyStats(data.hourly_stats || []);
      setDailyStats(data.daily_stats || []);
      setGuestTypeStats(data.guest_type_stats || []);
      setRecentScans(data.recent_scans || []);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const exportReport = async () => {
    if (!eventStats) return;

    const report = {
      event: eventStats.event.name,
      generated_at: new Date().toISOString(),
      summary: {
        total_guests: eventStats.total_guests,
        total_passes: eventStats.total_passes,
        passes_used: eventStats.passes_used,
        attendance_rate: `${eventStats.attendance_rate.toFixed(1)}%`,
        invalid_attempts: eventStats.invalid_attempts,
      },
      gate_stats: gateStats,
      hourly_stats: hourlyStats,
      guest_type_stats: guestTypeStats,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedEventId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getResultColor = (result: ScanResult) => {
    switch (result) {
      case 'valid': return 'text-green-500';
      case 'already_used': return 'text-yellow-500';
      default: return 'text-red-500';
    }
  };

  const getResultLabel = (result: ScanResult) => {
    switch (result) {
      case 'valid': return t('ANALYTICS_RESULT_VALID');
      case 'already_used': return t('ANALYTICS_RESULT_ALREADY_USED');
      case 'invalid': return t('ANALYTICS_RESULT_INVALID');
      case 'expired': return t('ANALYTICS_RESULT_EXPIRED');
      case 'revoked': return t('ANALYTICS_RESULT_REVOKED');
      case 'not_allowed_zone': return t('ANALYTICS_RESULT_NOT_ALLOWED');
      default: return result;
    }
  };

  // Calculate peak hour
  const peakHour = useMemo(() => {
    if (hourlyStats.length === 0) return null;
    const peak = hourlyStats.reduce((max, curr) => curr.count > max.count ? curr : max);
    return peak;
  }, [hourlyStats]);

  // Calculate most active gate
  const mostActiveGate = useMemo(() => {
    if (gateStats.length === 0) return null;
    return gateStats.reduce((max, curr) => curr.total_scans > max.total_scans ? curr : max);
  }, [gateStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              {t('ANALYTICS_TITLE')}
            </h1>
            <p className="text-muted-foreground">{t('ANALYTICS_DESC')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchAnalytics(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('ANALYTICS_REFRESH')}
          </Button>
          <Button variant="outline" onClick={exportReport} disabled={!eventStats}>
            <Download className="h-4 w-4 mr-2" />
            {t('ANALYTICS_EXPORT')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-2">{t('ANALYTICS_SELECT_EVENT')}</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t('ANALYTICS_DATE_RANGE')}</label>
          <div className="flex gap-1">
            {(['today', 'week', 'month', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange(range)}
              >
                {t(`ANALYTICS_RANGE_${range.toUpperCase()}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      )}

      {eventStats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Users className="h-4 w-4" />
                {t('ANALYTICS_TOTAL_GUESTS')}
              </div>
              <div className="text-2xl font-bold">{eventStats.total_guests}</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Ticket className="h-4 w-4" />
                {t('ANALYTICS_TOTAL_PASSES')}
              </div>
              <div className="text-2xl font-bold">{eventStats.total_passes}</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t('ANALYTICS_CHECKED_IN')}
              </div>
              <div className="text-2xl font-bold text-green-500">{eventStats.passes_used}</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                {t('ANALYTICS_ATTENDANCE_RATE')}
              </div>
              <div className="text-2xl font-bold text-blue-500">
                {eventStats.attendance_rate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                {t('ANALYTICS_INVALID_ATTEMPTS')}
              </div>
              <div className="text-2xl font-bold text-red-500">{eventStats.invalid_attempts}</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Activity className="h-4 w-4" />
                {t('ANALYTICS_TOTAL_SCANS')}
              </div>
              <div className="text-2xl font-bold">{eventStats.total_scans}</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Check-ins Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('ANALYTICS_HOURLY_CHECKINS')}
              </h3>
              
              {peakHour && (
                <div className="mb-4 p-3 bg-primary/10 rounded-lg text-sm">
                  <span className="text-muted-foreground">{t('ANALYTICS_PEAK_HOUR')}: </span>
                  <span className="font-semibold">
                    {peakHour.hour.toString().padStart(2, '0')}:00 - {(peakHour.hour + 1).toString().padStart(2, '0')}:00
                  </span>
                  <span className="text-muted-foreground"> ({peakHour.count} {t('ANALYTICS_SCANS')})</span>
                </div>
              )}

              <div className="h-48 flex items-end gap-1">
                {Array.from({ length: 24 }, (_, i) => {
                  const hourData = hourlyStats.find(h => h.hour === i);
                  const count = hourData?.count || 0;
                  const maxCount = Math.max(...hourlyStats.map(h => h.count), 1);
                  const height = (count / maxCount) * 100;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      >
                        {count > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border border-border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {count}
                          </div>
                        )}
                        {hourData?.valid && (
                          <div
                            className="absolute bottom-0 w-full bg-green-500 rounded-t"
                            style={{ height: `${(hourData.valid / count) * 100}%` }}
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{i}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span>{t('ANALYTICS_VALID')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary/20 rounded" />
                  <span>{t('ANALYTICS_TOTAL')}</span>
                </div>
              </div>
            </div>

            {/* Gate Activity Chart */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DoorOpen className="h-5 w-5" />
                {t('ANALYTICS_GATE_ACTIVITY')}
              </h3>

              {mostActiveGate && (
                <div className="mb-4 p-3 bg-primary/10 rounded-lg text-sm">
                  <span className="text-muted-foreground">{t('ANALYTICS_MOST_ACTIVE')}: </span>
                  <span className="font-semibold">{mostActiveGate.gate_name}</span>
                  <span className="text-muted-foreground"> ({mostActiveGate.total_scans} {t('ANALYTICS_SCANS')})</span>
                </div>
              )}

              {gateStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('ANALYTICS_NO_GATE_DATA')}
                </div>
              ) : (
                <div className="space-y-4">
                  {gateStats.map((gate) => (
                    <div key={gate.gate_id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{gate.gate_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {gate.total_scans} {t('ANALYTICS_SCANS')} ({gate.activity_percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full flex">
                          <div
                            className="bg-green-500"
                            style={{ width: `${(gate.valid_scans / Math.max(gate.total_scans, 1)) * 100}%` }}
                          />
                          <div
                            className="bg-red-500"
                            style={{ width: `${(gate.invalid_scans / Math.max(gate.total_scans, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guest Type Distribution */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                {t('ANALYTICS_GUEST_TYPES')}
              </h3>

              {guestTypeStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('ANALYTICS_NO_DATA')}
                </div>
              ) : (
                <div className="space-y-4">
                  {guestTypeStats.map((type, idx) => {
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
                    return (
                      <div key={type.type}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${colors[idx % colors.length]}`} />
                            <span className="font-medium">{type.type}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {type.checked_in}/{type.count} ({type.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[idx % colors.length]}`}
                            style={{ width: `${type.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily Trend (if more than 1 day) */}
            {dailyStats.length > 1 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  {t('ANALYTICS_DAILY_TREND')}
                </h3>

                <div className="h-48 flex items-end gap-2">
                  {dailyStats.map((day) => {
                    const maxCount = Math.max(...dailyStats.map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;

                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-primary rounded-t hover:bg-primary/80 transition-colors relative group"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border border-border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {day.count} scans
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(day.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recent Scans Log */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('ANALYTICS_RECENT_SCANS')}
            </h3>

            {recentScans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('ANALYTICS_NO_SCANS')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 font-medium">{t('ANALYTICS_TIME')}</th>
                      <th className="text-left py-3 font-medium">{t('ANALYTICS_GUEST')}</th>
                      <th className="text-left py-3 font-medium">{t('ANALYTICS_GATE')}</th>
                      <th className="text-left py-3 font-medium">{t('ANALYTICS_RESULT')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentScans.map((scan) => (
                      <tr key={scan.id} className="hover:bg-muted/30">
                        <td className="py-3">
                          {new Date(scan.scanned_at).toLocaleString(locale)}
                        </td>
                        <td className="py-3">{scan.guest_name || '-'}</td>
                        <td className="py-3">{scan.gate_name || '-'}</td>
                        <td className="py-3">
                          <span className={`font-medium ${getResultColor(scan.result)}`}>
                            {getResultLabel(scan.result)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Fraud Detection Summary */}
          {eventStats.invalid_attempts > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-5 w-5" />
                {t('ANALYTICS_FRAUD_DETECTION')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('ANALYTICS_INVALID_QR')}
                  </div>
                  <div className="text-2xl font-bold text-red-500">
                    {recentScans.filter(s => s.result === 'invalid').length}
                  </div>
                </div>
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('ANALYTICS_REUSED_PASSES')}
                  </div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {recentScans.filter(s => s.result === 'already_used').length}
                  </div>
                </div>
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('ANALYTICS_EXPIRED_REVOKED')}
                  </div>
                  <div className="text-2xl font-bold text-orange-500">
                    {recentScans.filter(s => ['expired', 'revoked'].includes(s.result)).length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

