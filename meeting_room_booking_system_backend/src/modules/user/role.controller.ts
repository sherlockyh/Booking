import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { generateMaxValuePipe, generateParseIntPipe } from '@common/utils';
import { RequireLogin, RequirePermission } from '@common/decorators/custom.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignUserRolesDto } from './dto/assign-user-roles.dto';

// 角色的增删改归 role:manage；
// 查询类接口放宽到登录即可：只持有 user:manage 的管理员
// 也要拉角色列表做"分配角色"
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('permission/list')
  @RequireLogin()
  async listPermissions() {
    return await this.roleService.findPermissions();
  }

  @Get('list')
  @RequireLogin()
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      generateParseIntPipe('pageSize'),
      generateMaxValuePipe('pageSize', 100),
    )
    pageSize: number,
  ) {
    return await this.roleService.find(pageNo, pageSize);
  }

  @Post('create')
  @RequirePermission('role:manage')
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.roleService.create(createRoleDto);
  }

  @Put('update')
  @RequirePermission('role:manage')
  async update(@Body() updateRoleDto: UpdateRoleDto) {
    return await this.roleService.update(updateRoleDto);
  }

  @Delete(':id')
  @RequirePermission('role:manage')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.roleService.remove(id);
  }

  // 给用户分配角色属于用户管理动作，归 user:manage
  @Post('assign-users')
  @RequirePermission('user:manage')
  async assignUsers(@Body() assignDto: AssignUserRolesDto) {
    return await this.roleService.assignUserRoles(assignDto);
  }
}
