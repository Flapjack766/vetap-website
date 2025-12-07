# Google Business Profile Integration

## Overview

This integration allows businesses to connect their Google Business Profile accounts to automatically sync review data (total reviews, average rating) and display it alongside NFC tracking analytics.

## Setup Instructions

### 1. Google Cloud Project Setup (One-time, outside code)

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project named `vetap-business-analytics`

2. **Enable APIs**
   - Navigate to "APIs & Services" > "Library"
   - Enable "Google Business Profile API" (may be listed as "Business Profile API")

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Application type: **External**
   - App name: `VETAP – Business Analytics`
   - User support email: Your support email
   - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/business.manage` (Read-only for reviews)

4. **Create OAuth 2.0 Client ID**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Authorized redirect URIs:
     - Production: `https://vetaps.com/api/google-business/oauth/callback`
     - Development: `http://localhost:3000/api/google-business/oauth/callback`

5. **Save Credentials**
   - Copy `Client ID` and `Client Secret`
   - Add to environment variables:
     ```
     GOOGLE_BUSINESS_CLIENT_ID=your_client_id_here
     GOOGLE_BUSINESS_CLIENT_SECRET=your_client_secret_here
     ```

### 2. Database Setup

The migration `007_google_business_connections.sql` creates:
- `google_business_connections` table for storing OAuth tokens
- RLS policies for secure access
- Indexes for performance

Run the migration:
```bash
# Using Supabase CLI
supabase migration up
```

### 3. Environment Variables

Add to `.env.local` (development) and production environment:

```env
GOOGLE_BUSINESS_CLIENT_ID=your_client_id
GOOGLE_BUSINESS_CLIENT_SECRET=your_client_secret
SITE_URL=https://vetaps.com  # or http://localhost:3000 for dev
CRON_SECRET=your_random_secret  # For securing cron endpoint
```

### 4. Cron Job Setup

The system uses Vercel Cron (configured in `vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/google-business/sync-reviews",
      "schedule": "0 * * * *"  // Every hour
    }
  ]
}
```

**Alternative:** If not using Vercel, set up a cron job to call:
```
POST https://vetaps.com/api/google-business/sync-reviews
Authorization: Bearer YOUR_CRON_SECRET
```

## User Flow

### 1. Connect Google Business Account

1. User navigates to Branch Tracking Dashboard
2. Selects a business
3. Opens "Settings" tab
4. Toggles "Enable Google Reviews Sync"
5. Clicks "Connect Google Business Account"
6. Redirected to Google OAuth consent screen
7. User authorizes access
8. Redirected back to dashboard with connection established

### 2. Automatic Sync

- Cron job runs every hour
- Fetches review data for all connected businesses
- Updates `review_sync` table with latest data
- Calculates `new_reviews_count` (difference from last sync)

### 3. View Analytics

- User navigates to Analytics page
- Selects business and time range
- Views:
  - Clicks over time (from tracking events)
  - Reviews over time (from Google sync)
  - Conversion estimate (new reviews / total clicks)

## API Endpoints

### OAuth Start
**GET** `/api/google-business/oauth/start?businessId={uuid}`

Initiates OAuth flow. Redirects to Google.

### OAuth Callback
**GET** `/api/google-business/oauth/callback?code={code}&state={state}`

Handles OAuth callback, exchanges code for tokens, stores connection.

### Sync Reviews
**POST** `/api/google-business/sync-reviews`

Synchronizes reviews for all connected businesses. Called by cron job.

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "synced": 5,
  "errors": []
}
```

## Database Schema

### google_business_connections

```sql
CREATE TABLE google_business_connections (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  google_account_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### review_sync

```sql
CREATE TABLE review_sync (
  id BIGSERIAL PRIMARY KEY,
  branch_id UUID REFERENCES branches(id),
  business_id UUID REFERENCES businesses(id),
  synced_at TIMESTAMPTZ,
  total_reviews INTEGER,
  average_rating NUMERIC(3,2),
  new_reviews_count INTEGER,
  raw_payload JSONB
);
```

## Important Notes

### Google Place ID

Branches must have a `google_place_id` or `google_maps_url` for sync to work. The sync job only processes branches with this information.

### Token Refresh

Access tokens expire after 1 hour. The sync job automatically refreshes tokens using `refresh_token` when needed.

### API Rate Limits

Google Business Profile API has rate limits. The current implementation syncs once per hour to avoid hitting limits.

### Error Handling

- If token refresh fails, the connection is skipped
- If API call fails, error is logged but doesn't stop other syncs
- Users can re-connect if connection fails

## Troubleshooting

### Connection Not Working

1. Check environment variables are set correctly
2. Verify redirect URI matches Google Cloud Console
3. Check browser console for OAuth errors
4. Verify business ownership in database

### Sync Not Working

1. Check cron job is running (Vercel dashboard)
2. Verify `CRON_SECRET` matches
3. Check branch has `google_place_id`
4. Review API logs for errors
5. Verify Google Business Profile API is enabled

### No Review Data

1. Ensure branch has `google_place_id` set
2. Verify Google Business Profile has reviews
3. Check `review_sync` table for recent entries
4. Verify connection is active (not expired)

## Security Considerations

1. **Token Storage**: Access tokens are stored encrypted in database
2. **RLS Policies**: Users can only access their own business connections
3. **Cron Secret**: Protects sync endpoint from unauthorized access
4. **State Parameter**: Prevents CSRF attacks in OAuth flow

## Future Enhancements

1. **Real-time Sync**: Webhook-based sync instead of polling
2. **Review Details**: Fetch individual review text and responses
3. **Review Notifications**: Alert users of new reviews
4. **Multi-location Support**: Sync multiple locations per business
5. **Review Analytics**: Sentiment analysis, response rate tracking

