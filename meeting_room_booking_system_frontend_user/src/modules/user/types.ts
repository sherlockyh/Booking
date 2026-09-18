export interface UserInfo {
  id: number;
  username: string;
  nickName: string;
  email: string;
  /** 头像标识：新数据为 OSS Key（avatars/xxx.png），历史数据可能是完整 URL 或本地路径 */
  headPic?: string;
  /** 后端为 headPic 拼好的浏览器可访问 URL */
  headPicUrl?: string;
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
