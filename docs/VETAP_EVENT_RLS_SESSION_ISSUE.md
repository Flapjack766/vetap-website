# 🔧 VETAP Event - مشكلة RLS مع Session

## ⚠️ المشكلة

```
Error: new row violates row-level security policy for table "event_users"
Code: 42501
```

**السبب:** RLS policy موجودة لكن `auth.uid()` لا يعمل لأن session غير متاحة مباشرة بعد signup.

---

## 🔍 السبب

بعد `signUp()` في Supabase:

1. **إذا كان email confirmation مطلوب:**
   - المستخدم يُنشأ في `auth.users`
   - لكن session لا تُنشأ حتى يتم تأكيد البريد
   - `auth.uid()` لا يعمل في RLS policies بدون session

2. **إذا كان email confirmation غير مطلوب:**
   - session تُنشأ مباشرة
   - `auth.uid()` يعمل بشكل صحيح

---

## ✅ الحل

### الحل 1: تعطيل Email Confirmation (للاختبار)

في Supabase Dashboard:

1. **Authentication → Settings → Email Auth**
2. **"Enable email confirmations"** → OFF
3. احفظ

**ملاحظة:** هذا للاختبار فقط. في الإنتاج، يجب تفعيل email confirmation.

---

### الحل 2: الاعتماد على Trigger فقط

الـ trigger `handle_new_auth_user()` يعمل حتى بدون session لأنه يعمل على `auth.users` مباشرة.

**الكود الحالي:**
- يحاول query `event_users` بعد 1.5 ثانية
- إذا لم يوجد، يحاول manual insert
- لكن manual insert يحتاج session

**الحل:** الاعتماد على trigger فقط وعدم محاولة manual insert.

---

### الحل 3: استخدام Service Role Key (للمستخدمين الجدد فقط)

يمكن استخدام service role key لإنشاء `event_users` للمستخدمين الجدد، لكن هذا يتطلب API route.

---

## 🎯 التوصية

**للاختبار:**
1. عطّل email confirmation في Supabase
2. جرب إنشاء حساب جديد
3. يجب أن يعمل trigger بشكل صحيح

**للإنتاج:**
1. فعّل email confirmation
2. اعتمد على trigger فقط
3. إذا فشل trigger، أضف API route يستخدم service role key

---

## 📝 ملاحظات

- Trigger يعمل حتى بدون session
- Manual insert يحتاج session
- Session غير متاحة إذا كان email confirmation مطلوب
- الحل الأفضل: الاعتماد على trigger فقط

