export default function SettlementsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center pt-24 p-6 font-sans animate-pulse">
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Status Pill Skeleton */}
        <div className="h-8 w-40 bg-emerald-500/10 rounded-full mb-6 border border-emerald-500/20"></div>

        <div className="h-6 w-32 bg-slate-800 rounded mb-2"></div>
        
        {/* Huge amount skeleton */}
        <div className="mb-12 w-full flex justify-center">
          <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] px-10 py-12 w-full max-w-sm h-40"></div>
        </div>

        {/* Button skeleton */}
        <div className="h-12 w-56 bg-slate-800/50 rounded-full"></div>
      </div>
    </div>
  );
}
