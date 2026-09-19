import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Request } from 'express';

export const RequireLogin = () => SetMetadata('require-login', true);

// 标注权限码的接口同时要求登录：LoginGuard 只认 require-login/require-admin
// 元数据，不设置的话匿名请求会带着空的 request.user 进入 PermissionGuard
export const RequirePermission = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata('require-login', true),
    SetMetadata('require-permission', permissions),
  );

export const RequireAdmin = () => SetMetadata('require-admin', true);

/**
 * 用户信息
 */
export const UserInfo = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request: any = ctx.switchToHttp().getRequest<Request>();

    if (!request.user) {
      return null;
    }
    return data ? request.user[data] : request.user;
  },
);
