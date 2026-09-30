/* eslint-disable */
/* tslint:disable */
import type { SysConfig, SysConfigInput, SysConfigPage } from "./data-contracts";

import { createApi } from "@/api/service";
/**
 * config
 **/
export const configApi = createApi("config", {
  /**
   * getConfigList
   * @request GET:/config/list
   */
  getConfigList(
    query?: {
      name?: string;
      key?: string;
      group?: string;
      page?: number;
      pageSize?: number;
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Required<SysConfigPage>>(`/list`, query, config);
  },
  /**
   * getConfigByKey
   * @request GET:/config/key/{key}
   */
  getConfigByKey(key: string, config?: RequestConfig) {
    return this.$http.get<Required<SysConfig>>(`/key/${key}`, undefined, config);
  },
  /**
   * createConfig
   * @request POST:/config
   */
  createConfig(data: SysConfigInput = {}, config?: RequestConfig) {
    return this.$http.post<Required<SysConfig>>(``, data, config);
  },
  /**
   * updateConfig
   * @request PUT:/config/{id}
   */
  updateConfig(id: string, data: SysConfigInput = {}, config?: RequestConfig) {
    return this.$http.put<Required<SysConfig>>(`/${id}`, data, config);
  },
  /**
   * deleteConfig
   * @request DELETE:/config/{id}
   */
  deleteConfig(id: string, config?: RequestConfig) {
    return this.$http.delete<object | null>(`/${id}`, undefined, config);
  },
});
