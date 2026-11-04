import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ['', '/about', '/contact', '/privacy', '/terms', '/login', '/register'].map((p) => ({
    url: `${env.siteUrl}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'weekly' : 'monthly',
    priority: p === '' ? 1 : 0.5,
  }));
}
