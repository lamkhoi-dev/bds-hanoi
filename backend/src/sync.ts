import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminService } from './admin/admin.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);
  
  console.log('Starting Meilisearch sync...');
  await adminService.syncMeilisearch();
  console.log('Sync complete!');
  
  await app.close();
}
bootstrap();
