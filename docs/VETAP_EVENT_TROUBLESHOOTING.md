# VETAP Event - استكشاف الأخطاء وحلها

## 🔍 مشكلة: لا تصل رسالة التحقق ولا يوجد شيء في Logs

### الخطوة 1: التحقق من متغيرات البيئة ✅

تأكد من أن ملف `.env.local` يحتوي على:

```env
NEXT_PUBLIC_SUPABASE_EVENT_URL=https://your-event-project.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=your-event-anon-key-here
```

**التحقق:**
1. افتح Console في المتصفح (F12)
2. حاول إنشاء حساب
3. ابحث عن رسائل console.log
4. تحقق من وجود `supabaseUrl` و `hasAnonKey: true`

### الخطوة 2: التحقق من Supabase Event Project ✅

1. **اذهب إلى Supabase Dashboard:**
   - https://supabase.com/dashboard
   - تأكد من أنك في مشروع **VETAP Event** (ليس المشروع الرئيسي)

2. **تحقق من Project Settings:**
   - Settings → API
   - انسخ `Project URL` و `anon public` key
   - تأكد من أنها مطابقة لما في `.env.local`

### الخطوة 3: التحقق من Email Settings في Supabase ✅

1. **Authentication → Settings → Email Auth:**
   - ✅ "Enable email signup" يجب أن يكون مفعلاً
   - ✅ "Enable email confirmations" يجب أن يكون مفعلاً
   - ✅ "Secure email change" (اختياري)

2. **Authentication → Email Templates:**
   - تحقق من أن قالب "Confirm signup" موجود
   - يمكنك تخصيصه إذا أردت

3. **Project Settings → Auth → SMTP Settings:**
   - Supabase يستخدم SMTP افتراضي
   - يمكنك إعداد SMTP مخصص (Gmail, SendGrid, إلخ)

### الخطوة 4: التحقق من Database Logs ✅

1. **في Supabase Dashboard:**
   - Database → Logs
   - ابحث عن أي أخطاء أو queries

2. **في SQL Editor:**
   ```sql
   -- تحقق من وجود المستخدمين
   SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;
   
   -- تحقق من وجود سجلات event_users
   SELECT * FROM event_users ORDER BY created_at DESC LIMIT 5;
   
   -- تحقق من وجود الـ trigger
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

### الخطوة 5: التحقق من الـ Trigger ✅

```sql
-- تحقق من أن الـ trigger موجود ويعمل
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgname = 'on_auth_user_created';

-- تحقق من أن الـ function موجود
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_auth_user';
```

### الخطوة 6: اختبار مباشر في Supabase Dashboard ✅

1. **Authentication → Users → Add User**
2. أضف مستخدم يدوياً
3. تحقق من:
   - هل تم إنشاء المستخدم في `auth.users`؟
   - هل تم إنشاء سجل في `event_users`؟
   - هل تم إرسال رسالة التحقق؟

---

## 🐛 المشاكل الشائعة والحلول

### المشكلة 1: "Missing Supabase Event environment variables"

**السبب:** المتغيرات غير موجودة في `.env.local`

**الحل:**
1. تأكد من وجود `.env.local` في جذر المشروع
2. أضف المتغيرات المطلوبة
3. أعد تشغيل dev server (`npm run dev`)

### المشكلة 2: "Invalid API key" أو "Invalid URL"

**السبب:** URL أو Key غير صحيح

**الحل:**
1. تحقق من Supabase Dashboard → Settings → API
2. انسخ `Project URL` و `anon public` key
3. تأكد من عدم وجود مسافات أو أخطاء
4. أعد تشغيل dev server

### المشكلة 3: لا يوجد شيء في Logs

**السبب:** العملية لم تحدث أصلاً (فشل قبل الوصول لـ Supabase)

**الحل:**
1. افتح Console في المتصفح (F12)
2. حاول إنشاء حساب
3. ابحث عن أخطاء في Console
4. تحقق من Network tab (F12 → Network)
5. ابحث عن requests إلى Supabase

### المشكلة 4: المستخدم يُنشأ لكن لا يوجد في event_users

**السبب:** الـ trigger لا يعمل

**الحل:**
1. تحقق من أن migration `010_vetap_event_auth_sync.sql` تم تطبيقه
2. تحقق من أن migration `011_vetap_event_users_contact_info.sql` تم تطبيقه
3. تحقق من وجود الـ trigger:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
4. إذا لم يكن موجوداً، قم بتطبيق migrations مرة أخرى

### المشكلة 5: رسالة التحقق لا تصل

**السبب:** Email settings غير مفعلة أو SMTP غير مُعد

**الحل:**
1. Authentication → Settings → Email Auth
2. تأكد من تفعيل "Enable email confirmations"
3. تحقق من SMTP Settings
4. جرب إرسال test email من Supabase Dashboard
5. تحقق من Spam folder

---

## 🔧 خطوات التشخيص الكاملة

### 1. تحقق من Console Logs

افتح Console في المتصفح (F12) وابحث عن:
- `Attempting signup with:` - يجب أن يظهر Supabase URL
- `Signup response:` - يجب أن يظهر user data أو error
- أي أخطاء باللون الأحمر

### 2. تحقق من Network Requests

في Network tab (F12 → Network):
- ابحث عن requests إلى `supabase.co`
- تحقق من status code (يجب أن يكون 200)
- تحقق من response body

### 3. تحقق من Supabase Dashboard

- Authentication → Users → يجب أن ترى المستخدم الجديد
- Database → Logs → ابحث عن أي أخطاء
- Database → Tables → event_users → تحقق من وجود السجل

### 4. اختبار مباشر

```sql
-- في Supabase SQL Editor
-- 1. تحقق من المستخدمين
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. تحقق من event_users
SELECT id, email, name, phone, country, city, created_at 
FROM event_users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. تحقق من الـ trigger
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgname = 'on_auth_user_created';
```

---

## ✅ Checklist للتحقق

- [ ] `.env.local` موجود ويحتوي على `NEXT_PUBLIC_SUPABASE_EVENT_URL` و `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY`
- [ ] المتغيرات صحيحة ومطابقة لـ Supabase Dashboard
- [ ] Dev server تم إعادة تشغيله بعد إضافة المتغيرات
- [ ] "Enable email signup" مفعل في Supabase
- [ ] "Enable email confirmations" مفعل في Supabase
- [ ] Migrations تم تطبيقها (`010_vetap_event_auth_sync.sql` و `011_vetap_event_users_contact_info.sql`)
- [ ] الـ trigger موجود ويعمل
- [ ] لا توجد أخطاء في Console
- [ ] لا توجد أخطاء في Network requests

---

## 📞 إذا استمرت المشكلة

1. **تحقق من Console Logs** - ابحث عن أخطاء محددة
2. **تحقق من Network Tab** - ابحث عن failed requests
3. **تحقق من Supabase Dashboard Logs** - Database → Logs
4. **جرب إنشاء مستخدم يدوياً** - Authentication → Users → Add User
5. **تحقق من Email Settings** - Authentication → Settings → Email Auth

