import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { PermissionGuard } from './permission.guard';

function createContext(user: unknown) {
  const request = { user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getClass: vi.fn(),
    getHandler: vi.fn(),
  } as Parameters<PermissionGuard['canActivate']>[0];
}

function createGuard(requiredPermissions: string[] | undefined) {
  const guard = new PermissionGuard();
  (guard as unknown as Record<string, unknown>).reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(requiredPermissions),
  };
  return guard;
}

describe('PermissionGuard', () => {
  it('未标注权限码的接口直接放行', async () => {
    const guard = createGuard(undefined);

    await expect(guard.canActivate(createContext(undefined))).resolves.toBe(
      true,
    );
  });

  it('匿名请求访问需要权限的接口时拒绝', async () => {
    const guard = createGuard(['room:manage']);

    await expect(
      guard.canActivate(createContext(undefined)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('isAdmin 走快速通道，不需要权限码', async () => {
    const guard = createGuard(['room:manage']);

    await expect(
      guard.canActivate(
        createContext({ userId: 1, isAdmin: true, permissions: [] }),
      ),
    ).resolves.toBe(true);
  });

  it('持有全部所需权限码时放行', async () => {
    const guard = createGuard(['booking:audit', 'room:manage']);

    await expect(
      guard.canActivate(
        createContext({
          userId: 2,
          isAdmin: false,
          permissions: ['booking:audit', 'room:manage', 'user:manage'],
        }),
      ),
    ).resolves.toBe(true);
  });

  it('缺少任一权限码时拒绝', async () => {
    const guard = createGuard(['booking:audit', 'room:manage']);

    await expect(
      guard.canActivate(
        createContext({
          userId: 2,
          isAdmin: false,
          permissions: ['booking:audit'],
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
