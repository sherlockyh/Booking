import { MeetingRoom } from '@modules/meeting-room/entities/meeting-room.entity';
import { User } from '@modules/user/entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingService {
  @InjectRepository(Booking)
  private readonly bookingRepository: Repository<Booking>;

  async find(
    pageNo: number,
    pageSize: number,
    username: string,
    meetingRoomName: string,
    meetingRoomPosition: string,
    bookingTimeRangeStart: number,
    bookingTimeRangeEnd: number,
    userId?: number,
  ) {
    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {};

    if (userId) {
      condition.user = {
        id: userId,
      };
    }

    if (username) {
      condition.user = {
        ...condition.user,
        username: Like(`%${username}%`),
      };
    }

    if (meetingRoomName) {
      condition.room = {
        name: Like(`%${meetingRoomName}%`),
      };
    }

    if (meetingRoomPosition) {
      if (!condition.room) {
        condition.room = {};
      }
      condition.room.location = Like(`%${meetingRoomPosition}%`);
    }

    if (bookingTimeRangeStart) {
      if (!bookingTimeRangeEnd) {
        bookingTimeRangeEnd = bookingTimeRangeStart + 60 * 60 * 1000;
      }
      condition.startTime = Between(
        new Date(bookingTimeRangeStart),
        new Date(bookingTimeRangeEnd),
      );
    }

    const [bookings, totalCount] = await this.bookingRepository.findAndCount({
        where: condition,
        relations: {
          user: true,
          room: true,
        },
          skip: skipCount,
          take: pageSize,
        },
      );

    return {
      bookings: bookings.map((item) => {
        if (item.user) {
          const { password, ...userWithoutPassword } = item.user;
          return { ...item, user: userWithoutPassword };
        }
        return item;
      }),
      totalCount,
    };
  }

  async add(bookingDto: CreateBookingDto, userId: number) {
    const startTime = new Date(bookingDto.startTime);
    const endTime = new Date(bookingDto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('开始时间必须早于结束时间');
    }

    if (startTime.getTime() < Date.now()) {
      throw new BadRequestException('不能预订过去的时间');
    }

    // 事务 + 悲观锁：冲突检查和写入必须在同一事务里，
    // 否则两个并发请求可能同时通过检查造成双重预订
    await this.bookingRepository.manager.transaction(async (manager) => {
      const meetingRoom = await manager.findOneBy(MeetingRoom, {
        id: bookingDto.meetingRoomId,
      });

      if (!meetingRoom) {
        throw new BadRequestException('会议室不存在');
      }

      const user = await manager.findOneBy(User, {
        id: userId,
      });

      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      // SELECT ... FOR UPDATE 锁住重叠时间段的活动预订（申请中/审批通过），
      // 驳回、已解除的预订不占用时间段；配合 (roomId, startTime, endTime)
      // 组合索引的 next-key 锁防止事务期间插入冲突记录
      const conflict = await manager
        .createQueryBuilder(Booking, 'b')
        .setLock('pessimistic_write')
        .where('b.roomId = :roomId', { roomId: meetingRoom.id })
        .andWhere('b.startTime < :endTime', { endTime })
        .andWhere('b.endTime > :startTime', { startTime })
        .andWhere('b.status IN (:...activeStatuses)', {
          activeStatuses: [
            BookingStatus.APPLYING,
            BookingStatus.APPROVED,
          ],
        })
        .getOne();

      if (conflict) {
        throw new BadRequestException('该时间段已被预定');
      }

      const booking = new Booking();
      booking.room = meetingRoom;
      booking.user = user;
      booking.startTime = startTime;
      booking.endTime = endTime;
      booking.status = BookingStatus.APPLYING;

      await manager.save(booking);
    });
  }

  // 状态机：申请中 → 审批通过/审批驳回；申请中/审批通过 → 已解除
  async apply(id: number) {
    await this.updateStatus(id, BookingStatus.APPROVED, [BookingStatus.APPLYING]);
    return 'success';
  }

  async reject(id: number) {
    await this.updateStatus(id, BookingStatus.REJECTED, [BookingStatus.APPLYING]);
    return 'success';
  }

  async unbind(id: number) {
    await this.updateStatus(id, BookingStatus.RELEASED, [
      BookingStatus.APPLYING,
      BookingStatus.APPROVED,
    ]);
    return 'success';
  }

  private async updateStatus(
    id: number,
    target: BookingStatus,
    allowedFrom: BookingStatus[],
  ) {
    const booking = await this.bookingRepository.findOneBy({ id });

    if (!booking) {
      throw new BadRequestException('预订不存在');
    }

    if (!allowedFrom.includes(booking.status)) {
      throw new BadRequestException(
        `当前状态为「${booking.status}」，不允许变更为「${target}」`,
      );
    }

    await this.bookingRepository.update(id, { status: target });
  }
}
