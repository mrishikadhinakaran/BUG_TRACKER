import { db } from '@/db';
import { comments } from '@/db/schema';

async function main() {
    const sampleComments = [
        {
            bugId: 1,
            authorId: 3,
            body: "I can reproduce this issue. It seems to be related to the touch event handlers. Looking into it now.",
            createdAt: new Date('2024-01-15T10:30:00').toISOString(),
            updatedAt: new Date('2024-01-15T10:30:00').toISOString(),
        },
        {
            bugId: 1,
            authorId: 2,
            body: "This might be connected to the recent iOS Safari update. We should test on different mobile browsers.",
            createdAt: new Date('2024-01-15T11:45:00').toISOString(),
            updatedAt: new Date('2024-01-15T11:45:00').toISOString(),
        },
        {
            bugId: 2,
            authorId: 3,
            body: "Found the issue - there's a race condition in the async data loading. Working on a fix.",
            createdAt: new Date('2024-01-16T09:15:00').toISOString(),
            updatedAt: new Date('2024-01-16T09:15:00').toISOString(),
        },
        {
            bugId: 2,
            authorId: 1,
            body: "Priority is high since this affects user onboarding experience.",
            createdAt: new Date('2024-01-16T14:20:00').toISOString(),
            updatedAt: new Date('2024-01-16T14:20:00').toISOString(),
        },
        {
            bugId: 3,
            authorId: 2,
            body: "Checking server logs now. Appears to happen during concurrent authentication requests.",
            createdAt: new Date('2024-01-17T16:30:00').toISOString(),
            updatedAt: new Date('2024-01-17T16:30:00').toISOString(),
        },
        {
            bugId: 4,
            authorId: 1,
            body: "Implemented connection pooling and query optimization. Should be resolved now.",
            createdAt: new Date('2024-01-18T08:45:00').toISOString(),
            updatedAt: new Date('2024-01-18T08:45:00').toISOString(),
        },
        {
            bugId: 5,
            authorId: 3,
            body: "Fixed the typo and deployed to production. Closing this ticket.",
            createdAt: new Date('2024-01-19T11:00:00').toISOString(),
            updatedAt: new Date('2024-01-19T11:00:00').toISOString(),
        },
        {
            bugId: 6,
            authorId: 2,
            body: "Testing the new rate limiting middleware in staging environment first.",
            createdAt: new Date('2024-01-20T15:30:00').toISOString(),
            updatedAt: new Date('2024-01-20T15:30:00').toISOString(),
        }
    ];

    await db.insert(comments).values(sampleComments);
    
    console.log('✅ Comments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});