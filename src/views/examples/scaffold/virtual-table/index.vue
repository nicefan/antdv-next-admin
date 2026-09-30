<template>
  <div class="page-container">
    <div class="card">
      <h2>{{ $t('examples.scaffold.virtualTable.title') }}</h2>
      <p class="text-secondary mb-lg">{{ $t('examples.scaffold.virtualTable.description') }}</p>

      <a-alert
        class="mb-lg"
        type="info"
        show-icon
        :message="$t('examples.scaffold.virtualTable.tipsNativeVirtual')"
      />

      <div class="toolbar">
        <a-space wrap>
          <span class="text-secondary">{{ $t('examples.scaffold.virtualTable.datasetSize') }}</span>
          <a-select v-model:value="datasetSize" style="width: 140px">
            <a-select-option :value="5000">5,000</a-select-option>
            <a-select-option :value="20000">20,000</a-select-option>
            <a-select-option :value="50000">50,000</a-select-option>
            <a-select-option :value="100000">100,000</a-select-option>
          </a-select>
          <a-button @click="regenerateRows">{{
            $t('examples.scaffold.virtualTable.regenerate')
          }}</a-button>
        </a-space>

        <SuperForm @register="registerFilterForm" style="width: 420px; max-width: 100%" />
      </div>

      <a-space wrap class="mb-lg">
        <a-tag color="processing">
          {{ $t('examples.scaffold.virtualTable.totalRows', { count: allRows.length }) }}
        </a-tag>
        <a-tag color="success">
          {{ $t('examples.scaffold.virtualTable.filteredRows', { count: filteredRows.length }) }}
        </a-tag>
        <a-tag>{{ $t('examples.scaffold.virtualTable.renderedRowsTip') }}</a-tag>
      </a-space>

      <SuperTable
        :schema="{
          slots: { bodyCell: 'bodyCell' },
          columns: columns,
          pagination: false,
          indexColumn: false,
          attrs: {
            tableTools: false,
            rowKey: 'id',
            size: 'small',
            bordered: true,
            virtual: true,
            scroll: { y: 520, x: 1200 },
          },
        }"
        :data-source="filteredRows"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
        </template>
      </SuperTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExtColumnsItem } from 'superform-antdv';

import { message } from 'antdv-next';
import { SuperForm, useForm, SuperTable } from 'superform-antdv';
import { computed, onMounted, ref } from 'vue';

import { $t } from '@/locales';

type StatusType = 'active' | 'inactive' | 'pending';

interface DemoRow {
  id: string;
  username: string;
  email: string;
  department: string;
  status: StatusType;
  updatedAt: string;
}

const datasetSize = ref(20000);
const keyword = ref('');
const statusFilter = ref<'all' | StatusType>('all');
const allRows = ref<DemoRow[]>([]);

const columns = computed<ExtColumnsItem[]>(() => [
  {
    field: 'id',
    label: () => $t('examples.scaffold.virtualTable.colId'),
    columnProps: { width: 130 },
  },
  {
    field: 'username',
    label: () => $t('examples.scaffold.virtualTable.colUsername'),
    columnProps: { width: 180 },
  },
  {
    field: 'email',
    label: () => $t('examples.scaffold.virtualTable.colEmail'),
    columnProps: { width: 260 },
  },
  {
    field: 'department',
    label: () => $t('examples.scaffold.virtualTable.colDepartment'),
    columnProps: { width: 180 },
  },
  {
    field: 'status',
    label: () => $t('examples.scaffold.virtualTable.colStatus'),
    columnProps: { width: 120 },
  },
  {
    field: 'updatedAt',
    label: () => $t('examples.scaffold.virtualTable.colUpdatedAt'),
    columnProps: { width: 200 },
  },
]);

const filteredRows = computed(() => {
  let rows = allRows.value;

  const query = keyword.value.trim().toLowerCase();
  if (query) {
    rows = rows.filter(
      (item) =>
        item.username.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query),
    );
  }

  if (statusFilter.value !== 'all') {
    rows = rows.filter((item) => item.status === statusFilter.value);
  }

  return rows;
});

function createRows(count: number) {
  const statusList: StatusType[] = ['active', 'inactive', 'pending'];
  const departments = ['R&D', 'Operation', 'Finance', 'Support', 'Marketing', 'Sales'];

  return Array.from({ length: count }, (_, index) => {
    const i = index + 1;
    const day = String((i % 28) + 1).padStart(2, '0');
    const month = String((i % 12) + 1).padStart(2, '0');

    return {
      id: `VT-${String(i).padStart(6, '0')}`,
      username: `user_${String(i).padStart(6, '0')}`,
      email: `user_${i}@example.com`,
      department: departments[i % departments.length],
      status: statusList[i % statusList.length],
      updatedAt: `2026-${month}-${day} 10:${String(i % 60).padStart(2, '0')}:00`,
    };
  });
}

function regenerateRows() {
  allRows.value = createRows(datasetSize.value);
  message.success(
    $t('examples.scaffold.virtualTable.regenerateSuccess', { count: datasetSize.value }),
  );
}

function getStatusText(status: StatusType) {
  if (status === 'active') return $t('examples.scaffold.virtualTable.statusActive');
  if (status === 'inactive') return $t('examples.scaffold.virtualTable.statusInactive');
  return $t('examples.scaffold.virtualTable.statusPending');
}

function getStatusColor(status: StatusType) {
  if (status === 'active') return 'success';
  if (status === 'inactive') return 'default';
  return 'processing';
}

onMounted(() => {
  regenerateRows();
});
const [registerFilterForm] = useForm({
  subSpan: 12,
  compact: true,
  subItems: [
    {
      type: 'Input',
      value: keyword,
      dynamicAttrs: () => ({ placeholder: $t('examples.scaffold.virtualTable.searchPlaceholder') }),
    },
    {
      type: 'Select',
      value: statusFilter,
      options: {
        source: () => [
          { label: $t('examples.scaffold.virtualTable.allStatus'), value: 'all' },
          { label: $t('examples.scaffold.virtualTable.statusActive'), value: 'active' },
          { label: $t('examples.scaffold.virtualTable.statusInactive'), value: 'inactive' },
          { label: $t('examples.scaffold.virtualTable.statusPending'), value: 'pending' },
        ],
      },
    },
  ],
});
</script>

<style scoped lang="scss">
.mb-lg {
  margin-bottom: var(--spacing-lg);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-md);
}
</style>
