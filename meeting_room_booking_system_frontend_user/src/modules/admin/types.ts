import type {
  LoginParams as UserLoginParams,
  LoginResult as UserLoginResult,
} from "@/modules/user/auth/types";
import type { UserInfo } from "@/modules/user/types";

export interface LoginParams extends UserLoginParams {}

export interface LoginResult extends UserLoginResult {}

export interface AdminUserItem extends Pick<
  UserInfo,
  "id" | "username" | "nickName" | "email" | "headPic" | "headPicUrl" | "isFrozen"
> {
  createTime: string | number;
}

export interface AdminUserSearchParams {
  username: string;
  nickName: string;
  email: string;
}

export interface ResetPasswordParams {
  id: number;
  password: string;
}

export interface DeleteUserParams {
  id: number;
}

export interface MeetingRoomItem {
  id: number;
  name: string;
  capacity: number;
  location: string;
  equipment: string;
  description: string;
  isBooked: boolean;
  createTime: string;
  updateTime: string;
}

export interface MeetingRoomSearchParams {
  name: string;
  capacity: string;
  equipment: string;
}

export interface CreateMeetingRoomParams {
  name: string;
  capacity: number;
  location: string;
  equipment: string;
  description: string;
}

export interface UpdateMeetingRoomParams extends Partial<CreateMeetingRoomParams> {
  id: number;
}

export interface BookingItem {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
  note: string;
  createTime: string;
  updateTime: string;
  user: {
    id: number;
    username: string;
    nickName: string;
    email: string;
  };
  room: {
    id: number;
    name: string;
    location: string;
    equipment: string;
    description: string;
  };
}

export interface BookingSearchParams {
  username: string;
  meetingRoomName: string;
  meetingRoomPosition: string;
  bookingTimeRangeStart: string;
  bookingTimeRangeEnd: string;
}

// --- 统计模块 ---

export interface UserBookingCountItem {
  userId: string;
  username: string;
  bookingCount: string;
}

export interface MeetingRoomUsedCountItem {
  meetingRoomId: string;
  meetingRoomName: string;
  usedCount: string;
}
