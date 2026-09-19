import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { User } from './entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignUserRolesDto } from './dto/assign-user-roles.dto';

@Injectable()
export class RoleService {
  @InjectRepository(Role)
  private roleRepository: Repository<Role>;

  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  @InjectRepository(User)
  private userRepository: Repository<User>;

  async findPermissions() {
    return this.permissionRepository.find();
  }

  async find(pageNo: number, pageSize: number) {
    const [roles, totalCount] = await this.roleRepository.findAndCount({
      relations: { permissions: true },
      skip: (pageNo - 1) * pageSize,
      take: pageSize,
    });

    return {
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions.map((permission) => permission.code),
      })),
      totalCount,
    };
  }

  async create(createRoleDto: CreateRoleDto) {
    const exists = await this.roleRepository.existsBy({
      name: createRoleDto.name,
    });
    if (exists) {
      throw new BadRequestException('角色名字已存在');
    }

    const role = new Role();
    role.name = createRoleDto.name;
    role.permissions = await this.findPermissionsByCodes(
      createRoleDto.permissionCodes,
    );

    try {
      return await this.roleRepository.save(role);
    } catch (e) {
      // roles.name 无唯一索引，这里只是防御并发下的重复保存报错
      if ((e as { code?: string })?.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('角色名字已存在');
      }
      throw e;
    }
  }

  async update(updateRoleDto: UpdateRoleDto) {
    const role = await this.roleRepository.findOne({
      where: { id: updateRoleDto.id },
      relations: { permissions: true },
    });

    if (!role) {
      throw new BadRequestException('角色不存在');
    }

    const sameName = await this.roleRepository.findOneBy({
      name: updateRoleDto.name,
    });
    if (sameName && sameName.id !== role.id) {
      throw new BadRequestException('角色名字已存在');
    }

    role.name = updateRoleDto.name;
    // many-to-many 关联整体替换：save 时 TypeORM 自动做差量增删
    role.permissions = await this.findPermissionsByCodes(
      updateRoleDto.permissionCodes,
    );

    return this.roleRepository.save(role);
  }

  async remove(id: number) {
    const role = await this.roleRepository.findOneBy({ id });

    if (!role) {
      throw new BadRequestException('角色不存在');
    }

    // admin 是内置超级角色，seed 时绑定给管理员账号
    if (role.name === 'admin') {
      throw new BadRequestException('内置角色不允许删除');
    }

    // 有用户在用这个角色时删除会导致这些用户静默丢权限
    const userCount = await this.userRepository.count({
      where: { roles: { id } },
    });
    if (userCount > 0) {
      throw new BadRequestException('该角色已分配给用户，请先取消分配');
    }

    await this.roleRepository.delete(id);
    return 'success';
  }

  // 整体替换某用户的角色：空数组即清空
  async assignUserRoles(assignDto: AssignUserRolesDto) {
    const user = await this.userRepository.findOne({
      where: { id: assignDto.userId },
      relations: { roles: true },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    if (assignDto.roleIds.length > 0) {
      const roles = await this.roleRepository.find({
        where: { id: In(assignDto.roleIds) },
      });
      if (roles.length !== assignDto.roleIds.length) {
        throw new BadRequestException('包含不存在的角色');
      }
      user.roles = roles;
    } else {
      user.roles = [];
    }

    await this.userRepository.save(user);
    return 'success';
  }

  // 按 code 查权限实体，数量对不上说明传了未知权限码
  private async findPermissionsByCodes(codes: string[]) {
    if (codes.length === 0) {
      return [];
    }

    const permissions = await this.permissionRepository.find({
      where: { code: In(codes) },
    });

    if (permissions.length !== new Set(codes).size) {
      throw new BadRequestException('包含未知的权限码');
    }

    return permissions;
  }
}
