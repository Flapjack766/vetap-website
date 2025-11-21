# تعليمات الإعداد السريع

## 1. إنشاء ملف `.env.local`

أنشئ ملف `.env.local` في جذر المشروع (بجانب `package.json`) وأضف المتغيرات التالية:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ppuvrzkrqvkkkwrfzyus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdXZyemtycXZra2t3cmZ6eXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTk3OTUsImV4cCI6MjA3OTIzNTc5NX0.VEtUfRVt4hFwGzGOKEcmQD12GGnATuo65FvuOlLlLHw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdXZyemtycXZra2t3cmZ6eXVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY1OTc5NSwiZXhwIjoyMDc5MjM1Nzk1fQ.QmrbivVeGDEf_1jHKliJ0QRlRIeIcQ07qpBu7Z38FSM

# Existing variables (if not already set)
RESEND_API_KEY=re_jXdGhvqB_Cii4BwmMzH8mJsnxbwjQx4WJ
COMPANY_EMAIL=info@vetaps.com
COMPANY_NAME=VETAP
FROM_EMAIL="VETAP <info@vetaps.com>"
SITE_URL=https://vetaps.com
```

## 2. إعادة تشغيل السيرفر

بعد إنشاء `.env.local`، يجب إعادة تشغيل سيرفر التطوير:

1. أوقف السيرفر الحالي (Ctrl+C)
2. شغّل مرة أخرى: `npm run dev`

## 3. إنشاء الجداول في Supabase

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اذهب إلى **SQL Editor**
4. انسخ محتوى ملف `supabase/schema.sql`
5. قم بتشغيل SQL script

## 4. اختبار النظام

1. اذهب إلى `/en/signup` أو `/ar/signup`
2. أنشئ حساب جديد
3. تحقق من أن البروفايل تم إنشاؤه تلقائياً في Supabase

## ملاحظات مهمة

- ملف `.env.local` **لا يتم رفعه** إلى GitHub (موجود في `.gitignore`)
- يجب إعادة تشغيل السيرفر بعد أي تغيير في `.env.local`
- تأكد من أن Supabase project نشط وليس في وضع paused

