import { IsNotEmpty, IsNumber, IsOptional, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty({ message: '会议室名称不能为空' })
  @IsNumber()
  meetingRoomId: number;

  @IsNotEmpty({ message: '开始时间不能为空' })
  @IsNumber()
  startTime: number;

  @IsNotEmpty({ message: '结束时间不能为空' })
  @IsNumber()
  endTime: number;

  @IsOptional()
  @MaxLength(100, { message: '备注最长为 100 字符' })
  note: string;
}
