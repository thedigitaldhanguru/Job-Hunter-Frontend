import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer"; 
import SessionWrapper from "@/components/SessionWrapper"; 
import LoginModal from "@/components/LoginModal";
import SmartFillModal from "@/components/SmartFillModal";
import VerifyProfileModal from "@/components/VerifyProfileModal";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
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
      <body className={`${inter.variable} ${instrumentSerif.variable} font-sans antialiased flex flex-col min-h-screen`}>
        
        <div className="paperGrid"></div>
        <div className="glow"></div>

        <SessionWrapper>
          <div className="flex-1 flex flex-col relative z-10">
            {children}
          </div>
          <Footer />
          <LoginModal />
          <SmartFillModal />
          <VerifyProfileModal />
        </SessionWrapper>

      </body>
    </html>
  );
}