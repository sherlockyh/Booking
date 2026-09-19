import { httpGet, httpPost } from "@/shared/api/request";
import { createBookingApi } from "@/shared/api/createBookingApi";
import type { UploadOssResult } from "@/shared/api/types";
import type { CaptchaResult } from "@/modules/user/auth/types";
import type {
  UpdatePasswordParams,
  UpdateProfileParams,
  UserInfo,
} from "@/modules/user/types";

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

  // key 回填表单将来存库，url 只用于上传后立即预览
  return httpPost<UploadOssResult, FormData>("/user/upload", formData);
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

const bookingApi = createBookingApi(httpGet);

export const getMeetingRoomList = bookingApi.getMeetingRoomList;
export const getBookingList = bookingApi.getBookingList;
export const unbindBooking = bookingApi.unbindBooking;
export const getUserBookingCount = bookingApi.getUserBookingCount;
export const getMeetingRoomUsedCount = bookingApi.getMeetingRoomUsedCount;

export function addBooking(params: {
  meetingRoomId: number;
  startTime: number;
  endTime: number;
  note: string;
}) {
  return httpPost<string, typeof params>("/booking/add", params);
}
