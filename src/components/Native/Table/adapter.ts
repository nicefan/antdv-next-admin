import type { TableColumnType, TableEmits, TableProps } from 'antdv-next';
import { createAntdvAdapter } from 'superform-antdv';
import type {
  UIComponentRender,
  UITableColumn,
  UITableParams,
  UITableRenderProps,
  UITableSorter,
} from 'superform-antdv';
import { defineComponent, h, reactive, type PropType } from 'vue';

import NativeTable from './index.vue';
import type { HeaderFilter } from './types';

type Column = UITableColumn & {
  headerFilter?: HeaderFilter;
  sorter?: TableColumnType['sorter'];
  onFilter?: TableColumnType['onFilter'];
};

function fieldOf(column: { dataIndex?: unknown; key?: unknown }): string {
  const field = column.dataIndex ?? column.key;
  return Array.isArray(field) ? field.join('.') : String(field ?? '');
}
function flattenColumns(columns: Column[]): Column[] {
  return columns.flatMap((column) => [column, ...flattenColumns(column.children ?? [])]);
}
function isLocalFilter(column?: Column): boolean {
  return typeof column?.onFilter === 'function' || column?.headerFilter?.mode === 'client';
}
function isRemoteSorter(column?: Column): boolean {
  const sorter = column?.sorter;
  return Boolean(sorter && typeof sorter !== 'function' &&
    !(typeof sorter === 'object' && typeof sorter.compare === 'function'));
}
function renderColumns(columns: Column[]): NonNullable<TableProps['columns']> {
  return columns.map((column) => {
    const { customRender, children, ...attrs } = column;
    return {
      ...attrs,
      ...(customRender ? {
        render: (text: unknown, record: Record<string, unknown>, index: number) =>
          customRender({ text, record, index, column }),
      } : {}),
      ...(children ? { children: renderColumns(children) } : {}),
    } as NonNullable<TableProps['columns']>[number];
  });
}

const NativeTableRenderer = defineComponent({
  props: { state: { type: Object as PropType<UITableRenderProps>, required: true } },
  setup(props, { slots }) {
    let previous: UITableParams = { filters: {}, sorters: [] };
    // 只归一化 UI 事件；请求、分页、条件快照和 CRUD 继续交由 Core 执行。
    const onChange: TableEmits['change'] = (page, nativeFilters, nativeSorter, extra) => {
      const state = props.state;
      const columns = flattenColumns(state.columns);
      const find = (field: string) => columns.find((column) =>
        String(column.key) === field || fieldOf(column) === field);
      const filters: UITableParams['filters'] = {};
      for (const [key, values] of Object.entries(nativeFilters)) {
        if (values?.length) filters[fieldOf(find(key) ?? { key })] = [...values];
      }
      const sorters = (Array.isArray(nativeSorter) ? nativeSorter : [nativeSorter])
        .flatMap((sorter): UITableSorter[] => {
          if (!sorter.order) return [];
          const field = fieldOf(sorter.column ?? { dataIndex: sorter.field, key: sorter.columnKey });
          return field ? [{ field, order: sorter.order === 'ascend' ? 'asc' : 'desc' }] : [];
        });
      let remote = extra.action === 'paginate';
      if (extra.action === 'filter') {
        remote = [...new Set([...Object.keys(previous.filters), ...Object.keys(filters)])]
          .some((field) => {
            const before = previous.filters[field] ?? [];
            const after = filters[field] ?? [];
            return !isLocalFilter(find(field)) &&
              (before.length !== after.length || before.some((value, index) => value !== after[index]));
          });
      } else if (extra.action === 'sort') {
        remote = [...previous.sorters, ...sorters].some(({ field }) => {
          const before = previous.sorters.findIndex((item) => item.field === field);
          const after = sorters.findIndex((item) => item.field === field);
          return isRemoteSorter(find(field)) &&
            (before !== after || previous.sorters[before]?.order !== sorters[after]?.order);
        });
      }
      previous = { filters, sorters };
      state.onTableChange?.({
        action: extra.action,
        filters,
        sorters,
        remote,
        remoteParams: {
          filters: Object.fromEntries(Object.entries(filters).filter(([field]) => !isLocalFilter(find(field)))),
          sorters: sorters.filter(({ field }) => isRemoteSorter(find(field))),
        },
        pagination: state.pagination ? {
          current: page.current, pageSize: page.pageSize, total: page.total,
        } : undefined,
      });
      const handlers = Array.isArray(state.onChange) ? state.onChange : [state.onChange];
      for (const handler of handlers) handler?.(page, nativeFilters, nativeSorter, extra);
    };
    return () => {
      const { data, columns, selection, expandedKeys, onExpandedChange, onTableChange,
        pagination, onChange: nativeChange, ...attrs } = props.state;
      return h(NativeTable, {
        ...attrs,
        columns: renderColumns(columns),
        dataSource: data,
        rowSelection: selection && {
          ...selection.attrs,
          selectedRowKeys: selection.selectedKeys,
          onChange: selection.onChange,
          ...(selection.isRowSelectable ? {
            getCheckboxProps: (row: Record<string, unknown>) => ({
              disabled: !selection.isRowSelectable?.(row),
            }),
          } : {}),
        },
        pagination: pagination && { ...pagination.attrs, ...pagination, attrs: undefined },
        expandedRowKeys: expandedKeys,
        'onUpdate:expandedRowKeys': onExpandedChange,
        onChange,
      }, slots);
    };
  },
});

export const renderNativeTable: UIComponentRender<'table'> = ({ attrs, slots }) =>
  h(NativeTableRenderer, { state: attrs }, slots);

const officialAdapter = createAntdvAdapter();
// 根 Form 的动态属性仍包含 Ref；解包后继续复用官方属性映射与实例服务。
export const renderNativeForm: UIComponentRender<'form'> = ({ attrs, slots }) =>
  officialAdapter.render.form?.(reactive(attrs), slots);
