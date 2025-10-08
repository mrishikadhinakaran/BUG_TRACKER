import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, user } from '@/db/schema';
import { eq, like, and, desc, or } from 'drizzle-orm';
import { z } from 'zod';

const ROLES = ['admin', 'manager', 'developer', 'tester'] as const;

const createUserSchema = z.object({
  name: z.string().min(1).max(255).transform(val => val.trim()),
  email: z.string().email().transform(val => val.toLowerCase().trim()),
  role: z.enum(ROLES).default('developer'),
  image: z.string().url().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).transform(val => val.trim()).optional(),
  email: z.string().email().transform(val => val.toLowerCase().trim()).optional(),
  role: z.enum(ROLES).optional(),
  image: z.string().url().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }
      
      const [user] = await db.select().from(users).where(eq(users.id, parseInt(id))).limit(1);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ data: user });
    }
    
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
    const offset = (page - 1) * pageSize;
    
    // Execute query based on search filter
    let allUsers;
    if (search) {
      allUsers = await db
        .select()
        .from(users)
        .where(
          or(
            like(users.name, `%${search}%`),
            like(users.email, `%${search}%`)
          )
        )
        .orderBy(desc(users.createdAt));
    } else {
      allUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt));
    }
    
    const paginatedUsers = allUsers.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(allUsers.length / pageSize);
    
    return NextResponse.json({
      data: paginatedUsers,
      pagination: {
        page,
        pageSize,
        total: allUsers.length,
        totalPages,
      }
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = createUserSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const { name, email, role, image } = validationResult.data;
    
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'DUPLICATE_EMAIL' },
        { status: 409 }
      );
    }
    
    const newUser = await db.insert(users)
      .values({
        name,
        email,
        role: role || 'developer',
        image: image || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    
    return NextResponse.json({ data: newUser[0] }, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const validationResult = updateUserSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const updates = validationResult.data;
    
    if (updates.email) {
      const existingUser = await db.select()
        .from(users)
        .where(and(eq(users.email, updates.email), eq(users.id, parseInt(id))))
        .limit(1);
      
      if (existingUser.length === 0) {
        const emailExists = await db.select()
          .from(users)
          .where(eq(users.email, updates.email))
          .limit(1);
        
        if (emailExists.length > 0) {
          return NextResponse.json(
            { error: 'Email already exists', code: 'DUPLICATE_EMAIL' },
            { status: 409 }
          );
        }
      }
    }
    
    const updatedUsers = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, parseInt(id)))
      .returning();
    
    if (updatedUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: updatedUsers[0] });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }
    
    const deletedUsers = await db.delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();
    
    if (deletedUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'User deleted successfully',
      data: deletedUsers[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}