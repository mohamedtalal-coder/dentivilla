# Dentivilla

موقع شخصي عربي لعيادة Dentivilla — د. محمد ياسر الجبالي — مع نظام حجز مواعيد ولوحة إدارة.

## التشغيل

```bash
# قاعدة البيانات المحلية dentivilla يجب أن تكون موجودة على PostgreSQL
npx prisma migrate dev
npx prisma db seed
npm run dev
```

- الموقع: http://localhost:3000
- لوحة الطبيب: http://localhost:3000/admin/login
- البريد الافتراضي: `admin@dentivilla.local`
- كلمة المرور الافتراضية: `change-me-admin`

المرضى يحجزون بدون حساب. الطلب يبقى معلّقاً حتى موافقة الطبيب، والوقت يُحجز حتى لا يحدث تعارض.
متابعة الحالة: `/booking/status` بالرقم المرجعي ورقم الهاتف.

## كيف تُحسب المواعيد المتاحة

محرك واحد (`src/lib/availability.ts`) يخدم التقويم والحجز وإعادة الجدولة. يُعرض الوقت فقط إذا:

- وقع كاملاً داخل ساعات عمل ذلك اليوم (بتوقيت القاهرة) أو داخل «وقت عمل إضافي».
- كانت مدته = مدة العلاج المختار، ويبدأ على شبكة «تباعد أوقات البدء».
- لم يتقاطع مع فترة محجوبة.
- ترك «الفاصل» خالياً قبل وبعد كل موعد معلّق أو مؤكد.
- احترم «أقل مهلة قبل الموعد» و«أقصى مدى للحجز».

الحجز يتم داخل معاملة بقفل قاعدة بيانات، ويُعاد فحص الوقت قبل الحفظ، وقيد `Appointment_no_overlap` في PostgreSQL يمنع أي تداخل بين المواعيد المعلّقة/المؤكدة حتى لو أخطأ الكود.

## الاختبارات

```bash
npm run typecheck
npm run lint
npm test                      # اختبارات محرك المواعيد وأرقام الهواتف (بدون قاعدة بيانات)

# اختبارات التكامل مع PostgreSQL — على قاعدة اختبار منفصلة فقط (اسمها ينتهي بـ _test)
createdb dentivilla_test
DATABASE_URL=postgresql://dentivilla:dentivilla@localhost:5432/dentivilla_test npx prisma migrate deploy
DATABASE_URL=postgresql://dentivilla:dentivilla@localhost:5432/dentivilla_test npx tsx prisma/seed.ts
TEST_DATABASE_URL=postgresql://dentivilla:dentivilla@localhost:5432/dentivilla_test npm run test:integration
```

## الأصول البصرية

صور الأسنان في `public/images/teeth/` مُصيَّرة من النماذج ثلاثية الأبعاد في `src/lib/dental-anatomy.ts` (نفس النماذج المستخدمة في مخطط الفك التفاعلي).
