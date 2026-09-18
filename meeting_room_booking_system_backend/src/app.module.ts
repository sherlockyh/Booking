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
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, ossConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (database: ConfigType<typeof databaseConfig>) => ({
        type: 'mysql',
        host: database.host,
        port: database.port,
        username: database.username,
        password: database.password,
        database: database.database,
        synchronize: false,
        migrationsRun: true,
        logging: true,
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
