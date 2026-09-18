import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FormatResponseInterceptor } from './common/interceptor/format-response.interceptor';
import { InvokeRecordInterceptor } from './common/interceptor/invoke-record.interceptor';
import { UnLoginFilter } from './common/filter/unlogin.filter';
import { CustomExceptionFilter } from './common/filter/custom-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  // 先缓冲启动期日志，待下方 useLogger 挂上 winston 后统一输出
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // 替换 Nest 全局 Logger：业务里 new Logger() 的调用会自动走 winston
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.flushLogs();

  app.useStaticAssets('uploads', {
    prefix: '/uploads',
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new FormatResponseInterceptor());
  app.useGlobalInterceptors(new InvokeRecordInterceptor());
  app.useGlobalFilters(new UnLoginFilter());
  app.useGlobalFilters(new CustomExceptionFilter());
  app.enableCors();
  /**
   * 配置swagger
   */
  const config = new DocumentBuilder()
    .setTitle('会议室预订系统')
    .setDescription('api 接口文档')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);

  const configService = app.get(ConfigService);
  await app.listen(Number(configService.get<number>('app.port') ?? 3000));
}
bootstrap();
