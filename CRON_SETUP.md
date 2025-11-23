# إعداد Cron Job للتحقق من انتهاء مدة اليوزر المخصص

## نظرة عامة

تم إنشاء نظام تلقائي للتحقق من انتهاء مدة اليوزرات المخصصة وإرسال إيميلات للمستخدمين. النظام يتكون من:

1. **Database Function**: `check_expired_custom_usernames()` - تتحقق من البروفايلات المنتهية وتحدّثها
2. **API Route**: `/api/cron/check-expired-usernames` - تستدعي الدالة وترسل الإيميلات
3. **Cron Job**: مهمة مجدولة تعمل يومياً

## الخطوات المطلوبة

### 1. تشغيل Migration

قم بتشغيل ملف SQL التالي في Supabase:

```bash
supabase/add-custom-username-expired-flag.sql
```

أو قم بتشغيله يدوياً من Supabase Dashboard → SQL Editor.

### 2. إضافة متغيرات البيئة

أضف المتغير التالي في `.env.local`:

```env
CRON_SECRET=your-secret-token-here-change-this
```

**مهم**: استخدم token قوي وعشوائي لحماية endpoint من الاستخدام غير المصرح به.

### 3. إعداد Cron Job

#### خيار 1: Vercel Cron (موصى به)

إذا كنت تستخدم Vercel، تم إنشاء ملف `vercel.json` تلقائياً. الـ cron job سيعمل تلقائياً كل يوم في منتصف الليل (UTC).

**ملاحظة**: تأكد من إضافة `CRON_SECRET` في Vercel Environment Variables.

#### خيار 2: GitHub Actions

أنشئ ملف `.github/workflows/check-expired-usernames.yml`:

```yaml
name: Check Expired Usernames

on:
  schedule:
    # Run daily at midnight UTC
    - cron: '0 0 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  check-expired:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X GET "https://your-domain.com/api/cron/check-expired-usernames?secret=${{ secrets.CRON_SECRET }}"
```

#### خيار 3: External Cron Service

يمكنك استخدام أي خدمة cron خارجية مثل:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

**URL للاستدعاء**:
```
GET https://your-domain.com/api/cron/check-expired-usernames?secret=YOUR_CRON_SECRET
```

أو مع Authorization header:
```
GET https://your-domain.com/api/cron/check-expired-usernames
Authorization: Bearer YOUR_CRON_SECRET
```

#### خيار 4: Supabase Edge Function (Scheduled)

يمكنك إنشاء Supabase Edge Function مجدولة:

```typescript
// supabase/functions/check-expired-usernames/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Call the database function
  const { data, error } = await supabase.rpc('check_expired_custom_usernames')
  
  // Send emails (implement email sending logic here)
  
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

ثم قم بإعداد Supabase Cron من Dashboard.

## كيف يعمل النظام

### عند زيارة صفحة `/p/[slug]`:

1. النظام يبحث أولاً عن `username_custom` يطابق الـ slug
2. إذا وُجد، يتحقق من `custom_username_expires_at`
3. إذا انتهت المدة (`expiresAt <= now`):
   - يتجاهل `username_custom`
   - يبحث عن `username_random` بدلاً منه
4. إذا لم تنتهِ المدة، يستخدم `username_custom` بشكل طبيعي

### عند تشغيل Cron Job:

1. يستدعي دالة `check_expired_custom_usernames()` في قاعدة البيانات
2. الدالة تحدّث `custom_username_expired = TRUE` للبروفايلات المنتهية
3. ترجع قائمة بالبروفايلات المنتهية حديثاً
4. API route يرسل إيميل لكل مستخدم لديه بروفايل منتهي
5. الإيميل يخبر المستخدم بأن مدة اليوزر المخصص انتهت

## اختبار النظام

### اختبار يدوي:

```bash
# استدعاء API مباشرة
curl -X GET "http://localhost:7000/api/cron/check-expired-usernames?secret=your-secret-token-here"
```

### اختبار من Supabase:

```sql
-- اختبار الدالة مباشرة
SELECT * FROM check_expired_custom_usernames();

-- التحقق من البروفايلات المنتهية
SELECT 
  id,
  username_custom,
  custom_username_expires_at,
  custom_username_expired
FROM profiles
WHERE username_custom IS NOT NULL
  AND custom_username_expires_at IS NOT NULL
  AND custom_username_expires_at <= NOW();
```

## الأمان

- **CRON_SECRET**: يجب أن يكون token قوي وعشوائي
- **Authorization**: يمكن استخدام Authorization header بدلاً من query parameter
- **Rate Limiting**: يمكن إضافة rate limiting للـ endpoint إذا لزم الأمر

## المراقبة

يمكنك مراقبة الـ cron job من خلال:
- Vercel Logs (إذا كنت تستخدم Vercel)
- Supabase Logs (إذا كنت تستخدم Supabase Edge Functions)
- External cron service logs

## استكشاف الأخطاء

### المشكلة: Cron job لا يعمل

1. تحقق من أن `CRON_SECRET` مضبوط بشكل صحيح
2. تحقق من logs في خدمة الـ cron
3. تأكد من أن URL صحيح

### المشكلة: الإيميلات لا تُرسل

1. تحقق من `RESEND_API_KEY` في متغيرات البيئة
2. تحقق من `FROM_EMAIL` و `COMPANY_EMAIL`
3. راجع logs في API route

### المشكلة: البروفايلات لا تُحدّث

1. تحقق من أن migration تم تشغيله
2. تحقق من أن دالة `check_expired_custom_usernames()` موجودة
3. راجع logs في Supabase

## ملاحظات إضافية

- النظام يعمل تلقائياً بدون تدخل يدوي
- الإيميلات اختيارية (يمكن تعطيلها بتعليق الكود)
- يمكن تخصيص توقيت الـ cron حسب احتياجاتك
- يمكن إضافة إشعارات إضافية (SMS، Push notifications، إلخ)

