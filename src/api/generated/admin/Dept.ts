/* eslint-disable */
/* tslint:disable */
import type { Department, DepartmentInput } from "./data-contracts";

import { createApi } from "@/api/service";
/**
 * dept
 **/
export const deptApi = createApi("dept", {
  /**
   * getDeptTree
   * @request GET:/dept/tree
   */
  getDeptTree(
    query?: {
      name?: string;
      status?: "enabled" | "disabled";
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Department[]>(`/tree`, query, config);
  },
  /**
   * getDeptList
   * @request GET:/dept/list
   */
  getDeptList(
    query?: {
      name?: string;
      status?: "enabled" | "disabled";
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Department[]>(`/list`, query, config);
  },
  /**
   * createDept
   * @request POST:/dept
   */
  createDept(data: DepartmentInput = {}, config?: RequestConfig) {
    return this.$http.post<Required<Department>>(``, data, config);
  },
  /**
   * updateDept
   * @request PUT:/dept/{id}
   */
  updateDept(id: string, data: DepartmentInput = {}, config?: RequestConfig) {
    return this.$http.put<Required<Department>>(`/${id}`, data, config);
  },
  /**
   * deleteDept
   * @request DELETE:/dept/{id}
   */
  deleteDept(id: string, config?: RequestConfig) {
    return this.$http.delete<object | null>(`/${id}`, undefined, config);
  },
});
