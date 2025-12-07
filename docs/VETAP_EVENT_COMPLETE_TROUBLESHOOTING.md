# 🔧 VETAP Event - دليل حل المشاكل الشامل

## ⚠️ المشاكل الحالية

1. ❌ تسجيل الدخول لا يعمل
2. ❌ مشكلة في التواصل بين قاعدة البيانات والموقع
3. ❌ رسالة التحقق تأتي من المشروع الرئيسي

---

## 🔍 التشخيص الشامل

### 1️⃣ تحقق من Environment Variables

**في `.env.local`:**

```env
# VETAP Main
NEXT_PUBLIC_SUPABASE_URL=https://ppuvrzkrqvkkkwrfzyus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...main-key

# VETAP Event
NEXT_PUBLIC_SUPABASE_EVENT_URL=https://mdqjgliaidrzkfxlnwtv.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=eyJhbGc...event-key
```

**تحقق من:**
- [ ] URLs مختلفة تماماً
- [ ] Keys مختلفة تماماً
- [ ] لا توجد أخطاء في `.env.local`

**بعد التغيير:**
- [ ] أعد تشغيل dev server

---

### 2️⃣ تحقق من Migrations

**في Supabase Dashboard:**

1. **Database → Tables**
2. **ابحث عن جداول `event_*`**

**يجب أن ترى 13 جدول:**
- `event_users` ⭐ (هذا المهم!)

**إذا لم تكن موجودة:**

1. **Database → SQL Editor**
2. **طبق ملف:** `supabase/migrations/ALL_VETAP_EVENT_MIGRATIONS.sql`
3. **اضغط "Run"**

---

### 3️⃣ تحقق من RLS Policies

**في Supabase Dashboard:**

1. **Database → Tables → `event_users` → Policies**
2. **يجب أن ترى:**
   - "Users can view their own record"
   - "Users can update their own record"
   - "Owners can manage all users"

**إذا لم تكن موجودة:**

1. **Database → SQL Editor**
2. **طبق ملف:** `supabase/migrations/009_vetap_event_rls_policies.sql`

---

### 4️⃣ تحقق من Trigger

**في Supabase Dashboard:**

1. **Database → Database → Functions**
2. **يجب أن ترى:**
   - `handle_new_auth_user()`
   - `sync_auth_user_email()`

3. **Database → Database → Triggers**
4. **يجب أن ترى:**
   - `on_auth_user_created` على `auth.users`

**إذا لم تكن موجودة:**

1. **Database → SQL Editor**
2. **طبق ملف:** `supabase/migrations/010_vetap_event_auth_sync.sql`

---

### 5️⃣ اختبار الاتصال

**افتح:**
```
http://localhost:7000/ar/event/test-connection
```

**اضغط "Test Supabase Event Connection"**

**يجب أن ترى:**
- ✅ Connection Successful
- ✅ Database query: success
- ✅ User created

**إذا رأيت أخطاء:**
- اقرأ رسالة الخطأ في Console
- اتبع الحل المناسب أدناه

---

## ✅ حلول المشاكل الشائعة

### المشكلة 1: "relation event_users does not exist"

**السبب:** Migrations لم تُطبق

**الحل:**
1. اذهب إلى Supabase Dashboard → SQL Editor
2. طبق ملف `ALL_VETAP_EVENT_MIGRATIONS.sql`
3. تحقق من أن جميع الجداول موجودة

---

### المشكلة 2: "permission denied" أو "RLS Error"

**السبب:** RLS policies تمنع الوصول

**الحل:**
1. تحقق من RLS policies في Supabase Dashboard
2. للمستخدم الأول، اجعله Owner:
   ```sql
   UPDATE event_users
   SET role = 'owner'::user_role
   WHERE email = 'your-email@example.com';
   ```

---

### المشكلة 3: "User not found"

**السبب:** المستخدم غير موجود في `event_users`

**الحل:**
1. تحقق من Supabase Dashboard → Database → Tables → `event_users`
2. إذا لم يكن موجوداً:
   - أنشئه يدوياً، أو
   - أعد إنشاء الحساب

---

### المشكلة 4: Login لا يعمل

**السبب:** مشكلة في Authentication أو Database

**الحل:**
1. افتح Browser Console (F12)
2. حاول تسجيل الدخول
3. اقرأ رسائل الخطأ
4. اتبع الحل المناسب

---

### المشكلة 5: Email يأتي من المشروع الرئيسي

**السبب:** SMTP Settings غير مُعد في Event project

**الحل:**
1. اذهب إلى Supabase Event Dashboard
2. Authentication → Settings → SMTP Settings
3. أضف SMTP مخصص مع Sender Email مختلف

---

## 📋 Checklist الشامل

### Environment Variables:
- [ ] `NEXT_PUBLIC_SUPABASE_EVENT_URL` موجود
- [ ] `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY` موجود
- [ ] URLs مختلفة عن المشروع الرئيسي
- [ ] Keys مختلفة عن المشروع الرئيسي
- [ ] Dev server أُعيد تشغيله

### Database:
- [ ] جميع Migrations طُبقت
- [ ] جميع الجداول موجودة (13 جدول)
- [ ] RLS Policies موجودة
- [ ] Trigger موجود
- [ ] المستخدم موجود في `event_users`

### Authentication:
- [ ] Login يعمل
- [ ] Signup يعمل
- [ ] Email confirmation يعمل
- [ ] Email يأتي من Event project

---

## 🎯 الخلاصة

**المشاكل المحتملة:**
1. Migrations لم تُطبق
2. RLS policies تمنع الوصول
3. Environment Variables خاطئة
4. SMTP Settings غير مُعد

**الحل:**
1. طبق Migrations
2. تحقق من RLS policies
3. تحقق من Environment Variables
4. أعد تشغيل dev server
5. اختبر الاتصال

