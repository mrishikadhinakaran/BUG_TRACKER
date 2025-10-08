import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attachments, bugs, users } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Remove auth check for now
    // const user = await getCurrentUser(request);
    // if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid bug ID is required',
        code: 'INVALID_BUG_ID'
      }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Mock bug existence check
    const bugId = parseInt(id);
    if (bugId > 10) {
      return NextResponse.json({ 
        error: 'Bug not found',
        code: 'BUG_NOT_FOUND'
      }, { status: 404 });
    }

    // Mock attachments for the specific bug
    const mockAttachments = [
      {
        id: 1,
        filename: 'screenshot-login-error.png',
        storedName: 'screenshot-login-error_01h4kxt2e8z9y3b1n7m6q5w8r4.png',
        path: '/uploads/screenshot-login-error_01h4kxt2e8z9y3b1n7m6q5w8r4.png',
        mime: 'image/png',
        size: 245760,
        issueId: 1,
        projectId: null,
        createdAt: new Date('2024-01-15T14:30:00'),
        uploader: {
          id: 3,
          name: 'Alice Smith',
          email: 'alice@example.com',
          role: 'developer',
          image: null
        }
      },
      {
        id: 4,
        filename: 'error-trace.log',
        storedName: 'error-trace_04h7pqw5h2c1b3e9a8f6z3y7d.log',
        path: '/uploads/error-trace_04h7pqw5h2c1b3e9a8f6z3y7d.log',
        mime: 'text/plain',
        size: 12456,
        issueId: 1,
        projectId: null,
        createdAt: new Date('2024-01-16T10:15:00'),
        uploader: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
          image: null
        }
      }
    ];

    // Filter by bugId
    const filteredAttachments = mockAttachments.filter(att => att.issueId === bugId);

    const offset = (page - 1) * pageSize;
    const paginatedAttachments = filteredAttachments.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(filteredAttachments.length / pageSize);

    return NextResponse.json({
      attachments: paginatedAttachments,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalCount: filteredAttachments.length,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    });

    // TODO: Replace with real database query:
    // const bugExists = await db.select().from(bugs).where(eq(bugs.id, parseInt(id))).limit(1);
    // const results = await query.limit(pageSize).offset(offset);

  } catch (error) {
    console.error('GET /api/bugs/[id]/attachments error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}