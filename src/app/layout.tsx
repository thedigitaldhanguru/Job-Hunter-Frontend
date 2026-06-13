import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer"; 
import SessionWrapper from "@/components/SessionWrapper"; 

// Configure the global font
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
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
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground flex flex-col min-h-screen`}>
        
        {/* 2. Wrap everything in the SessionWrapper */}
        <SessionWrapper>
          
          <div className="flex-1 flex flex-col">
            {children}
          </div>

          <Footer />
          
        </SessionWrapper>

      </body>
    </html>
  );
}