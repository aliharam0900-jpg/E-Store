import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GlobalLayoutWrapper } from "@/components/layout/global-layout-wrapper";
import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";
import { AiChatWidget } from "@/components/ui/AiChatWidget";
import { getStoreSettings } from "@/lib/services/settings";
import "./globals.css";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: `${settings.store_name} // Enterprise Storefront`,
    description:
      settings.hero_subtext ||
      "High-performance apparel and industrial objects architecture",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getStoreSettings();
  const primaryColor = settings.primary_color_hex || "#000000";

  // Compute accessible foreground color for buttons with primary background
  const getContrastForeground = (hex: string): string => {
    try {
      const clean = hex.replace("#", "");
      if (clean.length !== 6 && clean.length !== 3) return "#FAFAFA";
      const r = parseInt(clean.length === 3 ? clean[0] + clean[0] : clean.substring(0, 2), 16);
      const g = parseInt(clean.length === 3 ? clean[1] + clean[1] : clean.substring(2, 4), 16);
      const b = parseInt(clean.length === 3 ? clean[2] + clean[2] : clean.substring(4, 6), 16);
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return yiq >= 128 ? "#09090B" : "#FAFAFA";
    } catch {
      return "#FAFAFA";
    }
  };
  const primaryForeground = getContrastForeground(primaryColor);

  console.log("FETCHED STORE SETTINGS:", settings);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
      style={
        {
          "--primary": primaryColor,
          "--primary-foreground": primaryForeground,
        } as React.CSSProperties
      }
    >
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root { --primary: ${primaryColor}; --primary-foreground: ${primaryForeground}; }`,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col font-sans overflow-x-hidden"
        suppressHydrationWarning
        style={
          {
            "--primary": primaryColor,
            "--primary-foreground": primaryForeground,
          } as React.CSSProperties
        }
      >
        <GlobalLayoutWrapper>
          <Navbar settings={settings} />
          <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto">{children}</div>
          <Footer settings={settings} />
          <AiChatWidget />
        </GlobalLayoutWrapper>
      </body>
    </html>
  );
}
