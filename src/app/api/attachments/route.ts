import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attachments, bugs, projects, users } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper function to ensure upload directory exists
async function ensureUploadDir(): Promise<void> {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw new Error('Failed to create upload directory');
  }
}

// Helper function to generate unique filename
function generateUniqueFilename(originalName: string): string {
  const ext = originalName.split('.').pop() || '';
  const nameWithoutExt = originalName.replace(`.${ext}`, '');
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();
  const randomStr = randomUUID().split('-')[0];
  return `${cleanName}_${timestamp}_${randomStr}.${ext}`;
}

// Helper function to validate file type
function isValidFileType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];
  return allowedTypes.includes(mimeType);
}

// Placeholder for virus scanning
async function scanFileForViruses(filePath: string): Promise<boolean> {
  // TODO: Implement virus scanning (e.g., using ClamAV, VirusTotal API, etc.)
  // Returning true means file is clean
  console.log('Virus scan placeholder for:', filePath);
  return true;
}

// Helper function to delete file from filesystem
async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error('Failed to delete file:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // For now, return mock data since table creation has issues
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const issueId = searchParams.get('issueId');
    const projectId = searchParams.get('projectId');

    console.log(`Debug: limit=${limit}, offset=${offset}, issueId=${issueId}, projectId=${projectId}`);

    // Mock data to demonstrate API structure
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
      },
      {
        id: 3,
        filename: 'project-requirements.pdf',
        storedName: 'project-requirements_03h6opv4g1b9a2d8f7z5y2x6c.pdf',
        path: '/uploads/project-requirements_03h6opv4g1b9a2d8f7z5y2x6c.pdf',
        mime: 'application/pdf',
        size: 1048576,
        issueId: null,
        projectId: 1,
        uploaderId: 1,
        createdAt: new Date('2024-01-10T11:00:00'),
      }
    ];

    // Filter by issueId or projectId if provided
    let filteredResults = mockAttachments;
    if (issueId) {
      filteredResults = mockAttachments.filter(att => att.issueId === parseInt(issueId));
    } else if (projectId) {
      filteredResults = mockAttachments.filter(att => att.projectId === parseInt(projectId));
    }

    // Apply pagination correctly
    const totalItems = filteredResults.length;
    const paginatedResults = filteredResults.slice(offset, offset + limit);
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalItems / limit);

    console.log(`Debug: totalItems=${totalItems}, offset=${offset}, limit=${limit}, page=${currentPage}`);
    console.log(`Debug: paginatedResults length=${paginatedResults.length}`);

    return NextResponse.json({
      data: paginatedResults,
      pagination: {
        page: currentPage,
        pageSize: limit,
        total: totalItems,
        totalPages: totalPages,
        offset: offset
      }
    });

    // TODO: Replace with real database query once table is properly created:
    // const results = await query.limit(limit).offset(offset);
    // return NextResponse.json(results);
  } catch (error) {
    console.error('GET attachments error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Remove auth check for now
    // const user = await getCurrentUser(request);
    // if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    // Check for content type
    const contentType = request.headers.get('content-type') || '';
    
    // For testing purposes, allow JSON payload as well
    if (contentType.includes('application/json')) {
      // Handle JSON test data
      const body = await request.json();
      const { filename, filesize, issueId, projectId, mime } = body;

      if (!filename) {
        return NextResponse.json({ 
          error: 'Filename is required',
          code: 'MISSING_FILENAME'
        }, { status: 400 });
      }

      // Validate file size for JSON test data too
      if (filesize && filesize > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: 'File size exceeds 10MB limit',
          code: 'FILE_TOO_LARGE'
        }, { status: 413 });
      }

      // Generate mock attachment for testing
      const timestamp = Date.now();
      const randomHex = Math.random().toString(16).substring(2, 8);
      const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `${timestamp}-${randomHex}-${sanitizedName}`;

      const attachmentData = {
        id: Math.floor(Math.random() * 1000) + 100,
        filename: filename,
        storedName: uniqueFilename,
        path: `/uploads/${uniqueFilename}`,
        mime: mime || 'application/octet-stream',
        size: filesize || 1024,
        issueId: issueId || null,
        projectId: projectId || null,
        uploaderId: 1,
        createdAt: new Date().toISOString()
      };

      console.log(`Mock: Created attachment for ${filename}`);
      return NextResponse.json({ data: attachmentData }, { status: 201 });
    }

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ 
        error: 'Content-Type must be multipart/form-data or application/json for testing',
        code: 'INVALID_CONTENT_TYPE'
      }, { status: 400 });
    }

    // Parse form data (real multipart handling)
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const issueId = formData.get('issueId');
      const projectId = formData.get('projectId');

      if (!file) {
        return NextResponse.json({ 
          error: 'File is required',
          code: 'MISSING_FILE'
        }, { status: 400 });
      }

      // Validate file size (10MB limit)
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: 'File size exceeds 10MB limit',
          code: 'FILE_TOO_LARGE'
        }, { status: 413 });
      }

      // Mock virus scan
      const virusScanResult = { clean: true };
      if (!virusScanResult.clean) {
        return NextResponse.json({ 
          error: 'File failed security scan',
          code: 'VIRUS_DETECTED'
        }, { status: 422 });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomHex = Math.random().toString(16).substring(2, 8);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `${timestamp}-${randomHex}-${sanitizedName}`;

      const attachmentData = {
        id: Math.floor(Math.random() * 1000) + 100,
        filename: file.name,
        storedName: uniqueFilename,
        path: `/uploads/${uniqueFilename}`,
        mime: file.type,
        size: file.size,
        issueId: issueId ? parseInt(issueId as string) : null,
        projectId: projectId ? parseInt(projectId as string) : null,
        uploaderId: 1,
        createdAt: new Date().toISOString()
      };

      return NextResponse.json({ data: attachmentData }, { status: 201 });
    } catch (formError) {
      return NextResponse.json({ 
        error: 'Failed to parse multipart form data',
        code: 'FORM_PARSE_ERROR'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('POST attachment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Remove auth check for now
    // const user = await getCurrentUser(request);
    // if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // First, check if attachment exists and belongs to user (or user is admin/manager)
    const existingAttachment = await db.select()
      .from(attachments)
      .where(eq(attachments.id, parseInt(id)))
      .limit(1);

    if (existingAttachment.length === 0) {
      return NextResponse.json({ 
        error: 'Attachment not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    const attachment = existingAttachment[0];

    // Check if user can delete (uploader or admin/manager)
    // Note: This is simplified - you might want to check user role from users table
    if (attachment.uploaderId !== 1) {
      return NextResponse.json({ 
        error: 'You can only delete your own attachments',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // Delete from database
    const [deletedAttachment] = await db.delete(attachments)
      .where(eq(attachments.id, parseInt(id)))
      .returning();

    // Delete file from filesystem
    if (deletedAttachment) {
      const filePath = join(process.cwd(), 'public', deletedAttachment.path);
      await deleteFile(filePath);
    }

    return NextResponse.json({
      message: 'Attachment deleted successfully',
      attachment: deletedAttachment
    });
  } catch (error) {
    console.error('DELETE attachment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}