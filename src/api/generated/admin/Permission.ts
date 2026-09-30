/* eslint-disable */
/* tslint:disable */
import type { Permission, PermissionInput } from "./data-contracts";

import { createApi } from "@/api/service";
/**
 * permission
 **/
export const permissionsApi = createApi("permissions", {
  /**
   * getPermissionList
   * @request GET:/permissions
   */
  getPermissionList(
    query?: {
      keyword?: string;
      type?: string;
      status?: string;
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Permission[]>(``, query, config);
  },
  /**
   * createPermission
   * @request POST:/permissions
   */
  createPermission(data: PermissionInput = {}, config?: RequestConfig) {
    return this.$http.post<Required<Permission>>(``, data, config);
  },
  /**
   * getPermissionTree
   * @request GET:/permissions/tree
   */
  getPermissionTree(config?: RequestConfig) {
    return this.$http.get<Permission[]>(`/tree`, undefined, config);
  },
  /**
   * getUserPermissions
   * @request GET:/permissions/user
   */
  getUserPermissions(config?: RequestConfig) {
    return this.$http.get<Permission[]>(`/user`, undefined, config);
  },
  /**
   * getPermissionById
   * @request GET:/permissions/{id}
   */
  getPermissionById(id: string, config?: RequestConfig) {
    return this.$http.get<Required<Permission>>(`/${id}`, undefined, config);
  },
  /**
   * updatePermission
   * @request PUT:/permissions/{id}
   */
  updatePermission(id: string, data: PermissionInput = {}, config?: RequestConfig) {
    return this.$http.put<Required<Permission>>(`/${id}`, data, config);
  },
  /**
   * deletePermission
   * @request DELETE:/permissions/{id}
   */
  deletePermission(id: string, config?: RequestConfig) {
    return this.$http.delete<object | null>(`/${id}`, undefined, config);
  },
});
