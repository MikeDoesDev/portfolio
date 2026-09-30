import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NodeGraphBackground from "@/components/layout/NodeGraphBackground";
import ScrollProgress from "@/components/layout/ScrollProgress";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const heading = Space_Grotesk({ variable: "--font-display-family", subsets: ["latin"] });
const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-code-family", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: SITE_TAGLINE ? `${SITE_NAME} — ${SITE_TAGLINE}` : SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Andrew “Michael” Coggins. Computer and Electrical Engineering at Texas A&M, building things that make life easier and faster.",
};

export const viewport: Viewport = {
  themeColor: "#f7f2eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} ${mono.variable} antialiased`}>
      <body id="top" className="flex min-h-screen flex-col">
        <NodeGraphBackground page />
        <ScrollProgress />
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
