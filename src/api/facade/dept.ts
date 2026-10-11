import type { DepartmentInput, DeptQueryParams } from '@/api/generated/admin/data-contracts';

import { deptTreeCache, deptListCache, clearDeptCache } from '@/api/cache/dept';
import { deptApi } from '@/api/generated/admin/Dept';

// 搜索结果实时请求，完整组织数据复用会话缓存；编辑前复制，避免污染共享数据。
export async function getDeptTree(params?: DeptQueryParams) {
  return params?.name || params?.status
    ? deptApi.getDeptTree(params)
    : structuredClone(await deptTreeCache.getResult());
}
export async function getDeptList(params?: DeptQueryParams) {
  return params?.name || params?.status
    ? deptApi.getDeptList(params)
    : structuredClone(await deptListCache.getResult());
}
export async function createDept(data: DepartmentInput) {
  const result = await deptApi.createDept(data);
  clearDeptCache();
  return result;
}
export async function updateDept(id: string, data: DepartmentInput) {
  const result = await deptApi.updateDept(id, data);
  clearDeptCache();
  return result;
}
export async function deleteDept(id: string) {
  const result = await deptApi.deleteDept(id);
  clearDeptCache();
  return result;
}


// 子部门列表复用完整组织缓存，搜索树不会截断列表和父级选项。
export async function getDeptChildren(params: { parentId?: string | null }) {
  if (!params.parentId) return [];
  return (await getDeptList()).filter((dept) => dept.parentId === params.parentId).toSorted((a, b) => a.sort - b.sort);
}
export function saveDeptEditor(data: DepartmentInput & { id?: string }) {
  const payload: DepartmentInput = {
    name: data.name?.trim(), parentId: data.parentId || null, leader: data.leader,
    phone: data.phone, email: data.email, sort: data.sort, status: data.status, remark: data.remark,
  };
  return data.id ? updateDept(data.id, payload) : createDept(payload);
}
