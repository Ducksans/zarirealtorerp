/*---
id: layout.tsx
milestone: M0
why: 기본 구조 파일 (layout.tsx)
backlinks: []
---*/

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DevHeader from '@/components/dev/DevHeader';

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
      <body className="h-full flex flex-col overflow-hidden">
        <DevHeader />
        {children}
      </body>
    </html>
  );
}
