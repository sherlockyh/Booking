import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Permission } from '@modules/user/entities/permission.entity';
import { UnLoginException } from '@common/filter/unlogin.filter';

interface JwtUserData {
  // token 类型：access 可调业务接口，refresh 只能调 /refresh
  typ: 'access' | 'refresh';
  userId: number;
  username: string;
  isAdmin?: boolean;
  roles: string[];
  permissions: Permission[];
}

declare module 'express' {
  interface Request {
    user: JwtUserData;
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  @Inject()
  private reflector: Reflector;

  @Inject(JwtService)
  private jwtService: JwtService;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const requireLogin = this.reflector.getAllAndOverride('require-login', [
      context.getClass(),
      context.getHandler(),
    ]);
    const requireAdmin = this.reflector.getAllAndOverride('require-admin', [
      context.getClass(),
      context.getHandler(),
    ]);

    if (!requireLogin && !requireAdmin) {
      return true;
    }

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnLoginException();
    }

    try {
      const token = authorization.split(' ')[1];
      const data = this.jwtService.verify<JwtUserData>(token);

      // refresh token 不能当 access token 使用：不放行，
      // 走 UnLoginException 让前端进入正常的刷新流程
      if (data.typ !== 'access') {
        throw new UnLoginException();
      }

      if (requireAdmin && !data.isAdmin) {
        throw new UnauthorizedException('您没有访问该接口的权限');
      }

      request.user = {
        typ: data.typ,
        userId: data.userId,
        username: data.username,
        isAdmin: data.isAdmin,
        roles: data.roles,
        permissions: data.permissions,
      };

      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnLoginException();
    }
  }
}
