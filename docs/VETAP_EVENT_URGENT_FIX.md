# 🚨 VETAP Event - إصلاح عاجل: جدول `event_users` غير موجود

## ⚠️ المشكلة الحالية

```
ERROR: relation "event_users" does not exist (SQLSTATE 42P01)
```

**السبب:** جدول `event_users` غير موجود في قاعدة بيانات Event Supabase.

**النتيجة:**
- ❌ Signup لا يعمل
- ❌ Invite لا يعمل
- ❌ Trigger `handle_new_auth_user()` يفشل

---

## ✅ الحل: تطبيق Migrations خطوة بخطوة

### الخطوة 1: اذهب إلى Supabase Dashboard

1. **افتح:** https://supabase.com/dashboard/project/mdqjgliaidrzkfxlnwtv
2. **تأكد من أنك في مشروع Event** (URL: `mdqjgliaidrzkfxlnwtv.supabase.co`)

### الخطوة 2: افتح SQL Editor

1. **Database → SQL Editor**
2. **اضغط "New query"** (أو استخدم query موجود)

### الخطوة 3: تحقق من الجداول الموجودة

**أولاً، تحقق من الجداول الموجودة:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'event_%'
ORDER BY table_name;
```

**انسخ والصق هذا الكود في SQL Editor واضغط "Run".**

**النتيجة:**
- إذا رأيت قائمة بجداول `event_*` → بعض Migrations طُبقت
- إذا رأيت "0 rows" → لا توجد جداول، يجب تطبيق جميع Migrations

---

### الخطوة 4: طبق Migrations

#### إذا لم توجد جداول (0 rows):

1. **افتح الملف:** `supabase/migrations/ALL_VETAP_EVENT_MIGRATIONS.sql`
2. **انسخ جميع المحتوى** (Ctrl+A ثم Ctrl+C)
3. **الصق في SQL Editor** (Ctrl+V)
4. **اضغط "Run"** (أو F5)

**يجب أن ترى:**
```
✅ All VETAP Event migrations completed successfully!
```

#### إذا كانت بعض الجداول موجودة:

**طبق Migrations منفصلة بالترتيب:**

##### Migration 1: Schema الأساسي
1. افتح: `supabase/migrations/008_vetap_event_schema.sql`
2. انسخ جميع المحتوى
3. الصق في SQL Editor
4. اضغط "Run"

##### Migration 2: Contact Info
1. افتح: `supabase/migrations/011_vetap_event_users_contact_info.sql`
2. انسخ جميع المحتوى
3. الصق في SQL Editor
4. اضغط "Run"

##### Migration 3: RLS Policies
1. افتح: `supabase/migrations/009_vetap_event_rls_policies.sql`
2. انسخ جميع المحتوى
3. الصق في SQL Editor
4. اضغط "Run"

##### Migration 4: Auth Sync
1. افتح: `supabase/migrations/010_vetap_event_auth_sync.sql`
2. انسخ جميع المحتوى
3. الصق في SQL Editor
4. اضغط "Run"

---

## ✅ التحقق من النجاح

### 1. تحقق من الجداول مرة أخرى

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'event_%'
ORDER BY table_name;
```

**يجب أن ترى 13 جدول:**
- `event_api_keys`
- `event_events`
- `event_gates`
- `event_guests`
- `event_partners`
- `event_pass_zones`
- `event_passes`
- `event_scan_logs`
- `event_templates`
- `event_users` ⭐ **هذا المهم!**
- `event_venues`
- `event_webhook_endpoints`
- `event_zones`

### 2. تحقق من جدول `event_users` بشكل خاص

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

**يجب أن ترى الأعمدة:**
- `id` (uuid)
- `name` (varchar)
- `email` (varchar)
- `role` (user_role)
- `partner_id` (uuid)
- `phone` (varchar)
- `phone_country_code` (varchar)
- `country` (varchar)
- `city` (varchar)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 3. تحقق من Trigger

```sql
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgname = 'on_auth_user_created';
```

**يجب أن ترى:** سطر واحد مع `on_auth_user_created`

---

## 🔍 إذا استمرت المشكلة

### 1. تحقق من Schema

```sql
SELECT current_schema();
```

**يجب أن يكون:** `public`

### 2. تحقق من الصلاحيات

```sql
SELECT current_user, current_database();
```

**يجب أن تكون:** Owner أو Admin للمشروع

### 3. تحقق من Extensions

```sql
SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp';
```

**يجب أن ترى:** `uuid-ossp`

---

## 📋 Checklist

- [ ] أنت في مشروع **VETAP Event** (URL: `mdqjgliaidrzkfxlnwtv.supabase.co`)
- [ ] فتحت SQL Editor
- [ ] تحققت من الجداول الموجودة
- [ ] طُبقت Migrations (إما جميعها أو منفصلة)
- [ ] رأيت رسالة نجاح
- [ ] تحققت من وجود 13 جدول
- [ ] تحققت من وجود `event_users` بشكل خاص
- [ ] تحققت من وجود Trigger
- [ ] اختبرت Signup - يعمل بدون أخطاء

---

## 🎯 الخلاصة

**المشكلة:** جدول `event_users` غير موجود

**الحل:** طبق Migrations في Supabase SQL Editor

**الوقت المطلوب:** 2-5 دقائق

**بعد التطبيق:** كل شيء سيعمل! ✅

---

## ⚠️ مهم جداً

**يجب تطبيق Migrations قبل استخدام Event service!**

بدون Migrations:
- ❌ Signup لا يعمل
- ❌ Login لا يعمل
- ❌ Trigger لا يعمل
- ❌ كل شيء يفشل

**بعد تطبيق Migrations:**
- ✅ Signup يعمل
- ✅ Login يعمل
- ✅ Trigger يعمل
- ✅ كل شيء يعمل بشكل صحيح

