import { message, Modal } from 'antdv-next';
import { createService, setRequestHooks } from 'api-datamodel';

export const apiService = createService({
  baseUrl: '/',
  adapter: async (config) => {
    // 传输层依赖路由和 Store，延迟加载防止模块初始化循环。
    const { service } = await import('./transport');
    // URL 统一序列化，开发端与浏览器 Mock 都读取同一请求路径。
    const url = service.getUri({ ...config, baseURL: '' });
    return service.request({ ...config, url, params: undefined });
  },
  transformResponse: (response) => ({
    code: response.code,
    message: response.message,
    success: response.code === 200 && response.success !== false,
    data: response.data,
  }),
});

setRequestHooks({
  complete({ errors }) {
    // 同一请求批次统一反馈；成功文案由具体业务决定。
    const shown = new Set<string>();
    for (const error of errors) {
      if (error.messageMode === 'none' || !error.message || shown.has(error.message)) continue;
      shown.add(error.message);
      if (error.messageMode === 'modal') Modal.error({ content: error.message });
      else message.error(error.message);
    }
  },
});

export const createApi = apiService.createApi;
