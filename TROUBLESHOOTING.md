# حل المشاكل الشائعة

## خطأ: "Database error saving new user"

### الخطأ: `function generate_random_username() does not exist`

**السبب**: يوجد trigger في Supabase يستدعي function غير موجودة.

**الحل**:

1. **الطريقة السريعة**:
   - اذهب إلى **SQL Editor** في Supabase
   - انسخ محتوى `supabase/remove-trigger.sql`
   - قم بتشغيله
   - ثم شغّل `supabase/simple-schema.sql` مرة أخرى

2. **الطريقة اليدوية**:
   ```sql
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   DROP FUNCTION IF EXISTS handle_new_user();
   DROP FUNCTION IF EXISTS generate_random_username();
   ```

3. **بعد إزالة الـ trigger**:
   - جرّب التسجيل مرة أخرى
   - النظام سينشئ البروفايل يدوياً من الكود (لا يحتاج trigger)

### خطأ: "relation profiles does not exist"

**السبب**: جدول `profiles` غير موجود.

**الحل**:
1. اذهب إلى **SQL Editor** في Supabase
2. انسخ محتوى `supabase/simple-schema.sql`
3. قم بتشغيل SQL script
4. تحقق من الرسالة: `Table created: true`

### خطأ: "permission denied for table profiles"

**السبب**: RLS policies غير موجودة أو غير صحيحة.

**الحل**:
1. شغّل `supabase/simple-schema.sql` مرة أخرى
2. تأكد من أن جميع الـ policies موجودة:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
   ```
3. يجب أن ترى 4 policies:
   - Users can read own profile
   - Users can update own profile
   - Users can insert own profile
   - Public profiles are readable

### خطأ: "duplicate key value violates unique constraint"

**السبب**: `username_random` موجود مسبقاً (نادر جداً).

**الحل**: النظام سيعيد المحاولة تلقائياً. إذا استمرت المشكلة، تحقق من:
```sql
SELECT username_random FROM profiles ORDER BY created_at DESC LIMIT 10;
```

## التحقق من الإعداد

شغّل هذا في **SQL Editor** للتحقق:

```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) AS table_exists;

-- Check policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'profiles';
```

## إعادة الإعداد من الصفر

إذا كنت تريد البدء من جديد:

1. **احذف الجدول** (احذر: سيحذف جميع البيانات):
   ```sql
   DROP TABLE IF EXISTS profiles CASCADE;
   ```

2. **شغّل simple-schema.sql**:
   - انسخ محتوى `supabase/simple-schema.sql`
   - قم بتشغيله

3. **تحقق**:
   - اذهب إلى **Table Editor** في Supabase
   - يجب أن ترى جدول `profiles`

## ملاحظات مهمة

- ✅ النظام يعمل **بدون trigger** - البروفايل يُنشأ من الكود
- ✅ لا تحتاج `generate_random_username()` function
- ✅ `simple-schema.sql` هو الأفضل للبدء
- ❌ لا تشغّل `schema.sql` و `simple-schema.sql` معاً

