/**
 * Dữ liệu MẪU cho site Hà Nội (staging) — dùng bởi `seed-demo-hanoi.ts`.
 *
 * Toàn bộ là NỘI DUNG GIẢ LẬP để thử nghiệm giao diện: giá, diện tích, số điện thoại
 * (`0900 000 00x`), người đăng (`*@demo.invalid`) đều không có thật. Tên dự án/khu đô thị
 * nêu theo tên gọi công khai chỉ để khớp khối "Khu vực hot"/"Dự án" trên trang chủ.
 * KHÔNG nạp vào site chạy thật — script từ chối chạy khi `APP_ENV` khác `staging`.
 */

export const ty = (n: number) => Math.round(n * 1_000_000_000);
export const tr = (n: number) => Math.round(n * 1_000_000);

export type ImgRecipe = 'house' | 'apt' | 'land' | 'shop' | 'project' | 'farm';
export type PType = 'DAT_NEN' | 'NHA_RIENG' | 'BIET_THU' | 'CHUNG_CU' | 'MAT_BANG' | 'DU_AN' | 'BDS_KHAC';

export interface DemoListing {
  title: string;
  txn: 'BAN' | 'CHO_THUE';
  type: PType;
  district: string;
  ward: string;
  oldWard?: string;
  street?: string;
  price: number;
  area: number;
  bed?: number;
  bath?: number;
  floors?: number;
  front?: number;
  road?: number;
  dir?: string;
  legal?: string;
  furn?: string;
  tier?: 'VIP' | 'UP';
  /** Khoá dự án trong PROJECTS. */
  project?: string;
  /** 0..3 = chỉ số trong AGENTS. */
  agent: number;
  /** Đăng cách đây bao nhiêu ngày. */
  days: number;
  img: ImgRecipe;
  nImg?: number;
  negotiable?: boolean;
  /** Câu bổ sung cuối phần vị trí — chỗ để cài từ khoá khu vực hot khớp đúng cụm từ. */
  note?: string;
}

export const AGENTS = [
  { email: 'demo.minh@demo.invalid', name: 'Nguyễn Văn Minh', phone: '0900000001', bio: 'Môi giới khu vực Cầu Giấy, Nam Từ Liêm, Thanh Xuân. Tư vấn miễn phí, xem nhà mọi khung giờ.' },
  { email: 'demo.huong@demo.invalid', name: 'Trần Thị Hương', phone: '0900000002', bio: 'Chuyên nhà phố và chung cư khu vực Hoàng Mai, Hà Đông, Hai Bà Trưng.' },
  { email: 'demo.huy@demo.invalid', name: 'Lê Quang Huy', phone: '0900000003', bio: 'Đất nền, nhà phố Long Biên, Gia Lâm, Đông Anh và các huyện ngoại thành.' },
  { email: 'demo.trang@demo.invalid', name: 'Phạm Thu Trang', phone: '0900000004', bio: 'Bất động sản cao cấp Tây Hồ, Ba Đình, Hoàn Kiếm và các đại đô thị.' },
] as const;

/** Toạ độ tâm quận/huyện (xấp xỉ) — chỉ để ghim bản đồ, cộng thêm độ lệch nhỏ theo từng tin. */
export const DISTRICT_CENTER: Record<string, [number, number]> = {
  'Quận Cầu Giấy': [21.033, 105.793], 'Quận Nam Từ Liêm': [21.008, 105.76], 'Quận Bắc Từ Liêm': [21.07, 105.76],
  'Quận Hà Đông': [20.955, 105.769], 'Quận Thanh Xuân': [20.993, 105.806], 'Quận Hoàng Mai': [20.975, 105.86],
  'Quận Tây Hồ': [21.07, 105.82], 'Quận Đống Đa': [21.015, 105.827], 'Quận Hai Bà Trưng': [21.005, 105.856],
  'Quận Ba Đình': [21.035, 105.82], 'Quận Hoàn Kiếm': [21.0285, 105.852], 'Quận Long Biên': [21.045, 105.89],
  'Huyện Gia Lâm': [21.03, 105.94], 'Huyện Đông Anh': [21.135, 105.85], 'Huyện Hoài Đức': [21.05, 105.71],
  'Huyện Thanh Trì': [20.935, 105.85], 'Huyện Sóc Sơn': [21.26, 105.85], 'Huyện Thạch Thất': [21.01, 105.53],
};

/** Vài câu về vị trí theo quận/huyện — chỉ nêu địa danh, tuyến đường công khai. */
export const DISTRICT_FACTS: Record<string, string[]> = {
  'Quận Cầu Giấy': ['Khu vực nhiều trường đại học, công viên và trung tâm thương mại; di chuyển sang Mỹ Đình, Tây Hồ hay vào trung tâm đều thuận tiện.', 'Gần công viên Cầu Giấy, Big C Thăng Long và các tuyến buýt về trung tâm thành phố.'],
  'Quận Nam Từ Liêm': ['Cạnh khu Mỹ Đình, gần Sân vận động Quốc gia và trục đường Lê Đức Thọ, Đại lộ Thăng Long.', 'Hạ tầng đồng bộ, nhiều trường học và siêu thị trong bán kính vài trăm mét.'],
  'Quận Bắc Từ Liêm': ['Gần công viên Hòa Bình, trục Phạm Văn Đồng thông ra cầu Thăng Long và Nhật Tân.', 'Khu dân cư lâu năm, đủ tiện ích: chợ, trường học, phòng khám.'],
  'Quận Hà Đông': ['Gần Aeon Mall Hà Đông, đường Quang Trung – Tố Hữu và tuyến metro Cát Linh – Hà Đông.', 'Dân cư đông, đủ trường học các cấp và bệnh viện trong bán kính ngắn.'],
  'Quận Thanh Xuân': ['Gần Royal City, phố Nguyễn Trãi và các trường đại học lớn.', 'Nhiều tuyến buýt, kết nối nhanh về Ngã Tư Sở, Đống Đa và khu Mỹ Đình.'],
  'Quận Hoàng Mai': ['Gần Linh Đàm, Times City, đường Giải Phóng và Tam Trinh.', 'Khu dân cư sôi động, nhiều chung cư và tiện ích thương mại.'],
  'Quận Tây Hồ': ['Cạnh Hồ Tây, gần phố Xuân Diệu, đường Võ Chí Công thông ra cầu Nhật Tân.', 'Không gian xanh, yên tĩnh nhưng vẫn gần trung tâm.'],
  'Quận Đống Đa': ['Gần Ô Chợ Dừa, Văn Miếu, phố Láng Hạ và Thái Hà.', 'Trung tâm hành chính – thương mại lâu năm, đủ đầy tiện ích.'],
  'Quận Hai Bà Trưng': ['Gần Times City, phố Minh Khai và bệnh viện Bạch Mai.', 'Giao thông thuận lợi vào phố cổ, hồ Gươm và các quận lân cận.'],
  'Quận Ba Đình': ['Gần Hồ Tây, Lăng Chủ tịch Hồ Chí Minh và các phố Liễu Giai, Đội Cấn.', 'Khu vực trung tâm, an ninh tốt, dân trí cao.'],
  'Quận Hoàn Kiếm': ['Gần hồ Gươm, phố cổ và Nhà hát Lớn.', 'Vị trí trung tâm bậc nhất, thuận lợi kinh doanh du lịch – lưu trú.'],
  'Quận Long Biên': ['Gần Aeon Mall Long Biên, Vincom Plaza và cầu Chương Dương, Vĩnh Tuy.', 'Nhiều khu đô thị mới, không khí thoáng, giá tốt hơn nội thành.'],
  'Huyện Gia Lâm': ['Gần Vinhomes Ocean Park, Đại học Nông nghiệp và quốc lộ 5.', 'Khu vực đang phát triển nhanh, hạ tầng đường sá liên tục được mở rộng.'],
  'Huyện Đông Anh': ['Gần khu di tích Cổ Loa, đường Võ Nguyên Giáp và sân bay Nội Bài.', 'Quỹ đất lớn, tiềm năng tăng giá theo quy hoạch phía Bắc sông Hồng.'],
  'Huyện Hoài Đức': ['Gần Đại lộ Thăng Long, khu đô thị An Khánh và đường Lê Trọng Tấn.', 'Nhiều khu đô thị đồng bộ hạ tầng, phù hợp ở thực và đầu tư.'],
  'Huyện Thanh Trì': ['Gần quốc lộ 1A, đường Vành đai 3 và khu đô thị Đại Thanh.', 'Kết nối nhanh vào nội thành qua trục Ngọc Hồi – Giải Phóng.'],
  'Huyện Sóc Sơn': ['Gần sân bay Nội Bài, núi Sóc và hồ Đồng Quan.', 'Không khí trong lành, phù hợp làm nhà vườn, nghỉ dưỡng cuối tuần.'],
  'Huyện Thạch Thất': ['Gần Khu công nghệ cao Hòa Lạc và Đại lộ Thăng Long.', 'Quỹ đất rộng, giá mềm, phù hợp đầu tư dài hạn.'],
};

// ---------------------------------------------------------------------------
// Các tin ĐÃ CÓ sẵn (18 tin mẫu ban đầu) — chỉ bổ sung chi tiết, KHÔNG đổi tiêu đề/giá/diện tích/địa điểm.
// ---------------------------------------------------------------------------
export interface ExistingPatch {
  street?: string;
  bed?: number | null;
  bath?: number | null;
  floors?: number | null;
  front?: number;
  road?: number;
  dir?: string;
  legal?: string;
  furn?: string;
  tier?: 'VIP' | 'UP';
  project?: string;
  agent: number;
  days: number;
  img: ImgRecipe;
  nImg?: number;
  note?: string;
}

export const EXISTING: Record<string, ExistingPatch> = {
  'Bán đất nền Cầu Giấy, view đẹp, sổ đỏ chính chủ': { street: 'Ngõ 120 Trần Thái Tông', bed: null, bath: null, front: 4.5, road: 6, dir: 'Đông Nam', legal: 'Có sổ đỏ', agent: 0, days: 6, img: 'land' },
  'Bán nhà riêng Hà Đông 4 tầng mặt tiền rộng': { street: 'Đường Quang Trung', bed: 4, bath: 4, floors: 4, front: 5, road: 10, dir: 'Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 1, days: 11, img: 'house' },
  'Bán nhà riêng Thanh Xuân, ngõ ô tô, kinh doanh tốt': { street: 'Ngõ 82 Nguyễn Trãi', bed: 4, bath: 4, floors: 5, front: 4, road: 6, dir: 'Tây Nam', legal: 'Có sổ đỏ', furn: 'Đầy đủ', tier: 'UP', agent: 0, days: 3, img: 'house' },
  'Bán nhà riêng Long Biên gần cầu Chương Dương': { street: 'Phố Ngọc Lâm', bed: 4, bath: 3, floors: 4, front: 4, road: 5, dir: 'Đông', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 2, days: 14, img: 'house' },
  'Bán chung cư Hoàng Mai 2PN full nội thất': { street: 'Khu đô thị Linh Đàm', bed: 2, bath: 2, dir: 'Đông Nam', legal: 'Đầy đủ', furn: 'Đầy đủ', tier: 'UP', agent: 1, days: 4, img: 'apt' },
  'Bán chung cư view hồ Tây, 3PN, sổ hồng lâu dài': { street: 'Đường Xuân La', bed: 3, bath: 2, dir: 'Đông Bắc', legal: 'Đầy đủ', furn: 'Đầy đủ', tier: 'VIP', agent: 3, days: 1, img: 'apt', note: 'Căn hộ nhìn trọn Hồ Tây, buổi chiều đón gió mát và hoàng hôn.' },
  'Bán mặt bằng kinh doanh Gia Lâm mặt đường lớn': { street: 'Quốc lộ 5, thị trấn Trâu Quỳ', bed: null, bath: null, front: 8, road: 20, dir: 'Nam', legal: 'Có sổ đỏ', agent: 2, days: 9, img: 'shop' },
  'Bán trang trại Đông Anh diện tích lớn': { street: 'Xã Kim Nỗ', bed: null, bath: null, front: 30, road: 6, dir: 'Đông', legal: 'Có hợp đồng', agent: 2, days: 17, img: 'farm' },
  'Cho thuê nhà riêng Cầu Giấy full đồ, gần Big C': { street: 'Ngõ 165 Cầu Giấy', bed: 4, bath: 3, floors: 4, front: 4, road: 4, dir: 'Nam', furn: 'Đầy đủ', agent: 0, days: 5, img: 'house' },
  'Cho thuê chung cư view hồ Tây 2PN': { street: 'Đường Âu Cơ', bed: 2, bath: 2, dir: 'Tây Bắc', furn: 'Đầy đủ', agent: 3, days: 7, img: 'apt', note: 'Cửa sổ lớn nhìn ra Hồ Tây.' },
  'Cho thuê mặt bằng kinh doanh Gia Lâm': { street: 'Đường Ngô Xuân Quảng', bed: null, bath: null, front: 6, road: 12, agent: 2, days: 10, img: 'shop' },
  'Cho thuê kho bãi đất trống Nam Từ Liêm': { street: 'Đường Tân Xuân', bed: null, bath: null, front: 20, road: 10, agent: 0, days: 15, img: 'land' },
  'Cho thuê homestay Sóc Sơn view núi': { street: 'Xã Minh Phú', bed: 8, bath: 8, floors: 2, dir: 'Nam', furn: 'Đầy đủ', agent: 2, days: 12, img: 'farm' },
  'Bán shophouse Vinhomes Ocean Park Mẫu': { street: 'Khu đô thị Vinhomes Ocean Park', bed: 3, bath: 3, floors: 4, front: 6, road: 20, dir: 'Đông Nam', legal: 'Đầy đủ', furn: 'Cơ bản', tier: 'VIP', project: 'ocean', agent: 2, days: 2, img: 'project' },
  'Bán căn hộ Times City Mẫu 2PN': { street: 'Khu đô thị Times City', bed: 2, bath: 2, dir: 'Đông Nam', legal: 'Đầy đủ', furn: 'Cơ bản', project: 'times', agent: 1, days: 8, img: 'apt' },
  'Bán liền kề Vinhomes Smart City Mẫu': { street: 'Khu đô thị Vinhomes Smart City', bed: 4, bath: 4, floors: 4, front: 5, road: 12, dir: 'Tây Nam', legal: 'Đầy đủ', project: 'smart', agent: 0, days: 6, img: 'house' },
  'Bán biệt thự Ecopark Mẫu view hồ': { street: 'Khu đô thị Ecopark', bed: 5, bath: 5, floors: 3, front: 10, road: 14, dir: 'Đông', legal: 'Đầy đủ', furn: 'Đầy đủ', tier: 'VIP', project: 'eco', agent: 3, days: 3, img: 'project' },
  'Bán nhà Mộ Lao Hà Đông xã cũ mẫu': { street: 'Phố Mộ Lao', bed: 3, bath: 3, floors: 4, front: 4, road: 5, dir: 'Đông Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 1, days: 13, img: 'house' },
};

// ---------------------------------------------------------------------------
// Tin MỚI
// ---------------------------------------------------------------------------
export const LISTINGS: DemoListing[] = [
  // ---- Cầu Giấy
  { title: 'Bán nhà mặt phố Trung Kính 6 tầng thang máy, kinh doanh sầm uất', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Cầu Giấy', ward: 'Phường Yên Hòa', street: 'Phố Trung Kính', price: ty(16.8), area: 48, bed: 5, bath: 5, floors: 6, front: 4.5, road: 12, dir: 'Đông Nam', legal: 'Có sổ đỏ', furn: 'Đầy đủ', tier: 'VIP', agent: 0, days: 2, img: 'house', note: 'Nằm ngay phố Trung Kính, dòng khách thuê ổn định quanh năm.' },
  { title: 'Bán nhà 5 tầng ngõ ô tô phố Hoa Bằng, gần công viên Cầu Giấy', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Cầu Giấy', ward: 'Phường Yên Hòa', street: 'Phố Hoa Bằng', price: ty(11.5), area: 52, bed: 4, bath: 4, floors: 5, front: 5, road: 5, dir: 'Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', tier: 'UP', agent: 0, days: 4, img: 'house' },
  { title: 'Cho thuê căn hộ 2PN Dịch Vọng Hậu gần Đại học Quốc gia, full nội thất', txn: 'CHO_THUE', type: 'CHUNG_CU', district: 'Quận Cầu Giấy', ward: 'Phường Cầu Giấy', oldWard: 'Dịch Vọng', street: 'Đường Trần Thái Tông', price: tr(13), area: 68, bed: 2, bath: 2, dir: 'Đông', furn: 'Đầy đủ', agent: 0, days: 3, img: 'apt' },
  { title: 'Cho thuê văn phòng mặt phố Duy Tân 80m², sàn thông, có thang máy', txn: 'CHO_THUE', type: 'MAT_BANG', district: 'Quận Cầu Giấy', ward: 'Phường Cầu Giấy', street: 'Phố Duy Tân', price: tr(28), area: 80, front: 6, road: 14, agent: 0, days: 6, img: 'shop' },
  // ---- Nam Từ Liêm
  { title: 'Bán căn hộ 3PN Keangnam Landmark, view Mỹ Đình thoáng đãng', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Nam Từ Liêm', ward: 'Phường Từ Liêm', oldWard: 'Mễ Trì', street: 'Đường Phạm Hùng', price: ty(7.9), area: 118, bed: 3, bath: 2, dir: 'Tây Nam', legal: 'Đầy đủ', furn: 'Đầy đủ', tier: 'VIP', agent: 0, days: 1, img: 'apt', note: 'Tòa Keangnam nằm ngay đường Phạm Hùng, gần Sân vận động Quốc gia.' },
  { title: 'Bán căn hộ 2PN Vinhomes Smart City Tây Mỗ, nội thất liền tường', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Nam Từ Liêm', ward: 'Phường Tây Mỗ', street: 'Khu đô thị Vinhomes Smart City', price: ty(3.4), area: 59, bed: 2, bath: 1, dir: 'Đông Bắc', legal: 'Đầy đủ', furn: 'Cơ bản', project: 'smart', agent: 1, days: 2, img: 'apt' },
  { title: 'Bán nhà liền kề Mỹ Đình 2 xây 5 tầng, ô tô tránh, kinh doanh tốt', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Nam Từ Liêm', ward: 'Phường Từ Liêm', street: 'Đường Nguyễn Cơ Thạch', price: ty(14.2), area: 60, bed: 5, bath: 4, floors: 5, front: 5, road: 13, dir: 'Đông Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', tier: 'VIP', agent: 0, days: 5, img: 'house', note: 'Khu Mỹ Đình 2 đông dân, dịch vụ ăn uống – cà phê sầm uất.' },
  { title: 'Cho thuê chung cư The Manor 3PN, nội thất cao cấp', txn: 'CHO_THUE', type: 'CHUNG_CU', district: 'Quận Nam Từ Liêm', ward: 'Phường Từ Liêm', street: 'Đường Mễ Trì', price: tr(22), area: 110, bed: 3, bath: 2, dir: 'Đông Nam', furn: 'Đầy đủ', agent: 3, days: 7, img: 'apt', note: 'Khu The Manor an ninh 24/7, gần Sân vận động Quốc gia.' },
  { title: 'Bán đất nền Xuân Phương 50m², ô tô đỗ cửa, sổ đỏ chính chủ', txn: 'BAN', type: 'DAT_NEN', district: 'Quận Nam Từ Liêm', ward: 'Phường Xuân Phương', street: 'Đường Xuân Phương', price: ty(6.9), area: 50, front: 4.5, road: 8, dir: 'Đông', legal: 'Có sổ đỏ', tier: 'UP', agent: 1, days: 8, img: 'land' },
  // ---- Bắc Từ Liêm
  { title: 'Bán nhà Cổ Nhuế ngõ thông ô tô 4 tầng, gần công viên Hòa Bình', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Bắc Từ Liêm', ward: 'Phường Xuân Đỉnh', oldWard: 'Cổ Nhuế 1', street: 'Đường Cổ Nhuế', price: ty(8.2), area: 42, bed: 4, bath: 3, floors: 4, front: 4, road: 4, dir: 'Tây Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 1, days: 9, img: 'house' },
  { title: 'Cho thuê nhà nguyên căn Đông Ngạc 4 tầng, làm văn phòng hoặc ở', txn: 'CHO_THUE', type: 'NHA_RIENG', district: 'Quận Bắc Từ Liêm', ward: 'Phường Đông Ngạc', oldWard: 'Đông Ngạc', street: 'Đường Đông Ngạc', price: tr(20), area: 70, bed: 5, bath: 4, floors: 4, front: 5, road: 6, dir: 'Nam', furn: 'Cơ bản', agent: 1, days: 10, img: 'house' },
  { title: 'Bán căn hộ 3PN Sunshine City, tầng cao view sông Hồng', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Bắc Từ Liêm', ward: 'Phường Đông Ngạc', street: 'Khu đô thị Sunshine City', price: ty(6.2), area: 96, bed: 3, bath: 2, dir: 'Đông', legal: 'Đầy đủ', furn: 'Cơ bản', agent: 3, days: 6, img: 'apt', note: 'Dự án Sunshine City hướng ra sông Hồng, nhiều tiện ích nội khu.' },
  // ---- Hà Đông
  { title: 'Bán nhà La Khê ô tô vào nhà 4 tầng, gần Aeon Mall Hà Đông', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Hà Đông', ward: 'Phường Hà Đông', oldWard: 'La Khê', street: 'Phố La Khê', price: ty(7.4), area: 46, bed: 4, bath: 3, floors: 4, front: 4.2, road: 6, dir: 'Đông Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 1, days: 3, img: 'house' },
  { title: 'Bán căn hộ 2PN Văn Phú Victoria, nhà mới bàn giao', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Hà Đông', ward: 'Phường Phú Lương', oldWard: 'Phú Lương', street: 'Khu đô thị Văn Phú', price: ty(3.1), area: 70, bed: 2, bath: 2, dir: 'Nam', legal: 'Đầy đủ', furn: 'Cơ bản', tier: 'UP', agent: 1, days: 4, img: 'apt', note: 'Khu đô thị Văn Phú có công viên, trường học và trung tâm thương mại ngay trong khu.' },
  { title: 'Bán lô đất khu đô thị Dương Nội 90m², mặt đường 13m', txn: 'BAN', type: 'DAT_NEN', district: 'Quận Hà Đông', ward: 'Phường Dương Nội', street: 'Khu đô thị Dương Nội', price: ty(9.8), area: 90, front: 6, road: 13, dir: 'Bắc', legal: 'Có sổ đỏ', agent: 1, days: 6, img: 'land' },
  { title: 'Cho thuê chung cư Thanh Hà Cienco 5, 2PN nội thất cơ bản', txn: 'CHO_THUE', type: 'CHUNG_CU', district: 'Quận Hà Đông', ward: 'Phường Kiến Hưng', street: 'Khu đô thị Thanh Hà', price: tr(7.5), area: 65, bed: 2, bath: 2, dir: 'Đông Nam', furn: 'Cơ bản', agent: 1, days: 12, img: 'apt', note: 'Khu đô thị Thanh Hà nhiều cây xanh, có trường học và chợ trong khu.' },
  // ---- Hoàng Mai
  { title: 'Bán căn hộ 2PN Linh Đàm tầng trung view hồ, sổ đỏ lâu dài', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Hoàng Mai', ward: 'Phường Hoàng Liệt', oldWard: 'Hoàng Liệt', street: 'Khu đô thị Linh Đàm', price: ty(3.05), area: 66, bed: 2, bath: 2, dir: 'Đông Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 1, days: 2, img: 'apt' },
  { title: 'Bán căn hộ 3PN Park Hill Times City, view công viên, nội thất đẹp', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Hoàng Mai', ward: 'Phường Vĩnh Hưng', oldWard: 'Vĩnh Hưng', street: 'Khu đô thị Times City', price: ty(6.8), area: 96, bed: 3, bath: 2, dir: 'Tây Bắc', legal: 'Đầy đủ', furn: 'Đầy đủ', tier: 'VIP', project: 'times', agent: 3, days: 1, img: 'apt' },
  { title: 'Bán nhà Đại Kim 5 tầng thang máy, ngõ thông, gần đường Giải Phóng', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Hoàng Mai', ward: 'Phường Định Công', oldWard: 'Đại Kim', street: 'Phố Đại Kim', price: ty(9.6), area: 50, bed: 5, bath: 5, floors: 5, front: 4.5, road: 5, dir: 'Nam', legal: 'Có sổ đỏ', furn: 'Đầy đủ', agent: 1, days: 7, img: 'house' },
  { title: 'Cho thuê căn hộ studio Gamuda Gardens, full nội thất', txn: 'CHO_THUE', type: 'CHUNG_CU', district: 'Quận Hoàng Mai', ward: 'Phường Yên Sở', street: 'Khu đô thị Gamuda Gardens', price: tr(9), area: 45, bed: 1, bath: 1, dir: 'Đông', furn: 'Đầy đủ', project: 'gamuda', agent: 3, days: 9, img: 'apt' },
  // ---- Thanh Xuân
  { title: 'Bán căn hộ 3PN Royal City tòa R2, view bể bơi, nội thất cao cấp', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Thanh Xuân', ward: 'Phường Thanh Xuân', oldWard: 'Thanh Xuân Trung', street: '72A Nguyễn Trãi', price: ty(8.6), area: 112, bed: 3, bath: 2, dir: 'Đông Nam', legal: 'Đầy đủ', furn: 'Đầy đủ', tier: 'VIP', project: 'royal', agent: 3, days: 1, img: 'apt' },
  { title: 'Bán nhà mặt phố Nhân Chính 6 tầng, vỉa hè rộng, đang cho thuê 60tr/tháng', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Thanh Xuân', ward: 'Phường Thanh Xuân', oldWard: 'Nhân Chính', street: 'Phố Nhân Chính', price: ty(31.5), area: 65, bed: 8, bath: 6, floors: 6, front: 5, road: 15, dir: 'Đông', legal: 'Có sổ đỏ', furn: 'Đầy đủ', tier: 'UP', agent: 0, days: 5, img: 'house' },
  { title: 'Bán nhà Phương Liệt ngõ thông 5 tầng, ô tô đỗ cách 20m', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Thanh Xuân', ward: 'Phường Phương Liệt', street: 'Ngõ 5 Phương Liệt', price: ty(6.3), area: 38, bed: 4, bath: 4, floors: 5, front: 3.8, road: 3, dir: 'Tây Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 2, days: 8, img: 'house' },
  // ---- Tây Hồ
  { title: 'Bán biệt thự Tây Hồ sân vườn, view Hồ Tây trực diện', txn: 'BAN', type: 'BIET_THU', district: 'Quận Tây Hồ', ward: 'Phường Tây Hồ', oldWard: 'Quảng An', street: 'Đường Xuân Diệu', price: ty(68), area: 300, bed: 6, bath: 6, floors: 4, front: 15, road: 12, dir: 'Đông', legal: 'Có sổ đỏ', furn: 'Đầy đủ', tier: 'VIP', agent: 3, days: 2, img: 'house', note: 'Vị trí nhìn thẳng ra Hồ Tây, hiếm căn còn sân vườn rộng.' },
  { title: 'Bán nhà 5 tầng Nhật Tân ngõ ô tô, gần cầu Nhật Tân', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Tây Hồ', ward: 'Phường Tây Hồ', oldWard: 'Nhật Tân', street: 'Đường Nhật Tân', price: ty(15.9), area: 62, bed: 5, bath: 5, floors: 5, front: 5, road: 6, dir: 'Nam', legal: 'Có sổ đỏ', furn: 'Đầy đủ', agent: 3, days: 6, img: 'house' },
  { title: 'Cho thuê căn hộ dịch vụ 1PN gần Hồ Tây, ban công thoáng, full đồ', txn: 'CHO_THUE', type: 'CHUNG_CU', district: 'Quận Tây Hồ', ward: 'Phường Phú Thượng', street: 'Phố Tứ Liên', price: tr(14), area: 50, bed: 1, bath: 1, dir: 'Đông Nam', furn: 'Đầy đủ', agent: 3, days: 4, img: 'apt', note: 'Chỉ vài phút đi bộ ra đường ven Hồ Tây.' },
  { title: 'Bán lô đất Phú Thượng 75m², ô tô tránh, gần Hồ Tây', txn: 'BAN', type: 'DAT_NEN', district: 'Quận Tây Hồ', ward: 'Phường Phú Thượng', street: 'Đường Phú Thượng', price: ty(11.2), area: 75, front: 5, road: 7, dir: 'Nam', legal: 'Có sổ đỏ', agent: 3, days: 10, img: 'land' },
  // ---- Long Biên
  { title: 'Bán biệt thự đơn lập Vinhomes Riverside The Harmony 200m²', txn: 'BAN', type: 'BIET_THU', district: 'Quận Long Biên', ward: 'Phường Việt Hưng', street: 'Khu đô thị Vinhomes Riverside', price: ty(48), area: 200, bed: 5, bath: 5, floors: 3, front: 12, road: 14, dir: 'Đông Nam', legal: 'Đầy đủ', furn: 'Đầy đủ', tier: 'VIP', agent: 2, days: 3, img: 'house', note: 'Khu Vinhomes Riverside có công viên nội khu, an ninh 24/7.' },
  { title: 'Bán nhà Ngọc Thụy 4 tầng, ngõ ô tô, gần chợ Ngọc Thụy', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Long Biên', ward: 'Phường Bồ Đề', oldWard: 'Ngọc Thụy', street: 'Phố Ngọc Thụy', price: ty(6.9), area: 52, bed: 4, bath: 3, floors: 4, front: 4.5, road: 5, dir: 'Tây', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 2, days: 6, img: 'house' },
  { title: 'Cho thuê nhà mặt phố Sài Đồng 5 tầng, kinh doanh đa ngành', txn: 'CHO_THUE', type: 'NHA_RIENG', district: 'Quận Long Biên', ward: 'Phường Việt Hưng', oldWard: 'Sài Đồng', street: 'Phố Sài Đồng', price: tr(35), area: 90, bed: 6, bath: 5, floors: 5, front: 6, road: 20, dir: 'Nam', furn: 'Cơ bản', agent: 2, days: 8, img: 'house' },
  { title: 'Bán đất nền Thạch Bàn 60m², ô tô vào tận nơi', txn: 'BAN', type: 'DAT_NEN', district: 'Quận Long Biên', ward: 'Phường Phúc Lợi', oldWard: 'Thạch Bàn', street: 'Đường Thạch Bàn', price: ty(4.6), area: 60, front: 4, road: 6, dir: 'Tây', legal: 'Có sổ đỏ', agent: 2, days: 11, img: 'land' },
  // ---- Gia Lâm
  { title: 'Bán căn hộ 1PN+ Vinhomes Ocean Park tòa S2, nội thất cơ bản', txn: 'BAN', type: 'CHUNG_CU', district: 'Huyện Gia Lâm', ward: 'Gia Lâm', street: 'Khu đô thị Vinhomes Ocean Park', price: ty(2.35), area: 45, bed: 1, bath: 1, dir: 'Đông Nam', legal: 'Đầy đủ', furn: 'Cơ bản', tier: 'UP', project: 'ocean', agent: 2, days: 2, img: 'apt' },
  { title: 'Cho thuê căn hộ 2PN Vinhomes Ocean Park, view hồ, nội thất đẹp', txn: 'CHO_THUE', type: 'CHUNG_CU', district: 'Huyện Gia Lâm', ward: 'Gia Lâm', street: 'Khu đô thị Vinhomes Ocean Park', price: tr(9.5), area: 60, bed: 2, bath: 2, dir: 'Nam', furn: 'Đầy đủ', project: 'ocean', agent: 2, days: 5, img: 'apt' },
  { title: 'Bán đất nền Dương Xá 80m², gần khu công nghiệp, đường 8m', txn: 'BAN', type: 'DAT_NEN', district: 'Huyện Gia Lâm', ward: 'Gia Lâm', oldWard: 'Xã Dương Xá', street: 'Xã Dương Xá', price: ty(5.2), area: 80, front: 5, road: 8, dir: 'Đông Bắc', legal: 'Có sổ đỏ', agent: 2, days: 9, img: 'land' },
  { title: 'Bán nhà Bát Tràng 3 tầng có sân vườn, gần làng gốm', txn: 'BAN', type: 'NHA_RIENG', district: 'Huyện Gia Lâm', ward: 'Bát Tràng', street: 'Làng gốm Bát Tràng', price: ty(4.8), area: 100, bed: 4, bath: 3, floors: 3, front: 6, road: 4, dir: 'Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 2, days: 13, img: 'house' },
  // ---- Ngoại thành
  { title: 'Bán đất nền Đông Anh gần Cổ Loa, mặt đường 17m', txn: 'BAN', type: 'DAT_NEN', district: 'Huyện Đông Anh', ward: 'Đông Anh', oldWard: 'Xã Kim Nỗ', street: 'Đường Võ Nguyên Giáp', price: ty(7.5), area: 100, front: 5, road: 17, dir: 'Đông', legal: 'Có sổ đỏ', agent: 2, days: 7, img: 'land' },
  { title: 'Bán đất nền Nam An Khánh 100m², gần Splendora, đường 13,5m', txn: 'BAN', type: 'DAT_NEN', district: 'Huyện Hoài Đức', ward: 'An Khánh', street: 'Khu đô thị Nam An Khánh', price: ty(12.5), area: 100, front: 5, road: 13.5, dir: 'Đông Nam', legal: 'Có sổ đỏ', tier: 'UP', agent: 1, days: 4, img: 'land', note: 'Lô đất thuộc khu Nam An Khánh, cách Splendora vài phút đi xe.' },
  { title: 'Bán đất nền Hòa Lạc Thạch Thất 200m², gần Khu công nghệ cao', txn: 'BAN', type: 'DAT_NEN', district: 'Huyện Thạch Thất', ward: 'Hòa Lạc', street: 'Xã Hòa Lạc', price: ty(3.6), area: 200, front: 8, road: 9, dir: 'Nam', legal: 'Có sổ đỏ', agent: 2, days: 12, img: 'land' },
  { title: 'Bán đất thổ cư Sóc Sơn 300m² view núi, làm nhà vườn nghỉ dưỡng', txn: 'BAN', type: 'DAT_NEN', district: 'Huyện Sóc Sơn', ward: 'Sóc Sơn', street: 'Xã Minh Phú', price: ty(2.4), area: 300, front: 12, road: 6, dir: 'Đông Nam', legal: 'Có sổ đỏ', negotiable: true, agent: 2, days: 14, img: 'farm' },
  { title: 'Bán kho xưởng Thanh Trì 600m², container ra vào thoải mái', txn: 'BAN', type: 'MAT_BANG', district: 'Huyện Thanh Trì', ward: 'Ngọc Hồi', street: 'Đường Ngọc Hồi', price: ty(15), area: 600, front: 20, road: 10, legal: 'Có sổ đỏ', agent: 2, days: 11, img: 'shop' },
  // ---- Bổ sung để phủ thêm các "khu vực hot"
  { title: 'Bán căn hộ 3PN Mandarin Garden Hoàng Minh Giám, 130m², view thoáng', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Cầu Giấy', ward: 'Phường Yên Hòa', street: 'Đường Hoàng Minh Giám', price: ty(9.5), area: 130, bed: 3, bath: 3, dir: 'Đông Nam', legal: 'Đầy đủ', furn: 'Đầy đủ', agent: 0, days: 10, img: 'apt', note: 'Khu Mandarin Garden có hầm để xe, bể bơi và phòng tập trong tòa nhà.' },
  { title: 'Bán biệt thự Ciputra khu A, sân vườn rộng, nội thất nhập khẩu', txn: 'BAN', type: 'BIET_THU', district: 'Quận Tây Hồ', ward: 'Phường Phú Thượng', street: 'Khu đô thị Ciputra', price: ty(85), area: 250, bed: 6, bath: 6, floors: 3, front: 14, road: 15, dir: 'Nam', legal: 'Đầy đủ', furn: 'Đầy đủ', agent: 3, days: 8, img: 'house' },
  { title: 'Cho thuê căn hộ 2PN Imperia Sky Garden, tầng cao, nội thất đẹp', txn: 'CHO_THUE', type: 'CHUNG_CU', district: 'Quận Hai Bà Trưng', ward: 'Phường Bạch Mai', oldWard: 'Minh Khai', street: '423 Minh Khai', price: tr(14), area: 70, bed: 2, bath: 2, dir: 'Tây Nam', furn: 'Đầy đủ', agent: 1, days: 11, img: 'apt' },
  { title: 'Bán liền kề khu đô thị An Hưng 5 tầng, hướng Đông Nam', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Hà Đông', ward: 'Phường Dương Nội', street: 'Khu đô thị An Hưng', price: ty(13.4), area: 75, bed: 5, bath: 5, floors: 5, front: 5, road: 13, dir: 'Đông Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 1, days: 13, img: 'house' },
  { title: 'Bán căn hộ 2PN Goldmark City tòa B, nội thất đẹp, sổ đỏ lâu dài', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Bắc Từ Liêm', ward: 'Phường Phú Diễn', street: 'Đường Hồ Tùng Mậu', price: ty(3.9), area: 78, bed: 2, bath: 2, dir: 'Đông Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 0, days: 12, img: 'apt', note: 'Khu Goldmark City gần trục Hồ Tùng Mậu, kết nối nhanh về Cầu Giấy và Mỹ Đình.' },
  { title: 'Bán căn hộ 2PN khu Ngoại Giao Đoàn, an ninh tốt, gần Hồ Tây', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Bắc Từ Liêm', ward: 'Phường Xuân Đỉnh', street: 'Đường Xuân Đỉnh', price: ty(5.2), area: 84, bed: 2, bath: 2, dir: 'Nam', legal: 'Đầy đủ', furn: 'Đầy đủ', tier: 'UP', agent: 3, days: 6, img: 'apt', note: 'Khu Ngoại Giao Đoàn yên tĩnh, an ninh chặt chẽ, nhiều cây xanh.' },
  // ---- Tin THƯỜNG bổ sung: các khối dự án / khu vực hot trên trang chủ chỉ liệt kê tin NORMAL
  // (VIP/UP đã có khối riêng), nên mỗi dự án và khu vực hot cần ít nhất 1 tin thường.
  { title: 'Cho thuê căn hộ 2PN Royal City tòa R4, nội thất cơ bản, gần bể bơi', txn: 'CHO_THUE', type: 'CHUNG_CU', district: 'Quận Thanh Xuân', ward: 'Phường Thanh Xuân', oldWard: 'Thanh Xuân Trung', street: '72A Nguyễn Trãi', price: tr(16), area: 88, bed: 2, bath: 2, dir: 'Tây Nam', furn: 'Cơ bản', project: 'royal', agent: 3, days: 3, img: 'apt' },
  { title: 'Bán liền kề Ecopark khu Park River 4 tầng, gần hồ điều hòa', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Long Biên', ward: 'Phường Việt Hưng', street: 'Khu đô thị Ecopark', price: ty(11.8), area: 80, bed: 4, bath: 4, floors: 4, front: 5, road: 12, dir: 'Đông Nam', legal: 'Đầy đủ', furn: 'Cơ bản', project: 'eco', agent: 2, days: 6, img: 'house' },
  { title: 'Cho thuê căn hộ 2PN Keangnam Landmark, tầng cao, view Mỹ Đình', txn: 'CHO_THUE', type: 'CHUNG_CU', district: 'Quận Nam Từ Liêm', ward: 'Phường Từ Liêm', oldWard: 'Mễ Trì', street: 'Đường Phạm Hùng', price: tr(24), area: 90, bed: 2, bath: 2, dir: 'Đông Bắc', furn: 'Đầy đủ', agent: 0, days: 4, img: 'apt', note: 'Tòa Keangnam có hầm xe, phòng gym và bể bơi trong nhà.' },
  { title: 'Bán căn hộ 2PN Park Hill Times City, tầng trung, nhà sạch đẹp', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Hoàng Mai', ward: 'Phường Vĩnh Hưng', oldWard: 'Vĩnh Hưng', street: 'Khu đô thị Times City', price: ty(4.9), area: 74, bed: 2, bath: 2, dir: 'Đông', legal: 'Đầy đủ', furn: 'Cơ bản', project: 'times', agent: 1, days: 5, img: 'apt', note: 'Khu Park Hill có công viên rộng, sát Vincom Mega Mall.' },
  { title: 'Bán nhà ngõ Mỹ Đình 2 xây 4 tầng, cách phố 30m, ô tô đỗ gần', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Nam Từ Liêm', ward: 'Phường Từ Liêm', street: 'Ngõ 8 Mỹ Đình 2', price: ty(8.9), area: 40, bed: 4, bath: 4, floors: 4, front: 4, road: 4, dir: 'Tây Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 0, days: 9, img: 'house' },
  { title: 'Bán liền kề Vinhomes Riverside khu The Harmony 5 tầng, hướng Nam', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Long Biên', ward: 'Phường Việt Hưng', street: 'Khu đô thị Vinhomes Riverside', price: ty(27), area: 100, bed: 5, bath: 5, floors: 5, front: 6, road: 14, dir: 'Nam', legal: 'Đầy đủ', furn: 'Đầy đủ', agent: 2, days: 7, img: 'house' },
  { title: 'Bán nhà liền kề Nam An Khánh 5 tầng, gần Splendora, ô tô tránh', txn: 'BAN', type: 'NHA_RIENG', district: 'Huyện Hoài Đức', ward: 'An Khánh', street: 'Khu đô thị Nam An Khánh', price: ty(16.5), area: 80, bed: 5, bath: 5, floors: 5, front: 5, road: 13.5, dir: 'Đông Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 1, days: 8, img: 'house' },
  { title: 'Bán đất nền Bắc An Khánh 80m², gần đại lộ Thăng Long, sổ đỏ trao tay', txn: 'BAN', type: 'DAT_NEN', district: 'Huyện Hoài Đức', ward: 'An Khánh', street: 'Khu đô thị Bắc An Khánh', price: ty(9.6), area: 80, front: 5, road: 12, dir: 'Đông', legal: 'Có sổ đỏ', agent: 1, days: 10, img: 'land' },
  { title: 'Cho thuê căn hộ 2PN Văn Phú Victoria, nội thất cơ bản', txn: 'CHO_THUE', type: 'CHUNG_CU', district: 'Quận Hà Đông', ward: 'Phường Phú Lương', oldWard: 'Phú Lương', street: 'Khu đô thị Văn Phú', price: tr(8), area: 70, bed: 2, bath: 2, dir: 'Nam', furn: 'Cơ bản', agent: 1, days: 14, img: 'apt', note: 'Khu đô thị Văn Phú có công viên và siêu thị ngay dưới tòa nhà.' },
  { title: 'Bán nhà mặt phố Trung Kính 4 tầng, vỉa hè rộng, kinh doanh tốt', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Cầu Giấy', ward: 'Phường Yên Hòa', street: 'Phố Trung Kính', price: ty(14.5), area: 40, bed: 4, bath: 4, floors: 4, front: 4, road: 12, dir: 'Tây', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 0, days: 13, img: 'house' },
  { title: 'Bán căn hộ studio The Matrix One, gần Sân vận động Quốc gia', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Nam Từ Liêm', ward: 'Phường Từ Liêm', oldWard: 'Mễ Trì', street: 'Đường Lê Quang Đạo', price: ty(2.7), area: 42, bed: 1, bath: 1, dir: 'Đông Nam', legal: 'Đầy đủ', furn: 'Đầy đủ', agent: 3, days: 15, img: 'apt', note: 'Dự án The Matrix One có khu thương mại và nhà hàng ngay tầng dưới.' },
  { title: 'Bán căn hộ 3PN Mỹ Đình Pearl, tầng 18, view thoáng, nội thất cao cấp', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Nam Từ Liêm', ward: 'Phường Từ Liêm', street: 'Đường Mỹ Đình', price: ty(7.2), area: 106, bed: 3, bath: 2, dir: 'Đông Nam', legal: 'Đầy đủ', furn: 'Đầy đủ', agent: 0, days: 16, img: 'apt' },
  // ---- Nội thành khác
  { title: 'Bán nhà phố cổ Hoàn Kiếm 4 tầng mặt ngõ rộng, phù hợp kinh doanh homestay', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Hoàn Kiếm', ward: 'Phường Hoàn Kiếm', street: 'Phố Hàng Bông', price: ty(19.5), area: 38, bed: 6, bath: 6, floors: 4, front: 3.6, road: 4, dir: 'Đông Bắc', legal: 'Có sổ đỏ', furn: 'Đầy đủ', agent: 3, days: 5, img: 'house' },
  { title: 'Bán nhà ngõ phố Đội Cấn 5 tầng thang máy, gần Hồ Tây', txn: 'BAN', type: 'NHA_RIENG', district: 'Quận Ba Đình', ward: 'Phường Ngọc Hà', street: 'Phố Đội Cấn', price: ty(13.8), area: 45, bed: 5, bath: 5, floors: 5, front: 4, road: 4, dir: 'Nam', legal: 'Có sổ đỏ', furn: 'Đầy đủ', agent: 3, days: 7, img: 'house' },
  { title: 'Bán căn hộ 3PN Láng Hạ tầng 12, nhà mới sửa, sổ đỏ chính chủ', txn: 'BAN', type: 'CHUNG_CU', district: 'Quận Đống Đa', ward: 'Phường Láng', street: 'Phố Láng Hạ', price: ty(5.6), area: 100, bed: 3, bath: 2, dir: 'Đông Nam', legal: 'Có sổ đỏ', furn: 'Cơ bản', agent: 0, days: 9, img: 'apt' },
  { title: 'Cho thuê nhà ngõ Minh Khai 3PN, phù hợp gia đình hoặc văn phòng nhỏ', txn: 'CHO_THUE', type: 'NHA_RIENG', district: 'Quận Hai Bà Trưng', ward: 'Phường Bạch Mai', oldWard: 'Minh Khai', street: 'Ngõ 200 Minh Khai', price: tr(16), area: 60, bed: 3, bath: 2, floors: 4, front: 4, road: 4, dir: 'Tây Nam', furn: 'Cơ bản', agent: 1, days: 15, img: 'house' },
  { title: 'Cho thuê cửa hàng mặt phố Nguyễn Văn Cừ 60m², mặt tiền 5m', txn: 'CHO_THUE', type: 'MAT_BANG', district: 'Quận Long Biên', ward: 'Phường Long Biên', street: 'Phố Nguyễn Văn Cừ', price: tr(40), area: 60, front: 5, road: 16, agent: 2, days: 16, img: 'shop' },
];

// ---------------------------------------------------------------------------
// Dự án
// ---------------------------------------------------------------------------
export interface DemoProject {
  key: string;
  /** Tên đúng như trong DB (dự án đã có) hoặc tên tạo mới. */
  name: string;
  district: string;
  ward?: string;
  oldWard?: string;
  thumb: string[]; // khoá ảnh (lấy ảnh đầu)
  html: string;
}

const p = (s: string) => `<p>${s}</p>`;
// Trang dự án hiển thị mô tả trong khung không có định dạng tiêu đề/danh sách (Tailwind preflight), nên dùng đoạn văn + dấu • cho dễ đọc.
const li = (items: string[]) => `<p>${items.map((i) => `• ${i}`).join('<br>')}</p>`;
const NOTE = p('<em>Nội dung dự án dưới đây là dữ liệu mẫu phục vụ thử nghiệm giao diện, không phải thông tin chào bán chính thức.</em>');

export const PROJECTS: DemoProject[] = [
  {
    key: 'ocean', name: 'Vinhomes Ocean Park Mẫu', district: 'Huyện Gia Lâm', ward: 'Gia Lâm', thumb: ['c42', 'i26'],
    html: `<p><strong>Tổng quan</strong></p>${p('Đại đô thị ven đô phía Đông Hà Nội với hồ nước lớn, công viên và chuỗi tiện ích nội khu, phù hợp cả nhu cầu an cư lẫn cho thuê.')}<p><strong>Tiện ích nổi bật</strong></p>${li(['Hồ điều hòa và công viên ven hồ', 'Trường học liên cấp, bệnh viện trong khu', 'Trung tâm thương mại, khu vui chơi giải trí', 'Bãi đỗ xe rộng, hệ thống xe buýt nội khu'])}<p><strong>Sản phẩm</strong></p>${p('Căn hộ từ studio đến 3 phòng ngủ, nhà phố thương mại (shophouse) và biệt thự.')}${NOTE}`,
  },
  {
    key: 'times', name: 'Times City Mẫu', district: 'Quận Hoàng Mai', ward: 'Phường Vĩnh Hưng', oldWard: 'Vĩnh Hưng', thumb: ['c22', 'c26'],
    html: `<p><strong>Tổng quan</strong></p>${p('Khu đô thị phức hợp lâu năm với mật độ dân cư ổn định, tiện ích thương mại và giáo dục đầy đủ ngay dưới chân tòa nhà.')}<p><strong>Tiện ích nổi bật</strong></p>${li(['Trung tâm thương mại và khu vui chơi trong nhà', 'Trường học các cấp, bệnh viện quốc tế', 'Công viên, đường dạo và bể bơi nội khu', 'Kết nối nhanh với đường Minh Khai, Vành đai 2,5'])}<p><strong>Sản phẩm</strong></p>${p('Căn hộ 1–3 phòng ngủ, nhiều phân khu với mức giá và phong cách khác nhau.')}${NOTE}`,
  },
  {
    key: 'smart', name: 'Vinhomes Smart City Mẫu', district: 'Quận Nam Từ Liêm', ward: 'Phường Tây Mỗ', thumb: ['i26', 'i25'],
    html: `<p><strong>Tổng quan</strong></p>${p('Đô thị thông minh phía Tây Hà Nội, quy hoạch đồng bộ với công viên, hồ điều hòa và hệ thống giao thông nội khu.')}<p><strong>Tiện ích nổi bật</strong></p>${li(['Công viên trung tâm và hồ điều hòa', 'Trường mầm non đến trung học', 'Khu thương mại, ẩm thực, phòng tập', 'Ứng dụng quản lý cư dân trên điện thoại'])}<p><strong>Sản phẩm</strong></p>${p('Căn hộ từ 1 đến 3 phòng ngủ, nhà liền kề và shophouse.')}${NOTE}`,
  },
  {
    key: 'eco', name: 'Ecopark Mẫu', district: 'Quận Long Biên', ward: 'Phường Việt Hưng', thumb: ['c46', 'i42'],
    html: `<p><strong>Tổng quan</strong></p>${p('Khu đô thị sinh thái với mật độ cây xanh lớn, phù hợp gia đình muốn không gian sống yên tĩnh cách trung tâm một quãng ngắn.')}<p><strong>Tiện ích nổi bật</strong></p>${li(['Hồ nước, công viên và đường đi bộ ven hồ', 'Trường học, phòng khám, siêu thị nội khu', 'Sân thể thao, câu lạc bộ', 'Môi trường trong lành, ít khói bụi'])}<p><strong>Sản phẩm</strong></p>${p('Biệt thự, liền kề, nhà phố thương mại và căn hộ.')}${NOTE}`,
  },
  {
    key: 'royal', name: 'Royal City Mẫu', district: 'Quận Thanh Xuân', ward: 'Phường Thanh Xuân', oldWard: 'Thanh Xuân Trung', thumb: ['c14', 'c13'],
    html: `<p><strong>Tổng quan</strong></p>${p('Tổ hợp căn hộ – thương mại nằm trên trục Nguyễn Trãi, khu vực giao thoa giữa Thanh Xuân, Đống Đa và Cầu Giấy.')}<p><strong>Tiện ích nổi bật</strong></p>${li(['Trung tâm thương mại, rạp chiếu phim, sân băng', 'Trường học và bệnh viện trong bán kính ngắn', 'Bể bơi, phòng tập, khuôn viên xanh', 'Nhiều tuyến buýt và metro kết nối'])}<p><strong>Sản phẩm</strong></p>${p('Căn hộ 2–4 phòng ngủ, một số căn có view công viên, nội thất đầy đủ.')}${NOTE}`,
  },
  {
    key: 'gamuda', name: 'Gamuda Gardens Mẫu', district: 'Quận Hoàng Mai', ward: 'Phường Yên Sở', thumb: ['i23', 'i8'],
    html: `<p><strong>Tổng quan</strong></p>${p('Khu đô thị thấp tầng nằm ven sông phía Nam Hà Nội, quy hoạch nhiều mảng xanh và đường dạo bộ.')}<p><strong>Tiện ích nổi bật</strong></p>${li(['Công viên và đường dạo ven kênh', 'Trường học, câu lạc bộ, khu thể thao', 'Cổng kiểm soát ra vào, bảo vệ 24/7'])}<p><strong>Sản phẩm</strong></p>${p('Nhà phố, biệt thự song lập – đơn lập và một số căn hộ dịch vụ.')}${NOTE}`,
  },
];

// ---------------------------------------------------------------------------
// Bình luận & nhu cầu "Cần mua"
// ---------------------------------------------------------------------------
export interface DemoComment { listing: string; by: number; text: string; reply?: { by: number; text: string } }
/** `listing`: tiêu đề tin (chuỗi) — tra theo tiêu đề đã có/đã tạo. */
export const COMMENTS: DemoComment[] = [
  { listing: 'Bán căn hộ 3PN Royal City tòa R2, view bể bơi, nội thất cao cấp', by: 1, text: 'Cho mình xin thêm ảnh thực tế phòng ngủ chính và giá thương lượng được bao nhiêu ạ?', reply: { by: 3, text: 'Chào bạn, mình đã gửi ảnh qua Zalo. Giá có thể thương lượng nhẹ nếu bạn xem nhà trong tuần này.' } },
  { listing: 'Bán biệt thự Tây Hồ sân vườn, view Hồ Tây trực diện', by: 0, text: 'Nhà có sổ đỏ chính chủ không? Có hỗ trợ vay ngân hàng không?', reply: { by: 3, text: 'Sổ đỏ chính chủ, ngân hàng hỗ trợ vay tới 60%. Bạn cần mình gửi thông tin chi tiết không?' } },
  { listing: 'Cho thuê căn hộ 2PN Dịch Vọng Hậu gần Đại học Quốc gia, full nội thất', by: 2, text: 'Giá đã gồm phí quản lý chưa và có cho nuôi thú cưng không ạ?', reply: { by: 0, text: 'Giá chưa gồm phí quản lý (khoảng 8 nghìn/m²). Chung cư cho nuôi mèo, chó nhỏ nếu đăng ký với ban quản lý.' } },
  { listing: 'Bán đất nền Nam An Khánh 100m², gần Splendora, đường 13,5m', by: 3, text: 'Lô này hướng Đông Nam đúng không? Có bị dính quy hoạch gì không?', reply: { by: 1, text: 'Đúng hướng Đông Nam, đất không vướng quy hoạch, mình có bản đồ hiện trạng để bạn xem.' } },
  { listing: 'Bán nhà mặt phố Nhân Chính 6 tầng, vỉa hè rộng, đang cho thuê 60tr/tháng', by: 1, text: 'Hợp đồng thuê hiện tại còn bao lâu ạ?' },
  { listing: 'Bán căn hộ 2PN Vinhomes Smart City Tây Mỗ, nội thất liền tường', by: 0, text: 'Căn này tầng mấy và hướng ban công nào vậy bạn?' },
];

export interface DemoRequirement {
  name: string; phone: string; txn: 'CAN_MUA' | 'CAN_THUE'; type: string; district?: string;
  priceMin?: number; priceMax?: number; areaMin?: number; areaMax?: number; content: string; status: 'PENDING' | 'MATCHED' | 'CLOSED';
}
/** Giá tính bằng TRIỆU đồng, đúng đơn vị form "Cần mua" đang dùng. */
export const REQUIREMENTS: DemoRequirement[] = [
  { name: 'Anh Tuấn', phone: '0900000011', txn: 'CAN_MUA', type: 'CHUNG_CU', district: 'Quận Cầu Giấy', priceMin: 3000, priceMax: 4500, areaMin: 60, areaMax: 80, content: 'Cần mua căn hộ 2 phòng ngủ khu Cầu Giấy hoặc Nam Từ Liêm, tầng trung, nhà có sổ, ưu tiên gần trường học. Có thể xem nhà cuối tuần.', status: 'PENDING' },
  { name: 'Chị Lan', phone: '0900000012', txn: 'CAN_MUA', type: 'NHA_RIENG', district: 'Quận Hà Đông', priceMin: 5000, priceMax: 8000, areaMin: 40, areaMax: 60, content: 'Tìm nhà 4 tầng trở lên ở Hà Đông, ngõ ô tô, gần đường Quang Trung. Thanh toán nhanh nếu pháp lý đầy đủ.', status: 'MATCHED' },
  { name: 'Anh Đức', phone: '0900000013', txn: 'CAN_THUE', type: 'MAT_BANG', district: 'Quận Long Biên', priceMin: 20, priceMax: 40, areaMin: 50, areaMax: 100, content: 'Cần thuê cửa hàng mặt phố Long Biên để mở quán cà phê, mặt tiền tối thiểu 5m, có chỗ để xe.', status: 'PENDING' },
  { name: 'Chị Hoa', phone: '0900000014', txn: 'CAN_MUA', type: 'DAT_NEN', district: 'Huyện Đông Anh', priceMin: 4000, priceMax: 9000, areaMin: 80, areaMax: 120, content: 'Cần mua đất nền có sổ đỏ khu Đông Anh, đường trước đất từ 8m, ưu tiên gần trục Võ Nguyên Giáp.', status: 'PENDING' },
  { name: 'Anh Long', phone: '0900000015', txn: 'CAN_THUE', type: 'CHUNG_CU', district: 'Quận Tây Hồ', priceMin: 10, priceMax: 18, areaMin: 45, areaMax: 70, content: 'Cần thuê căn hộ 1–2 phòng ngủ khu Tây Hồ, full nội thất, hợp đồng dài hạn từ 1 năm.', status: 'CLOSED' },
];
