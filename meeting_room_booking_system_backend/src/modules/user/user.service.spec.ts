import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';

describe('UserService login', () => {
  let service: UserService;
  let userRepository: { findOne: ReturnType<typeof vi.fn> };
  let redisService: {
    get: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = new UserService();

    userRepository = { findOne: vi.fn() };
    redisService = {
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(1),
    };

    const props: Record<string, unknown> = {
      userRepository,
      redisService,
      ossService: { resolveAvatarUrl: vi.fn().mockReturnValue(undefined) },
    };
    for (const [key, value] of Object.entries(props)) {
      (service as unknown as Record<string, unknown>)[key] = value;
    }
  });

  it('登录成功清空失败计数', async () => {
    const password = 'pass123456';
    userRepository.findOne.mockResolvedValue({
      id: 1,
      username: 'lisi',
      password: await bcrypt.hash(password, 4),
      isFrozen: false,
      isAdmin: false,
      roles: [],
      nickName: '李四',
      email: 'lisi@test.com',
      phoneNumber: null,
      headPic: null,
      createTime: new Date(),
    });

    const vo = await service.login(
      { username: 'lisi', password },
      false,
    );

    expect(vo.userInfo.id).toBe(1);
    expect(redisService.del).toHaveBeenCalled();
  });

  it('被冻结的用户不能登录', async () => {
    const password = 'pass123456';
    userRepository.findOne.mockResolvedValue({
      id: 1,
      username: 'lisi',
      password: await bcrypt.hash(password, 4),
      isFrozen: true,
      isAdmin: false,
      roles: [],
    });

    await expect(
      service.login({ username: 'lisi', password }, false),
    ).rejects.toThrow('账号已被冻结');
  });

  it('失败次数达到上限后直接限流，不再查库', async () => {
    redisService.get.mockResolvedValue('10');

    await expect(
      service.login({ username: 'lisi', password: 'whatever' }, false),
    ).rejects.toThrow('登录失败次数过多');

    expect(userRepository.findOne).not.toHaveBeenCalled();
  });
});
