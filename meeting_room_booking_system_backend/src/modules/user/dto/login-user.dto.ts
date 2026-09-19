import { IsNotEmpty, MaxLength } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty({
    message: '用户名不能为空',
  })
  @MaxLength(50, {
    message: '用户名最长为 50 字符',
  })
  username: string;

  @IsNotEmpty({
    message: '密码不能为空',
  })
  @MaxLength(50, {
    message: '密码最长为 50 字符',
  })
  password: string;
}
