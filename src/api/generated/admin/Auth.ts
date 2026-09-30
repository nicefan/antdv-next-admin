/* eslint-disable */
/* tslint:disable */
import type { LoginParams, LoginResult, RefreshTokenParams, User } from "./data-contracts";

import { createApi } from "@/api/service";
/**
 * auth
 **/
export const authApi = createApi("auth", {
  /**
   * login
   * @request POST:/auth/login
   */
  login(data: LoginParams, config?: RequestConfig) {
    return this.$http.post<Required<LoginResult>>(`/login`, data, config);
  },
  /**
   * logout
   * @request POST:/auth/logout
   */
  logout(config?: RequestConfig) {
    return this.$http.post<object | null>(`/logout`, undefined, config);
  },
  /**
   * getUserInfo
   * @request GET:/auth/info
   */
  getUserInfo(config?: RequestConfig) {
    return this.$http.get<Required<User>>(`/info`, undefined, config);
  },
  /**
   * refreshToken
   * @request POST:/auth/refresh
   */
  refreshToken(data: RefreshTokenParams, config?: RequestConfig) {
    return this.$http.post<Required<LoginResult>>(`/refresh`, data, config);
  },
});
