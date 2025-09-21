import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bugHistory, bugs, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

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

    const history = await db
      .select({
        id: bugHistory.id,
        bugId: bugHistory.bugId,
        userId: bugHistory.userId,
        field: bugHistory.field,
        oldValue: bugHistory.oldValue,
        newValue: bugHistory.newValue,
        createdAt: bugHistory.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          image: users.image
        }
      })
      .from(bugHistory)
      .innerJoin(users, eq(bugHistory.userId, users.id))
      .where(eq(bugHistory.bugId, bugId))
      .orderBy(desc(bugHistory.createdAt));

    return NextResponse.json({ data: history });
  } catch (error) {
    console.error('GET bug history error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}