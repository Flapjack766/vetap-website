# 📋 VETAP Event - Environment Variables الكاملة

## 🔑 جميع Environment Variables المطلوبة

### VETAP العادي (Main Project):

```env
# Main VETAP Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ppuvrzkrqvkkkwrfzyus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...main-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...main-service-key
```

### VETAP Event (Event Project):

```env
# Event VETAP Supabase
NEXT_PUBLIC_SUPABASE_EVENT_URL=https://mdqjgliaidrzkfxlnwtv.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=eyJhbGc...event-anon-key
SUPABASE_EVENT_SERVICE_ROLE_KEY=eyJhbGc...event-service-key
```

---

## 📊 جدول Environment Variables

| المتغير | VETAP العادي | Event | الاستخدام |
|---------|--------------|-------|-----------|
| **URL** | `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_EVENT_URL` | Project URL |
| **Anon Key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY` | Public API Key |
| **Service Key** | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_EVENT_SERVICE_ROLE_KEY` | Admin operations |

---

## 🔍 كيفية الحصول على Service Role Key

### للـ Event Project:

1. **اذهب إلى:** https://supabase.com/dashboard/project/mdqjgliaidrzkfxlnwtv
2. **Settings → API**
3. **ابحث عن:** `service_role` key (⚠️ Secret!)
4. **انسخ Key**
5. **أضفه إلى `.env.local`:**
   ```env
   SUPABASE_EVENT_SERVICE_ROLE_KEY=eyJhbGc...event-service-key
   ```

**⚠️ مهم جداً:**
- Service Role Key له صلاحيات كاملة
- لا تعرضه أبداً للـ Client
- استخدمه فقط في Server-side code
- لا ترفعه إلى Git!

---

## ✅ التحقق من Environment Variables

### في `.env.local`:

```env
# ============================================
# VETAP Main Project
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://ppuvrzkrqvkkkwrfzyus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...main-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...main-service-key

# ============================================
# VETAP Event Project
# ============================================
NEXT_PUBLIC_SUPABASE_EVENT_URL=https://mdqjgliaidrzkfxlnwtv.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=eyJhbGc...event-anon-key
SUPABASE_EVENT_SERVICE_ROLE_KEY=eyJhbGc...event-service-key
```

---

## 📋 Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` موجود (VETAP العادي)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` موجود (VETAP العادي)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` موجود (VETAP العادي)
- [ ] `NEXT_PUBLIC_SUPABASE_EVENT_URL` موجود (Event)
- [ ] `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY` موجود (Event)
- [ ] `SUPABASE_EVENT_SERVICE_ROLE_KEY` موجود (Event) ⭐ جديد!
- [ ] جميع URLs مختلفة
- [ ] جميع Keys مختلفة

---

## 🎯 الخلاصة

**جميع Environment Variables منفصلة تماماً!** ✅

- ✅ VETAP العادي: 3 متغيرات
- ✅ Event: 3 متغيرات
- ✅ كل واحد يستخدم مشروع Supabase منفصل
- ✅ Service Role Key منفصل للـ Event (جديد!)

