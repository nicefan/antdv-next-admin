import { createService } from 'api-datamodel';
import { reactive } from 'vue';

import { $t } from '@/locales';

// 演示令牌与真实登录会话隔离，失败场景不会退出当前管理员。
export const demoSession = reactive({
  accessToken: 'expired-token',
  refreshToken: 'refresh-token-demo',
  refreshing: false,
  reloginRequired: false,
  failNextRefresh: false,
});
export type DemoLogLevel = 'info' | 'success' | 'error';
const listeners = new Set<(text: string, level: DemoLogLevel) => void>();
export function subscribeDemoAuth(listener: (text: string, level: DemoLogLevel) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
const log = (key: string, level: DemoLogLevel = 'info', params = {}) =>
  listeners.forEach((fn) => fn($t('examples.scaffold.requestAuth.' + key, params), level));
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
let refreshing: Promise<string> | undefined;
async function refreshDemoToken(): Promise<string> {
  if (refreshing) {
    log('logQueueWait');
    return refreshing;
  }
  refreshing = (async () => {
    demoSession.refreshing = true;
    log('logRefreshStart');
    try {
      await delay(700);
      if (!demoSession.refreshToken || demoSession.failNextRefresh) {
        demoSession.failNextRefresh = false;
        throw { code: 401, message: $t('examples.scaffold.requestAuth.refreshTokenInvalid') };
      }
      demoSession.accessToken = 'valid-token-' + Date.now();
      log('logRefreshSuccess', 'success');
      return demoSession.accessToken;
    } catch (error) {
      demoSession.accessToken = '';
      demoSession.reloginRequired = true;
      log('logRefreshFailed', 'error', { message: (error as { message: string }).message });
      throw error;
    } finally {
      demoSession.refreshing = false;
      refreshing = undefined;
    }
  })();
  return refreshing;
}

const demoService = createService({
  baseUrl: '/',
  adapter: async (config) => {
    const path = config.url ?? '';
    const params = config.params ?? {};
    if (path.endsWith('/upload')) {
      const file = (config.data as { file: File }).file;
      for (let loaded = 20; loaded <= 100; loaded += 20) {
        // 顺序模拟上传进度，不能并发发送全部进度事件。
        // eslint-disable-next-line no-await-in-loop
        await delay(200);
        config.onUploadProgress?.({ loaded, total: 100, percent: loaded });
      }
      if (Math.random() < Number(params.failureRate ?? 0.25))
        throw { code: 500, message: $t('examples.scaffold.uploadSystem.uploadFailedError') };
      return {
        data: {
          success: true,
          data: {
            name: file.name,
            url: 'https://picsum.photos/seed/' + encodeURIComponent(file.name) + '/880/560',
          },
        },
      };
    }
    if (path.endsWith('/protected')) {
      await delay(280);
      if (!demoSession.accessToken || demoSession.accessToken.startsWith('expired')) {
        log('log401Detected', 'info', { apiName: params.name });
        await refreshDemoToken();
      }
      return {
        data: {
          success: true,
          data: {
            message: $t('examples.scaffold.requestAuth.apiSuccess', { apiName: params.name }),
          },
        },
      };
    }
    await delay(700);
    const scenario = String(params.scenario);
    if (['network', 'auth', 'business'].includes(scenario))
      throw {
        code: scenario === 'auth' ? 401 : scenario === 'business' ? 500 : 0,
        message: $t(
          'examples.scaffold.observability.error' + scenario[0]!.toUpperCase() + scenario.slice(1),
        ),
      };
    return {
      data: {
        success: true,
        data:
          scenario === 'empty'
            ? []
            : [
                { name: 'service_a_latency', value: '120ms' },
                { name: 'service_b_qps', value: '2,398' },
                { name: 'error_rate', value: '0.35%' },
              ],
      },
    };
  },
});
export const createApi = demoService.createApi;
