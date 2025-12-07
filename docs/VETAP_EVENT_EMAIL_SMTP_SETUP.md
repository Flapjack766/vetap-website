# 🔧 VETAP Event - إعداد SMTP منفصل للـ Event

## ⚠️ المشكلة

رسالة التحقق من الإيميل تصل من مشروع VETAP العادي بدلاً من Event.

**السبب:** Supabase Event project يستخدم SMTP settings من مشروع آخر أو لا يحتوي على SMTP settings منفصلة.

---

## ✅ الحل: إعداد SMTP منفصل للـ Event

### الخطوة 1: اذهب إلى Supabase Event Dashboard

1. **اذهب إلى:** https://supabase.com/dashboard/project/mdqjgliaidrzkfxlnwtv
2. **تأكد من أنك في مشروع Event** (URL: `mdqjgliaidrzkfxlnwtv.supabase.co`)

### الخطوة 2: إعداد SMTP Settings

1. **Authentication → Settings → SMTP Settings**

#### الخيار 1: استخدام SMTP مخصص (مُوصى به)

**أضف SMTP Provider:**

1. **SMTP Host:** `smtp.gmail.com` (أو أي SMTP provider)
2. **SMTP Port:** `587` (أو `465` للـ SSL)
3. **SMTP User:** `your-email@gmail.com`
4. **SMTP Password:** `your-app-password` (لـ Gmail: App Password)
5. **Sender Email:** `event@vetaps.com` ⭐ **مهم: مختلف عن المشروع الرئيسي!**
6. **Sender Name:** `VETAP Event` (اختياري)
7. **احفظ**

**مثال:**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: event@vetaps.com
SMTP Password: your-app-password
Sender Email: event@vetaps.com
Sender Name: VETAP Event
```

#### الخيار 2: استخدام Supabase Default

1. **Authentication → Settings → Email Auth**
2. **Use Supabase Default SMTP:** `ON`
3. **احفظ**

**ملاحظة:**
- Email سيأتي من `noreply@mail.app.supabase.io`
- هذا طبيعي إذا كنت تستخدم Supabase Default
- لكن قد يكون مختلف عن المشروع الرئيسي

---

### الخطوة 3: تحقق من Email Templates

1. **Authentication → Email Templates**
2. **Confirm signup:** اضغط "Edit"
3. **تحقق من:**
   - **Subject:** يحتوي على `{{ .ConfirmationURL }}`
   - **Body:** يحتوي على رابط التحقق
   - **From Email:** يجب أن يكون من Event project

---

### الخطوة 4: اختبار

1. **أنشئ حساب جديد:** `http://localhost:7000/ar/event/signup`
2. **تحقق من Email:**
   - يجب أن يأتي من Event project
   - يجب أن يكون From Email مختلف عن المشروع الرئيسي

---

## 🔍 التحقق من المشكلة

### 1. تحقق من From Email في الرسالة

**إذا رأيت:**
- `noreply@mail.app.supabase.io` → Supabase Default (طبيعي)
- `noreply@vetaps.com` → من المشروع الرئيسي (مشكلة!)

**الحل:**
- استخدم SMTP مخصص مع Sender Email مختلف

### 2. تحقق من SMTP Settings

في Supabase Dashboard → Authentication → Settings → SMTP Settings:

**يجب أن ترى:**
- SMTP Host مُعد
- Sender Email مُعد
- Sender Email مختلف عن المشروع الرئيسي

---

## 📋 Checklist

- [ ] أنت في مشروع **Event** (URL: `mdqjgliaidrzkfxlnwtv.supabase.co`)
- [ ] SMTP Settings مُعد (أو Supabase Default مفعل)
- [ ] Sender Email مختلف عن المشروع الرئيسي
- [ ] Email Templates موجودة
- [ ] جربت إنشاء حساب جديد
- [ ] Email يأتي من Event project

---

## 🎯 الخلاصة

**المشكلة:** Email يأتي من المشروع الرئيسي

**السبب:** SMTP Settings غير مُعد بشكل صحيح في Event project

**الحل:** 
1. استخدم SMTP مخصص مع Sender Email مختلف
2. أو استخدم Supabase Default (سيأتي من `noreply@mail.app.supabase.io`)

**بعد الإصلاح:** Email سيأتي من Event project بشكل صحيح! ✅

