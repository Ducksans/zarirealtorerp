import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUsers, createUser, deleteUser } from '@/services/userService';
import { handleError } from '@/lib/errorHandler';
import { writeFile } from 'fs/promises';
import path from 'path';

const UserSchema = z.object({
  name: z.string().min(2, '이름은 최소 2글자 이상이어야 합니다.'),
  role: z.enum(['REGULAR', 'TEAM_LEADER', 'DIV_HEAD', 'BRANCH_MGR']),
  uplineId: z.string().nullable().optional(),
  birthDate: z.string().optional(),
  ssnSuffix: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bankAccount: z.string().optional(), // Now expects fullBankAccount from form
  joinedAt: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const { users, totalCount } = await getUsers(search, role, status, page, limit);

    return NextResponse.json({
      users,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    // 1. JSON or FormData? We support FormData for file uploads.
    const contentType = req.headers.get('content-type') || '';
    
    let bodyData: any = {};
    const documents: { type: string, fileUrl: string }[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('file_') && value instanceof File) {
          const type = key.replace('file_', '');
          const buffer = Buffer.from(await value.arrayBuffer());
          const ext = path.extname(value.name) || '.png';
          // Sanitize filename and add timestamp
          const safeName = value.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filename = `${Date.now()}_${safeName}`;
          const filepath = path.join(process.cwd(), 'public', 'uploads', filename);
          
          await writeFile(filepath, buffer);
          documents.push({ type, fileUrl: `/uploads/${filename}` });
        } else {
          bodyData[key] = value;
        }
      }
      
      // Map fullBankAccount to bankAccount if it exists
      if (bodyData.fullBankAccount) {
        bodyData.bankAccount = bodyData.fullBankAccount;
      }
      
    } else {
      // Fallback to JSON
      bodyData = await req.json();
    }

    const validated = UserSchema.parse(bodyData);

    const user = await createUser({
      name: validated.name,
      role: validated.role,
      uplineId: validated.uplineId ?? null,
      birthDate: validated.birthDate,
      ssnSuffix: validated.ssnSuffix,
      phone: validated.phone,
      address: validated.address,
      bankAccount: validated.bankAccount,
      joinedAt: validated.joinedAt ? new Date(validated.joinedAt) : new Date(),
      documents: documents
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    await deleteUser(id as string, 'SYSTEM', '인사 시스템 목록에서 삭제 처리');
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}
