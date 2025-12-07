# 🔧 VETAP Event - إصلاح إنشاء event_users عبر API Route

## ⚠️ المشكلة

بعد signup:
- ✅ المستخدم يُنشأ في `auth.users`
- ❌ لا توجد session (لأن email confirmation مطلوب)
- ❌ الـ trigger قد لا يعمل
- ❌ Manual insert لا يعمل بدون session (RLS يمنع)

---

## ✅ الحل

تم إنشاء API route يستخدم **service role key** لإنشاء `event_users`:

**الملف:** `app/api/event/users/create/route.ts`

**الميزات:**
- ✅ يستخدم `createEventAdminClient()` (service role key)
- ✅ يتجاوز RLS policies
- ✅ يعمل حتى بدون session
- ✅ يتحقق من وجود المستخدم قبل الإنشاء

---

## 🔧 الإعداد

### الخطوة 1: أضف Service Role Key

في `.env.local`:

```env
# VETAP Event Service Role Key
SUPABASE_EVENT_SERVICE_ROLE_KEY=your-event-service-role-key
```

**كيفية الحصول على Service Role Key:**
1. اذهب إلى Supabase Event Dashboard
2. Settings → API
3. انسخ **service_role** key (ليس anon key!)

---

### الخطوة 2: تحقق من الملف

`lib/supabase/event-admin.ts` يجب أن يحتوي على:

```typescript
export function createEventAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL!,
    process.env.SUPABASE_EVENT_SERVICE_ROLE_KEY!,
    // ...
  );
}
```

---

## 🎯 كيف يعمل

1. **بعد signup:**
   - المستخدم يُنشأ في `auth.users`
   - الكود ينتظر 1.5 ثانية للـ trigger

2. **إذا لم يوجد event_users:**
   - يحاول الحصول على session
   - إذا لم تكن متاحة، يستدعي API route
   - API route يستخدم service role key لإنشاء السجل

3. **النتيجة:**
   - ✅ `event_users` يُنشأ حتى بدون session
   - ✅ يعمل حتى مع email confirmation مفعّل

---

## 📋 Checklist

- [ ] `SUPABASE_EVENT_SERVICE_ROLE_KEY` موجود في `.env.local`
- [ ] Service role key من Event project (ليس المشروع الرئيسي)
- [ ] Dev server أُعيد تشغيله
- [ ] API route موجود: `app/api/event/users/create/route.ts`

---

## 🚨 ملاحظات أمنية

- ⚠️ Service role key يتجاوز RLS - استخدمه بحذر
- ✅ API route يتحقق من البيانات قبل الإنشاء
- ✅ API route يتحقق من وجود المستخدم قبل الإنشاء
- ✅ يجب أن يُستدعى فقط من client بعد signup ناجح

---

## 🎯 النتيجة

بعد الإعداد:

- ✅ Signup يعمل حتى مع email confirmation مفعّل
- ✅ `event_users` يُنشأ عبر API route إذا فشل trigger
- ✅ لا توجد أخطاء RLS
- ✅ المستخدم يمكنه تسجيل الدخول بعد تأكيد البريد

