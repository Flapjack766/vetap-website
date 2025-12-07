# 🚀 VETAP Event - إعداد سريع (5 دقائق)

## ⚠️ المشكلة الحالية

```
"Could not find the table 'public.event_users' in the schema cache"
```

**السبب:** Migrations لم يتم تطبيقها على قاعدة بيانات Event.

---

## ✅ الحل: خطوة واحدة فقط!

### 1️⃣ اذهب إلى Supabase Dashboard

**رابط مباشر:**
```
https://supabase.com/dashboard/project/mdqjgliaidrzkfxlnwtv
```

أو:
1. اذهب إلى: https://supabase.com/dashboard
2. **اختر مشروع VETAP Event** (URL: `mdqjgliaidrzkfxlnwtv.supabase.co`)
3. **تأكد من أنك في المشروع الصحيح!**

### 2️⃣ افتح SQL Editor

1. من القائمة الجانبية: **Database**
2. اضغط: **SQL Editor**
3. اضغط: **New query** (أو استخدم Query موجود)

### 3️⃣ انسخ والصق الملف الكامل

1. **افتح الملف:** `supabase/migrations/ALL_VETAP_EVENT_MIGRATIONS.sql`
2. **انسخ جميع المحتوى:**
   - اضغط `Ctrl+A` (تحديد الكل)
   - اضغط `Ctrl+C` (نسخ)
3. **الصق في SQL Editor:**
   - اضغط `Ctrl+V`
4. **شغّل الكود:**
   - اضغط `Ctrl+Enter` أو `F5` أو زر "Run"

### 4️⃣ تحقق من النجاح

**يجب أن ترى في النتيجة:**
```
✅ All VETAP Event migrations completed successfully!
📊 Tables created: 13
🔒 RLS enabled on all tables
🔄 Auth sync trigger installed
```

**أو:**
```
Success. No rows returned
```

---

## ✅ بعد التطبيق

### 1. اختبر الاتصال

افتح في المتصفح:
```
http://localhost:7000/ar/event/test-connection
```

**يجب أن ترى:**
- ✅ Connection Successful
- ✅ Database query: **success** (بدون error)
- ✅ User created في `event_users`

### 2. جرب إنشاء حساب

افتح:
```
http://localhost:7000/ar/event/signup
```

**يجب أن:**
- ✅ يتم إنشاء المستخدم في `auth.users`
- ✅ يتم إنشاء سجل في `event_users` (عبر trigger)
- ✅ تصل رسالة التحقق من Supabase

---

## 🔍 التحقق من الجداول

بعد التطبيق، يمكنك التحقق من الجداول:

### في Supabase Dashboard:

1. **Database → Tables**
2. **ابحث عن جداول تبدأ بـ `event_`**

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
- `event_users` ⭐ (هذا المهم!)
- `event_venues`
- `event_webhook_endpoints`
- `event_zones`

### أو في SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'event_%'
ORDER BY table_name;
```

---

## ❌ إذا واجهت أخطاء

### خطأ: "relation already exists"

**السبب:** بعض الجداول موجودة مسبقاً

**الحل:** هذا طبيعي، الملف يستخدم `CREATE TABLE IF NOT EXISTS`، يمكنك المتابعة.

### خطأ: "permission denied"

**السبب:** لا تملك صلاحيات كافية

**الحل:** تأكد من أنك Owner أو Admin للمشروع

### خطأ: "function already exists"

**السبب:** Function موجود مسبقاً

**الحل:** هذا طبيعي، الملف يستخدم `CREATE OR REPLACE FUNCTION`

### خطأ: "type already exists"

**السبب:** Enum types موجودة مسبقاً

**الحل:** هذا طبيعي، يمكنك تخطي هذا الخطأ

---

## 📋 Checklist

- [ ] أنت في مشروع **VETAP Event** (URL: `mdqjgliaidrzkfxlnwtv.supabase.co`)
- [ ] فتحت SQL Editor
- [ ] نسخت ملف `ALL_VETAP_EVENT_MIGRATIONS.sql` بالكامل
- [ ] شغّلت الكود (Run)
- [ ] رأيت رسالة نجاح
- [ ] اختبرت صفحة `/ar/event/test-connection`
- [ ] Database query يعمل بدون error
- [ ] جربت إنشاء حساب في `/ar/event/signup`

---

## 🎯 الخلاصة

**المشكلة:** جدول `event_users` غير موجود

**الحل:** طبق ملف `ALL_VETAP_EVENT_MIGRATIONS.sql` في Supabase SQL Editor

**الوقت المطلوب:** 2-5 دقائق

**بعد التطبيق:** كل شيء سيعمل! ✅

---

## 📞 إذا استمرت المشكلة

1. **تحقق من أنك في المشروع الصحيح:**
   - URL يجب أن يكون: `mdqjgliaidrzkfxlnwtv.supabase.co`
   - ليس المشروع الرئيسي!

2. **تحقق من الصلاحيات:**
   - يجب أن تكون Owner أو Admin

3. **تحقق من الجداول:**
   - Database → Tables → ابحث عن `event_users`

4. **أرسل لقطة شاشة:**
   - من SQL Editor بعد تشغيل الكود
   - من صفحة Tables في Supabase Dashboard

