# إعداد حساب الأدمن

## الخطوة 1: إنشاء المستخدم في Supabase Auth

1. اذهب إلى **Supabase Dashboard** → **Authentication** → **Users**
2. اضغط على **Add User** (أو **Invite User**)
3. أدخل البيانات التالية:
   - **Email**: `admin@vetaps.com`
   - **Password**: `Aa@0556160304.com`
   - **Auto Confirm User**: ✅ (مفعل)
4. اضغط **Create User**

## الخطوة 2: الحصول على User ID

1. بعد إنشاء المستخدم، اذهب إلى **SQL Editor** في Supabase
2. نفّذ هذا الاستعلام:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'admin@vetaps.com';
   ```
3. انسخ `id` (User ID) - سيكون شكله مثل: `123e4567-e89b-12d3-a456-426614174000`

## الخطوة 3: إنشاء Profile للمستخدم

1. في **SQL Editor**، نفّذ ملف `supabase/create-admin-user.sql`
2. أو نفّذ هذا الكود (سيقوم بإنشاء Profile تلقائياً):
   ```sql
   -- Run the SQL from supabase/create-admin-user.sql
   ```

## الخطوة 4: تحديث ملف Admin Page

1. افتح ملف `app/[locale]/admin/page.tsx`
2. ابحث عن `ADMIN_USER_IDS`
3. أضف User ID الذي حصلت عليه في الخطوة 2:

```typescript
const ADMIN_USER_IDS = [
  'YOUR_ADMIN_USER_ID_HERE', // أضف الـ ID هنا
];
```

**مثال:**
```typescript
const ADMIN_USER_IDS = [
  '123e4567-e89b-12d3-a456-426614174000',
];
```

## الخطوة 5: اختبار تسجيل الدخول

1. اذهب إلى `/{locale}/login`
2. سجّل دخول بـ:
   - **Email**: `admin@vetaps.com`
   - **Password**: `Aa@0556160304.com`
3. بعد تسجيل الدخول، اذهب إلى `/{locale}/admin`
4. يجب أن تتمكن من الوصول إلى لوحة تحكم الأدمن

## ملاحظات مهمة

- **الأمان**: تأكد من أن كلمة المرور قوية وآمنة
- **User ID**: يجب أن يكون User ID صحيحاً وإلا لن يتمكن الأدمن من الوصول
- **Profile**: يجب إنشاء Profile للمستخدم حتى يعمل النظام بشكل صحيح

## التحقق من الإعداد

بعد إكمال جميع الخطوات، تحقق من:

1. ✅ المستخدم موجود في `auth.users`
2. ✅ Profile موجود في `profiles` table
3. ✅ User ID موجود في `ADMIN_USER_IDS` في الكود
4. ✅ يمكن تسجيل الدخول بنجاح
5. ✅ يمكن الوصول إلى `/admin` page

