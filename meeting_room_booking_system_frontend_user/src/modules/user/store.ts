import { STORAGE_KEY } from '@/shared/constants/storageKey';
import {
  createSessionStore,
  type SessionState,
} from '@/shared/store/createSessionStore';
import type { LoginResult } from '@/modules/user/auth/types';
import type { UserInfo } from '@/modules/user/types';

const store = createSessionStore({
  storageKey: STORAGE_KEY.userInfo,
  scope: 'user',
});

export function saveLoginSession(loginResult: LoginResult) {
  store.saveLoginSession(loginResult);
}

export function saveUserInfo(userInfo: UserInfo) {
  store.saveUserInfo(userInfo);
}

export function clearUserSession() {
  store.clearSession();
}

export function useUserStore<T>(selector: (currentState: SessionState) => T) {
  return store.useStore(selector);
}
