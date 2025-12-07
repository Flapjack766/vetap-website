# 🔧 VETAP Event - إصلاح: رسالة التحقق تأتي من مشروع VETAP العادي

## ⚠️ المشكلة

رسالة التحقق من الإيميل تصل من مشروع VETAP العادي بدلاً من Event عند إنشاء حساب في Event.

**السبب المحتمل:**
- Supabase Event project يستخدم SMTP settings من مشروع آخر
- أو Email Auth settings غير مُعد بشكل صحيح في Event project

---

## ✅ الحل: إعداد Email Auth في Supabase Event Project

### الخطوة 1: اذهب إلى Supabase Event Dashboard

1. **اذهب إلى:** https://supabase.com/dashboard/project/mdqjgliaidrzkfxlnwtv
2. **تأكد من أنك في مشروع Event** (URL: `mdqjgliaidrzkfxlnwtv.supabase.co`)

### الخطوة 2: تحقق من Email Auth Settings

1. **Authentication → Settings → Email Auth**

**تحقق من:**
- ✅ **Enable Email Signup:** `ON`
- ✅ **Enable Email Confirmations:** `ON`
- ✅ **SMTP Settings:** مُعد بشكل صحيح

### الخطوة 3: إعداد SMTP Settings للـ Event

#### الخيار 1: استخدام Supabase Default (للتطوير)

1. **Authentication → Settings → Email Auth**
2. **Use Supabase Default SMTP:** `ON`
3. **احفظ**

**ملاحظة:** 
- Supabase Default SMTP له حدود (3 emails/hour للمشاريع المجانية)
- Email سيأتي من `noreply@mail.app.supabase.io`

#### الخيار 2: استخدام SMTP مخصص (للإنتاج) ⭐ **مُوصى به**

1. **Authentication → Settings → SMTP Settings**
2. **أضف SMTP Provider:**
   - **Gmail:** `smtp.gmail.com:587`
   - **SendGrid:** `smtp.sendgrid.net:587`
   - **Mailgun:** `smtp.mailgun.org:587`
   - **أو أي SMTP provider آخر**
3. **أدخل Credentials:**
   - **SMTP Host:** `smtp.gmail.com` (مثال)
   - **SMTP Port:** `587`
   - **SMTP User:** `your-email@gmail.com`
   - **SMTP Password:** `your-app-password`
   - **Sender Email:** `noreply@yourdomain.com` ⭐ **هذا مهم!**
4. **احفظ**

**مهم:** 
- **Sender Email** يجب أن يكون مختلف عن المشروع الرئيسي
- مثال: `event@vetaps.com` بدلاً من `noreply@vetaps.com`

---

### الخطوة 4: تحقق من Email Templates

1. **Authentication → Email Templates**
2. **Confirm signup:** اضغط "Edit"
3. **تحقق من:**
   - **Subject:** يحتوي على `{{ .ConfirmationURL }}`
   - **Body:** يحتوي على رابط التحقق
   - **From Email:** يجب أن يكون من Event project

---

### الخطوة 5: اختبار

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

## ✅ الحل السريع

### إذا كنت تستخدم Supabase Default:

1. **Authentication → Settings → Email Auth**
2. **Use Supabase Default SMTP:** `ON`
3. **احفظ**

**النتيجة:**
- Email سيأتي من `noreply@mail.app.supabase.io`
- هذا طبيعي إذا كنت تستخدم Supabase Default

### إذا كنت تستخدم SMTP مخصص:

1. **Authentication → Settings → SMTP Settings**
2. **أضف Sender Email مختلف:**
   - مثال: `event@vetaps.com` (بدلاً من `noreply@vetaps.com`)
3. **احفظ**

**النتيجة:**
- Email سيأتي من `event@vetaps.com`
- مختلف عن المشروع الرئيسي

---

## 📋 Checklist

- [ ] أنت في مشروع **Event** (URL: `mdqjgliaidrzkfxlnwtv.supabase.co`)
- [ ] `Enable Email Confirmations` = `ON`
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

