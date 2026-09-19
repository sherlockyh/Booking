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
import { OssService } from '@infrastructure/oss/oss.service';

@Injectable()
export class UserService {
  private readonly registerCaptchaExpireSeconds = 5 * 60;

  // 验证码连续错满 5 次立即作废，防止 4 位数字验证码被暴力枚举
  private readonly captchaMaxFailAttempts = 5;

  // 同一用户名登录失败 10 次后锁定 10 分钟
  private readonly loginMaxFailAttempts = 10;
  private readonly loginLockSeconds = 10 * 60;

  private logger = new Logger();

  @InjectRepository(User)
  private userRepository: Repository<User>;
  @InjectRepository(Role)
  private roleRepository: Repository<Role>;
  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(OssService)
  private ossService: OssService;

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

  // 统一验证码校验：比对失败计数，错满上限直接作废验证码
  private async verifyCaptcha(redisKey: string, input: string) {
    const captcha = await this.redisService.get(redisKey);

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (input !== captcha) {
      const failKey = `captcha_fail_${redisKey}`;
      const fails = Number((await this.redisService.get(failKey)) ?? 0) + 1;

      if (fails >= this.captchaMaxFailAttempts) {
        await this.redisService.del(redisKey);
        await this.redisService.del(failKey);
        throw new HttpException(
          '验证码错误次数过多，请重新获取',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 失败计数与验证码同生命周期
      await this.redisService.set(
        failKey,
        String(fails),
        this.registerCaptchaExpireSeconds,
      );
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    await this.redisService.del(`captcha_fail_${redisKey}`);
  }

  private loginFailKey(username: string, isAdmin: boolean) {
    return `login_fail_${isAdmin ? 'admin' : 'user'}_${username}`;
  }

  private async recordLoginFail(failKey: string) {
    const fails = Number((await this.redisService.get(failKey)) ?? 0) + 1;
    await this.redisService.set(failKey, String(fails), this.loginLockSeconds);
  }

  async register(user: RegisterUserDto) {
    await this.verifyCaptcha(
      this.getRegisterCaptchaKey(user.captchaId),
      user.captcha,
    );

    const foundUser = await this.userRepository.findOneBy({
      username: user.username,
    });

    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST);
    }

    const newUser = new User();
    newUser.username = user.username;
    newUser.password = await hashPassword(user.password);
    newUser.email = user.email;
    newUser.nickName = user.nickName;

    try {
      await this.userRepository.save(newUser);
      await this.redisService.del(this.getRegisterCaptchaKey(user.captchaId));
      return '注册成功';
    } catch (e) {
      this.logger.error(e, UserService);
      // 唯一索引兜底：并发注册同名用户时由数据库层拦截
      if ((e as { code?: string })?.code === 'ER_DUP_ENTRY') {
        throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('注册失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(loginUserDto: LoginUserDto, isAdmin: boolean) {
    const failKey = this.loginFailKey(loginUserDto.username, isAdmin);
    const failCount = Number((await this.redisService.get(failKey)) ?? 0);

    if (failCount >= this.loginMaxFailAttempts) {
      throw new HttpException(
        '登录失败次数过多，请 10 分钟后再试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

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
      await this.recordLoginFail(failKey);
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (!(await comparePassword(loginUserDto.password, user.password))) {
      await this.recordLoginFail(failKey);
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    // 放在密码校验之后：避免向未持密码的请求方泄露账号状态
    if (user.isFrozen) {
      throw new HttpException('账号已被冻结，请联系管理员', HttpStatus.BAD_REQUEST);
    }

    // 登录成功清空失败计数
    await this.redisService.del(failKey);

    const vo = new LoginUserVo();
    vo.userInfo = {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      headPic: user.headPic,
      headPicUrl: this.ossService.resolveAvatarUrl(user.headPic),
      createTime: user.createTime.getTime(),
      isFrozen: user.isFrozen,
      isAdmin: user.isAdmin,
      roles: user.roles.map((item) => item.name),
      // 聚合各角色的权限码并去重，token 里只放 code
      permissions: [
        ...new Set(
          user.roles.flatMap((item) =>
            item.permissions.map((permission) => permission.code),
          ),
        ),
      ],
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
      isFrozen: user?.isFrozen,
      roles: user?.roles.map((item) => item.name),
      permissions: [
        ...new Set(
          user?.roles.flatMap((item) =>
            item.permissions.map((permission) => permission.code),
          ) ?? [],
        ),
      ],
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
    await this.verifyCaptcha(
      this.getUpdatePasswordCaptchaKey(passwordDto.captchaId),
      passwordDto.captcha,
    );

    const foundUser = await this.userRepository.findOneBy({
      id: userId,
    });

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    foundUser.password = await hashPassword(passwordDto.password);

    try {
      await this.userRepository.save(foundUser);
      await this.redisService.del(
        this.getUpdatePasswordCaptchaKey(passwordDto.captchaId),
      );
      return '密码修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      throw new HttpException('密码修改失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    await this.verifyCaptcha(
      `update_user_captcha_${updateUserDto.email}`,
      updateUserDto.captcha,
    );

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
      throw new HttpException(
        '用户信息修改失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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

    user.password = await hashPassword(resetUserPasswordDto.password);
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
      // 角色名给用户管理页的"分配角色"回显用
      relations: { roles: true },
      skip: skipCount,
      take: pageSize,
      where: condition,
    });

    return {
      // headPic 存的是 OSS Key（或历史遗留路径），给出参时拼成可访问 URL
      users: users.map((user) => ({
        ...user,
        roles: user.roles.map((role) => role.name),
        headPicUrl: this.ossService.resolveAvatarUrl(user.headPic),
      })),
      totalCount,
    };
  }
}
