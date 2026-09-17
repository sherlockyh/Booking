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
  RequireAdmin,
  RequireLogin,
  UserInfo,
} from '@common/decorators/custom.decorator';
import { UserDetailVo } from './vo/user-info.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { generateParseIntPipe } from '@common/utils';
import path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { storage } from '@common/utils/my-file-storage';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(ConfigService)
  private configService: ConfigService;

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

  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);
      const user = await this.userService.findUserById(data.userId, false);
      if (!user?.id) {
        throw new Error('user not found');
      }
      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);
      const user = await this.userService.findUserById(data.userId, true);
      if (!user?.id) {
        throw new Error('user not found');
      }
      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  private generateTokens(userInfo: {
    id?: number;
    username?: string;
    isAdmin?: boolean;
    roles?: string[];
    permissions?: unknown[];
  }) {
    const accessToken = this.jwtService.sign(
      {
        userId: userInfo.id,
        username: userInfo.username,
        isAdmin: userInfo.isAdmin,
        roles: userInfo.roles,
        permissions: userInfo.permissions,
      },
      {
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        userId: userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expires_time') || '7d',
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
  @RequireAdmin()
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId);
    return 'success';
  }

  @Get('unfreeze')
  @RequireAdmin()
  async unfreeze(@Query('id') userId: number) {
    await this.userService.unfreezeUserById(userId);
    return 'success';
  }

  @Get('list')
  @RequireAdmin()
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      generateParseIntPipe('pageSize'),
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
  @RequireAdmin()
  async resetPasswordByAdmin(
    @Body() resetUserPasswordDto: ResetUserPasswordDto,
  ) {
    return await this.userService.resetPasswordByAdmin(resetUserPasswordDto);
  }

  @Post('admin/delete')
  @RequireAdmin()
  async deleteByAdmin(@Body() deleteUserDto: DeleteUserDto) {
    return await this.userService.deleteUserByAdmin(deleteUserDto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads',
      storage: storage,
      limits: {
        fileSize: 1024 * 1024 * 3,
      },
      fileFilter(req, file, callback) {
        const extname = path.extname(file.originalname);
        if (['.png', '.jpg', '.gif'].includes(extname)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('只能上传图片'), false);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return file.path;
  }
}
