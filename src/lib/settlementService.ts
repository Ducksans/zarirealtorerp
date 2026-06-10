/*---
id: settlementService.ts
milestone: M0
why: 기본 구조 파일 (settlementService.ts)
backlinks: []
---*/

/**
 * @file src/lib/settlementService.ts
 * @description 월간 정산 급여액 계산 및 DB 저장 비즈니스 로직
 * @dependencies prisma (싱글턴), ROLES
 * @purpose 정산 비율(100원 Rule) 무결성 유지, ACID 트랜잭션, Int 정밀도 보장
 * @audit-fixes CRITICAL-01(Float→Int), CRITICAL-02(싱글턴), CRITICAL-04(Interactive Tx)
 */

import { prisma } from '@/lib/prisma';
import { Contract } from '@prisma/client';
import { ROLES } from '@/types';
import { AppError } from '@/lib/errorHandler';
import { createAuditLog } from '@/services/auditService';

// 영업지원비 (보너스) 계단식 산정 함수
function getBonus(companyRev: number): number {
  if (companyRev < 1000000) return 0;
  if (companyRev < 10000000) return Math.floor(companyRev / 1000000) * 1000000 * 0.1;
  return companyRev * 0.15;
}

export async function processMonthlySettlement(yearMonth: string) {
  // 월 정산 범위: 해당 월(yearMonth)에 체결된 계약만 포함
  // (필터 부재 시 과거 계약이 매달 중복 정산되는 치명 결함 — 2026-06-11 실데이터 검증에서 적발)
  const monthStart = new Date(`${yearMonth}-01T00:00:00Z`);
  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

  // CRITICAL-04: Interactive Transaction으로 읽기부터 쓰기까지 원자적 보장
  return await prisma.$transaction(async (tx) => {
    // 1. 트랜잭션 내에서 유저 및 해당 월 계약 정보 조회
    const [users, contracts] = await Promise.all([
      tx.user.findMany(),
      tx.contract.findMany({
        where: { contractDate: { gte: monthStart, lt: monthEnd } }
      })
    ]);

    const numBranchMgrs = users.filter(u => u.role === ROLES.BRANCH_MGR).length;

    const userContracts: Record<string, Contract[]> = {};
    users.forEach(u => userContracts[u.id] = []);
    contracts.forEach(c => {
      if (userContracts[c.agentId]) {
        userContracts[c.agentId].push(c);
      }
    });

    const basePayMap: Record<string, number> = {};
    const bonusPayMap: Record<string, number> = {};
    const compRevMap: Record<string, number> = {};
    const overridePayMap: Record<string, number> = {};

    users.forEach(u => {
      basePayMap[u.id] = 0;
      bonusPayMap[u.id] = 0;
      compRevMap[u.id] = 0;
      overridePayMap[u.id] = 0;
    });

    // 2. 개인 영업 수당, 영업지원비, 회사 입금액 산정
    users.forEach(u => {
      const myContracts = userContracts[u.id] || [];
      const totalGross = myContracts.reduce((sum, c) => sum + c.grossCommission, 0);

      let payoutRate = 0.7;
      let compRevRate = 0.3;
      if (u.role === ROLES.REGULAR) { payoutRate = 0.5; compRevRate = 0.5; }
      else if (u.role === ROLES.TEAM_LEADER) { payoutRate = 0.6; compRevRate = 0.4; }

      const compRev = totalGross * compRevRate;
      const bonus = (u.role === ROLES.DIV_HEAD || u.role === ROLES.BRANCH_MGR) ? 0 : getBonus(compRev);
      const basePay = totalGross * payoutRate;

      basePayMap[u.id] = basePay;
      bonusPayMap[u.id] = bonus;
      compRevMap[u.id] = compRev;
    });

    // 3. 오버라이딩 상향 전파 계산
    let totalBranchOverridePool = 0;

    users.forEach(u => {
      const myCompRev = compRevMap[u.id];

      if (u.role === ROLES.REGULAR) {
        if (u.uplineId && overridePayMap[u.uplineId] !== undefined) {
          overridePayMap[u.uplineId] += myCompRev * 0.20;
        }
        totalBranchOverridePool += myCompRev * 0.05;
      }

      if (u.role === ROLES.TEAM_LEADER || u.role === ROLES.DIV_HEAD) {
        totalBranchOverridePool += myCompRev * 0.05;
      }
    });

    users.forEach(dh => {
      if (dh.role === ROLES.DIV_HEAD) {
        const myTLs = users.filter(u => u.uplineId === dh.id && u.role === ROLES.TEAM_LEADER);
        let downlineCompRev = 0;

        myTLs.forEach(tl => {
          downlineCompRev += compRevMap[tl.id];
          const myRegs = users.filter(u => u.uplineId === tl.id && u.role === ROLES.REGULAR);
          myRegs.forEach(reg => {
            downlineCompRev += compRevMap[reg.id];
          });
        });

        overridePayMap[dh.id] += downlineCompRev * 0.10;
      }
    });

    if (numBranchMgrs > 0) {
      const branchShare = Math.floor(totalBranchOverridePool / numBranchMgrs);
      users.forEach(u => {
        if (u.role === ROLES.BRANCH_MGR) {
          overridePayMap[u.id] += branchShare;
        }
      });
    }

    // 4. CRITICAL-01: 모든 금액에 Math.floor 적용 (Int 정밀도 보장)
    const createData = users.map(u => {
      const base = Math.floor(basePayMap[u.id]);
      const bonus = Math.floor(bonusPayMap[u.id]);
      const override = Math.floor(overridePayMap[u.id] || 0);
      return {
        userId: u.id,
        yearMonth,
        basePay: base,
        bonusPay: bonus,
        overridePay: override,
        totalPay: base + bonus + override
      };
    });

    // CRITICAL-04: 삭제+생성을 동일 트랜잭션 내에서 실행
    await tx.settlement.deleteMany({ where: { yearMonth } });
    await tx.settlement.createMany({ data: createData });

    return createData;
  }, {
    timeout: 30000  // 615명 정산을 위한 넉넉한 타임아웃
  });
}

/**
 * 월간 정산서의 전자결재(서명) 및 지급 상태 업데이트
 */
export async function updateSettlementStatus(
  settlementId: string,
  data: { signatureStatus?: string; paymentStatus?: string },
  actorId: string,
  reason: string
) {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.settlement.findUnique({ where: { id: settlementId } });
    if (!existing) throw new AppError('정산 내역을 찾을 수 없습니다.', 404);

    const updateData: any = {};
    if (data.signatureStatus) {
      updateData.signatureStatus = data.signatureStatus;
      if (data.signatureStatus === 'SIGNED') updateData.signatureDate = new Date();
    }
    if (data.paymentStatus) {
      updateData.paymentStatus = data.paymentStatus;
      if (data.paymentStatus === 'PAID') updateData.paymentDate = new Date();
    }

    const updated = await tx.settlement.update({
      where: { id: settlementId },
      data: updateData
    });

    await tx.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'SETTLEMENT',
        entityId: settlementId,
        actorId,
        beforeData: JSON.stringify(existing),
        afterData: JSON.stringify(updated),
        reason
      }
    });

    return updated;
  });
}
