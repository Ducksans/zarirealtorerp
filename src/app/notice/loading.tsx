export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 flex items-center justify-center font-sans">
      <div className="max-w-4xl w-full space-y-8 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="w-1/2">
            <div className="h-10 bg-slate-800 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          </div>
          <div className="h-10 bg-slate-800 rounded w-32"></div>
        </div>

        <div className="space-y-4">
          <div className="h-40 bg-slate-800 rounded-xl border border-slate-700"></div>
          <div className="h-40 bg-slate-800 rounded-xl border border-slate-700"></div>
          <div className="h-40 bg-slate-800 rounded-xl border border-slate-700"></div>
        </div>
      </div>
    </div>
  );
}
