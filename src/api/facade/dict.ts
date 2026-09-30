import type { DictTypeInput, DictDataInput } from '@/api/generated/admin/data-contracts';

import { dictTypesCache, dictDataCache, dictByTypeCache, clearDictCache } from '@/api/cache/dict';
import { dictApi } from '@/api/generated/admin/Dict';

export async function getDictTypes() {
  return structuredClone(await dictTypesCache.getResult());
}
export async function getAllDictData() {
  return structuredClone(await dictDataCache.getResult());
}
export async function getDictDataByType(code: string) {
  return structuredClone(await dictByTypeCache.getResult(code));
}

export async function createDictType(data: DictTypeInput) {
  const result = await dictApi.createDictType(data);
  clearDictCache();
  return result;
}

export async function updateDictType(id: string, data: DictTypeInput) {
  const result = await dictApi.updateDictType(id, data);
  clearDictCache();
  return result;
}

export async function deleteDictType(id: string) {
  const result = await dictApi.deleteDictType(id);
  clearDictCache();
  return result;
}

export async function createDictData(data: DictDataInput) {
  const result = await dictApi.createDictData(data);
  clearDictCache();
  return result;
}

export async function updateDictData(id: string, data: DictDataInput) {
  const result = await dictApi.updateDictData(id, data);
  clearDictCache();
  return result;
}

export async function deleteDictData(id: string) {
  const result = await dictApi.deleteDictData(id);
  clearDictCache();
  return result;
}
