import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject(Reflector)
  private reflector: Reflector;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'require-permission',
      [context.getClass(), context.getHandler()],
    );

    // 没标注权限码的接口不归这个守卫管
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // LoginGuard 在前，标了权限码的接口理论上必有 user；这里兜底拒绝匿名
    if (!request.user) {
      throw new ForbiddenException('您没有访问该接口的权限');
    }

    // isAdmin 是超级管理员快速通道：不依赖角色数据，
    // 保证角色配置丢失/出错时 admin 账号不会被锁在门外
    if (request.user.isAdmin) {
      return true;
    }

    const permissions = request.user.permissions ?? [];

    // requiredPermissions 全部命中才放行
    const hasAll = requiredPermissions.every((code) =>
      permissions.includes(code),
    );
    if (!hasAll) {
      throw new ForbiddenException('您没有访问该接口的权限');
    }

    return true;
  }
}
