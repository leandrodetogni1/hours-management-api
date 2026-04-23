import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common/pipes';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  app.setGlobalPrefix('api');

  // CORS restrito ao frontend (permite cookies httpOnly / Authorization header)
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger basic auth
  const swaggerUser = configService.get<string>('SWAGGER_USER', 'admin');
  const swaggerPassword = configService.get<string>(
    'SWAGGER_PASSWORD',
    'admin123',
  );

  app.use(
    '/api/docs{/:path}',
    basicAuth({
      challenge: true,
      users: { [swaggerUser]: swaggerPassword },
    }),
  );

  // Swagger config
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
      forbidNonWhitelisted: false,
      skipMissingProperties: false,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(port);
}
void bootstrap();
