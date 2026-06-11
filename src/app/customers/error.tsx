"use client";

import { useEffect } from 'react';

export default function CustomersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-red-100 dark:border-red-900/50 p-8 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">고객 데이터를 불러올 수 없습니다</h2>
          <p className="text-sm text-gray-500 mt-2">
            {error.message || '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
