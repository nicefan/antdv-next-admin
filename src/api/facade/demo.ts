import { demoApi } from '@/api/generated/demo/Demo';

// Core Upload 提供 FormData，生成接口消费契约对象；转换仅放 facade。
export function uploadDemoFile(data: FormData, config: RequestConfig, failureRate: number) {
  const file = data.get('file');
  if (!(file instanceof File)) return Promise.reject({ message: '请选择有效文件' });
  return demoApi.uploadFile({ file }, { ...config, params: { failureRate }, messageMode: 'none' });
}
