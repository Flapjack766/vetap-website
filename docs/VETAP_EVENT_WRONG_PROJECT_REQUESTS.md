# 🚨 VETAP Event - الطلبات تذهب إلى المشروع الرئيسي

## ⚠️ المشكلة

الطلبات تذهب إلى المشروع الرئيسي بدلاً من Event project:

```
GET https://ppuvrzkrqvkkkwrfzyus.supabase.co/rest/v1/event_users  (❌ المشروع الرئيسي)
POST https://ppuvrzkrqvkkkwrfzyus.supabase.co/rest/v1/event_users (❌ المشروع الرئيسي)
```

**يجب أن تكون:**
```
GET https://mdqjgliaidrzkfxlnwtv.supabase.co/rest/v1/event_users  (✅ Event project)
POST https://mdqjgliaidrzkfxlnwtv.supabase.co/rest/v1/event_users (✅ Event project)
```

---

## 🔍 السبب

المشكلة قد تكون:

1. **Cookies من المشروع الرئيسي:** `createBrowserClient` قد يستخدم cookies من المشروع الرئيسي
2. **Client caching:** قد يكون هناك client cached من المشروع الرئيسي
3. **Environment variables:** قد تكون هناك مشكلة في Environment Variables

---

## ✅ الحل

### الخطوة 1: تحقق من Browser Console

افتح Browser Console (F12) وابحث عن:
```
✅ Creating Supabase Event client: {url: 'https://mdqjgliaidrzkfxlnwtv.supabase.co'...}
```

**إذا رأيت URL صحيح → المشكلة في cookies أو caching**

### الخطوة 2: امسح Cookies و Cache

1. **افتح Browser DevTools (F12)**
2. **Application → Storage → Clear site data**
3. **أو امسح cookies يدوياً:**
   - Application → Cookies
   - ابحث عن cookies تحتوي على `supabase`
   - احذفها

### الخطوة 3: Hard Refresh

1. **اضغط `Ctrl + Shift + R` (Windows) أو `Cmd + Shift + R` (Mac)**
2. **أو افتح صفحة جديدة في Incognito Mode**

### الخطوة 4: تحقق من Network Tab

1. **افتح Browser DevTools → Network**
2. **حاول إنشاء حساب جديد**
3. **ابحث عن requests إلى `supabase.co`**
4. **تحقق من Request URL:**
   - يجب أن يكون `https://mdqjgliaidrzkfxlnwtv.supabase.co` (Event)
   - ليس `https://ppuvrzkrqvkkkwrfzyus.supabase.co` (المشروع الرئيسي)

---

## 🔧 إذا استمرت المشكلة

### الحل 1: استخدم Incognito Mode

افتح صفحة جديدة في Incognito Mode وجرب التسجيل.

### الحل 2: تحقق من Environment Variables

في `.env.local`:

```env
# يجب أن تكون مختلفة تماماً
NEXT_PUBLIC_SUPABASE_URL=https://ppuvrzkrqvkkkwrfzyus.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_URL=https://mdqjgliaidrzkfxlnwtv.supabase.co
```

### الحل 3: أعد تشغيل Dev Server

```bash
# أوقف dev server
Ctrl + C

# أعد تشغيله
npm run dev
```

---

## 📋 Checklist

- [ ] Cookies و Cache تم مسحها
- [ ] Hard Refresh تم
- [ ] Network Tab يظهر Event URL
- [ ] Environment Variables صحيحة
- [ ] Dev server أُعيد تشغيله

---

## 🎯 الخلاصة

**المشكلة:** الطلبات تذهب إلى المشروع الرئيسي بسبب cookies أو caching

**الحل:** امسح cookies و cache، ثم جرب مرة أخرى

