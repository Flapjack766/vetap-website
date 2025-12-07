# VETAP Event - دليل تطبيق Migrations

## ⚠️ المشكلة: جدول `event_users` غير موجود

إذا رأيت هذا الخطأ:
```
"Could not find the table 'public.event_users' in the schema cache"
```

**السبب:** Migrations لم يتم تطبيقها على قاعدة بيانات Event.

---

## ✅ الحل السريع: تطبيق جميع Migrations دفعة واحدة

### الطريقة الأسهل (مُوصى بها)

1. **اذهب إلى Supabase Dashboard:**
   - https://supabase.com/dashboard
   - **اختر مشروع VETAP Event** (URL: `mdqjgliaidrzkfxlnwtv.supabase.co`)

2. **افتح SQL Editor:**
   - Database → SQL Editor
   - اضغط "New query"

3. **انسخ والصق ملف واحد:**
   - افتح: `supabase/migrations/ALL_VETAP_EVENT_MIGRATIONS.sql`
   - انسخ **جميع** المحتوى
   - الصق في SQL Editor
   - اضغط "Run" (أو F5)

**✅ هذا الملف يحتوي على جميع Migrations بالترتيب الصحيح!**

---

## 🔄 الطريقة البديلة: تطبيق Migrations منفصلة

إذا واجهت مشاكل، يمكنك تطبيقها منفصلة:

### Migration 1: Schema الأساسي
1. افتح: `supabase/migrations/008_vetap_event_schema.sql`
2. انسخ **جميع** المحتوى
3. الصق في SQL Editor
4. اضغط "Run"

### Migration 2: Contact Info
1. افتح: `supabase/migrations/011_vetap_event_users_contact_info.sql`
2. انسخ **جميع** المحتوى
3. الصق في SQL Editor
4. اضغط "Run"

### Migration 3: RLS Policies
1. افتح: `supabase/migrations/009_vetap_event_rls_policies.sql`
2. انسخ **جميع** المحتوى
3. الصق في SQL Editor
4. اضغط "Run"

### Migration 4: Auth Sync Trigger
1. افتح: `supabase/migrations/010_vetap_event_auth_sync.sql`
2. انسخ **جميع** المحتوى
3. الصق في SQL Editor
4. اضغط "Run"

---

## ✅ التحقق من نجاح Migrations

### 1. تحقق من الجداول

```sql
-- في SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'event_%'
ORDER BY table_name;
```

**يجب أن ترى:**
- `event_api_keys`
- `event_events`
- `event_gates`
- `event_guests`
- `event_partners`
- `event_pass_zones`
- `event_passes`
- `event_scan_logs`
- `event_templates`
- `event_users`
- `event_venues`
- `event_webhook_endpoints`
- `event_zones`

### 2. تحقق من الـ Trigger

```sql
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgname = 'on_auth_user_created';
```

**يجب أن ترى:** سطر واحد مع `on_auth_user_created`

### 3. تحقق من RLS

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'event_%';
```

**يجب أن ترى:** جميع الجداول مع `rowsecurity = true`

---

## 🔄 بعد تطبيق Migrations

### 1. أعد اختبار الاتصال

افتح: `http://localhost:7000/ar/event/test-connection`

**يجب أن ترى:**
- ✅ Connection Successful
- ✅ Database query: success (بدون error)
- ✅ User created في `event_users`

### 2. جرب إنشاء حساب

افتح: `http://localhost:7000/ar/event/signup`

**يجب أن:**
- ✅ يتم إنشاء المستخدم في `auth.users`
- ✅ يتم إنشاء سجل في `event_users` (عبر trigger)
- ✅ تصل رسالة التحقق من Supabase

---

## 🐛 إذا واجهت أخطاء

### خطأ: "relation already exists"

**السبب:** Migration تم تطبيقه مسبقاً

**الحل:** تخطي هذا Migration وانتقل للتالي

### خطأ: "permission denied"

**السبب:** لا تملك صلاحيات كافية

**الحل:** تأكد من أنك Owner أو Admin للمشروع

### خطأ: "function already exists"

**السبب:** Function موجود مسبقاً

**الحل:** هذا طبيعي، يمكنك تخطيه أو استخدام `CREATE OR REPLACE FUNCTION`

---

## ✅ Checklist

- [ ] أنت في مشروع **VETAP Event** (ليس المشروع الرئيسي)
- [ ] Migration 008 تم تطبيقه (Schema)
- [ ] Migration 009 تم تطبيقه (RLS)
- [ ] Migration 010 تم تطبيقه (Auth Sync)
- [ ] Migration 011 تم تطبيقه (Contact Info)
- [ ] جميع الجداول موجودة (13 جدول)
- [ ] Trigger موجود ويعمل
- [ ] RLS مفعل على جميع الجداول
- [ ] صفحة الاختبار تعمل بدون أخطاء
- [ ] إنشاء الحساب يعمل

---

## 📞 بعد تطبيق Migrations

1. **أعد اختبار الاتصال:** `/ar/event/test-connection`
2. **يجب أن ترى:** Database query success (بدون error)
3. **جرب إنشاء حساب:** `/ar/event/signup`
4. **تحقق من Supabase Dashboard:**
   - Authentication → Users → المستخدم موجود
   - Database → Tables → event_users → السجل موجود

---

## 🎯 الخلاصة

**المشكلة:** Migrations لم يتم تطبيقها على قاعدة بيانات Event.

**الحل:** طبق جميع Migrations بالترتيب في Supabase SQL Editor.

**بعد التطبيق:** كل شيء سيعمل بشكل صحيح! ✅

