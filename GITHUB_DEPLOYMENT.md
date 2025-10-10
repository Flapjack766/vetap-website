# 🚀 رفع مشروع VETAP إلى GitHub ونشره

## ✅ تم الإعداد المحلي بنجاح!

```
✓ تم تهيئة Git repository
✓ تم إضافة جميع الملفات (68 ملف)
✓ تم عمل commit للمشروع
✓ 12,888 سطر من الكود جاهز للرفع
```

---

## 📤 خطوات رفع المشروع إلى GitHub

### الخطوة 1️⃣: إنشاء Repository على GitHub

1. اذهب إلى: https://github.com/new
2. املأ المعلومات:
   - **Repository name**: `vetap-website` أو أي اسم تريده
   - **Description**: `VETAP - Professional Website Design & Engineering`
   - **Visibility**: اختر Public أو Private
   - ⚠️ **لا تضف**: README, .gitignore, أو License (لدينا بالفعل)
3. اضغط "Create repository"

### الخطوة 2️⃣: ربط المشروع المحلي بـ GitHub

بعد إنشاء Repository، استخدم هذه الأوامر:

```bash
# افتح PowerShell في مجلد المشروع (D:\Desktop\vetap d)
# ثم نفذ:

# 1. أضف GitHub repository كـ remote
git remote add origin https://github.com/YOUR_USERNAME/vetap-website.git

# 2. غيّر اسم الـ branch إلى main (اختياري)
git branch -M main

# 3. ارفع الكود
git push -u origin main
```

**استبدل `YOUR_USERNAME` باسم مستخدمك على GitHub**

### الخطوة 3️⃣: إدخال بيانات الدخول

عند تنفيذ `git push`، سيطلب منك:
- Username: اسم مستخدم GitHub
- Password: **Personal Access Token** (ليس كلمة المرور!)

#### كيفية الحصول على Personal Access Token:

1. اذهب إلى: https://github.com/settings/tokens
2. اضغط "Generate new token" → "Generate new token (classic)"
3. أعطه اسماً: `VETAP Website Deploy`
4. اختر Scopes: `repo` (كامل)
5. اضغط "Generate token"
6. **انسخ الـ token** (لن تراه مرة أخرى!)
7. استخدمه كـ password عند الـ push

---

## 🌐 نشر المشروع على Vercel (مجاناً)

### لماذا Vercel؟
- ✅ مجاني للمشاريع الشخصية
- ✅ دعم Next.js مثالي
- ✅ SSL مجاني
- ✅ CDN عالمي
- ✅ نشر تلقائي عند كل push

### خطوات النشر:

#### 1. اذهب إلى Vercel:
https://vercel.com/signup

#### 2. سجل دخول بحساب GitHub

#### 3. استورد المشروع:
- اضغط "Add New" → "Project"
- اختر repository: `vetap-website`
- اضغط "Import"

#### 4. ضبط Environment Variables:
في صفحة الإعداد، أضف:

```
RESEND_API_KEY=re_your_actual_key
COMPANY_EMAIL=info@vetaps.com
COMPANY_NAME=VETAP
FROM_EMAIL=VETAP <info@vetaps.com>
SITE_URL=https://your-domain.vercel.app
```

#### 5. اضغط "Deploy"

⏱️ الانتظار 2-3 دقائق...

✅ **المشروع جاهز على الإنترنت!**

---

## 🎯 النتيجة

بعد النشر ستحصل على:

```
🌐 رابط الموقع:
https://vetap-website.vercel.app

🔗 روابط اللغات:
├── https://vetap-website.vercel.app/en
└── https://vetap-website.vercel.app/ar
```

---

## 🔧 ضبط Domain مخصص (اختياري)

في Vercel Dashboard:

1. Settings → Domains
2. أضف Domain الخاص بك: `vetaps.com`
3. اتبع التعليمات لتحديث DNS
4. انتظر 24-48 ساعة للنشر

---

## 📋 ملخص الأوامر السريعة

```bash
# في PowerShell:

# 1. التأكد من حالة Git
git status

# 2. ربط بـ GitHub
git remote add origin https://github.com/YOUR_USERNAME/vetap-website.git

# 3. تغيير branch إلى main
git branch -M main

# 4. رفع الكود
git push -u origin main
```

---

## ⚠️ تحذيرات مهمة

### قبل الرفع:

1. **تأكد من `.env.local`:**
   - ✅ ملف `.env.local` موجود في `.gitignore`
   - ✅ لن يتم رفع المفاتيح السرية
   - ⚠️ تحقق مرة أخرى!

2. **المفاتيح السرية:**
   - ❌ لا ترفع `RESEND_API_KEY`
   - ❌ لا ترفع `.env.local`
   - ✅ استخدم Environment Variables في Vercel

3. **ملف `env.example`:**
   - ✅ آمن للرفع
   - ✅ يحتوي فقط على أمثلة

---

## 🎉 بعد النشر

### اختبر الموقع:
- [ ] جرب جميع الصفحات
- [ ] اختبر تبديل اللغة
- [ ] جرب نموذج التواصل
- [ ] تحقق من الـ SEO (Google Search Console)

### أضف Domain مخصص:
- [ ] اشتر Domain (Namecheap, GoDaddy، إلخ)
- [ ] اربطه بـ Vercel
- [ ] حدث `SITE_URL` في Environment Variables

---

## 📚 موارد مفيدة

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **GitHub Docs**: https://docs.github.com
- **Resend Docs**: https://resend.com/docs

---

## 🆘 حل المشاكل

### مشكلة: "Support for password authentication was removed"
**الحل:** استخدم Personal Access Token بدلاً من كلمة المرور

### مشكلة: "Permission denied"
**الحل:** تأكد من أن الـ token له صلاحيات `repo`

### مشكلة: "Build failed on Vercel"
**الحل:** تحقق من Environment Variables في Vercel

---

## ✨ المشروع جاهز للرفع!

**الأمر التالي:** اتبع الخطوات أعلاه لرفع المشروع على GitHub ثم Vercel! 🚀

