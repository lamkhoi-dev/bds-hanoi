import { siteConfig } from '@/lib/site-config';
import { toMediaUrl } from '@/lib/media';
import { ORGANIZATION_ID } from './organization';
import { WEBSITE_ID } from './website';
import type { JsonLdNode } from './types';

export interface ArticleSchemaOptions {
  url: string;
  description: string;
}

export function buildArticle(news: any, opts: ArticleSchemaOptions): JsonLdNode {
  const thumb = typeof news?.thumbnail === 'string' ? toMediaUrl(news.thumbnail) : '';
  const image = thumb ? siteConfig.absolute(thumb) : '';
  // Google khuyến nghị headline không quá 110 ký tự.
  const headline = String(news?.title ?? '').slice(0, 110);

  return {
    '@type': 'Article',
    '@id': `${opts.url}#article`,
    headline,
    description: opts.description,
    url: opts.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    inLanguage: 'vi-VN',
    ...(image ? { image: [image] } : {}),
    ...(news?.createdAt ? { datePublished: news.createdAt } : {}),
    ...(news?.updatedAt ? { dateModified: news.updatedAt } : {}),
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}
