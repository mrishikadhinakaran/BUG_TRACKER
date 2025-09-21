import { db } from '@/db';
import { attachments } from '@/db/schema';

async function main() {
    const sampleAttachments = [
        {
            filename: 'screenshot-login-error.png',
            storedName: 'screenshot-login-error_01h4kxt2e8z9y3b1n7m6q5w8r4.png',
            path: '/uploads/issues/2024/01/screenshot-login-error_01h4kxt2e8z9y3b1n7m6q5w8r4.png',
            mime: 'image/png',
            size: 245760,
            issueId: 1,
            projectId: null,
            uploaderId: 3,
            createdAt: new Date('2024-01-15T14:30:00'),
        },
        {
            filename: 'error-log.txt',
            storedName: 'error-log_02h5mnu3f0a8z2c9d6e7x4y1w5.txt',
            path: '/uploads/issues/2024/01/error-log_02h5mnu3f0a8z2c9d6e7x4y1w5.txt',
            mime: 'text/plain',
            size: 15360,
            issueId: 2,
            projectId: null,
            uploaderId: 5,
            createdAt: new Date('2024-01-16T09:45:00'),
        },
        {
            filename: 'project-requirements.pdf',
            storedName: 'project-requirements_03h6opv4g1b9a2d8f7z5y2x6c.docx',
            path: '/uploads/projects/2024/01/project-requirements_03h6opv4g1b9a2d8f7z5y2x6c.pdf',
            mime: 'application/pdf',
            size: 1048576,
            issueId: null,
            projectId: 1,
            uploaderId: 1,
            createdAt: new Date('2024-01-10T11:00:00'),
        },
        {
            filename: 'crash-report.json',
            storedName: 'crash-report_04h7pqw5h2c1b3e9a8f6z3y7d.json',
            path: '/uploads/issues/2024/01/crash-report_04h7pqw5h2c1b3e9a8f6z3y7d.json',
            mime: 'application/json',
            size: 51200,
            issueId: 3,
            projectId: null,
            uploaderId: 4,
            createdAt: new Date('2024-01-18T16:20:00'),
        },
        {
            filename: 'ui-mockup.svg',
            storedName: 'ui-mockup_05h8qrx6i3d2e5f0b9g7a4z8e.svg',
            path: '/uploads/issues/2024/01/ui-mockup_05h8qrx6i3d2e5f0b9g7a4z8e.svg',
            mime: 'image/svg+xml',
            size: 98304,
            issueId: 4,
            projectId: null,
            uploaderId: 2,
            createdAt: new Date('2024-01-20T13:15:00'),
        },
        {
            filename: 'performance-test-results.xlsx',
            storedName: 'performance-test-results_06i9sry7j4f3g6h1c0d5b9a2f.xlsx',
            path: '/uploads/projects/2024/01/performance-test-results_06i9sry7j4f3g6h1c0d5b9a2f.xlsx',
            mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 524288,
            issueId: null,
            projectId: 2,
            uploaderId: 6,
            createdAt: new Date('2024-01-22T10:30:00'),
        },
        {
            filename: 'bug-screenshot-2.jpg',
            storedName: 'bug-screenshot-2_07j0tsz8k5g4h7i2e1f6c0b3g.jpg',
            path: '/uploads/issues/2024/01/bug-screenshot-2_07j0tsz8k5g4h7i2e1f6c0b3g.jpg',
            mime: 'image/jpeg',
            size: 184320,
            issueId: 5,
            projectId: null,
            uploaderId: 3,
            createdAt: new Date('2024-01-25T15:45:00'),
        },
        {
            filename: 'deployment-guide.md',
            storedName: 'deployment-guide_08k1uta9l6h5i8j3f2g7d1c4h.md',
            path: '/uploads/projects/2024/01/deployment-guide_08k1uta9l6h5i8j3f2g7d1c4h.md',
            mime: 'text/markdown',
            size: 30720,
            issueId: null,
            projectId: 3,
            uploaderId: 1,
            createdAt: new Date('2024-01-12T08:00:00'),
        },
    ];

    await db.insert(attachments).values(sampleAttachments);
    
    console.log('✅ Attachments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});