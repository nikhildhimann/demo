"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  Flame,
  Inbox,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Search,
  Target,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type LeadStatus = "NEW" | "CONTACTED" | "INTERESTED" | "SITE_VISIT" | "NEGOTIATION" | "CONVERTED" | "LOST" | "SPAM";
type LeadPriority = "HOT" | "WARM" | "COLD";

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  message: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  source: string;
  budget: string | null;
  preferredLocation: string | null;
  preferredType: string | null;
  notes: string | null;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    slug: string;
    city: string;
    location: string | null;
    type: string;
    purpose: string;
    price: number;
  } | null;
};

type FollowUp = Pick<Lead, "id" | "name" | "phone" | "followUpDate" | "status">;

type PropertyOption = {
  id: string;
  title: string;
  slug: string;
  city: string;
  location: string | null;
  type: string;
  purpose: string;
  price: number;
};

const statuses: LeadStatus[] = ["NEW", "CONTACTED", "INTERESTED", "SITE_VISIT", "NEGOTIATION", "CONVERTED", "LOST", "SPAM"];
const pipelineStatuses: LeadStatus[] = ["NEW", "CONTACTED", "INTERESTED", "SITE_VISIT", "NEGOTIATION", "CONVERTED", "LOST"];
const priorities: LeadPriority[] = ["HOT", "WARM", "COLD"];

function statusLabel(status: string) {
  return status.replace("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusBadge(status: LeadStatus) {
  const className = {
    NEW: "bg-yellow-500 text-white",
    CONTACTED: "bg-blue-500 text-white",
    INTERESTED: "bg-emerald-500 text-white",
    SITE_VISIT: "bg-indigo-500 text-white",
    NEGOTIATION: "bg-purple-500 text-white",
    CONVERTED: "bg-green-600 text-white",
    LOST: "bg-slate-500 text-white",
    SPAM: "bg-red-600 text-white",
  }[status];
  return <Badge className={className}>{statusLabel(status)}</Badge>;
}

function getPriorityBadge(priority: LeadPriority) {
  const className = {
    HOT: "bg-red-500 text-white",
    WARM: "bg-amber-500 text-white",
    COLD: "bg-slate-500 text-white",
  }[priority];
  return <Badge className={className}>{priority}</Badge>;
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function buildWhatsAppMessage(lead: Lead, businessName: string) {
  const property = lead.property?.title || lead.preferredType || "your property requirement";
  const location = lead.preferredLocation || lead.property?.location || lead.property?.city || "your preferred location";
  const intro = `Hi ${lead.name}, this is ${businessName}.`;

  if (lead.status === "NEW") return `${intro} Thanks for your enquiry about ${property}. Are you available for a quick call today to understand your budget and timeline?`;
  if (lead.status === "CONTACTED") return `${intro} Following up on ${property}. I can share matching options in ${location}. Would you prefer WhatsApp details or a call?`;
  if (lead.status === "INTERESTED") return `${intro} I found a few strong matches for ${property} around ${location}. Would you like to shortlist them for viewing?`;
  if (lead.status === "SITE_VISIT") return `${intro} Confirming your site visit for ${property}. Please share your preferred date and time.`;
  if (lead.status === "NEGOTIATION") return `${intro} I have an update on the pricing/terms for ${property}. Can we discuss the next step?`;
  if (lead.status === "CONVERTED") return `${intro} Thank you for working with us. We are here if you need any post-deal support.`;
  return `${intro} Checking whether you still need help with ${property}.`;
}

function whatsappUrl(lead: Lead, businessName: string) {
  const phone = lead.phone.replace(/\D/g, "");
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage(lead, businessName))}` : "";
}

function buildQuery(filters: Record<string, string>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });
  return params;
}

export function EnquiriesClient({ embedded = false }: { embedded?: boolean }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, hot: 0, followUpsDue: 0, converted: 0, todayFollowUps: 0 });
  const [sources, setSources] = useState<string[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [todayFollowUps, setTodayFollowUps] = useState<FollowUp[]>([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState<FollowUp[]>([]);
  const [businessName, setBusinessName] = useState("Real Estate Business");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draft, setDraft] = useState({ status: "NEW" as LeadStatus, priority: "WARM" as LeadPriority, notes: "", followUpDate: "" });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    source: "all",
    propertyId: "all",
    date: "all",
    page: "1",
    limit: "25",
  });

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = buildQuery(filters);
      const response = await fetch(`/api/admin/enquiries?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to load leads");

      setLeads(data.enquiries || []);
      setStats(data.stats || { total: 0, new: 0, hot: 0, followUpsDue: 0, converted: 0, todayFollowUps: 0 });
      setSources(data.sources || []);
      setProperties(data.properties || []);
      setTodayFollowUps(data.todayFollowUps || []);
      setOverdueFollowUps(data.overdueFollowUps || []);
      setBusinessName(data.businessName || "Real Estate Business");
      setPagination({ page: data.currentPage || 1, totalPages: data.totalPages || 1, totalCount: data.totalCount || 0 });
    } catch (error: any) {
      toast.error(error.message || "Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === "page" ? value : "1" }));
  };

  const openLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDraft({
      status: lead.status,
      priority: lead.priority,
      notes: lead.notes || "",
      followUpDate: toDateTimeLocal(lead.followUpDate),
    });
  };

  const updateLead = async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/enquiries/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: draft.status,
          priority: draft.priority,
          notes: draft.notes,
          followUpDate: draft.followUpDate ? new Date(draft.followUpDate).toISOString() : null,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Unable to update lead");
      toast.success("Lead updated");
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead permanently?")) return;
    const response = await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success("Lead deleted");
      fetchLeads();
    } else {
      toast.error("Unable to delete lead");
    }
  };

  const openFollowUp = async (item: FollowUp) => {
    const existing = leads.find((lead) => lead.id === item.id);
    if (existing) {
      openLead(existing);
      return;
    }

    try {
      const response = await fetch(`/api/admin/enquiries?search=${encodeURIComponent(item.phone)}&limit=1`);
      const data = await response.json();
      const lead = data.enquiries?.find((entry: Lead) => entry.id === item.id) || data.enquiries?.[0];
      if (lead) openLead(lead);
    } catch {
      toast.error("Unable to open follow-up lead");
    }
  };

  const exportCsv = () => {
    const params = buildQuery(filters);
    params.set("export", "csv");
    window.location.href = `/api/admin/enquiries?${params.toString()}`;
  };

  const pipeline = useMemo(() => {
    return pipelineStatuses.map((status) => ({
      status,
      leads: leads.filter((lead) => lead.status === status).slice(0, 8),
    }));
  }, [leads]);

  const matchingProperties = useMemo(() => {
    if (!selectedLead) return [];
    const location = (selectedLead.preferredLocation || selectedLead.property?.location || selectedLead.property?.city || "").toLowerCase();
    const type = (selectedLead.preferredType || selectedLead.property?.type || "").toLowerCase();
    return properties
      .filter((property) => {
        const matchesLocation = location ? `${property.location || ""} ${property.city}`.toLowerCase().includes(location) : true;
        const matchesType = type ? property.type.toLowerCase().includes(type) : true;
        return matchesLocation || matchesType;
      })
      .filter((property) => property.id !== selectedLead.property?.id)
      .slice(0, 4);
  }, [properties, selectedLead]);

  const statCards = [
    { title: "Total Leads", value: stats.total, icon: Target, color: "text-slate-700", status: "all" },
    { title: "New Leads", value: stats.new, icon: Inbox, color: "text-yellow-600", status: "NEW" },
    { title: "Hot Leads", value: stats.hot, icon: Flame, color: "text-red-600", priority: "HOT" },
    { title: "Follow-ups Due", value: stats.followUpsDue, icon: CalendarClock, color: "text-blue-600", date: "today" },
    { title: "Converted", value: stats.converted, icon: CheckCircle2, color: "text-green-600", status: "CONVERTED" },
    { title: "Lost Leads", value: leads.filter(l => l.status === 'LOST').length, icon: Trash2, color: "text-slate-500", status: "LOST" },
  ];

  return (
    <div id={embedded ? "leads" : undefined} className={embedded ? "space-y-6" : "mx-auto min-h-screen max-w-6xl space-y-6 p-4 lg:p-8 bg-slate-50/50"}>
      {/* 1. Header card */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className={embedded ? "text-2xl font-bold tracking-tight text-slate-900" : "text-3xl font-bold tracking-tight text-slate-900"}>Leads CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage enquiries, follow-ups, and sales pipeline in one place.</p>
        </div>
        <Button onClick={exportCsv} variant="outline" className="h-10">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* 2. KPI cards row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((item) => (
          <button
            key={item.title}
            onClick={() => {
              if (item.status) updateFilter("status", item.status);
              if (item.priority) updateFilter("priority", item.priority);
              if (item.date) updateFilter("date", item.date);
            }}
            className="flex flex-col items-start p-4 bg-white rounded-2xl border shadow-sm hover:border-primary/50 hover:shadow-md transition-all text-left group"
          >
            <div className={cn("p-2 rounded-xl bg-slate-50 group-hover:bg-white transition-colors", item.color)}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.title}</p>
              <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{item.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* 3. Follow-up cards row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FollowUpCard title="Today Follow-ups" items={todayFollowUps} onOpen={openFollowUp} />
        <FollowUpCard title="Overdue Follow-ups" items={overdueFollowUps} overdue onOpen={openFollowUp} />
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <Card className="border shadow-sm rounded-2xl overflow-hidden bg-white">
          {/* 4. Filters bar (Moved Reset Filters inside) */}
          <div className="grid gap-3 p-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7 bg-slate-50/50 border-b">
            <div className="relative col-span-2 md:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 h-10 bg-white border-slate-200" placeholder="Search..." value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
            </div>
            <FilterSelect value={filters.status} onChange={(value) => updateFilter("status", value)} placeholder="Status" items={statuses.map((status) => [status, statusLabel(status)])} />
            <FilterSelect value={filters.priority} onChange={(value) => updateFilter("priority", value)} placeholder="Priority" items={priorities.map((priority) => [priority, priority])} />
            <FilterSelect value={filters.source} onChange={(value) => updateFilter("source", value)} placeholder="Source" items={sources.map((source) => [source, source])} />
            <FilterSelect value={filters.propertyId} onChange={(value) => updateFilter("propertyId", value)} placeholder="Property" items={properties.map((property) => [property.id, property.title])} />
            <FilterSelect value={filters.date} onChange={(value) => updateFilter("date", value)} placeholder="Date" items={[["today", "Today"], ["week", "7 Days"], ["month", "30 Days"]]} />
            <Button variant="ghost" size="sm" onClick={() => setFilters({
              search: "",
              status: "all",
              priority: "all",
              source: "all",
              propertyId: "all",
              date: "all",
              page: "1",
              limit: "25",
            })} className="h-10 text-xs text-muted-foreground hover:text-slate-900 border border-dashed border-slate-300 hover:border-slate-400">
              Reset Filters
            </Button>
          </div>

          {/* 5. View tabs (Now inside the card, horizontal above table) */}
          <div className="px-4 pt-4">
            <TabsList className="bg-slate-100/50 border p-1 h-11 w-full sm:w-auto">
              <TabsTrigger value="list" className="px-6 h-9 rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Lead List</TabsTrigger>
              <TabsTrigger value="pipeline" className="px-6 h-9 rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Pipeline View</TabsTrigger>
            </TabsList>
          </div>

          {/* 6. Main content area (Lead List) */}
          <TabsContent value="list" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[200px] font-bold text-slate-900">Lead</TableHead>
                    <TableHead className="font-bold text-slate-900">Contact</TableHead>
                    <TableHead className="font-bold text-slate-900">Property / Need</TableHead>
                    <TableHead className="font-bold text-slate-900 text-center">Status</TableHead>
                    <TableHead className="font-bold text-slate-900 text-center">Priority</TableHead>
                    <TableHead className="font-bold text-slate-900">Follow-up</TableHead>
                    <TableHead className="text-right font-bold text-slate-900">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-52" /></TableCell>
                      <TableCell><div className="flex justify-center"><Skeleton className="h-6 w-20" /></div></TableCell>
                      <TableCell><div className="flex justify-center"><Skeleton className="h-6 w-16" /></div></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-8 w-8" /></TableCell>
                    </TableRow>
                  )) : leads.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground bg-white">No leads found.</TableCell></TableRow>
                  ) : leads.map((lead) => (
                    <TableRow key={lead.id} className="cursor-pointer hover:bg-slate-50 transition-colors group" onClick={() => openLead(lead)}>
                      <TableCell>
                        <span className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{lead.name}</span>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">{format(new Date(lead.createdAt), "MMM dd, yyyy")}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{lead.phone}</p>
                        {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[240px] truncate text-sm font-semibold text-slate-900">{lead.property?.title || lead.preferredType || "General enquiry"}</p>
                        <p className="text-xs text-muted-foreground">{lead.source} {lead.budget ? `· ${lead.budget}` : ""}</p>
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(lead.status)}</TableCell>
                      <TableCell className="text-center">{getPriorityBadge(lead.priority)}</TableCell>
                      <TableCell>
                        {lead.followUpDate ? (
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{format(new Date(lead.followUpDate), "MMM dd, HH:mm")}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-bold">Lead Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openLead(lead)} className="cursor-pointer"><ExternalLink className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer"><a href={whatsappUrl(lead, businessName)} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp Reply</a></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteLead(lead.id)} className="text-destructive cursor-pointer font-medium"><Trash2 className="mr-2 h-4 w-4" />Delete Lead</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* 7. Pagination area */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-t">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Showing {leads.length} of {pagination.totalCount} leads</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 rounded-lg bg-white" disabled={pagination.page <= 1} onClick={() => updateFilter("page", String(pagination.page - 1))}>Previous</Button>
                <div className="flex items-center gap-1 px-2">
                   <span className="text-xs font-bold">{pagination.page}</span>
                   <span className="text-xs text-muted-foreground">/</span>
                   <span className="text-xs text-muted-foreground">{pagination.totalPages}</span>
                </div>
                <Button variant="outline" size="sm" className="h-8 rounded-lg bg-white" disabled={pagination.page >= pagination.totalPages} onClick={() => updateFilter("page", String(pagination.page + 1))}>Next</Button>
              </div>
            </div>
          </TabsContent>

          {/* 6. Main content area (Pipeline View) */}
          <TabsContent value="pipeline" className="m-0 p-4 focus-visible:outline-none focus-visible:ring-0">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {pipeline.map((column) => (
                <div key={column.status} className="flex-shrink-0 w-80 flex flex-col gap-3">
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm">
                     <h3 className="font-bold text-sm text-slate-900">{statusLabel(column.status)}</h3>
                     <Badge variant="secondary" className="bg-slate-100 text-slate-900 border-none">{column.leads.length}</Badge>
                  </div>
                  <div className="flex flex-col gap-3 min-h-[500px] bg-slate-100/30 p-2 rounded-2xl border border-slate-200">
                    {column.leads.map((lead) => (
                      <button key={lead.id} onClick={() => openLead(lead)} className="group w-full rounded-xl border bg-white p-4 text-left shadow-sm hover:border-primary/50 hover:shadow-md transition-all">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{lead.name}</p>
                        <p className="truncate text-xs text-muted-foreground mt-1">{lead.property?.title || lead.preferredLocation || lead.source}</p>
                        <div className="mt-3 flex items-center justify-between">
                          {getPriorityBadge(lead.priority)}
                          {lead.followUpDate && (
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" />
                              {format(new Date(lead.followUpDate), "MMM dd")}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                    {column.leads.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                        <Inbox className="h-8 w-8 mb-2" />
                        <p className="text-xs font-medium">Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Card>
      </Tabs>

      <Dialog open={Boolean(selectedLead)} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {selectedLead?.name}
              {selectedLead && getStatusBadge(selectedLead.status)}
              {selectedLead && getPriorityBadge(selectedLead.priority)}
            </DialogTitle>
            <DialogDescription>
              Created {selectedLead && format(new Date(selectedLead.createdAt), "PPP p")} · Updated {selectedLead && format(new Date(selectedLead.updatedAt), "PPP p")}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
                  <Info label="Phone" value={selectedLead.phone} />
                  <Info label="Email" value={selectedLead.email || "Not provided"} />
                  <Info label="Source" value={selectedLead.source} />
                  <Info label="Budget" value={selectedLead.budget || "Not provided"} />
                  <Info label="Preferred Location" value={selectedLead.preferredLocation || selectedLead.property?.location || "Not provided"} />
                  <Info label="Preferred Type" value={selectedLead.preferredType || selectedLead.property?.type || "Not provided"} />
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Message</p>
                  <div className="rounded-xl border bg-muted/20 p-4 text-sm">{selectedLead.message || "No message provided."}</div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={draft.status} onValueChange={(value) => setDraft((prev) => ({ ...prev, status: value as LeadStatus }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={draft.priority} onValueChange={(value) => setDraft((prev) => ({ ...prev, priority: value as LeadPriority }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{priorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Date</Label>
                    <Input type="datetime-local" value={draft.followUpDate} onChange={(event) => setDraft((prev) => ({ ...prev, followUpDate: event.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Internal Notes</Label>
                  <Textarea className="min-h-32" value={draft.notes} onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))} />
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Quick Contact</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full justify-start" variant="outline" asChild><a href={`tel:${selectedLead.phone}`}><Phone className="mr-2 h-4 w-4" />Call</a></Button>
                    <Button className="w-full justify-start" variant="outline" disabled={!selectedLead.email} asChild={Boolean(selectedLead.email)}>{selectedLead.email ? <a href={`mailto:${selectedLead.email}`}><Mail className="mr-2 h-4 w-4" />Email</a> : <span><Mail className="mr-2 h-4 w-4" />Email</span>}</Button>
                    <Button className="w-full justify-start bg-emerald-600 text-white hover:bg-emerald-700" asChild><a href={whatsappUrl(selectedLead, businessName)} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp Reply</a></Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Interested Property</CardTitle></CardHeader>
                  <CardContent>
                    {selectedLead.property ? (
                      <div className="space-y-2">
                        <p className="font-semibold">{selectedLead.property.title}</p>
                        <p className="text-sm text-muted-foreground">{selectedLead.property.city} · {selectedLead.property.type} · {selectedLead.property.purpose}</p>
                        <Button size="sm" variant="outline" asChild><Link href={`/properties/${selectedLead.property.slug}`} target="_blank">View property</Link></Button>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">No property attached.</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Matching Properties</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {matchingProperties.length ? matchingProperties.map((property) => (
                      <Link key={property.id} href={`/properties/${property.slug}`} target="_blank" className="block rounded-lg border p-3 hover:bg-muted">
                        <p className="truncate text-sm font-semibold">{property.title}</p>
                        <p className="text-xs text-muted-foreground">{property.city} · {property.type}</p>
                      </Link>
                    )) : <p className="text-sm text-muted-foreground">No matches in current filtered page.</p>}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLead(null)}>Cancel</Button>
            <Button onClick={updateLead} disabled={isSaving}>{isSaving ? "Saving..." : "Save Lead"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterSelect({ value, onChange, placeholder, items }: { value: string; onChange: (value: string) => void; placeholder: string; items: string[][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 bg-white border-slate-200">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-slate-200">
        <SelectItem value="all">All {placeholder}</SelectItem>
        {items.map(([itemValue, label]) => (
          <SelectItem key={itemValue} value={itemValue}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FollowUpCard({ title, items, overdue, onOpen }: { title: string; items: FollowUp[]; overdue?: boolean; onOpen: (item: FollowUp) => void }) {
  return (
    <Card className="border shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 bg-white border-b flex flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", overdue ? "bg-red-500 animate-pulse" : "bg-blue-500")} />
          {title}
        </CardTitle>
        <Badge variant="secondary" className="bg-slate-100 text-slate-900">{items.length}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[320px] overflow-y-auto divide-y">
          {items.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/30">
              <CheckCircle2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-400">All clear! No follow-ups due.</p>
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpen(item)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors group"
              >
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{item.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {item.phone}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block",
                    overdue ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {item.followUpDate ? format(new Date(item.followUpDate), "MMM dd, HH:mm") : "No date"}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground block uppercase">{statusLabel(item.status)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
