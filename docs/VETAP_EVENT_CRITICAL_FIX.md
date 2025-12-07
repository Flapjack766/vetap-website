# 🚨 VETAP Event - إصلاح عاجل: جدول `event_users` غير موجود

## ⚠️ المشكلة

```
ERROR: relation "event_users" does not exist (SQLSTATE 42P01)
```

**السبب:** جدول `event_users` غير موجود في قاعدة بيانات Event Supabase.

**النتيجة:**
- ❌ Signup لا يعمل
- ❌ Invite لا يعمل
- ❌ Trigger `handle_new_auth_user()` يفشل

---

## ✅ الحل: تطبيق Migrations

### الخطوة 1: اذهب إلى Supabase Dashboard

1. **اذهب إلى:** https://supabase.com/dashboard/project/mdqjgliaidrzkfxlnwtv
2. **تأكد من أنك في مشروع Event** (URL: `mdqjgliaidrzkfxlnwtv.supabase.co`)

### الخطوة 2: افتح SQL Editor

1. **Database → SQL Editor**
2. **اضغط "New query"**

### الخطوة 3: طبق جميع Migrations

1. **افتح الملف:** `supabase/migrations/ALL_VETAP_EVENT_MIGRATIONS.sql`
2. **انسخ جميع المحتوى** (Ctrl+A ثم Ctrl+C)
3. **الصق في SQL Editor** (Ctrl+V)
4. **اضغط "Run"** (أو F5)

**يجب أن ترى:**
```
✅ All VETAP Event migrations completed successfully!
📊 Tables created: 13
🔒 RLS enabled on all tables
🔄 Auth sync trigger installed
```

---

## ✅ التحقق من النجاح

### 1. تحقق من الجداول

في Supabase Dashboard → Database → Tables:

**يجب أن ترى 13 جدول:**
- [ ] `event_api_keys`
- [ ] `event_events`
- [ ] `event_gates`
- [ ] `event_guests`
- [ ] `event_partners`
- [ ] `event_pass_zones`
- [ ] `event_passes`
- [ ] `event_scan_logs`
- [ ] `event_templates`
- [ ] `event_users` ⭐ **هذا المهم!**
- [ ] `event_venues`
- [ ] `event_webhook_endpoints`
- [ ] `event_zones`

### 2. تحقق من Trigger

في Supabase Dashboard → Database → Database → Functions:

**يجب أن ترى:**
- `handle_new_auth_user()` function
- `sync_auth_user_email()` function

**وفي Database → Triggers:**
- `on_auth_user_created` trigger على `auth.users`

### 3. اختبر Signup

```
http://localhost:7000/ar/event/signup
```

**يجب أن:**
- ✅ يتم إنشاء المستخدم في `auth.users`
- ✅ يتم إنشاء سجل في `event_users` تلقائياً (عبر trigger)
- ✅ لا توجد أخطاء في Console

---

## 🔍 إذا واجهت أخطاء

### خطأ: "relation already exists"

**السبب:** بعض الجداول موجودة مسبقاً

**الحل:** هذا طبيعي، الملف يستخدم `CREATE TABLE IF NOT EXISTS`، يمكنك المتابعة.

### خطأ: "permission denied"

**السبب:** لا تملك صلاحيات كافية

**الحل:** تأكد من أنك Owner أو Admin للمشروع

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
- [ ] جميع الجداول موجودة (13 جدول)
- [ ] Trigger موجود
- [ ] اختبرت Signup - يعمل بدون أخطاء

---

## 🎯 الخلاصة

**المشكلة:** جدول `event_users` غير موجود

**الحل:** طبق ملف `ALL_VETAP_EVENT_MIGRATIONS.sql` في Supabase SQL Editor

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

