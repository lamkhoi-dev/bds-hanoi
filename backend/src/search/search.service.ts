import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: any;
  private propertyIndex: any;

  async onModuleInit() {
    try {
      const module = await eval(`import('meilisearch')`);
      this.client = new module.Meilisearch({
        host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
        apiKey: process.env.MEILISEARCH_KEY || (process.env.NODE_ENV === 'production' ? undefined : 'bds_master_key_123'),
      });
      this.propertyIndex = this.client.index('properties');
      
      await this.propertyIndex.updateFilterableAttributes([
        'transactionType',
        'propertyType',
        'city',
        'district',
        'ward',
        'oldWard',
        'locationId',
        'priceRangeKey',
        'areaRangeKey',
        'priceMin',
        'priceMax',
        'areaMin',
        'areaMax',
        'direction',
        'status',
        'tier',
        'provinceId',
        'districtId',
        'wardId',
        'isNegotiable',
        'deletedAt',
        'propertyCode',
        'slug',
        'price',
        'area'
      ]);
      await this.propertyIndex.updateSortableAttributes([
        'tier',
        'tierRank',
        'priceMin',
        'priceMax',
        'areaMin',
        'areaMax',
        'price',
        'area',
        'pricePerM2',
        'publishedAt',
        'createdAt',
        'pushedAt'
      ]);

      await this.propertyIndex.updateSearchableAttributes([
        'title',
        'propertyCode',
        'address',
        'city',
        'district',
        'ward',
        'oldWard',
        'description'
      ]);

      await this.propertyIndex.updatePagination({ maxTotalHits: 100000 });

      await this.propertyIndex.updateTypoTolerance({
        disableOnAttributes: ['propertyCode']
      });

      await this.propertyIndex.updateSynonyms({
        'chung cư': ['căn hộ', 'apartment', 'cc'],
        'căn hộ': ['chung cư', 'apartment', 'cc'],
        'biệt thự': ['villa', 'nhà vườn', 'bt'],
        'villa': ['biệt thự', 'nhà vườn', 'bt'],
        'mặt tiền': ['mặt phố', 'kinh doanh', 'đường lớn', 'mt'],
        'mặt phố': ['mặt tiền', 'kinh doanh', 'đường lớn', 'mt'],
        'nhà đẹp': ['nhà mới', 'sang trọng', 'hiện đại', 'cao cấp', 'full nội thất', 'nhà xinh', 'dọn vào ở ngay', 'thiết kế đẹp'],
        'nhà trọ': ['phòng trọ', 'cho thuê phòng', 'phòng cho thuê'],
        'phòng trọ': ['nhà trọ', 'cho thuê phòng'],
        'giá rẻ': ['thanh lý', 'cắt lỗ', 'rẻ nhất', 'hạ giá', 'giảm giá', 'đầu tư', 'kẹt tiền', 'bán gấp', 'rẻ', 'ngộp'],
        'bđs': ['bất động sản', 'nhà đất'],
        'bất động sản': ['bđs', 'nhà đất'],
        'nhà đất': ['bđs', 'bất động sản'],
        'ccmn': ['chung cư mini', 'phòng trọ', 'căn hộ dịch vụ', 'chdv'],
        'chdv': ['ccmn', 'chung cư mini', 'căn hộ dịch vụ', 'phòng trọ'],
        'căn hộ dịch vụ': ['chdv', 'ccmn', 'chung cư mini'],
        'chung cư mini': ['ccmn', 'chdv', 'căn hộ dịch vụ'],
        'cấp 4': ['c4', 'nhà cấp 4', 'nhà nát'],
        'c4': ['cấp 4', 'nhà cấp 4', 'nhà nát'],
        'nhà nát': ['cấp 4', 'c4', 'nhà cấp 4'],
        'ngộp': ['bán gấp', 'kẹt tiền', 'cắt lỗ', 'giảm giá', 'thanh lý', 'giá rẻ'],
        'bán gấp': ['ngộp', 'kẹt tiền', 'cắt lỗ'],
        'kẹt tiền': ['ngộp', 'bán gấp', 'cắt lỗ', 'giá rẻ'],
        'view hồ': ['mặt hồ', 'ven hồ', 'nhìn ra hồ'],
        'mặt hồ': ['view hồ', 'ven hồ', 'nhìn ra hồ'],
        'thổ cư': ['đất ở', 'đất xây dựng', 'đất xây nhà'],
        'đất ở': ['thổ cư', 'đất xây dựng', 'đất xây nhà'],
        'nông nghiệp': ['đất vườn', 'đất rẫy', 'đất trồng cây', 'đất sào', 'đất mẫu'],
        'đất vườn': ['nông nghiệp', 'đất rẫy', 'đất trồng cây'],
        'shophouse': ['nhà phố thương mại', 'cửa hàng', 'ki ốt', 'kios', 'mặt bằng kinh doanh'],
        'nhà phố thương mại': ['shophouse', 'cửa hàng', 'ki ốt'],
        'ki ốt': ['shophouse', 'kios', 'cửa hàng', 'mặt bằng'],
        'kios': ['shophouse', 'ki ốt', 'cửa hàng', 'mặt bằng'],
        'mặt bằng': ['cửa hàng', 'shophouse', 'ki ốt', 'kios', 'mặt bằng kinh doanh'],
        'trung tâm': ['tt', 'nội thành'],
        'tt': ['trung tâm', 'nội thành'],
        'nội thành': ['trung tâm', 'tt'],
        'ngoại thành': ['vùng ven', 'ngoại ô'],
        'vùng ven': ['ngoại thành', 'ngoại ô'],
        'hẻm': ['ngõ', 'kiệt'],
        'ngõ': ['hẻm', 'kiệt'],
        'kiệt': ['hẻm', 'ngõ'],
        'hẻm xe hơi': ['hxh', 'ngõ ô tô', 'hẻm ô tô', 'ngõ rộng', 'ô tô đỗ cửa', 'ô tô vào nhà'],
        'hxh': ['hẻm xe hơi', 'ngõ ô tô', 'hẻm ô tô'],
        'ngõ ô tô': ['hẻm xe hơi', 'hxh', 'hẻm ô tô', 'ô tô đỗ cửa'],
        'ô tô đỗ cửa': ['hxh', 'ngõ ô tô', 'hẻm ô tô', 'ô tô vào nhà'],
        'ô tô vào nhà': ['hxh', 'ngõ ô tô', 'hẻm ô tô', 'ô tô đỗ cửa'],
        'chính chủ': ['cc', 'sổ đỏ chính chủ', 'sổ hồng chính chủ', 'không qua trung gian'],
        'phân lô': ['khu phân lô', 'đất nền'],
        'đất nền': ['phân lô', 'đất dự án'],
        'liền kề': ['lk', 'nhà liền kề'],
        'lk': ['liền kề', 'nhà liền kề'],
        'homestay': ['khách sạn', 'hotel', 'nhà nghỉ'],
        'hotel': ['khách sạn', 'nhà nghỉ', 'homestay'],
        'khách sạn': ['hotel', 'nhà nghỉ', 'homestay'],
        'tái định cư': ['tđc'],
        'tđc': ['tái định cư'],
        'sổ đỏ': ['sổ hồng', 'sổ', 'giấy tờ hợp lệ', 'sổ riêng'],
        'sổ hồng': ['sổ đỏ', 'sổ', 'giấy tờ hợp lệ', 'sổ riêng'],
        'vi bằng': ['thừa phát lại', 'giấy tay', 'công chứng vi bằng'],
        'giấy tay': ['vi bằng', 'thừa phát lại'],
        'kho xưởng': ['nhà xưởng', 'xưởng', 'kho bãi', 'đất công nghiệp'],
        'nhà xưởng': ['kho xưởng', 'xưởng', 'kho bãi'],
        'xưởng': ['kho xưởng', 'nhà xưởng', 'kho bãi']
      });

    } catch (error) {
      this.propertyIndex = null;
      console.warn('[SearchService] Meilisearch unavailable. Falling back to database search.', error);
    }
  }

  async addDocuments(documents: any[]) {
    if (!this.propertyIndex) return null;
    const normalizedDocuments = documents.map(document => ({
      ...document,
      tier: document.tier || 'NORMAL',
      tierRank: document.status === 'SOLD' || document.status === 'RENTED' ? 0 : (document.tier === 'VIP' ? 3 : document.tier === 'UP' ? 2 : 1),
      deletedAt: document.deletedAt ? new Date(document.deletedAt).getTime() : null,
      publishedAt: document.publishedAt ? new Date(document.publishedAt).getTime() : null,
      createdAt: document.createdAt ? new Date(document.createdAt).getTime() : null,
      pushedAt: document.pushedAt ? new Date(document.pushedAt).getTime() : null,
      provinceId: document.provinceId || null,
      districtId: document.districtId || null,
      wardId: document.wardId || null,
      isNegotiable: !!document.isNegotiable,
      propertyCode: document.propertyCode || null,
      slug: document.slug || null,
      callClicks: document.callClicks || 0,
      zaloClicks: document.zaloClicks || 0,
    }));
    return this.propertyIndex.addDocuments(normalizedDocuments, { primaryKey: 'id' });
  }

  async addDocument(document: any) {
    if (!this.propertyIndex) return null;
    const normalizedDocument = {
      ...document,
      tier: document.tier || 'NORMAL',
      tierRank: document.status === 'SOLD' || document.status === 'RENTED' ? 0 : (document.tier === 'VIP' ? 3 : document.tier === 'UP' ? 2 : 1),
      deletedAt: document.deletedAt ? new Date(document.deletedAt).getTime() : null,
      publishedAt: document.publishedAt ? new Date(document.publishedAt).getTime() : null,
      createdAt: document.createdAt ? new Date(document.createdAt).getTime() : null,
      pushedAt: document.pushedAt ? new Date(document.pushedAt).getTime() : null,
      provinceId: document.provinceId || null,
      districtId: document.districtId || null,
      wardId: document.wardId || null,
      isNegotiable: !!document.isNegotiable,
      propertyCode: document.propertyCode || null,
      slug: document.slug || null,
      callClicks: document.callClicks || 0,
      zaloClicks: document.zaloClicks || 0,
    };
    return this.propertyIndex.addDocuments([normalizedDocument], { primaryKey: 'id' });
  }

  async deleteDocument(id: string) {
    if (!this.propertyIndex) return null;
    return this.propertyIndex.deleteDocument(id);
  }

  async deleteDocuments(ids: string[]) {
    if (!this.propertyIndex) return null;
    return this.propertyIndex.deleteDocuments(ids);
  }

  async search(query: string, filters?: string[], sort?: string[], page: number = 1, limit: number = 20) {
    if (!this.propertyIndex) {
      throw new Error('Meilisearch index is unavailable');
    }
    const offset = (page - 1) * limit;
    
    // Remove unused words variable
    
    return this.propertyIndex.search(query, {
      filter: filters,
      sort,
      limit,
      offset,
      matchingStrategy: 'last',
    });
  }
}
