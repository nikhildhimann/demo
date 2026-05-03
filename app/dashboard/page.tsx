import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";
import { siteConfig } from "@/data/siteConfig";

export const metadata = {
  title: `Dashboard - ${siteConfig.brandName}`,
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const enquiries = await prisma.enquiry.findMany({
    where: { email: session.user?.email as string },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        select: {
          title: true,
          slug: true,
          images: {
            take: 1,
          }
        }
      }
    }
  });

  return <DashboardClient user={session.user as any} initialEnquiries={enquiries} />;
}
