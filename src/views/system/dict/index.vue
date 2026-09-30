<template>
  <div class="page-container">
    <SplitLayout :side-width="260">
      <template #side>
        <!-- dict type list -->
        <div class="dict-types-header">
          <h3>{{ t('dict.dictType') }}</h3>
          <a-button type="primary" size="small" @click="handleAddType">
            <template #icon><PlusOutlined /></template>
            {{ t('common.add') }}
          </a-button>
        </div>
        <div class="dict-types-list">
          <div
            v-for="type in dictTypes"
            :key="type.id"
            class="dict-type-item"
            :class="{ active: selectedTypeCode === type.code }"
            @click="handleSelectType(type)"
          >
            <div class="type-info">
              <div class="type-name">{{ type.name }}</div>
              <div class="type-code">{{ type.code }}</div>
            </div>
            <div class="type-actions" @click.stop>
              <a-tooltip :title="t('common.edit')">
                <a-button type="text" size="small" @click="handleEditType(type)">
                  <template #icon><EditOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="t('common.delete')">
                <a-button type="text" size="small" danger @click="handleDeleteType(type)">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
            </div>
          </div>
        </div>
      </template>

      <template #main>
        <!-- dict data list -->
        <SuperTable
          ref="nativeTableRef1"
          :schema="{
            slots: { extra: 'extra', bodyCell: 'bodyCell' },
            columns: columns,
            apis: { query: loadData },
            params: nativeQuery1.params,
            pagination: {},
            indexColumn: false,
            title: {
              title: t('dict.dictDataTitle', { name: selectedTypeName }),
            }.title,
            attrs: {
              onChange: nativeQuery1.onChange,
              tableTools: undefined,
              onReload: () => nativeTableRef1?.reload(),
            },
          }"
          v-if="selectedTypeCode"
          :key="selectedTypeCode"
        >
          <template #extra>
            <a-button type="primary" @click="handleAdd">
              <PlusOutlined /> {{ t('dict.createData') }}
            </a-button>
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <Status :value="record.status" :status-map="dictStatusMap" />
            </template>
            <template v-if="column.key === 'action'">
              <a-space :size="4">
                <a-button type="link" size="small" @click="handleEdit(record)">
                  <template #icon><EditOutlined /></template>
                  {{ t('common.edit') }}
                </a-button>
                <a-button type="link" size="small" danger @click="handleDelete(record)">
                  <template #icon><DeleteOutlined /></template>
                  {{ t('common.delete') }}
                </a-button>
              </a-space>
            </template>
          </template>
        </SuperTable>
        <div v-else class="dict-data-empty">
          <a-empty :description="t('dict.selectTypeHint')" />
        </div>
      </template>
    </SplitLayout>

    <!-- dict type modal -->
    <a-modal
      v-model:open="typeModalVisible"
      :title="typeModalTitle"
      @ok="handleTypeSubmit"
      :confirm-loading="typeSaving"
      :closable="!typeSaving"
      :mask-closable="!typeSaving"
      :keyboard="!typeSaving"
      :cancel-button-props="{ disabled: typeSaving }"
    >
      <SuperForm @register="registerTypeForm" />
    </a-modal>

    <!-- dict data modal -->
    <a-modal
      v-model:open="dataModalVisible"
      :title="dataModalTitle"
      @ok="handleDataSubmit"
      :confirm-loading="dataSaving"
      :closable="!dataSaving"
      :mask-closable="!dataSaving"
      :keyboard="!dataSaving"
      :cancel-button-props="{ disabled: dataSaving }"
    >
      <SuperForm @register="registerDataForm" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { DictType, DictData } from '@/types/dict';
import type { StatusMap } from '@/types/display';
import type { ExtColumnsItem } from 'superform-antdv';

import { PlusOutlined, EditOutlined, DeleteOutlined } from '@antdv-next/icons';
import { message, Modal } from 'antdv-next';
import { SuperForm, useForm, SuperTable } from 'superform-antdv';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  getDictTypes,
  createDictType,
  updateDictType,
  deleteDictType,
  createDictData,
  updateDictData,
  deleteDictData,
} from '@/api/facade/dict';
import { dictApi } from '@/api/generated/admin/Dict';
import Status from '@/components/Display/Status/index.vue';
import SplitLayout from '@/components/Layout/SplitLayout/index.vue';
import { useDictStore } from '@/stores/dict';

const { t } = useI18n();
const dictStore = useDictStore();

const dictStatusMap = computed<StatusMap>(() => ({
  enabled: { text: t('dict.enabled'), color: '#52c41a' },
  disabled: { text: t('dict.disabled'), color: '#bfbfbf' },
}));

// dict type list
const dictTypes = ref<DictType[]>([]);
const selectedTypeCode = ref<string>('');
const selectedTypeName = computed(() => {
  const type = dictTypes.value.find((item) => item.code === selectedTypeCode.value);
  return type?.name || '';
});

// dict type modal
const typeModalVisible = ref(false);
const typeModalTitle = computed(() =>
  typeForm.value.id ? t('dict.editType') : t('dict.createType'),
);
const typeForm = ref<Partial<DictType>>({
  name: '',
  code: '',
  description: '',
  status: 'enabled',
});

// dict data modal
const dataModalVisible = ref(false);
const dataModalTitle = computed(() =>
  dataForm.value.id ? t('dict.editData') : t('dict.createData'),
);
const dataForm = ref<Partial<DictData>>({
  label: '',
  value: '',
  sort: 0,
  status: 'enabled',
  remark: '',
});

const typeSaving = ref(false);
const dataSaving = ref(false);
const statusOptions = () => [
  { label: t('dict.enabled'), value: 'enabled' },
  { label: t('dict.disabled'), value: 'disabled' },
];
const [registerTypeForm, typeFormActions] = useForm({
  dataSource: typeForm,
  subSpan: 24,
  attrs: { labelCol: { span: 6 } },
  subItems: [
    { type: 'Hidden', field: 'id' },
    {
      type: 'Input',
      field: 'name',
      label: () => t('dict.typeName'),
      required: true,
      rules: { message: t('dict.requiredFields') },
    },
    {
      type: 'Input',
      field: 'code',
      label: () => t('dict.typeCode'),
      required: true,
      rules: { message: t('dict.requiredFields') },
      disabled: () => !!typeForm.value.id,
    },
    {
      type: 'TextArea',
      field: 'description',
      label: () => t('dict.description'),
      attrs: { rows: 3 },
    },
    {
      type: 'RadioGroup',
      field: 'status',
      label: () => t('common.status'),
      options: { source: statusOptions },
    },
  ],
});
const [registerDataForm, dataFormActions] = useForm({
  dataSource: dataForm,
  subSpan: 24,
  attrs: { labelCol: { span: 6 } },
  subItems: [
    { type: 'Hidden', field: 'id' },
    { type: 'Hidden', field: 'typeCode' },
    {
      type: 'Input',
      field: 'label',
      label: () => t('dict.dictLabel'),
      required: true,
      rules: { message: t('dict.requiredFields') },
    },
    {
      type: 'Input',
      field: 'value',
      label: () => t('dict.dictValue'),
      required: true,
      rules: { message: t('dict.requiredFields') },
    },
    {
      type: 'InputNumber',
      field: 'sort',
      label: () => t('dict.sort'),
      attrs: { min: 0, precision: 0, style: { width: '100%' } },
    },
    {
      type: 'RadioGroup',
      field: 'status',
      label: () => t('common.status'),
      options: { source: statusOptions },
    },
    { type: 'TextArea', field: 'remark', label: () => t('dict.remark'), attrs: { rows: 3 } },
  ],
});

// table columns
const columns: ExtColumnsItem[] = [
  { field: 'label', label: () => t('dict.dictLabel'), columnProps: { key: 'label' } },
  { field: 'value', label: () => t('dict.dictValue'), columnProps: { key: 'value' } },
  { field: 'sort', label: () => t('dict.sort'), columnProps: { key: 'sort', width: 80 } },
  { field: 'status', label: () => t('common.status'), columnProps: { key: 'status', width: 80 } },
  { field: 'remark', label: () => t('dict.remark'), columnProps: { key: 'remark' } },
  {
    field: 'action',
    label: () => t('common.actions'),
    columnProps: { key: 'action', width: 150, fixed: 'right' },
  },
];

// load dict type list
const loadDictTypes = async () => {
  try {
    const response = await getDictTypes();

    dictTypes.value = response;
    if (dictTypes.value.length > 0 && !selectedTypeCode.value) {
      selectedTypeCode.value = dictTypes.value[0].code;
    }
  } catch (error: unknown) {
    console.error(t('dict.loadTypeFailed'), (error as Error).message);
  }
};

// load dict data list
const loadData = async (params: Record<string, unknown>, config?: RequestConfig) => {
  try {
    const response = await dictApi.getDictDataList(
      {
        typeCode: selectedTypeCode.value,
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
    console.error(t('dict.loadDataFailed'), (error as Error).message);
  }
  return {
    records: [],
    total: 0,
    current: Number(params.current ?? 1),
    size: Number(params.pageSize ?? 10),
  };
};

// select dict type
const handleSelectType = (type: DictType) => {
  selectedTypeCode.value = type.code;
};

// add dict type
const handleAddType = () => {
  typeForm.value = {
    name: '',
    code: '',
    description: '',
    status: 'enabled',
  };
  typeModalVisible.value = true;
};

// edit dict type
const handleEditType = (type: DictType) => {
  typeForm.value = { ...type };
  typeModalVisible.value = true;
};

// delete dict type
const handleDeleteType = (type: DictType) => {
  Modal.confirm({
    title: t('dict.confirmDelete'),
    content: t('dict.confirmDeleteType', { name: type.name }),
    onOk: async () => {
      try {
        await deleteDictType(type.id);

        message.success(t('dict.deleteSuccess'));
        loadDictTypes();
        void dictStore.refreshDictData();
        void nativeTableRef1.value?.reload();
        if (selectedTypeCode.value === type.code) {
          selectedTypeCode.value = '';
        }
      } catch (_error: unknown) {
        // 校验由表单展示，请求错误由统一 Service Hooks 反馈。
      }
    },
  });
};

// submit dict type
const handleTypeSubmit = async () => {
  if (typeSaving.value) return;
  typeSaving.value = true;
  try {
    typeForm.value = await typeFormActions.submit();
    if (typeForm.value.id) {
      await updateDictType(typeForm.value.id, typeForm.value);

      message.success(t('dict.updateSuccess'));
      typeModalVisible.value = false;
      loadDictTypes();
      void dictStore.refreshDictData();
      void nativeTableRef1.value?.reload();
    } else {
      await createDictType(typeForm.value);

      message.success(t('dict.createSuccess'));
      typeModalVisible.value = false;
      loadDictTypes();
      void dictStore.refreshDictData();
      void nativeTableRef1.value?.reload();
    }
  } catch (error: unknown) {
    // 校验由表单展示，请求错误由统一 Service Hooks 反馈。
  } finally {
    typeSaving.value = false;
  }
};

// add dict data
const handleAdd = () => {
  dataForm.value = {
    typeCode: selectedTypeCode.value,
    label: '',
    value: '',
    sort: 0,
    status: 'enabled',
    remark: '',
  };
  dataModalVisible.value = true;
};

// edit dict data
const handleEdit = (record: DictData) => {
  dataForm.value = { ...record };
  dataModalVisible.value = true;
};

// delete dict data
const handleDelete = (record: DictData) => {
  Modal.confirm({
    title: t('dict.confirmDelete'),
    content: t('dict.confirmDeleteData', { label: record.label }),
    onOk: async () => {
      try {
        await deleteDictData(record.id);

        message.success(t('dict.deleteSuccess'));
        void dictStore.refreshDictData();
        void nativeTableRef1.value?.reload();
      } catch (_error: unknown) {
        // 校验由表单展示，请求错误由统一 Service Hooks 反馈。
      }
    },
  });
};

// submit dict data
const handleDataSubmit = async () => {
  if (dataSaving.value) return;
  dataSaving.value = true;
  try {
    dataForm.value = await dataFormActions.submit();
    if (dataForm.value.id) {
      await updateDictData(dataForm.value.id, dataForm.value);

      message.success(t('dict.updateSuccess'));
      dataModalVisible.value = false;
      void dictStore.refreshDictData();
      void nativeTableRef1.value?.reload();
    } else {
      await createDictData(dataForm.value);

      message.success(t('dict.createSuccess'));
      dataModalVisible.value = false;
      void dictStore.refreshDictData();
      void nativeTableRef1.value?.reload();
    }
  } catch (error: unknown) {
    // 校验由表单展示，请求错误由统一 Service Hooks 反馈。
  } finally {
    dataSaving.value = false;
  }
};

// init
loadDictTypes();

const nativeTableRef1 = ref<{ reload: () => Promise<unknown> }>();
const nativeQuery1 = useTableParams(() => columns);

import { useTableParams } from '@/composables/useTableParams';
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
