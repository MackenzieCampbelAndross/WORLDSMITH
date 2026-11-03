import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/components/auth-provider";
import { AuthExperience } from "@/components/AuthExperience";
import "./globals.css";

const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin.woff2",
  variable: "--font-space-grotesk",
  weight: "300 700",
  display: "swap",
});

const manrope = localFont({
  src: "./fonts/manrope-latin.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

const instrumentSerif = localFont({
  src: [
    { path: "./fonts/instrument-serif-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-italic-latin.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});

const anton = localFont({
  src: "./fonts/anton-latin.woff2",
  variable: "--font-anton",
  weight: "400",
  display: "swap",
});

const cormorantGaramond = localFont({
  src: "./fonts/cormorant-garamond-latin.woff2",
  variable: "--font-cormorant-garamond",
  weight: "300 700",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1f5e44",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Crestion Labs",
  description:
    "We transform architectural plans, renders and project assets into interactive places buyers can explore before they visit.",
  keywords: [
    "Crestion Labs",
    "Digital Worlds",
    "Architectural Visualization",
    "Real Estate Technology",
    "Interactive Property Experiences",
  ],
  openGraph: {
    title: "Crestion Labs — A world before it's built.",
    description:
      "We transform architectural plans, renders and project assets into interactive places buyers can explore before they visit.",
    type: "website",
  },
  verification: {
    google: "8QmS7pLEWDH9PJ3w_SiWpci2G5-wtYO6bMrgRs2--tY",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${manrope.variable} ${instrumentSerif.variable} ${anton.variable} ${cormorantGaramond.variable} h-full`}
    >
      <body className="min-h-full bg-[#1f5e44] text-[#f0f1e6] antialiased selection:bg-[#a8cebc] selection:text-[#171713] overflow-x-clip font-manrope">
        <AuthProvider>
          {children}
          <AuthExperience />
        </AuthProvider>
      </body>
    </html>
  );
}
