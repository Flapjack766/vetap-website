# 🔐 VETAP Event - Phase 7: Token & QR Code System

## ✅ المرحلة 7: منطق التوكن والـ QR والتوقيع الرقمي - مكتملة

تم إنشاء جميع الوحدات المطلوبة:

---

## 📋 7.1 مولّد التوكنات (Token Generator)

### ✅ `lib/event/token-generator.ts`

**Functions:**
- `generateToken(length, encoding)` - Generate random token
- `generateUniqueToken(eventId, maxRetries)` - Generate unique token with collision detection
- `generateShortToken(length)` - Generate shorter token for display
- `validateTokenFormat(token, encoding)` - Validate token format

**Features:**
- ✅ Random bytes generation (32 bytes default)
- ✅ Multiple encodings: `hex`, `base64`, `base64url`
- ✅ Uniqueness check in database
- ✅ Automatic retry on collision (max 5 attempts)
- ✅ Format validation

---

## 📋 7.2 QR Payload Generator مع التوقيع الرقمي

### ✅ `lib/event/qr-payload.ts`

**QR Payload Structure:**
```json
{
  "v": 1,                    // Version
  "eid": "<event_id>",       // Event ID
  "pid": "<pass_id>",        // Pass ID
  "gid": "<guest_id>",       // Guest ID (optional)
  "exp": "<timestamp>",      // Expiration timestamp (optional)
  "sig": "<signature>"       // HMAC signature
}
```

**Functions:**
- `generateQRPayload(eventId, passId, guestId?, expiresAt?, partnerId?)` - Generate signed QR payload
- `verifyQRPayload(encodedPayload, partnerId?)` - Verify and decode QR payload
- `extractPassIdFromPayload(encodedPayload)` - Quick pass ID extraction

**Features:**
- ✅ JSON payload structure
- ✅ Base64url encoding
- ✅ HMAC-SHA256 digital signature
- ✅ Partner-specific secrets support
- ✅ Expiration timestamp support
- ✅ Constant-time signature verification (prevents timing attacks)

**Security:**
- Uses `SUPABASE_EVENT_SIGNING_SECRET` (system-wide)
- Or `SUPABASE_EVENT_PARTNER_{id}_SECRET` (partner-specific)
- Signature verification prevents tampering

---

## 📋 7.3 توليد صورة QR

### ✅ `lib/event/qr-generator.ts`

**Functions:**
- `generateQRDataURL(payload, options)` - Generate QR as base64 PNG
- `generateQRBuffer(payload, options)` - Generate QR as Buffer
- `getQRCodeRendererOptions(options)` - Get options for React components

**Features:**
- ✅ Server-side QR generation (requires `qrcode` package)
- ✅ Client-side React component (`QRCodeDisplay`)
- ✅ Customizable size, error correction level, colors
- ✅ Multiple output formats (PNG, SVG)

### ✅ `app/(components)/event/QRCodeDisplay.tsx`

**React Component:**
- Client-side QR code display
- Uses `qrcode.react` library
- Customizable size, colors, error correction

### ✅ `app/api/event/qr/generate/route.ts`

**POST `/api/event/qr/generate`**
- Generate QR code image from payload
- Returns: Data URL (base64 PNG)
- Parameters: `payload`, `size`, `level`, `marginSize`, `format`

---

## 📋 7.4 QR Verification API

### ✅ `app/api/event/qr/verify/route.ts`

**POST `/api/event/qr/verify`**
- Verify QR code payload
- Returns: Pass information and validation status
- Used for check-in operations

**Response:**
```json
{
  "valid": true/false,
  "pass": { ... },
  "message": "..."
}
```

---

## 🔧 الإعداد المطلوب

### 1. تثبيت Package للـ QR Code (Server-side)

```bash
npm install qrcode @types/qrcode
```

**ملاحظة:** `qrcode.react` موجود بالفعل للـ client-side

---

### 2. إضافة Environment Variable

في `.env.local`:

```env
# VETAP Event - QR Code Signing Secret
SUPABASE_EVENT_SIGNING_SECRET=your-secret-key-here-min-32-chars

# Optional: Partner-specific secrets
# SUPABASE_EVENT_PARTNER_{partner_id}_SECRET=partner-specific-secret
```

**كيفية إنشاء Secret:**
```bash
# Generate random secret (32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔐 الأمان

### Digital Signature
- **Algorithm:** HMAC-SHA256
- **Encoding:** Base64url
- **Verification:** Constant-time comparison (prevents timing attacks)

### Token Security
- **Length:** 32 bytes (64 hex characters)
- **Uniqueness:** Database check with retry
- **Collision Probability:** Negligible with 32 bytes

### QR Payload Security
- **Signature:** Prevents tampering
- **Expiration:** Optional timestamp validation
- **Version:** Allows future format changes

---

## 📝 ملاحظات

1. **QR Payload Update:** بعد إنشاء pass، يتم تحديث QR payload بـ pass ID الفعلي
2. **Partner Secrets:** يمكن استخدام secrets مختلفة لكل partner
3. **Error Correction:** Default level 'M' (Medium) - good balance
4. **Client vs Server:** 
   - Server: `qrcode` package for PNG generation
   - Client: `qrcode.react` for React components

---

## 🎯 الاستخدام

### Generate Pass with QR:
```typescript
import { generateUniqueToken } from '@/lib/event/token-generator';
import { generateQRPayload } from '@/lib/event/qr-payload';

const token = await generateUniqueToken(eventId);
const qrPayload = generateQRPayload(eventId, passId, guestId, expiresAt, partnerId);
```

### Verify QR Code:
```typescript
import { verifyQRPayload } from '@/lib/event/qr-payload';

const payload = verifyQRPayload(encodedQR, partnerId);
if (payload) {
  // Valid QR code
  const passId = payload.pid;
}
```

### Display QR Code:
```tsx
import { QRCodeDisplay } from '@/app/(components)/event/QRCodeDisplay';

<QRCodeDisplay payload={qrPayload} size={256} />
```

---

## ✅ الخلاصة

- ✅ Token Generator مع collision detection
- ✅ QR Payload Generator مع digital signature
- ✅ QR Code Image Generator (server + client)
- ✅ QR Verification API
- ✅ Security: HMAC-SHA256 signatures
- ✅ Multi-tenant: Partner-specific secrets support

المرحلة 7 مكتملة! 🎉

