'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Activity,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Cpu,
  HardDrive,
  RefreshCw,
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  Shield,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';
import { createEventClient } from '@/lib/supabase/event-client';

interface SystemMonitoringProps {
  locale: string;
}

interface APIStats {
  total_requests: number;
  success_rate: number;
  avg_duration_ms: number;
  requests_by_endpoint: Record<string, number>;
  requests_by_status: Record<number, number>;
}

interface ErrorStats {
  total_errors: number;
  errors_by_type: Record<string, number>;
  errors_by_severity: Record<string, number>;
  recent_errors: Array<{
    id: string;
    error_type: string;
    error_message: string;
    severity: string;
    source: string;
    created_at: string;
  }>;
}

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  api: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  webhooks: 'healthy' | 'degraded' | 'down';
}

export function SystemMonitoring({ locale }: SystemMonitoringProps) {
  const router = useRouter();
  const t = useTranslations();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const [apiStats, setApiStats] = useState<APIStats | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    webhooks: 'healthy',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonitoringData();
  }, [timeRange]);

  const fetchMonitoringData = async (isRefresh = false) => {
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

      const response = await fetch(`/api/event/monitoring?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('MONITORING_ERROR'));
      }

      setApiStats(data.api_stats);
      setErrorStats(data.error_stats);
      setSystemHealth(data.system_health);
    } catch (err: any) {
      console.error('Error fetching monitoring data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getHealthIcon = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getHealthColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 border-green-500/20 text-green-500';
      case 'degraded':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
      case 'down':
        return 'bg-red-500/10 border-red-500/20 text-red-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'error':
        return 'bg-red-500/80 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      case 'info':
        return 'bg-blue-500/80 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 400 && status < 500) return 'text-yellow-500';
    if (status >= 500) return 'text-red-500';
    return 'text-muted-foreground';
  };

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
              <Activity className="h-6 w-6" />
              {t('MONITORING_TITLE')}
            </h1>
            <p className="text-muted-foreground">{t('MONITORING_DESC')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(['1h', '24h', '7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline" onClick={() => fetchMonitoringData(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      )}

      {/* System Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-lg border p-4 ${getHealthColor(systemHealth.database)}`}>
          <div className="flex items-center justify-between mb-2">
            <Database className="h-5 w-5" />
            {getHealthIcon(systemHealth.database)}
          </div>
          <div className="font-semibold">{t('MONITORING_DATABASE')}</div>
          <div className="text-sm opacity-80">{t(`MONITORING_STATUS_${systemHealth.database.toUpperCase()}`)}</div>
        </div>

        <div className={`rounded-lg border p-4 ${getHealthColor(systemHealth.api)}`}>
          <div className="flex items-center justify-between mb-2">
            <Globe className="h-5 w-5" />
            {getHealthIcon(systemHealth.api)}
          </div>
          <div className="font-semibold">{t('MONITORING_API')}</div>
          <div className="text-sm opacity-80">{t(`MONITORING_STATUS_${systemHealth.api.toUpperCase()}`)}</div>
        </div>

        <div className={`rounded-lg border p-4 ${getHealthColor(systemHealth.storage)}`}>
          <div className="flex items-center justify-between mb-2">
            <HardDrive className="h-5 w-5" />
            {getHealthIcon(systemHealth.storage)}
          </div>
          <div className="font-semibold">{t('MONITORING_STORAGE')}</div>
          <div className="text-sm opacity-80">{t(`MONITORING_STATUS_${systemHealth.storage.toUpperCase()}`)}</div>
        </div>

        <div className={`rounded-lg border p-4 ${getHealthColor(systemHealth.webhooks)}`}>
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-5 w-5" />
            {getHealthIcon(systemHealth.webhooks)}
          </div>
          <div className="font-semibold">{t('MONITORING_WEBHOOKS')}</div>
          <div className="text-sm opacity-80">{t(`MONITORING_STATUS_${systemHealth.webhooks.toUpperCase()}`)}</div>
        </div>
      </div>

      {apiStats && (
        <>
          {/* API Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Server className="h-4 w-4" />
                {t('MONITORING_TOTAL_REQUESTS')}
              </div>
              <div className="text-2xl font-bold">{apiStats.total_requests.toLocaleString()}</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                {t('MONITORING_SUCCESS_RATE')}
              </div>
              <div className={`text-2xl font-bold ${apiStats.success_rate >= 99 ? 'text-green-500' : apiStats.success_rate >= 95 ? 'text-yellow-500' : 'text-red-500'}`}>
                {apiStats.success_rate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="h-4 w-4" />
                {t('MONITORING_AVG_RESPONSE')}
              </div>
              <div className={`text-2xl font-bold ${apiStats.avg_duration_ms < 200 ? 'text-green-500' : apiStats.avg_duration_ms < 500 ? 'text-yellow-500' : 'text-red-500'}`}>
                {apiStats.avg_duration_ms}ms
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <AlertTriangle className="h-4 w-4" />
                {t('MONITORING_TOTAL_ERRORS')}
              </div>
              <div className={`text-2xl font-bold ${(errorStats?.total_errors || 0) === 0 ? 'text-green-500' : 'text-red-500'}`}>
                {errorStats?.total_errors || 0}
              </div>
            </div>
          </div>

          {/* API Status Codes & Top Endpoints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Codes */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('MONITORING_STATUS_CODES')}</h3>
              
              <div className="space-y-3">
                {Object.entries(apiStats.requests_by_status)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([status, count]) => {
                    const percentage = (count / apiStats.total_requests) * 100;
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-mono font-medium ${getStatusColor(Number(status))}`}>
                            {status}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {count.toLocaleString()} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${Number(status) >= 200 && Number(status) < 300 ? 'bg-green-500' : Number(status) >= 400 && Number(status) < 500 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Top Endpoints */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('MONITORING_TOP_ENDPOINTS')}</h3>
              
              <div className="space-y-3">
                {Object.entries(apiStats.requests_by_endpoint)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([endpoint, count]) => {
                    const percentage = (count / apiStats.total_requests) * 100;
                    return (
                      <div key={endpoint}>
                        <div className="flex items-center justify-between mb-1">
                          <code className="text-sm text-muted-foreground truncate flex-1 mr-2">
                            {endpoint}
                          </code>
                          <span className="text-sm font-medium">
                            {count.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Error Logs */}
      {errorStats && errorStats.total_errors > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('MONITORING_RECENT_ERRORS')}
          </h3>

          {/* Error Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(errorStats.errors_by_severity).map(([severity, count]) => (
              <div
                key={severity}
                className={`rounded-lg px-4 py-2 ${getSeverityColor(severity)}`}
              >
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm capitalize">{severity}</div>
              </div>
            ))}
          </div>

          {/* Error List */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 font-medium">{t('MONITORING_ERROR_TIME')}</th>
                  <th className="text-left py-3 font-medium">{t('MONITORING_ERROR_TYPE')}</th>
                  <th className="text-left py-3 font-medium">{t('MONITORING_ERROR_MESSAGE')}</th>
                  <th className="text-left py-3 font-medium">{t('MONITORING_ERROR_SEVERITY')}</th>
                  <th className="text-left py-3 font-medium">{t('MONITORING_ERROR_SOURCE')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {errorStats.recent_errors.map((err) => (
                  <tr key={err.id} className="hover:bg-muted/30">
                    <td className="py-3 whitespace-nowrap">
                      {new Date(err.created_at).toLocaleString(locale)}
                    </td>
                    <td className="py-3">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {err.error_type}
                      </code>
                    </td>
                    <td className="py-3 max-w-xs truncate" title={err.error_message}>
                      {err.error_message}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(err.severity)}`}>
                        {err.severity}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{err.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

