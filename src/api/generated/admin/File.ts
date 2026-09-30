/* eslint-disable */
/* tslint:disable */
import type { SysFilePage } from "./data-contracts";

import { createApi } from "@/api/service";
/**
 * file
 **/
export const fileApi = createApi("file", {
  /**
   * getFileList
   * @request GET:/file/list
   */
  getFileList(
    query?: {
      name?: string;
      ext?: string;
      storage?: string;
      page?: number;
      pageSize?: number;
    },
    config?: RequestConfig,
  ) {
    return this.$http.get<Required<SysFilePage>>(`/list`, query, config);
  },
  /**
   * deleteFile
   * @request DELETE:/file/{id}
   */
  deleteFile(id: string, config?: RequestConfig) {
    return this.$http.delete<object | null>(`/${id}`, undefined, config);
  },
});
