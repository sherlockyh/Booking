import { MeetingRoom } from '@modules/meeting-room/entities/meeting-room.entity';
import { User } from '@modules/user/entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThan,
  Like,
  MoreThan,
  Repository,
} from 'typeorm';
import { Booking } from './entities/booking.entity';
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
  ) {
    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {};

    if (username) {
      condition.user = {
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
    const meetingRoom = await this.bookingRepository.manager.findOneBy(MeetingRoom, {
      id: bookingDto.meetingRoomId,
    });

    if (!meetingRoom) {
      throw new BadRequestException('会议室不存在');
    }

    const user = await this.bookingRepository.manager.findOneBy(User, {
      id: userId,
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const booking = new Booking();
    booking.room = meetingRoom;
    booking.user = user;
    booking.startTime = new Date(bookingDto.startTime);
    booking.endTime = new Date(bookingDto.endTime);

    // 检查时间冲突：新时间段与已有预定的时间段有重叠即冲突
    const conflict = await this.bookingRepository.findOne({
      where: {
        room: { id: meetingRoom.id },
        startTime: LessThan(booking.endTime),
        endTime: MoreThan(booking.startTime),
      },
    });

    if (conflict) {
      throw new BadRequestException('该时间段已被预定');
    }

    await this.bookingRepository.save(booking);
  }

  async apply(id: number) {
    await this.bookingRepository.update(id, { status: '审批通过' });
    return 'success';
  }

  async reject(id: number) {
    await this.bookingRepository.update(id, { status: '审批驳回' });
    return 'success';
  }

  async unbind(id: number) {
    await this.bookingRepository.update(id, { status: '已解除' });
    return 'success';
  }
}
