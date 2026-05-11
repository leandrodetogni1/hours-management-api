import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common/pipes';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';

const BODY_LIMIT = '100kb';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const isProd = nodeEnv === 'production';

  app.setGlobalPrefix('api');

  app.use(helmet());
  app.use(json({ limit: BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: BODY_LIMIT }));

  const frontendUrl =
    configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const swaggerUser = configService.get<string>('SWAGGER_USER');
  const swaggerPassword = configService.get<string>('SWAGGER_PASSWORD');

  if (isProd && (!swaggerUser || !swaggerPassword)) {
    throw new Error(
      'SWAGGER_USER e SWAGGER_PASSWORD são obrigatórios em produção',
    );
  }

  app.use(
    '/api/docs{/:path}',
    basicAuth({
      challenge: true,
      users: { [swaggerUser ?? 'admin']: swaggerPassword ?? 'admin123' },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Hours Management API')
    .setDescription(
      'API para gerenciamento de horas complementares - UFPel TCC',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT emitido por POST /auth/google',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(port);
}
void bootstrap();
