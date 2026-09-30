<template>
  <div class="native-table">
    <Teleport :to="toolbarTarget" :disabled="!toolbarTarget">
      <div
        v-if="tableTools !== false"
        class="native-table-tools"
        :class="{ 'native-table-tools-inline': toolbarTarget }"
      >
        <a-space :size="4">
          <a-tooltip v-if="enabled('refresh') && onReload" :title="$t('common.refresh')">
            <a-button
              type="text"
              class="toolbar-icon-btn"
              :aria-label="$t('common.refresh')"
              @click="onReload?.()"
            >
              <ReloadOutlined />
            </a-button>
          </a-tooltip>
          <a-dropdown
            v-if="enabled('density')"
            placement="bottomRight"
            :trigger="['click']"
            :menu="densityMenu"
          >
            <a-tooltip :title="$t('proTable.density')">
              <a-button type="text" class="toolbar-icon-btn" :aria-label="$t('proTable.density')">
                <ColumnHeightOutlined />
              </a-button>
            </a-tooltip>
          </a-dropdown>
          <a-popover v-if="enabled('columnSetting')" trigger="click" placement="bottomRight">
            <a-tooltip :title="$t('proTable.columnSetting')">
              <a-button
                type="text"
                class="toolbar-icon-btn"
                :aria-label="$t('proTable.columnSetting')"
              >
                <SettingOutlined />
              </a-button>
            </a-tooltip>
            <template #content>
              <a-space class="column-controls">
                <a-button size="small" @click="visibleKeys = columnKeys.slice()">{{
                  $t('proTable.checkAll')
                }}</a-button>
                <a-button size="small" @click="resetColumns">{{ $t('common.reset') }}</a-button>
              </a-space>
              <div
                v-for="key in order"
                :key="key"
                draggable="true"
                class="column-option"
                @dragstart="dragKey = key"
                @dragover.prevent
                @drop.prevent="reorder(key)"
              >
                <a-checkbox :checked="visibleKeys.includes(key)" @change="toggleColumn(key)">
                  <component :is="() => columnTitle(key)" />
                </a-checkbox>
                <a-space :size="0">
                  <a-button
                    size="small"
                    type="text"
                    :class="{ active: currentFixed(key) === 'left' }"
                    @click="toggleFixed(key, 'left')"
                    >←</a-button
                  >
                  <a-button
                    size="small"
                    type="text"
                    :class="{ active: currentFixed(key) === 'right' }"
                    @click="toggleFixed(key, 'right')"
                    >→</a-button
                  >
                </a-space>
              </div>
            </template>
          </a-popover>
        </a-space>
      </div>
    </Teleport>
    <a-table
      v-bind="$attrs"
      :columns="displayColumns"
      :data-source="dataSource"
      :size="density"
      :components="mergedComponents"
      @change="handleChange"
    >
      <template
        v-for="name in Object.keys($slots).filter((name) => name !== 'filterDropdown')"
        #[name]="scope"
        ><slot :name="name" v-bind="scope || {}"
      /></template>
      <template #filterDropdown="{ column, selectedKeys, setSelectedKeys, confirm, clearFilters }">
        <div v-if="column.headerFilter?.type === 'keyword'" class="keyword-filter">
          <a-input
            :value="selectedKeys[0]"
            :placeholder="column.headerFilter.placeholder"
            allow-clear
            @update:value="(value: string) => setSelectedKeys(value ? [value] : [])"
            @press-enter="confirm()"
          />
          <a-space>
            <a-button size="small" type="primary" @click="confirm()">{{
              $t('common.search')
            }}</a-button>
            <a-button size="small" @click="clearFilters?.({ confirm: true })">{{
              $t('common.reset')
            }}</a-button>
          </a-space>
        </div>
        <slot
          v-else
          name="filterDropdown"
          :column="column"
          :selected-keys="selectedKeys"
          :set-selected-keys="setSelectedKeys"
          :confirm="confirm"
          :clear-filters="clearFilters"
        />
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import type { HeaderFilter } from './types';
import type { TableEmits, TableProps } from 'antdv-next';

import { ColumnHeightOutlined, ReloadOutlined, SettingOutlined } from '@antdv-next/icons';
import { computed, defineComponent, h, onBeforeUnmount, ref, useAttrs, watch } from 'vue';

import { $t } from '@/locales';
import { appDefaultSettings } from '@/settings';

defineOptions({ inheritAttrs: false });
type Column = NonNullable<TableProps['columns']>[number] & {
  headerFilter?: HeaderFilter;
  resizable?: boolean;
};
const props = withDefaults(
  defineProps<{
    columns?: Column[];
    dataSource?: Record<string, unknown>[];
    size?: 'small' | 'middle' | 'large';
    tableTools?: false | string[];
    /** 由 SuperTable 的 title 插槽提供，工具栏状态仍由原生扩展管理。 */
    toolbarTarget?: HTMLElement | null;
    onReload?: () => unknown;
  }>(),
  { columns: () => [], dataSource: () => [], size: appDefaultSettings.table.size },
);
const emit = defineEmits<{
  change: Parameters<TableEmits['change']>;
  filterChange: Parameters<TableEmits['change']>;
  sortChange: Parameters<TableEmits['change']>;
}>();
const attrs = useAttrs();
const density = ref(props.size);
watch(
  () => props.size,
  (size) => {
    density.value = size;
  },
);
const densities = [
  { label: $t('proTable.densityLarge'), key: 'large' },
  { label: $t('proTable.densityMiddle'), key: 'middle' },
  { label: $t('proTable.densitySmall'), key: 'small' },
];
const densityMenu = computed(() => ({
  items: densities,
  selectedKeys: [density.value],
  onClick: ({ key }: { key: string | number }) => {
    if (key === 'small' || key === 'middle' || key === 'large') density.value = key;
  },
}));
function enabled(name: string): boolean {
  return (
    props.tableTools !== false &&
    (props.tableTools ?? ['refresh', 'density', 'columnSetting']).includes(name)
  );
}
function columnKey(column: Column): string {
  return String(column.key ?? column.dataIndex ?? '');
}
const columnKeys = computed(() => props.columns.map(columnKey));
const visibleKeys = ref<string[]>([]);
const order = ref<string[]>([]);
const fixed = ref<Record<string, 'left' | 'right' | undefined>>({});
const widths = ref<Record<string, number>>({});
let knownKeys: string[] = [];
watch(
  columnKeys,
  (keys) => {
    // Schema 是业务来源，用户偏好仅覆盖仍存在的列，不能恢复已被权限删除的列。
    const added = keys.filter((key) => !knownKeys.includes(key));
    visibleKeys.value = [...visibleKeys.value.filter((key) => keys.includes(key)), ...added];
    order.value = [...order.value.filter((key) => keys.includes(key)), ...added];
    knownKeys = keys.slice();
  },
  { immediate: true },
);
function resetColumns(): void {
  visibleKeys.value = columnKeys.value.slice();
  order.value = columnKeys.value.slice();
  fixed.value = {};
  widths.value = {};
}
function toggleColumn(key: string): void {
  visibleKeys.value = visibleKeys.value.includes(key)
    ? visibleKeys.value.filter((k) => k !== key)
    : [...visibleKeys.value, key];
}
function columnTitle(key: string) {
  const title = props.columns.find((c) => columnKey(c) === key)?.title;
  return typeof title === 'function' ? title({}) : title;
}
function currentFixed(key: string) {
  return key in fixed.value
    ? fixed.value[key]
    : props.columns.find((c) => columnKey(c) === key)?.fixed;
}
function toggleFixed(key: string, side: 'left' | 'right'): void {
  fixed.value[key] = currentFixed(key) === side ? undefined : side;
}
const dragKey = ref('');
function reorder(target: string): void {
  const next = order.value.filter((key) => key !== dragKey.value);
  next.splice(next.indexOf(target), 0, dragKey.value);
  if (dragKey.value && dragKey.value !== target) order.value = next;
  dragKey.value = '';
}
let stopResize: (() => void) | undefined;
function startResize(event: MouseEvent, key: string, width: number): void {
  event.preventDefault();
  event.stopPropagation();
  stopResize?.();
  const start = event.clientX;
  const move = (e: MouseEvent) => {
    widths.value[key] = Math.max(60, width + e.clientX - start);
  };
  const stop = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', stop);
  };
  stopResize = stop;
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', stop, { once: true });
}
onBeforeUnmount(() => stopResize?.());
const ResizeHeader = defineComponent({
  inheritAttrs: false,
  props: { columnKey: String, columnWidth: Number, columnResizable: Boolean },
  setup(header, { attrs: cellAttrs, slots }) {
    return () =>
      h('th', cellAttrs, [
        slots.default?.(),
        header.columnResizable &&
          h('span', {
            class: 'native-column-resize',
            onMousedown: (event: MouseEvent) =>
              startResize(event, header.columnKey ?? '', header.columnWidth ?? 120),
          }),
      ]);
  },
});
const mergedComponents = computed(() => ({
  ...((attrs.components as Record<string, unknown>) ?? {}),
  header: {
    ...((attrs.components as { header?: Record<string, unknown> })?.header ?? {}),
    cell: ResizeHeader,
  },
}));
const displayColumns = computed(() =>
  order.value
    .filter((key) => visibleKeys.value.includes(key))
    .flatMap((key) => {
      const source = props.columns.find((c) => columnKey(c) === key);
      if (!source) return [];
      const filter = source.headerFilter;
      const width = widths.value[key] ?? Number(source.width ?? 120);
      const column: Column = {
        ...source,
        ...(key in fixed.value ? { fixed: fixed.value[key] } : {}),
        ...(widths.value[key] === undefined ? {} : { width }),
        onHeaderCell: (col) => ({
          ...source.onHeaderCell?.(col),
          columnKey: key,
          columnWidth: width,
          columnResizable: source.resizable ?? appDefaultSettings.table.columnResizable,
        }),
      };
      if (filter?.type === 'keyword') column.filterDropdown = () => null;
      if (filter?.type === 'select') {
        column.filters = filter.options?.map((option) => ({
          text: option.label,
          value: option.value,
        }));
        column.filterMultiple = filter.multiple ?? false;
      }
      if (filter && (filter.mode === 'client' || filter.mode === 'hybrid')) {
        column.onFilter = (value, record) => {
          if (filter.clientFilter) return filter.clientFilter(value, record, column);
          const raw = record[String(column.dataIndex)];
          if (filter.type === 'select')
            return Array.isArray(raw)
              ? raw.map(String).includes(String(value))
              : String(raw) === String(value);
          const text = filter.caseSensitive ? String(raw ?? '') : String(raw ?? '').toLowerCase();
          const terms = String(value)
            .trim()
            .split(/\s+/)
            .map((term) => (filter.caseSensitive ? term : term.toLowerCase()));
          return filter.matchAllKeywords === false
            ? terms.some((term) => text.includes(term))
            : terms.every((term) => text.includes(term));
        };
      }
      return [column];
    }),
);
function handleChange(...args: Parameters<TableEmits['change']>): void {
  // 原生事件保留全部参数且只触发一次；扩展事件仅按本次操作分发，不接管分页与请求。
  emit('change', ...args);
  if (args[3].action === 'filter') emit('filterChange', ...args);
  if (args[3].action === 'sort') emit('sortChange', ...args);
}
</script>

<style scoped>
.native-table {
  min-width: 0;
}
.native-table-tools {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.native-table-tools-inline {
  margin-bottom: 0;
}
.toolbar-icon-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  color: var(--color-text-secondary);
}
.toolbar-icon-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-layout);
}
.column-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  min-width: 240px;
  padding: 4px 0;
}
.column-controls {
  margin-bottom: 8px;
}
.active {
  color: var(--color-primary);
}
.keyword-filter {
  padding: 12px;
  display: grid;
  gap: 10px;
  width: 240px;
}
:deep(th) {
  position: relative;
}
:deep(.native-column-resize) {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
}
</style>
