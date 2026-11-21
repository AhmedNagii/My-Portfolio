import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const manrope = localFont({
  src: "./fonts/Manrope.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});

const jetbrains = localFont({
  src: "./fonts/JetBrainsMono.woff2",
  weight: "100 800",
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Ahmed Nagi, Front-End Developer",
  description: "Front-End Developer working with React and Next.js. Experience, CV and contact.",
  openGraph: {
    title: "Ahmed Nagi, Front-End Developer",
    description: "Front-End Developer working with React and Next.js. Experience, CV and contact.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#16191f" },
    { media: "(prefers-color-scheme: light)", color: "#f5f3ee" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        {/* Sets data-theme before the first paint, so there's no flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
