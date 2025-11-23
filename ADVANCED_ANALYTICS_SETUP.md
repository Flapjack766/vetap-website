# Advanced Analytics System Setup Guide

## Overview

This document describes the enterprise-grade analytics system implemented for VETAP. The system includes:

- **Event Tracking**: Comprehensive event tracking with categories, labels, and values
- **Conversion Tracking**: Goal-based conversion tracking with attribution
- **Session Management**: Advanced session tracking with engagement metrics
- **User Journey**: Complete user path tracking
- **Real-time Analytics**: Live visitor tracking
- **Funnel Analysis**: Conversion funnel visualization
- **Engagement Metrics**: Scroll depth, time on page, click tracking

## Database Setup

### 1. Run Migration

Execute the migration file to create all necessary tables:

```sql
-- Run this in your Supabase SQL editor
\i supabase/migrations/001_advanced_analytics.sql
```

Or manually execute the SQL from `supabase/migrations/001_advanced_analytics.sql`

### 2. Verify Tables

The following tables should be created:

- `analytics_conversions` - Conversion events
- `analytics_goals` - Goal definitions
- `analytics_sessions` - Session-level data
- `analytics_user_journey` - User path tracking

The `analytics_events` table will be enhanced with:
- `event_category` (VARCHAR)
- `event_label` (VARCHAR)
- `event_value` (DECIMAL)

## Features

### Event Tracking

Track any custom event with:

```typescript
import { getAnalyticsTracker } from '@/lib/analytics/tracker';

const tracker = getAnalyticsTracker();
tracker.setProfileId(profileId);

// Track custom event
tracker.trackEvent({
  event_type: 'button_click',
  event_category: 'engagement',
  event_label: 'cta_button',
  event_value: 1,
  metadata: {
    button_id: 'signup-btn',
    button_text: 'Sign Up',
  },
});
```

### Conversion Tracking

Track conversions and goals:

```typescript
// Track conversion
tracker.trackConversion({
  conversion_type: 'form_submit',
  conversion_value: 100,
  goal_id: 'contact_form',
  metadata: {
    form_name: 'contact',
  },
});

// Track goal
tracker.trackGoal('signup_complete', 50);
```

### Automatic Tracking

The system automatically tracks:

- **Page Views**: With metadata (screen size, viewport, timezone)
- **Scroll Depth**: Milestones at 25%, 50%, 75%, 90%, 100%
- **Click Events**: Links (internal/external) and buttons
- **Form Interactions**: Focus, submit events
- **Time on Page**: Calculated on page exit
- **Engagement Score**: Based on user actions

### Real-time Analytics

Access real-time data via:

```
GET /api/analytics/realtime?profile_id={profile_id}
```

Returns:
- Active visitors count
- Active sessions
- Recent events (last 5 minutes)
- Recent conversions (last 5 minutes)

### Funnel Analysis

Analyze conversion funnels:

```
GET /api/analytics/funnel?profile_id={profile_id}&steps=page:/home,page:/services,event:form_submit&time_range=30d
```

Steps format:
- `page:/path` - Page view on specific path
- `event:event_name` - Custom event
- Plain text - Event label

## API Endpoints

### Track Event
```
POST /api/analytics/track
Body: {
  profile_id: string,
  event_type: string,
  event_category?: string,
  event_label?: string,
  event_value?: number,
  page_path?: string,
  session_id?: string,
  metadata?: object
}
```

### Track Conversion
```
POST /api/analytics/conversion
Body: {
  profile_id: string,
  conversion_type: string,
  conversion_value?: number,
  goal_id?: string,
  session_id?: string,
  metadata?: object
}
```

### Real-time Data
```
GET /api/analytics/realtime?profile_id={profile_id}
```

### Funnel Analysis
```
GET /api/analytics/funnel?profile_id={profile_id}&steps={step1,step2,...}&time_range={7d|30d|90d|all}
```

## Dashboard Integration

The analytics dashboard (`AnalyticsTab`) has been enhanced to show:

- Real-time visitor count
- Conversion metrics
- Goal completion rates
- Funnel visualization
- Engagement metrics
- User journey paths

## Privacy & Performance

- **Privacy-first**: No PII collection, IP addresses stored as INET type
- **Batch Processing**: Events are batched and flushed every 5 seconds
- **Error Handling**: Graceful degradation, doesn't interrupt user experience
- **Rate Limiting**: Built-in rate limiting on API endpoints

## Next Steps

1. Run the database migration
2. Test event tracking on a profile page
3. Set up goals in the dashboard
4. Configure conversion funnels
5. Monitor real-time analytics

## Support

For issues or questions, check:
- Database migration logs
- API error logs
- Browser console for client-side errors

