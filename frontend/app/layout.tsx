import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Cormorant_Garamond } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const dmSans = DM_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["300", "400"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

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
        className={`${dmSans.variable} ${dmMono.variable} ${cormorant.variable}`}
      >
        <body className="font-sans bg-surface text-text-primary antialiased">
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
