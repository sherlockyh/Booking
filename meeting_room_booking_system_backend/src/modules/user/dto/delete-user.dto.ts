import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteUserDto {
  @IsNotEmpty({
    message: '用户ID不能为空',
  })
  @IsNumber({}, {
    message: '用户ID必须是数字',
  })
  id: number;
}
