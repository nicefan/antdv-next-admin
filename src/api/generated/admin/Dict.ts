/* eslint-disable */
/* tslint:disable */
import type { DictData, DictDataInput, DictDataPage, DictType, DictTypeInput, DictTypePage } from "./data-contracts";

import { createApi } from "@/api/service";
/**
 * dict
 **/
export const dictApi = createApi("dict", {
  /**
   * getDictTypes
   * @request GET:/dict/types
   */
  getDictTypes(config?: RequestConfig) {
    return this.$http.get<DictType[]>(`/types`, undefined, config);
  },
  /**
   * getDictTypeList
   * @request GET:/dict/type/list
   */
  getDictTypeList(
    query?: {
      name?: string;
      code?: string;
      status?: "enabled" | "disabled";
      page?: number;
      pageSize?: number;
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Required<DictTypePage>>(`/type/list`, query, config);
  },
  /**
   * getAllDictData
   * @request GET:/dict/data/all
   */
  getAllDictData(config?: RequestConfig) {
    return this.$http.get<DictData[]>(`/data/all`, undefined, config);
  },
  /**
   * getDictDataByType
   * @request GET:/dict/data/{typeCode}
   */
  getDictDataByType(typeCode: string, config?: RequestConfig) {
    return this.$http.get<DictData[]>(`/data/${typeCode}`, undefined, config);
  },
  /**
   * getDictDataList
   * @request GET:/dict/data/list
   */
  getDictDataList(
    query?: {
      typeCode?: string;
      label?: string;
      value?: string;
      status?: "enabled" | "disabled";
      page?: number;
      pageSize?: number;
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Required<DictDataPage>>(`/data/list`, query, config);
  },
  /**
   * createDictType
   * @request POST:/dict/type
   */
  createDictType(data: DictTypeInput = {}, config?: RequestConfig) {
    return this.$http.post<Required<DictType>>(`/type`, data, config);
  },
  /**
   * updateDictType
   * @request PUT:/dict/type/{id}
   */
  updateDictType(id: string, data: DictTypeInput = {}, config?: RequestConfig) {
    return this.$http.put<Required<DictType>>(`/type/${id}`, data, config);
  },
  /**
   * deleteDictType
   * @request DELETE:/dict/type/{id}
   */
  deleteDictType(id: string, config?: RequestConfig) {
    return this.$http.delete<object | null>(`/type/${id}`, undefined, config);
  },
  /**
   * createDictData
   * @request POST:/dict/data
   */
  createDictData(data: DictDataInput = {}, config?: RequestConfig) {
    return this.$http.post<Required<DictData>>(`/data`, data, config);
  },
  /**
   * updateDictData
   * @request PUT:/dict/data/{id}
   */
  updateDictData(id: string, data: DictDataInput = {}, config?: RequestConfig) {
    return this.$http.put<Required<DictData>>(`/data/${id}`, data, config);
  },
  /**
   * deleteDictData
   * @request DELETE:/dict/data/{id}
   */
  deleteDictData(id: string, config?: RequestConfig) {
    return this.$http.delete<object | null>(`/data/${id}`, undefined, config);
  },
});
