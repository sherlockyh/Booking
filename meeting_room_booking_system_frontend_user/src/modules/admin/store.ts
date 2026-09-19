import { STORAGE_KEY } from '@/shared/constants/storageKey';
import {
  createSessionStore,
  type SessionState,
} from '@/shared/store/createSessionStore';
import type { LoginResult } from '@/modules/admin/types';
import type { UserInfo } from '@/modules/user/types';

const store = createSessionStore({
  storageKey: STORAGE_KEY.adminInfo,
  scope: 'admin',
});

export function saveAdminSession(loginResult: LoginResult) {
  store.saveLoginSession(loginResult);
}

export function saveAdminInfo(userInfo: UserInfo) {
  store.saveUserInfo(userInfo);
}

export function clearAdminSession() {
  store.clearSession();
}

export function useAdminStore<T>(selector: (currentState: SessionState) => T) {
  return store.useStore(selector);
}
