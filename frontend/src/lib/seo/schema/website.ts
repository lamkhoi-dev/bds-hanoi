import { siteConfig } from '@/lib/site-config';
import { ORGANIZATION_ID } from './organization';
import type { JsonLdNode } from './types';

export const WEBSITE_ID = siteConfig.absolute('/#website');

/**
 * WebSite + SearchAction. Route `/search` đã nhận tham số `q` nên không cần thêm
 * endpoint mới — chỉ khai báo để Google nhận diện ô tìm kiếm của site.
 */
export function buildWebSite(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: siteConfig.absolute('/'),
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: 'vi-VN',
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: siteConfig.absolute('/search?q={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
