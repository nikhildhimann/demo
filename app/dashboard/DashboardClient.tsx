"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Heart, MessageSquare, LogOut } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DashboardClient({ user, initialEnquiries }: { user: any, initialEnquiries: any[] }) {
  const [activeTab, setActiveTab] = useState<"wishlist" | "enquiries">("wishlist");
  const { wishlist, toggleWishlist, isLoaded } = useWishlist();

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 font-sans">
      <div className="container max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col items-center justify-between rounded-3xl bg-[#070B1A] p-8 text-white shadow-xl md:flex-row md:p-12">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-300/50 bg-white/10 text-3xl font-bold text-amber-200">
              {user.name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Welcome back, {user.name || "User"}!</h1>
              <p className="font-medium text-slate-300">{user.email}</p>
            </div>
          </div>
          <div className="mt-6 md:mt-0 flex gap-4">
            <Button variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Dashboard Navigation */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-none">
          <button 
            onClick={() => setActiveTab("wishlist")}
            className={`flex items-center px-6 py-3 rounded-full font-semibold transition-all ${
              activeTab === "wishlist" 
              ? "bg-primary text-white shadow-md" 
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Heart className="w-5 h-5 mr-2" /> Saved Properties
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === "wishlist" ? "bg-white/20" : "bg-slate-200 text-slate-700"}`}>
              {isLoaded ? wishlist.length : 0}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab("enquiries")}
            className={`flex items-center px-6 py-3 rounded-full font-semibold transition-all ${
              activeTab === "enquiries" 
              ? "bg-primary text-white shadow-md" 
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <MessageSquare className="w-5 h-5 mr-2" /> My Enquiries
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === "enquiries" ? "bg-white/20" : "bg-slate-200 text-slate-700"}`}>
              {initialEnquiries.length}
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div>
          {activeTab === "wishlist" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Wishlist</h2>
              
              {!isLoaded ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : wishlist.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Your wishlist is empty</h3>
                  <p className="mx-auto mb-6 max-w-md text-slate-600">You haven't saved any properties yet. Start exploring and click the heart icon to save your favorites.</p>
                  <Button asChild className="rounded-full px-8">
                    <Link href="/properties">Explore Properties</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {wishlist.map((item) => (
                    <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200">
                      <div className="relative h-48 w-full">
                        <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        <button 
                          onClick={() => toggleWishlist(item)}
                          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md hover:bg-rose-50 rounded-full text-rose-500 transition-colors shadow-sm"
                        >
                          <Heart className="w-5 h-5 fill-rose-500" />
                        </button>
                      </div>
                      <div className="p-5">
                        <Link href={`/properties/${item.slug}`} className="hover:text-primary transition-colors">
                          <h3 className="font-bold text-lg line-clamp-1 mb-1">{item.title}</h3>
                        </Link>
                        <p className="mb-3 line-clamp-1 text-sm text-slate-600">{item.address}</p>
                        <div className="flex justify-between items-center text-primary font-bold">
                          ${item.price.toLocaleString()}
                          <Button size="sm" variant="outline" asChild className="h-8">
                            <Link href={`/properties/${item.slug}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "enquiries" && (
            <div className="space-y-6">
               <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Enquiries</h2>
               
               {initialEnquiries.length === 0 ? (
                 <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <MessageSquare className="w-10 h-10 text-slate-300" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-800 mb-2">No enquiries found</h3>
                   <p className="mx-auto mb-6 max-w-md text-slate-600">You haven't contacted any agents about our properties yet.</p>
                   <Button asChild className="rounded-full px-8">
                     <Link href="/properties">Find a Property</Link>
                   </Button>
                 </div>
               ) : (
                 <div className="grid gap-6">
                   {initialEnquiries.map((enquiry) => (
                     <div key={enquiry.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row gap-6 items-start">
                       {enquiry.property && (
                         <div className="relative w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0">
                           <Image 
                             src={enquiry.property.images?.[0]?.url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400"} 
                             alt={enquiry.property.title} 
                             fill 
                             className="object-cover" 
                           />
                         </div>
                       )}
                       <div className="flex-1 space-y-3">
                         <div className="flex justify-between items-start">
                           <div>
                             <h3 className="font-bold text-xl">{enquiry.property?.title || "Property Listing"}</h3>
                             <p className="text-sm text-slate-600">Sent on {new Date(enquiry.createdAt).toLocaleDateString()}</p>
                           </div>
                           <Badge variant={enquiry.status === "NEW" ? "default" : enquiry.status === "CONTACTED" ? "secondary" : "outline"} className="capitalize">
                             {enquiry.status.toLowerCase()}
                           </Badge>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-600 text-sm">
                           "{enquiry.message || "I am interested in this property and would like to know more details."}"
                         </div>
                         {enquiry.property && (
                           <Button variant="link" asChild className="p-0 h-auto text-primary">
                             <Link href={`/properties/${enquiry.property.slug}`}>View Property Listing &rarr;</Link>
                           </Button>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
