import {
  Controller,
  Body,
  Get,
  Post,
  Inject,
  UnauthorizedException,
  Query,
  BadRequestException,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  RequireLogin,
  RequirePermission,
  UserInfo,
} from '@common/decorators/custom.decorator';
import { UserDetailVo } from './vo/user-info.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { generateMaxValuePipe, generateParseIntPipe } from '@common/utils';
import { RedisService } from '@infrastructure/redis/redis.service';
import { randomUUID } from 'node:crypto';
import path from 'path';
import * as multer from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { OssService } from '@infrastructure/oss/oss.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(ConfigService)
  private configService: ConfigService;

  @Inject(OssService)
  private ossService: OssService;

  @Inject(RedisService)
  private redisService: RedisService;

  @Get('captcha')
  async getRegisterCaptcha() {
    return await this.userService.getRegisterCaptcha();
  }

  @Get(['update_password/captcha', 'admin/update_password/captcha'])
  @RequireLogin()
  async getUpdatePasswordCaptcha(@UserInfo('userId') userId: number) {
    return await this.userService.getUpdatePasswordCaptcha(userId);
  }

  @Get(['update/captcha', 'admin/update/captcha'])
  @RequireLogin()
  async getUpdateUserCaptcha(@UserInfo('userId') userId: number) {
    return await this.userService.getUpdateUserCaptcha(userId);
  }

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false);
    const { accessToken, refreshToken } = this.generateTokens(vo.userInfo);
    vo.accessToken = accessToken;
    vo.refreshToken = refreshToken;
    return vo;
  }

  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true);
    const { accessToken, refreshToken } = this.generateTokens(vo.userInfo);
    vo.accessToken = accessToken;
    vo.refreshToken = refreshToken;
    return vo;
  }

  // refresh token 只走 POST + body 传输：GET + query 会让 token 落到
  // nginx access log / 代理日志里，造成泄露面扩大
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    return this.refreshTokens(body.refreshToken, false);
  }

  @Post('admin/refresh')
  async adminRefresh(@Body() body: RefreshTokenDto) {
    return this.refreshTokens(body.refreshToken, true);
  }

  private async refreshTokens(refreshToken: string, isAdmin: boolean) {
    try {
      const data = this.jwtService.verify<{
        typ?: string;
        userId: number;
        jti?: string;
        exp?: number;
      }>(refreshToken);

      // access token 不能用来刷新，否则 token 可以无限自我续期
      if (data.typ !== 'refresh') {
        throw new UnauthorizedException('token 已失效，请重新登录');
      }

      // refresh token 一次性使用：轮转后旧 token 的 jti 进黑名单
      if (
        data.jti &&
        (await this.redisService.get(this.getRevokedRefreshTokenKey(data.jti)))
      ) {
        throw new UnauthorizedException('token 已失效，请重新登录');
      }

      const user = await this.userService.findUserById(data.userId, isAdmin);
      if (!user?.id) {
        throw new UnauthorizedException('token 已失效，请重新登录');
      }
      // 账号被冻结后拒绝刷新，冻结在下一次刷新时生效
      if (user.isFrozen) {
        throw new UnauthorizedException('账号已被冻结，请联系管理员');
      }

      // 签发新 token 后作废旧 refresh token，黑名单 TTL 设为旧 token 的剩余有效期
      if (data.jti && data.exp) {
        const ttl = data.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.set(
            this.getRevokedRefreshTokenKey(data.jti),
            '1',
            ttl,
          );
        }
      }

      return this.generateTokens(user);
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  private getRevokedRefreshTokenKey(jti: string) {
    return `jwt_refresh_revoked_${jti}`;
  }

  private generateTokens(userInfo: {
    id?: number;
    username?: string;
    isAdmin?: boolean;
    roles?: string[];
    permissions?: unknown[];
  }) {
    // typ 声明 token 类型：LoginGuard 只放行 access，
    // /refresh 只收 refresh，两类 token 不能互用
    const accessToken = this.jwtService.sign(
      {
        typ: 'access',
        userId: userInfo.id,
        username: userInfo.username,
        isAdmin: userInfo.isAdmin,
        roles: userInfo.roles,
        permissions: userInfo.permissions,
      },
      {
        expiresIn: this.configService.get('jwt.expiresIn') || '30m',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        typ: 'refresh',
        userId: userInfo.id,
      },
      {
        expiresIn: this.configService.get('jwt.refreshExpiresIn') || '7d',
        // 唯一 id 用于轮转时把旧 token 拉黑
        jwtid: randomUUID(),
      },
    );

    return { accessToken, refreshToken };
  }

  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    const user = await this.userService.findUserDetailById(userId);

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const vo = new UserDetailVo();
    vo.id = user.id;
    vo.email = user.email;
    vo.username = user.username;
    vo.headPic = user.headPic;
    vo.headPicUrl = this.ossService.resolveAvatarUrl(user.headPic);
    vo.phoneNumber = user.phoneNumber;
    vo.nickName = user.nickName;
    vo.createTime = user.createTime.getTime();
    vo.isFrozen = user.isFrozen;

    return vo;
  }

  @Post(['update_password', 'admin/update_password'])
  @RequireLogin()
  async updatePassword(
    @UserInfo('userId') userId: number,
    @Body() passwordDto: UpdateUserPasswordDto,
  ) {
    return await this.userService.updatePassword(userId, passwordDto);
  }

  @Post(['update', 'admin/update'])
  @RequireLogin()
  async update(
    @UserInfo('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(userId, updateUserDto);
  }

  @Get('freeze')
  @RequirePermission('user:manage')
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId);
    return 'success';
  }

  @Get('unfreeze')
  @RequirePermission('user:manage')
  async unfreeze(@Query('id') userId: number) {
    await this.userService.unfreezeUserById(userId);
    return 'success';
  }

  @Get('list')
  @RequirePermission('user:manage')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      generateParseIntPipe('pageSize'),
      generateMaxValuePipe('pageSize', 100),
    )
    pageSize: number,
    @Query('username') username: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string,
  ) {
    return await this.userService.findUsers(
      username,
      nickName,
      email,
      pageNo,
      pageSize,
    );
  }

  @Post('admin/reset_password')
  @RequirePermission('user:manage')
  async resetPasswordByAdmin(
    @Body() resetUserPasswordDto: ResetUserPasswordDto,
  ) {
    return await this.userService.resetPasswordByAdmin(resetUserPasswordDto);
  }

  @Post('admin/delete')
  @RequirePermission('user:manage')
  async deleteByAdmin(@Body() deleteUserDto: DeleteUserDto) {
    return await this.userService.deleteUserByAdmin(deleteUserDto);
  }

  // 上传接口：FileInterceptor 拦截 multipart/form-data 请求，
  // 解析出名为 "file" 的文件字段（前端 FormData.append('file', ...) 对应这个名字），
  // 解析结果挂在 request.file 上，再通过 @UploadedFile() 注入进来。
  // multer 的处理管线 = storage（存哪里）+ limits（限制）+ fileFilter（收不收）
  @Post('upload')
  @RequireLogin()
  @UseInterceptors(
    FileInterceptor('file', {
      // memoryStorage：文件先缓冲进内存（req.file.buffer），由我们的代码决定去向——
      // 这里是转存 MinIO。旧版 diskStorage 是直接写本地磁盘，文件生命周期和应用绑死。
      // 注意代价：3MB 上限下内存缓冲没问题，若以后传大文件应改用流式直传 MinIO
      storage: multer.memoryStorage(),
      // 超过 3MB 的请求在 multer 层就被拒绝，不会进入业务代码
      limits: {
        fileSize: 1024 * 1024 * 3,
      },
      // fileFilter：返回 true 收下文件 / 抛错拒绝。
      // 扩展名 + 声明的 MIME 双重校验，两头都拦截明显伪装的文件；
      // 真正落盘的文件名由 OssService 随机生成，用户的原始文件名不参与存储路径
      fileFilter(req, file, callback) {
        const extname = path.extname(file.originalname).toLowerCase();
        const allowedMime = ['image/png', 'image/jpeg', 'image/gif'];
        if (['.png', '.jpg', '.gif'].includes(extname) && allowedMime.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('只能上传图片'), false);
        }
      },
    }),
  )
  // file 可选：fileFilter 拒绝时（比如没传字段）Nest 不会执行到这里，
  // 但没带文件字段的请求会带着 file === undefined 进来，所以要兜底校验
  async uploadFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    // 返回值约定为"可直接访问的 URL 字符串"，
    // 前端 ImageUpload 组件拿到后回填表单，随资料更新一起存进 users.head_pic
    return await this.ossService.uploadAvatar(file);
  }
}
