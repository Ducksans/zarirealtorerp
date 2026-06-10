import { NextResponse } from 'next/server';
import { updateContractStatus, deleteContract } from '@/services/contractService';
import { handleError } from '@/lib/errorHandler';
import { z } from 'zod';

const PatchContractSchema = z.object({
  signatureStatus: z.enum(['PENDING', 'SIGNED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'NON_PAID']).optional(),
  reason: z.string().min(1, '변경 사유를 입력해주세요.')
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = PatchContractSchema.parse(body);

    const updated = await updateContractStatus(
      id,
      { signatureStatus: validated.signatureStatus, paymentStatus: validated.paymentStatus },
      'SYSTEM', // 향후 세션 연동
      validated.reason
    );
    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const reason = body.reason || '관리자 강제 삭제';
    await deleteContract(id, 'SYSTEM', reason);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
