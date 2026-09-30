import { dictApi } from '@/api/generated/admin/Dict';

import { referenceCache } from './scope';

export const dictTypesCache = referenceCache.cache({
  name: 'dictTypes',
  request: () => dictApi.getDictTypes(),
});
export const dictDataCache = referenceCache.cache({
  name: 'dictData',
  request: () => dictApi.getAllDictData(),
});
export const dictByTypeCache = referenceCache.cache({
  name: 'dictByType',
  request: (code: string) => dictApi.getDictDataByType(code),
});
export function clearDictCache(): void {
  // 类型修改也可能影响数据归属，统一清理公共字典视图。
  referenceCache.clear('dictTypes');
  referenceCache.clear('dictData');
  referenceCache.clear('dictByType');
}
