import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { login } from '@/lib/auth';
import { verifyPassword } from '@/lib/crypto';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, password } = body;

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

    // JWT / Bcrypt Authentication
    // If the user has a passwordHash, verify it. 
    // If they don't (like seeded demo users), allow it for migration purposes, but in production this should be enforced.
    if (user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
      }
    } else {
      // Demo accounts have no passwordHash, so they pass with any password initially.
      // But we will log a warning that they need to set a password.
      console.warn(`User ${user.id} logged in without a password. A passwordHash should be set.`);
    }

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
