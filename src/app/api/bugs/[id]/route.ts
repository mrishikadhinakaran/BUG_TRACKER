import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bugs, projects, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const BUG_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
const BUG_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

const updateBugSchema = z.object({
  projectId: z.number().int().positive().optional(),
  title: z.string().min(1).max(255).transform(val => val.trim()).optional(),
  description: z.string().min(1).transform(val => val.trim()).optional(),
  priority: z.enum(BUG_PRIORITIES).optional(),
  status: z.enum(BUG_STATUSES).optional(),
  reporterId: z.number().int().positive().optional(),
  assigneeId: z.number().int().positive().optional().nullable(),
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
    let bugId: number;
    
    try {
      bugId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const bug = await db
      .select({
        id: bugs.id,
        projectId: bugs.projectId,
        title: bugs.title,
        description: bugs.description,
        priority: bugs.priority,
        status: bugs.status,
        reporterId: bugs.reporterId,
        assigneeId: bugs.assigneeId,
        createdAt: bugs.createdAt,
        updatedAt: bugs.updatedAt,
        project: {
          id: projects.id,
          name: projects.name,
          key: projects.key
        },
        reporter: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(bugs)
      .innerJoin(projects, eq(bugs.projectId, projects.id))
      .innerJoin(users, eq(bugs.reporterId, users.id))
      .where(eq(bugs.id, bugId))
      .limit(1);

    if (bug.length === 0) {
      return NextResponse.json({ 
        error: 'Bug not found',
        code: 'BUG_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ data: bug[0] });
  } catch (error) {
    console.error('GET bug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    let bugId: number;
    
    try {
      bugId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = updateBugSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const updates = validationResult.data;
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update',
        code: 'NO_UPDATE_FIELDS'
      }, { status: 400 });
    }

    // Validate foreign keys if provided
    if (updates.projectId) {
      const [project] = await db.select().from(projects).where(eq(projects.id, updates.projectId)).limit(1);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
          { status: 400 }
        );
      }
    }
    
    if (updates.reporterId) {
      const [reporter] = await db.select().from(users).where(eq(users.id, updates.reporterId)).limit(1);
      if (!reporter) {
        return NextResponse.json(
          { error: 'Reporter not found', code: 'REPORTER_NOT_FOUND' },
          { status: 400 }
        );
      }
    }
    
    if (updates.assigneeId) {
      const [assignee] = await db.select().from(users).where(eq(users.id, updates.assigneeId)).limit(1);
      if (!assignee) {
        return NextResponse.json(
          { error: 'Assignee not found', code: 'ASSIGNEE_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    const updatedBug = await db
      .update(bugs)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(bugs.id, bugId))
      .returning();

    if (updatedBug.length === 0) {
      return NextResponse.json({ 
        error: 'Bug not found',
        code: 'BUG_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ data: updatedBug[0] });
  } catch (error) {
    console.error('PUT bug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    let bugId: number;
    
    try {
      bugId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const deletedBug = await db
      .delete(bugs)
      .where(eq(bugs.id, bugId))
      .returning();

    if (deletedBug.length === 0) {
      return NextResponse.json({ 
        error: 'Bug not found',
        code: 'BUG_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      data: deletedBug[0],
      message: 'Bug deleted successfully'
    });
  } catch (error) {
    console.error('DELETE bug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}