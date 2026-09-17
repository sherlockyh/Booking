import { IsNotEmpty, IsUUID, MinLength } from 'class-validator';

export class UpdateUserPasswordDto {
  @IsNotEmpty({
    message: '密码不能为空',
  })
  @MinLength(6, {
    message: '密码不能少于 6 位',
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
