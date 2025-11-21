# إصلاح خطأ "new row violates row-level security policy"

## المشكلة
عند محاولة رفع صورة، يظهر الخطأ:
```
new row violates row-level security policy
```

## الحل النهائي

### الخطوة 1: شغّل ملف SQL الجديد

افتح **Supabase SQL Editor** وشغّل الملف:
```
supabase/fix-template-images-storage-v2.sql
```

هذا الملف سيقوم بـ:
1. ✅ التأكد من وجود bucket `template-images` وأنه public
2. ✅ حذف جميع الـ policies القديمة
3. ✅ إنشاء policies جديدة صحيحة

### الخطوة 2: تحقق من Bucket

بعد تشغيل SQL، تحقق من:
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'template-images';
```

يجب أن ترى:
- `id`: template-images
- `name`: template-images  
- `public`: true ✅

### الخطوة 3: تحقق من Policies

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%template%';
```

يجب أن ترى 4 policies:
1. Users can upload template images
2. Users can view own template images
3. Public can view template images
4. Users can delete own template images

---

## إذا استمرت المشكلة

### 1. تحقق من Console Logs

افتح Developer Console (F12) وتحقق من:
- User ID الذي يتم استخدامه
- المسار الذي يتم رفعه
- رسالة الخطأ الكاملة

### 2. تحقق من Authentication

تأكد أن:
- المستخدم مسجل دخول ✅
- `auth.uid()` يعمل بشكل صحيح

### 3. تحقق من Bucket Settings

في Supabase Dashboard → Storage → template-images:
- ✅ Public bucket: **true**
- ✅ File size limit: كافٍ (5MB على الأقل)

### 4. اختبر الـ Policy يدوياً

```sql
-- استبدل YOUR_USER_ID بـ user ID الفعلي
SELECT auth.uid(); -- للحصول على user ID الحالي

-- اختبر الـ policy
INSERT INTO storage.objects (bucket_id, name, owner)
VALUES (
  'template-images',
  (SELECT auth.uid()::text || '/test.jpg'),
  auth.uid()
);
```

---

## الحل البديل (إذا لم يعمل)

إذا استمرت المشكلة، استخدم هذا SQL:

```sql
-- حذف جميع policies
DROP POLICY IF EXISTS "Users can upload template images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own template images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view template images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own template images" ON storage.objects;

-- إنشاء policies بسيطة (أقل تقييداً للاختبار)
CREATE POLICY "Allow authenticated uploads to template-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'template-images');

CREATE POLICY "Allow authenticated selects from template-images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'template-images');

CREATE POLICY "Allow public selects from template-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'template-images');

CREATE POLICY "Allow authenticated deletes from template-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'template-images');
```

**ملاحظة**: هذا الحل أقل أماناً (يسمح لأي مستخدم برفع/حذف أي صورة في bucket). استخدمه فقط للاختبار، ثم عد إلى الحل الآمن.

---

## التحقق النهائي

بعد تطبيق الحل:
1. ✅ جرب رفع صورة
2. ✅ تحقق من Console - يجب ألا يكون هناك أخطاء
3. ✅ تحقق من Storage - يجب أن تظهر الصورة

