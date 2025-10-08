import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, users } from '@/db/schema';
import { eq, like, or, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

const PROJECT_STATUSES = ['active', 'archived'] as const;

const createProjectSchema = z.object({
  name: z.string().min(1).max(255).transform(val => val.trim()),
  key: z.string().min(2).max(5).regex(/^[A-Z]+$/, 'Key must be uppercase letters only').transform(val => val.toUpperCase().trim()),
  description: z.string().transform(val => val.trim()).optional(),
  status: z.enum(PROJECT_STATUSES).default('active'),
  ownerId: z.number().int().positive(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).transform(val => val.trim()).optional(),
  key: z.string().min(2).max(5).regex(/^[A-Z]+$/, 'Key must be uppercase letters only').transform(val => val.toUpperCase().trim()).optional(),
  description: z.string().transform(val => val.trim()).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  ownerId: z.number().int().positive().optional(),
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
      
      const [project] = await db.select().from(projects).where(eq(projects.id, parseInt(id))).limit(1);
      
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ data: project });
    }
    
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
    const offset = (page - 1) * pageSize;
    
    // Execute query based on status filter
    let allProjects;
    if (status && PROJECT_STATUSES.includes(status as any)) {
      allProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.status, status as any))
        .orderBy(desc(projects.createdAt));
    } else {
      allProjects = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.createdAt));
    }
    
    const paginatedProjects = allProjects.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(allProjects.length / pageSize);
    
    return NextResponse.json({
      data: paginatedProjects,
      pagination: {
        page,
        pageSize,
        total: allProjects.length,
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
    
    const validationResult = createProjectSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const { name, key, description, status, ownerId } = validationResult.data;
    
    // Validate owner exists
    const [owner] = await db.select().from(users).where(eq(users.id, ownerId)).limit(1);
    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found', code: 'OWNER_NOT_FOUND' },
        { status: 400 }
      );
    }
    
    // Check if key already exists
    const existingProject = await db.select()
      .from(projects)
      .where(eq(projects.key, key))
      .limit(1);
    
    if (existingProject.length > 0) {
      return NextResponse.json(
        { error: 'Project key already exists', code: 'DUPLICATE_KEY' },
        { status: 409 }
      );
    }
    
    const newProject = await db.insert(projects)
      .values({
        name,
        key,
        description: description || null,
        status: status || 'active',
        ownerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    
    return NextResponse.json({ data: newProject[0] }, { status: 201 });
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
    
    const validationResult = updateProjectSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const updates = validationResult.data;
    
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
      
      if (existingProject.length > 0 && existingProject[0].id !== parseInt(id)) {
        return NextResponse.json(
          { error: 'Project key already exists', code: 'DUPLICATE_KEY' },
          { status: 409 }
        );
      }
    }
    
    const updatedProjects = await db.update(projects)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, parseInt(id)))
      .returning();
    
    if (updatedProjects.length === 0) {
      return NextResponse.json(
        { error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: updatedProjects[0] });
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
    
    const deletedProjects = await db.delete(projects)
      .where(eq(projects.id, parseInt(id)))
      .returning();
    
    if (deletedProjects.length === 0) {
      return NextResponse.json(
        { error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Project deleted successfully',
      data: deletedProjects[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}