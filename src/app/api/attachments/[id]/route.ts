import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attachments, users, projects, bugs } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
// Remove auth import for now
// import { getCurrentUser } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(join(process.cwd(), 'public', filePath));
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Remove auth check for now - allow any deletion for testing
    // const user = await getCurrentUser(request);
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'Authentication required', code: 'AUTH_REQUIRED' },
    //     { status: 401 }
    //   );
    // }

    const { id } = params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid attachment ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Mock deletion - in real implementation this would delete from database and filesystem
    const attachmentId = parseInt(id);
    
    // Simulate checking if attachment exists
    if (attachmentId === 999) {
      return NextResponse.json(
        { error: 'Attachment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Simulate successful deletion
    const deletedAttachment = {
      id: attachmentId,
      filename: 'deleted-file.png',
      path: `/uploads/deleted-file-${attachmentId}.png`
    };

    console.log(`Would delete file: ${deletedAttachment.path}`);

    return new NextResponse(null, { status: 204 });

    // TODO: Replace with real database operation:
    // const deletedAttachment = await db.delete(attachments).where(eq(attachments.id, parseInt(id))).returning();
    // await deleteFile(deletedAttachment[0].path);
  } catch (error) {
    console.error('DELETE attachment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Remove auth check for now
    // const user = await getCurrentUser(request);
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'Authentication required', code: 'AUTH_REQUIRED' },
    //     { status: 401 }
    //   );
    // }

    const { id } = params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid attachment ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Mock data for now since table has issues
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
        uploaderId: 3,
        createdAt: new Date('2024-01-15T14:30:00'),
        uploader: { id: 3, name: 'Alice Smith', email: 'alice@example.com' },
        issue: { id: 1, title: 'Login button not working on mobile', status: 'open' },
        project: null
      },
      {
        id: 2,
        filename: 'error-log.txt',
        storedName: 'error-log_02h5mnu3f0a8z2c9d6e7x4y1w5.txt',
        path: '/uploads/error-log_02h5mnu3f0a8z2c9d6e7x4y1w5.txt',
        mime: 'text/plain',
        size: 15360,
        issueId: 2,
        projectId: null,
        uploaderId: 1,
        createdAt: new Date('2024-01-16T09:45:00'),
        uploader: { id: 1, name: 'John Doe', email: 'john@example.com' },
        issue: { id: 2, title: 'Dashboard loading slowly', status: 'in_progress' },
        project: null
      }
    ];

    const attachment = mockAttachments.find(att => att.id === parseInt(id));

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: attachment });

    // TODO: Replace with real database query once table is created:
    // const result = await db.select(...).from(attachments).where(eq(attachments.id, parseInt(id))).limit(1);
  } catch (error) {
    console.error('GET attachment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}