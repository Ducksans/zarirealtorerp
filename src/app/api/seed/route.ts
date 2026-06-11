import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/types';
import { encrypt } from '@/lib/crypto';

export async function GET() {
  try {
    await prisma.$transaction(async (tx) => {
      // 기존 데이터 원자적 삭제 (순서 준수: FK 의존성이 있는 것부터 역순)
      await tx.userDocument.deleteMany();
      await tx.userRoleHistory.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.settlement.deleteMany();
      await tx.contract.deleteMany();
      await tx.user.deleteMany();
      await tx.rolePermission.deleteMany();
      await tx.permission.deleteMany();
      await tx.role.deleteMany();

      const permissions = [
        { id: 'view_revenue', action: 'VIEW_REVENUE', description: '매출 전체 조회' },
        { id: 'edit_revenue', action: 'EDIT_REVENUE', description: '매출 수정' },
        { id: 'view_users', action: 'VIEW_USERS', description: '조직원 조회' },
        { id: 'edit_users', action: 'EDIT_USERS', description: '조직원 정보 수정' },
        { id: 'approve_onboarding', action: 'APPROVE_ONBOARDING', description: '입사 승인' }
      ];
      await tx.permission.createMany({ data: permissions });
      
      const roles = [
        { id: 'ADMIN', name: 'ADMIN', displayName: '시스템 관리자', description: '모든 권한' },
        { id: 'CEO', name: 'CEO', displayName: '대표/총무', description: '최고 책임자' },
        { id: 'BRANCH_MGR', name: 'BRANCH_MGR', displayName: '지점장', description: '지점 관리' },
        { id: 'DIV_HEAD', name: 'DIV_HEAD', displayName: '본부장', description: '본부 관리' },
        { id: 'TEAM_LEADER', name: 'TEAM_LEADER', displayName: '팀장', description: '팀 관리' },
        { id: 'REGULAR', name: 'REGULAR', displayName: '사원', description: '일반 사원' }
      ];
      await tx.role.createMany({ data: roles });

      const allPerms = await tx.permission.findMany();
      const adminRole = await tx.role.findUnique({ where: { name: 'ADMIN' } });
      
      if (adminRole) {
        await tx.rolePermission.createMany({
          data: allPerms.map(p => ({ roleId: adminRole.id, permissionId: p.id }))
        });
      }

      const usersData: any[] = [];
      
      // 지점장 5명 (id 1~5)
      for (let i = 1; i <= 5; i++) {
        usersData.push({ id: `user_${i}`, name: `[더미] 지점장_${i}`, role: ROLES.BRANCH_MGR, uplineId: null });
      }
      
      // 본부장 10명 (id 6~15)
      for (let i = 6; i <= 15; i++) {
        const parentId = `user_${(i % 5) + 1}`;
        usersData.push({ id: `user_${i}`, name: `[더미] 본부장_${i}`, role: ROLES.DIV_HEAD, uplineId: parentId });
      }
      
      // 팀장 100명 (id 16~115)
      for (let i = 16; i <= 115; i++) {
        const parentId = `user_${(i % 10) + 6}`;
        usersData.push({ id: `user_${i}`, name: `[더미] 팀장_${i}`, role: ROLES.TEAM_LEADER, uplineId: parentId });
      }
      
      // 사원 500명 (id 116~615)
      for (let i = 116; i <= 615; i++) {
        const parentId = `user_${(i % 100) + 16}`;
        usersData.push({ id: `user_${i}`, name: `[더미] 사원_${i}`, role: ROLES.REGULAR, uplineId: parentId });
      }

      // 1. 유저 생성 (상위 계보 의존성 때문에 순차적 생성)
      for (const u of usersData) {
        // 랜덤 데이터 생성
        const isResigned = Math.random() > 0.95; // 5% 확률로 퇴사자
        const bankNames = ['국민은행', '신한은행', '우리은행', '하나은행', '농협'];
        const bank = bankNames[Math.floor(Math.random() * bankNames.length)];
        
        const createdUser = await tx.user.create({
          data: {
            id: u.id,
            name: u.name,
            role: u.role,
            uplineId: u.uplineId,
            birthDate: `19${Math.floor(Math.random()*30)+70}-0${Math.floor(Math.random()*9)+1}-15`,
            ssnSuffix: encrypt('1234567'), // 마스킹 대신 암호화 적용
            phone: `010-${Math.floor(1000 + Math.random()*9000)}-${Math.floor(1000 + Math.random()*9000)}`,
            address: '서울특별시 강남구 테헤란로 123',
            bankAccount: `${bank} 123-456-789012`,
            status: isResigned ? 'RESIGNED' : 'ACTIVE',
            resignedAt: isResigned ? new Date() : null,
            joinedAt: new Date(new Date().setMonth(new Date().getMonth() - Math.floor(Math.random() * 24))), // 최대 2년 전 입사
          }
        });

        // 2. 직급 이력 생성
        await tx.userRoleHistory.create({
          data: {
            userId: createdUser.id,
            role: createdUser.role,
            promotedAt: createdUser.joinedAt // 임시로 입사일과 동일하게
          }
        });

        // 3. 더미 문서 생성
        await tx.userDocument.createMany({
          data: [
            { userId: createdUser.id, type: '등본', fileUrl: '/dummy/path1.pdf' },
            { userId: createdUser.id, type: '통장사본', fileUrl: '/dummy/path2.pdf' }
          ]
        });
      }

      // 4. 계약(Contract) 1000건 생성
      const contractsData = [];
      const allUsers = await tx.user.findMany();
      for (let i = 0; i < 1000; i++) {
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        const isSigned = Math.random() > 0.5;
        const isPaid = isSigned && Math.random() > 0.2;
        contractsData.push({
          agentId: randomUser.id,
          grossCommission: Math.floor(Math.random() * 500) * 10000 + 1000000,
          contractDate: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 60))),
          signatureStatus: isSigned ? 'SIGNED' : 'PENDING',
          signatureDate: isSigned ? new Date() : null,
          paymentStatus: isPaid ? 'PAID' : 'PENDING',
          paymentDate: isPaid ? new Date() : null
        });
      }

      await tx.contract.createMany({ data: contractsData });

      // Add audit log for the seed action
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'SEED',
          entityId: 'ALL',
          actorId: 'SYSTEM',
          afterData: JSON.stringify({ seeded: true, timestamp: new Date() }),
          reason: '데이터베이스 초기화 및 시드 데이터 삽입'
        }
      });
    });

    return NextResponse.json({ message: 'Dummy Data seeded successfully with advanced HR constraints' });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
