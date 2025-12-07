# 🔍 VETAP Event - تشخيص مشكلة Email من المشروع الخاطئ

## ⚠️ المشكلة

رسالة التحقق من الإيميل تصل من مشروع VETAP العادي بدلاً من Event، رغم أن SMTP settings موجودة في Event project.

---

## 🔍 التشخيص

### الخطوة 1: تحقق من Browser Console

عند إنشاء حساب في Event:

1. **افتح Browser Console** (F12)
2. **ابحث عن:**
   ```
   ✅ Creating Supabase Event client:
      url: https://mdqjgliaidrzkfxlnwtv.supabase.co
      📡 All requests will go to: https://mdqjgliaidrzkfxlnwtv.supabase.co
      📧 Email confirmations will be sent from Event project: https://mdqjgliaidrzkfxlnwtv.supabase.co
   ```

**إذا رأيت:**
- ✅ URL صحيح (`mdqjgliaidrzkfxlnwtv.supabase.co`) → الكود صحيح
- ❌ URL خاطئ (`ppuvrzkrqvkkkwrfzyus.supabase.co`) → المشكلة في Environment Variables

---

### الخطوة 2: تحقق من Network Tab

1. **افتح Browser DevTools → Network**
2. **أنشئ حساب جديد**
3. **ابحث عن requests إلى `supabase.co`**
4. **تحقق من:**
   - **Request URL:** يجب أن يكون `https://mdqjgliaidrzkfxlnwtv.supabase.co/auth/v1/signup`
   - **Request Headers:** يجب أن تحتوي على Event anon key

**إذا رأيت:**
- ✅ `mdqjgliaidrzkfxlnwtv.supabase.co` → الطلب يذهب إلى Event
- ❌ `ppuvrzkrqvkkkwrfzyus.supabase.co` → الطلب يذهب إلى المشروع الرئيسي (مشكلة!)

---

### الخطوة 3: تحقق من Supabase Dashboard

#### في Event Project:

1. **Authentication → Logs**
2. **ابحث عن:**
   - `signup` events
   - `email_confirmation_sent` events

**إذا رأيت:**
- ✅ Events موجودة → الطلب يصل إلى Event project
- ❌ لا توجد events → الطلب لا يصل إلى Event project

#### في Main Project:

1. **Authentication → Logs**
2. **ابحث عن:**
   - `signup` events من نفس الوقت

**إذا رأيت:**
- ❌ Events موجودة → الطلب يذهب إلى المشروع الرئيسي (مشكلة!)

---

## ✅ الحلول المحتملة

### الحل 1: تحقق من Environment Variables

**في `.env.local`:**

```env
# يجب أن تكون مختلفة تماماً!
NEXT_PUBLIC_SUPABASE_URL=https://ppuvrzkrqvkkkwrfzyus.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_URL=https://mdqjgliaidrzkfxlnwtv.supabase.co
```

**تحقق من:**
- [ ] URLs مختلفة تماماً
- [ ] Keys مختلفة تماماً
- [ ] لا توجد أخطاء في `.env.local`

---

### الحل 2: أعد تشغيل Dev Server

بعد تغيير `.env.local`:

1. **أوقف dev server** (Ctrl+C)
2. **أعد تشغيله:**
   ```bash
   npm run dev
   ```

**مهم:** Environment Variables تُحمّل عند بدء Server فقط!

---

### الحل 3: تحقق من Supabase Dashboard Settings

#### في Event Project:

1. **Authentication → Settings → Email Auth**
2. **تحقق من:**
   - `Enable Email Confirmations` = `ON`
   - SMTP Settings مُعد

3. **Authentication → Settings → SMTP Settings**
4. **تحقق من:**
   - SMTP Host مُعد
   - Sender Email مُعد
   - Sender Email مختلف عن المشروع الرئيسي

---

### الحل 4: تحقق من Email Template

#### في Event Project:

1. **Authentication → Email Templates**
2. **Confirm signup:** اضغط "Edit"
3. **تحقق من:**
   - **From Email:** يجب أن يكون من Event project
   - **Subject:** يحتوي على `{{ .ConfirmationURL }}`

---

## 🔍 إذا استمرت المشكلة

### 1. تحقق من أن الطلب يذهب إلى Event

**في Browser Console:**
```
📤 Sending signup request to Supabase Event...
🔍 Client URL verification:
   clientUrl: https://mdqjgliaidrzkfxlnwtv.supabase.co
   expectedUrl: https://mdqjgliaidrzkfxlnwtv.supabase.co
   matches: true
```

**إذا رأيت `matches: false`:** المشكلة في Environment Variables

### 2. تحقق من Network Request

**في Network Tab:**
- Request URL يجب أن يكون: `https://mdqjgliaidrzkfxlnwtv.supabase.co/auth/v1/signup`
- Request Headers يجب أن تحتوي على Event anon key

### 3. تحقق من Supabase Logs

**في Event Project → Authentication → Logs:**
- يجب أن ترى `signup` event
- يجب أن ترى `email_confirmation_sent` event

**إذا لم ترى events:** الطلب لا يصل إلى Event project

---

## 📋 Checklist

- [ ] Browser Console يظهر Event URL صحيح
- [ ] Network Tab يظهر request إلى Event URL
- [ ] Supabase Event Dashboard → Authentication → Logs يظهر events
- [ ] Environment Variables صحيحة في `.env.local`
- [ ] Dev server أُعيد تشغيله بعد تغيير `.env.local`
- [ ] SMTP Settings مُعد في Event project
- [ ] Sender Email مختلف عن المشروع الرئيسي

---

## 🎯 الخلاصة

**إذا كان الكود صحيح (يستخدم Event URL):**
- المشكلة في Supabase Dashboard settings
- تحقق من SMTP Settings في Event project
- تحقق من Email Templates

**إذا كان الكود خاطئ (يستخدم Main URL):**
- المشكلة في Environment Variables
- تحقق من `.env.local`
- أعد تشغيل dev server

