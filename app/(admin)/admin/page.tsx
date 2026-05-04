import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type RecentEnquiry = {
  id: string;
  name: string;
  status: string;
  property: { title: string } | null;
};

type LatestProperty = {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  createdAt: Date;
};

export default async function AdminHomePage() {
  await requireAdmin();

  const [
    totalProperties,
    activeListings,
    soldProperties,
    rentedProperties,
    featuredProperties,
    totalEnquiries,
    newLeads,
    recentEnquiries,
    latestProperties,
  ] = await Promise.all([
    prisma.property.count({ where: { deletedAt: null } }),
    prisma.property.count({ where: { deletedAt: null, status: "AVAILABLE" } }),
    prisma.property.count({ where: { deletedAt: null, status: "SOLD" } }),
    prisma.property.count({ where: { deletedAt: null, status: "RENTED" } }),
    prisma.property.count({ where: { deletedAt: null, featured: true } }),
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { property: { select: { title: true } } },
    }),
    prisma.property.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, status: true, featured: true, createdAt: true },
    }),
  ]);

  const stats = [
    ["Total Properties", totalProperties],
    ["Active Listings", activeListings],
    ["Sold Properties", soldProperties],
    ["Rented Properties", rentedProperties],
    ["New Leads", newLeads],
    ["Total Enquiries", totalEnquiries],
    ["Featured Properties", featuredProperties],
  ] as const;

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage listings, leads, and website operations from one place.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/admin/properties/new">Add Property</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/enquiries">View Leads</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/settings">Manage Settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Enquiries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEnquiries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enquiries yet.</p>
            ) : (
              (recentEnquiries as RecentEnquiry[]).map((enquiry) => (
                <div key={enquiry.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{enquiry.name}</p>
                    <p className="text-xs text-muted-foreground">{enquiry.property?.title || "General enquiry"}</p>
                  </div>
                  <Badge variant={enquiry.status === "NEW" ? "default" : "secondary"}>{enquiry.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest Added Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {latestProperties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No properties added yet.</p>
          ) : (
            (latestProperties as LatestProperty[]).map((property) => (
              <div key={property.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{property.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(property.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {property.featured && <Badge>Featured</Badge>}
                  <Badge variant="outline">{property.status}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
