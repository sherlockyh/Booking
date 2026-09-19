import { IsInt, IsNotEmpty } from 'class-validator';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto extends CreateRoleDto {
  @IsNotEmpty({
    message: '角色 id 不能为空',
  })
  @IsInt({
    message: '角色 id 必须是整数',
  })
  id: number;
}
