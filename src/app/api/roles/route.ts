import { NextResponse } from 'next/server';
import { getRoles, getPermissions } from '@/services/roleService';
import { handleError } from '@/lib/errorHandler';

export async function GET() {
  try {
    const [roles, permissions] = await Promise.all([
      getRoles(),
      getPermissions()
    ]);
    return NextResponse.json({ roles, permissions });
  } catch (error) {
    return handleError(error);
  }
}
