-- "Khu vực hot" của trang chủ Hà Nội (Bảng 4 tài liệu khách, 31 tên).
--
-- Bảng RIÊNG chứ không nhét vào "Location": khách trả lời 21/08 rằng các khu vực này
-- "không thuộc quận huyện hay phường xã nào cả", tin được lấy bằng cách so khớp ĐÚNG cụm
-- từ trong nội dung tin. Nhét vào cây địa giới thì sẽ có những dòng không có cha, và trang
-- /khu-vuc (liệt kê phường xã theo quận) sẽ hiện lẫn "Royal City" giữa danh sách hành chính.
--
-- Chỉ tạo bảng, KHÔNG nhập dữ liệu ở đây: 31 tên nạp bằng script riêng
-- (src/scripts/import-hot-areas.ts) để chạy được nhiều lần và chỉ nhắm site Hà Nội.
-- Nghệ An chạy migration này cũng chỉ có thêm một bảng rỗng, bố cục classic không đọc tới.

-- CreateTable
CREATE TABLE "HotArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HotArea_name_key" ON "HotArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HotArea_slug_key" ON "HotArea"("slug");

-- CreateIndex
CREATE INDEX "HotArea_isActive_sortOrder_idx" ON "HotArea"("isActive", "sortOrder");
