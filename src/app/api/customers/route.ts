import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { handleError } from '@/lib/errorHandler';

const CustomerSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요"),
  phone: z.string().min(1, "연락처를 입력하세요"),
  customerType: z.string(), // "임대인", "임차인", "매도인", "매수인", "기타"
  agentId: z.string().min(1, "담당자 ID가 필요합니다"),
  notes: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const customerType = url.searchParams.get('customerType') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } }
      ];
    }
    if (customerType) {
      where.customerType = customerType;
    }

    const [customers, total] = await prisma.$transaction([
      prisma.customerLedger.findMany({
        where,
        include: { agent: { select: { name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customerLedger.count({ where })
    ]);

    return NextResponse.json({
      customers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = CustomerSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customerLedger.create({
        data: {
          name: validated.name,
          phone: validated.phone,
          customerType: validated.customerType,
          agentId: validated.agentId,
          notes: validated.notes || null,
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'CUSTOMER',
          entityId: customer.id,
          actorId: validated.agentId || 'SYSTEM',
          afterData: JSON.stringify(customer),
          reason: '고객 신규 등록'
        }
      });

      return customer;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
