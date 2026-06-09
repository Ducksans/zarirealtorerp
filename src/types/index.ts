/**
 * @file src/types/index.ts
 * @description 시스템 전역 공유 타입 및 상수 정의
 * @purpose 타입 중복 선언 방지 및 role 매직 스트링 제거 (MEDIUM-01, MEDIUM-02 수정)
 */

export const ROLES = {
  REGULAR: 'REGULAR',
  TEAM_LEADER: 'TEAM_LEADER',
  DIV_HEAD: 'DIV_HEAD',
  BRANCH_MGR: 'BRANCH_MGR',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLES_KO: Record<UserRole, string> = {
  REGULAR: '사원',
  TEAM_LEADER: '팀장',
  DIV_HEAD: '본부장',
  BRANCH_MGR: '지점장',
};

export type UserSummary = {
  id: string;
  employeeId: string;
  name: string;
  role: UserRole;
};

export type SettlementRow = {
  id: string;
  user: { name: string; role: string; employeeId: string };
  basePay: number;
  bonusPay: number;
  overridePay: number;
  totalPay: number;
};

export type ContractRow = {
  id: string;
  grossCommission: number;
  contractDate: string;
  agent: UserSummary;
};

export type UserRow = {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  uplineId: string | null;
  upline?: { name: string; employeeId: string } | null;
};
