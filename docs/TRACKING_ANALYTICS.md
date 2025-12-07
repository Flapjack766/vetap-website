# Tracking Analytics Documentation

## Overview

The Tracking Analytics page provides comprehensive analytics for tracking events. It allows users to analyze clicks, visits, and user behavior across their businesses, branches, cards, and links.

## Access

**Path:** `/dashboard/tracking/analytics`

**Requirements:**
- User must have approved branch tracking dashboard access
- User must be authenticated

## Features

### 1. Filters

#### Business Selection
- **Required**: Select a business to view analytics
- Auto-selects first business if available
- Filters all data by `business_id`

#### Branch Selection (Optional)
- Filter analytics by specific branch
- "All" option to view all branches
- Disabled until business is selected

#### Time Range
- **Today**: Events from today only
- **7 Days**: Events from last 7 days
- **30 Days**: Events from last 30 days

#### View Level
- **Total**: Aggregate view across all branches/cards/links
- **By Branch**: Breakdown by each branch
- **By Card**: Breakdown by each NFC card
- **By Link**: Breakdown by each tracking link

### 2. Summary Statistics

Displays key metrics:
- **Total Clicks**: Total number of tracking events
- **Countries**: Number of unique countries
- **Cities**: Number of unique cities
- **Devices**: Number of unique device types

### 3. Charts

#### Line Chart - Clicks Over Time
- Shows daily click count over selected time range
- X-axis: Dates
- Y-axis: Number of clicks
- Helps identify trends and peak times

#### Bar Chart - Comparison
- **By Branch**: Compares clicks across branches
- **By Card**: Compares clicks across NFC cards
- **By Link**: Compares clicks across tracking links
- X-axis: Branch/Card/Link name
- Y-axis: Number of clicks

### 4. Data Table

Displays detailed breakdown based on view level:

#### Total View
- City
- Country
- Clicks

#### By Branch View
- Branch Name
- Cities (top 3)
- Countries (top 3)
- Total Clicks

#### By Card View
- Card Label
- Cities (top 3)
- Countries (top 3)
- Total Clicks

#### By Link View
- Link Slug (/r/[slug])
- Cities (top 3)
- Countries (top 3)
- Total Clicks

### 5. Export Functionality

- **Export Button**: Exports table data as CSV
- Includes all visible columns
- Filename: `analytics-[timeRange]-[viewLevel]-[date].csv`

## API Integration

### Analytics Endpoint

**GET** `/api/tracking/analytics`

**Query Parameters:**
```typescript
{
  business_id: string;        // Required: UUID
  time_range?: 'today' | '7days' | '30days';  // Default: '7days'
  view_level?: 'total' | 'by_branch' | 'by_card' | 'by_link';  // Default: 'total'
  branch_id?: string;         // Optional: UUID
  card_id?: string;           // Optional: UUID
  tracking_link_id?: string;  // Optional: UUID
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    // Structure depends on view_level
    totalClicks?: number;
    byCountry?: Array<{ country: string; count: number }>;
    byCity?: Array<{ city: string; count: number }>;
    byDevice?: Array<{ device: string; count: number }>;
    branches?: Array<{...}>;
    cards?: Array<{...}>;
    links?: Array<{...}>;
  };
  timeSeries: Array<{
    date: string;
    clicks: number;
    formattedDate: string;
  }>;
  totalEvents: number;
  timeRange: {
    start: string;  // ISO date
    end: string;    // ISO date
  };
}
```

## Database Indexes

The following indexes are critical for performance:

```sql
-- Primary indexes
CREATE INDEX idx_tracking_events_business_id ON tracking_events(business_id);
CREATE INDEX idx_tracking_events_timestamp ON tracking_events(timestamp DESC);
CREATE INDEX idx_tracking_events_business_timestamp ON tracking_events(business_id, timestamp DESC);

-- Secondary indexes
CREATE INDEX idx_tracking_events_branch_id ON tracking_events(branch_id);
CREATE INDEX idx_tracking_events_tracking_link_id ON tracking_events(tracking_link_id);
CREATE INDEX idx_tracking_events_card_id ON tracking_events(card_id) WHERE card_id IS NOT NULL;
CREATE INDEX idx_tracking_events_branch_timestamp ON tracking_events(branch_id, timestamp DESC);
```

These indexes ensure:
- Fast filtering by `business_id`
- Efficient time range queries
- Quick lookups by branch, card, or link

## Query Optimization

The API route uses:
1. **Filtered Queries**: Always filters by `business_id` first
2. **Time Range Filtering**: Uses `timestamp >= startDate AND timestamp <= endDate`
3. **Selective Fields**: Only selects needed columns
4. **Efficient Joins**: Uses Supabase's built-in join syntax
5. **Indexed Columns**: All filter columns are indexed

## Performance Considerations

### For Large Datasets

1. **Time Range**: Limit to 30 days for best performance
2. **Pagination**: Consider adding pagination for tables with > 100 rows
3. **Caching**: API responses can be cached for 60 seconds (revalidate: 60)
4. **Aggregation**: Consider pre-aggregating data in a materialized view for very large datasets

### Query Patterns

The most efficient queries:
- Filter by `business_id` + `timestamp` (uses composite index)
- Filter by `business_id` + `branch_id` + `timestamp`
- Filter by `business_id` + `tracking_link_id` + `timestamp`

## Data Processing

### Time Series Processing

1. Initialize all dates in range with 0 clicks
2. Count events per date
3. Format dates for display
4. Sort chronologically

### Aggregation Processing

1. **By Branch**: Groups events by `branch_id`, counts clicks, aggregates countries/cities
2. **By Card**: Groups events by `card_id`, counts clicks, aggregates countries/cities
3. **By Link**: Groups events by `tracking_link_id`, counts clicks, aggregates countries/cities
4. **Total**: Aggregates all events, counts unique countries/cities/devices

## Future Enhancements

1. **Real-time Updates**: WebSocket or polling for live data
2. **Advanced Filters**: Device type, country, city filters
3. **Date Range Picker**: Custom date range selection
4. **More Charts**: Pie charts, heatmaps, geographic maps
5. **Drill-down**: Click on chart/table item to see details
6. **Scheduled Reports**: Email reports on schedule
7. **Comparison Mode**: Compare two time periods side-by-side
8. **Funnel Analysis**: Track user journey through links
9. **Conversion Tracking**: Track if users completed actions (e.g., left review)

## File Structure

```
app/[locale]/dashboard/tracking/analytics/
└── page.tsx                    # Page with auth check

app/(components)/dashboard/tracking/analytics/
└── TrackingAnalytics.tsx        # Main analytics component

app/api/tracking/
└── analytics/route.ts          # API route for analytics data
```

## Testing

1. **Create Test Events:**
   ```sql
   INSERT INTO tracking_events (
     tracking_link_id, branch_id, business_id,
     country, city, device_type, timestamp
   ) VALUES (
     'link-uuid', 'branch-uuid', 'business-uuid',
     'Saudi Arabia', 'Riyadh', 'mobile', NOW()
   );
   ```

2. **Test Filters:**
   - Select business → verify data loads
   - Change time range → verify data updates
   - Change view level → verify charts/table update
   - Select branch → verify filtered data

3. **Test Charts:**
   - Verify line chart shows time series
   - Verify bar chart shows comparison
   - Verify charts are responsive

4. **Test Export:**
   - Click export button
   - Verify CSV downloads
   - Verify CSV contains correct data

