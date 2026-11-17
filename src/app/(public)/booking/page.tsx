import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { getContactInfo } from "@/lib/site-settings";
import { getBookingTreatments } from "@/lib/treatments";

export const metadata: Metadata = {
  title: "حجز موعد",
  description: "احجز موعد كشف أو علاج في عيادة Dentivilla مع تحديد السن على نموذج الفك ثلاثي الأبعاد واختيار وقت متاح فعلياً.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ treatment?: string; teeth?: string }>;
}) {
  const [{ treatment, teeth }, treatments, contact] = await Promise.all([
    searchParams,
    getBookingTreatments(),
    getContactInfo(),
  ]);
  const presetTeeth = (teeth ?? "").split(",").filter(Boolean).slice(0, 32);

  return (
    <div id="booking" className="container-page pt-28 pb-20 md:pt-36">
      <BookingFlow
        key={`${treatment ?? ""}|${teeth ?? ""}`}
        variant="page"
        treatments={treatments}
        presetTreatmentSlug={treatment}
        presetTeeth={presetTeeth}
        whatsappUrl={contact.whatsappUrl}
      />
    </div>
  );
}
