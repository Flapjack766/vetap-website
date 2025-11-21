# أمان القوالب المخصصة - Custom Templates Security

## المشكلة الحالية

الكود الحالي في `CustomTemplateRenderer.tsx` يستخدم `innerHTML` لعرض كود القالب:

```typescript
wrapper.innerHTML = templateCode;
```

### لماذا هذا قد يكون خطراً؟

1. **XSS Attacks (Cross-Site Scripting)**: إذا كان الكود يحتوي على `<script>` tags، سيتم تنفيذها
2. **Code Injection**: يمكن حقن كود JavaScript ضار
3. **Data Theft**: يمكن سرقة بيانات المستخدمين

### مثال على الخطر:

إذا أدخل الأدمن هذا الكود:
```html
<div>
  <h1>My Profile</h1>
  <script>
    // هذا الكود سيتم تنفيذه!
    fetch('/api/steal-data', { method: 'POST', body: JSON.stringify(localStorage) });
  </script>
</div>
```

## الحلول الممكنة

### الحل 1: Server-Side Compilation (الأفضل)

**الفكرة**: تجميع الكود على السيرفر قبل حفظه في قاعدة البيانات

**المميزات**:
- آمن تماماً
- يمكن التحقق من الكود قبل الحفظ
- أداء أفضل

**التنفيذ**:
```typescript
// في API route عند الموافقة على القالب
import { compile } from '@babel/core';

// تجميع JSX إلى JavaScript
const compiledCode = compile(templateCode, {
  presets: ['@babel/preset-react']
});

// حفظ الكود المترجم بدلاً من الأصلي
```

### الحل 2: Sanitization (تنظيف الكود)

**الفكرة**: إزالة جميع العناصر الخطرة من الكود قبل عرضه

**المميزات**:
- سهل التنفيذ
- يحمي من معظم الهجمات

**التنفيذ**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

// تنظيف الكود
const sanitizedCode = DOMPurify.sanitize(templateCode, {
  ALLOWED_TAGS: ['div', 'h1', 'h2', 'p', 'span', 'img', 'a', 'button'],
  ALLOWED_ATTR: ['class', 'href', 'src', 'alt']
});

wrapper.innerHTML = sanitizedCode;
```

### الحل 3: React Component Compilation

**الفكرة**: تحويل الكود إلى React Component حقيقي

**المميزات**:
- يعمل كـ React component عادي
- يمكن استخدام hooks و state
- آمن إذا تم التحقق من الكود

**التنفيذ**:
```typescript
// استخدام Function constructor (بحذر!)
const TemplateComponent = new Function(
  'profile', 'locale',
  `return ${templateCode}`
);

// ثم استخدامه
return <TemplateComponent profile={profile} locale={locale} />;
```

### الحل 4: Sandboxed iframe (للحماية الإضافية)

**الفكرة**: عرض القالب في iframe معزول

**المميزات**:
- عزل كامل
- لا يمكن للكود الوصول إلى الصفحة الرئيسية

**التنفيذ**:
```typescript
const iframe = document.createElement('iframe');
iframe.sandbox = 'allow-same-origin allow-scripts';
iframe.srcdoc = templateCode;
containerRef.current.appendChild(iframe);
```

## التوصية

**للمرحلة الحالية (Development)**:
- استخدام **Sanitization** (الحل 2) - سريع وآمن نسبياً

**للمرحلة الإنتاجية (Production)**:
- استخدام **Server-Side Compilation** (الحل 1) - الأكثر أماناً

## تحسين الكود الحالي

يمكن تحسين `CustomTemplateRenderer.tsx` باستخدام DOMPurify:

```typescript
import DOMPurify from 'isomorphic-dompurify';

// في useEffect
const sanitizedCode = DOMPurify.sanitize(templateCode, {
  ALLOWED_TAGS: [
    'div', 'section', 'article', 'header', 'footer',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'span', 'a', 'img', 'button',
    'ul', 'ol', 'li', 'nav', 'main'
  ],
  ALLOWED_ATTR: [
    'class', 'id', 'href', 'src', 'alt', 'title',
    'target', 'rel', 'style'
  ],
  ALLOW_DATA_ATTR: false
});

wrapper.innerHTML = sanitizedCode;
```

## ملاحظات إضافية

1. **التحقق من الكود**: قبل الموافقة، يجب على الأدمن مراجعة الكود يدوياً
2. **الحد من الصلاحيات**: فقط الأدمن يمكنه رفع القوالب
3. **التخزين**: حفظ نسخة من الكود الأصلي للرجوع إليه
4. **النسخ الاحتياطي**: نسخ احتياطي للقوالب المخصصة

