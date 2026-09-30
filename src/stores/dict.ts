import type { DictData, DictGroup } from '@/types/dict';

import { defineStore } from 'pinia';
import { ref, computed, shallowRef, getCurrentScope } from 'vue';

import { clearDictCache, dictDataCache } from '@/api/cache/dict';

export const useDictStore = defineStore('dict', () => {
  // 直接订阅公共缓存；失效和退出登录会同步清空字典展示。
  const storeScope = getCurrentScope();
  const entry = shallowRef<ReturnType<typeof dictDataCache.useEntry>>();
  const dictData = computed<DictData[]>(() =>
    (entry.value?.result ?? []).filter((item) => item.status === 'enabled'),
  );
  const loaded = computed(() => entry.value?.result !== undefined);
  const pendingLoads = ref(0);
  const loading = computed(() => pendingLoads.value > 0);

  // 按类型分组的字典数据
  const dictGroup = computed<DictGroup>(() => {
    const group: DictGroup = {};
    dictData.value.forEach((item) => {
      if (!group[item.typeCode]) {
        group[item.typeCode] = [];
      }
      group[item.typeCode].push(item);
    });
    // 按 sort 排序
    Object.keys(group).forEach((key) => {
      group[key].sort((a, b) => a.sort - b.sort);
    });
    return group;
  });

  /**
   * 加载所有字典数据
   */
  const loadDictData = async (force = false): Promise<void> => {
    if (force) dictDataCache.clear();
    // useEntry 会立即请求，延迟到登录后加载；订阅归属 Store，页面卸载不会丢失更新。
    if (!entry.value) {
      entry.value = storeScope?.run(() => dictDataCache.useEntry()) ?? dictDataCache.useEntry();
    }
    pendingLoads.value += 1;
    try {
      // 每个调用方都等待同一请求完成，避免并发调用提前拿到空选项。
      await dictDataCache.getResult();
    } catch (error) {
      console.error('加载字典数据失败:', error);
    } finally {
      pendingLoads.value -= 1;
    }
  };

  /**
   * 根据类型获取字典数据
   */
  const getDictByType = (typeCode: string): DictData[] => {
    return dictGroup.value[typeCode] || [];
  };

  /**
   * 根据类型和值获取标签
   */
  const getDictLabel = (typeCode: string, value: string): string => {
    const dict = dictGroup.value[typeCode]?.find((item) => item.value === value);
    return dict?.label || value;
  };

  /**
   * 根据类型和标签获取值
   */
  const getDictValue = (typeCode: string, label: string): string => {
    const dict = dictGroup.value[typeCode]?.find((item) => item.label === label);
    return dict?.value || label;
  };

  /**
   * 获取字典选项（用于下拉框）
   */
  const getDictOptions = (typeCode: string) => {
    return getDictByType(typeCode).map((item) => ({
      label: item.label,
      value: item.value,
    }));
  };

  /**
   * 刷新字典数据
   */
  const refreshDictData = () => {
    return loadDictData(true);
  };

  /**
   * 清空字典数据
   */
  const clearDictData = () => {
    clearDictCache();
  };

  return {
    dictData,
    dictGroup,
    loaded,
    loading,
    loadDictData,
    getDictByType,
    getDictLabel,
    getDictValue,
    getDictOptions,
    refreshDictData,
    clearDictData,
  };
});
