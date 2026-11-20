import { prisma } from "@/lib/prisma";
import { FaqManager } from "@/components/admin/FaqManager";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function FaqAdminPage() {
  await requireAdminSession();
  const faqs = await prisma.faq.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      question: true,
      answer: true,
      published: true,
      sortOrder: true,
    },
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold text-teal-deep">Frequently Asked Questions</h1>
        <p className="mt-1 text-sm text-muted">
          Manage and organize the FAQs displayed to patients on the homepage.
        </p>
      </div>
      <FaqManager faqs={faqs} />
    </div>
  );
}
