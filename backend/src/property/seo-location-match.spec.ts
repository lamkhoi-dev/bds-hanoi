import { PropertyService } from './property.service';

/**
 * `getSeoProperties` — nguồn dữ liệu của mọi trang khu vực (`/xa-can-loc`, `/thanh-pho-vinh`,
 * `/ha-huy-tap-ha-tinh-2`...). Khách báo 12/9: "trong khu vực thỉnh thoảng nó lấy tin của
 * khu vực khác vào". Đo trên site thật trước khi sửa: `/ha-huy-tap-ha-tinh-2` (Phường Hà Huy
 * Tập, Hà Tĩnh) hiện 6 tin — CẢ 6 đều là tin của Phường Hà Huy Tập bên TP Vinh (Nghệ An),
 * vì lọc theo TÊN CHỮ mà 35 tên xã/phường trùng nhau giữa các huyện/tỉnh.
 *
 * Test này khoá đúng 2 điều test thuần `locationMatchWhere` (property-utils.spec) không thấy
 * được: (1) `getSeoProperties` THẬT SỰ gắn `locationMatch` vào filters thay vì tên chữ,
 * (2) khi khu vực chưa có tin thì lùi về tin của khu vực CHA — không lặng lẽ trả trang trắng
 * hay (tệ hơn) lẫn tin khu vực khác vào.
 */

function makeService() {
  const propertyFindMany = jest.fn();
  const propertyCount = jest.fn();
  const locationFindFirst = jest.fn();
  const locationFindUnique = jest.fn();

  const prisma: any = {
    location: { findFirst: locationFindFirst, findUnique: locationFindUnique },
    property: { findMany: propertyFindMany, count: propertyCount },
  };

  const service = new PropertyService(prisma, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
  return { service, prisma, propertyFindMany, propertyCount, locationFindFirst, locationFindUnique };
}

describe('getSeoProperties — lọc khu vực theo MÃ, không theo tên (12/9)', () => {
  it('khu vực có tin: where gửi cho Prisma chứa điều kiện theo wardId, KHÔNG có filters.ward theo tên', async () => {
    const { service, propertyFindMany, propertyCount, locationFindFirst } = makeService();

    locationFindFirst.mockResolvedValue({
      id: 'ward-ha-huy-tap-ht',
      type: 'WARD',
      name: 'Phường Hà Huy Tập',
      parentId: 'district-tp-ha-tinh',
    });
    propertyFindMany.mockResolvedValue([{ id: 'p1' }]);
    propertyCount.mockResolvedValue(1);

    await service.getSeoProperties('tat-ca', 'ha-huy-tap-ha-tinh-2', {});

    // Cuộc gọi ĐẦU TIÊN tới findMany là danh sách chính (không phải VIP).
    const mainWhere = propertyFindMany.mock.calls[0][0].where;
    const mainClauses = mainWhere.AND ?? [];

    // Phải có nhánh khớp ĐÚNG MÃ khu vực...
    expect(mainClauses).toContainEqual(
      expect.objectContaining({ OR: expect.arrayContaining([{ wardId: 'ward-ha-huy-tap-ht' }]) }),
    );
    // ...và KHÔNG được có mệnh đề lọc theo TÊN CHỮ trần trụi (dạng lỗi cũ) — mọi so tên giờ
    // chỉ còn nằm TRONG nhánh dự phòng đã khoanh đúng districtId, không đứng riêng.
    expect(mainClauses).not.toContainEqual({ ward: { startsWith: 'Phường Hà Huy Tập', mode: 'insensitive' } });
  });

  it('khu vực CHƯA CÓ tin: lùi về tin của HUYỆN CHA, cùng loại giao dịch, không lẫn tin bừa', async () => {
    const { service, propertyFindMany, propertyCount, locationFindFirst, locationFindUnique } = makeService();

    locationFindFirst.mockResolvedValue({
      id: 'ward-x',
      type: 'WARD',
      name: 'Phường Hà Huy Tập',
      parentId: 'district-tp-ha-tinh',
    });
    locationFindUnique.mockResolvedValue({
      id: 'district-tp-ha-tinh',
      type: 'DISTRICT',
      name: 'Thành phố Hà Tĩnh',
      urlSegment: 'thanh-pho-ha-tinh',
    });

    // Lần findMany: (1) danh sách chính rỗng, (2) VIP rỗng, (3) UP rỗng, (4) nearby có tin.
    propertyFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'p-gan-do' }]);
    propertyCount.mockResolvedValue(0);

    const result: any = await service.getSeoProperties('tat-ca', 'ha-huy-tap-ha-tinh-2', {
      transactionType: 'BAN',
    });

    expect(result.total).toBe(0); // KHÔNG tự nhận là "có tin của đúng khu vực này".
    expect(result.nearby).toBeTruthy();
    expect(result.nearby.locationName).toBe('Thành phố Hà Tĩnh');
    expect(result.nearby.listings).toEqual([{ id: 'p-gan-do' }]);

    // Truy vấn thứ 4 (nearby) phải khoanh đúng huyện cha và giữ đúng loại giao dịch.
    const nearbyWhere = propertyFindMany.mock.calls[3][0].where;
    const nearbyClauses = nearbyWhere.AND ?? [];
    expect(nearbyClauses).toContainEqual({ districtId: 'district-tp-ha-tinh' });
    expect(nearbyClauses).toContainEqual(expect.objectContaining({ transactionType: expect.anything() }));
  });

  it('khu vực không tồn tại: trả rỗng kèm cờ unknownLocation, không đoán mò lấy tin toàn site', async () => {
    const { service, locationFindFirst, propertyFindMany } = makeService();
    locationFindFirst.mockResolvedValue(null);

    const result: any = await service.getSeoProperties('tat-ca', 'khu-vuc-khong-ton-tai', {});

    expect(result.unknownLocation).toBe('khu-vuc-khong-ton-tai');
    expect(result.total).toBe(0);
    expect(propertyFindMany).not.toHaveBeenCalled();
  });
});
