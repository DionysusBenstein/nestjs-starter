import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const reflector = app.get(Reflector);
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT');
  const isDevelop = configService.get<string>('NODE_ENV') === 'development';

  const helmetConfig = helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "https: data: blob:"],
        mediaSrc: ["'self'", "https: data: blob:"],
      },
    },
    crossOriginResourcePolicy: {
      policy: isDevelop ? 'cross-origin' : 'same-site',
    },
  });

  const docsConfig = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const theme = new SwaggerTheme();

  const options: SwaggerCustomOptions = {
    explorer: true,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.DRACULA),
    jsonDocumentUrl: 'docs/json',
  };

  const document = SwaggerModule.createDocument(app, docsConfig);
  SwaggerModule.setup('docs', app, document, options);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));
  app.enableCors();
  app.use(helmetConfig);

  await app.listen(PORT);
}

bootstrap();
