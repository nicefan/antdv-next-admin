import type { HeaderFilter } from '@/components/Native/Table/types';
import type { ExtColumnsItem, UITableParams } from 'superform-antdv';

export function useTableParams(
  columns: () => ExtColumnsItem[],
  options?: {
    requestPayload?: 'flat' | 'nested';
    nestedKey?: string;
    defaultMode?: 'client' | 'server' | 'hybrid';
  },
) {
  // 只转换请求契约；条件快照、查询调度和导出参数由 SuperTable 管理。
  const filterSortTransform = ({ filters, sorters }: UITableParams): Record<string, unknown> => {
    const next: Record<string, unknown> = {};
    const nested: Record<string, unknown> = {};
    for (const column of columns()) {
      const native = column.columnProps as
        | { headerFilter?: HeaderFilter; key?: string }
        | undefined;
      const filter = native?.headerFilter;
      if (!filter || (filter.mode ?? options?.defaultMode) === 'client') continue;
      const values = filters[column.field ?? native?.key ?? ''];
      if (!values?.length) continue;
      const value = filter.transformRequestValue
        ? filter.transformRequestValue(values[0], values)
        : filter.multiple
          ? values
          : values[0];
      (options?.requestPayload === 'nested' ? nested : next)[
        filter.paramKey ?? column.field ?? ''
      ] = value;
    }
    if (options?.requestPayload === 'nested' && Object.keys(nested).length) {
      next[options.nestedKey ?? 'filters'] = nested;
    }
    // 后端保留 AntDV 排序值；Core 使用 asc/desc，仅在契约边界映射。
    const sorter = sorters.map(({ field, order }) => ({
      field,
      order: order === 'asc' ? 'ascend' : 'descend',
    }));
    if (sorter.length) next.sorter = sorter.length === 1 ? sorter[0] : sorter;
    return next;
  };
  return { filterSortTransform };
}
