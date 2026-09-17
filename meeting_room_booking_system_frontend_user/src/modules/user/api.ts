import { httpGet, httpPost } from "@/shared/api/request";
import type { CaptchaResult } from "@/modules/user/auth/types";
import type {
  UpdatePasswordParams,
  UpdateProfileParams,
  UserInfo,
} from "@/modules/user/types";
import type {
  MeetingRoomItem,
  MeetingRoomSearchParams,
  BookingItem,
  BookingSearchParams,
  UserBookingCountItem,
  MeetingRoomUsedCountItem,
} from "@/modules/admin/types";

export function getUserInfo() {
  return httpGet<UserInfo>("/user/info");
}

export function getUpdateProfileCaptcha() {
  return httpGet<CaptchaResult>("/user/update/captcha");
}

export function updateProfile(params: UpdateProfileParams) {
  return httpPost<string, UpdateProfileParams>("/user/update", params);
}

export function uploadUserFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return httpPost<string, FormData>("/user/upload", formData);
}

export function getUpdatePasswordCaptcha() {
  return httpGet<CaptchaResult>("/user/update_password/captcha");
}

export function updatePassword(params: UpdatePasswordParams) {
  return httpPost<string, UpdatePasswordParams>(
    "/user/update_password",
    params,
  );
}

interface MeetingRoomListResponse {
  meetingRooms: MeetingRoomItem[];
  totalCount: number;
}

export function getMeetingRoomList(
  params: { pageNo: number; pageSize: number } & MeetingRoomSearchParams,
) {
  return httpGet<MeetingRoomListResponse>("/meeting-room/list", {
    params: params as unknown as Record<string, unknown>,
  }).then((result) => {
    return {
      list: result.meetingRooms,
      total: result.totalCount,
    };
  });
}

// --- 用户预定 ---

interface BookingListResponse {
  bookings: BookingItem[];
  totalCount: number;
}

export function getBookingList(
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

  return httpGet<BookingListResponse>("/booking/list", {
    params: queryParams,
  }).then((result) => {
    return {
      list: result.bookings,
      total: result.totalCount,
    };
  });
}

export function addBooking(params: {
  meetingRoomId: number;
  startTime: number;
  endTime: number;
  note: string;
}) {
  return httpPost<string, typeof params>("/booking/add", params);
}

export function unbindBooking(id: number) {
  return httpGet<string>(`/booking/unbind/${id}`);
}

// --- 统计模块 ---

export function getUserBookingCount(params: {
  startTime: string;
  endTime: string;
}) {
  return httpGet<UserBookingCountItem[]>("/statistic/userBookingCount", {
    params: params as unknown as Record<string, unknown>,
  });
}

export function getMeetingRoomUsedCount(params: {
  startTime: string;
  endTime: string;
}) {
  return httpGet<MeetingRoomUsedCountItem[]>(
    "/statistic/meetingRoomUsedCount",
    {
      params: params as unknown as Record<string, unknown>,
    },
  );
}
