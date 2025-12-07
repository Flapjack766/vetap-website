# VETAP Event - المرحلة 5: طبقة المصادقة والـ Multi-Tenancy

## ✅ ما تم إنجازه

### 1. RLS Policies في Supabase ✅

تم إنشاء ملف `supabase/migrations/009_vetap_event_rls_policies.sql` يحتوي على:

- **تمكين RLS** على جميع الجداول
- **Helper Functions**:
  - `get_current_user_partner_id()` - للحصول على partner_id للمستخدم الحالي
  - `is_user_owner()` - للتحقق من كون المستخدم owner
  - `get_user_role()` - للحصول على دور المستخدم

- **Policies لكل جدول**:
  - **Partners**: Owners يمكنهم رؤية الجميع، Partners يمكنهم رؤية بياناتهم فقط
  - **Users**: المستخدمون يمكنهم رؤية بياناتهم ومستخدمي partner الخاص بهم
  - **Events**: المستخدمون يمكنهم رؤية/إدارة أحداث partner الخاص بهم فقط
  - **Guests, Passes, Zones, Gates**: محمية بنفس الطريقة
  - **Scan Logs**: Gate staff يمكنهم إضافة سجلات المسح
  - **Webhooks, API Keys**: محمية حسب partner_id

### 2. Helper Functions للتحقق من الصلاحيات ✅

تم إنشاء ملفات:

#### `lib/event/auth.ts`
- `getCurrentEventUser()` - الحصول على المستخدم الحالي
- `isAuthenticated()` - التحقق من المصادقة
- `isOwner()`, `isPartnerAdmin()`, `isOrganizer()`, `isGateStaff()` - التحقق من الأدوار
- `getCurrentPartnerId()` - الحصول على partner_id
- `hasPartnerAccess()` - التحقق من الوصول لـ partner
- `canManageEvents()`, `canPerformCheckIn()`, `canManageUsers()` - التحقق من الصلاحيات
- `requireAuth()`, `requireOwner()`, `requirePartnerAccess()` - Functions ترمي أخطاء إذا لم تكن الشروط محققة

#### `lib/event/api-auth.ts`
- `authenticateRequest()` - مصادقة طلبات API
- `requirePartnerAccess()` - التحقق من وصول partner
- `requireEventManagement()` - التحقق من صلاحية إدارة الأحداث
- `requireCheckInPermission()` - التحقق من صلاحية Check-in
- `requireUserManagement()` - التحقق من صلاحية إدارة المستخدمين
- `withAuth()` - Wrapper لـ API handlers مع المصادقة
- `withPartnerAccess()` - Wrapper لـ API handlers مع التحقق من partner

### 3. صفحات تسجيل الدخول ✅

تم إنشاء:
- `app/(components)/event/auth/EventLoginForm.tsx` - نموذج تسجيل الدخول
- `app/[locale]/event/login/page.tsx` - صفحة تسجيل الدخول

### 4. API Routes محمية ✅

تم إنشاء مثال:
- `app/api/event/events/route.ts` - API لإدارة الأحداث
  - `GET` - جلب الأحداث (محمي بـ `withAuth`)
  - `POST` - إنشاء حدث جديد (محمي بـ `withAuth` + التحقق من الصلاحيات)

### 5. تحديث Middleware ✅

- تم إنشاء `lib/supabase/event-middleware.ts` - middleware خاص بـ VETAP Event
- تم تحديث `middleware.ts` لدعم routes الـ Event
- حماية routes الـ dashboard وإعادة التوجيه لصفحة تسجيل الدخول

### 6. إضافة الترجمات ✅

تم إضافة ترجمات للمصادقة في:
- `content/en.json`
- `content/ar.json`

## 🔒 الأمان

### Multi-Tenancy Protection

1. **RLS Policies**: كل query تلقائياً تحتوي على شرط `partner_id = current_partner_id`
2. **API Protection**: جميع API routes تتطلب:
   - JWT token صالح
   - التحقق من partner_id
   - التحقق من الصلاحيات حسب الدور

### Roles & Permissions

- **Owner**: وصول كامل لجميع Partners
- **Partner Admin**: إدارة كاملة لـ partner الخاص به
- **Organizer**: إدارة الأحداث والضيوف والتذاكر
- **Gate Staff**: فقط Check-in (مسح التذاكر)

## 📋 كيفية الاستخدام

### 1. تطبيق RLS Policies

قم بتطبيق migration على قاعدة بيانات Supabase Event:

```sql
-- قم بتشغيل محتوى ملف:
-- supabase/migrations/009_vetap_event_rls_policies.sql
```

### 2. استخدام Helper Functions في Server Components

```typescript
import { getCurrentEventUser, requireAuth, canManageEvents } from '@/lib/event/auth';

// في Server Component
export default async function MyPage() {
  const user = await getCurrentEventUser();
  
  if (!user) {
    redirect('/event/login');
  }
  
  if (await canManageEvents()) {
    // Show event management UI
  }
}
```

### 3. استخدام API Helpers

```typescript
import { withAuth, withPartnerAccess } from '@/lib/event/api-auth';

// API route محمي
export const GET = withAuth(async (request, { user }) => {
  // user is authenticated
  return NextResponse.json({ user });
});

// API route محمي بـ partner access
export const POST = withPartnerAccess(async (request, { user, partnerId }) => {
  // user is authenticated and has access to partnerId
  return NextResponse.json({ success: true });
});
```

### 4. تسجيل الدخول

المستخدمون يمكنهم تسجيل الدخول من:
- `/[locale]/event/login`

بعد تسجيل الدخول، يتم إعادة التوجيه إلى:
- `/[locale]/event/dashboard`

## 🔐 ملاحظات أمنية مهمة

1. **لا تستخدم service_role key في Client Components**
2. **RLS Policies تحمي البيانات تلقائياً** - لا حاجة لإضافة `partner_id` يدوياً في queries
3. **جميع API routes يجب أن تستخدم `withAuth` أو `withPartnerAccess`**
4. **التحقق من الصلاحيات يتم في كل مستوى** (RLS + API + UI)

## 📝 الخطوات التالية

المرحلة 5 مكتملة! جاهز للمراحل التالية:
- المرحلة 6: واجهات Organizer Dashboard
- المرحلة 7: إدارة الأحداث
- المرحلة 8: إدارة الضيوف والتذاكر
- إلخ...

