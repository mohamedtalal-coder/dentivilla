# دليل النشر على Vercel (Dentivilla Deployment Guide)

يوضح هذا الدليل الخطوات الكاملة لنشر تطبيق **Dentivilla** على منصة **Vercel** وربط قاعدة البيانات السحابية (PostgreSQL).

---

## 1. ما الذي يجب فعله بخصوص قاعدة البيانات (Database)؟

تطبيق Dentivilla يعتمد على **PostgreSQL** و **Prisma ORM**.
على جهازك المحلي، كانت قاعدة البيانات تعمل عبر Docker، لكن منصة **Vercel** تعمل بنظام السيرفرليس (Serverless Functions) ولا تستضيف قواعد بيانات داخلية.

### أفضل الخيارات المجانية والسريعة:
1. **Neon Postgres (الأسهل والأفضل تكاملاً مع Vercel - مستحسن)**:
   - خدمة PostgreSQL سيرفرليس متوافقة 100% مع Vercel و Prisma.
   - تمنحك حساباً مجانياً يدعم التوسع التلقائي.
   - يمكن إضافتها بضغطة زر واحدة من داخل لوحة تحكم Vercel عبر تبويب **Storage** -> **Neon**.
2. **Supabase**:
   - توفر قاعدة بيانات PostgreSQL مدارة ومجانية بالكامل.
3. **Railway / Render**:
   - يمكنك إنشاء خدمة PostgreSQL بضغطة زر ونسخ رابط `DATABASE_URL`.

---

## 2. خطوات النشر على Vercel خطوة بخطوة

### الخطوة الأولى: ربط المشروع على Vercel
1. ادخل إلى [vercel.com](https://vercel.com) وسجّل الدخول بحساب GitHub الخاص بك.
2. اضغط على **"Add New..."** ثم اختر **"Project"**.
3. اختر مستودع **`mohamedtalal-coder/dentivilla`** واضغط **Import**.
4. سيتعرف Vercel تلقائياً على أن المشروع مبني بـ **Next.js**.

### الخطوة الثانية: إضافة قاعدة البيانات ومتغيرات البيئة (Environment Variables)
في صفحة استيراد المشروع في Vercel، افتح قسم **Environment Variables** وأضف المتغيرات التالية:

| اسم المتغير (Key) | القيمة (Value) | ملاحظات |
| :--- | :--- | :--- |
| `DATABASE_URL` | رابط قاعدة بيانات PostgreSQL السحابية | مثال: `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | نص عشوائي قوي لتشفير الجلسات | يمكنك توليده عبر كتابة `openssl rand -base64 32` في الطرفية |
| `ADMIN_EMAIL` | بريد الدخول للوحة التحكم | مثال: `admin@dentivilla.com` |
| `ADMIN_PASSWORD` | كلمة مرور قوية للمدير | كلمة المرور لحساب المدير الأول |
| `ADMIN_NAME` | اسم الطبيب / المدير | مثال: `د. محمد ياسر الجبالي` |
| `NEXT_PUBLIC_SITE_URL` | رابط الموقع على Vercel | مثال: `https://dentivilla.vercel.app` |

> ⚠️ **تنبيه هام جداً بخصوص `AUTH_URL`**:
> **لا تقم أبداً** بإضافة متغير `AUTH_URL="http://localhost:3000"` في Vercel!
> التطبيق مضبوط تلقائياً للتعرف على الدومين الحقيقي للموقع على Vercel. إذا كنت قد أضفت `AUTH_URL` مسبقاً بقيمة `localhost:3000` في Vercel، **قم بحذفه فوراً من لوحة تحكم Vercel Settings -> Environment Variables**.

> **ملاحظة بخصوص Neon**: إذا قمت بإضافة Neon عبر تبويب **Storage** في Vercel، سيقوم Vercel بإضافة `DATABASE_URL` تلقائياً نيابةً عنك!

### الخطوة الثالثة: الضغط على Deploy
اضغط زر **Deploy**. سيبدأ Vercel بتثبيت الحزم وبناء المشروع (`prisma generate && next build`).

---

## 3. تهيئة قاعدة البيانات لأول مرة (Migrations & Initial Seed)

بعد إنشاء قاعدة البيانات السحابية (على Neon أو Supabase)، ستحتاج لتطبيق الجداول (Migrations) وإضافة البيانات الأولية (الخدمات والعيادات وساعات العمل وحساب المدير).

**طريقة تنفيذها بكل سهولة من جهازك:**
1. افتح ملف `.env` على جهازك مؤقتاً وضع فيه رابط قاعدة البيانات السحابية:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require"
   ```
2. شغّل الأمر التالي:
   ```bash
   npm run db:setup:prod
   ```
   *يقوم هذا الأمر تلقائياً بتطبيق كافة الترحيلات السابقة (`prisma migrate deploy`) ثم تعبئة الخدمات وساعات العمل وحساب الطبيب (`prisma/seed.ts`).*

3. الآن أعد ملف `.env` المحلي إلى رابط Docker المحلي كما كان:
   ```env
   DATABASE_URL="postgresql://dentivilla:dentivilla@localhost:5432/dentivilla"
   ```

---

## 4. الحفاظ على الصور والملفات المرفوعة
التطبيق مصمم هندسياً لتخزين الصور المرفوعة (مثل صور الحالات السريرية وتحديثات المعرض) بصيغة **WebP** مضغوطة داخل حقل `data Bytes` في قاعدة بيانات PostgreSQL مباشرة.
هذا يضمن أن الصور:
- لا تُفقد عند إعادة البناء (Redeploy) على Vercel.
- تُخزن مؤقتاً (Cache) تلقائياً على شبكة Vercel Edge العالمية لأقصى سرعة أداء.
