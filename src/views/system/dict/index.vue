<template>
  <div class="page-container">
    <SplitLayout :side-width="260">
      <template #side>
        <div class="dict-types-header">
          <h3>{{ $t('dict.dictType') }}</h3>
          <SuperButtons :actions="typeAddActions" />
        </div>
        <div class="dict-types-list">
          <div v-for="type in dictTypes" :key="type.id" class="dict-type-item" :class="{ active: selectedTypeCode === type.code }" @click="selectedTypeCode = type.code">
            <div class="type-info">
              <div class="type-name">{{ type.name }}</div>
              <div class="type-code">{{ type.code }}</div>
            </div>
            <div class="type-actions" @click.stop>
              <SuperButtons :actions="typeActions" :effect-data="{ record: type }" :button-props="{ type: 'text', size: 'small' }" />
            </div>
          </div>
        </div>
      </template>
      <template #main>
        <SuperTable v-if="selectedTypeCode" @register="register" />
        <div v-else class="dict-data-empty">
          <a-empty :description="$t('dict.selectTypeHint')" />
        </div>
      </template>
    </SplitLayout>
  </div>
</template>

<script setup lang="ts">
import type { DictType } from '@/types/dict';
import type { ExtColumnsItem, ButtonItem } from 'superform-antdv';
import type { DictTypeInput, DictDataInput } from '@/api/generated/admin/data-contracts';
import { message } from 'antdv-next';
import { SuperTable, SuperButtons, useTable, useModalForm } from 'superform-antdv';
import { ref, computed, onMounted } from 'vue';
import {
  getDictTypes,
  createDictType,
  updateDictType,
  deleteDictType,
  createDictData,
  updateDictData,
  deleteDictData
} from '@/api/facade/dict';
import { dictApi } from '@/api/generated/admin/Dict';
import SplitLayout from '@/components/Layout/SplitLayout/index.vue';
import { useDictStore } from '@/stores/dict';
import { $t } from '@/locales';
const dictStore = useDictStore();
const dictTypes = ref<DictType[]>([]);
const selectedTypeCode = ref('');
const selectedTypeName = computed(() => dictTypes.value.find((type) => type.code === selectedTypeCode.value)?.name || '');
const statusOptions = [
  { label: $t('dict.enabled'), value: 'enabled' },
  { label: $t('dict.disabled'), value: 'disabled' }
];
async function loadTypes() {
  dictTypes.value = await getDictTypes();
  if (!dictTypes.value.some((type) => type.code === selectedTypeCode.value)) selectedTypeCode.value = dictTypes.value[0]?.code || '';
}// 写入成功后仅更新导航与字典订阅，列表刷新由核心 CRUD 管理。
function refreshDictionary() { void dictStore.loadDictData().catch(console.error);
}
const typeModal = useModalForm({
  subSpan: 24,
  attrs: { labelCol: { span: 6 } },
  subItems: [
    { type: 'Hidden', field: 'id' },
    { type: 'Input', field: 'name', label: $t('dict.typeName'), required: true },
    {
      type: 'Input',
      field: 'code',
      label: $t('dict.typeCode'),
      required: true,
      disabled: ({ formData }) => Boolean(formData.id)
    },
    { type: 'TextArea', field: 'description', label: $t('dict.description'), attrs: { rows: 3 } },
    {
      type: 'RadioGroup',
      field: 'status',
      label: $t('common.status'),
      initialValue: 'enabled',
      options: { source: statusOptions }
    },
  ]
}, {
  onOk: async (data: DictTypeInput & { id?: string }) => {
    if (data.id) await updateDictType(data.id, data);
    else await createDictType(data);
    message.success($t(data.id ? 'dict.updateSuccess' : 'dict.createSuccess'));
    void loadTypes().catch(console.error);
    refreshDictionary();
  }
});
const typeAddActions: ButtonItem[] = [
  {
    label: $t('common.add'),
    onClick: () => typeModal.openModal({ title: $t('dict.createType') })
  }
];
const typeActions: ButtonItem[] = [
  {
    name: 'edit',
    onClick: ({ record }) => typeModal.openModal({ data: record, title: $t('dict.editType') })
  },
  {
    name: 'delete',
    confirmText: ({ record }) => $t('dict.confirmDeleteType', { name: record.name }),
    onClick: async ({ record }) => {
      await deleteDictType(record.id);
      message.success($t('dict.deleteSuccess'));
      void loadTypes().catch(console.error);
      refreshDictionary();
    }
  },
];
const columns: ExtColumnsItem[] = [
  { type: 'Hidden', field: 'id' },
  { type: 'Hidden', field: 'typeCode' },
  { type: 'Input', field: 'label', label: $t('dict.dictLabel'), required: true },
  { type: 'Input', field: 'value', label: $t('dict.dictValue'), required: true },
  {
    type: 'InputNumber',
    field: 'sort',
    label: $t('dict.sort'),
    initialValue: 0,
    attrs: { min: 0, precision: 0 },
    columnProps: { width: 80 }
  },
  {
    type: 'RadioGroup',
    field: 'status',
    label: $t('common.status'),
    initialValue: 'enabled',
    options: { source: statusOptions },
    columnProps: { width: 90 }
  },
  { type: 'TextArea', field: 'remark', label: $t('dict.remark'), attrs: { rows: 3 } },
];
async function save(data: DictDataInput & { id?: string }) {
  const result = data.id ? await updateDictData(data.id, data) : await createDictData(data);
  message.success($t(data.id ? 'dict.updateSuccess' : 'dict.createSuccess'));
  refreshDictionary();
  return result;
}
const [register, table] = useTable({
  title: () => $t('dict.dictDataTitle', { name: selectedTypeName.value }),
  columns,
  indexColumn: false,
  params: { typeCode: selectedTypeCode },
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
    query: dictApi.getDictDataList.bind(dictApi),
    save,
    update: save,
    delete: async (keys: string[]) => {
      await Promise.all(keys.map((id) => deleteDictData(id)));
      message.success($t('dict.deleteSuccess'));
      refreshDictionary();
    }
  },
  buttons: {
    actions: [
      {
        name: 'add',
        label: $t('dict.createData'),
        onClick: (_context, action) => action?.({ resetData: { typeCode: selectedTypeCode.value } })
      }
    ]
  },
  rowButtons: {
    actions: [
      'edit',
      {
        name: 'delete',
        confirmText: ({ record }) => $t('dict.confirmDeleteData', { label: record.label })
      }
    ]
  },
  rowEditor: {
    addMode: 'modal',
    editMode: 'modal',
    form: { subSpan: 24, attrs: { labelCol: { span: 6 } } }
  },
});
onMounted(() => { void loadTypes().catch(console.error);
});
</script>

<style scoped lang="scss">
// dict types content
.dict-types-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-secondary, #f0f0f0);

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
  }
}

.dict-types-list {
  flex: 1;
  overflow-y: auto;
  margin: 0 -8px;
  padding: 0 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }

  .dict-type-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 12px 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 4px;
    border: none;
    transition: all 0.2s ease;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 0;
      background: var(--ant-primary-color);
      border-radius: 0 3px 3px 0;
      transition: height 0.2s ease;
    }

    &:hover {
      background: var(--color-fill-quaternary, #fafafa);

      .type-actions {
        opacity: 1;
        transform: translateX(0);
      }
    }

    &.active {
      background: color-mix(in srgb, var(--color-primary) 8%, transparent);

      &::before {
        height: 60%;
      }

      .type-name {
        color: var(--color-primary);
        font-weight: 600;
      }
    }

    .type-info {
      flex: 1;
      min-width: 0;

      .type-name {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 2px;
        color: var(--color-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color 0.2s;
      }

      .type-code {
        font-size: 12px;
        color: var(--color-text-quaternary, #bfbfbf);
        font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .type-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transform: translateX(8px);
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
  }
}

// dict data content
:deep(.ant-table-thead > tr > th),
:deep(.ant-table-thead > tr > td) {
  background: var(--color-fill-quaternary, #fafafa);
}

.dict-data-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
