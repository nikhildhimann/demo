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
    { label: "Total Properties", value: totalProperties, href: "/admin/properties", color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
    { label: "Active Listings", value: activeListings, href: "/admin/properties?status=AVAILABLE", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    { label: "Sold Properties", value: soldProperties, href: "/admin/properties?status=SOLD", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    { label: "Rented Properties", value: rentedProperties, href: "/admin/properties?status=RENTED", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
    { label: "New Leads", value: newLeads, href: "/admin/enquiries?status=NEW", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    { label: "Total Enquiries", value: totalEnquiries, href: "/admin/enquiries", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" },
    { label: "Featured", value: featuredProperties, href: "/admin/properties?featured=true", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
  ];

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage listings, leads, and website operations from one place.</p>
      </div>

      {/* Stats — single compact row */}
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-7">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="block">
            <div className={`rounded-lg border ${stat.border} ${stat.bg} px-3 py-2.5 hover:shadow-sm transition-all cursor-pointer`}>
              <p className="text-[11px] font-medium text-slate-500 leading-tight">{stat.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom row — Quick Actions + Recent Enquiries + Latest Properties */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-slate-700">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            <Button asChild size="sm" className="w-full justify-start bg-slate-800 hover:bg-slate-700 text-white text-xs h-8">
              <Link href="/admin/properties/new">+ Add Property</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start text-xs h-8 border-slate-200 text-slate-600 hover:bg-slate-50">
              <Link href="/admin/enquiries">View Leads</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start text-xs h-8 border-slate-200 text-slate-600 hover:bg-slate-50">
              <Link href="/admin/settings">Manage Settings</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Enquiries */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-slate-700">Recent Enquiries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 px-4 pb-4">
            {recentEnquiries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No enquiries yet.</p>
            ) : (
              (recentEnquiries as RecentEnquiry[]).map((enquiry) => (
                <Link key={enquiry.id} href={`/admin/enquiries?id=${enquiry.id}`} className="block">
                  <div className="flex items-center justify-between rounded-md border border-slate-100 px-2.5 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{enquiry.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{enquiry.property?.title || "General enquiry"}</p>
                    </div>
                    <Badge
                      variant={enquiry.status === "NEW" ? "default" : "secondary"}
                      className="ml-2 text-[10px] px-1.5 py-0 h-4 shrink-0"
                    >
                      {enquiry.status}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Latest Added Properties */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-slate-700">Latest Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 px-4 pb-4">
            {latestProperties.length === 0 ? (
              <p className="text-xs text-muted-foreground">No properties added yet.</p>
            ) : (
              (latestProperties as LatestProperty[]).map((property) => (
                <Link key={property.id} href={`/admin/properties/${property.id}/edit`} className="block">
                  <div className="flex items-center justify-between rounded-md border border-slate-100 px-2.5 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{property.title}</p>
                      <p className="text-[10px] text-slate-400">{new Date(property.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      {property.featured && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                          Featured
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-slate-500">
                        {property.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
