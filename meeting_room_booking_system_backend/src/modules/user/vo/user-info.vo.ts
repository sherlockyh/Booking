export class UserDetailVo {
  id: number;

  username: string;

  nickName: string;

  email: string;

  headPic: string;

  // headPic 的浏览器可访问 URL（后端拼好返回，前端不关心存储细节）；没上传过头像时为空
  headPicUrl?: string;

  phoneNumber: string;

  isFrozen: boolean;

  createTime: number;
}
