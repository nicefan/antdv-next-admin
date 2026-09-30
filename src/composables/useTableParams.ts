import type { HeaderFilter } from '@/components/Native/Table/types';
import type { TableEmits } from 'antdv-next';
import type { ExtColumnsItem } from 'superform-antdv';

import { ref } from 'vue';

export function useTableParams(
  columns: () => ExtColumnsItem[],
  options?: {
    requestPayload?: 'flat' | 'nested';
    nestedKey?: string;
    defaultMode?: 'client' | 'server' | 'hybrid';
  },
) {
  const params = ref<Record<string, unknown>>({});
  const onChange: TableEmits['change'] = (_pagination, filters, sorter, extra) => {
    if (extra.action === 'paginate') return;
    const next: Record<string, unknown> = {};
    const nested: Record<string, unknown> = {};
    for (const column of columns()) {
      const native = column.columnProps as
        | { headerFilter?: HeaderFilter; key?: string }
        | undefined;
      const filter = native?.headerFilter;
      if (!filter || (filter.mode ?? options?.defaultMode) === 'client') continue;
      const values = filters[native?.key ?? column.field ?? ''];
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
    if (options?.requestPayload === 'nested') next[options.nestedKey ?? 'filters'] = nested;
    const list = (Array.isArray(sorter) ? sorter : [sorter])
      .filter((item) => item.field && item.order)
      .map((item) => ({ field: item.field, order: item.order }));
    if (list.length) next.sorter = Array.isArray(sorter) ? list : list[0];
    params.value = next;
  };
  // 新业务监听独立扩展事件；保留 onChange 供已有页面逐步迁移。
  return { params, onFilterChange: onChange, onSortChange: onChange, onChange };
}
