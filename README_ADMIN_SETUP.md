# إعداد لوحة تحكم الأدمن

## الخطوة 0: إنشاء حساب الأدمن

قبل إضافة معرفات الأدمن، يجب إنشاء حساب الأدمن في Supabase:

1. اتبع التعليمات في `README_ADMIN_USER_SETUP.md`
2. أو ببساطة:
   - اذهب إلى Supabase Dashboard → Authentication → Users → Add User
   - Email: `admin@vetaps.com`
   - Password: `Aa@0556160304.com`
   - Auto Confirm: ✅
   - بعد الإنشاء، انسخ User ID من SQL Editor:
     ```sql
     SELECT id FROM auth.users WHERE email = 'admin@vetaps.com';
     ```

## الخطوة 1: إضافة معرفات الأدمن

1. افتح ملف `app/[locale]/admin/page.tsx`
2. ابحث عن `ADMIN_USER_IDS`
3. أضف معرفات المستخدمين الذين تريد منحهم صلاحيات الأدمن:

```typescript
const ADMIN_USER_IDS = [
  'your-user-id-1',
  'your-user-id-2',
  // ... إلخ
];
```

**كيفية الحصول على User ID:**
- بعد تسجيل الدخول، اذهب إلى Dashboard
- افتح Developer Tools (F12)
- في Console، اكتب: `await supabase.auth.getUser()`
- انسخ `id` من النتيجة

## الخطوة 2: الوصول إلى لوحة التحكم

1. تأكد من أنك سجلت دخول بحساب موجود في `ADMIN_USER_IDS`
2. اذهب إلى: `/{locale}/admin`
   - مثال: `/en/admin` أو `/ar/admin`

## الخطوة 3: استخدام لوحة التحكم

### طلبات اليوزر المخصص

1. **عرض الطلبات:**
   - يتم عرض جميع الطلبات في جدول
   - الطلبات المعلقة تظهر أولاً
   - ثم الطلبات الأخرى (موافق عليها/مرفوضة)

2. **الموافقة على طلب:**
   - اضغط على زر "Approve"
   - في الـ Modal:
     - اختر تاريخ البدء (افتراضي: اليوم)
     - اختر المدة (أسبوع/شهر/سنة)
   - اضغط "Confirm Approval"
   - سيتم:
     - تحديث `profiles.username_custom`
     - حساب `custom_username_expires_at`
     - تغيير حالة الطلب إلى `approved`

3. **رفض طلب:**
   - اضغط على زر "Reject"
   - تأكد من الرفض
   - سيتم تغيير حالة الطلب إلى `rejected`

## الملفات المهمة

- `app/[locale]/admin/page.tsx` - صفحة الأدمن (الحماية)
- `app/(components)/admin/AdminDashboard.tsx` - لوحة التحكم الرئيسية
- `app/(components)/admin/tabs/UsernameRequestsTab.tsx` - تبويب الطلبات
- `app/(components)/admin/tabs/ApproveModal.tsx` - Modal الموافقة
- `app/api/admin/approve-username/route.ts` - API للموافقة

## ملاحظات

- **الحماية البسيطة:** حالياً، الحماية تعتمد على قائمة `ADMIN_USER_IDS`
- **لاحقاً:** يمكن تطوير نظام أدوار (roles) أكثر تعقيداً
- **الإشعارات:** حالياً لا يتم إرسال إيميل/إشعار للمستخدم عند الموافقة/الرفض (يمكن إضافتها لاحقاً)

