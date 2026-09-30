/* eslint-disable */
/* tslint:disable */
import type { DemoMessage, DemoMetric, DemoUpload } from "./data-contracts";

import { createApi } from "@/api/service/demo";
/**
 * Demo
 **/
export const demoApi = createApi("demo", {
  /**
   * @request GET:/demo/protected
   */
  protectedRequest(
    query?: {
      name?: string;
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Required<DemoMessage>>(`/protected`, query, config);
  },
  /**
   * @request GET:/demo/metrics
   */
  getMetrics(
    query?: {
      scenario?: string;
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<DemoMetric[]>(`/metrics`, query, config);
  },
  /**
   * @request POST:/demo/upload
   */
  uploadFile(
    data: {
      /** @format binary */
      file: File;
    },
    config?: RequestConfig,
  ) {
    return this.$http.post<Required<DemoUpload>>(`/upload`, data, config);
  },
});
