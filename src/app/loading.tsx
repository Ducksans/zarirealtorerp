import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 p-8">
      <div className="w-16 h-16 relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
        <Loader2 className="w-8 h-8 text-indigo-400 animate-pulse" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Loading System Data</h2>
        <p className="text-slate-400 text-sm">Please wait while we retrieve the latest information...</p>
      </div>
      <div className="w-64 h-2 bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 animate-[pulse_1.5s_ease-in-out_infinite] w-1/2 rounded-full"></div>
      </div>
    </div>
  );
}
