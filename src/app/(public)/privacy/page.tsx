import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  Database,
  EyeOff,
  FileCheck,
  KeyRound,
  Lock,
  Scale,
  Shield,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { site } from "@/lib/site";
import { getContactInfo } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "سياسة الخصوصية وحماية البيانات المشفرة | Dentivilla",
  description:
    "تعرف على كيفية حماية وتشفير بيانات المرضى في عيادة Dentivilla باستخدام تقنيات التشفير المعتمد AES-256-GCM، والتزامنا بالسرية الطبية وقوانين حماية البيانات.",
};

export default async function PrivacyPolicyPage() {
  const contact = await getContactInfo();

  return (
    <div className="bg-ivory/40 pb-24 pt-28 md:pt-36">
      <div className="container-page max-w-4xl space-y-12">
        {/* Header */}
        <header className="border-b border-line pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal-light px-3.5 py-1 text-xs font-semibold text-teal-deep">
            <ShieldCheck className="size-4 text-teal" aria-hidden />
            <span>حماية البيانات والسرية الطبية</span>
          </div>
          <h1 className="heading-xl mt-4 text-teal-deep">سياسة الخصوصية وحماية البيانات</h1>
          <p className="lede mt-3 text-muted">
            في عيادة <span className="font-semibold text-ink">Dentivilla</span> بإشراف{" "}
            <span className="font-semibold text-ink">{site.doctor.name}</span>، نعتبر خصوصية وسرية بياناتك الطبية
            والشخصية أمانة مهنية وأخلاقية لا مساومة فيها. نوضح هنا بشفافية كيف نجمع بياناتك ونشفرها ونحميها.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              آخر تحديث: نوفمبر 2026
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-teal" aria-hidden />
              تشفير AES-256-GCM مفعل على مستوى التطبيق
            </span>
          </div>
        </header>

        {/* 1. Technical Security Highlight Card */}
        <section className="rounded-3xl border border-teal/30 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-light text-teal-deep">
              <KeyRound className="size-6 text-teal" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-teal-deep">التشفير المتقدم على مستوى التطبيق (Application-Level Encryption)</h2>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                لا نكتفي بإجراءات الأمان التقليدية؛ بل نطبق تشفيراً حقيقياً داخل كود التطبيق قبل وصول البيانات إلى قاعدة البيانات:
              </p>
              <ul className="mt-4 grid gap-2.5 text-sm text-neutral-700 sm:grid-cols-2">
                <li className="flex items-center gap-2 rounded-xl bg-ivory px-3.5 py-2">
                  <Shield className="size-4 text-teal" aria-hidden />
                  <span>تشفير معتمد <strong>AES-256-GCM</strong> للأسماء والملاحظات</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-ivory px-3.5 py-2">
                  <Shield className="size-4 text-teal" aria-hidden />
                  <span>رمز تهيئة عشوائي فريد (Unique IV) لكل عملية حجز</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-ivory px-3.5 py-2">
                  <Shield className="size-4 text-teal" aria-hidden />
                  <span>فهرس أعمى مشفر <strong>HMAC-SHA-256</strong> للهواتف</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-ivory px-3.5 py-2">
                  <Shield className="size-4 text-teal" aria-hidden />
                  <span>حماية ضد التلاعب بسلامة السجلات (Authentication Tag)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. What data we collect */}
        <section className="space-y-4">
          <h2 className="heading-md text-teal-deep">1. البيانات التي نجمعها ولماذا نجمعها</h2>
          <p className="text-sm leading-7 text-neutral-600">
            نطبق مبدأ <strong>الحد الأدنى من البيانات (Data Minimization)</strong>؛ فلا نطلب أو نخزن سوى ما يلزم طبياً وإدارياً لإتمام حجزك وتقديم الرعاية السريرية الآمنة:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card-soft rounded-2xl p-5">
              <h3 className="font-bold text-teal-deep">أ. بيانات التواصل الأساسية</h3>
              <p className="mt-2 text-xs leading-6 text-neutral-600">
                <strong>الاسم ورقم الموبايل (والواتساب اختياريًا):</strong> للتواصل المباشر معك، وتأكيد موعد الحجز أو إبلاغك بأي تعديل طارئ في جدول الزيارات.
              </p>
            </div>

            <div className="card-soft rounded-2xl p-5">
              <h3 className="font-bold text-teal-deep">ب. تفاصيل الزيارة والسن المعني</h3>
              <p className="mt-2 text-xs leading-6 text-neutral-600">
                <strong>نوع العلاج والأسنان المستهدفة (FDI Notation):</strong> لمساعدة الطبيب وفريق العيادة على تخصيص الوقت الكافي وتجهيز الأدوات والمواد المناسبة قبل وصولك.
              </p>
            </div>

            <div className="card-soft rounded-2xl p-5">
              <h3 className="font-bold text-teal-deep">ج. التاريخ المرضي المُبلّغ عنه</h3>
              <p className="mt-2 text-xs leading-6 text-neutral-600">
                <strong>الحالات الصحية المزمنة (مثل السكري، ضغط الدم، سيولة الدم، أو الحساسية):</strong> لضمان سلامتك الصحية وتجنب أي تعارض دوائي أو جراحي أثناء التخدير أو العلاج.
              </p>
            </div>

            <div className="card-soft rounded-2xl p-5">
              <h3 className="font-bold text-teal-deep">د. شكوى المريض وملاحظاته</h3>
              <p className="mt-2 text-xs leading-6 text-neutral-600">
                <strong>ملاحظات الحجز الاختيارية:</strong> وصف مبدئي لأعراض الألم أو التطلعات التجميلية التي تود مناقشتها مع الطبيب.
              </p>
            </div>
          </div>
        </section>

        {/* 3. What we NEVER do */}
        <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
          <h2 className="heading-md text-teal-deep">2. بيانات لا نجمعها ولا نبيعها مطلقا</h2>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-2xl bg-ivory p-4">
              <EyeOff className="size-5 shrink-0 text-teal" aria-hidden />
              <div>
                <p className="font-bold text-ink">بدون ملفات تتبع إعلانية</p>
                <p className="mt-1 text-xs text-muted">لا نستخدم أي كوكيز تتبع من شركات إعلانية خارجية أو منصات تجسس.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-ivory p-4">
              <Database className="size-5 shrink-0 text-teal" aria-hidden />
              <div>
                <p className="font-bold text-ink">لا نبيع بيانات المرضى</p>
                <p className="mt-1 text-xs text-muted">بياناتك ليست سلعة ولن تُشارك مع أي جهة تسويقية أو شركات أدوية تجارية.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-ivory p-4">
              <Lock className="size-5 shrink-0 text-teal" aria-hidden />
              <div>
                <p className="font-bold text-ink">بدون بطاقات بنكية بالموقع</p>
                <p className="mt-1 text-xs text-muted">الحجز مجاني وبدون حساب، والدفع يتم داخل مقر العيادة بالطرق المعتادة.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Clinical Photos Consent Policy */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck className="size-5 text-teal" aria-hidden />
            <h2 className="heading-md text-teal-deep">3. سياسة صور الحالات السريرية (قبل وبعد)</h2>
          </div>
          <div className="card-soft rounded-2xl p-6 text-sm leading-7 text-neutral-600">
            <p>
              الصور المعروضة في <Link href="/cases" className="font-semibold text-teal-deep underline underline-offset-4">معرض الحالات</Link> تخضع لضوابط أخلاقية صارمة:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-neutral-700">
              <li>
                <strong>الموافقة الصريحة والمسبقة:</strong> لا تُنشر أي صورة لحالة سريرية إلا بموافقة كتابية موثقة ومؤكدة من المريض شخصياً.
              </li>
              <li>
                <strong>حجب الهوية:</strong> تقتصر الصور على منطقة الأسنان والابتسامة فقط، مع حجب كامل للملامح الشخصية لمنع التعرف على صاحب الحالة.
              </li>
              <li>
                <strong>حق سحب الموافقة:</strong> يحق لأي مريض شارك حالته سابقاً طلب حذف صوره من الموقع في أي وقت، وتلتزم العيادة بحذفها فوراً.
              </li>
            </ul>
          </div>
        </section>

        {/* 5. Patient Rights */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="size-5 text-teal" aria-hidden />
            <h2 className="heading-md text-teal-deep">4. حقوقك كـمريض ومستخدم</h2>
          </div>
          <p className="text-sm leading-7 text-neutral-600">
            وفقاً لآداب مهنة طب وجراحة الفم والأسنان وقوانين حماية البيانات، تتمتع بالحقوق التالية:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-white p-4 text-xs leading-6 text-neutral-600">
              <span className="font-bold text-ink">حق الاطلاع والاستعلام:</span> معرفة حالة موعدك وتفاصيل زياراتك المسجلة عبر صفحة <Link href="/booking/status" className="font-semibold text-teal-deep underline">متابعة الحجز</Link>.
            </div>
            <div className="rounded-xl border border-line bg-white p-4 text-xs leading-6 text-neutral-600">
              <span className="font-bold text-ink">حق التصحيح والتعديل:</span> تصحيح أي خطأ في بيانات اسمك أو رقم هاتفك عبر التواصل مع العيادة أو زيارة الطبيب.
            </div>
            <div className="rounded-xl border border-line bg-white p-4 text-xs leading-6 text-neutral-600">
              <span className="font-bold text-ink">حق طلب الإلغاء أو الحذف:</span> طلب إلغاء حجزك أو حذف بياناتك الرقمية، مع مراعاة متطلبات حفظ السجلات الطبية الورقية والسريرية التي يفرضها القانون الطبي للمسؤولية العلاجية.
            </div>
            <div className="rounded-xl border border-line bg-white p-4 text-xs leading-6 text-neutral-600">
              <span className="font-bold text-ink">حق السرية المطلقة:</span> حظر إفشاء أي تفاصيل علاجية لأي طرف ثالث دون إذنك الصريح، باستثناء أوامر القضاء والجهات الرسمية المختصة.
            </div>
          </div>
        </section>

        {/* 6. Legal Context & Compliance */}
        <section className="space-y-4 rounded-3xl border border-amber/30 bg-amber-light/30 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Scale className="size-5 text-amber-dark" aria-hidden />
            <h2 className="heading-md text-teal-deep">5. الإطار القانوني والمهني</h2>
          </div>
          <p className="text-sm leading-7 text-neutral-700">
            تخضع ممارسات حماية البيانات في Dentivilla للتشريعات المنظمة لمهنة الطب وحماية البيانات في جمهورية مصر العربية:
          </p>
          <ul className="mt-2 space-y-2 text-xs leading-6 text-neutral-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" />
              <span><strong>قانون حماية البيانات الشخصية رقم 151 لسنة 2020:</strong> الالتزام بالمعالجة المشروعة، والشفافية، وتأمين البيانات الحساسة (الطبية).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" />
              <span><strong>لائحة آداب مهنة الطب الصادرة عن نقابة الأطباء:</strong> الالتزام الصارم بالسرية الطبية وكتمان أسرار المريض التي يُطلع عليها بحكم المهنة.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal" />
              <span><strong>قوانين المنشآت الطبية:</strong> حفظ السجلات العلاجية للمدة النظامية المقررة لسلامة ومتابعة الحالة الصحية للمريض.</span>
            </li>
          </ul>
        </section>

        {/* 7. Contact Us for Privacy Queries */}
        <section className="rounded-3xl border border-teal/20 bg-teal-light/40 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-teal-deep">هل لديك استفسار حول خصوصية بياناتك؟</h2>
              <p className="mt-1 text-xs leading-5 text-neutral-600">
                إذا كان لديك أي سؤال حول كيفية معالجة وتشفير بياناتك أو تود ممارسة أي من حقوقك، يسعدنا تواصلك المباشر مع العيادة.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a href={contact.whatsappUrl} target="_blank" rel="noreferrer" className="btn-primary text-xs">
                واتساب العيادة
              </a>
              <Link href="/contact" className="btn-secondary text-xs">
                بيانات التواصل والموقع
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
