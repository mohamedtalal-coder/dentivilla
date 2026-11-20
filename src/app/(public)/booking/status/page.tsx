import type { Metadata } from "next";
import { BookingStatusForm } from "@/components/booking/BookingStatusForm";
import { getContactInfo } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Check Booking Status" };

export default async function BookingStatusPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const [{ ref }, contact] = await Promise.all([searchParams, getContactInfo()]);
  return (
    <div className="container-page max-w-xl pt-28 pb-20 md:pt-36">
      <p className="eyebrow">No Account Needed</p>
      <h1 className="heading-lg">Check Booking Status</h1>
      <p className="lede mt-4">Enter your booking reference code and the mobile number used when reserving.</p>
      <div className="mt-8">
        <BookingStatusForm initialReference={ref ?? ""} whatsappUrl={contact.whatsappUrl} />
      </div>
    </div>
  );
}
