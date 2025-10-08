import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attachments, projects, users } from '@/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);
    
    if (isNaN(projectId)) {
      return NextResponse.json({ 
        error: 'Valid project ID is required',
        code: 'INVALID_PROJECT_ID'
      }, { status: 400 });
    }

    // Mock project existence check
    if (projectId > 5) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    
    const offset = (page - 1) * pageSize;

    // Mock project attachments
    const mockProjectAttachments = [
      {
        id: 3,
        filename: 'project-requirements.pdf',
        storedName: 'project-requirements_03h6opv4g1b9a2d8f7z5y2x6c.pdf',
        path: '/uploads/project-requirements_03h6opv4g1b9a2d8f7z5y2x6c.pdf',
        mime: 'application/pdf',
        size: 1048576,
        issueId: null,
        projectId: 1,
        createdAt: new Date('2024-01-10T11:00:00'),
        uploader: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        }
      },
      {
        id: 5,
        filename: 'ui-mockups.figma',
        storedName: 'ui-mockups_05h8qrx6i3d2e5f0b9g7a4z8e.figma',
        path: '/uploads/ui-mockups_05h8qrx6i3d2e5f0b9g7a4z8e.figma',
        mime: 'application/octet-stream',
        size: 2097152,
        issueId: null,
        projectId: 1,
        createdAt: new Date('2024-01-12T15:30:00'),
        uploader: {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com'
        }
      }
    ];

    // Filter by projectId
    const filteredAttachments = mockProjectAttachments.filter(att => att.projectId === projectId);

    // Apply sorting (mock implementation)
    if (sort === 'filename') {
      filteredAttachments.sort((a, b) => {
        const comparison = a.filename.localeCompare(b.filename);
        return order === 'desc' ? -comparison : comparison;
      });
    } else {
      filteredAttachments.sort((a, b) => {
        const comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return order === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const paginatedAttachments = filteredAttachments.slice(offset, offset + pageSize);
    const totalCount = filteredAttachments.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      data: paginatedAttachments,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

    // TODO: Replace with real database query:
    // const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    // const allAttachments = await paginatedQuery;
  } catch (error) {
    console.error('Error fetching project attachments:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}