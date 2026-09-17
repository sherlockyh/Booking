import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { message } from "antd";
import type { ApiResponse } from "@/shared/api/types";
import { ROUTE_PATH } from "@/shared/constants/route";
import { clearAdminSession } from "@/modules/admin/store";
import { clearUserSession } from "@/modules/user/store";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  type SessionScope,
} from "@/shared/utils/token";

interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

interface RequestClientOptions {
  scope: SessionScope;
  refreshUrl: string;
  loginPath: string;
  clearSession: () => void;
}

function createRequestClient(options: RequestClientOptions) {
  const client = axios.create({
    baseURL: "/api",
    timeout: 15000,
  });

  client.interceptors.request.use((config) => {
    const token = getAccessToken(options.scope);

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    async (response) => {
      const result = response.data as ApiResponse<unknown>;
      const originalRequest = response.config as RetryableRequestConfig;

      if (result.code === 401) {
        if (!originalRequest._retry) {
          const retryResponse = await refreshTokenAndRetry(
            client,
            options,
            originalRequest,
          );

          if (retryResponse) {
            return retryResponse;
          }
        }

        handleLogout(options);
        return Promise.reject(new Error(String(result.data || "用户未登录")));
      }

      if (result.code >= 200 && result.code < 300) {
        return result.data;
      }

      return Promise.reject(
        new Error(String(result.data || result.message || "请求失败")),
      );
    },
    async (error: AxiosError<ApiResponse<unknown>>) => {
      const originalRequest = error.config as
        | RetryableRequestConfig
        | undefined;
      const status = error.response?.status || error.response?.data?.code;
      const errorText = String(
        error.response?.data?.data ||
          error.response?.data?.message ||
          error.message,
      );

      if (status === 401 && originalRequest && !originalRequest._retry) {
        const retryResponse = await refreshTokenAndRetry(
          client,
          options,
          originalRequest,
        );

        if (retryResponse) {
          return retryResponse;
        }

        handleLogout(options);
      }

      message.error(errorText || "请求失败");
      return Promise.reject(error);
    },
  );

  return client;
}

async function refreshTokenAndRetry(
  client: AxiosInstance,
  options: RequestClientOptions,
  originalRequest: RetryableRequestConfig,
) {
  const refreshToken = getRefreshToken(options.scope);

  if (!refreshToken) {
    return null;
  }

  originalRequest._retry = true;

  try {
    const tokens = await axios.get<{
      data: { accessToken: string; refreshToken: string };
    }>(`/api${options.refreshUrl}`, {
      params: { refreshToken },
    });

    setTokens(
      tokens.data.data.accessToken,
      tokens.data.data.refreshToken,
      options.scope,
    );
    originalRequest.headers = {
      ...originalRequest.headers,
      Authorization: `Bearer ${tokens.data.data.accessToken}`,
    };

    return client.request(originalRequest);
  } catch {
    return null;
  }
}

function handleLogout(options: RequestClientOptions) {
  options.clearSession();

  if (window.location.pathname !== options.loginPath) {
    window.location.href = options.loginPath;
  }
}

const userClient = createRequestClient({
  scope: "user",
  refreshUrl: "/user/refresh",
  loginPath: ROUTE_PATH.login,
  clearSession: clearUserSession,
});

const adminClient = createRequestClient({
  scope: "admin",
  refreshUrl: "/user/admin/refresh",
  loginPath: ROUTE_PATH.adminLogin,
  clearSession: clearAdminSession,
});

export async function httpGet<T>(url: string, config?: AxiosRequestConfig) {
  return userClient.get(url, config) as Promise<T>;
}

export async function httpPost<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
) {
  return userClient.post(url, data, config) as Promise<T>;
}

export async function adminHttpGet<T>(
  url: string,
  config?: AxiosRequestConfig,
) {
  return adminClient.get(url, config) as Promise<T>;
}

export async function adminHttpPost<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
) {
  return adminClient.post(url, data, config) as Promise<T>;
}

export async function adminHttpPut<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
) {
  return adminClient.put(url, data, config) as Promise<T>;
}

export async function adminHttpDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
) {
  return adminClient.delete(url, config) as Promise<T>;
}
