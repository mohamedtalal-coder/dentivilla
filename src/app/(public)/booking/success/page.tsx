import { redirect } from "next/navigation";

/** Legacy URL: confirmation is now shown inline; keep links working. */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  redirect(ref ? `/booking/status?ref=${encodeURIComponent(ref)}` : "/booking");
}
