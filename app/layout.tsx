import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { sitePublicOrigin } from "@/lib/site-public";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = sitePublicOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Prezident maktabi — tayyorgarlik test platformasi",
  description:
    "Onlayn testlar, mock imtihonlar, reyting va ota-ona monitoringi orqali Prezident maktabi kirish imtihonlariga tayyorgarlik.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#e0f2fe",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-clip font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
