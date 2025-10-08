import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bugs, projects, users } from '@/db/schema';
import { eq, like, and, or, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

const BUG_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
const BUG_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

const createBugSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().min(1).max(255).transform(val => val.trim()),
  description: z.string().min(1).transform(val => val.trim()),
  priority: z.enum(BUG_PRIORITIES).default('medium'),
  status: z.enum(BUG_STATUSES).default('open'),
  reporterId: z.number().int().positive(),
  assigneeId: z.number().int().positive().optional(),
});

const updateBugSchema = z.object({
  projectId: z.number().int().positive().optional(),
  title: z.string().min(1).max(255).transform(val => val.trim()).optional(),
  description: z.string().min(1).transform(val => val.trim()).optional(),
  priority: z.enum(BUG_PRIORITIES).optional(),
  status: z.enum(BUG_STATUSES).optional(),
  reporterId: z.number().int().positive().optional(),
  assigneeId: z.number().int().positive().optional().nullable(),
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
        .where(eq(bugs.id, parseInt(id)))
        .limit(1);
      
      if (bug.length === 0) {
        return NextResponse.json(
          { error: 'Bug not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ data: bug[0] });
    }
    
    // List bugs with filtering
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const projectId = searchParams.get('projectId');
    const assigneeId = searchParams.get('assigneeId');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
    const offset = (page - 1) * pageSize;
    
    // Build base query without joins first
    let query = db
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
        updatedAt: bugs.updatedAt
      })
      .from(bugs);
    
    const conditions = [];
    
    if (status && BUG_STATUSES.includes(status as any)) {
      conditions.push(eq(bugs.status, status as any));
    }
    
    if (priority && BUG_PRIORITIES.includes(priority as any)) {
      conditions.push(eq(bugs.priority, priority as any));
    }
    
    if (projectId && !isNaN(parseInt(projectId))) {
      conditions.push(eq(bugs.projectId, parseInt(projectId)));
    }
    
    if (assigneeId && !isNaN(parseInt(assigneeId))) {
      conditions.push(eq(bugs.assigneeId, parseInt(assigneeId)));
    }
    
    if (search) {
      conditions.push(
        or(
          like(bugs.title, `%${search}%`),
          like(bugs.description, `%${search}%`)
        )
      );
    }
    
    // Execute query based on conditions
    let baseResults;
    if (conditions.length > 0) {
      baseResults = await db
        .select()
        .from(bugs)
        .where(and(...conditions))
        .orderBy(desc(bugs.createdAt));
    } else {
      baseResults = await db
        .select()
        .from(bugs)
        .orderBy(desc(bugs.createdAt));
    }
    
    // Now fetch the related data for each bug
    const enrichedResults = await Promise.all(baseResults.map(async (bug) => {
      // Fetch project
      const [projectResult] = await db
        .select({
          id: projects.id,
          name: projects.name,
          key: projects.key
        })
        .from(projects)
        .where(eq(projects.id, bug.projectId))
        .limit(1);
      
      // Fetch reporter
      const [reporterResult] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email
        })
        .from(users)
        .where(eq(users.id, bug.reporterId))
        .limit(1);
      
      return {
        ...bug,
        project: projectResult,
        reporter: reporterResult
      };
    }));
    
    const paginatedBugs = enrichedResults.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(enrichedResults.length / pageSize);
    
    return NextResponse.json({
      data: paginatedBugs,
      pagination: {
        page,
        pageSize,
        total: enrichedResults.length,
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
    
    const validationResult = createBugSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const { projectId, title, description, priority, status, reporterId, assigneeId } = validationResult.data;
    
    // Validate project exists
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 400 }
      );
    }
    
    // Validate reporter exists
    const [reporter] = await db.select().from(users).where(eq(users.id, reporterId)).limit(1);
    if (!reporter) {
      return NextResponse.json(
        { error: 'Reporter not found', code: 'REPORTER_NOT_FOUND' },
        { status: 400 }
      );
    }
    
    // Validate assignee exists (if provided)
    if (assigneeId) {
      const [assignee] = await db.select().from(users).where(eq(users.id, assigneeId)).limit(1);
      if (!assignee) {
        return NextResponse.json(
          { error: 'Assignee not found', code: 'ASSIGNEE_NOT_FOUND' },
          { status: 400 }
        );
      }
    }
    
    const newBug = await db.insert(bugs)
      .values({
        projectId,
        title,
        description,
        priority: priority || 'medium',
        status: status || 'open',
        reporterId,
        assigneeId: assigneeId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    
    return NextResponse.json({ data: newBug[0] }, { status: 201 });
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
    
    const validationResult = updateBugSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const updates = validationResult.data;
    
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
    
    const updatedBugs = await db.update(bugs)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(bugs.id, parseInt(id)))
      .returning();
    
    if (updatedBugs.length === 0) {
      return NextResponse.json(
        { error: 'Bug not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: updatedBugs[0] });
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
    
    const deletedBugs = await db.delete(bugs)
      .where(eq(bugs.id, parseInt(id)))
      .returning();
    
    if (deletedBugs.length === 0) {
      return NextResponse.json(
        { error: 'Bug not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Bug deleted successfully',
      data: deletedBugs[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}