# 🔧 VETAP Event - حل مشكلة عدم وصول رسالة التحقق

## ⚠️ المشكلة

رسالة التحقق (Email Verification) لا تصل بعد إنشاء الحساب في VETAP Event.

---

## ✅ الحلول خطوة بخطوة

### 1️⃣ تحقق من إعدادات Email Auth في Supabase

#### الخطوة 1: اذهب إلى Supabase Dashboard

1. **اذهب إلى:** https://supabase.com/dashboard/project/mdqjgliaidrzkfxlnwtv
2. **Authentication → Settings → Email Auth**

#### الخطوة 2: تحقق من الإعدادات

**يجب أن تكون:**

- ✅ **Enable Email Signup:** `ON` (مفعل)
- ✅ **Enable Email Confirmations:** `ON` (مفعل) ⭐ **هذا مهم جداً!**
- ✅ **Secure Email Change:** `ON` (مفعل)
- ✅ **Double Confirm Email Changes:** `ON` (مفعل)

**إذا كانت `Enable Email Confirmations` = `OFF`:**
1. **شغّلها:** اضغط على Toggle لتفعيلها
2. **احفظ:** اضغط "Save"
3. **جرب مرة أخرى:** أنشئ حساب جديد

---

### 2️⃣ تحقق من Email Provider

#### الخطوة 1: Authentication → Settings → SMTP Settings

**تحقق من:**

- ✅ **SMTP Host:** يجب أن يكون مُعد (مثل `smtp.gmail.com` أو `smtp.sendgrid.net`)
- ✅ **SMTP Port:** يجب أن يكون مُعد (مثل `587` أو `465`)
- ✅ **SMTP User:** يجب أن يكون مُعد
- ✅ **SMTP Password:** يجب أن يكون مُعد
- ✅ **Sender Email:** يجب أن يكون مُعد

**إذا لم يكن مُعد:**

#### الخيار 1: استخدام Supabase Default (للتطوير)

1. **Authentication → Settings → Email Auth**
2. **Enable Email Confirmations:** `ON`
3. **Use Supabase Default SMTP:** `ON`
4. **احفظ**

**ملاحظة:** Supabase Default SMTP له حدود (3 emails/hour للمشاريع المجانية)

#### الخيار 2: استخدام SMTP مخصص (للإنتاج)

1. **Authentication → Settings → SMTP Settings**
2. **أضف SMTP Provider:**
   - **Gmail:** `smtp.gmail.com:587`
   - **SendGrid:** `smtp.sendgrid.net:587`
   - **Mailgun:** `smtp.mailgun.org:587`
   - **أو أي SMTP provider آخر**
3. **أدخل Credentials:**
   - SMTP Host
   - SMTP Port
   - SMTP User
   - SMTP Password
   - Sender Email
4. **احفظ**

---

### 3️⃣ تحقق من Email Templates

#### الخطوة 1: Authentication → Email Templates

**تحقق من:**

- ✅ **Confirm signup:** Template موجود ومُعد
- ✅ **Magic Link:** Template موجود ومُعد
- ✅ **Change Email Address:** Template موجود ومُعد
- ✅ **Reset Password:** Template موجود ومُعد

**إذا لم تكن موجودة:**

1. **Authentication → Email Templates**
2. **Confirm signup:** اضغط "Edit"
3. **تحقق من:**
   - Subject: يحتوي على `{{ .ConfirmationURL }}`
   - Body: يحتوي على رابط التحقق
4. **احفظ**

---

### 4️⃣ تحقق من Email Rate Limiting

#### المشكلة:

Supabase Default SMTP له حدود:
- **Free Plan:** 3 emails/hour
- **Pro Plan:** أكثر

**إذا تجاوزت الحد:**

1. **انتظر:** انتظر ساعة واحدة
2. **أو استخدم:** SMTP مخصص (لا حدود)

---

### 5️⃣ تحقق من Spam Folder

**تحقق من:**

- ✅ **Inbox:** ابحث عن email من Supabase
- ✅ **Spam/Junk:** ابحث عن email من Supabase
- ✅ **Promotions:** (إذا كان Gmail) ابحث في تبويب Promotions

**Email من Supabase عادة يكون من:**
- `noreply@mail.app.supabase.io`
- أو من Sender Email الذي حددته في SMTP Settings

---

### 6️⃣ تحقق من Email في Supabase Dashboard

#### الخطوة 1: Authentication → Users

1. **ابحث عن المستخدم الجديد**
2. **اضغط على المستخدم**
3. **تحقق من:**
   - ✅ **Email Confirmed:** `false` (إذا لم يتحقق بعد)
   - ✅ **Email:** صحيح
   - ✅ **Created At:** وقت الإنشاء

#### الخطوة 2: Authentication → Logs

1. **ابحث عن:**
   - `signup` events
   - `email_confirmation_sent` events
   - أي أخطاء متعلقة بـ email

**إذا رأيت:**
- ✅ `email_confirmation_sent` → Email تم إرساله
- ❌ `email_send_failed` → مشكلة في SMTP
- ❌ `email_rate_limit_exceeded` → تجاوز الحد

---

### 7️⃣ اختبار Email يدوياً

#### في Supabase Dashboard:

1. **Authentication → Users**
2. **اضغط على المستخدم**
3. **اضغط "Send Confirmation Email"**
4. **تحقق من:**
   - هل وصلت الرسالة؟
   - هل هناك أي أخطاء في Logs؟

---

## 🔍 التحقق من الكود

### في `EventSignUpForm.tsx`:

الكود الحالي يرسل email confirmation تلقائياً:

```typescript
const { data: authData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/${locale}/event/dashboard`,
    data: {
      name: name.trim(),
      phone: phone.trim(),
      phone_country_code: selectedCountry.phoneCode,
      country: selectedCountry.name,
      city: city.trim(),
    },
  },
});
```

**هذا صحيح!** Supabase يرسل email confirmation تلقائياً إذا كان `Enable Email Confirmations` = `ON`.

---

## ✅ Checklist

- [ ] `Enable Email Confirmations` = `ON` في Supabase Dashboard
- [ ] SMTP Settings مُعد (أو Supabase Default مفعل)
- [ ] Email Templates موجودة
- [ ] لم تتجاوز Email Rate Limit
- [ ] تحققت من Spam Folder
- [ ] تحققت من Authentication → Users → Email Confirmed
- [ ] تحققت من Authentication → Logs → email_confirmation_sent
- [ ] جربت "Send Confirmation Email" يدوياً

---

## 🛠️ الحل السريع

### إذا كنت تستخدم Supabase Default SMTP:

1. **Authentication → Settings → Email Auth**
2. **Enable Email Confirmations:** `ON` ⭐
3. **احفظ**
4. **انتظر 5 دقائق** (لإعادة تحميل الإعدادات)
5. **جرب إنشاء حساب جديد**

### إذا كنت تستخدم SMTP مخصص:

1. **Authentication → Settings → SMTP Settings**
2. **تحقق من جميع الإعدادات:**
   - SMTP Host
   - SMTP Port
   - SMTP User
   - SMTP Password
   - Sender Email
3. **احفظ**
4. **جرب "Send Test Email"** (إذا متاح)
5. **جرب إنشاء حساب جديد**

---

## 📊 ملخص

**المشكلة الأكثر شيوعاً:** `Enable Email Confirmations` = `OFF`

**الحل:** شغّلها في Supabase Dashboard → Authentication → Settings → Email Auth

**بعد التفعيل:** جرب إنشاء حساب جديد، يجب أن تصل رسالة التحقق.

---

## ❓ إذا استمرت المشكلة

1. **تحقق من Logs:**
   - Authentication → Logs
   - Database → Logs
   - ابحث عن أخطاء متعلقة بـ email

2. **تحقق من SMTP:**
   - جرب SMTP provider آخر
   - تحقق من Credentials

3. **تحقق من Email:**
   - جرب email مختلف
   - تحقق من أن Email صحيح

4. **اتصل بـ Supabase Support:**
   - إذا كانت المشكلة مستمرة
   - قد تكون مشكلة في Supabase infrastructure

