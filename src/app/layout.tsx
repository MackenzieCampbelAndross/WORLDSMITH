import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1f5e44",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Worldsmith — Digital Worlds for Real Estate",
  description:
    "We transform architectural plans, renders and project assets into interactive places buyers can explore before they visit.",
  keywords: [
    "Worldsmith",
    "Digital Worlds",
    "Architectural Visualization",
    "Real Estate Technology",
    "Interactive Property Experiences",
  ],
  openGraph: {
    title: "Worldsmith — A world before it's built.",
    description:
      "We transform architectural plans, renders and project assets into interactive places buyers can explore before they visit.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakartaSans.variable} ${cormorant.variable} h-full`}>
      <body className="min-h-full bg-[#1f5e44] text-[#f0f1e6] antialiased selection:bg-[#a8cebc] selection:text-[#171713] overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
