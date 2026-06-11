import React from 'react';

export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-pulse">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="h-9 w-64 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-5 w-80 bg-gray-100 rounded-md"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-44 bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-56">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                <div className="h-5 w-16 bg-gray-100 rounded-md"></div>
              </div>
              <div className="h-6 w-3/4 bg-gray-200 rounded-md mb-2"></div>
              <div className="h-4 w-full bg-gray-100 rounded-md mb-1"></div>
              <div className="h-4 w-2/3 bg-gray-100 rounded-md mb-4"></div>
              <div className="h-7 w-1/2 bg-gray-200 rounded-md mt-auto"></div>
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center">
              <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
