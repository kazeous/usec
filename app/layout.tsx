import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "USEC Tournament Hub",
  description: "University esports club registrations, brackets, and map veto.",
  icons: {
    icon: "/logoclb.png",
    shortcut: "/logoclb.png",
    apple: "/logoclb.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
