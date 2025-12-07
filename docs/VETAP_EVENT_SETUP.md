# VETAP Event - إعداد الخدمة

## نظرة عامة

VETAP Event هي منصة Access/Ticketing عامة يمكن استخدامها:
- لمناسبات خاصة (أعراس، حفلات خاصة)
- لمؤتمرات/معارض
- بواسطة منصات أخرى (Event Platform) عبر API

## متغيرات البيئة المطلوبة

أضف المتغيرات التالية إلى ملف `.env.local`:

```env
# VETAP Event - Supabase Configuration
NEXT_PUBLIC_SUPABASE_EVENT_URL=https://your-event-project.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=your-event-anon-key
```

## أنواع المستخدمين (Actors)

1. **Owner / Admin**: صاحب المنصة
2. **Partner / Organizer**: عميل يستخدم المنصة (شركة تنظيم فعاليات، صاحب مناسبة)
3. **Gate Staff (Checker)**: موظف على البوابة يمسح التذاكر
4. **External System**: منصة أخرى تتكامل معك عبر API

## حالات الاستخدام الأساسية

### Organizer
- إنشاء حدث (Event)
- إنشاء/استيراد الضيوف (Guests)
- توليد Passes لكل ضيف
- اختيار Template للدعوة وتوليد ملفات (صورة/PDF/Wallet)
- مشاهدة إحصائيات الدخول والتقارير

### Gate Staff
- فتح صفحة Check-in
- اختيار البوابة (Gate/Device)
- مسح الأكواد بشكل متواصل
- رؤية نتيجة واضحة (Valid / Already used / Invalid)

### Partner (API)
- إنشاء Event عبر API
- إرسال قائمة الضيوف
- توليد passes واستلام روابط/أكواد
- استقبال Webhooks عند عمليات Check-in

## Stack المعماري

### Backend
- **قاعدة بيانات**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (JWT)

### Frontend
- **إطار**: Next.js 15 (App Router)
- **واجهات**:
  - Organizer Dashboard (للويب)
  - Check-in Web App (مبنية على الويب، مهيأة للجوال)

### تخزين الملفات
- Supabase Storage (للقوالب والملفات المولدة)

### الأمان
- Auth: Supabase Auth (JWT)
- لكل Partner: API Key

