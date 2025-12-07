# VETAP Event - إعداد متغيرات البيئة

## ⚠️ مهم جداً: يجب استخدام مفاتيح مشروع Event وليس المشروع الرئيسي

---

## 📋 الخطوات

### 1. إنشاء ملف `.env.local`

**في جذر المشروع** (نفس مستوى `package.json`):

أنشئ ملف `.env.local` إذا لم يكن موجوداً، أو أضف المتغيرات التالية:

```env
# ============================================
# VETAP Event - Supabase Configuration
# ============================================
# هذه مفاتيح مشروع Supabase Event المنفصل
# NOT the main project keys!
# ============================================

NEXT_PUBLIC_SUPABASE_EVENT_URL=https://your-event-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItZXZlbnQtcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk4NzY1NDMyLCJleHAiOjIwMTQzNDE0MzJ9.your-anon-key-here
```

### 2. الحصول على المفاتيح من Supabase Dashboard

1. **اذهب إلى Supabase Dashboard:**
   - https://supabase.com/dashboard

2. **اختر مشروع VETAP Event:**
   - ⚠️ **مهم:** تأكد من أنك في مشروع **Event** وليس المشروع الرئيسي
   - يجب أن ترى اسم المشروع في أعلى الصفحة

3. **Settings → API:**
   - انسخ `Project URL` → هذا هو `NEXT_PUBLIC_SUPABASE_EVENT_URL`
   - انسخ `anon public` key → هذا هو `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY`

4. **الصق في `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_EVENT_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=eyJhbGc...
   ```

### 3. إعادة تشغيل Dev Server

**مهم جداً:** بعد إضافة أو تعديل `.env.local`:

```bash
# أوقف dev server (Ctrl+C)
# ثم أعد التشغيل:
npm run dev
```

**لماذا؟**
- Next.js يقرأ `.env.local` عند بدء التشغيل فقط
- التعديلات لا تُطبق بدون إعادة التشغيل

---

## ✅ التحقق من الإعداد

### 1. افتح صفحة الاختبار

```
http://localhost:7000/ar/event/test-connection
```

### 2. اضغط "Test Supabase Event Connection"

### 3. افتح Console (F12)

**يجب أن ترى:**

```
🔍 Environment Variables Check:
   NEXT_PUBLIC_SUPABASE_EVENT_URL: ✅ Present
   NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY: ✅ Present
   NEXT_PUBLIC_SUPABASE_URL (main): ✅ Not present (أو ⚠️ Present)

✅ Creating Supabase Event client:
   url: https://xxxxx.supabase.co
   hasKey: true
   keyPreview: eyJhbGciOiJIUzI1NiIs...

✅ Supabase Event client created successfully
📡 All requests will go to: https://xxxxx.supabase.co
```

### 4. تحقق من النتيجة

**إذا نجح:**
- ✅ يجب أن ترى "Connection Successful"
- ✅ يجب أن ترى user created في Supabase Dashboard → Authentication → Users

**إذا فشل:**
- ❌ تحقق من Console logs
- ❌ تحقق من أن المتغيرات موجودة في `.env.local`
- ❌ تحقق من أن dev server تم إعادة تشغيله

---

## 🐛 المشاكل الشائعة

### المشكلة 1: "Missing environment variables"

**السبب:** `.env.local` غير موجود أو المتغيرات غير موجودة

**الحل:**
1. تأكد من وجود `.env.local` في جذر المشروع
2. تأكد من أن المتغيرات تبدأ بـ `NEXT_PUBLIC_SUPABASE_EVENT_` (ليس `NEXT_PUBLIC_SUPABASE_`)
3. أعد تشغيل dev server

### المشكلة 2: "Invalid Supabase Event URL format"

**السبب:** URL غير صحيح

**الحل:**
- يجب أن يبدأ بـ `https://`
- يجب أن يحتوي على `.supabase.co`
- مثال صحيح: `https://xxxxx.supabase.co`

### المشكلة 3: الطلب لا يصل إلى Supabase Event

**السبب:** قد تكون تستخدم مفاتيح المشروع الرئيسي

**الحل:**
1. تحقق من Console - يجب أن ترى `NEXT_PUBLIC_SUPABASE_EVENT_URL: ✅ Present`
2. تحقق من أن URL في Console يطابق Event project URL
3. تأكد من أنك في مشروع Event في Supabase Dashboard

### المشكلة 4: Console يظهر "Using main Supabase URL"

**السبب:** المتغيرات البيئة غير صحيحة

**الحل:**
1. تحقق من `.env.local`
2. تأكد من أن المتغيرات تبدأ بـ `NEXT_PUBLIC_SUPABASE_EVENT_`
3. أعد تشغيل dev server

---

## 🔍 التحقق النهائي

### في Console (F12):

```
✅ Creating Supabase Event client:
   url: https://your-event-project.supabase.co  ← يجب أن يكون Event project
   hasKey: true
   
📡 All requests will go to: https://your-event-project.supabase.co  ← يجب أن يكون Event project
```

### في Supabase Dashboard:

1. **اذهب إلى مشروع Event:**
   - Authentication → Users → يجب أن ترى المستخدم الجديد
   - Database → Logs → يجب أن ترى queries

2. **إذا لم ترَ شيء:**
   - تحقق من أن URL في Console يطابق Event project URL
   - تحقق من Network tab - ابحث عن requests إلى Event project URL

---

## ✅ Checklist

- [ ] `.env.local` موجود في جذر المشروع
- [ ] `NEXT_PUBLIC_SUPABASE_EVENT_URL` موجود ويبدأ بـ `https://`
- [ ] `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY` موجود
- [ ] URL يطابق Event project URL من Supabase Dashboard
- [ ] Key يطابق `anon public` key من Event project
- [ ] Dev server تم إعادة تشغيله بعد إضافة المتغيرات
- [ ] Console يظهر "Creating Supabase Event client" مع Event URL
- [ ] صفحة الاختبار تعمل: `/ar/event/test-connection`
- [ ] Supabase Dashboard → Event project → Authentication → Users → المستخدم موجود

---

## 📞 إذا استمرت المشكلة

1. **انسخ Console Logs** من صفحة الاختبار
2. **انسخ Environment Variables** (بدون الكي)
3. **تحقق من Network Tab** - ابحث عن requests إلى Supabase
4. **تحقق من Supabase Dashboard** - تأكد من أنك في مشروع Event

