import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import IntroOverlay from "@/components/intro/IntroOverlay";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const heading = Space_Grotesk({ variable: "--font-heading", subsets: ["latin"] });
const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Portfolio of Andrew Michael Coggins: Computer & Electrical Engineering at Texas A&M, building at the intersection of embedded hardware and agentic AI.",
};

export const viewport: Viewport = {
  themeColor: "#0a0b0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} ${mono.variable} antialiased`}>
      <body className="flex min-h-screen flex-col">
        <Script id="intro-flag" strategy="beforeInteractive">
          {`try{if(localStorage.getItem('amc-intro-seen'))document.documentElement.dataset.intro='seen'}catch(e){}`}
        </Script>
        <IntroOverlay />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
