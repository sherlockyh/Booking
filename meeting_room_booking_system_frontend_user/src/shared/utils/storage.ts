export function getStorageItem<T>(key: string): T | null {
  const value = window.localStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function setStorageItem<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorageItem(key: string) {
  window.localStorage.removeItem(key);
}
