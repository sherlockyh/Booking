import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class AssignUserRolesDto {
  @IsNotEmpty({
    message: '用户 id 不能为空',
  })
  @IsInt({
    message: '用户 id 必须是整数',
  })
  userId: number;

  // 空数组表示清空该用户的全部角色
  @IsArray({
    message: '角色 id 必须是数组',
  })
  @IsInt({
    each: true,
    message: '角色 id 必须是整数',
  })
  roleIds: number[];
}
