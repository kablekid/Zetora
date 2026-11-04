import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: ['/', '/about', '/contact', '/privacy', '/terms'], disallow: ['/admin', '/api', '/dashboard', '/attempts', '/settings'] }],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
