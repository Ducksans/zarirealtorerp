export default function CustomersLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-[calc(100vh-4rem)] flex flex-col animate-pulse">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* List View Skeleton */}
        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="space-y-2">
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          ))}
        </div>

        {/* Detail View Skeleton */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
