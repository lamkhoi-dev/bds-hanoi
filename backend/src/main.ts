import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './shared/all-exceptions.filter';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import * as crypto from 'crypto';

if (!globalThis.crypto) {
  globalThis.crypto = crypto.webcrypto as any;
}

function getCorsOrigin() {
  const rawOrigin = process.env.FRONTEND_URL;
  if (!rawOrigin) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FRONTEND_URL is required in production');
    }
    return true;
  }

  const origins = rawOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0] : origins;
}

import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as http from 'http';

async function bootstrap() {
  const server = express();

  // Proxy /bds-uploads to MinIO
  server.use('/bds-uploads', (req, res, next) => {
    const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://minio:9000';
    let minioUrl: URL;
    try {
      minioUrl = new URL(minioEndpoint);
    } catch (e) {
      return next();
    }
    const options = {
      hostname: minioUrl.hostname,
      port: minioUrl.port,
      path: `/bds-uploads${req.url}`,
      method: req.method,
      headers: { ...req.headers, host: minioUrl.host },
    };
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    proxyReq.on('error', (err) => {
      res.status(502).send('Bad Gateway');
    });
    req.pipe(proxyReq, { end: true });
  });

  // Vercel compatibility middleware BEFORE NestJS touches the request
  server.use((req, res, next) => {
    const isApiV1 = req.url.startsWith('/api/v1');
    const isApi = req.url.startsWith('/api/');
    const isUploads = req.url.startsWith('/uploads');
    const isSocket = req.url.startsWith('/socket.io');
    const isDocs = req.url.startsWith('/docs');
    const isHealth = req.url.startsWith('/health');
    
    if (!isApiV1 && !isUploads && !isSocket && !isDocs && !isHealth) {
      if (isApi) {
        req.url = req.url.replace(/^\/api\//, '/api/v1/');
      } else {
        req.url = '/api/v1' + (req.url.startsWith('/') ? req.url : '/' + req.url);
      }
    }
    next();
  });

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
  );
  
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.enableShutdownHooks();

  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }
  
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  // Security
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
  app.enableCors({
    origin: getCorsOrigin(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Real Estate API')
      .setDescription('API documentation for the Real Estate platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
bootstrap();
