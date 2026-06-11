'use client';

import React, { useEffect } from 'react';

export default function Error({
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
    <div className="p-6 max-w-4xl mx-auto mt-12 text-center flex flex-col items-center justify-center space-y-6">
      <div className="bg-red-50 text-red-500 rounded-full p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">매물 데이터를 불러올 수 없습니다.</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          일시적인 서버 오류이거나 네트워크 문제일 수 있습니다. 잠시 후 다시 시도해주세요.
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
