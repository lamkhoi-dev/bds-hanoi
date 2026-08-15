import { applyProjectLocation } from './property-utils';

/**
 * Copy địa điểm từ Project sang Property lúc đăng tin (mục 9, 13 PHẦN I).
 *
 * Ca dễ vỡ nhất: client gửi `projectId: ''` (bỏ chọn dự án, hoặc đổi loại BĐS ra khỏi
 * DU_AN lúc sửa tin) — phải ghi NULL tường minh. Nếu chỉ trả nguyên `data` như cũ,
 * chuỗi rỗng lọt xuống Prisma sẽ vỡ ràng buộc khoá ngoại vì '' không khớp NULL cũng
 * không khớp dự án nào.
 */

const VISIBLE_PROJECT = {
  id: 'proj-1',
  status: 'VISIBLE',
  city: 'Nghệ An',
  district: 'Vinh',
  ward: 'Vinh Phú',
  oldWard: null,
  provinceId: 'prov-1',
  districtId: 'dist-1',
  wardId: 'ward-1',
};

function makePrisma(project: any) {
  return { project: { findUnique: jest.fn().mockResolvedValue(project) } };
}

describe('applyProjectLocation', () => {
  it('projectId rỗng ("") -> ghi NULL tường minh, không để lọt chuỗi rỗng xuống Prisma', async () => {
    const prisma = makePrisma(null);
    const result = await applyProjectLocation(prisma as any, { title: 'Tin A', projectId: '' });
    expect(result.projectId).toBeNull();
    expect(prisma.project.findUnique).not.toHaveBeenCalled();
  });

  it('không có key projectId -> giữ nguyên data, không thêm key mới', async () => {
    const prisma = makePrisma(null);
    const result = await applyProjectLocation(prisma as any, { title: 'Tin A' });
    expect('projectId' in result).toBe(false);
  });

  it('chọn dự án VISIBLE -> copy đè cả 7 trường địa điểm, bỏ qua địa điểm client gửi', async () => {
    const prisma = makePrisma(VISIBLE_PROJECT);
    const result = await applyProjectLocation(prisma as any, {
      title: 'Tin B',
      projectId: 'proj-1',
      // Client vẫn gửi địa điểm khác dự án (giả mạo hoặc field khoá bị bypass) -- phải
      // bị ghi đè hoàn toàn bởi địa điểm THẬT của dự án.
      city: 'Hà Nội',
      district: 'Cầu Giấy',
      ward: 'Dịch Vọng',
      wardId: 'ward-gia-mao',
    });
    expect(result).toMatchObject({
      projectId: 'proj-1',
      city: 'Nghệ An',
      district: 'Vinh',
      ward: 'Vinh Phú',
      oldWard: null,
      provinceId: 'prov-1',
      districtId: 'dist-1',
      wardId: 'ward-1',
    });
  });

  it('dự án không tồn tại hoặc đã ẩn -> bỏ hẳn key projectId, tin vẫn đăng bình thường', async () => {
    const prisma = makePrisma(null);
    const result = await applyProjectLocation(prisma as any, {
      title: 'Tin C',
      projectId: 'proj-khong-ton-tai',
      city: 'Nghệ An',
    });
    expect('projectId' in result).toBe(false);
    expect(result.city).toBe('Nghệ An');
  });

  it('dự án HIDDEN -> không được cấp làm chủ địa điểm cho tin đăng', async () => {
    const prisma = makePrisma({ ...VISIBLE_PROJECT, status: 'HIDDEN' });
    const result = await applyProjectLocation(prisma as any, { title: 'Tin D', projectId: 'proj-1' });
    expect('projectId' in result).toBe(false);
  });
});
