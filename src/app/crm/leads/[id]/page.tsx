/*---
id: crm/leads/[id]/page.tsx
milestone: M10
why: 리드 상세는 고객 상세(/customers/[id])와 중복 — SSOT 유지를 위해 redirect만 하는 얇은 페이지
backlinks: [[[Pages]], [[crm/leads/page.tsx]], [[customers/[id]/page.tsx]]]
---*/

/**
 * @file src/app/crm/leads/[id]/page.tsx
 * @description 리드 상세 → 고객 상세(/customers/[id])로 영구 리다이렉트 (데이터 SSOT: Customer)
 * @dependencies next/navigation (redirect)
 */

import { redirect } from 'next/navigation';

export default async function LeadDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/customers/${id}`);
}
