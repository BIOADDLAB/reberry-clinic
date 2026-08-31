import { NextResponse } from 'next/server';
import { syncNaverBlogSkinColumns } from '@/components/lib/skinColumnBlogSync';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorizedCron(request: Request) {
    const cronSecret = process.env.CRON_SECRET;
    const authorization = request.headers.get('authorization');
    if (cronSecret) return authorization === `Bearer ${cronSecret}`;
    return request.headers.get('user-agent')?.includes('vercel-cron') === true;
}

export async function GET(request: Request) {
    if (!isAuthorizedCron(request)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    try {
        const result = await syncNaverBlogSkinColumns();
        return NextResponse.json(result);
    } catch (error) {
        console.error('[cron/sync-blog-columns] failed', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'sync failed' },
            { status: 500 },
        );
    }
}
