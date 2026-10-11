<template>
  <div class="page-container">
    <SuperTable
      ref="tableRef"
      :schema="{
        slots: { extra: 'extra' },
        columns: columns,
        apis: { query: fetchTableData },
        searchForm: { subItems: searchFormItems, limit: 2 },
        indexColumn: false,
        title: toolbarConfig.title,
        attrs: {
          pagination: {},
          filterSortTransform: nativeQuery1.filterSortTransform,
          tableTools: 'actions' in toolbarConfig ? toolbarConfig.actions : undefined,
          onReload: () => tableRef?.reload(),
          rowKey: 'id',
        },
      }"
    >
      <template #extra>
        <a-button type="primary" @click="handleCreate">
          <PlusOutlined /> {{ $t('role.createRole') }}
        </a-button>
      </template>
    </SuperTable>

    <NativeModal
      v-model:open="modalVisible"
      :title="editingRoleId ? $t('role.editRole') : $t('role.createRole')"
      :confirm-loading="submitting"
      width="820px"
      @cancel="handleCancel"
      @ok="submitEditForm1"
      :after-close="finishFormClose"
    >
      <SuperForm
        ref="editFormRef1"
        :key="formSessionKey"
        :schema="{
          dataSource: formData,
          subSpan: 12,
          attrs: { layout: 'vertical' },
          subItems: formItems,
        }"
      />
    </NativeModal>
  </div>
</template>

<script setup lang="ts">
import type { RoleInput } from '@/api/generated/admin/data-contracts';
import type { Permission, Role } from '@/types/auth';
import type { TreeSelectProps } from 'antdv-next';
import type { UniOption, ExtColumnsItem } from 'superform-antdv';

import { PlusOutlined, EditOutlined, DeleteOutlined } from '@antdv-next/icons';
import { message, Modal, Tag } from 'antdv-next';
import { SuperTable, SuperForm, SuperButtons } from 'superform-antdv';
import { computed, h, onMounted, ref } from 'vue';

import { permissionsApi } from '@/api/generated/admin/Permission';
import { rolesApi } from '@/api/generated/admin/Role';
import { useCrudFormSession } from '@/composables/useCrudFormSession';
import { $t, getLocale } from '@/locales';
import { resolveLocalizedText } from '@/utils/localizedText';

import { getPermissionTypePresentation } from './permissionTypePresentation';

type RoleFormValues = {
  name: string;
  code: string;
  description: string;
  permissionIds: string[];
};

type PermissionOption = {
  label: string;
  value: string;
  children?: PermissionOption[];
};

const tableRef = ref<{
  reload: () => Promise<unknown>;
  query: () => Promise<unknown>;
} | null>(null);
const {
  open: modalVisible,
  record: editingRole,
  initialValues: formData,
  sessionKey: formSessionKey,
  openCreate: openCreateForm,
  openEdit: openEditForm,
  close: closeFormModal,
  finishClose: finishFormClose,
} = useCrudFormSession<Role, RoleFormValues>(createDefaultFormValues);
const submitting = ref(false);
const editingRoleId = computed(() => editingRole.value?.id ?? null);
const permissionTree = ref<Permission[]>([]);

const toolbarConfig = computed(() => ({
  title: $t('role.title'),
  subTitle: 'SuperTable + SuperForm',
  actions: ['refresh', 'density', 'columnSetting'] as Array<
    'refresh' | 'density' | 'columnSetting'
  >,
}));

const permissionOptions = computed<PermissionOption[]>(() => {
  const buildOptions = (nodes: Permission[]): PermissionOption[] => {
    return nodes.map((node) => ({
      label: `${resolveLocalizedText(node.name, getLocale())} (${node.code})`,
      value: node.id,
      children: node.children && node.children.length > 0 ? buildOptions(node.children) : undefined,
    }));
  };
  return buildOptions(permissionTree.value);
});

const permissionMap = computed(() => {
  const map = new Map<string, Permission>();
  const traverse = (nodes: Permission[]) => {
    nodes.forEach((node) => {
      map.set(node.id, {
        ...node,
        children: node.children ? [...node.children] : undefined,
      });
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  traverse(permissionTree.value);
  return map;
});

const renderPermissionTreeTitle: NonNullable<TreeSelectProps['treeTitleRender']> = (nodeData) => {
  const title = String(nodeData.title ?? '');
  const permission = permissionMap.value.get(String(nodeData.value));
  const presentation = getPermissionTypePresentation(permission?.type);

  if (!presentation) {
    return title;
  }

  return h(
    'span',
    {
      style: {
        alignItems: 'center',
        display: 'inline-flex',
        gap: '8px',
      },
    },
    [
      h('span', title),
      h(
        Tag,
        {
          class: 'permission-type-tag',
          color: presentation.color,
          style: { marginInlineEnd: 0 },
        },
        () => $t(presentation.labelKey),
      ),
    ],
  );
};

const searchFormItems = computed<UniOption[]>(() => [
  { type: 'Input', field: 'name', label: () => $t('role.name') },
  { type: 'Input', field: 'code', label: () => $t('role.code') },
]);

const columns = computed<ExtColumnsItem[]>(() => [
  { field: 'name', label: () => $t('role.name'), columnProps: { width: 200 } },
  { field: 'code', label: () => $t('role.code'), columnProps: { width: 200 } },
  { field: 'description', label: () => $t('role.description') },
  { field: 'permissionCount', label: () => $t('role.permissions'), columnProps: { width: 120 } },
  {
    field: 'updatedAt',
    label: () => $t('common.updateTime'),
    viewRender: ({ text }: { text: unknown }) =>
      h(ValueView, { value: text, type: 'dateTime', enum: undefined, valueTypeProps: undefined }),
    columnProps: { width: 200 },
  },
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
              handleEdit(record as unknown as Role),
          },
          {
            label: $t('common.delete'),
            icon: () => h(DeleteOutlined),
            onClick: ({ record }: { record: Record<string, unknown> }) =>
              handleDelete(record as unknown as Role),
            attrs: { danger: true },
          },
        ],
      }),
    columnProps: { width: 160, fixed: 'right' },
  },
]);

const formItems = computed<UniOption[]>(() => [
  { type: 'Input', field: 'name', label: () => $t('role.name'), required: true },
  {
    type: 'Input',
    field: 'code',
    label: () => $t('role.code'),
    required: true,
    rules: [
      { required: true, message: $t('role.codeRequired') },
      { pattern: /^[a-zA-Z0-9_.-]+$/, message: $t('role.codePattern') },
    ],
    dynamicAttrs: () => ({
      disabled: Boolean(editingRoleId.value),
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
    type: 'TreeSelect',
    field: 'permissionIds',
    label: () => $t('role.permissions'),
    span: 2 * 12,
    options: { source: () => permissionOptions.value },
    rules: [
      {
        validator: (_context: unknown, value: unknown) =>
          Array.isArray(value) && value.length > 0 ? true : new Error($t('role.selectPermissions')),
      },
    ],
    dynamicAttrs: () => ({
      class: 'permission-role-tree-select',
      treeCheckable: true,
      allowClear: true,
      treeDefaultExpandAll: true,
      showCheckedStrategy: 'SHOW_PARENT',
      maxTagCount: 2,
      treeTitleRender: renderPermissionTreeTitle,
    }),
  },
]);

function createDefaultFormValues(): RoleFormValues {
  return {
    name: '',
    code: '',
    description: '',
    permissionIds: [],
  };
}

const fetchPermissionTreeData = async () => {
  const response = await permissionsApi.getPermissionTree();
  permissionTree.value = response;
};

const fetchTableData = async (params: Record<string, unknown>, config?: RequestConfig) => {
  const response = await rolesApi.getRoleList(
    {
      current: Number(params.current || 1),
      pageSize: Number(params.pageSize || 10),
      name: (params.name as string)?.trim() || undefined,
      code: (params.code as string)?.trim() || undefined,
    },
    config,
  );

  const list = response.list.map((item) => ({
    ...item,
    permissionCount: item.permissions?.length || 0,
  }));

  return {
    records: list,
    total: response.total,
    current: Number(params.current ?? 1),
    size: Number(params.pageSize ?? 10),
  };
};

const refreshTable = () => {
  tableRef.value?.reload();
};

const reloadTable = () => {
  tableRef.value?.query();
};

const handleCreate = () => {
  openCreateForm();
};

const handleEdit = (record: Role) => {
  const initialValues: RoleFormValues = {
    name: record.name,
    code: record.code,
    description: record.description || '',
    permissionIds: (record.permissions || []).map((permission) => permission.id),
  };
  openEditForm(record, initialValues);
};

const handleCancel = () => {
  closeFormModal();
};

const handleDelete = async (record: Role) => {
  Modal.confirm({
    title: $t('role.deleteRole'),
    content: $t('role.confirmDelete'),
    onOk: async () => {
      await rolesApi.deleteRole(record.id);
      message.success($t('common.success'));
      refreshTable();
    },
  });
};

const handleSubmit = async (rawValues: Record<string, unknown>) => {
  const values = rawValues as RoleFormValues;

  const permissionIds: string[] = values.permissionIds || [];

  const selectedPermissions = permissionIds
    .map((id) => permissionMap.value.get(id))
    .filter((permission): permission is Permission => Boolean(permission));

  const payload: RoleInput = {
    name: values.name?.trim(),
    code: values.code?.trim(),
    description: values.description?.trim(),
    permissions: selectedPermissions,
  };

  submitting.value = true;
  try {
    if (editingRoleId.value) {
      await rolesApi.updateRole(editingRoleId.value, payload);
      message.success($t('role.updateSuccess'));
      refreshTable();
    } else {
      await rolesApi.createRole(payload);
      message.success($t('role.createSuccess'));
      reloadTable();
    }
    closeFormModal();
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await fetchPermissionTreeData();
});

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

<style>
.permission-role-tree-select .ant-select-selection-item .permission-type-tag {
  display: none;
}
</style>
