import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    q: "هل تحتاج الوجوه التجميلية إلى برد الأسنان؟",
    a: "يعتمد ذلك على شكل أسنانك ولونها والنتيجة المطلوبة. في حالات كثيرة يكون التحضير محدوداً جداً، وأحياناً لا يلزم. نوضح لك المقدار المتوقع لكل سن قبل البدء، ونجرب الشكل داخل فمك بنموذج مؤقت.",
  },
  {
    q: "هل زراعة الأسنان مؤلمة؟ وهل تناسب مرضى السكر والضغط؟",
    a: "تُجرى الزراعة تحت تخدير موضعي، ومعظم المرضى يصفون ما بعدها بانزعاج يمكن التحكم فيه بالمسكنات المعتادة. مرضى السكر والضغط المنضبطين يمكنهم غالباً إجراء الزراعة بعد تقييم حالتهم الصحية — لذلك نطلب التاريخ المرضي عند الحجز.",
  },
  {
    q: "هل يمكنني رؤية شكل ابتسامتي قبل العلاج؟",
    a: "نعم. نصمم الابتسامة رقمياً، ثم نضع نموذجاً تجريبياً مؤقتاً على أسنانك لترى الشكل والحجم في المرآة قبل أي خطوة نهائية.",
  },
  {
    q: "متى أعرف التكلفة؟",
    a: "بعد الكشف تحصل على خطة مكتوبة تشمل الخيارات المتاحة وتكلفة كل منها والمدة المتوقعة، ولا يبدأ أي إجراء قبل موافقتك.",
  },
  {
    q: "هل الحجز عبر الموقع نهائي؟",
    a: "يُحجز الوقت الذي اخترته لك فوراً ولا يظهر لغيرك، ثم تؤكده العيادة. يمكنك متابعة حالة الطلب في أي وقت بالرقم المرجعي ورقم هاتفك.",
  },
];

export function Faq() {
  return (
    <section className="section" aria-labelledby="faq-title">
      <div className="container-page grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow">أسئلة شائعة</p>
          <h2 id="faq-title" className="heading-lg">
            قبل أن تبدأ
          </h2>
          <p className="lede mt-4">إجابات مباشرة عن أكثر ما يسأل عنه المرضى في الزيارة الأولى.</p>
        </div>
        <div className="grid gap-3 lg:col-span-8">
          {ITEMS.map((item, index) => (
            <details
              key={item.q}
              className="group card-soft rounded-2xl px-5 open:shadow-lift [&_summary::-webkit-details-marker]:hidden"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold text-teal-deep">
                {item.q}
                <ChevronDown className="size-5 shrink-0 text-amber transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-5 leading-8 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
