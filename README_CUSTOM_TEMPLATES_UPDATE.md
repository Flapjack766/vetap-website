# تحديث نظام القوالب المخصصة - Custom Templates System Update

## الميزات الجديدة

### 1. عدم حذف القوالب (Soft Delete)
- القوالب القديمة لا تُحذف، بل يتم وضع علامة `is_deleted = true`
- يمكن استرجاع القوالب القديمة لاحقاً
- كل قالب جديد يُضاف كسجل جديد في قاعدة البيانات

### 2. خيار مصدر البيانات
عند طلب قالب جديد، يمكن للمستخدم اختيار:
- **استخدام البيانات الحالية** (`use_existing`): يستخدم بيانات البروفايل الموجودة
- **بناء من الصفر** (`build_from_scratch`): يحدد المستخدم الحقول المطلوبة

### 3. تحديد الحقول المطلوبة
عند اختيار "بناء من الصفر"، يمكن تحديد الحقول المطلوبة:
- الاسم (display_name)
- المسمى الوظيفي (headline)
- الوصف (bio)
- البريد الإلكتروني (email)
- الهاتف (phone)
- الموقع (location)
- الصورة الشخصية (avatar)
- روابط التواصل (links)

### 4. رفع الصور
يمكن رفع الصور التالية:
- **Banner** (البانر)
- **Background** (الخلفية)
- **Logo** (الشعار)
- **Icon** (الأيقونة)

الصور تُرفع إلى Supabase Storage في bucket `template-images`

## كيفية الاستخدام

### للمستخدم (في Dashboard):

1. اذهب إلى تبويب **"Your Link"**
2. اضغط **"Request Custom Template"**
3. املأ النموذج:
   - العنوان والوصف (مطلوب)
   - اختر مصدر البيانات:
     - ✅ استخدام البيانات الحالية
     - ✅ بناء من الصفر (ثم حدد الحقول المطلوبة)
   - ارفع الصور المطلوبة (Banner, Background, Logo, Icon)
   - املأ باقي التفاصيل (الألوان، التخطيط، إلخ)
4. اضغط **"Submit Request"**

### للأدمن (في Admin Panel):

1. اذهب إلى **"Custom Template Requests"**
2. ستظهر جميع الطلبات مع:
   - معلومات المستخدم
   - مصدر البيانات المختار
   - الحقول المطلوبة (إن كانت)
   - الصور المرفوعة (مع معاينة)
3. اضغط **"Approve"** على الطلب
4. الصق كود القالب في حقل "Template Code"
5. اضغط **"Approve & Activate"**

## استخدام الصور في القالب

في كود القالب، يمكن استخدام الصور المرفوعة بهذه الطريقة:

```html
<!-- استخدام البانر -->
<img src="{{uploaded_images.banner}}" alt="Banner" />

<!-- استخدام الخلفية -->
<div style="background-image: url('{{uploaded_images.background}}')">
  <!-- محتوى -->
</div>

<!-- استخدام الشعار -->
<img src="{{uploaded_images.logo}}" alt="Logo" />

<!-- استخدام الأيقونة -->
<img src="{{uploaded_images.icon}}" alt="Icon" />
```

## تحديث قاعدة البيانات

**قم بتشغيل SQL التالي في Supabase:**

```sql
-- ملف: supabase/update-custom-templates-schema.sql
```

هذا الملف يضيف:
- `data_source` column
- `required_fields` column (JSONB)
- `uploaded_images` column (JSONB)
- `custom_data` column (JSONB)
- `is_deleted` column في `custom_templates`
- Storage bucket `template-images`
- RLS policies للصور

## ملاحظات مهمة

1. **Soft Delete**: القوالب القديمة لا تُحذف، فقط يتم تعطيلها
2. **الصور**: تُحفظ في Supabase Storage ويمكن الوصول إليها عبر URL عام
3. **الأمان**: الصور محمية بـ RLS policies
4. **الحد الأقصى**: حجم الصورة الواحدة 5MB

