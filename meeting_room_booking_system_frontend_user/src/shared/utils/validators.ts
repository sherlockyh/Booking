export const passwordRule = [
  { required: true, message: '请输入密码' },
  { min: 6, message: '密码不能少于 6 位' },
];

export const emailRule = [
  { required: true, message: '请输入邮箱' },
  { type: 'email' as const, message: '请输入正确的邮箱格式' },
];
