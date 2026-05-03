"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreHorizontal, 
  ExternalLink, 
  Trash2, 
  Phone, 
  Mail, 
  Download,
  Search,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Inbox
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  status: "NEW" | "CONTACTED" | "CLOSED";
  source: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    title: string;
    slug: string;
  } | null;
}

export function EnquiriesClient() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await fetch("/api/admin/enquiries");
      const data = await resp.json();
      setEnquiries(data.enquiries);
      
      const now = new Date();
      const startOfDay = new Date(now.setHours(0,0,0,0)).getTime();
      const lastWeek = new Date(now.setDate(now.getDate() - 7)).getTime();
      
      const todayCount = data.enquiries.filter((e: Enquiry) => new Date(e.createdAt).getTime() > startOfDay).length;
      const weekCount = data.enquiries.filter((e: Enquiry) => new Date(e.createdAt).getTime() > lastWeek).length;
      
      setStats({
        today: todayCount,
        week: weekCount,
        month: data.totalCount, 
        total: data.totalCount
      });
    } catch {
      toast.error("Failed to load enquiries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleUpdateStatus = async (id: string, status: string, notes?: string) => {
    setIsSaving(true);
    try {
      const resp = await fetch(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });

      if (resp.ok) {
        toast.success(`Lead marked as ${status}`);
        fetchEnquiries();
        setIsDetailOpen(false);
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    
    try {
      const resp = await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
      if (resp.ok) {
        toast.success("Lead removed");
        fetchEnquiries();
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Name", "Email", "Phone", "Property", "Status", "Message"];
    const rows = filteredEnquiries.map(e => [
      format(new Date(e.createdAt), "yyyy-MM-dd HH:mm"),
      e.name,
      e.email,
      e.phone,
      e.property?.title || "General enquiry",
      e.status,
      e.message?.replace(/,/g, " ") || ""
    ]);
    
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const filteredEnquiries = enquiries.filter(e => {
    const query = searchQuery.toLowerCase();
    const matchesStatus = filterStatus === "all" || e.status === filterStatus;
    const matchesSearch = (e.name || "").toLowerCase().includes(query) || 
                          (e.property?.title || "General enquiry").toLowerCase().includes(query) ||
                          (e.email || "").toLowerCase().includes(query) ||
                          (e.phone || "").toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW": return <Badge className="bg-yellow-500 hover:bg-yellow-600">New</Badge>;
      case "CONTACTED": return <Badge className="bg-blue-500 hover:bg-blue-600">Contacted</Badge>;
      case "CLOSED": return <Badge className="bg-gray-500 hover:bg-gray-600">Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Leads Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage property enquiries and leads.</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "New Leads (Today)", val: stats.today, icon: Inbox, color: "text-yellow-500" },
          { title: "This Week", val: stats.week, icon: TrendingUp, color: "text-blue-500" },
          { title: "This Month", val: stats.month, icon: Clock3, color: "text-purple-500" },
          { title: "Total Portfolio", val: stats.total, icon: CheckCircle2, color: "text-green-500" },
        ].map((s, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{s.title}</p>
                  <p className="text-2xl font-bold mt-1">{s.val}</p>
                </div>
                <div className={`p-2 rounded-full bg-muted`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search leads..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="CONTACTED">Contacted</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="w-[120px] py-4">Received</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Enquirer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredEnquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  No enquiries matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredEnquiries.map((enquiry) => (
                <TableRow key={enquiry.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {format(new Date(enquiry.createdAt), "MMM dd, HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm tracking-tight">{enquiry.property?.title || "General enquiry"}</div>
                    {enquiry.property && (
                      <Link 
                        href={`/properties/${enquiry.property.slug}`} 
                        className="text-[10px] uppercase font-bold text-primary hover:underline flex items-center mt-0.5"
                        target="_blank"
                      >
                        View Property <ExternalLink className="h-2 w-2 ml-1" />
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">{enquiry.name}</TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      {enquiry.email && <div className="flex items-center text-muted-foreground tracking-tight underline cursor-pointer"><Mail className="h-3 w-3 mr-1" /> {enquiry.email}</div>}
                      <div className="flex items-center text-muted-foreground font-medium"><Phone className="h-3 w-3 mr-1" /> {enquiry.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(enquiry.status)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Lead Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setSelectedEnquiry(enquiry);
                          setAdminNotes(enquiry.notes || "");
                          setIsDetailOpen(true);
                        }}>
                          <ExternalLink className="mr-2 h-4 w-4" /> View full details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUpdateStatus(enquiry.id, "NEW")}>
                          <Inbox className="mr-2 h-4 w-4 text-yellow-500" /> Mark as New
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(enquiry.id, "CONTACTED")}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" /> Mark as Contacted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(enquiry.id, "CLOSED")}>
                          <Clock3 className="mr-2 h-4 w-4 text-gray-500" /> Close lead
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive/5"
                          onClick={() => handleDelete(enquiry.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete lead record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              Lead: {selectedEnquiry?.name}
              {selectedEnquiry && getStatusBadge(selectedEnquiry.status)}
            </DialogTitle>
            <DialogDescription>
              Received {selectedEnquiry && format(new Date(selectedEnquiry.createdAt), "PPP p")}
            </DialogDescription>
          </DialogHeader>

          {selectedEnquiry && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6 bg-muted p-4 rounded-xl border">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Traffic Source</p>
                  <p className="text-xs font-medium truncate">{selectedEnquiry.source}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Property Interest</p>
                  <p className="text-sm font-bold truncate text-primary">{selectedEnquiry.property?.title || "General enquiry"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase text-muted-foreground">Initial Message</p>
                <div className="p-4 bg-muted/30 rounded-xl text-sm italic border border-dashed border-muted-foreground/30">
                  &quot;{selectedEnquiry.message || "No specific message provided."}&quot;
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Internal Notes (Private)</p>
                </div>
                <Textarea 
                  placeholder="Keep track of your conversations, follow-up dates, or client specific requirements..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-[120px] rounded-xl border-muted bg-muted/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Current Status</p>
                  <Select 
                    value={selectedEnquiry.status} 
                    onValueChange={(val) => setSelectedEnquiry({...selectedEnquiry, status: val as Enquiry["status"]})}
                  >
                    <SelectTrigger className="rounded-xl border-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New Lead</SelectItem>
                      <SelectItem value="CONTACTED">Initiated (Contacted)</SelectItem>
                      <SelectItem value="CLOSED">Closed / Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Quick Contact</p>
                   <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl h-10 border-blue-500/20 hover:bg-blue-500/10"
                      onClick={() => window.location.href = `tel:${selectedEnquiry.phone}`}
                    >
                      <Phone className="h-3 w-3 mr-2" /> Call
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl h-10 border-red-500/20 hover:bg-red-500/10"
                      disabled={!selectedEnquiry.email}
                      onClick={() => selectedEnquiry.email && (window.location.href = `mailto:${selectedEnquiry.email}`)}
                    >
                      <Mail className="h-3 w-3 mr-2" /> Email
                    </Button>
                   </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDetailOpen(false)} className="rounded-xl">Cancel</Button>
            <Button 
              disabled={isSaving} 
              onClick={() => selectedEnquiry && handleUpdateStatus(selectedEnquiry.id, selectedEnquiry.status, adminNotes)}
              className="rounded-xl px-8"
            >
              {isSaving ? "Updating Lead..." : "Save Status & Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
