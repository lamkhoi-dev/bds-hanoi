import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private readonly logger = new Logger(UploadService.name);
  private bucket: string;
  private publicBaseUrl: string;

  constructor() {
    this.bucket = process.env.MINIO_BUCKET || 'bds-uploads';
    this.publicBaseUrl = process.env.PUBLIC_UPLOAD_BASE_URL || 'http://localhost:9000/bds-uploads';
    
    this.s3Client = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      region: 'us-east-1', // MinIO requires any string here
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'admin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'admin123',
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: buffer,
        ContentType: mimetype,
      }));
      
      return `${this.publicBaseUrl}/${filename}`;
    } catch (error) {
      this.logger.error(`Failed to upload to MinIO: ${error.message}`, error.stack);
      throw error;
    }
  }
}
