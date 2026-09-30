import { deptApi } from '@/api/generated/admin/Dept';

import { referenceCache } from './scope';

export const deptTreeCache = referenceCache.cache({
  name: 'deptTree',
  request: () => deptApi.getDeptTree(),
});
export const deptListCache = referenceCache.cache({
  name: 'deptList',
  request: () => deptApi.getDeptList(),
});
export function clearDeptCache(): void {
  referenceCache.clear('deptTree');
  referenceCache.clear('deptList');
}
