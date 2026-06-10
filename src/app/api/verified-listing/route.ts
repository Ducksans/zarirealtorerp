import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError } from '@/lib/errorHandler';

const VerifiedListingSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = VerifiedListingSchema.parse(body);

        // Mock DB insertion
        const newListing = {
            id: `vl_${Date.now()}`,
            title: validated.title,
            latitude: validated.latitude,
            longitude: validated.longitude,
            status: validated.status || 'PENDING',
            createdAt: new Date().toISOString()
        };

        return NextResponse.json({ success: true, listing: newListing }, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
