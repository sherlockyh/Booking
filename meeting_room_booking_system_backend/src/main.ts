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

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist：剥离 DTO 未声明的字段，防止恶意字段透传进业务层
      whitelist: true,
      // transform：按 DTO 类型自动转换 query/param 等纯文本载荷
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new FormatResponseInterceptor());
  app.useGlobalInterceptors(new InvokeRecordInterceptor());
  app.useGlobalFilters(new UnLoginFilter());
  app.useGlobalFilters(new CustomExceptionFilter());

  const configService = app.get(ConfigService);

  // 前端与 API 同源（vite/nginx 反代），默认不开放跨域；
  // 确有跨域需求时通过 CORS_ORIGINS 配置来源白名单
  const corsOrigins = configService.get<string[]>('app.corsOrigins') ?? [];
  app.enableCors({ origin: corsOrigins.length > 0 ? corsOrigins : false });

  // 接口文档只在开发/测试环境暴露
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('会议室预订系统')
      .setDescription('api 接口文档')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-doc', app, document);
  }

  await app.listen(Number(configService.get<number>('app.port') ?? 3000));
}
bootstrap();
