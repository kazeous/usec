import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "USEC Tournament Hub",
  description: "University esports club registrations, brackets, and map veto."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
