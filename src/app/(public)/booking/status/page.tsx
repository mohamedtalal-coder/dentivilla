import type { Metadata } from "next";
import { BookingStatusForm } from "@/components/booking/BookingStatusForm";

export const metadata: Metadata = { title: "متابعة طلب الحجز" };

export default async function BookingStatusPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (
    <div className="container-page max-w-xl pt-28 pb-20 md:pt-36">
      <p className="eyebrow">بدون حساب</p>
      <h1 className="heading-lg">متابعة طلب الحجز</h1>
      <p className="lede mt-4">أدخل الرقم المرجعي ورقم الموبايل الذي استخدمته عند الحجز.</p>
      <div className="mt-8">
        <BookingStatusForm initialReference={ref ?? ""} />
      </div>
    </div>
  );
}
