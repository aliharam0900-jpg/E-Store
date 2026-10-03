"use client";

import * as React from "react";
import {
  Settings,
  Shield,
  Database,
  Cpu,
  CheckCircle,
  Save,
  Upload,
  RefreshCw,
  Sparkles,
  Palette,
  Type,
  ImageIcon,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getStoreSettings,
  uploadStoreLogo,
  DEFAULT_STORE_SETTINGS,
} from "@/lib/services/settings";
import { updateSettingsAction } from "@/app/actions/settings";
import { toast } from "sonner";
import type { StoreSettings } from "@/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getStoreSettings();
        setSettings(data);
      } catch (err) {
        console.error("Failed to load store settings", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleFieldChange = (field: keyof StoreSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const uploadedUrl = await uploadStoreLogo(file);
      setSettings((prev) => ({ ...prev, logo_url: uploadedUrl }));
      setMessage({ text: "Logo uploaded successfully. Click Save to persist.", type: "success" });
    } catch {
      setMessage({ text: "Failed to upload logo image.", type: "error" });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await updateSettingsAction({
        store_name: settings.store_name,
        logo_url: settings.logo_url,
        hero_headline: settings.hero_headline,
        hero_subtext: settings.hero_subtext,
        footer_text: settings.footer_text,
        primary_color_hex: settings.primary_color_hex,
      });

      if (res.success && res.settings) {
        setSettings(res.settings);
        toast.success("Global store settings saved and storefront cache revalidated.");
        setMessage({
          text: "Global store settings saved and storefront cache revalidated.",
          type: "success",
        });
      } else {
        toast.error(res.error || "Permission Denied");
        setMessage({
          text: res.error || "Failed to update store settings.",
          type: "error",
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Permission Denied";
      toast.error(errMsg);
      setMessage({
        text: "An unexpected error occurred while saving settings.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings({ ...DEFAULT_STORE_SETTINGS });
    setMessage({
      text: "Reset to default configuration. Click Save to apply.",
      type: "success",
    });
  };

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5" /> Global Store Settings & CMS
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure dynamic brand identity, typography, hero merchandising, and live primary color tokens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            disabled={isSaving || isLoading}
            className="text-xs h-8"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Reset Defaults
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving || isLoading}
            className="text-xs h-8 bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status banner */}
      {message && (
        <div
          role="status"
          className={`p-3.5 rounded-md text-xs flex items-center justify-between border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main CMS Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Brand & Theme Identity */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Brand & Storefront Identity
                </CardTitle>
                <CardDescription className="text-xs">
                  Controls the browser tab title, navbar branding, and the global CSS theme variable (--primary).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="store_name" className="text-xs font-medium">
                      Store Brand Name
                    </Label>
                    <Input
                      id="store_name"
                      value={settings.store_name}
                      onChange={(e) => handleFieldChange("store_name", e.target.value)}
                      placeholder="e.g. ATELIER"
                      className="text-xs h-9 font-semibold"
                      disabled={isLoading || isSaving}
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Applied to document metadata title and navigation header.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="primary_color_hex" className="text-xs font-medium">
                      Primary Theme Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="primary_color_picker"
                        value={settings.primary_color_hex || "#000000"}
                        onChange={(e) => handleFieldChange("primary_color_hex", e.target.value)}
                        className="h-9 w-10 rounded border border-border p-0.5 cursor-pointer bg-transparent"
                        disabled={isLoading || isSaving}
                      />
                      <Input
                        id="primary_color_hex"
                        value={settings.primary_color_hex}
                        onChange={(e) => handleFieldChange("primary_color_hex", e.target.value)}
                        placeholder="#000000"
                        className="text-xs h-9 font-mono uppercase"
                        disabled={isLoading || isSaving}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Overrides the <code className="text-foreground font-mono">--primary</code> variable on the storefront.
                    </p>
                  </div>
                </div>

                {/* Logo Upload & Preview */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" /> Brand Logo (Supabase Storage)
                  </Label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-md border border-border bg-muted/20">
                    <div className="h-12 w-32 border border-dashed border-border rounded flex items-center justify-center bg-background overflow-hidden relative">
                      {settings.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={settings.logo_url}
                          alt="Store Logo Preview"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-[11px] font-bold tracking-widest text-muted-foreground font-mono">
                          {settings.store_name || "NO LOGO"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="logo-file-input"
                          className="cursor-pointer inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 transition-colors"
                        >
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                        </label>
                        <input
                          id="logo-file-input"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={isLoading || isSaving || isUploadingLogo}
                        />
                        {settings.logo_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleFieldChange("logo_url", "")}
                          >
                            Remove Logo
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        SVG, PNG, or WebP recommended. Transparent background supported.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hero & Merchandising Copy */}
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Type className="h-4 w-4" /> Hero Banner & Copywriting
                </CardTitle>
                <CardDescription className="text-xs">
                  Merchandising text displayed on the main landing page alongside the 3D canvas.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hero_headline" className="text-xs font-medium">
                    Hero Headline
                  </Label>
                  <Input
                    id="hero_headline"
                    value={settings.hero_headline}
                    onChange={(e) => handleFieldChange("hero_headline", e.target.value)}
                    placeholder="e.g. THE MINIMALIST COLLECTION"
                    className="text-xs h-9 uppercase tracking-wider font-semibold"
                    disabled={isLoading || isSaving}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hero_subtext" className="text-xs font-medium">
                    Hero Subtext (Value Proposition)
                  </Label>
                  <textarea
                    id="hero_subtext"
                    value={settings.hero_subtext}
                    onChange={(e) => handleFieldChange("hero_subtext", e.target.value)}
                    rows={3}
                    placeholder="Enter hero descriptive copy..."
                    className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    disabled={isLoading || isSaving}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="footer_text" className="text-xs font-medium">
                    Global Footer Copyright & Tagline
                  </Label>
                  <Input
                    id="footer_text"
                    value={settings.footer_text}
                    onChange={(e) => handleFieldChange("footer_text", e.target.value)}
                    placeholder="© 2026 ATELIER INC. ALL RIGHTS RESERVED."
                    className="text-xs h-9"
                    disabled={isLoading || isSaving}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Storefront Preview Column */}
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader className="pb-3 border-b border-border bg-muted/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Live Preview
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase">
                    CMS Mockup
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Real-time preview of brand configuration.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Navbar Preview */}
                <div className="p-3 rounded border border-border bg-background flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.logo_url}
                        alt="Logo Preview"
                        className="h-5 w-auto object-contain"
                      />
                    ) : (
                      <span className="font-mono text-xs font-bold tracking-widest text-foreground">
                        {settings.store_name || "ATELIER"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: settings.primary_color_hex || "#000000" }}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {settings.primary_color_hex || "#000000"}
                    </span>
                  </div>
                </div>

                {/* Hero Preview Box */}
                <div className="p-4 rounded border border-border bg-muted/20 space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                    HERO MERCHANDISING
                  </span>
                  <h3 className="text-sm font-extrabold tracking-tight uppercase text-foreground leading-snug">
                    {settings.hero_headline || "THE MINIMALIST COLLECTION"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                    {settings.hero_subtext || "Engineered silhouettes crafted with architectural precision."}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-[11px] font-medium rounded text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: settings.primary_color_hex || "#000000" }}
                    >
                      Shop Collection
                    </button>
                  </div>
                </div>

                {/* Footer Preview */}
                <div className="p-2.5 rounded border border-border bg-background text-[10px] text-muted-foreground font-mono text-center">
                  {settings.footer_text || "© 2026 ATELIER INC."}
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-3">
                <Button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="w-full text-xs h-9 bg-foreground text-background font-medium hover:bg-foreground/90"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {isSaving ? "Persisting Settings..." : "Publish Brand Changes"}
                </Button>
              </CardFooter>
            </Card>

            {/* System Status Summary */}
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" /> Infrastructure Health
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>store_settings Table</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> ACTIVE
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Edge Cache Revalidation</span>
                  <span className="text-foreground">ON UPDATE</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>RBAC Guard</span>
                  <span className="text-emerald-500 font-semibold">ENFORCED</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
