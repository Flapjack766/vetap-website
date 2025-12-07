# ✅ VETAP Event - التحقق من Clients المنفصلة

## 🔍 السؤال: هل هناك عميلين صريحين منفصلين؟

### ✅ الجواب: نعم! هناك عميلين منفصلين تماماً

---

## 📊 المقارنة: VETAP العادي vs Event

### 1️⃣ Browser Clients (Client-side)

#### VETAP العادي:
- **الملف:** `lib/supabase/client.ts`
- **الدالة:** `createClient()`
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Event:
- **الملف:** `lib/supabase/event-client.ts`
- **الدالة:** `createEventClient()`
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_EVENT_URL`
  - `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY`

**✅ منفصلان تماماً!**

---

### 2️⃣ Server Clients (Server-side)

#### VETAP العادي:
- **الملف:** `lib/supabase/server.ts`
- **الدالة:** `createClient()`
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Event:
- **الملف:** `lib/supabase/event-server.ts`
- **الدالة:** `createEventClient()`
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_EVENT_URL`
  - `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY`

**✅ منفصلان تماماً!**

---

### 3️⃣ Admin Clients (Admin operations - bypasses RLS)

#### VETAP العادي:
- **الملف:** `lib/supabase/admin.ts`
- **الدالة:** `createAdminClient()`
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### Event:
- **الملف:** `lib/supabase/event-admin.ts` ⭐ **جديد!**
- **الدالة:** `createEventAdminClient()`
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_EVENT_URL`
  - `SUPABASE_EVENT_SERVICE_ROLE_KEY` ⭐ **جديد!**

**✅ منفصلان تماماً!**

---

### 4️⃣ Middleware

#### VETAP العادي:
- **الملف:** `lib/supabase/middleware.ts`
- **الدالة:** `updateSession()`
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Event:
- **الملف:** `lib/supabase/event-middleware.ts`
- **الدالة:** `updateEventSession()`
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_EVENT_URL`
  - `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY`

**✅ منفصلان تماماً!**

---

## 📋 جدول المقارنة الكامل

| النوع | VETAP العادي | Event | الحالة |
|------|--------------|-------|--------|
| **Browser Client** | `lib/supabase/client.ts` | `lib/supabase/event-client.ts` | ✅ منفصل |
| **Server Client** | `lib/supabase/server.ts` | `lib/supabase/event-server.ts` | ✅ منفصل |
| **Admin Client** | `lib/supabase/admin.ts` | `lib/supabase/event-admin.ts` | ✅ منفصل |
| **Middleware** | `lib/supabase/middleware.ts` | `lib/supabase/event-middleware.ts` | ✅ منفصل |
| **URL** | `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_EVENT_URL` | ✅ مختلف |
| **Anon Key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY` | ✅ مختلف |
| **Service Key** | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_EVENT_SERVICE_ROLE_KEY` | ✅ مختلف |

---

## ✅ Environment Variables المطلوبة

### VETAP العادي:
```env
# Main VETAP
NEXT_PUBLIC_SUPABASE_URL=https://ppuvrzkrqvkkkwrfzyus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...main-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...main-service-key
```

### Event:
```env
# Event VETAP
NEXT_PUBLIC_SUPABASE_EVENT_URL=https://mdqjgliaidrzkfxlnwtv.supabase.co
NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY=eyJhbGc...event-anon-key
SUPABASE_EVENT_SERVICE_ROLE_KEY=eyJhbGc...event-service-key
```

---

## 🔒 Server Secret (Service Role Key)

### تم إضافة دعم Service Role Key للـ Event:

**الملف الجديد:** `lib/supabase/event-admin.ts`

**الاستخدام:**
```typescript
import { createEventAdminClient } from '@/lib/supabase/event-admin';

// في Server Component أو API Route
const adminClient = createEventAdminClient();

// يمكنك الآن:
// - Bypass RLS policies
// - إجراء عمليات admin
// - الوصول الكامل للقاعدة البيانات
```

**⚠️ تحذير أمني:**
- Service Role Key له صلاحيات كاملة
- استخدمه فقط في Server-side code
- لا تعرضه أبداً للـ Client!

---

## ✅ التحقق من الفصل

### 1. Browser Clients:

```typescript
// VETAP العادي
import { createClient } from '@/lib/supabase/client';
const supabase = createClient(); // Uses main project

// Event
import { createEventClient } from '@/lib/supabase/event-client';
const supabase = createEventClient(); // Uses Event project
```

### 2. Server Clients:

```typescript
// VETAP العادي
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient(); // Uses main project

// Event
import { createEventClient } from '@/lib/supabase/event-server';
const supabase = await createEventClient(); // Uses Event project
```

### 3. Admin Clients:

```typescript
// VETAP العادي
import { createAdminClient } from '@/lib/supabase/admin';
const admin = createAdminClient(); // Uses main project

// Event
import { createEventAdminClient } from '@/lib/supabase/event-admin';
const admin = createEventAdminClient(); // Uses Event project
```

---

## 📋 Checklist

- [x] Browser Client منفصل للـ Event
- [x] Server Client منفصل للـ Event
- [x] Admin Client منفصل للـ Event (جديد!)
- [x] Middleware منفصل للـ Event
- [x] Environment Variables مختلفة تماماً
- [x] Service Role Key منفصل للـ Event (جديد!)

---

## 🎯 الخلاصة

**نعم، هناك عميلين صريحين منفصلين تماماً!** ✅

- ✅ VETAP العادي: يستخدم مشروع Supabase الرئيسي
- ✅ Event: يستخدم مشروع Supabase Event منفصل
- ✅ كل واحد له:
  - Browser Client
  - Server Client
  - Admin Client (Service Role Key)
  - Middleware
  - Environment Variables منفصلة

**تم إضافة دعم Service Role Key للـ Event!** ✅

