import Link from "next/link";
import type { LeadStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type RecentEnquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  priority?: string;
  followUpDate?: Date | null;
  property: { title: string } | null;
};

type LatestProperty = {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  createdAt: Date;
};

const inactiveLeadStatuses: LeadStatus[] = ["CONVERTED", "LOST", "SPAM"];
const leadActionSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  status: true,
  priority: true,
  followUpDate: true,
  property: { select: { title: true } },
} as const;

function getDashboardDateWindow() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  return { now, startOfToday, endOfToday };
}

function leadHref(id: string) {
  return `/admin/enquiries?leadId=${encodeURIComponent(id)}`;
}

function formatFollowUpDate(value?: Date | null) {
  return value ? new Date(value).toLocaleString() : "No follow-up set";
}

export default async function AdminHomePage() {
  await requireAdmin();

  const dates = getDashboardDateWindow();
  const activeLeadWhere = { status: { notIn: inactiveLeadStatuses } };

  const [
    totalProperties,
    activeListings,
    soldProperties,
    rentedProperties,
    draftProperties,
    featuredProperties,
    totalLeads,
    openNewLeads,
    newLeadsToday,
    hotLeads,
    followUpsToday,
    overdueFollowUps,
    convertedLeads,
    lostLeads,
    todayFollowUpLeads,
    overdueFollowUpLeads,
    hotLeadItems,
    recentEnquiries,
    latestProperties,
  ] = await Promise.all([
    prisma.property.count({ where: { deletedAt: null } }),
    prisma.property.count({ where: { deletedAt: null, status: "AVAILABLE" } }),
    prisma.property.count({ where: { deletedAt: null, status: "SOLD" } }),
    prisma.property.count({ where: { deletedAt: null, status: "RENTED" } }),
    prisma.property.count({ where: { deletedAt: null, status: "DRAFT" } }),
    prisma.property.count({ where: { deletedAt: null, status: "AVAILABLE", featured: true } }),
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.enquiry.count({ where: { createdAt: { gte: dates.startOfToday, lte: dates.endOfToday } } }),
    prisma.enquiry.count({ where: { priority: "HOT" } }),
    prisma.enquiry.count({
      where: {
        ...activeLeadWhere,
        followUpDate: { gte: dates.startOfToday, lte: dates.endOfToday },
      },
    }),
    prisma.enquiry.count({
      where: {
        ...activeLeadWhere,
        followUpDate: { lt: dates.startOfToday },
      },
    }),
    prisma.enquiry.count({ where: { status: "CONVERTED" } }),
    prisma.enquiry.count({ where: { status: "LOST" } }),
    prisma.enquiry.findMany({
      where: {
        ...activeLeadWhere,
        followUpDate: { gte: dates.startOfToday, lte: dates.endOfToday },
      },
      orderBy: { followUpDate: "asc" },
      take: 4,
      select: leadActionSelect,
    }),
    prisma.enquiry.findMany({
      where: {
        ...activeLeadWhere,
        followUpDate: { lt: dates.startOfToday },
      },
      orderBy: { followUpDate: "asc" },
      take: 4,
      select: leadActionSelect,
    }),
    prisma.enquiry.findMany({
      where: { priority: "HOT", ...activeLeadWhere },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: leadActionSelect,
    }),
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
    { label: "Draft Properties", value: draftProperties, href: "/admin/properties?status=DRAFT", color: "text-zinc-700", bg: "bg-zinc-50", border: "border-zinc-200" },
    { label: "Sold Properties", value: soldProperties, href: "/admin/properties?status=SOLD", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    { label: "Rented Properties", value: rentedProperties, href: "/admin/properties?status=RENTED", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
    { label: "Total Leads", value: totalLeads, href: "/admin/enquiries", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" },
    { label: "New Leads Today", value: newLeadsToday, href: "/admin/enquiries?date=today", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    { label: "Open New Leads", value: openNewLeads, href: "/admin/enquiries?status=NEW", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
    { label: "Hot Leads", value: hotLeads, href: "/admin/enquiries?priority=HOT", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
    { label: "Follow-ups Today", value: followUpsToday, href: "/admin/enquiries?followUp=today", color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
    { label: "Overdue Follow-ups", value: overdueFollowUps, href: "/admin/enquiries?followUp=overdue", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
    { label: "Converted", value: convertedLeads, href: "/admin/enquiries?status=CONVERTED", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
    { label: "Lost", value: lostLeads, href: "/admin/enquiries?status=LOST", color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
    { label: "Featured Available", value: featuredProperties, href: "/admin/properties?featured=true&status=AVAILABLE", color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200" },
  ];

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage listings, leads, and website operations from one place.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="block">
            <div className={`rounded-lg border ${stat.border} ${stat.bg} px-3 py-2.5 hover:shadow-sm transition-all cursor-pointer`}>
              <p className="text-[11px] font-medium text-slate-500 leading-tight">{stat.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DailyActionCard title="Today's Follow-ups" emptyText="No follow-ups today." leads={todayFollowUpLeads} />
        <DailyActionCard title="Overdue Follow-ups" emptyText="No overdue follow-ups." leads={overdueFollowUpLeads} />
        <DailyActionCard title="Hot Leads" emptyText="No hot leads right now." leads={hotLeadItems} />
      </div>

      {/* Bottom row — Quick Actions + Recent Leads + Latest Properties */}
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

        {/* Recent Leads */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-slate-700">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 px-4 pb-4">
            {recentEnquiries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No leads yet.</p>
            ) : (
              (recentEnquiries as RecentEnquiry[]).map((enquiry) => (
                <Link key={enquiry.id} href={leadHref(enquiry.id)} className="block">
                  <div className="flex items-center justify-between rounded-md border border-slate-100 px-2.5 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{enquiry.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{enquiry.property?.title || "General lead"}</p>
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

function DailyActionCard({
  title,
  emptyText,
  leads,
}: {
  title: string;
  emptyText: string;
  leads: RecentEnquiry[];
}) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-4 pb-4">
        {leads.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyText}</p>
        ) : (
          leads.map((lead) => (
            <Link key={lead.id} href={leadHref(lead.id)} className="block">
              <div className="rounded-md border border-slate-100 px-2.5 py-2 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-slate-800">{lead.name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    {lead.priority && (
                      <Badge variant={lead.priority === "HOT" ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">
                        {lead.priority}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-slate-500">
                      {lead.status}
                    </Badge>
                  </div>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">{lead.property?.title || "General lead"}</p>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                  <span>{lead.phone || lead.email || "No contact provided"}</span>
                  {lead.followUpDate !== undefined && <span>{formatFollowUpDate(lead.followUpDate)}</span>}
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
