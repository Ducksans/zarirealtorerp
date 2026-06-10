// src/components/dev/DevHeader.tsx
import React from 'react';

export default function DevHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center h-14 px-6 bg-[#0d1117]/80 backdrop-blur-md border-b border-[#30363d]">
      <h1 className="text-lg font-medium text-[#c9d1d9]">ERP 개발 대시보드</h1>
    </header>
  );
}
