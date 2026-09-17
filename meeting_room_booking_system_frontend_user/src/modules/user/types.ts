export interface UserInfo {
  id: number;
  username: string;
  nickName: string;
  email: string;
  headPic?: string;
  phoneNumber?: string;
  isFrozen: boolean;
  isAdmin?: boolean;
  createTime?: number | string;
  roles?: string[];
  permissions?: string[];
}

export interface UpdateProfileParams {
  nickName: string;
  email: string;
  headPic?: string;
  captcha: string;
}

export interface UpdatePasswordParams {
  password: string;
  captchaId: string;
  captcha: string;
}
