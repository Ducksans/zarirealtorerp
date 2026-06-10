/**
 * @file src/lib/errorHandler.ts
 * @description 전역 에러 핸들링 미들웨어 유틸리티
 * @dependencies NextResponse
 * @purpose API 엔드포인트에서 발생하는 예외를 규격화된 형태로 캐치하고 클라이언트에 일관된 에러 포맷으로 응답합니다.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;
  
  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    console.warn(`[AppError] ${error.message}`);
    return NextResponse.json(
      { 
        error: error.message,
        code: 'APP_ERROR',
        details: error.details
      },
      { status: error.statusCode }
    );
  }

  // 예측하지 못한 서버 에러 로깅
  console.error('[Unhandled Error]', error);
  return NextResponse.json(
    { 
      error: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR'
    },
    { status: 500 }
  );
}
