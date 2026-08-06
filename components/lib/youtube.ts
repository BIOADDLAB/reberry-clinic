export interface YouTubeVideo {
    id: string;
    title: string;
    url: string;
    thumbnailUrl: string;
    publishedAt: string;
}

const decodeXml = (value: string) =>
    value
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

const getTagValue = (source: string, tag: string) => {
    const match = source.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
    return match?.[1]?.trim() ?? '';
};

export async function fetchLatestYouTubeVideos(channelId: string, count = 3): Promise<YouTubeVideo[]> {
    try {
        const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
            next: { revalidate: 60 * 60 },
        });
        if (!response.ok) return [];

        const xml = await response.text();
        const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

        return entries
            .map((entry): YouTubeVideo | null => {
                const id = getTagValue(entry, 'yt:videoId');
                if (!id) return null;

                return {
                    id,
                    title: decodeXml(getTagValue(entry, 'title')),
                    url: `https://www.youtube.com/watch?v=${id}`,
                    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                    publishedAt: getTagValue(entry, 'published'),
                };
            })
            .filter((video): video is YouTubeVideo => video !== null)
            .slice(0, count);
    } catch (error) {
        console.error('[youtube] RSS feed fetch failed', error);
        return [];
    }
}
