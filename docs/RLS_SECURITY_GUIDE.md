# RLS Security Guide - Branch Tracking System

## Overview

This document explains the Row Level Security (RLS) policies implemented for the Branch Tracking System in VETAP. All tables have RLS enabled to ensure multi-tenant isolation and data security.

## Core Security Principle

**Every user can only access data where `business.owner_user_id = auth.uid()`**

This principle is enforced at the database level through RLS policies, ensuring that:
- Users cannot access other users' businesses, branches, cards, or links
- Data is completely isolated between tenants
- Security is enforced even if application-level checks are bypassed

## Tables and Policies

### 1. `businesses` Table

**Policies:**
- ✅ Users can view/create/update/delete their own businesses
- ✅ Admin users can view all businesses (for support)

**Security Check:**
```sql
auth.uid() = owner_user_id
```

### 2. `branches` Table

**Policies:**
- ✅ Users can view/create/update/delete branches of their own businesses
- ✅ Admin users can view all branches

**Security Check:**
```sql
EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = branches.business_id
  AND businesses.owner_user_id = auth.uid()
)
```

### 3. `nfc_cards` Table

**Policies:**
- ✅ Users can view/create/update/delete cards of their own branches
- ✅ Access is controlled through branch → business → owner chain

**Security Check:**
```sql
EXISTS (
  SELECT 1 FROM branches
  JOIN businesses ON businesses.id = branches.business_id
  WHERE branches.id = nfc_cards.branch_id
  AND businesses.owner_user_id = auth.uid()
)
```

### 4. `tracking_links` Table

**Policies:**
- ✅ Users can view/create/update/delete links of their own businesses
- ✅ **Public can view active links** (for redirects via short URLs)
- ✅ Admin users can view all links

**Security Check (for owners):**
```sql
EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = tracking_links.business_id
  AND businesses.owner_user_id = auth.uid()
)
```

**Public Access:**
- Only `is_active = true` links are accessible to anonymous users
- This allows short URLs (e.g., `/t/ab12cd`) to work without authentication

### 5. `tracking_events` Table

**Policies:**
- ✅ Users can view events of their own businesses
- ✅ **Public can insert events** (for tracking link clicks)
- ✅ Admin users can view all events

**⚠️ IMPORTANT SECURITY NOTE:**

While we allow public INSERT for `tracking_events` (needed for short link clicks), it's **HIGHLY RECOMMENDED** to use **Service Role key** in API routes instead of relying on this RLS policy.

**Best Practice:**
1. Create API route: `/api/track/[slug]`
2. Use Service Role key to bypass RLS
3. Validate the tracking_link exists and is active
4. Extract IP, user-agent, and metadata server-side
5. Insert the event with proper validation

**Why?**
- Better security control
- Server-side validation
- Protection against abuse
- Better performance

**Example API Route Structure:**
```typescript
// app/api/track/[slug]/route.ts
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const adminClient = createAdminClient(); // Uses service_role key
  
  // Validate tracking link
  const { data: link } = await adminClient
    .from('tracking_links')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();
  
  if (!link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }
  
  // Extract metadata from request
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
  const userAgent = req.headers.get('user-agent');
  // ... extract country, city, device_type, etc.
  
  // Insert event
  await adminClient
    .from('tracking_events')
    .insert({
      tracking_link_id: link.id,
      branch_id: link.branch_id,
      business_id: link.business_id,
      ip_hash: hashIP(ip), // Hash IP for privacy
      user_agent: userAgent,
      // ... other metadata
    });
  
  // Redirect to destination
  return NextResponse.redirect(link.destination_url);
}
```

### 6. `review_sync` Table

**Policies:**
- ✅ Users can view/create/update review sync of their own businesses
- ✅ Admin users can view all review sync

**Security Check:**
```sql
EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = review_sync.business_id
  AND businesses.owner_user_id = auth.uid()
)
```

### 7. `page_templates` Table

**Policies:**
- ✅ Public can view templates (templates are shared resources)
- ✅ Only admins can manage templates

**Security Check:**
- Public read: `USING (true)`
- Admin write: Uses `is_admin_user_for_rls()` function

## Admin Access

Admin users have read access to all tables for support purposes. Admin check uses:
1. `is_admin_user_for_rls()` function (checks `admin_users` table)
2. Email check: `auth.jwt()->>'email' = 'admin@vetaps.com'`
3. User ID check: `auth.uid() = '15f7e23f-8b8f-4f73-ae2d-e75201d788bc'::uuid`

## Future: Delegation/Agency Features

For future features where users can delegate access to their businesses (e.g., managers, staff), you can:

1. Create a `business_delegations` table:
```sql
CREATE TABLE business_delegations (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  delegated_user_id UUID REFERENCES auth.users(id),
  role TEXT, -- 'manager', 'staff', etc.
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. Modify RLS policies to include delegation check:
```sql
CREATE POLICY "Users can view businesses they own or are delegated to"
ON businesses
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_user_id
  OR EXISTS (
    SELECT 1 FROM business_delegations
    WHERE business_delegations.business_id = businesses.id
    AND business_delegations.delegated_user_id = auth.uid()
  )
);
```

## Testing RLS Policies

To test RLS policies:

1. **Test as regular user:**
   - Create a business
   - Verify you can only see your own businesses
   - Try to access another user's business (should fail)

2. **Test as admin:**
   - Verify you can see all businesses
   - Verify you can view all events, branches, etc.

3. **Test public access:**
   - Verify active tracking links are accessible without auth
   - Verify inactive links are not accessible

## Security Checklist

- ✅ RLS enabled on all tables
- ✅ Users can only access their own data
- ✅ Admin read access for support
- ✅ Public access only for necessary operations (tracking_links, tracking_events)
- ✅ All policies use proper security checks
- ⚠️ Consider using Service Role for tracking_events INSERT (recommended)

## Notes

- RLS is enforced at the database level, so even if application code has bugs, data is protected
- Always use Service Role key for server-side operations that need to bypass RLS
- Never expose Service Role key to client-side code
- Regularly audit RLS policies to ensure they match business requirements

