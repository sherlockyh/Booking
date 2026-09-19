import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Booking, BookingStatus } from '@modules/booking/entities/booking.entity';
import { User } from '@modules/user/entities/user.entity';
import { EntityManager } from 'typeorm';
import { MeetingRoom } from '@modules/meeting-room/entities/meeting-room.entity';

@Injectable()
export class StatisticService {
  @InjectEntityManager()
  private entityManager: EntityManager;

  async userBookingCount(startTime: string, endTime: string) {
    this.validateTimeRange(startTime, endTime);

    const res = await this.entityManager
      .createQueryBuilder(Booking, 'b')
      .select('u.id', 'userId')
      .addSelect('u.username', 'username')
      .leftJoin(User, 'u', 'b.userId = u.id')
      .addSelect('count(1)', 'bookingCount')
      .where('b.startTime between :time1 and :time2', {
        time1: startTime,
        time2: endTime,
      })
      // 驳回、已解除的预订没有实际占用会议室，不计入统计
      .andWhere('b.status in (:...validStatuses)', {
        validStatuses: [BookingStatus.APPLYING, BookingStatus.APPROVED],
      })
      .addGroupBy('b.user')
      .getRawMany();
    return res;
  }

  async meetingRoomUsedCount(startTime: string, endTime: string) {
    this.validateTimeRange(startTime, endTime);

    const res = await this.entityManager
      .createQueryBuilder(Booking, 'b')
      .select('m.id', 'meetingRoomId')
      .addSelect('m.name', 'meetingRoomName')
      .leftJoin(MeetingRoom, 'm', 'b.roomId = m.id')
      .addSelect('count(1)', 'usedCount')
      .where('b.startTime between :time1 and :time2', {
        time1: startTime,
        time2: endTime,
      })
      .andWhere('b.status in (:...validStatuses)', {
        validStatuses: [BookingStatus.APPLYING, BookingStatus.APPROVED],
      })
      .addGroupBy('b.roomId')
      .getRawMany();
    return res;
  }

  // 时间串直接进 SQL between，必须先校验合法性，避免乱串/倒挂区间产生未定义行为
  private validateTimeRange(startTime: string, endTime: string) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
      throw new BadRequestException('时间参数不合法');
    }
  }
}
