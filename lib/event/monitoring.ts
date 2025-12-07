/**
 * VETAP Event - Monitoring & Logging Service
 * 
 * API logging, error tracking, and performance monitoring
 */

import { NextRequest } from 'next/server';
import { createEventAdminClient } from '@/lib/supabase/event-admin';

// ==================== Types ====================

export interface APILogEntry {
  id?: string;
  method: string;
  path: string;
  status_code: number;
  user_id?: string | null;
  partner_id?: string | null;
  request_body?: Record<string, any>;
  response_body?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  duration_ms: number;
  error_message?: string;
  created_at?: string;
}

export interface ErrorLogEntry {
  id?: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  context?: Record<string, any>;
  user_id?: string | null;
  partner_id?: string | null;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  created_at?: string;
}

export interface PerformanceMetric {
  id?: string;
  metric_name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  created_at?: string;
}

// ==================== Configuration ====================

const ENABLE_API_LOGGING = process.env.ENABLE_API_LOGGING !== 'false';
const ENABLE_ERROR_TRACKING = process.env.ENABLE_ERROR_TRACKING !== 'false';
const ENABLE_PERFORMANCE_MONITORING = process.env.ENABLE_PERFORMANCE_MONITORING !== 'false';

// External services (optional)
const SENTRY_DSN = process.env.SENTRY_DSN;

// ==================== API Logging ====================

/**
 * Log an API request/response
 */
export async function logAPIRequest(entry: APILogEntry): Promise<void> {
  if (!ENABLE_API_LOGGING) return;

  try {
    const adminClient = createEventAdminClient();
    
    await adminClient
      .from('event_api_logs')
      .insert({
        method: entry.method,
        path: entry.path,
        status_code: entry.status_code,
        user_id: entry.user_id,
        partner_id: entry.partner_id,
        request_body: entry.request_body ? sanitizeBody(entry.request_body) : null,
        response_body: entry.response_body ? sanitizeBody(entry.response_body) : null,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        duration_ms: entry.duration_ms,
        error_message: entry.error_message,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

/**
 * Create API logger middleware context
 */
export function createAPILogger(request: NextRequest) {
  const startTime = Date.now();
  const path = new URL(request.url).pathname;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || undefined;
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

  return {
    startTime,
    path,
    method,
    userAgent,
    ipAddress,

    async log(options: {
      statusCode: number;
      userId?: string | null;
      partnerId?: string | null;
      requestBody?: Record<string, any>;
      responseBody?: Record<string, any>;
      errorMessage?: string;
    }) {
      const duration = Date.now() - startTime;

      await logAPIRequest({
        method,
        path,
        status_code: options.statusCode,
        user_id: options.userId,
        partner_id: options.partnerId,
        request_body: options.requestBody,
        response_body: options.responseBody,
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: duration,
        error_message: options.errorMessage,
      });

      // Log slow requests
      if (duration > 1000) {
        await logPerformanceMetric({
          metric_name: 'api_slow_request',
          value: duration,
          unit: 'ms',
          tags: { path, method },
        });
      }
    },
  };
}

// ==================== Error Tracking ====================

/**
 * Log an error
 */
export async function logError(entry: ErrorLogEntry): Promise<void> {
  if (!ENABLE_ERROR_TRACKING) return;

  try {
    const adminClient = createEventAdminClient();
    
    await adminClient
      .from('event_error_logs')
      .insert({
        error_type: entry.error_type,
        error_message: entry.error_message,
        stack_trace: entry.stack_trace,
        context: entry.context,
        user_id: entry.user_id,
        partner_id: entry.partner_id,
        severity: entry.severity,
        source: entry.source,
        created_at: new Date().toISOString(),
      });

    // Send to external service if configured
    if (SENTRY_DSN && entry.severity === 'error' || entry.severity === 'critical') {
      await sendToSentry(entry);
    }
  } catch (error) {
    console.error('Failed to log error:', error);
  }
}

/**
 * Capture an exception
 */
export async function captureException(
  error: Error,
  context?: {
    userId?: string;
    partnerId?: string;
    source?: string;
    extra?: Record<string, any>;
  }
): Promise<void> {
  await logError({
    error_type: error.name,
    error_message: error.message,
    stack_trace: error.stack,
    context: context?.extra,
    user_id: context?.userId,
    partner_id: context?.partnerId,
    severity: 'error',
    source: context?.source || 'unknown',
  });
}

/**
 * Capture a message
 */
export async function captureMessage(
  message: string,
  severity: ErrorLogEntry['severity'] = 'info',
  context?: {
    userId?: string;
    partnerId?: string;
    source?: string;
    extra?: Record<string, any>;
  }
): Promise<void> {
  await logError({
    error_type: 'message',
    error_message: message,
    context: context?.extra,
    user_id: context?.userId,
    partner_id: context?.partnerId,
    severity,
    source: context?.source || 'unknown',
  });
}

// ==================== Performance Monitoring ====================

/**
 * Log a performance metric
 */
export async function logPerformanceMetric(metric: PerformanceMetric): Promise<void> {
  if (!ENABLE_PERFORMANCE_MONITORING) return;

  try {
    const adminClient = createEventAdminClient();
    
    await adminClient
      .from('event_performance_logs')
      .insert({
        metric_name: metric.metric_name,
        value: metric.value,
        unit: metric.unit,
        tags: metric.tags,
        created_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Failed to log performance metric:', error);
  }
}

/**
 * Create a timer for measuring operations
 */
export function createTimer(metricName: string, tags?: Record<string, string>) {
  const startTime = Date.now();

  return {
    end: async () => {
      const duration = Date.now() - startTime;
      await logPerformanceMetric({
        metric_name: metricName,
        value: duration,
        unit: 'ms',
        tags,
      });
      return duration;
    },
  };
}

/**
 * Track a counter metric
 */
export async function incrementCounter(
  metricName: string,
  value: number = 1,
  tags?: Record<string, string>
): Promise<void> {
  await logPerformanceMetric({
    metric_name: metricName,
    value,
    unit: 'count',
    tags,
  });
}

// ==================== Helper Functions ====================

/**
 * Sanitize request/response body to remove sensitive data
 */
function sanitizeBody(body: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'authorization'];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(body)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Send error to Sentry (stub - implement with actual Sentry SDK)
 */
async function sendToSentry(entry: ErrorLogEntry): Promise<void> {
  if (!SENTRY_DSN) return;

  try {
    // This is a stub - in production, use @sentry/nextjs
    console.log('[Sentry] Would send error:', entry.error_message);
    
    // Example with fetch to Sentry API:
    // await fetch(`${SENTRY_DSN}/api/store/`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     exception: { values: [{ type: entry.error_type, value: entry.error_message }] },
    //     level: entry.severity,
    //   }),
    // });
  } catch (error) {
    console.error('Failed to send to Sentry:', error);
  }
}

// ==================== Aggregation Queries ====================

/**
 * Get API usage statistics
 */
export async function getAPIUsageStats(
  partnerId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_requests: number;
  success_rate: number;
  avg_duration_ms: number;
  requests_by_endpoint: Record<string, number>;
  requests_by_status: Record<number, number>;
}> {
  const adminClient = createEventAdminClient();

  let query = adminClient
    .from('event_api_logs')
    .select('path, status_code, duration_ms');

  if (partnerId) {
    query = query.eq('partner_id', partnerId);
  }

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data: logs } = await query;

  if (!logs || logs.length === 0) {
    return {
      total_requests: 0,
      success_rate: 0,
      avg_duration_ms: 0,
      requests_by_endpoint: {},
      requests_by_status: {},
    };
  }

  const totalRequests = logs.length;
  const successfulRequests = logs.filter(l => l.status_code >= 200 && l.status_code < 300).length;
  const avgDuration = logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / totalRequests;

  const requestsByEndpoint: Record<string, number> = {};
  const requestsByStatus: Record<number, number> = {};

  logs.forEach(log => {
    requestsByEndpoint[log.path] = (requestsByEndpoint[log.path] || 0) + 1;
    requestsByStatus[log.status_code] = (requestsByStatus[log.status_code] || 0) + 1;
  });

  return {
    total_requests: totalRequests,
    success_rate: (successfulRequests / totalRequests) * 100,
    avg_duration_ms: Math.round(avgDuration),
    requests_by_endpoint: requestsByEndpoint,
    requests_by_status: requestsByStatus,
  };
}

/**
 * Get error statistics
 */
export async function getErrorStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_errors: number;
  errors_by_type: Record<string, number>;
  errors_by_severity: Record<string, number>;
  recent_errors: ErrorLogEntry[];
}> {
  const adminClient = createEventAdminClient();

  let query = adminClient
    .from('event_error_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data: errors } = await query;

  if (!errors || errors.length === 0) {
    return {
      total_errors: 0,
      errors_by_type: {},
      errors_by_severity: {},
      recent_errors: [],
    };
  }

  const errorsByType: Record<string, number> = {};
  const errorsBySeverity: Record<string, number> = {};

  errors.forEach(error => {
    errorsByType[error.error_type] = (errorsByType[error.error_type] || 0) + 1;
    errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
  });

  return {
    total_errors: errors.length,
    errors_by_type: errorsByType,
    errors_by_severity: errorsBySeverity,
    recent_errors: errors.slice(0, 20),
  };
}

