import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AIAssistant from "@/components/AIAssistant";
import ToastContainer from "@/components/ui/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "부동산 중개법인 ERP",
  description: "월간 정산 자동화 및 인사관리 통합 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-16 md:pb-0 min-w-0">
          {children}
        </main>
        <AIAssistant />
        <ToastContainer />
      </body>
    </html>
  );
}
