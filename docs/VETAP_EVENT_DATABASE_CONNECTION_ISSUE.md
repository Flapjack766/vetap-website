# 🔧 VETAP Event - حل مشكلة التواصل مع قاعدة البيانات

## ⚠️ المشكلة

- ❌ تسجيل الدخول لا يعمل
- ❌ هناك مشكلة في التواصل بين قاعدة البيانات والموقع في خدمة Event

---

## 🔍 التشخيص خطوة بخطوة

### الخطوة 1: تحقق من Browser Console

عند محاولة تسجيل الدخول:

1. **افتح Browser Console** (F12)
2. **ابحث عن:**
   ```
   🔍 Login attempt:
      email: your-email@example.com
      supabaseUrl: https://mdqjgliaidrzkfxlnwtv.supabase.co...
      hasAnonKey: true
   
   📤 Sending login request to Supabase Event...
   📥 Login response: ...
   📊 Event user check: ...
   ```

**إذا رأيت:**
- ✅ URL صحيح → الكود صحيح
- ❌ URL خاطئ → المشكلة في Environment Variables

---

### الخطوة 2: تحقق من الأخطاء في Console

#### خطأ: "relation event_users does not exist"

**السبب:** Migrations لم تُطبق

**الحل:**
1. اذهب إلى Supabase Dashboard → SQL Editor
2. طبق ملف `ALL_VETAP_EVENT_MIGRATIONS.sql`
3. جرب مرة أخرى

#### خطأ: "permission denied" أو "RLS Error"

**السبب:** RLS policies تمنع الوصول

**الحل:**
1. تحقق من RLS policies في Supabase Dashboard
2. تحقق من أن المستخدم لديه `partner_id` (إذا لزم الأمر)
3. تحقق من أن المستخدم Owner (للمستخدمين الجدد)

#### خطأ: "User not found"

**السبب:** المستخدم غير موجود في `event_users`

**الحل:**
1. تحقق من Supabase Dashboard → Database → Tables → `event_users`
2. تحقق من أن المستخدم موجود
3. إذا لم يكن موجوداً، أنشئه يدوياً أو أعد إنشاء الحساب

---

### الخطوة 3: تحقق من Network Tab

1. **افتح Browser DevTools → Network**
2. **حاول تسجيل الدخول**
3. **ابحث عن requests إلى `supabase.co`**
4. **تحقق من:**
   - **Request URL:** يجب أن يكون `https://mdqjgliaidrzkfxlnwtv.supabase.co/auth/v1/token`
   - **Status Code:** يجب أن يكون `200` (نجاح)
   - **Response:** يجب أن يحتوي على `access_token`

**إذا رأيت:**
- ✅ `mdqjgliaidrzkfxlnwtv.supabase.co` + Status 200 → الطلب يذهب إلى Event
- ❌ `ppuvrzkrqvkkkwrfzyus.supabase.co` → الطلب يذهب إلى المشروع الرئيسي (مشكلة!)
- ❌ Status 401/403 → مشكلة في Authentication
- ❌ Status 500 → مشكلة في قاعدة البيانات

---

### الخطوة 4: تحقق من Supabase Dashboard

#### في Event Project:

1. **Authentication → Logs**
2. **ابحث عن:**
   - `signin` events
   - أي أخطاء

**إذا رأيت:**
- ✅ Events موجودة → الطلب يصل إلى Event project
- ❌ لا توجد events → الطلب لا يصل إلى Event project

#### في Database:

1. **Database → Tables → `event_users`**
2. **تحقق من:**
   - المستخدم موجود
   - `role` و `partner_id` موجودة

---

## ✅ الحلول

### الحل 1: تحقق من Migrations

**إذا كان جدول `event_users` غير موجود:**

1. اذهب إلى Supabase Dashboard → SQL Editor
2. طبق ملف `ALL_VETAP_EVENT_MIGRATIONS.sql`
3. تحقق من أن جميع الجداول موجودة

---

### الحل 2: تحقق من RLS Policies

**إذا كان الخطأ "permission denied":**

1. **Database → Tables → `event_users` → Policies**
2. **تحقق من:**
   - "Users can view their own record" موجودة
   - Policy تستخدم `auth.uid()` بشكل صحيح

**إذا لم تكن موجودة:**
- طبق Migration 009 (RLS Policies)

---

### الحل 3: إنشاء Owner User

**للمستخدم الأول (Owner):**

في Supabase SQL Editor:

```sql
-- Update first user to owner role
UPDATE event_users
SET role = 'owner'::user_role
WHERE email = 'your-email@example.com';
```

---

### الحل 4: تحقق من Environment Variables

**في `.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_EVENT_URL=https://mdqjgliaidrzkfxlnwtv.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=eyJhbGc...event-anon-key
```

**تحقق من:**
- [ ] URLs مختلفة تماماً
- [ ] Keys مختلفة تماماً
- [ ] لا توجد أخطاء في `.env.local`

---

## 📋 Checklist

- [ ] Migrations طُبقت (جميع الجداول موجودة)
- [ ] RLS Policies موجودة
- [ ] المستخدم موجود في `event_users`
- [ ] Environment Variables صحيحة
- [ ] Dev server أُعيد تشغيله
- [ ] Browser Console لا تظهر أخطاء
- [ ] Network Tab يظهر requests إلى Event URL
- [ ] Supabase Logs تظهر events

---

## 🎯 الخلاصة

**المشكلة:** مشكلة في التواصل مع قاعدة البيانات

**الأسباب المحتملة:**
1. Migrations لم تُطبق
2. RLS policies تمنع الوصول
3. المستخدم غير موجود في `event_users`
4. Environment Variables خاطئة

**الحل:** اتبع خطوات التشخيص أعلاه

