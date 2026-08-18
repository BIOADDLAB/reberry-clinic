import type { MetadataRoute } from 'next';
import { site } from '@/components/lib/site';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/'],
            },
            {
                userAgent: 'Yeti',
                allow: '/',
                disallow: ['/admin/', '/api/'],
            },
        ],
        sitemap: `${site.url}/sitemap.xml`,
        host: site.url,
    };
}
