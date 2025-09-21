import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { comments, bugs, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const createCommentSchema = z.object({
  authorId: z.number().int().positive(),
  body: z.string().min(1).transform(val => val.trim()),
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
        error: 'Invalid bug ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Verify bug exists
    const [bug] = await db.select().from(bugs).where(eq(bugs.id, bugId)).limit(1);
    if (!bug) {
      return NextResponse.json({ 
        error: 'Bug not found',
        code: 'BUG_NOT_FOUND'
      }, { status: 404 });
    }

    const bugComments = await db
      .select({
        id: comments.id,
        bugId: comments.bugId,
        authorId: comments.authorId,
        body: comments.body,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          image: users.image
        }
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.bugId, bugId))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json({ data: bugComments });
  } catch (error) {
    console.error('GET bug comments error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    let bugId: number;
    
    try {
      bugId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid bug ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = createCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { authorId, body: commentBody } = validationResult.data;

    // Verify bug exists
    const [bug] = await db.select().from(bugs).where(eq(bugs.id, bugId)).limit(1);
    if (!bug) {
      return NextResponse.json({ 
        error: 'Bug not found',
        code: 'BUG_NOT_FOUND'
      }, { status: 404 });
    }

    // Verify author exists
    const [author] = await db.select().from(users).where(eq(users.id, authorId)).limit(1);
    if (!author) {
      return NextResponse.json({ 
        error: 'Author not found',
        code: 'AUTHOR_NOT_FOUND'
      }, { status: 404 });
    }

    const newComment = await db.insert(comments)
      .values({
        bugId,
        authorId,
        body: commentBody,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Get the comment with author details
    const commentWithAuthor = await db
      .select({
        id: comments.id,
        bugId: comments.bugId,
        authorId: comments.authorId,
        body: comments.body,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          image: users.image
        }
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.id, newComment[0].id))
      .limit(1);

    return NextResponse.json({ data: commentWithAuthor[0] }, { status: 201 });
  } catch (error) {
    console.error('POST bug comment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}