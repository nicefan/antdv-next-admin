/* eslint-disable */
/* tslint:disable */
import type { Role, RoleInput, RolePage } from "./data-contracts";

import { createApi } from "@/api/service";
/**
 * role
 **/
export const rolesApi = createApi("roles", {
  /**
   * getRoleList
   * @request GET:/roles
   */
  getRoleList(
    query?: {
      current?: number;
      pageSize?: number;
      name?: string;
      code?: string;
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Required<RolePage>>(``, query, config);
  },
  /**
   * createRole
   * @request POST:/roles
   */
  createRole(data: RoleInput, config?: RequestConfig) {
    return this.$http.post<Required<Role>>(``, data, config);
  },
  /**
   * getRoleById
   * @request GET:/roles/{id}
   */
  getRoleById(id: string, config?: RequestConfig) {
    return this.$http.get<Required<Role>>(`/${id}`, undefined, config);
  },
  /**
   * updateRole
   * @request PUT:/roles/{id}
   */
  updateRole(id: string, data: RoleInput, config?: RequestConfig) {
    return this.$http.put<Required<Role>>(`/${id}`, data, config);
  },
  /**
   * deleteRole
   * @request DELETE:/roles/{id}
   */
  deleteRole(id: string, config?: RequestConfig) {
    return this.$http.delete<object | null>(`/${id}`, undefined, config);
  },
});
