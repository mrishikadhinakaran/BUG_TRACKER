import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const userUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255).optional(),
  email: z.string().trim().email('Invalid email format').toLowerCase().optional(),
  role: z.enum(['admin', 'manager', 'developer', 'tester']).optional(),
  image: z.string().trim().url('Invalid image URL').optional().or(z.literal('')),
});

type UserUpdate = z.infer<typeof userUpdateSchema>;
type Params = Promise<{ id: string }>;

function validateIdParam(id: string): number {
  const parsedId = parseInt(id);
  if (isNaN(parsedId) || !Number.isInteger(parsedId)) {
    throw new Error('Invalid ID format');
  }
  return parsedId;
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    let userId: number;
    
    try {
      userId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        image: users.image,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ data: user[0] });
  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    let userId: number;
    
    try {
      userId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = userUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: validationResult.error.errors[0].message,
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    const updateData: UserUpdate = validationResult.data;
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update',
        code: 'NO_UPDATE_FIELDS'
      }, { status: 400 });
    }

    const updates = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    const updatedUser = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        image: users.image,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    if (updatedUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ data: updatedUser[0] });
  } catch (error) {
    console.error('PUT user error:', error);
    
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: users.email')) {
      return NextResponse.json({ 
        error: 'Email already exists',
        code: 'EMAIL_UNIQUE_VIOLATION'
      }, { status: 409 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    let userId: number;
    
    try {
      userId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        image: users.image,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    if (deletedUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      data: deletedUser[0],
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('DELETE user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}