import { STORAGE_KEY } from '@/shared/constants/storageKey';
import { removeStorageItem } from '@/shared/utils/storage';

export type SessionScope = 'user' | 'admin';

const TOKEN_KEY_MAP = {
  user: {
    accessToken: STORAGE_KEY.accessToken,
    refreshToken: STORAGE_KEY.refreshToken,
  },
  admin: {
    accessToken: STORAGE_KEY.adminAccessToken,
    refreshToken: STORAGE_KEY.adminRefreshToken,
  },
} as const;

export function getAccessToken(scope: SessionScope = 'user') {
  return window.localStorage.getItem(TOKEN_KEY_MAP[scope].accessToken);
}

export function getRefreshToken(scope: SessionScope = 'user') {
  return window.localStorage.getItem(TOKEN_KEY_MAP[scope].refreshToken);
}

export function setTokens(
  accessToken: string,
  refreshToken: string,
  scope: SessionScope = 'user',
) {
  window.localStorage.setItem(TOKEN_KEY_MAP[scope].accessToken, accessToken);
  window.localStorage.setItem(TOKEN_KEY_MAP[scope].refreshToken, refreshToken);
}

export function clearTokens(scope: SessionScope = 'user') {
  removeStorageItem(TOKEN_KEY_MAP[scope].accessToken);
  removeStorageItem(TOKEN_KEY_MAP[scope].refreshToken);
}
