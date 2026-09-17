import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashPassword, comparePassword } from '@common/utils';
import { randomInt, randomUUID } from 'node:crypto';
import { Like, Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import { User } from './entities/user.entity';
import { RedisService } from '@infrastructure/redis/redis.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginUserVo } from './vo/login-user.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

@Injectable()
export class UserService {
  private readonly registerCaptchaExpireSeconds = 5 * 60;

  private logger = new Logger();

  @InjectRepository(User)
  private userRepository: Repository<User>;
  @InjectRepository(Role)
  private roleRepository: Repository<Role>;
  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  @Inject(RedisService)
  private redisService: RedisService;

  async getRegisterCaptcha() {
    const captchaId = randomUUID();
    const captcha = randomInt(1000, 10000).toString();

    await this.redisService.set(
      this.getRegisterCaptchaKey(captchaId),
      captcha,
      this.registerCaptchaExpireSeconds,
    );

    return {
      captchaId,
      captcha,
      expireSeconds: this.registerCaptchaExpireSeconds,
    };
  }
  async getUpdateUserCaptcha(userId: number) {
    const user = await this.findUserDetailById(userId);

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    const captcha = randomInt(1000, 10000).toString();

    await this.redisService.set(
      `update_user_captcha_${user.email}`,
      captcha,
      this.registerCaptchaExpireSeconds,
    );

    return {
      captcha,
      expireSeconds: this.registerCaptchaExpireSeconds,
    };
  }

  async getUpdatePasswordCaptcha(userId: number) {
    const user = await this.findUserDetailById(userId);

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    const captchaId = randomUUID();
    const captcha = randomInt(1000, 10000).toString();

    await this.redisService.set(
      this.getUpdatePasswordCaptchaKey(captchaId),
      captcha,
      this.registerCaptchaExpireSeconds,
    );

    return {
      captchaId,
      captcha,
      expireSeconds: this.registerCaptchaExpireSeconds,
    };
  }
  private getRegisterCaptchaKey(captchaId: string) {
    return `captcha_register_${captchaId}`;
  }
  private getUpdatePasswordCaptchaKey(captchaId: string) {
    return `captcha_update_password_${captchaId}`;
  }
  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(
      this.getRegisterCaptchaKey(user.captchaId),
    );

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (user.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOneBy({
      username: user.username,
    });

    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST);
    }

    const newUser = new User();
    newUser.username = user.username;
    newUser.password = hashPassword(user.password);
    newUser.email = user.email;
    newUser.nickName = user.nickName;

    try {
      await this.userRepository.save(newUser);
      await this.redisService.del(this.getRegisterCaptchaKey(user.captchaId));
      return '注册成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '注册失败';
    }
  }

  async login(loginUserDto: LoginUserDto, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        username: loginUserDto.username,
        isAdmin,
      },
      relations: {
        roles: {
          permissions: true,
        },
      },
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (!comparePassword(loginUserDto.password, user.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    const vo = new LoginUserVo();
    vo.userInfo = {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      headPic: user.headPic,
      createTime: user.createTime.getTime(),
      isFrozen: user.isFrozen,
      isAdmin: user.isAdmin,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce<Permission[]>((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };
    return vo;
  }

  async findUserById(userId: number, isAdmin: boolean) {
    const user: User | null = await this.userRepository.findOne({
      where: {
        id: userId,
        isAdmin,
      },
      relations: {
        roles: {
          permissions: true,
        },
      },
    });

    return {
      id: user?.id,
      username: user?.username,
      isAdmin: user?.isAdmin,
      roles: user?.roles.map((item) => item.name),
      permissions: user?.roles.reduce<Permission[]>((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };
  }

  async findUserDetailById(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    return user;
  }

  async updatePassword(userId: number, passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(
      this.getUpdatePasswordCaptchaKey(passwordDto.captchaId),
    );

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (passwordDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOneBy({
      id: userId,
    });

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    foundUser.password = hashPassword(passwordDto.password);

    try {
      await this.userRepository.save(foundUser);
      await this.redisService.del(
        this.getUpdatePasswordCaptchaKey(passwordDto.captchaId),
      );
      return '密码修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '密码修改失败';
    }
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.redisService.get(
      `update_user_captcha_${updateUserDto.email}`,
    );

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOneBy({
      id: userId,
    });

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.nickName) {
      foundUser.nickName = updateUserDto.nickName;
    }
    if (updateUserDto.headPic) {
      foundUser.headPic = updateUserDto.headPic;
    }

    try {
      await this.userRepository.save(foundUser);
      return '用户信息修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '用户信息修改失败';
    }
  }

  async freezeUserById(id: number) {
    const user = await this.userRepository.findOneBy({
      id,
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (user.isAdmin) {
      throw new HttpException('不能冻结管理员', HttpStatus.BAD_REQUEST);
    }

    user.isFrozen = true;
    await this.userRepository.save(user);
  }

  async unfreezeUserById(id: number) {
    const user = await this.userRepository.findOneBy({
      id,
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (user.isAdmin) {
      throw new HttpException('不能解冻管理员', HttpStatus.BAD_REQUEST);
    }

    user.isFrozen = false;
    await this.userRepository.save(user);
  }

  async resetPasswordByAdmin(resetUserPasswordDto: ResetUserPasswordDto) {
    const user = await this.userRepository.findOneBy({
      id: resetUserPasswordDto.id,
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    user.password = hashPassword(resetUserPasswordDto.password);
    await this.userRepository.save(user);

    return '密码重置成功';
  }

  async deleteUserByAdmin(deleteUserDto: DeleteUserDto) {
    const user = await this.userRepository.findOneBy({
      id: deleteUserDto.id,
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (user.isAdmin) {
      throw new HttpException('不能删除管理员', HttpStatus.BAD_REQUEST);
    }

    await this.userRepository.delete(deleteUserDto.id);
    return '删除成功';
  }

  async findUsers(
    username: string,
    nickName: string,
    email: string,
    pageNo: number,
    pageSize: number,
  ) {
    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {};

    if (username) {
      condition.username = Like(`%${username}%`);
    }
    if (nickName) {
      condition.nickName = Like(`%${nickName}%`);
    }
    if (email) {
      condition.email = Like(`%${email}%`);
    }

    condition.isAdmin = false;

    const [users, totalCount] = await this.userRepository.findAndCount({
      select: {
        id: true,
        username: true,
        nickName: true,
        email: true,
        phoneNumber: true,
        isFrozen: true,
        headPic: true,
        createTime: true,
      },
      skip: skipCount,
      take: pageSize,
      where: condition,
    });

    return {
      users,
      totalCount,
    };
  }
}
