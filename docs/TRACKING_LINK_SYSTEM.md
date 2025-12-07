# Tracking Link System Documentation

## Overview

The tracking link system allows businesses to create unique short links that can be embedded in NFC cards or QR codes. Each click is tracked with detailed analytics, and the system can redirect users to Google Maps reviews, restaurant pages, menus, or custom URLs.

## Architecture

### Route Structure

```
/r/[slug]
├── route.ts          # API route for tracking and redirect logic
└── page.tsx          # Client component for intermediate pages
```

### Flow Diagram

```
User clicks /r/[slug]
         ↓
    route.ts (GET)
         ↓
1. Find tracking_link by slug
2. Log tracking_event
3. Check settings:
   ├─ Direct redirect? → Redirect to destination_url
   ├─ Show intermediate? → Redirect to page.tsx with query params
   └─ Collect feedback? → Redirect to page.tsx with feedback=true
         ↓
    page.tsx (if needed)
         ↓
   Show feedback form or intermediate page
         ↓
   Redirect to destination_url
```

## API Route: `/r/[slug]/route.ts`

### Responsibilities

1. **Find Tracking Link**: Query `tracking_links` table by slug
2. **Log Event**: Insert into `tracking_events` table with metadata
3. **Determine Redirect**: Based on `show_intermediate_page` and `collect_feedback_first`

### Event Logging

The route logs the following data for each click:

```typescript
{
  tracking_link_id: UUID,
  branch_id: UUID,
  business_id: UUID,
  card_id: UUID | null,  // If from NFC card
  ip_hash: string,       // SHA-256 hash of IP (privacy)
  country: string | null,
  city: string | null,
  user_agent: string | null,
  device_type: 'mobile' | 'tablet' | 'desktop',
  referrer: string | null,
  meta: {
    ip_source: string,   // First IP in chain (for debugging)
    timestamp: string,
  }
}
```

### Geolocation

The system tries multiple methods to get location:

1. **CDN Headers** (fastest): `cf-ipcountry`, `cf-ipcity` (Cloudflare)
2. **IP Geolocation Service**: Falls back to `getGeolocationFromIP()` which uses:
   - ipapi.co (primary)
   - ip-api.com (fallback)

### Redirect Logic

#### Case 1: Direct Redirect
```typescript
if (!show_intermediate_page && !collect_feedback_first) {
  return NextResponse.redirect(destination_url, { status: 302 });
}
```

#### Case 2: Intermediate Page or Feedback
```typescript
// Redirect to page.tsx with query params
const pageUrl = new URL(`/r/${slug}`, req.url);
pageUrl.searchParams.set('feedback', 'true'); // if collect_feedback_first
pageUrl.searchParams.set('template', template); // if show_intermediate_page
pageUrl.searchParams.set('destination', encodeURIComponent(destination_url));
return NextResponse.redirect(pageUrl.toString(), { status: 302 });
```

## Page Component: `/r/[slug]/page.tsx`

### Responsibilities

1. **Display Feedback Form**: If `feedback=true` in query params
2. **Display Intermediate Page**: If `template` in query params
3. **Handle Form Submission**: Submit feedback to `/api/tracking/feedback`
4. **Redirect to Destination**: After feedback or on skip

### Feedback Form

The feedback form collects:
- **Rating**: 1-5 stars (required)
- **Comment**: Optional text (max 500 chars)

On submit:
1. POST to `/api/tracking/feedback`
2. Feedback is stored in `tracking_events.meta.feedback`
3. Redirect to `destination_url`

## Feedback API: `/api/tracking/feedback/route.ts`

### Endpoint

`POST /api/tracking/feedback`

### Request Body

```typescript
{
  slug: string,
  rating: number,      // 1-5
  comment?: string,    // max 500 chars
}
```

### Response

```typescript
{
  success: true
}
```

### Storage

Feedback is stored in the `tracking_events` table as:

```json
{
  "meta": {
    "feedback": {
      "rating": 5,
      "comment": "Great experience!",
      "submitted_at": "2024-01-01T12:00:00Z"
    }
  }
}
```

## Security Considerations

### IP Hashing

IP addresses are hashed using SHA-256 before storage:

```typescript
function hashIP(ip: string): string {
  const cleanIP = ip.split(':')[0]; // Remove port
  return crypto.createHash('sha256')
    .update(cleanIP)
    .digest('hex')
    .substring(0, 32);
}
```

### Service Role Usage

The route uses `createAdminClient()` to bypass RLS when:
- Finding tracking links (needs to check `is_active`)
- Inserting tracking events (public access needed)

This is secure because:
- Only server-side code has access to service role key
- Tracking events are validated before insertion
- No sensitive data is exposed

## Testing

### Test Direct Redirect

1. Create tracking link with:
   - `show_intermediate_page = false`
   - `collect_feedback_first = false`
2. Visit `/r/[slug]`
3. Should redirect immediately to `destination_url`

### Test Feedback Form

1. Create tracking link with:
   - `collect_feedback_first = true`
2. Visit `/r/[slug]`
3. Should show feedback form
4. Submit feedback
5. Should redirect to `destination_url`

### Test Intermediate Page

1. Create tracking link with:
   - `show_intermediate_page = true`
   - `selected_template = 'restaurant-template-1'`
2. Visit `/r/[slug]`
3. Should show intermediate page
4. Click "Continue" → redirect to `destination_url`

## Database Schema

### tracking_links

```sql
CREATE TABLE tracking_links (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  branch_id UUID REFERENCES branches(id),
  slug TEXT UNIQUE NOT NULL,
  destination_type TEXT CHECK (destination_type IN ('google_maps_review', 'restaurant_page', 'menu_page', 'custom_url')),
  destination_url TEXT NOT NULL,
  show_intermediate_page BOOLEAN DEFAULT true,
  collect_feedback_first BOOLEAN DEFAULT false,
  selected_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### tracking_events

```sql
CREATE TABLE tracking_events (
  id BIGSERIAL PRIMARY KEY,
  tracking_link_id UUID REFERENCES tracking_links(id),
  branch_id UUID REFERENCES branches(id),
  business_id UUID REFERENCES businesses(id),
  card_id UUID REFERENCES nfc_cards(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_hash TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  device_type TEXT,
  referrer TEXT,
  meta JSONB DEFAULT '{}'::jsonb
);
```

## Future Enhancements

1. **A/B Testing**: Test different intermediate page templates
2. **Custom Templates**: Allow businesses to customize intermediate pages
3. **Analytics Dashboard**: Real-time view of link performance
4. **Scheduled Redirects**: Change destination based on time/date
5. **Geolocation-based Redirects**: Different destinations by country/city
6. **Conversion Tracking**: Track if user actually left a review

