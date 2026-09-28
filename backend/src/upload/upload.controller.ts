import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage, diskStorage } from 'multer';
import { extname, join } from 'path';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';
import { Throttle } from '@nestjs/throttler';
const sharp = require('sharp');
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';
import { MAX_VIDEO_BYTES, TranscodeBusyError, transcodeVideo } from './video-transcode';

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  /**
   * Video tin đăng: nhận tối đa 100MB, nén về MP4 H.264 ≤720p rồi mới đưa lên MinIO — file
   * gốc chỉ nằm ở thư mục tạm và luôn bị xoá. Xem `video-transcode.ts` để biết lý do nén.
   */
  @Post('video')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: tmpdir(),
      // Không dùng tên file khách gửi (có thể chứa ký tự lạ / đường dẫn).
      filename: (_req, _file, cb) => cb(null, `upload-${Date.now()}-${Math.round(Math.random() * 1e9)}.bin`),
    }),
    limits: { fileSize: MAX_VIDEO_BYTES },
    fileFilter: (_req, file, cb) => {
      if (!/^video\/(mp4|quicktime|webm|x-m4v)$/.test(file.mimetype)) {
        return cb(new BadRequestException('Chỉ hỗ trợ video MP4, MOV hoặc WebM.'), false);
      }
      cb(null, true);
    },
  }))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chưa chọn video.');

    const outputPath = join(tmpdir(), `video-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp4`);
    try {
      try {
        await transcodeVideo(file.path, outputPath);
      } catch (error) {
        if (error instanceof TranscodeBusyError) {
          throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
        }
        this.logger.warn(`Nén video thất bại: ${(error as Error).message}`);
        throw new BadRequestException('Không đọc được video này. Vui lòng thử file MP4 khác.');
      }

      const buffer = await fs.readFile(outputPath);
      const name = `video-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp4`;
      const url = await this.uploadService.uploadFile(buffer, name, 'video/mp4');
      this.logger.log(`Video ${Math.round(file.size / 1024)}KB -> ${Math.round(buffer.length / 1024)}KB`);
      return { url, sizeBytes: buffer.length };
    } finally {
      await Promise.all([
        fs.unlink(file.path).catch(() => undefined),
        fs.unlink(outputPath).catch(() => undefined),
      ]);
    }
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const outputFilename = `optimized-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    let optimizedBuffer: Buffer;
    let width: number | undefined;
    let height: number | undefined;

    try {
      // Compress, resize, VÀ lấy kích thước thật sau khi resize — `resolveWithObject` để
      // không phải gọi `sharp(buffer).metadata()` một lần nữa trên ảnh đã nén (tốn CPU gấp
      // đôi cho cùng một việc). Trình soạn thảo tin tức dùng width/height này để cảnh báo
      // ảnh đại diện dưới khuyến nghị 1200×675, và để khai đúng kích thước ảnh cho SEO.
      const result = await sharp(file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      optimizedBuffer = result.data;
      width = result.info.width;
      height = result.info.height;
    } catch (error) {
      throw new BadRequestException('Invalid or corrupted image file');
    }

    const url = await this.uploadService.uploadFile(optimizedBuffer, outputFilename, 'image/webp');

    return {
      message: 'File uploaded and optimized successfully',
      url,
      width,
      height,
    };
  }
}
