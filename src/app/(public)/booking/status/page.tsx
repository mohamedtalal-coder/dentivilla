import type { Metadata } from "next";
import { BookingStatusForm } from "@/components/booking/BookingStatusForm";

export const metadata: Metadata = { title: "Check Booking Status" };

export default async function BookingStatusPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (
    <div className="container-page max-w-xl pt-28 pb-20 md:pt-36">
      <p className="eyebrow">No Account Needed</p>
      <h1 className="heading-lg">Check Booking Status</h1>
      <p className="lede mt-4">Enter your booking reference code and the mobile number used when reserving.</p>
      <div className="mt-8">
        <BookingStatusForm initialReference={ref ?? ""} />
      </div>
    </div>
  );
}
