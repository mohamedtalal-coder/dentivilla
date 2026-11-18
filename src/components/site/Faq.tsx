import { ChevronDown } from "lucide-react";
import { getPublicFaqs } from "@/lib/faq";

export async function Faq() {
  const items = await getPublicFaqs();

  if (items.length === 0) return null;

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
          {items.map((item, index) => (
            <details
              key={item.id}
              className="group card-soft rounded-2xl px-5 open:shadow-lift [&_summary::-webkit-details-marker]:hidden"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold text-teal-deep">
                {item.question}
                <ChevronDown className="size-5 shrink-0 text-amber transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-5 leading-8 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
