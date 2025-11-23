# تطبيق Row Level Security (RLS) على جداول Analytics

## نظرة عامة

تم تطبيق نظام أمان متقدم باستخدام Row Level Security (RLS) على جميع الجداول الحساسة في قاعدة البيانات. هذا يضمن أن:

- **الأدمن**: يستطيع رؤية وتعديل كل شيء في جداول `admin_users` و `analytics_*` تمامًا كما هو الآن.
- **العميل (المستخدم العادي)**: يستمر في رؤية وتعديل بياناته الشخصية (profile, contacts, …) كما هو الآن.
- **الأمان**: لا يمكن للمستخدمين العاديين الوصول لبيانات الآخرين ولا بيانات الـ analytics الحساسة.

## المعمارية

### 1. نوعان من عملاء Supabase

#### أ. Client عام في المتصفح (anon key)
- **الموقع**: `lib/supabase/client.ts`
- **الاستخدام**: في Client Components
- **الصلاحيات**: يخضع لسياسات RLS
- **الاستخدام**: للجداول التي يجب أن يتعامل معها المستخدم العادي (مثل profiles, contacts)

#### ب. Client خاص بالسيرفر (service_role key)
- **الموقع**: `lib/supabase/admin.ts`
- **الاستخدام**: في API Routes فقط (Server-side)
- **الصلاحيات**: يتجاوز RLS (bypasses RLS)
- **الاستخدام**: لقراءة كل بيانات الـ analytics وعرضها في لوحة الأدمن

### 2. الجداول المحمية بـ RLS

تم تفعيل RLS على الجداول التالية:

- `admin_users`
- `analytics_sessions`
- `analytics_goals`
- `analytics_conversions`
- `analytics_user_journey`
- `analytics_events`

### 3. Policies المطبقة

#### للمستخدمين العاديين:
- **SELECT**: يمكنهم قراءة بياناتهم فقط (عبر `profile_id` → `user_id`)
- **INSERT**: يمكنهم إدراج أحداث analytics لبياناتهم فقط
- **UPDATE**: يمكنهم تحديث بياناتهم فقط

#### للأدمن:
- **SELECT**: يمكنهم قراءة كل البيانات
- **INSERT/UPDATE/DELETE**: يمكنهم تعديل كل البيانات

## الملفات المضافة/المعدلة

### 1. Migration
- **`supabase/migrations/002_enable_rls_analytics.sql`**
  - تفعيل RLS على جميع الجداول الحساسة
  - إنشاء policies للمستخدمين العاديين والأدمن
  - إنشاء function `is_admin_user()` للتحقق من صلاحيات الأدمن

### 2. Admin Client
- **`lib/supabase/admin.ts`**
  - إنشاء client يستخدم `SUPABASE_SERVICE_ROLE_KEY`
  - للاستخدام في API Routes فقط

### 3. API Routes الجديدة
- **`app/api/admin/visitors/route.ts`**
  - جلب قائمة الزوار (للأدمن فقط)
  - يستخدم `createAdminClient()` للوصول الكامل
  
- **`app/api/admin/visitors/[id]/route.ts`**
  - جلب تفاصيل زائر محدد (للأدمن فقط)
  - يستخدم `createAdminClient()` للوصول الكامل

### 4. Components المعدلة
- **`app/(components)/admin/tabs/VisitorsTab.tsx`**
  - تم تعديل `fetchVisitors()` لاستخدام API route بدلاً من الوصول المباشر
  - تم تعديل `fetchVisitorDetails()` لاستخدام API route بدلاً من الوصول المباشر

## متغيرات البيئة المطلوبة

تأكد من إضافة المتغير التالي إلى `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ تحذير**: لا تضع `SUPABASE_SERVICE_ROLE_KEY` في ملفات JavaScript التي يتم إرسالها إلى المتصفح. هذا المفتاح يجب أن يكون في Server-side فقط.

## خطوات التطبيق

### 1. تشغيل Migration

قم بتشغيل migration في Supabase SQL Editor:

```sql
-- تشغيل محتوى ملف supabase/migrations/002_enable_rls_analytics.sql
```

### 2. إضافة Service Role Key

أضف `SUPABASE_SERVICE_ROLE_KEY` إلى `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

يمكنك الحصول على Service Role Key من:
- Supabase Dashboard → Project Settings → API → `service_role` key

### 3. التحقق من التطبيق

1. **للأدمن**: يجب أن يعمل كل شيء كما هو الآن
2. **للمستخدم العادي**: يجب أن يستمر في رؤية بياناته فقط
3. **الأمان**: حاول الوصول إلى جداول analytics من المتصفح باستخدام anon key - يجب أن تفشل

## ملاحظات مهمة

1. **لا تستخدم `createAdminClient()` في Client Components**
   - هذا المفتاح يجب أن يكون في Server-side فقط
   - استخدمه فقط في API Routes

2. **RLS Policies**
   - Policies تعمل تلقائيًا عند استخدام anon key
   - service_role key يتجاوز RLS (لهذا السبب يجب استخدامه بحذر)

3. **التحقق من الأدمن**
   - يتم التحقق من صلاحيات الأدمن في كل API route
   - يتم التحقق من وجود المستخدم في جدول `admin_users` أو أن email هو `admin@vetaps.com`

## الاختبار

### اختبار الأمان:

1. افتح Developer Tools في المتصفح
2. انتقل إلى Console
3. حاول تنفيذ:
   ```javascript
   const { createClient } = await import('@supabase/supabase-js');
   const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY');
   const { data } = await supabase.from('analytics_sessions').select('*');
   console.log(data);
   ```
4. يجب أن تحصل على خطأ أو قائمة فارغة (حسب policies)

### اختبار الأدمن:

1. سجل الدخول كأدمن
2. افتح لوحة الأدمن
3. انتقل إلى تبويبة "الزوار"
4. يجب أن ترى جميع البيانات كما هو متوقع

## الدعم

إذا واجهت أي مشاكل:

1. تأكد من تشغيل migration
2. تأكد من إضافة `SUPABASE_SERVICE_ROLE_KEY` إلى `.env.local`
3. تأكد من أن المستخدم موجود في جدول `admin_users` أو أن email هو `admin@vetaps.com`
4. راجع logs في Supabase Dashboard → Logs → Postgres Logs

