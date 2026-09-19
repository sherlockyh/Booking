import { IsNotEmpty, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateUserPasswordDto {
  @IsNotEmpty({
    message: '密码不能为空',
  })
  @MinLength(6, {
    message: '密码不能少于 6 位',
  })
  @MaxLength(50, {
    message: '密码最长为 50 字符',
  })
  password: string;

  @IsNotEmpty({
    message: '验证码标识不能为空',
  })
  @IsUUID(undefined, {
    message: '验证码标识格式不正确',
  })
  captchaId: string;

  @IsNotEmpty({
    message: '验证码不能为空',
  })
  captcha: string;
}
