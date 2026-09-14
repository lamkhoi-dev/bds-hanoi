import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
const sharp = require('sharp');
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  
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
