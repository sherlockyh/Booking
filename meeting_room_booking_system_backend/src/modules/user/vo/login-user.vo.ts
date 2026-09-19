interface UserInfo {
  id: number;

  username: string;

  nickName: string;

  email: string;

  headPic: string;

  // headPic 的浏览器可访问 URL（后端拼好返回，前端不关心存储细节）；没上传过头像时为空
  headPicUrl?: string;

  phoneNumber: string;

  isFrozen: boolean;

  isAdmin: boolean;

  createTime: number;

  roles: string[];

  // 权限码数组（如 ['booking:audit']）：token 里只放 code，不放完整权限对象
  permissions: string[];
}
export class LoginUserVo {
  userInfo: UserInfo;

  accessToken: string;

  refreshToken: string;
}
