# Analytics & Visitor Tracking System

## Overview
A professional, high-precision analytics and visitor tracking system for profile pages. This system tracks detailed visitor data including page views, device information, geographic location, traffic sources, and more.

## Features

### 📊 Core Analytics
- **Total Views**: Track all page views
- **Unique Visitors**: Count distinct visitors using session IDs
- **Unique IPs**: Track unique IP addresses
- **Countries**: Geographic distribution of visitors
- **Engagement Rate**: Return visitor percentage

### 📱 Device Tracking
- Device type (Desktop, Mobile, Tablet)
- Browser information (Chrome, Firefox, Safari, Edge, etc.)
- Operating System (Windows, macOS, Linux, Android, iOS)
- Screen dimensions

### 🌍 Geographic Data
- Country-level tracking
- City-level tracking (ready for geolocation API integration)

### 🔗 Traffic Sources
- Referrer tracking
- Direct traffic identification
- Top traffic sources analysis

### 📈 Time-based Analysis
- Daily statistics
- Customizable time ranges (7 days, 30 days, 90 days, all time)
- Historical data visualization

## Setup Instructions

### 1. Database Setup
Run the SQL schema in Supabase SQL Editor:

```bash
# Run this file in Supabase SQL Editor
supabase/analytics-schema.sql
```

This will create:
- `analytics_events` table
- Indexes for performance
- RLS policies for security
- Views for aggregated data

### 2. RLS Policies
The schema includes:
- **Users can view own analytics**: Authenticated users can only see analytics for their own profiles
- **Public can insert analytics events**: Allows tracking without authentication
- **Admin can view all analytics**: Admins can see all analytics data

### 3. API Route
The tracking API is available at:
```
POST /api/analytics/track
```

### 4. Frontend Integration
The `AnalyticsTracker` component automatically tracks page views when a profile page is loaded.

## Usage

### Automatic Tracking
Page views are automatically tracked when users visit profile pages. The `AnalyticsTracker` component:
- Generates/retrieves session IDs
- Captures device and browser information
- Sends tracking data to the API
- Runs silently without affecting user experience

### Viewing Analytics
1. Log in to your dashboard
2. Navigate to the "Analytics" tab
3. View comprehensive statistics and visualizations

### Analytics Dashboard Features

#### Overview Tab
- Daily views chart
- Device breakdown summary
- Key metrics cards

#### Devices Tab
- Detailed device, browser, and OS breakdown
- Percentage distribution
- Unique visitor counts per device type

#### Traffic Sources Tab
- Top referrers
- Direct vs. referred traffic
- Domain-level analysis

#### Locations Tab
- Top countries by visits
- Geographic distribution
- Unique visitors per country

## Data Privacy

- IP addresses are stored but can be anonymized
- No personal information is collected
- All tracking is transparent and GDPR-compliant
- Users can opt-out by disabling JavaScript (though this will affect site functionality)

## Performance

- Efficient database queries with proper indexing
- Client-side aggregation for real-time stats
- Minimal performance impact on page load
- Optimized for large datasets

## Future Enhancements

Potential improvements:
- Real-time geolocation API integration (MaxMind, ipapi.co)
- Click tracking on links
- Download tracking for vCards
- Export analytics data (CSV, JSON)
- Email reports
- Custom date range selection
- Comparison between time periods
- Heatmaps and user flow analysis

## Technical Details

### Database Schema
- `analytics_events`: Main table storing all tracking events
- Indexes on: `profile_id`, `created_at`, `event_type`, `session_id`, `country`
- Views for aggregated statistics

### API Endpoint
- Method: POST
- Body: JSON with `profile_id`, `event_type`, `page_path`, `session_id`, `screen_width`, `screen_height`
- Returns: Success/error status

### Client Component
- `AnalyticsTracker`: React component that tracks page views
- Uses `useEffect` to track once per page load
- Stores session ID in `sessionStorage`
- Handles errors gracefully

## Troubleshooting

### No data showing
1. Check if `analytics_events` table exists
2. Verify RLS policies are set correctly
3. Check browser console for errors
4. Ensure API route is accessible

### Performance issues
1. Check database indexes are created
2. Verify queries are using indexes
3. Consider pagination for large datasets
4. Use time range filters

### Privacy concerns
- IP addresses can be anonymized in the schema
- Consider adding a privacy policy
- Implement opt-out mechanisms if needed

