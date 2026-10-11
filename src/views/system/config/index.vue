<template>
  <div class="page-container">
    <SplitLayout :side-width="200">
      <template #side>
        <div class="config-groups-header">
          <h3>{{ $t('config.configGroups') }}</h3>
        </div>
        <a-menu v-model:selectedKeys="selectedMenuKeys" mode="inline" :items="menuItems" class="config-groups-menu" />
      </template>
      <template #main>
        <SuperTable @register="register" />
      </template>
    </SplitLayout>
  </div>
</template>

<script setup lang="ts">
import type { SysConfig } from '@/types/config';
import type { ExtColumnsItem } from 'superform-antdv';
import type { ConfigEditorData } from '@/api/facade/systemConfig';
import { Tag, message } from 'antdv-next';
import { SuperTable, useTable } from 'superform-antdv';
import { ref, computed, h, onMounted } from 'vue';
import { configApi } from '@/api/generated/admin/Config';
import { saveConfigEditor } from '@/api/facade/systemConfig';
import SplitLayout from '@/components/Layout/SplitLayout/index.vue';
import { $t } from '@/locales';
const groups = ['basic', 'security', 'upload', 'notification'];
const groupOptions = groups.map((value) => ({ label: $t(`config.groups.${value}`), value }));
const valueTypeOptions = ['string', 'number', 'boolean', 'json'].map((value) => ({ label: $t(`config.valueTypes.${value}`), value }));
const selectedGroup = ref('basic');
const allConfigs = ref<SysConfig[]>([]);
const selectedMenuKeys = computed({
  get: () => [selectedGroup.value],
  set: (keys: string[]) => { if (keys[0]) selectedGroup.value = keys[0];
  }
});
const menuItems = computed(() => groupOptions.map((group) => ({
  key: group.value,
  label: h('div', { class: 'menu-item-label' }, [
    h('span', { class: 'group-name' }, group.label),
    h('span', { class: 'group-count' }, String(allConfigs.value.filter((config) => config.group === group.value).length)),
  ])
})));
const columns: ExtColumnsItem[] = [
  { type: 'Hidden', field: 'id' },
  {
    type: 'Input',
    field: 'name',
    label: $t('config.configName'),
    required: true,
    columnProps: { width: 160 }
  },
  {
    type: 'Input',
    field: 'key',
    label: $t('config.configKey'),
    required: true,
    disabled: ({ formData }) => Boolean(formData?.id),
    columnProps: { width: 200 }
  },
  {
    type: 'ConfigValue',
    field: 'value',
    label: $t('config.configValue'),
    initialValue: '',
    dynamicAttrs: ({ formData }) => ({ valueType: formData.valueType }),
    rules: {
      validator: ({ formData }, value) => {
        if (formData.valueType === 'boolean') return true;
        if (value == null || String(value).trim() === '') return new Error($t('config.requiredFields'));
        if (formData.valueType === 'number' && !Number.isFinite(Number(value))) return new Error($t('config.requiredFields'));
        if (formData.valueType === 'json') {
          try { JSON.parse(String(value));
          } catch { return new Error($t('config.placeholders.jsonFormat'));
          }
        }
        return true;
      }
    },
    viewRender: ({ text, record }) => record.valueType === 'boolean'
    ? h(Tag, { color: text === 'true' ? 'green' : 'default' }, () => text === 'true' ? $t('common.yes') : $t('common.no'))
    : h('span', { class: 'config-value' }, text),
    columnProps: { ellipsis: true }
  },
  {
    type: 'Select',
    field: 'valueType',
    label: $t('config.valueType'),
    initialValue: 'string',
    options: { source: valueTypeOptions },
    disabled: ({ formData }) => Boolean(formData?.id),
    columnProps: { width: 90 }
  },
  {
    type: 'Select',
    field: 'group',
    label: $t('config.group'),
    options: { source: groupOptions },
    exclude: ['table'],
    required: true
  },
  {
    type: 'InputNumber',
    field: 'sort',
    label: $t('config.sort'),
    initialValue: 0,
    exclude: ['table'],
    attrs: { min: 0, precision: 0 }
  },
  {
    type: 'TextArea',
    field: 'description',
    label: $t('config.description'),
    attrs: { rows: 2 },
    columnProps: { ellipsis: true }
  },
  {
    field: 'builtIn',
    label: $t('config.builtIn'),
    exclude: ['form'],
    columnProps: { width: 90 },
    viewRender: ({ text }) => h(Tag, { color: text ? 'blue' : 'default' }, () => text ? $t('config.builtInTypes.builtIn') : $t('config.builtInTypes.custom'))
  },
];
async function loadGroupCounts() { allConfigs.value = (await configApi.getConfigList({ page: 1, pageSize: 100 })).list;
}
async function save(data: ConfigEditorData) {
  const result = await saveConfigEditor(data);
  message.success($t(data.id ? 'config.updateSuccess' : 'config.createSuccess'));
  void loadGroupCounts().catch(console.error);
  return result;
}
const [register, table] = useTable({
  title: () => groupOptions.find((group) => group.value === selectedGroup.value)?.label || '',
  columns,
  indexColumn: false,
  params: { group: selectedGroup },
  attrs: {
    rowKey: 'id',
    onReload: () => table.reload(),
    pageTransform: ({ current, size }) => ({ page: current, pageSize: size }),
    resultTransform: (response) => ({
      records: response.list,
      total: response.total,
      current: response.current ?? response.page,
      size: response.pageSize
    })
  },
  apis: {
    query: configApi.getConfigList.bind(configApi),
    save,
    update: save,
    delete: async (keys: string[]) => {
      await Promise.all(keys.map((id) => configApi.deleteConfig(id)));
      message.success($t('config.deleteSuccess'));
      void loadGroupCounts().catch(console.error);
    }
  },
  buttons: {
    actions: [
      {
        name: 'add',
        label: $t('config.createConfig'),
        onClick: (_context, action) => action?.({ resetData: { group: selectedGroup.value } })
      }
    ]
  },
  rowButtons: {
    actions: [
      'edit',
      {
        name: 'delete',
        hidden: ({ record }) => record.builtIn,
        confirmText: ({ record }) => $t('config.confirmDeleteContent', { name: record.name })
      }
    ]
  },
  rowEditor: {
    addMode: 'modal',
    editMode: 'modal',
    modalProps: { width: 520 },
    form: { subSpan: 24, attrs: { labelCol: { span: 6 } } }
  },
});
onMounted(() => { void loadGroupCounts().catch(console.error);
});
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
