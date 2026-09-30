/* eslint-disable */
/* tslint:disable */
import type { LoginLogPage, OperationLogPage } from "./data-contracts";

import { createApi } from "@/api/service";
/**
 * log
 **/
export const logApi = createApi("log", {
  /**
   * getOperationLogList
   * @request GET:/log/operation/list
   */
  getOperationLogList(
    query?: {
      username?: string;
      module?: string;
      action?: string;
      status?: string;
      startTime?: string;
      endTime?: string;
      page?: number;
      pageSize?: number;
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Required<OperationLogPage>>(`/operation/list`, query, config);
  },
  /**
   * clearOperationLog
   * @request DELETE:/log/operation/clear
   */
  clearOperationLog(config?: RequestConfig) {
    return this.$http.delete<object | null>(`/operation/clear`, undefined, config);
  },
  /**
   * getLoginLogList
   * @request GET:/log/login/list
   */
  getLoginLogList(
    query?: {
      username?: string;
      ip?: string;
      status?: string;
      startTime?: string;
      endTime?: string;
      page?: number;
      pageSize?: number;
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Required<LoginLogPage>>(`/login/list`, query, config);
  },
  /**
   * clearLoginLog
   * @request DELETE:/log/login/clear
   */
  clearLoginLog(config?: RequestConfig) {
    return this.$http.delete<object | null>(`/login/clear`, undefined, config);
  },
});
