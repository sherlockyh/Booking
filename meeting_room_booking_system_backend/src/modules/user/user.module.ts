import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import {  TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { OssModule } from '@infrastructure/oss/oss.module';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission]),
    RedisModule,
    OssModule,
  ],
  controllers: [UserController, RoleController],
  providers: [UserService, RoleService],
})
export class UserModule {}
