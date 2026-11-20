import type { Metadata } from "next";
import { JawExplorer } from "@/components/dental/JawExplorer";

export const metadata: Metadata = {
  title: "Explore Your Teeth & Anatomy",
  description: "Interactive 3D dental anatomy model featuring FDI tooth numbering, quadrants, and clinical functions.",
};

const topics = [
  {
    title: "Incisors",
    text: "Define the frontal smile line and shear food. Their shape, shade, and gingival harmony are essential to aesthetic dentistry.",
  },
  {
    title: "Canines",
    text: "Feature the longest roots in the human dentition, supporting facial contours and guiding lateral mandibular movements.",
  },
  {
    title: "Premolars & Molars",
    text: "Handle heavy chewing loads and maintain vertical bite height; restorative and implant treatments are planned around bone volume and occlusion.",
  },
  {
    title: "Gums & Supporting Bone",
    text: "A healthy periodontal foundation is a mandatory prerequisite for long-lasting aesthetic and implant outcomes; inflammation is addressed first.",
  },
];

export default function EducationPage() {
  return (
    <div className="container-page pt-28 pb-20 md:pt-36">
      <div className="max-w-2xl">
        <p className="eyebrow">Explore Your Teeth</p>
        <h1 className="heading-xl">32 Teeth, Each with a Unique Role.</h1>
        <p className="lede mt-4">
          An interactive 3D dental model with average anatomical dimensions. Click any tooth to see its international FDI number, name, and functional role.
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
