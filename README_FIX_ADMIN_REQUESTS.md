# إصلاح مشكلة عدم ظهور الطلبات في لوحة الأدمن

## المشكلة

عندما يقوم المستخدم بطلب يوزر مخصص، لا يظهر الطلب في لوحة تحكم الأدمن.

## السبب

سياسات RLS (Row Level Security) في Supabase تسمح للمستخدمين فقط برؤية طلباتهم الخاصة. الأدمن يحتاج إلى صلاحيات خاصة لرؤية جميع الطلبات.

## الحل

### الخطوة 1: الحصول على Admin User ID

1. اذهب إلى **Supabase Dashboard** → **SQL Editor**
2. نفّذ هذا الاستعلام:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'admin@vetaps.com';
   ```
3. انسخ الـ `id` (User ID)

### الخطوة 2: إضافة Admin User إلى جدول admin_users

1. في **SQL Editor**، نفّذ:
   ```sql
   -- استبدل 'YOUR_ADMIN_USER_ID' بالـ ID الذي حصلت عليه
   INSERT INTO admin_users (user_id)
   VALUES ('YOUR_ADMIN_USER_ID_HERE'::uuid)
   ON CONFLICT (user_id) DO NOTHING;
   ```

**مثال:**
```sql
INSERT INTO admin_users (user_id)
VALUES ('123e4567-e89b-12d3-a456-426614174000'::uuid)
ON CONFLICT (user_id) DO NOTHING;
```

### الخطوة 3: تطبيق إصلاح RLS Policies

1. في **SQL Editor**، نفّذ ملف `supabase/fix-admin-username-requests-rls.sql`
2. أو انسخ المحتوى وقم بتشغيله

### الخطوة 4: التحقق من الإعداد

1. تأكد من أن Admin User موجود في جدول `admin_users`:
   ```sql
   SELECT * FROM admin_users;
   ```

2. تأكد من أن السياسات موجودة:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'username_requests';
   ```

3. اختبر:
   - سجّل دخول بحساب الأدمن
   - اذهب إلى `/admin`
   - يجب أن ترى جميع الطلبات

## ملاحظات

- **جدول admin_users**: هذا جدول جديد لتخزين معرفات الأدمن (أكثر مرونة من القائمة الثابتة في الكود)
- **السياسات**: الآن الأدمن يمكنه رؤية جميع الطلبات، والمستخدمون العاديون يرون طلباتهم فقط
- **لإضافة أدمن آخر**: أضف User ID إلى جدول `admin_users` فقط

## استكشاف الأخطاء

إذا لم تظهر الطلبات بعد الإصلاح:

1. **تحقق من Admin User ID:**
   ```sql
   SELECT id FROM auth.users WHERE email = 'admin@vetaps.com';
   ```

2. **تحقق من وجود Admin في الجدول:**
   ```sql
   SELECT * FROM admin_users;
   ```

3. **تحقق من الطلبات الموجودة:**
   ```sql
   SELECT * FROM username_requests;
   ```

4. **تحقق من RLS Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'username_requests';
   ```

5. **افتح Console في المتصفح (F12)** وتحقق من أي أخطاء في Network tab

