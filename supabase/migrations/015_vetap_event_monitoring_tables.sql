-- =====================================================
-- Migration: VETAP Event Monitoring Tables
-- المرحلة 13: جداول التحليلات و Monitoring
-- =====================================================

-- 1. API Logs Table
CREATE TABLE IF NOT EXISTS event_api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  user_id UUID REFERENCES event_users(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES event_partners(id) ON DELETE SET NULL,
  request_body JSONB,
  response_body JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for API logs
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON event_api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_partner_id ON event_api_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON event_api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_status_code ON event_api_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_logs_path ON event_api_logs(path);

-- 2. Error Logs Table
CREATE TABLE IF NOT EXISTS event_error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  user_id UUID REFERENCES event_users(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES event_partners(id) ON DELETE SET NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'error',
  source VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- Indexes for Error logs
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON event_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON event_error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON event_error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON event_error_logs(source);

-- 3. Performance Logs Table
CREATE TABLE IF NOT EXISTS event_performance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  value DECIMAL(15, 4) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  tags JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Performance logs
CREATE INDEX IF NOT EXISTS idx_perf_logs_created_at ON event_performance_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perf_logs_metric_name ON event_performance_logs(metric_name);

-- 4. Enable RLS
ALTER TABLE event_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_performance_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for API logs
-- Owners can view all
CREATE POLICY "Owners can view all API logs"
  ON event_api_logs FOR SELECT
  USING (is_user_owner());

-- Partner admins can view their own partner's logs
CREATE POLICY "Partner admins can view own API logs"
  ON event_api_logs FOR SELECT
  USING (
    get_user_role() = 'partner_admin' AND
    partner_id = get_current_user_partner_id()
  );

-- System can insert logs
CREATE POLICY "System can insert API logs"
  ON event_api_logs FOR INSERT
  WITH CHECK (true);

-- 6. RLS Policies for Error logs
-- Owners can view all
CREATE POLICY "Owners can view all error logs"
  ON event_error_logs FOR SELECT
  USING (is_user_owner());

-- Partner admins can view their own partner's logs
CREATE POLICY "Partner admins can view own error logs"
  ON event_error_logs FOR SELECT
  USING (
    get_user_role() = 'partner_admin' AND
    partner_id = get_current_user_partner_id()
  );

-- System can insert logs
CREATE POLICY "System can insert error logs"
  ON event_error_logs FOR INSERT
  WITH CHECK (true);

-- 7. RLS Policies for Performance logs
-- Owners can view all
CREATE POLICY "Owners can view all perf logs"
  ON event_performance_logs FOR SELECT
  USING (is_user_owner());

-- System can insert logs
CREATE POLICY "System can insert perf logs"
  ON event_performance_logs FOR INSERT
  WITH CHECK (true);

-- 8. Auto-cleanup function for old logs (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  -- Delete API logs older than 30 days
  DELETE FROM event_api_logs WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete error logs older than 90 days
  DELETE FROM event_error_logs WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete performance logs older than 7 days
  DELETE FROM event_performance_logs WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create scheduled cleanup (if pg_cron is available)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-event-logs', '0 3 * * *', 'SELECT cleanup_old_logs();');

-- 10. Comments
COMMENT ON TABLE event_api_logs IS 'API request/response logs for monitoring';
COMMENT ON TABLE event_error_logs IS 'Error tracking logs';
COMMENT ON TABLE event_performance_logs IS 'Performance metrics logs';
COMMENT ON FUNCTION cleanup_old_logs IS 'Cleanup old monitoring logs';

-- 11. Analytics materialized views (optional - for faster queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_api_stats AS
SELECT 
  DATE(created_at) as date,
  path,
  COUNT(*) as request_count,
  AVG(duration_ms) as avg_duration,
  COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as success_count,
  COUNT(*) FILTER (WHERE status_code >= 400) as error_count
FROM event_api_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), path;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_api_stats 
  ON mv_daily_api_stats(date, path);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_api_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_api_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Event statistics view
CREATE OR REPLACE VIEW v_event_statistics AS
SELECT 
  e.id as event_id,
  e.name as event_name,
  e.partner_id,
  e.starts_at,
  e.ends_at,
  e.status,
  (SELECT COUNT(*) FROM event_guests g WHERE g.event_id = e.id) as total_guests,
  (SELECT COUNT(*) FROM event_passes p WHERE p.event_id = e.id) as total_passes,
  (SELECT COUNT(*) FROM event_passes p WHERE p.event_id = e.id AND p.status = 'used') as passes_used,
  (SELECT COUNT(*) FROM event_passes p WHERE p.event_id = e.id AND p.status = 'unused') as passes_unused,
  (SELECT COUNT(*) FROM event_passes p WHERE p.event_id = e.id AND p.status = 'revoked') as passes_revoked,
  (SELECT COUNT(*) FROM event_scan_logs s WHERE s.event_id = e.id) as total_scans,
  (SELECT COUNT(*) FROM event_scan_logs s WHERE s.event_id = e.id AND s.result = 'valid') as valid_scans,
  (SELECT COUNT(*) FROM event_scan_logs s WHERE s.event_id = e.id AND s.result != 'valid') as invalid_scans
FROM event_events e;

COMMENT ON VIEW v_event_statistics IS 'Pre-aggregated event statistics for dashboards';

