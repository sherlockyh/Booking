import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@modules/user/user.module';
import { User } from '@modules/user/entities/user.entity';
import { Role } from '@modules/user/entities/role.entity';
import { Permission } from '@modules/user/entities/permission.entity';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { ConfigModule, ConfigType } from '@nestjs/config';
import appConfig from '@infrastructure/config/app.config';
import databaseConfig from '@infrastructure/config/database.config';
import redisConfig from '@infrastructure/config/redis.config';
import jwtConfig from '@infrastructure/config/jwt.config';
import ossConfig from '@infrastructure/config/oss.config';
import logConfig from '@infrastructure/config/log.config';
import { TypeOrmWinstonLogger } from '@infrastructure/database/typeorm-winston.logger';
import { WinstonModule, WINSTON_MODULE_PROVIDER, utilities } from 'nest-winston';
import { format, transports, Logger as WinstonLogger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { InitialSchema1756810000000 } from '@infrastructure/database/migrations/1756810000000-initial-schema';
import { AddMeetingRoom1757510000000 } from '@infrastructure/database/migrations/1757510000000-add-meeting-room';
import { AddBooking1757520000000 } from '@infrastructure/database/migrations/1757520000000-add-booking';
import { AlterPasswordLength1757600000000 } from '@infrastructure/database/migrations/1757600000000-alter-password-length';
import { SeedFreshAccounts1757700000000 } from '@infrastructure/database/migrations/1757700000000-seed-fresh-accounts';
import { JwtInfraModule } from '@infrastructure/jwt/jwt.module';
import { OssModule } from '@infrastructure/oss/oss.module';
import { APP_GUARD } from '@nestjs/core';
import { LoginGuard } from '@common/guard/login.guard';
import { PermissionGuard } from '@common/guard/permission.guard';
import { MeetingRoomModule } from './modules/meeting-room/meeting-room.module';
import { MeetingRoom } from './modules/meeting-room/entities/meeting-room.entity';
import { BookingModule } from './modules/booking/booking.module';
import { Booking } from '@modules/booking/entities/booking.entity';
import { StatisticModule } from './modules/statistic/statistic.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, ossConfig, logConfig],
    }),
    // 全局日志：控制台 Nest 风格输出 + 按天轮转 JSON 文件
    WinstonModule.forRootAsync({
      inject: [logConfig.KEY],
      useFactory: (log: ConfigType<typeof logConfig>) => {
        const fileTransport = new DailyRotateFile({
          dirname: log.dir,
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxFiles: log.maxFiles,
          format: format.combine(format.timestamp(), format.json()),
        });
        // 目录不可写等 IO 故障时只告警，避免无监听导致进程崩溃
        fileTransport.on('error', (err) => console.error('[winston] 文件日志写入失败:', err.message));

        return {
          level: log.level,
          transports: [
            new transports.Console({
              format: utilities.format.nestLike('MeetingRoom', {
                prettyPrint: true,
                colors: process.env.NODE_ENV !== 'production',
              }),
            }),
            fileTransport,
          ],
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY, WINSTON_MODULE_PROVIDER],
      useFactory: (
        database: ConfigType<typeof databaseConfig>,
        winstonLogger: WinstonLogger,
      ) => ({
        type: 'mysql',
        host: database.host,
        port: database.port,
        username: database.username,
        password: database.password,
        database: database.database,
        synchronize: false,
        migrationsRun: true,
        // SQL 日志经 TypeOrmWinstonLogger 走 winston，logging 保留为总开关
        logging: true,
        logger: new TypeOrmWinstonLogger(winstonLogger),
        entities: [User, Role, Permission, MeetingRoom, Booking],
        migrations: [
          InitialSchema1756810000000,
          AddMeetingRoom1757510000000,
          AddBooking1757520000000,
          AlterPasswordLength1757600000000,
          SeedFreshAccounts1757700000000,
        ],
        poolSize: 10,
      }),
    }),
    UserModule,
    RedisModule,
    JwtInfraModule,
    OssModule,
    MeetingRoomModule,
    BookingModule,
    StatisticModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: LoginGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
