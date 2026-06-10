export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getPendingApprovals } from '@/services/approvalService';
import { handleError } from '@/lib/errorHandler';

export async function GET() {
  try {
    const approvals = await getPendingApprovals();
    return NextResponse.json({ data: approvals });
  } catch (error) {
    return handleError(error);
  }
}
