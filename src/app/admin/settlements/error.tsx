"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function SettlementsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="glass-panel p-8 rounded-3xl bg-slate-900/80 border border-red-500/20 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0"></div>
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Settlement Failed to Load</h2>
        <p className="text-slate-400 mb-8">{error.message || "Could not retrieve settlement data at this time."}</p>
        <button
          onClick={() => reset()}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors w-full"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
