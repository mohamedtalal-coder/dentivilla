"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Sparkles, ExternalLink } from "lucide-react";
import { WelcomeIntro } from "@/components/site/WelcomeIntro";

export default function PreviewIntroPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrubber, setScrubber] = useState(0.5); // 0 to 1

  return (
    <main className="min-h-screen bg-alabaster px-4 py-12 text-ink sm:px-6 lg:px-8">
      {/* If full intro is playing */}
      {isPlaying && <WelcomeIntro forcePlay />}

      <div className="mx-auto max-w-4xl">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-line pb-6">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-dark">
              <Sparkles className="size-3.5" />
              مقدمة الترحيب السينمائية
            </span>
            <h1 className="mt-1 text-2xl font-bold text-teal-deep sm:text-3xl">
              معاينة ترحيب Dentivilla: &quot;ابتسامة تفتح الموقع&quot;
            </h1>
          </div>
          <Link
            href="/?intro=1"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <span>زيارة الموقع مع الترحيب</span>
            <ExternalLink className="size-4" />
          </Link>
        </div>

        {/* Live Controller Card */}
        <div className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-teal-deep">العرض المباشر</h2>
              <p className="text-sm text-muted">
                اضغط لتشغيل العرض السينمائي الكامل بملء الشاشة مدته 3.6 ثوانٍ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("dentivilla-intro-seen");
                setIsPlaying(true);
              }}
              className="btn-primary px-8 py-3.5 text-base shadow-lift"
            >
              <Play className="size-5 fill-current" />
              <span>تشغيل الترحيب الآن</span>
            </button>
          </div>

          {/* Interactive Scrubbing Section */}
          <div className="mt-10 border-t border-line pt-8">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-teal-deep">
                فحص مراحل الحركة خطوة بخطوة (Scrubber)
              </h3>
              <span className="font-mono text-xs font-bold text-amber-dark">
                {Math.round(scrubber * 100)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              اسحب المؤشر لمشاهدة التحول الواقعي بين الشفاه المغلقة وابتسامة الأسنان المشرقة:
            </p>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={scrubber}
              onChange={(e) => setScrubber(parseFloat(e.target.value))}
              className="mt-4 w-full accent-teal cursor-pointer"
            />

            {/* Stage Visualizer */}
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-ivory p-6">
              <div className="relative aspect-square w-64 overflow-hidden rounded-full shadow-card sm:w-80">
                {/* Closed Lips */}
                <div className="absolute inset-0">
                  <Image
                    src="/images/intro/lips-closed.jpg"
                    alt="شفاه مغلقة"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Smiling Lips with crossfade */}
                <div
                  className="absolute inset-0 transition-opacity"
                  style={{ opacity: Math.min(1, Math.max(0, (scrubber - 0.2) / 0.4)) }}
                >
                  <Image
                    src="/images/intro/lips-smile.jpg"
                    alt="ابتسامة ترحيبية"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Description of current phase */}
              <div className="mt-4 text-center">
                {scrubber < 0.25 && (
                  <p className="text-sm font-medium text-teal-deep">
                    المرحلة الأولى: شفاه طبيعية متناسقة في حالة استرخاء + رسالة الترحيب الأنيقة
                  </p>
                )}
                {scrubber >= 0.25 && scrubber < 0.65 && (
                  <p className="text-sm font-medium text-amber-dark">
                    المرحلة الثانية: تفتّح الابتسامة تدريجياً وبواقعية فائقة مع إشراقة الأسنان الطبيعية
                  </p>
                )}
                {scrubber >= 0.65 && (
                  <p className="text-sm font-medium text-teal-mid">
                    المرحلة الثالثة: فتحة الابتسامة تصبح بوابة الترحيب التي تفتح الموقع بكامل الشاشة
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info guide for client */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h4 className="font-semibold text-teal-deep">لماذا يبدو ترحيبياً وليس مجرد تحميل؟</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-muted">
              <li>• هوية ترحيبية راقية في البداية مع اسم الطبيب والعيادة.</li>
              <li>• صور تصوير فوتوغرافي فائق الدقة (Macro Aesthetic Photography) لشفاه حقيقية.</li>
              <li>• مدة مدروسة (3.6 ثوانٍ فقط) تمنح فخامة سينمائية دون تعطيل الزائر.</li>
              <li>• زر &quot;تخطي والبدء&quot; فوري متاح دائماً.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <h4 className="font-semibold text-teal-deep">طرق المشاهدة والتجربة</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-muted">
              <li>
                • في أي وقت بزيارة: <code className="text-amber-dark font-mono">/?intro=1</code>
              </li>
              <li>• عبر الزر العائم أسفل يسار الموقع في الشاشات العادية.</li>
              <li>• يعمل تلقائياً مرة واحدة في كل جلسة متصفح (Session).</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
