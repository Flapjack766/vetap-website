# 🔧 VETAP Event - إصلاح سريع لـ RLS Policy

## ⚠️ المشكلة

```
❌ Failed to create event_users manually: {}
```

**السبب:** RLS policy تمنع المستخدم من إنشاء سجل لنفسه.

---

## ✅ الحل السريع

### الخطوة 1: افتح Supabase Dashboard

1. اذهب إلى: https://supabase.com/dashboard
2. اختر مشروع **Event** (ليس المشروع الرئيسي)
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
- Owners و Partner Admins يمكنهم إنشاء سجلات للمستخدمين الآخرين

---

## 🚨 إذا استمرت المشكلة

1. **تحقق من Browser Console (F12)**
2. **ابحث عن رسائل الخطأ المفصلة**
3. **تحقق من أن Policy طُبقت:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'event_users' 
   AND policyname = 'Users can insert own record';
   ```

4. **إذا لم تكن موجودة، أعد تطبيق الـ SQL**

