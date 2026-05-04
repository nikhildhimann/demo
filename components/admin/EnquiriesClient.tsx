"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
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
    { title: "Total Leads", value: stats.total, icon: Target, color: "text-slate-700" },
    { title: "New Leads", value: stats.new, icon: Inbox, color: "text-yellow-600" },
    { title: "Hot Leads", value: stats.hot, icon: Flame, color: "text-red-600" },
    { title: "Follow-ups Due", value: stats.followUpsDue, icon: CalendarClock, color: "text-blue-600" },
    { title: "Converted", value: stats.converted, icon: CheckCircle2, color: "text-green-600" },
  ];

  return (
    <div id={embedded ? "leads" : undefined} className={embedded ? "space-y-6" : "mx-auto min-h-screen max-w-7xl space-y-8 p-8"}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className={embedded ? "text-2xl font-bold tracking-tight" : "text-3xl font-bold tracking-tight"}>Mini CRM</h1>
          <p className="text-muted-foreground">Manage enquiries, follow-ups, lead priority, and pipeline movement.</p>
        </div>
        <Button onClick={exportCsv} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {statCards.map((item) => (
          <Card key={item.title}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">{item.title}</p>
                <p className="mt-1 text-3xl font-bold">{item.value}</p>
              </div>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FollowUpCard title="Today Follow-ups" items={todayFollowUps} onOpen={openFollowUp} />
        <FollowUpCard title="Overdue Follow-ups" items={overdueFollowUps} overdue onOpen={openFollowUp} />
      </div>

      <Tabs defaultValue="list" className="space-y-5">
        <TabsList>
          <TabsTrigger value="list">Lead List</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-5">
          <Card>
            <CardContent className="grid gap-3 p-4 md:grid-cols-[1.5fr_repeat(5,1fr)]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search name, phone, email..." value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
              </div>
              <FilterSelect value={filters.status} onChange={(value) => updateFilter("status", value)} placeholder="Status" items={statuses.map((status) => [status, statusLabel(status)])} />
              <FilterSelect value={filters.priority} onChange={(value) => updateFilter("priority", value)} placeholder="Priority" items={priorities.map((priority) => [priority, priority])} />
              <FilterSelect value={filters.source} onChange={(value) => updateFilter("source", value)} placeholder="Source" items={sources.map((source) => [source, source])} />
              <FilterSelect value={filters.propertyId} onChange={(value) => updateFilter("propertyId", value)} placeholder="Property" items={properties.map((property) => [property.id, property.title])} />
              <FilterSelect value={filters.date} onChange={(value) => updateFilter("date", value)} placeholder="Date" items={[["today", "Today"], ["week", "7 Days"], ["month", "30 Days"]]} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Property / Need</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-52" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-8 w-8" /></TableCell>
                  </TableRow>
                )) : leads.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No leads match these filters.</TableCell></TableRow>
                ) : leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <button className="text-left font-semibold hover:underline" onClick={() => openLead(lead)}>{lead.name}</button>
                      <p className="text-xs text-muted-foreground">{format(new Date(lead.createdAt), "MMM dd, yyyy HH:mm")}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{lead.phone}</p>
                      {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[240px] truncate text-sm font-medium">{lead.property?.title || lead.preferredType || "General enquiry"}</p>
                      <p className="text-xs text-muted-foreground">{lead.source} {lead.budget ? `· ${lead.budget}` : ""}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>{getPriorityBadge(lead.priority)}</TableCell>
                    <TableCell className="text-sm">{lead.followUpDate ? format(new Date(lead.followUpDate), "MMM dd, HH:mm") : "Not set"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Lead Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openLead(lead)}><ExternalLink className="mr-2 h-4 w-4" />Open lead</DropdownMenuItem>
                          <DropdownMenuItem asChild><a href={whatsappUrl(lead, businessName)} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp reply</a></DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteLead(lead.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages} · {pagination.totalCount} leads</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={pagination.page <= 1} onClick={() => updateFilter("page", String(pagination.page - 1))}>Previous</Button>
              <Button variant="outline" disabled={pagination.page >= pagination.totalPages} onClick={() => updateFilter("page", String(pagination.page + 1))}>Next</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pipeline">
          <div className="grid gap-4 xl:grid-cols-7">
            {pipeline.map((column) => (
              <Card key={column.status} className="min-h-72">
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center justify-between text-sm">
                    {statusLabel(column.status)}
                    <Badge variant="outline">{column.leads.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                  {column.leads.map((lead) => (
                    <button key={lead.id} onClick={() => openLead(lead)} className="w-full rounded-lg border bg-white p-3 text-left shadow-sm hover:bg-muted">
                      <p className="truncate text-sm font-semibold">{lead.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{lead.property?.title || lead.preferredLocation || lead.source}</p>
                      <div className="mt-2 flex items-center justify-between">{getPriorityBadge(lead.priority)}<span className="text-xs text-muted-foreground">{lead.followUpDate ? format(new Date(lead.followUpDate), "MMM dd") : ""}</span></div>
                    </button>
                  ))}
                  {column.leads.length === 0 && <p className="text-sm text-muted-foreground">No leads</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
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
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {placeholder}</SelectItem>
        {items.map(([itemValue, label]) => <SelectItem key={itemValue} value={itemValue}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function FollowUpCard({ title, items, overdue, onOpen }: { title: string; items: FollowUp[]; overdue?: boolean; onOpen: (item: FollowUp) => void }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Nothing due.</p> : items.map((item) => (
          <button key={item.id} onClick={() => onOpen(item)} className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted">
            <div>
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.phone}</p>
            </div>
            <div className="text-right">
              <p className={overdue ? "text-xs font-semibold text-red-600" : "text-xs font-semibold text-blue-600"}>
                {item.followUpDate ? format(new Date(item.followUpDate), "MMM dd, HH:mm") : "No date"}
              </p>
              <p className="text-xs text-muted-foreground">{statusLabel(item.status)}</p>
            </div>
          </button>
        ))}
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
