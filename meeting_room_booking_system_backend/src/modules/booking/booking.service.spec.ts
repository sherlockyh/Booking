import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingStatus } from './entities/booking.entity';

function createQueryBuilderMock(conflict: unknown) {
  return {
    setLock: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getOne: vi.fn().mockResolvedValue(conflict),
  };
}

describe('BookingService', () => {
  let service: BookingService;
  let manager: {
    findOneBy: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let bookingRepository: {
    manager: { transaction: ReturnType<typeof vi.fn> };
    findOneBy: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = new BookingService();

    manager = {
      findOneBy: vi.fn(),
      save: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    bookingRepository = {
      manager: {
        transaction: vi.fn(async (cb: (m: typeof manager) => Promise<void>) =>
          cb(manager),
        ),
      },
      findOneBy: vi.fn(),
      update: vi.fn(),
    };

    (service as unknown as Record<string, unknown>).bookingRepository =
      bookingRepository;
  });

  describe('add 时间校验', () => {
    const validStart = Date.now() + 60 * 60 * 1000;

    it('开始时间晚于结束时间时拒绝', async () => {
      await expect(
        service.add(
          {
            meetingRoomId: 1,
            startTime: validStart + 1000,
            endTime: validStart,
            note: '',
          },
          1,
        ),
      ).rejects.toThrow('开始时间必须早于结束时间');
      expect(bookingRepository.manager.transaction).not.toHaveBeenCalled();
    });

    it('预订过去的时间时拒绝', async () => {
      await expect(
        service.add(
          {
            meetingRoomId: 1,
            startTime: Date.now() - 60 * 1000,
            endTime: Date.now() + 60 * 1000,
            note: '',
          },
          1,
        ),
      ).rejects.toThrow('不能预订过去的时间');
    });
  });

  describe('add 冲突检查', () => {
    const start = Date.now() + 60 * 60 * 1000;
    const dto = {
      meetingRoomId: 1,
      startTime: start,
      endTime: start + 30 * 60 * 1000,
      note: '',
    };

    beforeEach(() => {
      manager.findOneBy
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 10 });
    });

    it('存在时间重叠的活动预订时拒绝，且不写入', async () => {
      const qb = createQueryBuilderMock({ id: 99 });
      manager.createQueryBuilder.mockReturnValue(qb);

      await expect(service.add(dto, 10)).rejects.toThrow('该时间段已被预定');
      expect(manager.save).not.toHaveBeenCalled();
      // 悲观锁必须开启
      expect(qb.setLock).toHaveBeenCalledWith('pessimistic_write');
    });

    it('无冲突时写入申请中状态的预订', async () => {
      manager.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(null),
      );
      manager.save.mockResolvedValue(undefined);

      await service.add(dto, 10);

      expect(manager.save).toHaveBeenCalledTimes(1);
      const saved = manager.save.mock.calls[0][0];
      expect(saved.status).toBe(BookingStatus.APPLYING);
      expect(saved.room).toEqual({ id: 1 });
      expect(saved.user).toEqual({ id: 10 });
    });

    it('冲突检查只把申请中/审批通过视为占用', async () => {
      const qb = createQueryBuilderMock(null);
      manager.createQueryBuilder.mockReturnValue(qb);
      manager.save.mockResolvedValue(undefined);

      await service.add(dto, 10);

      const statusCall = qb.andWhere.mock.calls
        .map((call) => call[0] as string)
        .find((sql) => sql.includes('status'));
      expect(statusCall?.toLowerCase()).toContain('in (:...activestatuses)');
    });
  });

  describe('审批状态机', () => {
    it('预订不存在时报错而不是静默成功', async () => {
      bookingRepository.findOneBy.mockResolvedValue(null);

      await expect(service.apply(1)).rejects.toThrow('预订不存在');
    });

    it('申请中 → 审批通过', async () => {
      bookingRepository.findOneBy.mockResolvedValue({
        id: 1,
        status: BookingStatus.APPLYING,
      });

      await service.apply(1);

      expect(bookingRepository.update).toHaveBeenCalledWith(1, {
        status: BookingStatus.APPROVED,
      });
    });

    it('审批通过的预订不能重复审批', async () => {
      bookingRepository.findOneBy.mockResolvedValue({
        id: 1,
        status: BookingStatus.APPROVED,
      });

      await expect(service.apply(1)).rejects.toThrow(BadRequestException);
      expect(bookingRepository.update).not.toHaveBeenCalled();
    });

    it('审批通过的预订可以解除', async () => {
      bookingRepository.findOneBy.mockResolvedValue({
        id: 1,
        status: BookingStatus.APPROVED,
      });

      await service.unbind(1);

      expect(bookingRepository.update).toHaveBeenCalledWith(1, {
        status: BookingStatus.RELEASED,
      });
    });

    it('已驳回的预订不能解除', async () => {
      bookingRepository.findOneBy.mockResolvedValue({
        id: 1,
        status: BookingStatus.REJECTED,
      });

      await expect(service.unbind(1)).rejects.toThrow(BadRequestException);
    });
  });
});
