import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  // 可选字段必须显式声明校验装饰器：全局 ValidationPipe 开了 whitelist，
  // 没有装饰器的属性会在进 service 前被整个剥离，导致更新静默失效
  @IsOptional()
  @IsString({
    message: '头像地址必须是字符串',
  })
  @MaxLength(100, {
    message: '头像地址最长 100 字符',
  })
  headPic: string;

  @IsOptional()
  @IsString({
    message: '昵称必须是字符串',
  })
  @MaxLength(50, {
    message: '昵称最长 50 字符',
  })
  nickName: string;

  @IsNotEmpty({
    message: '邮箱不能为空',
  })
  @IsEmail(
    {},
    {
      message: '不是合法的邮箱格式',
    },
  )
  email: string;

  @IsNotEmpty({
    message: '验证码不能为空',
  })
  captcha: string;
}
