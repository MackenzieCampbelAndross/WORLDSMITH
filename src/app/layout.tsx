import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1f5e44",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "WorldSmith",
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
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${manrope.variable} ${instrumentSerif.variable} h-full`}
    >
      <body className="min-h-full bg-[#1f5e44] text-[#f0f1e6] antialiased selection:bg-[#a8cebc] selection:text-[#171713] overflow-x-clip font-manrope">
        {children}
      </body>
    </html>
  );
}
