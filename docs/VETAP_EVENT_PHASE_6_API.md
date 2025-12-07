# 📡 VETAP Event - Phase 6: Core API Layer

## ✅ المرحلة 6: طبقة الـ API الأساسية - مكتملة

تم إنشاء جميع الـ API endpoints المطلوبة:

---

## 📋 6.1 إدارة Partner / User

### ✅ Partners API

**POST `/api/event/partners`**
- إنشاء Partner جديد
- Requires: `owner` role only
- Fields: `name`, `logo_url`, `webhook_url`, `settings`

**GET `/api/event/partners`**
- قائمة Partners
- Owners: جميع Partners
- Others: فقط Partner الخاص بهم

---

### ✅ Users API

**POST `/api/event/users`**
- إنشاء مستخدم ضمن Partner
- Requires: `owner` or `partner_admin` role
- Fields: `email`, `name`, `role`, `partner_id`, `phone`, `phone_country_code`, `country`, `city`
- Auto-creates user in `auth.users` if doesn't exist

**GET `/api/event/users`**
- قائمة المستخدمين
- Owners: جميع المستخدمين (مع filter بـ `partner_id`)
- Partner admins: مستخدمي Partner الخاص بهم
- Others: أنفسهم فقط

---

### ✅ API Keys API

**POST `/api/event/partners/[id]/api-keys`**
- توليد API Key جديد لـ Partner
- Requires: `owner` or `partner_admin` role with access to partner
- Returns: API key (shown only once) + API key info
- Stores: hashed key in database

**GET `/api/event/partners/[id]/api-keys`**
- قائمة API Keys لـ Partner (بدون المفاتيح الفعلية)
- Requires: `owner` or `partner_admin` role with access to partner

---

## 📋 6.2 إدارة Events

### ✅ Events API

**POST `/api/event/events`**
- إنشاء حدث جديد
- Requires: `owner`, `partner_admin`, or `organizer` role
- Fields: `name`, `description`, `starts_at`, `ends_at`, `venue`, `venue_id`, `template_id`, `status`, `partner_id`
- Validation: `ends_at > starts_at`

**GET `/api/event/events`**
- قائمة الأحداث
- Owners: جميع الأحداث
- Others: أحداث Partner الخاص بهم
- Optional filter: `status` (draft/active/archived)

**GET `/api/event/events/[id]`**
- تفاصيل حدث معين
- Includes: partner info, created_by user, template info

**PATCH `/api/event/events/[id]`**
- تعديل بيانات الحدث
- Requires: `owner`, `partner_admin`, or `organizer` role
- Partial update (only provided fields)

**DELETE `/api/event/events/[id]`**
- أرشفة أو حذف الحدث
- Default: Archive (soft delete)
- `?hard=true`: Permanent delete (owners only)

---

## 📋 6.3 إدارة Templates

### ✅ Templates API

**POST `/api/event/templates`**
- رفع Template جديد
- Requires: `owner`, `partner_admin`, or `organizer` role
- Fields: `name`, `description`, `base_file_url`, `qr_position_x`, `qr_position_y`, `qr_width`, `qr_height`, `partner_id`, `is_active`
- Owners: يمكنهم إنشاء global templates (`partner_id = null`)
- Others: فقط templates لـ Partner الخاص بهم

**GET `/api/event/templates`**
- قائمة القوالب المتاحة
- Owners: جميع القوالب (global + all partners)
- Others: global templates + templates لـ Partner الخاص بهم
- Optional filters: `partner_id`, `include_global`

---

## 📋 6.4 Guests

### ✅ Guests API

**POST `/api/event/events/[id]/guests`**
- إضافة ضيف واحد
- Requires: `owner`, `partner_admin`, or `organizer` role
- Fields: `full_name`, `phone`, `email`, `type`, `notes`
- Note: Zones are associated with passes, not guests directly

**POST `/api/event/events/[id]/guests/import`**
- Import من ملف CSV/Excel (parsed on client side)
- Requires: `owner`, `partner_admin`, or `organizer` role
- Body: `{ guests: [...] }` - array of guest objects
- Bulk insert for performance

**GET `/api/event/events/[id]/guests`**
- قائمة الضيوف للحدث
- Optional filters: `type`, `search` (searches name/email/phone)

---

## 📋 6.5 Passes

### ✅ Passes API

**POST `/api/event/events/[id]/passes`**
- توليد passes لجميع الضيوف الذين ليس لديهم pass
- Requires: `owner`, `partner_admin`, or `organizer` role
- Generates:
  - Unique token (32 bytes hex)
  - QR payload (JSON with event_id, guest_id, token)
  - Status: `unused`
  - Valid dates: from event `starts_at` to `ends_at`
- Returns: عدد الـ passes المُنشأة + قائمة الـ passes

**GET `/api/event/events/[id]/passes`**
- قائمة الـ passes للحدث مع الحالة
- Includes: guest info
- Optional filters: `status`, `guest_id`

---

## 🔐 الأمان والصلاحيات

### Authentication
- جميع الـ endpoints محمية بـ `withAuth` middleware
- Requires: Valid JWT token in `Authorization: Bearer <token>` header

### Authorization
- **Owners**: Full access to all resources
- **Partner Admins**: Access to their partner's resources only
- **Organizers**: Can manage events, guests, passes for their partner
- **Gate Staff**: Can perform check-in (will be added in Phase 7)

### Multi-Tenancy
- جميع الـ queries تتضمن `partner_id` filter تلقائياً
- RLS policies في قاعدة البيانات تضمن isolation

---

## 📝 ملاحظات

1. **Zones**: Zones مرتبطة بـ Passes وليس Guests مباشرة
2. **API Keys**: يتم hashing المفاتيح قبل التخزين (SHA-256)
3. **Validation**: استخدام Zod schemas للتحقق من البيانات
4. **Error Handling**: معالجة شاملة للأخطاء مع رسائل واضحة
5. **Type Safety**: استخدام TypeScript types من `lib/event/types.ts`

---

## 🎯 الخطوات التالية

- Phase 7: Check-in System
- Phase 8: Webhooks
- Phase 9: Reports & Statistics
- Phase 10: Frontend Dashboard

