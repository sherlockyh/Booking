import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { generateMaxValuePipe, generateParseIntPipe } from '@common/utils';
import { RequireAdmin, RequireLogin, UserInfo } from '@common/decorators/custom.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('list')
  @RequireLogin()
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      generateParseIntPipe('pageSize'),
      generateMaxValuePipe('pageSize', 100),
    )
    pageSize: number,
    @Query('username') username: string,
    @Query('meetingRoomName') meetingRoomName: string,
    @Query('meetingRoomPosition') meetingRoomPosition: string,
    @Query('bookingTimeRangeStart') bookingTimeRangeStart: number,
    @Query('bookingTimeRangeEnd') bookingTimeRangeEnd: number,
    // 非管理员强制只看自己的预订，防止越权拉取全量数据
    @UserInfo() user: { userId: number; isAdmin: boolean },
  ) {
    return this.bookingService.find(
      pageNo,
      pageSize,
      username,
      meetingRoomName,
      meetingRoomPosition,
      bookingTimeRangeStart,
      bookingTimeRangeEnd,
      user.isAdmin ? undefined : user.userId,
    );
  }

  @Post('add')
  @RequireLogin()
  async add(
    @Body() booking: CreateBookingDto,
    @UserInfo('userId') userId: number,
  ) {
    await this.bookingService.add(booking, userId);
    return 'success';
  }

  @Get('apply/:id')
  @RequireAdmin()
  async apply(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.apply(id);
  }

  @Get('reject/:id')
  @RequireAdmin()
  async reject(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.reject(id);
  }

  // 普通用户可解除自己的预订，管理员可解除任意预订
  @Get('unbind/:id')
  @RequireLogin()
  async unbind(
    @Param('id', ParseIntPipe) id: number,
    @UserInfo() user: { userId: number; isAdmin: boolean },
  ) {
    return this.bookingService.unbind(id, user);
  }
}
