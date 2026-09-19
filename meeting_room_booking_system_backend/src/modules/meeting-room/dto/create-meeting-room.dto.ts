import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, MaxLength, Min } from 'class-validator';

export class CreateMeetingRoomDto {
  @ApiProperty()
  @IsNotEmpty({
    message: '会议室名称不能为空',
  })
  // 上限与 meeting_room.name 列宽（varchar(50)）对齐
  @MaxLength(50, {
    message: '会议室名称最长为 50 字符',
  })
  name: string;

  @ApiProperty()
  @IsNotEmpty({
    message: '容量不能为空',
  })
  @IsNumber({}, { message: '容量必须是数字' })
  @Min(1, { message: '容量至少为 1' })
  capacity: number;

  @ApiProperty()
  @IsNotEmpty({
    message: '位置不能为空',
  })
  @MaxLength(50, {
    message: '位置最长为 50 字符',
  })
  location: string;
  @ApiProperty()
  @IsNotEmpty({
    message: '设备不能为空',
  })
  @MaxLength(50, {
    message: '设备最长为 50 字符',
  })
  equipment: string;

  @ApiProperty()
  @IsNotEmpty({
    message: '描述不能为空',
  })
  @MaxLength(100, {
    message: '描述最长为 100 字符',
  })
  description: string;
}
