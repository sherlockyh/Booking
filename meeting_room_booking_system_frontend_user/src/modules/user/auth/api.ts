import { httpGet, httpPost } from '@/shared/api/request';
import type { CaptchaResult, LoginParams, LoginResult, RegisterParams } from './types';

export function login(params: LoginParams) {
  return httpPost<LoginResult, LoginParams>('/user/login', params);
}

export function getRegisterCaptcha() {
  return httpGet<CaptchaResult>('/user/captcha');
}

export function register(params: RegisterParams) {
  return httpPost<string, RegisterParams>('/user/register', params);
}
