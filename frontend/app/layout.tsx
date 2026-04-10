import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Donna — Always Three Steps Ahead",
  description:
    "Regulatory horizon intelligence platform for in-house legal and compliance teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <body className="font-sans bg-surface text-text-primary antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
