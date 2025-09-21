import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const PROJECT_STATUSES = ['active', 'archived'] as const;

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).transform(val => val.trim()).optional(),
  key: z.string().min(2).max(5).regex(/^[A-Z]+$/, 'Key must be uppercase letters only').transform(val => val.toUpperCase().trim()).optional(),
  description: z.string().transform(val => val.trim()).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  ownerId: z.number().int().positive().optional(),
});

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
    let projectId: number;
    
    try {
      projectId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ data: project[0] });
  } catch (error) {
    console.error('GET project error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    let projectId: number;
    
    try {
      projectId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = updateProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const updates = validationResult.data;
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update',
        code: 'NO_UPDATE_FIELDS'
      }, { status: 400 });
    }

    // Validate owner exists if provided
    if (updates.ownerId) {
      const [owner] = await db.select().from(users).where(eq(users.id, updates.ownerId)).limit(1);
      if (!owner) {
        return NextResponse.json(
          { error: 'Owner not found', code: 'OWNER_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    // Check if key already exists (if updating key)
    if (updates.key) {
      const existingProject = await db.select()
        .from(projects)
        .where(eq(projects.key, updates.key))
        .limit(1);
      
      if (existingProject.length > 0 && existingProject[0].id !== projectId) {
        return NextResponse.json(
          { error: 'Project key already exists', code: 'DUPLICATE_KEY' },
          { status: 409 }
        );
      }
    }

    const updatedProject = await db
      .update(projects)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(projects.id, projectId))
      .returning();

    if (updatedProject.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ data: updatedProject[0] });
  } catch (error) {
    console.error('PUT project error:', error);
    
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: 'Project key already exists',
        code: 'KEY_UNIQUE_VIOLATION'
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
    let projectId: number;
    
    try {
      projectId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const deletedProject = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    if (deletedProject.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      data: deletedProject[0],
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('DELETE project error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}