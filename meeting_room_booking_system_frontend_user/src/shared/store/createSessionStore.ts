import { useSyncExternalStore } from 'react';
import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from '@/shared/utils/storage';
import {
  clearTokens,
  setTokens,
  type SessionScope,
} from '@/shared/utils/token';
import type { UserInfo } from '@/modules/user/types';

export interface SessionState {
  userInfo: UserInfo | null;
}

interface SessionLoginResult {
  accessToken: string;
  refreshToken: string;
  userInfo: UserInfo;
}

interface SessionStore {
  saveLoginSession: (loginResult: SessionLoginResult) => void;
  saveUserInfo: (userInfo: UserInfo) => void;
  clearSession: () => void;
  useStore: <T>(selector: (currentState: SessionState) => T) => T;
}

// user / admin 两端共用的会话状态工厂：
// userInfo 走 useSyncExternalStore 订阅，token 与 userInfo 持久化在 localStorage
export function createSessionStore(options: {
  storageKey: string;
  scope: SessionScope;
}): SessionStore {
  const { storageKey, scope } = options;

  let state: SessionState = {
    userInfo: getStorageItem<UserInfo>(storageKey),
  };

  const listeners = new Set<() => void>();

  function emitChange() {
    listeners.forEach((listener) => listener());
  }

  return {
    saveLoginSession(loginResult) {
      setTokens(loginResult.accessToken, loginResult.refreshToken, scope);
      setStorageItem(storageKey, loginResult.userInfo);
      state = { userInfo: loginResult.userInfo };
      emitChange();
    },

    saveUserInfo(userInfo) {
      setStorageItem(storageKey, userInfo);
      state = { userInfo };
      emitChange();
    },

    clearSession() {
      clearTokens(scope);
      removeStorageItem(storageKey);
      state = { userInfo: null };
      emitChange();
    },

    useStore(selector) {
      return useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => selector(state),
        () => selector(state),
      );
    },
  };
}
