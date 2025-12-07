# VETAP Event - استكشاف مشاكل الاتصال

## 🔍 المشكلة: الطلب لا يصل إلى Supabase Event

إذا لم ترَ أي شيء في Supabase Dashboard → Authentication → Logs، فهذا يعني أن الطلب لا يصل إلى Supabase Event.

---

## ✅ خطوات التحقق

### 1. تحقق من متغيرات البيئة

**افتح `.env.local` في جذر المشروع:**

```env
NEXT_PUBLIC_SUPABASE_EVENT_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**مهم جداً:**
- ✅ يجب أن تبدأ بـ `NEXT_PUBLIC_` (لأنها تُستخدم في Client Components)
- ✅ يجب أن تكون في `.env.local` (ليس `.env`)
- ✅ يجب إعادة تشغيل dev server بعد التعديل

### 2. تحقق من Supabase Dashboard

**اذهب إلى مشروع VETAP Event (ليس المشروع الرئيسي):**
- Settings → API
- انسخ `Project URL` و `anon public` key
- تأكد من مطابقتها لما في `.env.local`

### 3. استخدم صفحة الاختبار

**افتح في المتصفح:**
```
http://localhost:7000/ar/event/test-connection
أو
http://localhost:7000/en/event/test-connection
```

**اضغط "Test Supabase Event Connection"**

**ستحصل على:**
- ✅ معلومات عن Environment Variables
- ✅ نتيجة الاتصال
- ✅ نتيجة Signup test
- ✅ أي أخطاء

### 4. تحقق من Console Logs

**افتح Console (F12) وابحث عن:**

```
✅ Creating Supabase Event client:
   - url: https://xxxxx.supabase.co
   - hasKey: true

🔍 Attempting signup with:
   - email: ...
   - supabaseUrl: https://xxxxx.supabase.co
   - hasAnonKey: true

📤 Sending signup request to Supabase Event...
```

**إذا لم ترَ هذه الرسائل:**
- المتغيرات البيئة غير موجودة أو غير صحيحة
- أو dev server لم يُعاد تشغيله

---

## 🐛 المشاكل الشائعة

### المشكلة 1: "Missing environment variables"

**السبب:** `.env.local` غير موجود أو المتغيرات غير موجودة

**الحل:**
1. أنشئ `.env.local` في جذر المشروع
2. أضف المتغيرات:
   ```env
   NEXT_PUBLIC_SUPABASE_EVENT_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=eyJhbGc...
   ```
3. أعد تشغيل dev server: `npm run dev`

### المشكلة 2: "Invalid Supabase Event URL format"

**السبب:** URL غير صحيح

**الحل:**
- يجب أن يبدأ بـ `https://`
- يجب أن يحتوي على `.supabase.co`
- مثال صحيح: `https://xxxxx.supabase.co`

### المشكلة 3: الطلب يصل لكن لا يوجد في Logs

**السبب:** قد تكون في مشروع Supabase خاطئ

**الحل:**
1. تأكد من أنك في مشروع **VETAP Event** (ليس المشروع الرئيسي)
2. تحقق من URL في `.env.local` يطابق Project URL في Dashboard
3. تحقق من Key في `.env.local` يطابق `anon public` key في Dashboard

### المشكلة 4: CORS Error أو Network Error

**السبب:** URL غير صحيح أو Key غير صحيح

**الحل:**
1. تحقق من Network tab (F12 → Network)
2. ابحث عن failed requests
3. تحقق من error message
4. تأكد من URL و Key صحيحة

---

## 🔧 خطوات التشخيص الكاملة

### 1. افتح صفحة الاختبار

```
http://localhost:7000/ar/event/test-connection
```

### 2. اضغط "Test Supabase Event Connection"

### 3. افتح Console (F12)

### 4. انسخ جميع الرسائل

### 5. تحقق من النتيجة

**إذا نجح:**
- ✅ يجب أن ترى "Connection Successful"
- ✅ يجب أن ترى user created في Supabase Dashboard

**إذا فشل:**
- ❌ ابحث عن error message
- ❌ تحقق من Environment Variables
- ❌ تحقق من Supabase Dashboard

---

## ✅ Checklist

- [ ] `.env.local` موجود في جذر المشروع
- [ ] `NEXT_PUBLIC_SUPABASE_EVENT_URL` موجود وصحيح
- [ ] `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY` موجود وصحيح
- [ ] URL يطابق Project URL في Supabase Dashboard
- [ ] Key يطابق `anon public` key في Supabase Dashboard
- [ ] Dev server تم إعادة تشغيله بعد إضافة المتغيرات
- [ ] صفحة الاختبار تعمل: `/ar/event/test-connection`
- [ ] Console يظهر "Creating Supabase Event client"
- [ ] Supabase Dashboard → Authentication → Users → المستخدم موجود

---

## 📞 إذا استمرت المشكلة

1. **انسخ Console Logs** من صفحة الاختبار
2. **انسخ Environment Variables** (بدون الكي)
3. **تحقق من Network Tab** - ابحث عن requests إلى Supabase
4. **تحقق من Supabase Dashboard** - Authentication → Users

