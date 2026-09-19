import { IsArray, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString({
    message: '角色名必须是字符串',
  })
  @MaxLength(20, {
    message: '角色名最长 20 字符',
  })
  name: string;

  @IsArray({
    message: '权限码必须是数组',
  })
  @IsString({
    each: true,
    message: '权限码必须是字符串',
  })
  permissionCodes: string[];
}
