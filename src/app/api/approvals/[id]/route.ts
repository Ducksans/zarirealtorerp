import { NextResponse } from 'next/server';
import { approveRequest, rejectRequest } from '@/services/approvalService';
import { z } from 'zod';

const approvalSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  role: z.string().optional(),
  memo: z.string().optional()
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validatedData = approvalSchema.parse(body);

    if (validatedData.action === 'APPROVE') {
      const updated = await approveRequest(params.id, validatedData.role || '', validatedData.memo || '');
      return NextResponse.json({ data: updated });
    } else if (validatedData.action === 'REJECT') {
      const updated = await rejectRequest(params.id);
      return NextResponse.json({ data: updated });
    }
    
    // Should not reach here because of Zod enum
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
