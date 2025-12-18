# إعداد Google Business OAuth

## المشكلة: redirect_uri_mismatch

عند محاولة ربط حساب Google Business، قد تظهر رسالة الخطأ:
```
Hata 400: redirect_uri_mismatch
```

## السبب

الخطأ يحدث لأن `redirect_uri` المستخدم في الطلب لا يطابق ما هو مسجل في Google Cloud Console.

## الحل

### الخطوة 1: التحقق من redirect_uri في الكود

في ملف `app/api/google-business/oauth/start/route.ts`، يتم إنشاء `redirect_uri` كالتالي:

```typescript
const redirectUri = `${process.env.SITE_URL || 'https://vetaps.com'}/api/google-business/oauth/callback`;
```

**تأكد من أن `SITE_URL` في متغيرات البيئة مضبوط بشكل صحيح:**
- في `.env.local` (للتنمية المحلية): `SITE_URL=http://localhost:3000`
- في Vercel/Production: `SITE_URL=https://vetaps.com`

### الخطوة 2: إضافة redirect_uri في Google Cloud Console

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. اختر المشروع الخاص بك
3. اذهب إلى **APIs & Services** → **Credentials**
4. اضغط على **OAuth 2.0 Client ID** الخاص بك
5. في قسم **Authorized redirect URIs**، أضف:
   ```
   https://vetaps.com/api/google-business/oauth/callback
   ```
   
   **إذا كنت تستخدم بيئة تطوير محلية، أضف أيضاً:**
   ```
   http://localhost:3000/api/google-business/oauth/callback
   ```

6. اضغط **Save**

### الخطوة 3: التحقق من التطابق

**يجب أن يطابق `redirect_uri` تماماً** (بما في ذلك البروتوكول `https://` أو `http://`، والمسار `/api/google-business/oauth/callback`):

✅ **صحيح:**
- `https://vetaps.com/api/google-business/oauth/callback`
- `http://localhost:3000/api/google-business/oauth/callback`

❌ **خطأ:**
- `https://vetaps.com/api/google-business/oauth/callback/` (خطأ مائل في النهاية)
- `http://vetaps.com/api/google-business/oauth/callback` (http بدلاً من https)
- `https://www.vetaps.com/api/google-business/oauth/callback` (www إضافي)

### الخطوة 4: إعادة المحاولة

بعد إضافة `redirect_uri` في Google Cloud Console:
1. انتظر دقيقة أو دقيقتين (قد يستغرق التحديث وقتاً)
2. حاول ربط حساب Google Business مرة أخرى
3. يجب أن يعمل الآن بدون أخطاء

## متغيرات البيئة المطلوبة

تأكد من إضافة هذه المتغيرات في `.env.local` (للتنمية) و Vercel (للإنتاج):

```env
# Google Business OAuth
GOOGLE_BUSINESS_CLIENT_ID=your_client_id_here
GOOGLE_BUSINESS_CLIENT_SECRET=your_client_secret_here

# Site URL (يجب أن يطابق redirect_uri)
SITE_URL=https://vetaps.com
```

## نطاقات OAuth المطلوبة

تأكد من أن OAuth Client في Google Cloud Console يحتوي على النطاق التالي:
- `https://www.googleapis.com/auth/business.manage`

## استكشاف الأخطاء

### الخطأ: "redirect_uri_mismatch"
- ✅ تحقق من أن `redirect_uri` مسجل في Google Cloud Console
- ✅ تحقق من أن `SITE_URL` في متغيرات البيئة صحيح
- ✅ تأكد من عدم وجود مسافات أو أحرف إضافية في `redirect_uri`

### الخطأ: "invalid_client"
- ✅ تحقق من أن `GOOGLE_BUSINESS_CLIENT_ID` و `GOOGLE_BUSINESS_CLIENT_SECRET` صحيحان
- ✅ تأكد من أن OAuth Client نشط في Google Cloud Console

### الخطأ: "access_denied"
- ✅ تأكد من أن المستخدم وافق على الصلاحيات المطلوبة
- ✅ تحقق من أن النطاق `https://www.googleapis.com/auth/business.manage` مفعل

## ملاحظات مهمة

1. **لا تستخدم `www` في `redirect_uri`** إلا إذا كان موقعك يستخدم `www` فعلياً
2. **استخدم `https` في الإنتاج** دائماً
3. **أضف `redirect_uri` لكل بيئة** (localhost للإنتاج، و production URL للإنتاج)
4. **انتظر دقيقة أو دقيقتين** بعد إضافة `redirect_uri` قبل المحاولة مرة أخرى

