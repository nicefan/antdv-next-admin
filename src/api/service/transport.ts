import {
  create as createAxios,
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { clearSessionState } from '@/utils/session';

type AuthRequestConfig = InternalAxiosRequestConfig & {
  authRetried?: boolean;
  sessionVersion?: number;
};
let refreshTask: { sessionVersion: number; promise: Promise<string> } | null = null;

// 同一传输实例同时供 api-datamodel 和浏览器 Mock 使用。
export const service: AxiosInstance = createAxios({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

function isPublicRequest(config: InternalAxiosRequestConfig): boolean {
  return /\/auth\/(login|refresh)(?:\?|$)/.test(config.url ?? '');
}
function assertRequestSession(config: AuthRequestConfig) {
  if (
    config.sessionVersion !== undefined &&
    config.sessionVersion !== useAuthStore().getSessionVersion()
  )
    throw { name: 'AbortError', message: '' };
}
service.interceptors.request.use((config: AuthRequestConfig) => {
  const auth = useAuthStore();
  if (!isPublicRequest(config)) {
    config.sessionVersion ??= auth.getSessionVersion();
    assertRequestSession(config);
    if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

async function retryUnauthorized(config: AuthRequestConfig): Promise<AxiosResponse> {
  const auth = useAuthStore();
  assertRequestSession(config);
  const sessionVersion = auth.getSessionVersion();
  try {
    // 刷新队列按会话隔离；重试仍失败时只结束所属会话。
    if (config.authRetried) throw { code: 401, message: '登录已过期，请重新登录' };
    config.authRetried = true;
    if (!refreshTask || refreshTask.sessionVersion !== sessionVersion) {
      const task = { sessionVersion, promise: auth.refreshToken() };
      task.promise = task.promise.finally(() => {
        if (refreshTask === task) refreshTask = null;
      });
      refreshTask = task;
    }
    const token = await refreshTask.promise;
    assertRequestSession(config);
    config.headers.Authorization = `Bearer ${token}`;
    return await service.request(config);
  } catch (error) {
    if (sessionVersion === auth.getSessionVersion()) {
      clearSessionState(router);
      void router.push('/login');
    }
    throw error;
  }
}
service.interceptors.response.use(
  (response) => {
    assertRequestSession(response.config);
    if (response.data?.code === 401 && !isPublicRequest(response.config))
      return retryUnauthorized(response.config);
    return response;
  },
  (error: AxiosError) => {
    if (error.config) assertRequestSession(error.config);
    if (error.response?.status === 401 && error.config && !isPublicRequest(error.config))
      return retryUnauthorized(error.config);
    if (error.response?.status === 403) void router.push('/403');
    return Promise.reject(error);
  },
);
