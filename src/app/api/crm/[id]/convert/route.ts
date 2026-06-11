import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const lead = await prisma.crmLead.findUnique({
      where: { id: params.id }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const customer = await prisma.$transaction(async (tx) => {
      // 1. Create the customer in M5 Customer Ledger
      let customerType = '기타';
      if (lead.propertyType === '아파트' || lead.propertyType === '상가') customerType = '매수인'; // default heuristic
      
      const newCustomer = await tx.customerLedger.create({
        data: {
          agentId: session.user.id,
          name: lead.customerName,
          phone: lead.contactInfo,
          customerType,
          notes: lead.notes
        }
      });

      // 2. AuditLog for Customer Creation
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'CUSTOMER',
          entityId: newCustomer.id,
          actorId: session.user.id,
          afterData: JSON.stringify(newCustomer),
          reason: 'CRM 리드에서 원장으로 원클릭 이관'
        }
      });

      // 3. Mark CRM Lead as Converted or Delete it
      // Let's mark it as converted so we don't lose the funnel metric completely, but remove it from the board if the board filters it out.
      const updatedLead = await tx.crmLead.update({
        where: { id: params.id },
        data: { stage: '원장이관완료' }
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'CRM_LEAD',
          entityId: lead.id,
          actorId: session.user.id,
          beforeData: JSON.stringify(lead),
          afterData: JSON.stringify(updatedLead),
          reason: '고객 원장 이관 완료'
        }
      });

      return newCustomer;
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('CRM Convert Error:', error);
    return NextResponse.json({ error: 'Failed to convert lead to customer' }, { status: 500 });
  }
}
