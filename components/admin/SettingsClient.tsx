"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

type SettingsData = {
  businessName: string;
  tagline: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  logoUrl: string;
  faviconUrl: string;
  primaryDomain: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
};

const initialState: SettingsData = {
  businessName: "",
  tagline: "",
  phone: "",
  whatsappNumber: "",
  email: "",
  address: "",
  city: "",
  state: "",
  country: "",
  logoUrl: "",
  faviconUrl: "",
  primaryDomain: "",
  facebookUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  defaultSeoTitle: "",
  defaultSeoDescription: "",
};

export function SettingsClient() {
  const [values, setValues] = useState<SettingsData>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) throw new Error("Unable to load settings");
        const data = await response.json();
        setValues((prev) => ({ ...prev, ...data.settings }));
      } catch (error: any) {
        toast.error(error.message || "Unable to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setValue = (key: keyof SettingsData, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to save settings");
      setValues((prev) => ({ ...prev, ...data.settings }));
      toast.success("Settings saved permanently");
    } catch (error: any) {
      toast.error(error.message || "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Website Settings</h1>
        <p className="text-muted-foreground">Update branding, contact details, social links, and SEO defaults.</p>
      </div>

      {loading ? (
        <Card><CardContent className="p-8 text-muted-foreground">Loading settings...</CardContent></Card>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Brand</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2"><Label>Business Name</Label><Input value={values.businessName} onChange={(e) => setValue("businessName", e.target.value)} required /></div>
              <div className="space-y-2"><Label>Primary Domain</Label><Input value={values.primaryDomain} onChange={(e) => setValue("primaryDomain", e.target.value)} placeholder="https://example.com" /></div>
              <div className="space-y-2"><Label>Tagline</Label><Input value={values.tagline} onChange={(e) => setValue("tagline", e.target.value)} /></div>
              <div className="space-y-2"><Label>Logo URL</Label><Input value={values.logoUrl} onChange={(e) => setValue("logoUrl", e.target.value)} placeholder="https://..." /></div>
              <div className="space-y-2"><Label>Favicon URL</Label><Input value={values.faviconUrl} onChange={(e) => setValue("faviconUrl", e.target.value)} placeholder="https://..." /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2"><Label>Phone</Label><Input value={values.phone} onChange={(e) => setValue("phone", e.target.value)} /></div>
              <div className="space-y-2"><Label>WhatsApp Number</Label><Input value={values.whatsappNumber} onChange={(e) => setValue("whatsappNumber", e.target.value)} placeholder="Country code + number" /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={values.email} onChange={(e) => setValue("email", e.target.value)} /></div>
              <div className="space-y-2"><Label>Country</Label><Input value={values.country} onChange={(e) => setValue("country", e.target.value)} /></div>
              <div className="space-y-2"><Label>City</Label><Input value={values.city} onChange={(e) => setValue("city", e.target.value)} /></div>
              <div className="space-y-2"><Label>State</Label><Input value={values.state} onChange={(e) => setValue("state", e.target.value)} /></div>
              <div className="space-y-2 md:col-span-3"><Label>Address</Label><Input value={values.address} onChange={(e) => setValue("address", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2"><Label>Facebook</Label><Input value={values.facebookUrl} onChange={(e) => setValue("facebookUrl", e.target.value)} /></div>
              <div className="space-y-2"><Label>Twitter / X</Label><Input value={values.twitterUrl} onChange={(e) => setValue("twitterUrl", e.target.value)} /></div>
              <div className="space-y-2"><Label>Instagram</Label><Input value={values.instagramUrl} onChange={(e) => setValue("instagramUrl", e.target.value)} /></div>
              <div className="space-y-2"><Label>LinkedIn</Label><Input value={values.linkedinUrl} onChange={(e) => setValue("linkedinUrl", e.target.value)} /></div>
              <div className="space-y-2 md:col-span-2"><Label>YouTube</Label><Input value={values.youtubeUrl} onChange={(e) => setValue("youtubeUrl", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>SEO Defaults</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Default SEO Title</Label><Input value={values.defaultSeoTitle} onChange={(e) => setValue("defaultSeoTitle", e.target.value)} /></div>
              <div className="space-y-2"><Label>Default SEO Description</Label><Textarea value={values.defaultSeoDescription} onChange={(e) => setValue("defaultSeoDescription", e.target.value)} /></div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
