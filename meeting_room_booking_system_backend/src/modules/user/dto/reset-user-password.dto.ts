import { IsNotEmpty, IsNumber, MaxLength, MinLength } from 'class-validator';

export class ResetUserPasswordDto {
  @IsNotEmpty({
    message: '用户ID不能为空',
  })
  @IsNumber({}, {
    message: '用户ID必须是数字',
  })
  id: number;

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
}
