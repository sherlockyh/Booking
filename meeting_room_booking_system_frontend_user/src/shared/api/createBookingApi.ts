import type { AxiosRequestConfig } from 'axios';
import type {
  MeetingRoomItem,
  MeetingRoomSearchParams,
  BookingItem,
  BookingSearchParams,
  UserBookingCountItem,
  MeetingRoomUsedCountItem,
} from '@/modules/admin/types';

interface MeetingRoomListResponse {
  meetingRooms: MeetingRoomItem[];
  totalCount: number;
}

interface BookingListResponse {
  bookings: BookingItem[];
  totalCount: number;
}

type HttpGetFn = <T>(
  url: string,
  config?: AxiosRequestConfig,
) => Promise<T>;

// 用户端与管理端共用的列表/统计查询：
// 两侧仅 axios 实例（token scope）不同，参数组装完全一致，抽工厂消除重复
export function createBookingApi(httpGet: HttpGetFn) {
  return {
    getMeetingRoomList(
      params: { pageNo: number; pageSize: number } & MeetingRoomSearchParams,
    ) {
      return httpGet<MeetingRoomListResponse>('/meeting-room/list', {
        params: params as unknown as Record<string, unknown>,
      }).then((result) => {
        return {
          list: result.meetingRooms,
          total: result.totalCount,
        };
      });
    },

    getBookingList(
      params: { pageNo: number; pageSize: number } & BookingSearchParams,
    ) {
      const queryParams: Record<string, unknown> = {
        pageNo: params.pageNo,
        pageSize: params.pageSize,
        username: params.username || undefined,
        meetingRoomName: params.meetingRoomName || undefined,
        meetingRoomPosition: params.meetingRoomPosition || undefined,
        bookingTimeRangeStart: params.bookingTimeRangeStart
          ? Number(params.bookingTimeRangeStart)
          : undefined,
        bookingTimeRangeEnd: params.bookingTimeRangeEnd
          ? Number(params.bookingTimeRangeEnd)
          : undefined,
      };

      return httpGet<BookingListResponse>('/booking/list', {
        params: queryParams,
      }).then((result) => {
        return {
          list: result.bookings,
          total: result.totalCount,
        };
      });
    },

    unbindBooking(id: number) {
      return httpGet<string>(`/booking/unbind/${id}`);
    },

    getUserBookingCount(params: { startTime: string; endTime: string }) {
      return httpGet<UserBookingCountItem[]>('/statistic/userBookingCount', {
        params: params as unknown as Record<string, unknown>,
      });
    },

    getMeetingRoomUsedCount(params: { startTime: string; endTime: string }) {
      return httpGet<MeetingRoomUsedCountItem[]>(
        '/statistic/meetingRoomUsedCount',
        {
          params: params as unknown as Record<string, unknown>,
        },
      );
    },
  };
}
