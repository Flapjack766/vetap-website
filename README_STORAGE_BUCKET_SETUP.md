# كيفية إنشاء Storage Bucket في Supabase

## ما هو Storage Bucket؟

**Storage Bucket** هو مجلد في Supabase لحفظ الملفات (مثل الصور).

في حالتنا، نحتاج bucket اسمه `template-images` لحفظ صور القوالب المخصصة.

---

## الطريقة 1: تلقائياً عبر SQL (الأسهل) ✅

### الخطوات:

1. **افتح Supabase Dashboard**
   - اذهب إلى: https://supabase.com/dashboard
   - اختر مشروعك

2. **افتح SQL Editor**
   - من القائمة الجانبية: **SQL Editor**
   - اضغط **New Query**

3. **انسخ والصق الكود التالي:**

```sql
-- إنشاء bucket للصور
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-images', 'template-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies للصور
CREATE POLICY "Users can upload template images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'template-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own template images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'template-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can view template images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'template-images');

CREATE POLICY "Users can delete own template images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'template-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

4. **اضغط Run** (أو F5)

5. **تم!** ✅
   - Bucket تم إنشاؤه تلقائياً
   - Policies تم إعدادها

---

## الطريقة 2: يدوياً عبر Dashboard

### الخطوات:

1. **افتح Supabase Dashboard**
   - اذهب إلى: https://supabase.com/dashboard
   - اختر مشروعك

2. **اذهب إلى Storage**
   - من القائمة الجانبية: **Storage**

3. **أنشئ Bucket جديد**
   - اضغط **New bucket**
   - **الاسم**: `template-images`
   - **Public bucket**: ✅ فعّل (مهم!)
   - اضغط **Create bucket**

4. **إعداد Policies (الأمان)**
   - اضغط على bucket `template-images`
   - اذهب إلى تبويب **Policies**
   - اضغط **New Policy**
   
   **Policy 1: رفع الصور**
   - Type: `INSERT`
   - Policy name: `Users can upload template images`
   - Policy definition:
   ```sql
   (storage.foldername(name))[1] = auth.uid()::text
   ```
   
   **Policy 2: عرض الصور (للمستخدم نفسه)**
   - Type: `SELECT`
   - Policy name: `Users can view own template images`
   - Policy definition:
   ```sql
   (storage.foldername(name))[1] = auth.uid()::text
   ```
   
   **Policy 3: عرض الصور (عام)**
   - Type: `SELECT`
   - Policy name: `Public can view template images`
   - Policy definition:
   ```sql
   bucket_id = 'template-images'
   ```
   
   **Policy 4: حذف الصور**
   - Type: `DELETE`
   - Policy name: `Users can delete own template images`
   - Policy definition:
   ```sql
   (storage.foldername(name))[1] = auth.uid()::text
   ```

---

## التحقق من أن Bucket تم إنشاؤه

### عبر Dashboard:
1. اذهب إلى **Storage**
2. يجب أن ترى bucket اسمه `template-images`

### عبر SQL:
```sql
SELECT * FROM storage.buckets WHERE id = 'template-images';
```

إذا ظهرت نتيجة، يعني Bucket موجود ✅

---

## ملاحظات مهمة

1. **Public Bucket**: يجب أن يكون `true` حتى يمكن عرض الصور في القوالب
2. **Policies**: مهمة جداً للأمان - بدونها لن يعمل رفع الصور
3. **الاسم**: يجب أن يكون بالضبط `template-images` (كما في الكود)

---

## إذا واجهت مشكلة

### المشكلة: "bucket already exists"
**الحل**: هذا يعني أن Bucket موجود بالفعل، لا مشكلة!

### المشكلة: "permission denied"
**الحل**: تأكد من أنك تستخدم Service Role Key أو أنك Owner للمشروع

### المشكلة: الصور لا تظهر
**الحل**: 
1. تأكد أن Bucket هو `public`
2. تأكد من وجود Policy "Public can view template images"

