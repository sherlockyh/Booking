import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { MeetingRoom } from './entities/meeting-room.entity';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';

@Injectable()
export class MeetingRoomService {
  @InjectRepository(MeetingRoom)
  private readonly repository: Repository<MeetingRoom>;

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
      meetingRooms,
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
    return await this.repository.save(meetingRoomDto);
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
    return this.repository.findOneBy({ id });
  }

  async delete(id: number) {
    await this.repository.delete({ id });
    return 'success';
  }
}
