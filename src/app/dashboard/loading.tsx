export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 animate-pulse font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="h-12 w-1/3 bg-slate-800 rounded-lg mb-8"></div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-2xl border border-white/5"></div>
          ))}
        </div>

        {/* List Skeleton */}
        <div className="mt-8 h-64 bg-slate-900/40 rounded-[2rem] border border-white/5 p-8">
          <div className="h-8 w-1/4 bg-slate-800 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
