# 🔧 VETAP Event - إصلاح RLS Policy للـ INSERT

## ⚠️ المشكلة

```
❌ Failed to create event_users manually: {}
```

**السبب:** RLS (Row Level Security) policies تمنع المستخدم الجديد من إنشاء سجل لنفسه في جدول `event_users`.

**السياق:**
- عند التسجيل، يتم إنشاء المستخدم في `auth.users` (Supabase Auth)
- Trigger `handle_new_auth_user()` يحاول إنشاء سجل في `event_users`
- إذا فشل Trigger، يحاول الكود إنشاء السجل يدوياً
- لكن RLS policies تمنع المستخدم من إنشاء سجل لنفسه

---

## ✅ الحل

### إضافة RLS Policy جديدة:

**Policy:** "Users can insert own record"

**الشرط:** المستخدم يمكنه إنشاء سجل لنفسه فقط (`id = auth.uid()`)

```sql
-- Users can insert their own record (for signup)
CREATE POLICY "Users can insert own record"
  ON event_users FOR INSERT
  WITH CHECK (id = auth.uid());
```

---

## 📋 الملفات المعدلة

1. ✅ `supabase/migrations/009_vetap_event_rls_policies.sql`
2. ✅ `supabase/migrations/ALL_VETAP_EVENT_MIGRATIONS.sql`

---

## 🔧 خطوات التطبيق

### في Supabase Dashboard:

1. **Database → SQL Editor**
2. **شغل هذا الكود:**

```sql
-- Users can insert their own record (for signup)
DROP POLICY IF EXISTS "Users can insert own record" ON event_users;
CREATE POLICY "Users can insert own record" ON event_users
  FOR INSERT
  WITH CHECK (id = auth.uid());
```

3. **اضغط "Run"**

---

## 🎯 النتيجة

- ✅ المستخدم الجديد يمكنه إنشاء سجل لنفسه في `event_users`
- ✅ Trigger يعمل بشكل صحيح
- ✅ Fallback (إنشاء يدوي) يعمل إذا فشل Trigger
- ✅ لا توجد أخطاء RLS عند التسجيل

---

## 🔍 التحقق

**بعد تطبيق الإصلاح:**

1. حاول إنشاء حساب جديد
2. افتح Browser Console (F12)
3. يجب أن ترى:
   ```
   ✅ Event user created successfully by trigger
   ```
   أو
   ```
   ✅ Event user created manually (fallback)
   ```

**إذا رأيت:**
- ✅ لا توجد أخطاء → الإصلاح نجح
- ❌ لا يزال الخطأ موجود → تحقق من أن Policy طُبقت في Supabase

---

## 📝 ملاحظات

- هذه Policy تسمح للمستخدم بإنشاء سجل لنفسه فقط
- لا يمكن للمستخدم إنشاء سجلات لمستخدمين آخرين
- Owners و Partner Admins يمكنهم إنشاء سجلات للمستخدمين الآخرين (policies موجودة)

