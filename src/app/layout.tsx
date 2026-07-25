import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kirana WhatsApp Billing Agent",
  description: "WhatsApp-first billing and GST ledger for kirana stores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
