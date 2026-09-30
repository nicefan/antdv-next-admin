/* eslint-disable */
/* tslint:disable */
import type { ChangePasswordParams, User, UserInput, UserPage } from "./data-contracts";

import { createApi } from "@/api/service";
/**
 * user
 **/
export const usersApi = createApi("users", {
  /**
   * getUserList
   * @request GET:/users
   */
  getUserList(
    query?: {
      current?: number;
      pageSize?: number;
      username?: string;
      email?: string;
      status?: string;
      gender?: string[];
      sorter?: Record<string, any>;
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Required<UserPage>>(``, query, config);
  },
  /**
   * createUser
   * @request POST:/users
   */
  createUser(data: UserInput, config?: RequestConfig) {
    return this.$http.post<Required<User>>(``, data, config);
  },
  /**
   * getUserById
   * @request GET:/users/{id}
   */
  getUserById(id: string, config?: RequestConfig) {
    return this.$http.get<Required<User>>(`/${id}`, undefined, config);
  },
  /**
   * updateUser
   * @request PUT:/users/{id}
   */
  updateUser(id: string, data: UserInput, config?: RequestConfig) {
    return this.$http.put<Required<User>>(`/${id}`, data, config);
  },
  /**
   * deleteUser
   * @request DELETE:/users/{id}
   */
  deleteUser(id: string, config?: RequestConfig) {
    return this.$http.delete<object | null>(`/${id}`, undefined, config);
  },
  /**
   * changePassword
   * @request POST:/users/change-password
   */
  changePassword(data: ChangePasswordParams, config?: RequestConfig) {
    return this.$http.post<object | null>(`/change-password`, data, config);
  },
});
