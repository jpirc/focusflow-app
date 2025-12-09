import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export type ApiError = {
    error: string;
    details?: any;
};

export function successResponse<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400, details?: any) {
    const body: ApiError = { error: message, details };
    return NextResponse.json(body, { status });
}

export function unauthorizedResponse() {
    return errorResponse('Unauthorized', 401);
}

export async function getAuthSession() {
    const session = await getServerSession(authOptions);
    return session;
}

export async function validateRequest<T>(
    req: Request,
    schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: ReturnType<typeof errorResponse> }> {
    try {
        const body = await req.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            return {
                error: errorResponse('Validation Error', 400, result.error.format()),
            };
        }

        return { data: result.data };
    } catch (e) {
        return { error: errorResponse('Invalid JSON', 400) };
    }
}
