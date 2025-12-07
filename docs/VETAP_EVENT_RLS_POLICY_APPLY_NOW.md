# 🚨 VETAP Event - تطبيق RLS Policy الآن

## ⚠️ المشكلة

```
Error: new row violates row-level security policy for table "event_users"
Code: 42501
```

**السبب:** RLS policy "Users can insert own record" لم تُطبق بعد في Supabase Event project.

---

## ✅ الحل السريع

### الخطوة 1: افتح Supabase Event Dashboard

1. اذهب إلى: https://supabase.com/dashboard
2. **اختر مشروع Event** (ليس المشروع الرئيسي)
   - يجب أن ترى URL: `https://mdqjgliaidrzkfxlnwtv.supabase.co`
3. اذهب إلى: **Database → SQL Editor**

### الخطوة 2: شغل هذا الكود

انسخ والصق هذا الكود في SQL Editor:

```sql
-- Users can insert their own record (for signup)
DROP POLICY IF EXISTS "Users can insert own record" ON event_users;
CREATE POLICY "Users can insert own record" ON event_users
  FOR INSERT
  WITH CHECK (id = auth.uid());
```

### الخطوة 3: اضغط "Run"

- يجب أن ترى: `Success. No rows returned`
- إذا رأيت خطأ، تأكد من أنك في مشروع Event الصحيح

---

## 🔍 التحقق

### في Supabase Dashboard:

1. **Database → Tables → `event_users`**
2. **اضغط على "Policies" tab**
3. **يجب أن ترى policy:** "Users can insert own record"
4. **تحقق من:**
   - Policy name: "Users can insert own record"
   - Operation: INSERT
   - WITH CHECK: `id = auth.uid()`

---

## 🎯 النتيجة

بعد تطبيق الإصلاح:

- ✅ المستخدم الجديد يمكنه إنشاء سجل لنفسه
- ✅ Trigger يعمل بشكل صحيح
- ✅ Fallback (إنشاء يدوي) يعمل إذا فشل Trigger
- ✅ لا توجد أخطاء RLS عند التسجيل

---

## 📝 ملاحظات

- هذه Policy تسمح للمستخدم بإنشاء سجل لنفسه فقط (`id = auth.uid()`)
- لا يمكن للمستخدم إنشاء سجلات لمستخدمين آخرين
- Owners و Partner Admins يمكنهم إنشاء سجلات للمستخدمين الآخرين (policies موجودة)

---

## 🚨 إذا استمرت المشكلة

### تحقق من:

1. **أنك في مشروع Event الصحيح:**
   - URL يجب أن يكون: `https://mdqjgliaidrzkfxlnwtv.supabase.co`
   - ليس: `https://ppuvrzkrqvkkkwrfzyus.supabase.co`

2. **أن Policy طُبقت:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'event_users' 
   AND policyname = 'Users can insert own record';
   ```

3. **أن RLS مفعل على الجدول:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'event_users';
   ```
   - `rowsecurity` يجب أن يكون `true`

---

## ✅ الخلاصة

**المشكلة:** RLS policy لم تُطبق بعد

**الحل:** طبق الـ SQL أعلاه في Supabase Event project

**بعد التطبيق:** جرب إنشاء حساب جديد مرة أخرى

