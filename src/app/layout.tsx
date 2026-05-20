import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Gilroy (Calendly's typeface) is commercial; Plus Jakarta Sans is the
// closest free geometric sans and stands in via the --font-app variable.
const appFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: "App Grabber: Download Google Play app images in HD",
  description:
    "Search any Google Play app and download its icon, feature graphic and " +
    "screenshots in the highest available resolution. Free, no sign-up.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={appFont.variable}>
      <body className="min-h-screen bg-cloud-mist text-midnight-indigo antialiased">
        {children}
      </body>
    </html>
  );
}
