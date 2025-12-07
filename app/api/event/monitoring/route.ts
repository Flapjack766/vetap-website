/**
 * VETAP Event - System Monitoring API
 * GET /api/event/monitoring
 * 
 * Get system monitoring data (API stats, errors, health)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { authenticateRequest } from '@/lib/event/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate - only owner and partner_admin can view monitoring
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const user = authResult.user;
    if (!['owner', 'partner_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'Only administrators can view monitoring data' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '24h';

    // Calculate date filter
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const adminClient = createEventAdminClient();

    // Get API logs
    let apiLogsQuery = adminClient
      .from('event_api_logs')
      .select('path, status_code, duration_ms, created_at')
      .gte('created_at', startDate.toISOString());

    // Filter by partner if not owner
    if (user.role !== 'owner' && user.partner_id) {
      apiLogsQuery = apiLogsQuery.eq('partner_id', user.partner_id);
    }

    const { data: apiLogs } = await apiLogsQuery;
    const logs = apiLogs || [];

    // Calculate API stats
    const totalRequests = logs.length;
    const successfulRequests = logs.filter(l => l.status_code >= 200 && l.status_code < 300).length;
    const avgDuration = totalRequests > 0
      ? logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / totalRequests
      : 0;

    const requestsByEndpoint: Record<string, number> = {};
    const requestsByStatus: Record<number, number> = {};

    logs.forEach(log => {
      requestsByEndpoint[log.path] = (requestsByEndpoint[log.path] || 0) + 1;
      requestsByStatus[log.status_code] = (requestsByStatus[log.status_code] || 0) + 1;
    });

    // Get error logs
    let errorLogsQuery = adminClient
      .from('event_error_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (user.role !== 'owner' && user.partner_id) {
      errorLogsQuery = errorLogsQuery.eq('partner_id', user.partner_id);
    }

    const { data: errorLogs } = await errorLogsQuery;
    const errors = errorLogs || [];

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    errors.forEach(error => {
      errorsByType[error.error_type] = (errorsByType[error.error_type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    // Check system health
    const systemHealth = await checkSystemHealth(adminClient);

    return NextResponse.json({
      api_stats: {
        total_requests: totalRequests,
        success_rate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
        avg_duration_ms: Math.round(avgDuration),
        requests_by_endpoint: requestsByEndpoint,
        requests_by_status: requestsByStatus,
      },
      error_stats: {
        total_errors: errors.length,
        errors_by_type: errorsByType,
        errors_by_severity: errorsBySeverity,
        recent_errors: errors.slice(0, 20),
      },
      system_health: systemHealth,
    });
  } catch (error: any) {
    console.error('Monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data', message: error.message },
      { status: 500 }
    );
  }
}

async function checkSystemHealth(client: ReturnType<typeof createEventAdminClient>) {
  const health: {
    database: 'healthy' | 'degraded' | 'down';
    api: 'healthy' | 'degraded' | 'down';
    storage: 'healthy' | 'degraded' | 'down';
    webhooks: 'healthy' | 'degraded' | 'down';
  } = {
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    webhooks: 'healthy',
  };

  try {
    // Check database
    const dbStart = Date.now();
    const { error: dbError } = await client.from('event_events').select('id').limit(1);
    const dbDuration = Date.now() - dbStart;

    if (dbError) {
      health.database = 'down';
    } else if (dbDuration > 1000) {
      health.database = 'degraded';
    }
  } catch {
    health.database = 'down';
  }

  try {
    // Check recent API error rate
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await client
      .from('event_api_logs')
      .select('status_code')
      .gte('created_at', oneHourAgo);

    if (recentLogs && recentLogs.length > 0) {
      const errorCount = recentLogs.filter(l => l.status_code >= 500).length;
      const errorRate = (errorCount / recentLogs.length) * 100;

      if (errorRate > 10) {
        health.api = 'down';
      } else if (errorRate > 5) {
        health.api = 'degraded';
      }
    }
  } catch {
    // Keep as healthy if we can't check
  }

  try {
    // Check recent webhook delivery rate
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: webhookLogs } = await client
      .from('event_webhook_logs')
      .select('response_status, error_message')
      .gte('sent_at', oneHourAgo);

    if (webhookLogs && webhookLogs.length > 0) {
      const failedCount = webhookLogs.filter(l => l.error_message || (l.response_status && l.response_status >= 400)).length;
      const failRate = (failedCount / webhookLogs.length) * 100;

      if (failRate > 50) {
        health.webhooks = 'down';
      } else if (failRate > 20) {
        health.webhooks = 'degraded';
      }
    }
  } catch {
    // Keep as healthy if we can't check
  }

  return health;
}

