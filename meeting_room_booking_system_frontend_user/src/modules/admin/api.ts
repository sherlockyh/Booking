import {
  adminHttpGet,
  adminHttpPost,
  adminHttpPut,
  adminHttpDelete,
} from "@/shared/api/request";
import type {
  LoginParams,
  LoginResult,
  AdminUserItem,
  ResetPasswordParams,
  AdminUserSearchParams,
  DeleteUserParams,
  MeetingRoomItem,
  MeetingRoomSearchParams,
  CreateMeetingRoomParams,
  UpdateMeetingRoomParams,
  BookingItem,
  BookingSearchParams,
  UserBookingCountItem,
  MeetingRoomUsedCountItem,
} from "@/modules/admin/types";
import type { CaptchaResult } from "@/modules/user/auth/types";
import type {
  UpdatePasswordParams,
  UpdateProfileParams,
  UserInfo,
} from "@/modules/user/types";

interface AdminUserListResponse {
  users: AdminUserItem[];
  totalCount: number;
}

export function login(params: LoginParams) {
  return adminHttpPost<LoginResult, LoginParams>("/user/admin/login", params);
}

export function getAdminInfo() {
  return adminHttpGet<UserInfo>("/user/info");
}

export function getAdminUpdateProfileCaptcha() {
  return adminHttpGet<CaptchaResult>("/user/admin/update/captcha");
}

export function updateAdminProfile(params: UpdateProfileParams) {
  return adminHttpPost<string, UpdateProfileParams>(
    "/user/admin/update",
    params,
  );
}

export function getAdminUpdatePasswordCaptcha() {
  return adminHttpGet<CaptchaResult>("/user/admin/update_password/captcha");
}

export function updateAdminPassword(params: UpdatePasswordParams) {
  return adminHttpPost<string, UpdatePasswordParams>(
    "/user/admin/update_password",
    params,
  );
}

export function uploadAdminFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return adminHttpPost<string, FormData>("/user/upload", formData);
}

export function getUserList(
  params: { pageNo: number; pageSize: number } & AdminUserSearchParams,
) {
  return adminHttpGet<AdminUserListResponse>("/user/list", {
    params: params as unknown as Record<string, unknown>,
  }).then((result) => {
    return {
      list: result.users,
      total: result.totalCount,
    };
  });
}

export function freezeUser(id: number) {
  return adminHttpGet<string>("/user/freeze", {
    params: { id },
  });
}

export function unfreezeUser(id: number) {
  return adminHttpGet<string>("/user/unfreeze", {
    params: { id },
  });
}

export function resetUserPassword(params: ResetPasswordParams) {
  return adminHttpPost<string, ResetPasswordParams>(
    "/user/admin/reset_password",
    params,
  );
}

export function deleteUser(params: DeleteUserParams) {
  return adminHttpPost<string, DeleteUserParams>("/user/admin/delete", params);
}

interface MeetingRoomListResponse {
  meetingRooms: MeetingRoomItem[];
  totalCount: number;
}

export function getMeetingRoomList(
  params: { pageNo: number; pageSize: number } & MeetingRoomSearchParams,
) {
  return adminHttpGet<MeetingRoomListResponse>("/meeting-room/list", {
    params: params as unknown as Record<string, unknown>,
  }).then((result) => {
    return {
      list: result.meetingRooms,
      total: result.totalCount,
    };
  });
}

export function createMeetingRoom(params: CreateMeetingRoomParams) {
  return adminHttpPost<MeetingRoomItem, CreateMeetingRoomParams>(
    "/meeting-room/create",
    params,
  );
}

export function updateMeetingRoom(params: UpdateMeetingRoomParams) {
  return adminHttpPut<string, UpdateMeetingRoomParams>(
    "/meeting-room/update",
    params,
  );
}

export function deleteMeetingRoom(id: number) {
  return adminHttpDelete<string>(`/meeting-room/${id}`);
}

// --- 预定管理 ---

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

  return adminHttpGet<BookingListResponse>("/booking/list", {
    params: queryParams,
  }).then((result) => {
    return {
      list: result.bookings,
      total: result.totalCount,
    };
  });
}

export function applyBooking(id: number) {
  return adminHttpGet<string>(`/booking/apply/${id}`);
}

export function rejectBooking(id: number) {
  return adminHttpGet<string>(`/booking/reject/${id}`);
}

export function unbindBooking(id: number) {
  return adminHttpGet<string>(`/booking/unbind/${id}`);
}

// --- 统计模块 ---

export function getUserBookingCount(params: {
  startTime: string;
  endTime: string;
}) {
  return adminHttpGet<UserBookingCountItem[]>("/statistic/userBookingCount", {
    params: params as unknown as Record<string, unknown>,
  });
}

export function getMeetingRoomUsedCount(params: {
  startTime: string;
  endTime: string;
}) {
  return adminHttpGet<MeetingRoomUsedCountItem[]>(
    "/statistic/meetingRoomUsedCount",
    {
      params: params as unknown as Record<string, unknown>,
    },
  );
}
