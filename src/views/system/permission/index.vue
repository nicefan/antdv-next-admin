<template>
  <div class="page-container">
    <SuperTable
      ref="tableRef"
      :schema="{
        slots: { extra: 'extra' },
        columns: columns,
        apis: { query: fetchTableData },
        searchForm: { subItems: searchFormItems, limit: undefined },
        indexColumn: false,
        title: toolbarConfig.title,
        attrs: {
          pagination: false,
          filterSortTransform: nativeQuery1.filterSortTransform,
          tableTools: 'actions' in toolbarConfig ? toolbarConfig.actions : undefined,
          onReload: () => tableRef?.reload(),
          rowKey: 'id',
          expandedRowKeys: expandedRowKeys,
          childrenColumnName: 'children',
          expandable: { expandIconColumnIndex: 0 },
          onExpandedRowsChange: handleExpandedRowsChange,
        },
      }"
    >
      <template #extra>
        <a-space :size="8">
          <a-button type="primary" @click="handleCreateRoot">
            <PlusOutlined /> {{ $t('permission.createPermission') }}
          </a-button>
          <a-button @click="expandAllRows">{{ $t('permission.expandAll') }}</a-button>
          <a-button @click="collapseAllRows">{{ $t('permission.collapseAll') }}</a-button>
        </a-space>
      </template>
    </SuperTable>

    <NativeModal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="submitting"
      width="760px"
      @cancel="handleCancel"
      @ok="submitEditForm1"
      :after-close="handleFormClosed"
    >
      <div>
        <a-alert v-if="currentParentName" type="info" show-icon style="margin-bottom: 12px">
          <template #message> {{ $t('permission.parentMenu') }}：{{ currentParentName }} </template>
        </a-alert>
      </div>
      <SuperForm
        ref="editFormRef1"
        :key="formSessionKey"
        :schema="{
          dataSource: formData,
          subSpan: 12,
          attrs: {
            layout: 'vertical',
            onValuesChange: (_changed: unknown, values: Record<string, unknown>) =>
              handleFormValuesChange(values),
          },
          subItems: formItems,
        }"
      />
    </NativeModal>
  </div>
</template>

<script setup lang="ts">
import type { LocalizedText, Permission } from '@/types/auth';
import type { UniOption, ExtColumnsItem } from 'superform-antdv';

import { PlusOutlined, EditOutlined, DeleteOutlined } from '@antdv-next/icons';
import { message, Modal } from 'antdv-next';
import { SuperTable, SuperForm, SuperButtons } from 'superform-antdv';
import { computed, ref, h } from 'vue';

import { permissionsApi } from '@/api/generated/admin/Permission';
import { useCrudFormSession } from '@/composables/useCrudFormSession';
import { $t, getLocale } from '@/locales';
import { useSettingsStore } from '@/stores/settings';
import { renderIcon } from '@/utils/icon';
import { resolveLocalizedText } from '@/utils/localizedText';

type PermissionFormValues = {
  name: string | LocalizedText;
  code: string;
  type: Permission['type'];
  description: string;
  parentId?: string;
  path: string;
  component: string;
  icon: string;
  sort: number;
  status: boolean;
  visible: boolean;
};

const viewModules = import.meta.glob('/src/views/**/*.vue');
const componentPathOptions = Object.keys(viewModules)
  .map((filePath) => filePath.replace(/^\/src\/views\//, '').replace(/\.vue$/, ''))
  .sort((firstPath, secondPath) => firstPath.localeCompare(secondPath))
  .map((componentPath) => ({
    label: componentPath,
    value: componentPath,
  }));

const tableRef = ref<{
  reload: () => Promise<unknown>;
} | null>(null);

const settingsStore = useSettingsStore();
const useI18nName = computed(() => settingsStore.showLanguageSwitch);

const {
  open: modalVisible,
  mode: modalMode,
  record: editingPermission,
  initialValues: formData,
  sessionKey: formSessionKey,
  openCreate: openCreateForm,
  openEdit: openEditForm,
  close: closeFormModal,
  finishClose: finishFormClose,
} = useCrudFormSession<Permission, PermissionFormValues>(createDefaultFormValues);
const submitting = ref(false);
const editingPermissionId = computed(() => editingPermission.value?.id ?? null);

const menuTree = ref<Permission[]>([]);
const expandedRowKeys = ref<string[]>([]);
const keepExpandAll = ref(true);

const formValues = ref<PermissionFormValues>(createDefaultFormValues());

const toolbarConfig = computed(() => ({
  title: $t('permission.title'),
  subTitle: 'SuperTable + SuperForm',
  actions: ['refresh', 'density', 'columnSetting'] as Array<
    'refresh' | 'density' | 'columnSetting'
  >,
}));

const permissionTypeOptions = computed(() => [
  { label: $t('permission.menu'), value: 'menu' },
  { label: $t('permission.button'), value: 'button' },
  { label: $t('permission.api'), value: 'api' },
]);

const currentType = computed(() => formValues.value.type || 'menu');

const modalTitle = computed(() => {
  if (modalMode.value === 'edit') {
    return $t('permission.editPermission');
  }
  return formValues.value.parentId
    ? $t('permission.createChildMenu')
    : $t('permission.createPermission');
});

const currentParentName = computed(() => {
  if (!formValues.value.parentId) {
    return '';
  }
  return findPermissionName(menuTree.value, formValues.value.parentId) || '-';
});

const permissionTypeValueEnum = computed<
  Record<string, { text: string; status?: string; color?: string }>
>(() => ({
  menu: { text: $t('permission.menu'), color: 'processing' },
  button: { text: $t('permission.button'), color: 'success' },
  api: { text: $t('permission.api'), color: 'purple' },
}));

const permissionStatusValueEnum = computed<
  Record<string, { text: string; status?: string; color?: string }>
>(() => ({
  active: { text: $t('user.active'), status: 'success' },
  inactive: { text: $t('user.inactive'), status: 'default' },
}));

const permissionVisibleValueEnum = computed<
  Record<string, { text: string; status?: string; color?: string }>
>(() => ({
  true: { text: $t('permission.show'), color: 'blue' },
  false: { text: $t('permission.hide'), color: 'default' },
}));

function createLocalizedName(value = ''): string | LocalizedText {
  if (!useI18nName.value) {
    return value;
  }
  return {
    'zh-CN': value,
    'en-US': value,
    'ja-JP': value,
    'ko-KR': value,
  };
}

const searchFormItems = computed<UniOption[]>(() => [
  { type: 'Input', field: 'keyword', label: () => $t('common.search') },
  {
    type: 'Select',
    field: 'type',
    label: () => $t('permission.type'),
    options: { source: () => permissionTypeOptions.value },
  },
  {
    type: 'Select',
    field: 'status',
    label: () => $t('common.status'),
    options: {
      source: () => [
        { label: $t('user.active'), value: 'active' },
        { label: $t('user.inactive'), value: 'inactive' },
      ],
    },
  },
]);

const columns = computed((): ExtColumnsItem[] => [
  { field: 'keyword', label: () => $t('common.search'), exclude: ['table'] },
  {
    field: 'name',
    label: () => $t('permission.name'),
    viewRender: ({ text }: { text: unknown }) =>
      ((value) => resolveLocalizedText(value as Permission['name'], getLocale()))(text),
    columnProps: { width: 220, fixed: 'left' },
  },
  {
    field: 'icon',
    label: () => $t('permission.icon'),
    viewRender: ({ text }: { text: unknown }) =>
      ((value) => renderIcon(value as string) || '-')(text),
    columnProps: { width: 80, align: 'center' },
  },
  { field: 'code', label: () => $t('permission.code'), columnProps: { width: 220 } },
  {
    field: 'type',
    label: () => $t('permission.type'),
    viewRender: ({ text }: { text: unknown }) =>
      h(ValueView, {
        value: text,
        type: 'tag',
        enum: permissionTypeValueEnum.value,
      }),
    columnProps: { width: 120 },
  },
  { field: 'path', label: () => $t('permission.routePath'), columnProps: { width: 170 } },
  { field: 'component', label: () => $t('permission.componentPath'), columnProps: { width: 220 } },
  {
    field: 'status',
    label: () => $t('common.status'),
    viewRender: ({ text }: { text: unknown }) =>
      h(ValueView, {
        value: text,
        type: 'badge',
        enum: permissionStatusValueEnum.value,
      }),
    columnProps: { width: 120 },
  },
  {
    field: 'visible',
    label: () => $t('permission.visible'),
    viewRender: ({ text }: { text: unknown }) =>
      h(ValueView, {
        value: text,
        type: 'tag',
        enum: permissionVisibleValueEnum.value,
      }),
    columnProps: { width: 100 },
  },
  { field: 'sort', label: () => $t('permission.sort'), columnProps: { width: 90 } },
  {
    field: 'action',
    label: () => $t('common.actions'),
    viewRender: ({ record: row }: { record: Record<string, unknown> }) =>
      h(SuperButtons, {
        buttonProps: { type: 'link', size: 'small' },
        effectData: { record: row },
        actions: [
          {
            label: $t('common.edit'),
            icon: () => h(EditOutlined),
            onClick: ({ record }: { record: Record<string, unknown> }) =>
              handleEdit(record as unknown as Permission),
          },
          {
            label: $t('common.delete'),
            icon: () => h(DeleteOutlined),
            onClick: ({ record }: { record: Record<string, unknown> }) =>
              handleDelete(record as unknown as Permission),
            attrs: { danger: true },
          },
          {
            label: $t('permission.addChild'),
            icon: () => h(PlusOutlined),
            hidden: ({ record }: { record: Record<string, unknown> }) =>
              (record as unknown as Permission).type !== 'menu',
            onClick: ({ record }: { record: Record<string, unknown> }) =>
              handleCreateChild(record as unknown as Permission),
          },
        ],
      }),
    columnProps: { width: 260, fixed: 'right' },
  },
]);

const formItems = computed<UniOption[]>(() => [
  useI18nName.value
    ? {
        type: 'I18nInput',
        field: 'name',
        label: () => $t('permission.name'),
        required: true,
        dynamicAttrs: () => ({
          placeholder: $t('permission.name'),
          modalTitle: $t('permission.name'),
        }),
      }
    : {
        type: 'Input',
        field: 'name',
        label: () => $t('permission.name'),
        required: true,
        rules: [{ required: true, message: $t('permission.nameRequired') }],
        dynamicAttrs: () => ({
          placeholder: $t('permission.name'),
        }),
      },
  {
    type: 'Input',
    field: 'code',
    label: () => $t('permission.code'),
    required: true,
    rules: [
      { required: true, message: $t('permission.codeRequired') },
      { pattern: /^[a-zA-Z0-9_.-]+$/, message: $t('permission.codePattern') },
    ],
    dynamicAttrs: () => ({
      disabled: Boolean(editingPermissionId.value),
    }),
  },
  {
    type: 'Select',
    field: 'type',
    label: () => $t('permission.type'),
    options: { source: () => permissionTypeOptions.value },
    required: true,
  },
  {
    type: 'Switch',
    field: 'status',
    label: () => $t('common.status'),
    dynamicAttrs: () => ({
      checkedChildren: $t('user.active'),
      unCheckedChildren: $t('user.inactive'),
    }),
  },
  {
    type: 'Input',
    field: 'path',
    label: () => $t('permission.routePath'),
    hidden: () => currentType.value !== 'menu',
    rules: [
      {
        validator: (_rule: unknown, value: unknown) => {
          if (currentType.value === 'menu' && !String(value || '').trim()) {
            return Promise.reject(new Error($t('permission.menuRouteRequired')));
          }
          return Promise.resolve();
        },
      },
    ],
  },
  {
    type: 'Select',
    field: 'component',
    label: () => $t('permission.componentPath'),
    hidden: () => currentType.value !== 'menu',
    options: { source: () => componentPathOptions },
    dynamicAttrs: () => ({
      showSearch: true,
      placeholder: $t('permission.componentPathPlaceholder'),
    }),
  },
  {
    type: 'IconPicker',
    field: 'icon',
    label: () => $t('permission.icon'),
    hidden: () => currentType.value !== 'menu',
    dynamicAttrs: () => ({
      placeholder: $t('permission.iconPlaceholder'),
      onlineLimit: 160,
    }),
  },
  {
    type: 'InputNumber',
    field: 'sort',
    label: () => $t('permission.sort'),
    hidden: () => currentType.value !== 'menu',
    dynamicAttrs: () => ({
      min: 0,
    }),
  },
  {
    type: 'TextArea',
    field: 'description',
    label: () => $t('role.description'),
    span: 2 * 12,
    dynamicAttrs: () => ({
      rows: 3,
    }),
  },
  {
    type: 'Switch',
    field: 'visible',
    label: () => $t('permission.visibleStatus'),
    span: 2 * 12,
    dynamicAttrs: () => ({
      checkedChildren: $t('permission.show'),
      unCheckedChildren: $t('permission.hide'),
    }),
  },
]);

function createDefaultFormValues(): PermissionFormValues {
  return {
    name: createLocalizedName(),
    code: '',
    type: 'menu',
    description: '',
    parentId: undefined,
    path: '',
    component: '',
    icon: '',
    sort: 0,
    status: true,
    visible: true,
  };
}

function normalizePath(path: string) {
  if (!path) {
    return '';
  }
  return path.startsWith('/') ? path : `/${path}`;
}

function collectPermissionIds(list: Permission[]): string[] {
  const ids: string[] = [];
  list.forEach((item) => {
    ids.push(item.id);
    if (item.children && item.children.length > 0) {
      ids.push(...collectPermissionIds(item.children));
    }
  });
  return ids;
}

function findPermissionName(list: Permission[], id: string): string {
  for (const item of list) {
    if (item.id === id) {
      return resolveLocalizedText(item.name, getLocale());
    }
    if (item.children && item.children.length > 0) {
      const childName = findPermissionName(item.children, id);
      if (childName) {
        return childName;
      }
    }
  }
  return '';
}

const fetchTableData = async (params: Record<string, unknown>, config?: RequestConfig) => {
  const keyword = typeof params.keyword === 'string' ? params.keyword.trim() : undefined;
  const response = await permissionsApi.getPermissionList(
    {
      keyword: keyword || undefined,
      type: typeof params.type === 'string' ? params.type : undefined,
      status: typeof params.status === 'string' ? params.status : undefined,
    },
    config,
  );

  menuTree.value = response;
  const allIds = collectPermissionIds(menuTree.value);

  if (keepExpandAll.value) {
    expandedRowKeys.value = allIds;
  } else {
    expandedRowKeys.value = expandedRowKeys.value.filter((id) => allIds.includes(String(id)));
  }

  return {
    records: response,
    total: allIds.length,
    current: Number(params.current ?? 1),
    size: Number(params.pageSize ?? 10),
  };
};

const refreshTable = () => {
  tableRef.value?.reload();
};

const handleExpandedRowsChange = (keys: string[]) => {
  expandedRowKeys.value = keys;
  const allIds = collectPermissionIds(menuTree.value);
  keepExpandAll.value = keys.length === allIds.length;
};

const expandAllRows = () => {
  expandedRowKeys.value = collectPermissionIds(menuTree.value);
  keepExpandAll.value = true;
};

const collapseAllRows = () => {
  expandedRowKeys.value = [];
  keepExpandAll.value = false;
};

const handleCreateRoot = () => {
  const initialValues = createDefaultFormValues();
  formValues.value = initialValues;
  openCreateForm(initialValues);
};

const handleCreateChild = (record: Permission) => {
  const initialValues: PermissionFormValues = {
    ...createDefaultFormValues(),
    parentId: record.id,
    type: 'menu' as const,
  };
  formValues.value = initialValues;
  openCreateForm(initialValues);
};

const handleEdit = (record: Permission) => {
  const initialValues: PermissionFormValues = {
    name: useI18nName.value
      ? typeof record.name === 'string'
        ? createLocalizedName(record.name)
        : record.name
      : resolveLocalizedText(record.name, getLocale()),
    code: record.code,
    type: record.type,
    description: record.description || '',
    parentId: record.parentId,
    path: record.path || '',
    component: record.component || '',
    icon: record.icon || '',
    sort: record.sort ?? 0,
    status: record.status !== 'inactive',
    visible: record.visible !== false,
  };
  formValues.value = initialValues;
  openEditForm(record, initialValues);
};

const handleCancel = () => {
  closeFormModal();
};

const handleFormClosed = () => {
  if (modalVisible.value) {
    return;
  }
  finishFormClose();
  formValues.value = createDefaultFormValues();
};

const handleDelete = async (record: Permission) => {
  Modal.confirm({
    title: $t('permission.deletePermission'),
    content: $t('permission.confirmDelete'),
    onOk: async () => {
      await permissionsApi.deletePermission(record.id);
      message.success($t('common.success'));
      refreshTable();
    },
  });
};

const handleFormValuesChange = (values: Record<string, unknown>) => {
  formValues.value = {
    ...formValues.value,
    ...values,
  };
};

const handleSubmit = async (rawValues: Record<string, unknown>) => {
  const values = rawValues as PermissionFormValues;

  const payload: Partial<Permission> = {
    name: values.name,
    code: values.code?.trim(),
    type: values.type,
    description: values.description?.trim(),
    parentId: values.parentId,
    status: values.status ? 'active' : 'inactive',
    visible: values.visible,
    sort: Number(values.sort ?? 0),
    path: values.type === 'menu' ? normalizePath(values.path?.trim()) : undefined,
    component: values.type === 'menu' ? values.component?.trim() || undefined : undefined,
    icon: values.type === 'menu' ? values.icon?.trim() || undefined : undefined,
    resource:
      values.type === 'menu'
        ? normalizePath(values.path?.trim())
        : values.code?.trim().replace(/\.[^.]+$/, ''),
    action: values.type === 'menu' ? 'view' : values.code?.trim().split('.').pop() || '*',
  };

  submitting.value = true;
  try {
    if (modalMode.value === 'edit' && editingPermissionId.value) {
      await permissionsApi.updatePermission(editingPermissionId.value, payload);
      message.success($t('permission.updateSuccess'));
    } else {
      await permissionsApi.createPermission(payload);
      message.success($t('permission.createSuccess'));
    }
    closeFormModal();
    refreshTable();
  } finally {
    submitting.value = false;
  }
};

const nativeQuery1 = useTableParams(() => columns.value);
const editFormRef1 = ref<{ submit: () => Promise<Record<string, unknown>> }>();
async function submitEditForm1(): Promise<void> {
  if (!editFormRef1.value) return;
  const values = await editFormRef1.value.submit();
  await handleSubmit(values);
}

import ValueView from '@/components/Display/ValueView.vue';
import NativeModal from '@/components/Native/Modal/index.vue';
import { useTableParams } from '@/composables/useTableParams';
</script>
