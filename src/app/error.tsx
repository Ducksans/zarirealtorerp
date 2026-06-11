'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-slate-900/50 border border-red-500/30 p-8 rounded-3xl max-w-md w-full shadow-2xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="flex justify-center mb-6 relative z-10">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 relative z-10">Something went wrong</h2>
        <p className="text-slate-400 text-sm mb-8 relative z-10 leading-relaxed">
          {error.message || "An unexpected error occurred while processing your request. Please try again or contact support if the issue persists."}
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 relative z-10 group"
        >
          <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Try Again
        </button>
      </div>
    </div>
  );
}
