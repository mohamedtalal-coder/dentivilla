import type { Metadata } from "next";
import { JawExplorer } from "@/components/dental/JawExplorer";

export const metadata: Metadata = {
  title: "تعرّف على أسنانك",
  description: "نموذج ثلاثي الأبعاد تفاعلي للفكين مع ترقيم FDI لكل سن ووظيفته.",
};

const topics = [
  { title: "القواطع", text: "تظهر في خط الابتسامة وتقطع الطعام. شكلها ولونها وعلاقتها باللثة أساس أي تجميل أمامي." },
  { title: "الأنياب", text: "أطول الجذور في الفم، تدعم زاوية الفم وتوجّه حركة الفك أثناء المضغ." },
  { title: "الضواحك والأضراس", text: "مسؤولة عن الطحن وتحمّل أكبر قوة إطباق؛ الترميم أو الزراعة هنا يُخطط حسب العظم والعضة." },
  { title: "اللثة والعظم", text: "صحة الأنسجة الداعمة شرط لأي علاج تجميلي ثابت، والالتهاب يُعالج أولاً." },
];

export default function EducationPage() {
  return (
    <div className="container-page pt-28 pb-20 md:pt-36">
      <div className="max-w-2xl">
        <p className="eyebrow">تعرّف على أسنانك</p>
        <h1 className="heading-xl">٣٢ سناً، ولكل منها دور.</h1>
        <p className="lede mt-4">
          نموذج ثلاثي الأبعاد للفكين بأبعاد تشريحية متوسطة. اختر أي سن لمعرفة اسمه ورقمه الدولي ووظيفته.
        </p>
      </div>
      <div className="mt-10">
        <JawExplorer />
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {topics.map((topic) => (
          <article key={topic.title} className="card-soft rounded-[1.5rem] p-6">
            <h2 className="text-lg font-bold text-teal-deep">{topic.title}</h2>
            <p className="mt-2 leading-8 text-muted">{topic.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
