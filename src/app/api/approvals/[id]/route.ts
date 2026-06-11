import { NextResponse } from 'next/server';
import { approveRequest, rejectRequest } from '@/services/approvalService';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const approvalSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  role: z.string().optional(),
  memo: z.string().optional()
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user?.id || 'SYSTEM';

    const { id } = await params;
    const body = await req.json();
    const validatedData = approvalSchema.parse(body);

    if (validatedData.action === 'APPROVE') {
      const updated = await approveRequest(id, validatedData.role || '', validatedData.memo || '', userId);
      return NextResponse.json({ data: updated });
    } else if (validatedData.action === 'REJECT') {
      const updated = await rejectRequest(id, userId);
      return NextResponse.json({ data: updated });
    }
    
    // Should not reach here because of Zod enum
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
