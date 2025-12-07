# 🎫 VETAP Event - Phase 8: Invitation File Generation

## ✅ المرحلة 8: توليد ملف الدعوة (Image/PDF/Wallet) - مكتملة

تم إنشاء جميع الوحدات المطلوبة:

---

## 📋 8.1 القوالب (Templates)

### ✅ Template Structure
- **Base File:** PNG أو PDF مخزن في Supabase Storage
- **QR Positions:** `qr_position_x`, `qr_position_y`, `qr_width`, `qr_height`
- **Partner-specific:** يمكن أن يكون Template خاص بـ Partner أو global

---

## 📋 8.2 Pipeline التوليد

### ✅ `lib/event/invite-generator.ts`

**Functions:**
- `generateInviteFile()` - Generate invite file (PNG/JPG/PDF)
- `loadTemplateImage()` - Load template from storage
- `generateImageInvite()` - Generate PNG/JPG invite
- `generatePDFInvite()` - Generate PDF invite
- `getFileExtension()` - Get file extension from format
- `getMimeType()` - Get MIME type from format

**Pipeline Steps:**
1. ✅ تحميل ملف template من التخزين
2. ✅ توليد QR image من qr_payload
3. ✅ رسم QR في مكانه المحدد
4. ✅ (اختياري) كتابة اسم الضيف/تفاصيل على الدعوة
5. ✅ تصدير: PNG/JPG أو PDF

---

## 📋 8.3 API Endpoints

### ✅ Generate Single Invite

**POST `/api/event/invites/generate`**
- Generate invitation file for a single pass
- Requires: `owner`, `partner_admin`, or `organizer` role
- Parameters:
  - `pass_id` (required)
  - `format` (png/jpg/pdf, default: png)
  - `include_guest_info` (boolean, default: false)
  - `quality` (1-100, for JPG)
- Returns: `invite_url`, `file_name`, `format`
- Auto-uploads to Supabase Storage
- Updates `pass.invite_file_url`

### ✅ Batch Generate Invites

**POST `/api/event/invites/batch-generate`**
- Generate invitation files for multiple passes
- Requires: `owner`, `partner_admin`, or `organizer` role
- Parameters:
  - `event_id` (required)
  - `pass_ids` (optional array - if not provided, generates for all passes)
  - `format` (png/jpg/pdf, default: png)
  - `include_guest_info` (boolean, default: false)
  - `quality` (1-100, for JPG)
  - `return_zip` (boolean, default: false) - Return ZIP file
- Returns: Array of results + optional ZIP URL

---

## 📋 8.4 تخزين النتائج

### ✅ Database Schema Update

**Migration: `013_vetap_event_passes_invite_url.sql`**
- Added `invite_file_url` column to `event_passes` table
- Index for faster lookups
- Stores URL of generated invitation file

### ✅ Storage Structure

```
event-invites/
  ├── {event_id}/
  │   ├── {pass_id}.png
  │   ├── {pass_id}.jpg
  │   ├── {pass_id}.pdf
  │   └── all_invites_{timestamp}.zip
```

---

## 📋 8.5 Wallet Passes (Future)

### 📝 Planned Features

**Apple Wallet (.pkpass)**
- JSON structure with pass.json
- Images (icon, logo, background)
- QR code integration
- Pass type: Event Ticket

**Google Wallet**
- JSON structure
- Class and Object definitions
- QR code integration
- Event Ticket type

**Implementation Notes:**
- Will be added in a future phase
- Requires additional libraries:
  - `passkit-generator` for Apple Wallet
  - Google Wallet API integration

---

## 🔧 الإعداد المطلوب

### 1. تثبيت Packages

```bash
npm install sharp pdf-lib archiver @types/archiver
```

**Packages:**
- `sharp` - Image processing (PNG/JPG)
- `pdf-lib` - PDF generation
- `archiver` - ZIP file creation

---

### 2. إنشاء Supabase Storage Bucket

في Supabase Dashboard:

1. Go to **Storage**
2. Create new bucket: `event-invites`
3. Set as **Public** (for direct access)
4. Or set RLS policies for authenticated access

**RLS Policy Example:**
```sql
-- Allow authenticated users to read invites
CREATE POLICY "Users can read invites"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-invites' AND
  auth.role() = 'authenticated'
);
```

---

### 3. Environment Variables

لا حاجة لـ environment variables إضافية (يستخدم Supabase Storage keys الموجودة)

---

## 🎨 Features

### Image Invites (PNG/JPG)
- ✅ Template image loading
- ✅ QR code overlay at specified position
- ✅ Guest info overlay (optional)
- ✅ Quality control for JPG
- ✅ High-resolution output

### PDF Invites
- ✅ Template PDF support
- ✅ Image template embedding
- ✅ QR code overlay
- ✅ Guest info text overlay
- ✅ Custom page sizes
- ✅ 300 DPI default

### Batch Generation
- ✅ Multiple passes at once
- ✅ Progress tracking
- ✅ Error handling per pass
- ✅ ZIP file generation
- ✅ Automatic upload to storage

---

## 📝 Usage Examples

### Generate Single Invite

```typescript
const response = await fetch('/api/event/invites/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    pass_id: 'pass-uuid',
    format: 'pdf',
    include_guest_info: true,
  }),
});

const { invite_url } = await response.json();
```

### Batch Generate with ZIP

```typescript
const response = await fetch('/api/event/invites/batch-generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    event_id: 'event-uuid',
    format: 'png',
    return_zip: true,
  }),
});

const { zip_url, results } = await response.json();
```

---

## 🔐 Security

- ✅ Authentication required for all endpoints
- ✅ Partner access verification
- ✅ RLS policies on storage bucket
- ✅ File validation
- ✅ Size limits (configurable)

---

## 📊 Performance

- **Single Invite:** ~1-2 seconds
- **Batch (10 passes):** ~10-20 seconds
- **Batch (100 passes):** ~2-3 minutes
- **ZIP Generation:** +5-10 seconds

**Optimization Tips:**
- Use async/await for parallel processing
- Cache template images
- Use CDN for storage URLs
- Consider background jobs for large batches

---

## ✅ الخلاصة

- ✅ Invite Generator Module
- ✅ Image Invites (PNG/JPG)
- ✅ PDF Invites
- ✅ Batch Generation
- ✅ ZIP File Support
- ✅ Storage Integration
- ✅ Database Schema Update
- ✅ API Endpoints

**Next Steps:**
- Wallet Passes (Apple/Google) - Future phase
- Email integration for sending invites
- SMS integration for invite links

المرحلة 8 مكتملة! 🎉

