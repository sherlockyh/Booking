import { BadRequestException, Injectable } from '@nestjs/common';
import {
  InjectEntityManager,
  InjectRepository,
} from '@nestjs/typeorm';
import {
  EntityManager,
  FindOptionsWhere,
  Like,
  Repository,
} from 'typeorm';
import { MeetingRoom } from './entities/meeting-room.entity';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import {
  Booking,
  BookingStatus,
} from '@modules/booking/entities/booking.entity';

@Injectable()
export class MeetingRoomService {
  @InjectRepository(MeetingRoom)
  private readonly repository: Repository<MeetingRoom>;

  @InjectEntityManager()
  private readonly manager: EntityManager;

  async find(
    pageNo: number,
    pageSize: number,
    name: string,
    capacity: number,
    equipment: string,
  ) {
    if (pageNo < 1) {
      throw new BadRequestException('页码最小为 1');
    }
    const skipCount = (pageNo - 1) * pageSize;

    const condition: FindOptionsWhere<MeetingRoom> = {};

    if (name) {
      condition.name = Like(`%${name}%`);
    }
    if (equipment) {
      condition.equipment = Like(`%${equipment}%`);
    }
    if (capacity) {
      condition.capacity = capacity;
    }

    const [meetingRooms, totalCount] = await this.repository.findAndCount({
      skip: skipCount,
      take: pageSize,
      where: condition,
    });

    return {
      meetingRooms: await this.fillCurrentBookingStatus(meetingRooms),
      totalCount,
    };
  }

  async create(meetingRoomDto: CreateMeetingRoomDto) {
    const room = await this.repository.findOneBy({
      name: meetingRoomDto.name,
    });
    if (room) {
      throw new BadRequestException('会议室名字已存在');
    }
    try {
      return await this.repository.save(meetingRoomDto);
    } catch (e) {
      // 唯一索引兜底：并发创建同名会议室时由数据库层拦截
      if ((e as { code?: string })?.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('会议室名字已存在');
      }
      throw e;
    }
  }

  async update(meetingRoomDto: UpdateMeetingRoomDto) {
    const exists = await this.repository.existsBy({ id: meetingRoomDto.id });

    if (!exists) {
      throw new BadRequestException('会议室不存在');
    }

    await this.repository.update(meetingRoomDto.id, {
      capacity: meetingRoomDto.capacity,
      location: meetingRoomDto.location,
      name: meetingRoomDto.name,
      description: meetingRoomDto.description,
      equipment: meetingRoomDto.equipment,
    });

    return 'success';
  }

  async findById(id: number) {
    const room = await this.repository.findOneBy({ id });

    if (!room) {
      return room;
    }

    const [withStatus] = await this.fillCurrentBookingStatus([room]);
    return withStatus;
  }

  // isBooked 实时计算：当前时刻被"申请中/审批通过"的预订覆盖即为占用。
  // 一条 IN 查询批量判定，避免逐个会议室查（N+1）
  private async fillCurrentBookingStatus(rooms: MeetingRoom[]) {
    if (rooms.length === 0) {
      return rooms;
    }

    const now = new Date();
    const rows = await this.manager
      .createQueryBuilder(Booking, 'b')
      .select('DISTINCT b.roomId', 'roomId')
      .where('b.roomId IN (:...roomIds)', {
        roomIds: rooms.map((room) => room.id),
      })
      .andWhere('b.status IN (:...activeStatuses)', {
        activeStatuses: [BookingStatus.APPLYING, BookingStatus.APPROVED],
      })
      .andWhere('b.startTime <= :now', { now })
      .andWhere('b.endTime > :now', { now })
      .getRawMany<{ roomId: number }>();

    const bookedRoomIds = new Set(rows.map((row) => Number(row.roomId)));
    return rooms.map((room) => ({
      ...room,
      isBooked: bookedRoomIds.has(room.id),
    }));
  }

  async delete(id: number) {
    // 外键是 CASCADE：不拦截的话删会议室会连带删光它的预订历史
    const bookingCount = await this.manager.countBy(Booking, {
      room: { id },
    });

    if (bookingCount > 0) {
      throw new BadRequestException('该会议室存在关联预订，无法删除');
    }

    await this.repository.delete({ id });
    return 'success';
  }
}
