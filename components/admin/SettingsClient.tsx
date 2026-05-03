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
  brandName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  heroTitle: string;
  heroSubtitle: string;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
};

const initialState: SettingsData = {
  brandName: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  heroTitle: "",
  heroSubtitle: "",
  facebook: "",
  twitter: "",
  instagram: "",
  linkedin: "",
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
        setValues(data.settings);
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
      toast.success("Settings updated successfully");
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
        <p className="text-muted-foreground">Update key branding and contact details for your website.</p>
      </div>

      {loading ? (
        <Card><CardContent className="p-8 text-muted-foreground">Loading settings...</CardContent></Card>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Brand & Contact</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Brand Name</Label><Input value={values.brandName} onChange={(e) => setValue("brandName", e.target.value)} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={values.phone} onChange={(e) => setValue("phone", e.target.value)} /></div>
              <div className="space-y-2"><Label>WhatsApp</Label><Input value={values.whatsapp} onChange={(e) => setValue("whatsapp", e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={values.email} onChange={(e) => setValue("email", e.target.value)} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Address</Label><Input value={values.address} onChange={(e) => setValue("address", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Homepage Content</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Hero Title</Label><Input value={values.heroTitle} onChange={(e) => setValue("heroTitle", e.target.value)} /></div>
              <div className="space-y-2"><Label>Hero Subtitle</Label><Textarea value={values.heroSubtitle} onChange={(e) => setValue("heroSubtitle", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Facebook</Label><Input value={values.facebook} onChange={(e) => setValue("facebook", e.target.value)} /></div>
              <div className="space-y-2"><Label>Twitter</Label><Input value={values.twitter} onChange={(e) => setValue("twitter", e.target.value)} /></div>
              <div className="space-y-2"><Label>Instagram</Label><Input value={values.instagram} onChange={(e) => setValue("instagram", e.target.value)} /></div>
              <div className="space-y-2"><Label>LinkedIn</Label><Input value={values.linkedin} onChange={(e) => setValue("linkedin", e.target.value)} /></div>
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
