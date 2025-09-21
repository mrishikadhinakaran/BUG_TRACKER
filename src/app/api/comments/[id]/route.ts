import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { comments, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateCommentSchema = z.object({
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

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    let commentId: number;
    
    try {
      commentId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid comment ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = updateCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { body: commentBody } = validationResult.data;

    const updatedComment = await db
      .update(comments)
      .set({
        body: commentBody,
        updatedAt: new Date().toISOString()
      })
      .where(eq(comments.id, commentId))
      .returning();

    if (updatedComment.length === 0) {
      return NextResponse.json({ 
        error: 'Comment not found',
        code: 'COMMENT_NOT_FOUND'
      }, { status: 404 });
    }

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
      .where(eq(comments.id, commentId))
      .limit(1);

    return NextResponse.json({ data: commentWithAuthor[0] });
  } catch (error) {
    console.error('PUT comment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    let commentId: number;
    
    try {
      commentId = validateIdParam(id);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid comment ID format',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const deletedComment = await db
      .delete(comments)
      .where(eq(comments.id, commentId))
      .returning();

    if (deletedComment.length === 0) {
      return NextResponse.json({ 
        error: 'Comment not found',
        code: 'COMMENT_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      data: deletedComment[0],
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('DELETE comment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}