import type { UserInfo } from '@/modules/user/types';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  userInfo: UserInfo;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterParams {
  username: string;
  nickName: string;
  password: string;
  email: string;
  captchaId: string;
  captcha: string;
}

export interface CaptchaResult {
  captchaId?: string;
  captcha: string;
  expireSeconds: number;
}
