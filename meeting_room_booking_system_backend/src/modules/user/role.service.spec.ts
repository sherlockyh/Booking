import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleService } from './role.service';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: Record<string, ReturnType<typeof vi.fn>>;
  let permissionRepository: Record<string, ReturnType<typeof vi.fn>>;
  let userRepository: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    service = new RoleService();

    roleRepository = {
      existsBy: vi.fn(),
      findOneBy: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      findAndCount: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    permissionRepository = { find: vi.fn() };
    userRepository = { count: vi.fn(), findOne: vi.fn(), save: vi.fn() };

    (service as unknown as Record<string, unknown>).roleRepository =
      roleRepository;
    (service as unknown as Record<string, unknown>).permissionRepository =
      permissionRepository;
    (service as unknown as Record<string, unknown>).userRepository =
      userRepository;
  });

  describe('create', () => {
    it('角色名重复时拒绝', async () => {
      roleRepository.existsBy.mockResolvedValue(true);

      await expect(
        service.create({ name: 'admin', permissionCodes: [] }),
      ).rejects.toThrow('角色名字已存在');
    });

    it('包含未知权限码时拒绝', async () => {
      roleRepository.existsBy.mockResolvedValue(false);
      // 只查到一个权限，但请求里传了两个 code
      permissionRepository.find.mockResolvedValue([
        { id: 1, code: 'booking:audit' },
      ]);

      await expect(
        service.create({
          name: 'auditor',
          permissionCodes: ['booking:audit', 'not:exist'],
        }),
      ).rejects.toThrow('包含未知的权限码');
    });

    it('正常创建时关联对应权限实体', async () => {
      roleRepository.existsBy.mockResolvedValue(false);
      const perms = [
        { id: 1, code: 'booking:audit' },
        { id: 2, code: 'room:manage' },
      ];
      permissionRepository.find.mockResolvedValue(perms);
      roleRepository.save.mockImplementation(async (role) => role);

      const created = await service.create({
        name: 'auditor',
        permissionCodes: ['booking:audit', 'room:manage'],
      });

      expect(created.permissions).toEqual(perms);
      expect(created.name).toBe('auditor');
    });
  });

  describe('update', () => {
    it('改成别人的角色名时拒绝', async () => {
      roleRepository.findOne.mockResolvedValue({
        id: 2,
        name: 'auditor',
        permissions: [],
      });
      roleRepository.findOneBy.mockResolvedValue({ id: 1, name: 'manager' });

      await expect(
        service.update({ id: 2, name: 'manager', permissionCodes: [] }),
      ).rejects.toThrow('角色名字已存在');
    });

    it('角色不存在时拒绝', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update({ id: 99, name: 'x', permissionCodes: [] }),
      ).rejects.toThrow('角色不存在');
    });
  });

  describe('remove', () => {
    it('内置 admin 角色不允许删除', async () => {
      roleRepository.findOneBy.mockResolvedValue({ id: 1, name: 'admin' });

      await expect(service.remove(1)).rejects.toThrow('内置角色不允许删除');
    });

    it('已分配给用户的角色不允许删除', async () => {
      roleRepository.findOneBy.mockResolvedValue({ id: 2, name: 'manager' });
      userRepository.count.mockResolvedValue(3);

      await expect(service.remove(2)).rejects.toThrow(
        '该角色已分配给用户，请先取消分配',
      );
      expect(roleRepository.delete).not.toHaveBeenCalled();
    });

    it('无绑定的角色正常删除', async () => {
      roleRepository.findOneBy.mockResolvedValue({ id: 2, name: 'manager' });
      userRepository.count.mockResolvedValue(0);
      roleRepository.delete.mockResolvedValue(undefined);

      await expect(service.remove(2)).resolves.toBe('success');
      expect(roleRepository.delete).toHaveBeenCalledWith(2);
    });
  });

  describe('assignUserRoles', () => {
    it('用户不存在时拒绝', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignUserRoles({ userId: 99, roleIds: [1] }),
      ).rejects.toThrow('用户不存在');
    });

    it('包含不存在的角色时拒绝', async () => {
      userRepository.findOne.mockResolvedValue({ id: 10, roles: [] });
      // 请求两个角色但只查到一个
      roleRepository.find.mockResolvedValue([{ id: 1 }]);

      await expect(
        service.assignUserRoles({ userId: 10, roleIds: [1, 2] }),
      ).rejects.toThrow('包含不存在的角色');
    });

    it('空数组表示清空用户角色', async () => {
      const user = { id: 10, roles: [{ id: 1 }] };
      userRepository.findOne.mockResolvedValue(user);

      await service.assignUserRoles({ userId: 10, roleIds: [] });

      expect(user.roles).toEqual([]);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });
  });
});
