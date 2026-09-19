import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMeetingRoomDto } from './create-meeting-room.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateMeetingRoomDto extends PartialType(CreateMeetingRoomDto) {

    @ApiProperty()
    @IsNotEmpty({
        message: 'id 不能为空'
    })
    @IsNumber({}, { message: 'id 必须是数字' })
    id: number;
}

