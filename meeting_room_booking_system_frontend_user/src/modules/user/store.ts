import { useSyncExternalStore } from 'react';
import { STORAGE_KEY } from '@/shared/constants/storageKey';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/shared/utils/storage';
import { clearTokens, setTokens } from '@/shared/utils/token';
import type { LoginResult } from '@/modules/user/auth/types';
import type { UserInfo } from '@/modules/user/types';

interface UserState {
  userInfo: UserInfo | null;
}

let state: UserState = {
  userInfo: getStorageItem<UserInfo>(STORAGE_KEY.userInfo),
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function saveLoginSession(loginResult: LoginResult) {
  setTokens(loginResult.accessToken, loginResult.refreshToken);
  setStorageItem(STORAGE_KEY.userInfo, loginResult.userInfo);
  state = { userInfo: loginResult.userInfo };
  emitChange();
}

export function saveUserInfo(userInfo: UserInfo) {
  setStorageItem(STORAGE_KEY.userInfo, userInfo);
  state = { userInfo };
  emitChange();
}

export function clearUserSession() {
  clearTokens();
  removeStorageItem(STORAGE_KEY.userInfo);
  state = { userInfo: null };
  emitChange();
}

export function useUserStore<T>(selector: (currentState: UserState) => T) {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selector(state),
    () => selector(state),
  );
}
