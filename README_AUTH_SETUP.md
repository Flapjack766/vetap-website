# إعداد نظام المصادقة والبروفايلات

## الخطوة 1: إعداد Supabase

1. قم بإنشاء مشروع جديد في [Supabase](https://supabase.com)
2. اذهب إلى **Settings** > **API**
3. انسخ:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## الخطوة 2: إعداد متغيرات البيئة

أنشئ ملف `.env.local` في جذر المشروع:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## الخطوة 3: إنشاء الجداول في Supabase

**مهم**: يجب تنفيذ هذه الخطوة قبل محاولة التسجيل!

### الطريقة السريعة (موصى بها):

1. اذهب إلى **SQL Editor** في Supabase Dashboard
2. انسخ محتوى ملف `supabase/simple-schema.sql`
3. قم بتشغيل SQL script
4. تحقق من الرسالة "Table created: true"

### الطريقة الكاملة (مع Trigger):

إذا كنت تريد استخدام Trigger تلقائي:

1. اذهب إلى **SQL Editor** في Supabase Dashboard
2. انسخ محتوى ملف `supabase/schema.sql`
3. قم بتشغيل SQL script

**ملاحظة**: إذا واجهت خطأ 500 عند التسجيل، استخدم `simple-schema.sql` بدلاً منه.

### ما سيتم إنشاؤه:

- جدول `profiles` مع جميع الحقول المطلوبة
- Indexes للبحث السريع
- Row Level Security (RLS) policies
- (اختياري) Trigger لإنشاء البروفايل تلقائياً عند التسجيل

## الخطوة 4: إعداد Email في Supabase

1. اذهب إلى **Authentication** > **Email Templates**
2. قم بتخصيص قوالب البريد الإلكتروني (اختياري)
3. تأكد من تفعيل **Email Auth** في **Authentication** > **Providers**

## الخطوة 5: اختبار النظام

1. شغّل المشروع: `npm run dev`
2. اذهب إلى `/en/signup` أو `/ar/signup`
3. أنشئ حساب جديد
4. تحقق من أن البروفايل تم إنشاؤه تلقائياً في Supabase

## الملفات المهمة

- `lib/supabase/client.ts` - Supabase client للعميل
- `lib/supabase/server.ts` - Supabase client للسيرفر
- `lib/supabase/middleware.ts` - Middleware للمصادقة
- `app/[locale]/signup/page.tsx` - صفحة التسجيل
- `app/[locale]/login/page.tsx` - صفحة تسجيل الدخول
- `app/[locale]/forgot-password/page.tsx` - صفحة نسيان كلمة المرور
- `app/[locale]/reset-password/page.tsx` - صفحة إعادة تعيين كلمة المرور
- `supabase/schema.sql` - SQL schema للجداول

## الخطوة 6: إعداد Storage لرفع الصور

1. اذهب إلى **Supabase Dashboard → SQL Editor**
2. انسخ محتوى ملف `supabase/storage-setup.sql`
3. قم بتشغيل SQL script
4. تحقق من أن bucket `avatars` تم إنشاؤه وأنه **public**

**مهم**: تأكد من أن Bucket هو **public** حتى يمكن عرض الصور.

## الخطوة 7: إعداد جدول طلبات اليوزر المخصص

1. اذهب إلى **Supabase Dashboard → SQL Editor**
2. انسخ محتوى ملف `supabase/username-requests-schema.sql`
3. قم بتشغيل SQL script
4. تحقق من أن جدول `username_requests` تم إنشاؤه بنجاح

## ملاحظات

- النظام يستخدم **نظام تسجيل واحد** للموقع كله (حساب واحد لكل شيء)
- كل مستخدم يحصل على `username_random` تلقائياً عند التسجيل
- `username_custom` يكون `null` حتى يطلب المستخدم يوزر مخصص
- البروفايل يتم إنشاؤه تلقائياً عبر Trigger في Supabase
- الصور يتم رفعها إلى Supabase Storage في bucket `avatars`

