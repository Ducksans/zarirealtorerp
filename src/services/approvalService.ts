import { prisma } from '@/lib/prisma';
import { OnboardingRequest } from '@prisma/client';

export async function getPendingApprovals() {
  return await prisma.onboardingRequest.findMany({
    where: {
      status: {
        in: ['PENDING_TL', 'PENDING_DH', 'PENDING_BM', 'PENDING_CEO']
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getApprovalById(id: string) {
  return await prisma.onboardingRequest.findUnique({
    where: { id }
  });
}

export async function approveRequest(id: string, role: string, memo: string) {
  const req = await prisma.onboardingRequest.findUnique({ where: { id } });
  if (!req) throw new Error('Request not found');

  let nextStatus = req.status;
  const updateData: any = {};

  if (req.status === 'PENDING_TL' && role === 'TL') {
    nextStatus = 'PENDING_DH';
    updateData.tlMemo = memo;
  } else if (req.status === 'PENDING_DH' && role === 'DH') {
    nextStatus = 'PENDING_BM';
    updateData.dhMemo = memo;
  } else if (req.status === 'PENDING_BM' && role === 'BM') {
    nextStatus = 'PENDING_CEO';
    updateData.bmMemo = memo;
  } else if (req.status === 'PENDING_CEO' && role === 'CEO') {
    nextStatus = 'APPROVED';
    updateData.ceoMemo = memo;
  } else {
    throw new Error('Invalid approval step');
  }

  updateData.status = nextStatus;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.onboardingRequest.update({
      where: { id },
      data: updateData
    });

    if (nextStatus === 'APPROVED') {
      // Create User
      // Generate a new employee ID
      const newUserId = `EMP-${Date.now().toString().slice(-6)}`;
      await tx.user.create({
        data: {
          employeeId: newUserId,
          name: updated.name,
          role: 'REGULAR',
          birthDate: updated.birthDate,
          ssnSuffix: updated.ssnSuffix,
          phone: updated.phone,
          address: updated.address,
          bankAccount: updated.bankAccount,
          status: 'ACTIVE'
        }
      });
    }

    return updated;
  });

  return result;
}

export async function rejectRequest(id: string) {
  return await prisma.onboardingRequest.update({
    where: { id },
    data: { status: 'REJECTED' }
  });
}
