import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VedaWell Tools - Productivity Tools, Games & HomeOwner Guardian",
  description: "65+ free online tools for productivity, games, and the HomeOwner Guardian - your comprehensive protection system for Australian home construction.",
  keywords: "productivity tools, games, home construction, Australian building, defect tracking, variation management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
