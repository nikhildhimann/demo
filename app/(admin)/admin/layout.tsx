"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  PlusSquare,
  Inbox,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Globe,
  Search,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/properties/new", label: "Add Property", icon: PlusSquare },
  { href: "/admin/enquiries", label: "Leads", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const handleLogout = async () => {
    setIsLogoutOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  const activeHref =
    sidebarLinks
      .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "";

  const SidebarContent = () => (
    <div className="flex h-full flex-col py-6">
      <div className="mb-10 flex items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">Admin Portal</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {sidebarLinks.map((link) => {
          const isActive = activeHref === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-slate-950 text-white shadow-md dark:bg-white dark:text-slate-950"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
            >
              <link.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-white dark:text-slate-950" : "text-slate-500 group-hover:text-slate-950 dark:text-slate-300 dark:group-hover:text-white"
                )}
              />
              {link.label}
              {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white shadow-[4px_0_24px_-12px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-950 lg:flex">
          <SidebarContent />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 text-slate-950 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 dark:text-white md:px-6">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <div className="relative hidden w-72 md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
                <Input placeholder="Search..." className="pl-9" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/" target="_blank" rel="noreferrer">
                  <Globe className="mr-2 h-4 w-4" />
                  View Website
                </a>
              </Button>
              <Button variant="outline" size="sm" className="hidden md:inline-flex">
                <UserRound className="mr-2 h-4 w-4" />
                Admin Profile
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setIsLogoutOpen(true)}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>

          <main className="flex-1 lg:p-4">
            <div className="min-h-full overflow-hidden bg-white pb-10 text-slate-950 dark:bg-slate-950 dark:text-white lg:rounded-[32px] lg:border lg:border-slate-200 lg:shadow-xl lg:shadow-slate-200/50 dark:lg:border-slate-800 dark:lg:shadow-none">
              {children}
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to sign in again to access admin panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Yes, Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
