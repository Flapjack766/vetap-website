# ✅ VETAP Event - التحقق من استخدام Environment Variables الصحيحة

## 🔍 المفاتيح المطلوبة

جميع ملفات Event يجب أن تستخدم:

- ✅ `NEXT_PUBLIC_SUPABASE_EVENT_URL` - URL مشروع Event Supabase
- ✅ `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY` - Anon Key مشروع Event Supabase

**يجب ألا تستخدم:**
- ❌ `NEXT_PUBLIC_SUPABASE_URL` - URL المشروع الرئيسي
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon Key المشروع الرئيسي

---

## ✅ الملفات التي تم التحقق منها

### 1. `lib/supabase/event-client.ts` ✅

**يستخدم:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY;
```

**التحقق:**
- ✅ يتحقق من وجود Event keys
- ✅ يتحقق من عدم تطابق Event URL مع Main URL
- ✅ يتحقق من عدم تطابق Event Key مع Main Key
- ✅ يرمي خطأ إذا كانت المفاتيح متطابقة

**الكود:**
```typescript
// CRITICAL: Use EVENT-specific environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY;

// CRITICAL: Verify we're NOT using main project keys
if (mainUrl && mainUrl === supabaseUrl) {
  throw new Error('CRITICAL ERROR: Event Supabase URL matches main project URL!');
}

if (mainKey && mainKey === supabaseAnonKey) {
  throw new Error('CRITICAL ERROR: Event Supabase key matches main project key!');
}

// Create client using EVENT keys ONLY
const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
```

---

### 2. `lib/supabase/event-middleware.ts` ✅

**يستخدم:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY;
```

**التحقق:**
- ✅ يتحقق من وجود Event keys
- ✅ يتحقق من عدم تطابق Event URL مع Main URL
- ✅ يتحقق من عدم تطابق Event Key مع Main Key
- ✅ يطبع تحذيرات في Console

**الكود:**
```typescript
// CRITICAL: Use Event Supabase credentials (NOT main project)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY;

// CRITICAL: Verify we're NOT using main project keys
if (mainUrl && mainUrl === supabaseUrl) {
  console.error('❌ CRITICAL ERROR: Event Supabase URL matches main project URL!');
}

if (mainKey && mainKey === supabaseAnonKey) {
  console.error('❌ CRITICAL ERROR: Event Supabase key matches main project key!');
}

const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {...});
```

---

### 3. `app/(components)/event/auth/EventSignUpForm.tsx` ✅

**يستخدم:**
```typescript
import { createEventClient } from '@/lib/supabase/event-client';

const supabase = createEventClient(); // Uses EVENT keys
```

**التحقق:**
- ✅ يستخدم `createEventClient()` الذي يستخدم Event keys
- ✅ يتحقق من أن URL مختلف عن Main project
- ✅ يطبع logs واضحة

---

### 4. `app/(components)/event/auth/EventLoginForm.tsx` ✅

**يستخدم:**
```typescript
import { createEventClient } from '@/lib/supabase/event-client';

const supabase = createEventClient(); // Uses EVENT keys
```

---

### 5. `app/(components)/event/auth/EventForgotPasswordForm.tsx` ✅

**يستخدم:**
```typescript
import { createEventClient } from '@/lib/supabase/event-client';

const supabase = createEventClient(); // Uses EVENT keys
```

---

### 6. `app/(components)/event/auth/EventResetPasswordForm.tsx` ✅

**يستخدم:**
```typescript
import { createEventClient } from '@/lib/supabase/event-client';

const supabase = createEventClient(); // Uses EVENT keys
```

---

### 7. `app/[locale]/event/test-connection/page.tsx` ✅

**يستخدم:**
```typescript
import { createEventClient } from '@/lib/supabase/event-client';

const supabase = createEventClient(); // Uses EVENT keys
```

---

## ✅ الخلاصة

**جميع ملفات Event تستخدم المفاتيح الصحيحة!** ✅

| الملف | يستخدم Event Keys | التحقق |
|------|-------------------|--------|
| `lib/supabase/event-client.ts` | ✅ | ✅ |
| `lib/supabase/event-middleware.ts` | ✅ | ✅ |
| `EventSignUpForm.tsx` | ✅ | ✅ |
| `EventLoginForm.tsx` | ✅ | ✅ |
| `EventForgotPasswordForm.tsx` | ✅ | ✅ |
| `EventResetPasswordForm.tsx` | ✅ | ✅ |
| `test-connection/page.tsx` | ✅ | ✅ |

---

## 🔍 كيفية التحقق

### 1. افتح Browser Console (F12)

عند فتح أي صفحة Event Auth، يجب أن ترى:

```
🔍 Environment Variables Check:
   NEXT_PUBLIC_SUPABASE_EVENT_URL: ✅ Present
   NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY: ✅ Present
   NEXT_PUBLIC_SUPABASE_URL (main): ⚠️ Present (should NOT be used for Event)
   NEXT_PUBLIC_SUPABASE_ANON_KEY (main): ⚠️ Present (should NOT be used for Event)

✅ Creating Supabase Event client:
   url: https://mdqjgliaidrzkfxlnwtv.supabase.co
   ✅ Verified: Using Event Supabase (not main project)
   📡 All requests will go to: https://mdqjgliaidrzkfxlnwtv.supabase.co
```

### 2. تحقق من `.env.local`

يجب أن يحتوي على:

```env
# Main VETAP (يجب أن يكون مختلف)
NEXT_PUBLIC_SUPABASE_URL=https://ppuvrzkrqvkkkwrfzyus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...main-key

# Event VETAP (يجب أن يكون مختلف)
NEXT_PUBLIC_SUPABASE_EVENT_URL=https://mdqjgliaidrzkfxlnwtv.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=eyJhbGc...event-key
```

**مهم:** يجب أن تكون URLs و Keys مختلفة تماماً!

### 3. تحقق من Network Tab

1. افتح صفحة Event Auth (مثل `/ar/event/signup`)
2. حاول إنشاء حساب
3. ابحث عن requests إلى `supabase.co`
4. تحقق من URL في request:
   - ✅ يجب أن يكون: `https://mdqjgliaidrzkfxlnwtv.supabase.co` (Event)
   - ❌ يجب ألا يكون: `https://ppuvrzkrqvkkkwrfzyus.supabase.co` (Main)

---

## ❌ إذا رأيت خطأ

### خطأ: "CRITICAL ERROR: Event Supabase URL matches main project URL!"

**السبب:** `.env.local` يحتوي على نفس URL للمشروعين

**الحل:**
1. افتح `.env.local`
2. تحقق من أن URLs مختلفة:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ppuvrzkrqvkkkwrfzyus.supabase.co
   NEXT_PUBLIC_SUPABASE_EVENT_URL=https://mdqjgliaidrzkfxlnwtv.supabase.co
   ```
3. يجب أن تكون مختلفة تماماً!

### خطأ: "Missing VETAP Event Supabase environment variables"

**السبب:** `.env.local` لا يحتوي على Event keys

**الحل:**
1. افتح `.env.local`
2. أضف:
   ```env
   NEXT_PUBLIC_SUPABASE_EVENT_URL=https://mdqjgliaidrzkfxlnwtv.supabase.co
   NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=your-event-anon-key
   ```
3. أعد تشغيل dev server

---

## ✅ Checklist

- [x] `event-client.ts` يستخدم `NEXT_PUBLIC_SUPABASE_EVENT_URL` و `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY`
- [x] `event-middleware.ts` يستخدم `NEXT_PUBLIC_SUPABASE_EVENT_URL` و `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY`
- [x] جميع Event Auth Components تستخدم `createEventClient()`
- [x] تم إضافة تحقق من عدم استخدام Main keys
- [x] تم إضافة logging شامل للتحقق
- [x] تم إزالة التكرار في `event-client.ts`

---

## 🎯 النتيجة النهائية

**جميع ملفات Event تستخدم `NEXT_PUBLIC_SUPABASE_EVENT_URL` و `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY` فقط!** ✅

لا يوجد أي استخدام للمفاتيح الرئيسية (`NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_ANON_KEY`) في Event service.

