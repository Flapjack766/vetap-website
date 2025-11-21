# نظام البروفايلات المتعددة

## نظرة عامة

تم تطوير نظام يسمح للمستخدمين بإنشاء وإدارة بروفايلات متعددة، مع دعم:
- **يوزرات عشوائية**: حد أقصى 3 بروفايلات عشوائية لكل مستخدم
- **يوزرات مخصصة**: عدد لا نهائي (عبر طلب في لوحة الإدارة)
- **قوالب مخصصة**: كل بروفايل يمكنه أن يكون له قالب مخصص خاص به

## الملفات المطلوبة

### 1. ملفات SQL

#### أ) `supabase/multi-profiles-schema.sql`
- إزالة UNIQUE constraint من `username_random`
- إضافة أعمدة: `profile_name`, `is_primary`, `username_type`, `is_deleted`
- إنشاء functions للتحقق من الحد الأقصى للبروفايلات العشوائية

#### ب) `supabase/update-username-requests-schema.sql`
- إضافة `profile_id` إلى جدول `username_requests`

#### ج) `supabase/add-custom-template-id.sql` (موجود مسبقاً)
- إضافة `custom_template_id` إلى جدول `profiles`

#### د) `supabase/fix-custom-templates-unique.sql` (موجود مسبقاً)
- إزالة UNIQUE constraint من `custom_templates.profile_id`

### 2. ملفات API

#### أ) `app/api/profiles/create/route.ts`
- API لإنشاء بروفايل جديد (عشوائي فقط)
- يتحقق من الحد الأقصى (3 بروفايلات عشوائية)

#### ب) `app/api/admin/approve-username/route.ts` (محدث)
- عند الموافقة على يوزر مخصص، ينشئ بروفايل جديد بدلاً من تحديث الموجود
- يربط البروفايل الجديد بـ `username_custom`

### 3. مكونات الواجهة

#### أ) `app/(components)/dashboard/ProfileSelector.tsx`
- مكون لعرض جميع البروفايلات
- إمكانية التبديل بين البروفايلات
- زر لإنشاء بروفايل جديد (عشوائي)

#### ب) `app/(components)/dashboard/DashboardContent.tsx` (محدث)
- إضافة `ProfileSelector` في أعلى الصفحة
- دعم التبديل بين البروفايلات

#### ج) `app/(components)/dashboard/tabs/LinkTab.tsx` (محدث)
- إضافة `profile_id` عند طلب يوزر مخصص

## الخطوات المطلوبة

### 1. تشغيل ملفات SQL بالترتيب:

```sql
-- 1. إزالة UNIQUE constraint من custom_templates
supabase/fix-custom-templates-unique.sql

-- 2. إضافة custom_template_id
supabase/add-custom-template-id.sql

-- 3. نظام البروفايلات المتعددة
supabase/multi-profiles-schema.sql

-- 4. تحديث username_requests
supabase/update-username-requests-schema.sql
```

### 2. تحديث البيانات الموجودة:

```sql
-- تحديث البروفايلات الموجودة
UPDATE profiles 
SET username_type = 'random', 
    is_primary = true 
WHERE username_type IS NULL;

-- تحديث البروفايل الأول لكل مستخدم كـ primary
UPDATE profiles p1
SET is_primary = true
WHERE NOT EXISTS (
  SELECT 1
  FROM profiles p2
  WHERE p2.user_id = p1.user_id
    AND p2.created_at < p1.created_at
);
```

## كيفية العمل

### إنشاء بروفايل عشوائي:
1. المستخدم يضغط على "New Profile" في Dashboard
2. يدخل اسم البروفايل
3. النظام يتحقق من الحد الأقصى (3)
4. ينشئ بروفايل جديد مع `username_random` فريد

### طلب يوزر مخصص:
1. المستخدم يختار بروفايل معين
2. يذهب إلى تبويب "Your Link"
3. يطلب يوزر مخصص
4. عند الموافقة من الإدارة، يتم إنشاء بروفايل جديد مع `username_custom`

### القوالب المخصصة:
- كل بروفايل يمكنه طلب قالب مخصص
- القوالب المخصصة مرتبطة ببروفايل معين
- يمكن للمستخدم اختيار أي قالب (أساسي أو مخصص) لأي بروفايل

## ملاحظات مهمة

1. **البروفايلات القديمة**: البروفايلات الموجودة ستصبح `username_type = 'random'` و `is_primary = true` للبروفايل الأول

2. **الحد الأقصى**: النظام يمنع إنشاء أكثر من 3 بروفايلات عشوائية، لكن لا يوجد حد للبروفايلات المخصصة

3. **البروفايل الأساسي**: البروفايل الأول (الأقدم) يصبح `is_primary = true` تلقائياً

4. **الحذف الناعم**: البروفايلات لا تُحذف نهائياً، بل `is_deleted = true`

