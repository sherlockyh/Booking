import { useSyncExternalStore } from 'react';
import { STORAGE_KEY } from '@/shared/constants/storageKey';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/shared/utils/storage';
import { clearTokens, setTokens } from '@/shared/utils/token';
import type { LoginResult } from '@/modules/admin/types';
import type { UserInfo } from '@/modules/user/types';

interface AdminState {
  userInfo: UserInfo | null;
}

let state: AdminState = {
  userInfo: getStorageItem<UserInfo>(STORAGE_KEY.adminInfo),
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function saveAdminSession(loginResult: LoginResult) {
  setTokens(loginResult.accessToken, loginResult.refreshToken, 'admin');
  setStorageItem(STORAGE_KEY.adminInfo, loginResult.userInfo);
  state = { userInfo: loginResult.userInfo };
  emitChange();
}

export function saveAdminInfo(userInfo: UserInfo) {
  setStorageItem(STORAGE_KEY.adminInfo, userInfo);
  state = { userInfo };
  emitChange();
}

export function clearAdminSession() {
  clearTokens('admin');
  removeStorageItem(STORAGE_KEY.adminInfo);
  state = { userInfo: null };
  emitChange();
}

export function useAdminStore<T>(selector: (currentState: AdminState) => T) {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selector(state),
    () => selector(state),
  );
}
