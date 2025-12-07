/**
 * VETAP Event - Analytics API
 * GET /api/event/analytics/[eventId]
 * 
 * Get comprehensive analytics for an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEventAdminClient } from '@/lib/supabase/event-admin';
import { authenticateRequest } from '@/lib/event/api-auth';

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { eventId } = await context.params;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'all';

    const adminClient = createEventAdminClient();

    // Get date filter
    let dateFilter: string | null = null;
    const now = new Date();
    
    switch (range) {
      case 'today':
        dateFilter = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case 'week':
        dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case 'month':
        dateFilter = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        break;
    }

    // Fetch event
    const { data: event, error: eventError } = await adminClient
      .from('event_events')
      .select('id, name, description, venue, starts_at, ends_at, status, partner_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify access
    const user = authResult.user;
    if (user.role !== 'owner' && event.partner_id !== user.partner_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get guest count
    const { count: totalGuests } = await adminClient
      .from('event_guests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);

    // Get pass statistics
    const { data: passStats } = await adminClient
      .from('event_passes')
      .select('status')
      .eq('event_id', eventId);

    const passes = passStats || [];
    const totalPasses = passes.length;
    const passesUsed = passes.filter(p => p.status === 'used').length;
    const passesUnused = passes.filter(p => p.status === 'unused').length;
    const passesRevoked = passes.filter(p => p.status === 'revoked').length;

    // Get scan logs with date filter
    let scanQuery = adminClient
      .from('event_scan_logs')
      .select('id, result, scanned_at, gate_id, guest_id, pass_id')
      .eq('event_id', eventId);

    if (dateFilter) {
      scanQuery = scanQuery.gte('scanned_at', dateFilter);
    }

    const { data: scanLogs } = await scanQuery;
    const scans = scanLogs || [];

    // Calculate invalid attempts
    const invalidAttempts = scans.filter(s => 
      ['invalid', 'already_used', 'expired', 'revoked', 'not_allowed_zone'].includes(s.result)
    ).length;

    // Calculate attendance rate
    const attendanceRate = totalPasses > 0 
      ? (passesUsed / totalPasses) * 100 
      : 0;

    // Get gate statistics
    const { data: gates } = await adminClient
      .from('event_gates')
      .select('id, name')
      .eq('event_id', eventId);

    const gateStats = (gates || []).map(gate => {
      const gateScans = scans.filter(s => s.gate_id === gate.id);
      const validScans = gateScans.filter(s => s.result === 'valid').length;
      const invalidScans = gateScans.filter(s => s.result !== 'valid').length;
      
      return {
        gate_id: gate.id,
        gate_name: gate.name,
        total_scans: gateScans.length,
        valid_scans: validScans,
        invalid_scans: invalidScans,
        activity_percentage: scans.length > 0 
          ? (gateScans.length / scans.length) * 100 
          : 0,
      };
    }).sort((a, b) => b.total_scans - a.total_scans);

    // Calculate hourly statistics
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
      const hourScans = scans.filter(s => {
        const scanHour = new Date(s.scanned_at).getHours();
        return scanHour === hour;
      });

      return {
        hour,
        count: hourScans.length,
        valid: hourScans.filter(s => s.result === 'valid').length,
        invalid: hourScans.filter(s => s.result !== 'valid').length,
      };
    });

    // Calculate daily statistics
    const dailyMap = new Map<string, { count: number; valid: number; invalid: number }>();
    
    scans.forEach(scan => {
      const date = new Date(scan.scanned_at).toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { count: 0, valid: 0, invalid: 0 };
      existing.count++;
      if (scan.result === 'valid') {
        existing.valid++;
      } else {
        existing.invalid++;
      }
      dailyMap.set(date, existing);
    });

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get guest type statistics
    const { data: guestTypes } = await adminClient
      .from('event_guests')
      .select('id, type')
      .eq('event_id', eventId);

    const { data: guestPasses } = await adminClient
      .from('event_passes')
      .select('guest_id, status')
      .eq('event_id', eventId);

    const typeMap = new Map<string, { count: number; checked_in: number }>();
    
    (guestTypes || []).forEach(guest => {
      const type = guest.type || 'Regular';
      const existing = typeMap.get(type) || { count: 0, checked_in: 0 };
      existing.count++;
      
      const pass = (guestPasses || []).find(p => p.guest_id === guest.id);
      if (pass?.status === 'used') {
        existing.checked_in++;
      }
      
      typeMap.set(type, existing);
    });

    const guestTypeStats = Array.from(typeMap.entries())
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        checked_in: stats.checked_in,
        percentage: stats.count > 0 ? (stats.checked_in / stats.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Get recent scans with guest and gate names
    const recentScansQuery = adminClient
      .from('event_scan_logs')
      .select(`
        id,
        result,
        scanned_at,
        guest_id,
        gate_id
      `)
      .eq('event_id', eventId)
      .order('scanned_at', { ascending: false })
      .limit(50);

    const { data: recentScansData } = await recentScansQuery;

    // Enrich with guest and gate names
    const guestIds = [...new Set((recentScansData || []).map(s => s.guest_id).filter(Boolean))];
    const gateIds = [...new Set((recentScansData || []).map(s => s.gate_id).filter(Boolean))];

    const { data: guestsData } = guestIds.length > 0
      ? await adminClient.from('event_guests').select('id, full_name').in('id', guestIds)
      : { data: [] };

    const { data: gatesData } = gateIds.length > 0
      ? await adminClient.from('event_gates').select('id, name').in('id', gateIds)
      : { data: [] };

    const guestMap = new Map((guestsData || []).map(g => [g.id, g.full_name]));
    const gateMap = new Map((gatesData || []).map(g => [g.id, g.name]));

    const recentScans = (recentScansData || []).map(scan => ({
      id: scan.id,
      result: scan.result,
      scanned_at: scan.scanned_at,
      guest_name: scan.guest_id ? guestMap.get(scan.guest_id) : null,
      gate_name: scan.gate_id ? gateMap.get(scan.gate_id) : null,
    }));

    return NextResponse.json({
      event_stats: {
        event,
        total_guests: totalGuests || 0,
        total_passes: totalPasses,
        passes_used: passesUsed,
        passes_unused: passesUnused,
        passes_revoked: passesRevoked,
        attendance_rate: attendanceRate,
        invalid_attempts: invalidAttempts,
        total_scans: scans.length,
      },
      gate_stats: gateStats,
      hourly_stats: hourlyStats,
      daily_stats: dailyStats,
      guest_type_stats: guestTypeStats,
      recent_scans: recentScans,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', message: error.message },
      { status: 500 }
    );
  }
}

