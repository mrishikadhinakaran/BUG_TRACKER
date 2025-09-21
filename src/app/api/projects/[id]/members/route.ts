import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projectMembers, projects, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const MEMBER_ROLES = ['owner', 'maintainer', 'contributor', 'viewer'] as const;

const addMemberSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(MEMBER_ROLES),
});

const removeMemberSchema = z.object({
  userId: z.number().int().positive(),
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
        error: 'Invalid project ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Verify project exists
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      }, { status: 404 });
    }

    const members = await db
      .select({
        id: projectMembers.id,
        userId: projectMembers.userId,
        role: projectMembers.role,
        createdAt: projectMembers.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          image: users.image
        }
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));

    return NextResponse.json({ data: members });
  } catch (error) {
    console.error('GET project members error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    let projectId: number;
    
    try {
      projectId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid project ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = addMemberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { userId, role } = validationResult.data;

    // Verify project exists
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      }, { status: 404 });
    }

    // Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
      .limit(1);

    if (existingMember) {
      return NextResponse.json({ 
        error: 'User is already a member of this project',
        code: 'MEMBER_EXISTS'
      }, { status: 409 });
    }

    const newMember = await db.insert(projectMembers)
      .values({
        projectId,
        userId,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Get the member with user details
    const memberWithUser = await db
      .select({
        id: projectMembers.id,
        userId: projectMembers.userId,
        role: projectMembers.role,
        createdAt: projectMembers.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          image: users.image
        }
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.id, newMember[0].id))
      .limit(1);

    return NextResponse.json({ data: memberWithUser[0] }, { status: 201 });
  } catch (error) {
    console.error('POST project member error:', error);
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
        error: 'Invalid project ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = removeMemberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { userId } = validationResult.data;

    // Verify project exists
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      }, { status: 404 });
    }

    const deletedMember = await db
      .delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
      .returning();

    if (deletedMember.length === 0) {
      return NextResponse.json({ 
        error: 'Member not found in this project',
        code: 'MEMBER_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Member removed successfully',
      data: deletedMember[0]
    });
  } catch (error) {
    console.error('DELETE project member error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}