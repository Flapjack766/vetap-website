# 🔧 VETAP Event - Phase 8 Setup Guide

## 📦 Required Packages

Install the following packages for invitation file generation:

```bash
npm install sharp pdf-lib archiver @types/archiver
```

### Package Details:

- **sharp** - High-performance image processing (PNG/JPG)
- **pdf-lib** - PDF generation and manipulation
- **archiver** - ZIP file creation for batch downloads
- **@types/archiver** - TypeScript types for archiver

---

## 🗄️ Supabase Storage Setup

### 1. Create Storage Bucket

In Supabase Dashboard:

1. Go to **Storage** → **Buckets**
2. Click **New bucket**
3. Name: `event-invites`
4. **Public bucket**: ✅ (for direct access) OR ❌ (with RLS policies)
5. Click **Create bucket**

### 2. Set RLS Policies (if bucket is private)

If you chose a private bucket, add RLS policies:

```sql
-- Allow authenticated users to read invites
CREATE POLICY "Users can read invites"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-invites' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to upload invites
CREATE POLICY "Users can upload invites"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-invites' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update invites
CREATE POLICY "Users can update invites"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-invites' AND
  auth.role() = 'authenticated'
);
```

---

## 📊 Database Migration

Run the migration to add `invite_file_url` column:

```sql
-- File: supabase/migrations/013_vetap_event_passes_invite_url.sql
ALTER TABLE event_passes
ADD COLUMN IF NOT EXISTS invite_file_url TEXT;

CREATE INDEX IF NOT EXISTS idx_passes_invite_url 
ON event_passes(invite_file_url) 
WHERE invite_file_url IS NOT NULL;
```

Apply in Supabase SQL Editor or via migration tool.

---

## ✅ Verification

### 1. Test Package Installation

```bash
node -e "console.log('sharp:', require('sharp') ? 'OK' : 'MISSING')"
node -e "console.log('pdf-lib:', require('pdf-lib') ? 'OK' : 'MISSING')"
node -e "console.log('archiver:', require('archiver') ? 'OK' : 'MISSING')"
```

### 2. Test Storage Bucket

```typescript
// Test upload
const { data, error } = await supabase.storage
  .from('event-invites')
  .upload('test.txt', 'test content');

if (error) {
  console.error('Storage test failed:', error);
} else {
  console.log('Storage test passed!');
}
```

### 3. Test API Endpoints

```bash
# Generate single invite
curl -X POST http://localhost:7000/api/event/invites/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pass_id": "pass-uuid",
    "format": "png"
  }'
```

---

## 🎨 Template Requirements

### Image Templates (PNG/JPG)
- Recommended size: 1200x1800px (2:3 ratio)
- Format: PNG (transparency) or JPG
- QR position: Specify in template settings

### PDF Templates
- Recommended size: A4 (595x842 points)
- Format: PDF
- QR position: Specify in template settings

### QR Code Positioning
- `qr_position_x`: X coordinate (left)
- `qr_position_y`: Y coordinate (top)
- `qr_width`: QR code width in pixels
- `qr_height`: QR code height in pixels

---

## 📝 Notes

1. **File Sizes**: Large batches may take time. Consider background jobs for 100+ invites.
2. **Storage Limits**: Monitor Supabase Storage usage.
3. **CDN**: Consider using CDN for faster delivery.
4. **Caching**: Template images can be cached for better performance.

---

## 🚀 Next Steps

After setup:
1. Create templates in Supabase Storage
2. Add template records via API
3. Generate invites for passes
4. Test batch generation
5. Test ZIP download

---

## ❓ Troubleshooting

### Error: "sharp module not found"
```bash
npm install sharp
```

### Error: "pdf-lib module not found"
```bash
npm install pdf-lib
```

### Error: "archiver module not found"
```bash
npm install archiver @types/archiver
```

### Error: "Storage bucket not found"
- Create bucket in Supabase Dashboard
- Check bucket name: `event-invites`

### Error: "Permission denied" on storage
- Check RLS policies
- Verify bucket is public OR user has access

---

## ✅ Setup Complete!

Once all packages are installed and storage is configured, you're ready to generate invites! 🎉

