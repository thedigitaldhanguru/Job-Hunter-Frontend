import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. Configure the global font
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", // We will link this to Tailwind
});

export const metadata: Metadata = {
  title: "Job Hunter Pro",
  description: "High-speed job search engine powered by Neon Postgres",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 2. Apply the font globally to the entire app */}
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}