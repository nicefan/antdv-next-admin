<template>
  <div class="page-container">
    <SplitLayout :side-width="200">
      <template #side>
        <!-- groups nav -->
        <div class="config-groups-header">
          <h3>{{ $t('config.configGroups') }}</h3>
        </div>
        <a-menu
          v-model:selectedKeys="selectedMenuKeys"
          mode="inline"
          :items="menuItems"
          class="config-groups-menu"
          @click="handleMenuClick"
        />
      </template>

      <template #main>
        <!-- config list -->
        <SuperTable
          ref="nativeTableRef1"
          :schema="{
            slots: { extra: 'extra', bodyCell: 'bodyCell' },
            columns: columns,
            apis: { query: loadConfigList },
            indexColumn: false,
            title: { title: $t(`config.groups.${selectedGroup}`) }.title,
            attrs: {
              pagination: {},
              filterSortTransform: nativeQuery1.filterSortTransform,
              tableTools: undefined,
              onReload: () => nativeTableRef1?.reload(),
            },
          }"
          :key="selectedGroup + refreshKey"
        >
          <template #extra>
            <a-button type="primary" @click="handleAdd">
              <PlusOutlined /> {{ $t('config.createConfig') }}
            </a-button>
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'value'">
              <template v-if="record.valueType === 'boolean'">
                <a-tag :color="record.value === 'true' ? 'green' : 'default'">
                  {{ record.value === 'true' ? $t('common.yes') : $t('common.no') }}
                </a-tag>
              </template>
              <template v-else>
                <span class="config-value">{{ record.value }}</span>
              </template>
            </template>
            <template v-if="column.key === 'valueType'">
              <a-tag>{{ $t(`config.valueTypes.${record.valueType}`) || record.valueType }}</a-tag>
            </template>
            <template v-if="column.key === 'builtIn'">
              <a-tag :color="record.builtIn ? 'blue' : 'default'">
                {{
                  record.builtIn
                    ? $t('config.builtInTypes.builtIn')
                    : $t('config.builtInTypes.custom')
                }}
              </a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-space :size="4">
                <a-button type="link" size="small" @click="handleEdit(record)">
                  <template #icon><EditOutlined /></template>
                  {{ $t('common.edit') }}
                </a-button>
                <a-button
                  v-if="!record.builtIn"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(record)"
                >
                  <template #icon><DeleteOutlined /></template>
                  {{ $t('common.delete') }}
                </a-button>
              </a-space>
            </template>
          </template>
        </SuperTable>
      </template>
    </SplitLayout>

    <!-- add/edit modal -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      :confirm-loading="saving"
      :closable="!saving"
      :mask-closable="!saving"
      :keyboard="!saving"
      :cancel-button-props="{ disabled: saving }"
      :width="520"
    >
      <SuperForm @register="registerForm" style="margin-top: 16px">
        <template #configValue>
          <a-switch v-if="form.valueType === 'boolean'" v-model:checked="boolValue" />
          <a-input-number
            v-else-if="form.valueType === 'number'"
            v-model:value="form.value"
            style="width: 100%"
          />
          <a-textarea
            v-else-if="form.valueType === 'json'"
            v-model:value="form.value"
            :rows="4"
            :placeholder="$t('config.placeholders.jsonFormat')"
          />
          <a-input
            v-else
            v-model:value="form.value"
            :placeholder="$t('config.placeholders.configValue')"
          />
        </template>
      </SuperForm>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { SysConfig } from '@/types/config';
import type { MenuItemType } from 'antdv-next';
import type { ExtColumnsItem } from 'superform-antdv';

import { EditOutlined, DeleteOutlined, PlusOutlined } from '@antdv-next/icons';
import { message, Modal } from 'antdv-next';
import { SuperForm, useForm, SuperTable } from 'superform-antdv';
import { ref, computed, h } from 'vue';
import { useI18n } from 'vue-i18n';

import { configApi } from '@/api/generated/admin/Config';
import SplitLayout from '@/components/Layout/SplitLayout/index.vue';
const { t } = useI18n();

const groups = ref<string[]>(['basic', 'security', 'upload', 'notification']);
const selectedGroup = ref('basic');
const allConfigs = ref<SysConfig[]>([]);
const refreshKey = ref(0);
const valueTypeOptions = computed(() =>
  ['string', 'number', 'boolean', 'json'].map((value) => ({
    label: t(`config.valueTypes.${value}`),
    value,
  })),
);
const groupOptions = computed(() =>
  groups.value.map((group) => ({
    label: t(`config.groups.${group}`),
    value: group,
  })),
);
const selectedMenuKeys = computed({
  get: () => [selectedGroup.value],
  set: (keys: string[]) => {
    if (keys.length > 0) selectedGroup.value = keys[0];
  },
});

const getGroupCount = (group: string) => allConfigs.value.filter((c) => c.group === group).length;

const menuItems = computed<MenuItemType[]>(() =>
  groups.value.map((group) => ({
    key: group,
    label: h('div', { class: 'menu-item-label' }, [
      h('span', { class: 'group-name' }, t(`config.groups.${group}`)),
      h('span', { class: 'group-count' }, String(getGroupCount(group))),
    ]),
    title: t(`config.groups.${group}`),
  })),
);

const handleMenuClick = ({ key }: { key: string }) => {
  selectedGroup.value = key;
};

// modal
const modalVisible = ref(false);
const modalTitle = computed(() =>
  form.value.id ? t('config.editConfig') : t('config.createConfig'),
);
const form = ref<Partial<SysConfig>>({
  name: '',
  key: '',
  value: '',
  valueType: 'string',
  group: 'basic',
  sort: 0,
  description: '',
});
const boolValue = computed({
  get: () => form.value.value === 'true',
  set: (v: boolean) => {
    form.value.value = String(v);
  },
});

const saving = ref(false);
const [registerForm, configForm] = useForm({
  dataSource: form,
  subSpan: 24,
  attrs: { labelCol: { span: 6 } },
  subItems: [
    { type: 'Hidden', field: 'id' },
    { type: 'Hidden', field: 'builtIn' },
    {
      type: 'Input',
      field: 'name',
      label: () => t('config.configName'),
      required: true,
      rules: { message: t('config.requiredFields') },
    },
    {
      type: 'Input',
      field: 'key',
      label: () => t('config.configKey'),
      required: true,
      rules: { message: t('config.requiredFields') },
      disabled: () => !!form.value.id,
    },
    {
      type: 'InputSlot',
      field: 'value',
      label: () => t('config.configValue'),
      render: 'configValue',
      rules: {
        validator: (_context: unknown, value: unknown) => {
          if (form.value.valueType === 'boolean') return true;
          if (value === undefined || value === null || String(value).trim() === '')
            return new Error(t('config.requiredFields'));
          if (form.value.valueType === 'number' && !Number.isFinite(Number(value)))
            return new Error(t('config.requiredFields'));
          if (form.value.valueType === 'json') {
            try {
              JSON.parse(String(value));
            } catch {
              return new Error(t('config.placeholders.jsonFormat'));
            }
          }
          return true;
        },
      },
    },
    {
      type: 'Select',
      field: 'valueType',
      label: () => t('config.valueType'),
      disabled: () => !!form.value.id,
      options: { source: () => valueTypeOptions.value },
    },
    {
      type: 'Select',
      field: 'group',
      label: () => t('config.group'),
      options: { source: () => groupOptions.value },
      attrs: { allowClear: true },
    },
    {
      type: 'InputNumber',
      field: 'sort',
      label: () => t('config.sort'),
      attrs: { min: 0, precision: 0, style: { width: '100%' } },
    },
    {
      type: 'TextArea',
      field: 'description',
      label: () => t('config.description'),
      attrs: { rows: 2 },
    },
  ],
});

const columns: ExtColumnsItem[] = [
  { field: 'name', label: () => t('config.configName'), columnProps: { key: 'name', width: 160 } },
  { field: 'key', label: () => t('config.configKey'), columnProps: { key: 'key', width: 200 } },
  {
    field: 'value',
    label: () => t('config.configValue'),
    columnProps: { key: 'value', ellipsis: true },
  },
  {
    field: 'valueType',
    label: () => t('config.valueType'),
    columnProps: { key: 'valueType', width: 90 },
  },
  {
    field: 'builtIn',
    label: () => t('config.builtIn'),
    columnProps: { key: 'builtIn', width: 90 },
  },
  {
    field: 'description',
    label: () => t('config.description'),
    columnProps: { key: 'description', ellipsis: true },
  },
  {
    field: 'action',
    label: () => t('common.actions'),
    columnProps: { key: 'action', width: 150, fixed: 'right' },
  },
];

const loadConfigList = async (params: Record<string, unknown>, config?: RequestConfig) => {
  try {
    const response = await configApi.getConfigList(
      {
        group: selectedGroup.value,
        page: params.current as number,
        pageSize: params.pageSize as number,
      },
      config,
    );

    return {
      records: response.list,
      total: response.total,
      current: Number(params.current ?? 1),
      size: Number(params.pageSize ?? 10),
    };
  } catch (error: unknown) {
    console.error(t('config.loadConfigFailed'), (error as Error).message);
  }
  return {
    records: [],
    total: 0,
    current: Number(params.current ?? 1),
    size: Number(params.pageSize ?? 10),
  };
};

// load all configs for group count
const loadAllConfigs = async () => {
  try {
    const response = await configApi.getConfigList({ page: 1, pageSize: 100 });

    allConfigs.value = response.list;
  } catch (_error: unknown) {}
};

const handleAdd = () => {
  form.value = {
    name: '',
    key: '',
    value: '',
    valueType: 'string',
    group: selectedGroup.value,
    sort: 0,
    description: '',
  };
  modalVisible.value = true;
};

const handleEdit = (record: SysConfig) => {
  form.value = { ...record };
  modalVisible.value = true;
};

const handleDelete = (record: SysConfig) => {
  Modal.confirm({
    title: t('config.confirmDelete'),
    content: t('config.confirmDeleteContent', { name: record.name }),
    onOk: async () => {
      try {
        await configApi.deleteConfig(record.id);

        message.success(t('config.deleteSuccess'));
        refreshKey.value++;
        loadAllConfigs();
      } catch (_error: unknown) {
        // 校验由表单展示，请求错误由统一 Service Hooks 反馈。
      }
    },
  });
};

const handleSubmit = async () => {
  if (saving.value) return;
  saving.value = true;
  try {
    form.value = await configForm.submit();
    form.value.value =
      form.value.valueType === 'boolean' ? String(boolValue.value) : String(form.value.value ?? '');
    if (form.value.id) {
      await configApi.updateConfig(form.value.id, form.value);

      message.success(t('config.updateSuccess'));
      modalVisible.value = false;
      refreshKey.value++;
      loadAllConfigs();
    } else {
      await configApi.createConfig(form.value);

      message.success(t('config.createSuccess'));
      modalVisible.value = false;
      refreshKey.value++;
      loadAllConfigs();
    }
  } catch (error: unknown) {
    // 校验由表单展示，请求错误由统一 Service Hooks 反馈。
  } finally {
    saving.value = false;
  }
};

loadAllConfigs();

const nativeTableRef1 = ref<{ reload: () => Promise<unknown> }>();
const nativeQuery1 = useTableParams(() => columns);

import { useTableParams } from '@/composables/useTableParams';
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.config-groups-header {
  padding: 0 16px;
  margin-bottom: 8px;

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-heading);
  }
}

.config-groups-menu {
  flex: 1;
  overflow: auto;
  background: transparent;
  border: none;

  :deep(.ant-menu-item) {
    margin: 4px 8px;
    padding: 10px 12px !important;
    border-radius: 8px;
    height: auto;
    transition: all 0.2s;

    &::before {
      // Remove default selected indicator
      display: none;
    }

    &:hover {
      background: var(--color-fill-quaternary, #fafafa);
    }

    &.ant-menu-item-selected {
      background: color-mix(in srgb, var(--color-primary) 8%, transparent);

      .group-name {
        color: var(--color-primary);
        font-weight: 600;
      }
    }
  }

  .menu-item-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .group-name {
      font-size: 14px;
      flex: 1;
    }

    .group-count {
      font-size: 12px;
      color: var(--color-text-quaternary);
      background: var(--color-fill-quaternary);
      padding: 0 8px;
      border-radius: 10px;
      line-height: 20px;
      margin-left: 8px;
      flex-shrink: 0;
    }
  }
}
</style>
