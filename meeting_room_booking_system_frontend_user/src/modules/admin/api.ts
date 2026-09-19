import {
  adminHttpGet,
  adminHttpPost,
  adminHttpPut,
  adminHttpDelete,
} from "@/shared/api/request";
import { createBookingApi } from "@/shared/api/createBookingApi";
import type {
  LoginParams,
  LoginResult,
  AdminUserItem,
  ResetPasswordParams,
  AdminUserSearchParams,
  DeleteUserParams,
  MeetingRoomItem,
  CreateMeetingRoomParams,
  UpdateMeetingRoomParams,
} from "@/modules/admin/types";
import type { CaptchaResult } from "@/modules/user/auth/types";
import type { UploadOssResult } from "@/shared/api/types";
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

  // key 回填表单将来存库，url 只用于上传后立即预览
  return adminHttpPost<UploadOssResult, FormData>("/user/upload", formData);
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

const bookingApi = createBookingApi(adminHttpGet);

export const getMeetingRoomList = bookingApi.getMeetingRoomList;
export const getBookingList = bookingApi.getBookingList;
export const unbindBooking = bookingApi.unbindBooking;
export const getUserBookingCount = bookingApi.getUserBookingCount;
export const getMeetingRoomUsedCount = bookingApi.getMeetingRoomUsedCount;

export function applyBooking(id: number) {
  return adminHttpGet<string>(`/booking/apply/${id}`);
}

export function rejectBooking(id: number) {
  return adminHttpGet<string>(`/booking/reject/${id}`);
}
