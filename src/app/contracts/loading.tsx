export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-900 p-8 flex items-center justify-center font-sans">
      <div className="max-w-6xl w-full space-y-8 animate-pulse">
        <div>
          <div className="h-10 bg-slate-800 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-96 bg-slate-800 rounded-xl border border-slate-700"></div>
          <div className="lg:col-span-2 h-[600px] bg-slate-800 rounded-xl border border-slate-700"></div>
        </div>
      </div>
    </div>
  );
}
