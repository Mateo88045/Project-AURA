import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'chronos.auth.token';
const REFRESH_TOKEN_KEY = 'chronos.auth.refresh';
const USER_ID_KEY = 'chronos.auth.userId';

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_ID_KEY);
}

export async function setUserId(userId: string): Promise<void> {
  await SecureStore.setItemAsync(USER_ID_KEY, userId);
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_ID_KEY),
  ]);
}
