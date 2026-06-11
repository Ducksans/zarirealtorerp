import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { login } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, password } = body;

    // TODO: In a real system, verify passwordHash with bcrypt.
    // For this migration, we check if the employeeId exists.
    // If not, we'll try to find by name for the demo accounts.
    let user = await prisma.user.findUnique({
      where: { employeeId: employeeId }
    });

    if (!user) {
      // Fallback for demo users (e.g., if employeeId is not used but name is)
      const users = await prisma.user.findMany({
        where: { name: employeeId } // Demo allows typing name like "김덕산"
      });
      if (users.length > 0) {
        user = users[0];
      }
    }

    if (!user) {
      return NextResponse.json({ error: '유효하지 않은 사원번호 또는 이름입니다.' }, { status: 401 });
    }

    // Accept any password for the demo, or check if it matches a dummy
    // In production, compare password with user.passwordHash

    await login({
      id: user.id,
      employeeId: user.employeeId,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
