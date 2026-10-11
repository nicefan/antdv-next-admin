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
        <a-space>
          <a-upload :show-upload-list="false" accept=".csv" :before-upload="handleImport">
            <a-button> <UploadOutlined /> {{ $t('common.import') }} </a-button>
          </a-upload>
          <a-button @click="handleExport">
            <DownloadOutlined /> {{ $t('common.export') }}
          </a-button>
          <a-button type="primary" @click="handleCreate">
            <PlusOutlined /> {{ $t('user.createUser') }}
          </a-button>
        </a-space>
      </template>
    </SuperTable>

    <NativeModal
      v-model:open="modalVisible"
      :title="editingUserId ? $t('user.editUser') : $t('user.createUser')"
      :confirm-loading="submitting"
      width="760px"
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
import type { UserInput } from '@/api/generated/admin/data-contracts';
import type { Role, User } from '@/types/auth';
import type { UniOption, ExtColumnsItem } from 'superform-antdv';

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@antdv-next/icons';
import { message, Modal } from 'antdv-next';
import { SuperTable, SuperForm, SuperButtons } from 'superform-antdv';
import { computed, onMounted, ref, h } from 'vue';

import { rolesApi } from '@/api/generated/admin/Role';
import { usersApi } from '@/api/generated/admin/User';
import { useCrudFormSession } from '@/composables/useCrudFormSession';
import { $t } from '@/locales';
import { exportToCSV, parseCSV } from '@/utils/export';

type UserFormValues = {
  username: string;
  realName: string;
  email: string;
  phone: string;
  gender: 'male' | 'female';
  status: boolean;
  roleIds: string[];
  bio: string;
};

const tableRef = ref<{
  reload: () => Promise<unknown>;
  query: () => Promise<unknown>;
} | null>(null);
const {
  open: modalVisible,
  record: editingUser,
  initialValues: formData,
  sessionKey: formSessionKey,
  openCreate: openCreateForm,
  openEdit: openEditForm,
  close: closeFormModal,
  finishClose: finishFormClose,
} = useCrudFormSession<User, UserFormValues>(createDefaultFormValues);
const submitting = ref(false);
const editingUserId = computed(() => editingUser.value?.id ?? null);
const roleOptions = ref<Role[]>([]);

const toolbarConfig = computed(() => ({
  title: $t('user.title'),
  subTitle: 'SuperTable + SuperForm',
  actions: ['refresh', 'density', 'columnSetting'] as Array<
    'refresh' | 'density' | 'columnSetting'
  >,
}));

const statusOptions = computed(() => [
  { label: $t('user.active'), value: 'active' },
  { label: $t('user.inactive'), value: 'inactive' },
]);

const genderOptions = computed(() => [
  { label: $t('user.male'), value: 'male' },
  { label: $t('user.female'), value: 'female' },
]);

const roleSelectOptions = computed(() => {
  return roleOptions.value.map((role) => ({
    label: role.name,
    value: role.id,
  }));
});

const genderValueEnum = computed<Record<string, { text: string; status?: string; color?: string }>>(
  () => ({
    male: { text: $t('user.male'), color: 'blue' },
    female: { text: $t('user.female'), color: 'magenta' },
  }),
);

const statusValueEnum = computed<Record<string, { text: string; status?: string; color?: string }>>(
  () => ({
    active: { text: $t('user.active'), status: 'success' },
    inactive: { text: $t('user.inactive'), status: 'default' },
  }),
);

const searchFormItems = computed<UniOption[]>(() => [
  { type: 'Input', field: 'username', label: () => $t('user.username') },
  { type: 'Input', field: 'email', label: () => $t('user.email') },
  {
    type: 'Select',
    field: 'status',
    label: () => $t('user.status'),
    options: { source: () => statusOptions.value },
  },
]);

const columns = computed((): ExtColumnsItem[] => [
  {
    field: 'username',
    label: () => $t('user.username'),
    columnProps: { width: 150, fixed: 'left' },
  },
  { field: 'realName', label: () => $t('user.realName'), columnProps: { width: 140 } },
  { field: 'email', label: () => $t('user.email'), columnProps: { width: 220 } },
  { field: 'phone', label: () => $t('user.phone'), columnProps: { width: 150 } },
  { field: 'roleNames', label: () => $t('user.role'), columnProps: { width: 220 } },
  {
    field: 'gender',
    label: () => $t('user.gender'),
    viewRender: ({ text }: { text: unknown }) =>
      h(ValueView, {
        value: text,
        type: 'tag',
        enum: genderValueEnum.value,
      }),
    columnProps: { width: 100 },
  },
  {
    field: 'status',
    label: () => $t('user.status'),
    viewRender: ({ text }: { text: unknown }) =>
      h(ValueView, {
        value: text,
        type: 'badge',
        enum: statusValueEnum.value,
      }),
    columnProps: { width: 120 },
  },
  {
    field: 'createdAt',
    label: () => $t('common.createTime'),
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
              handleEdit(record as unknown as User),
          },
          {
            label: $t('common.delete'),
            icon: () => h(DeleteOutlined),
            onClick: ({ record }: { record: Record<string, unknown> }) =>
              handleDelete(record as unknown as User),
            attrs: { danger: true },
          },
        ],
      }),
    columnProps: { width: 160, fixed: 'right' },
  },
]);

const formItems = computed<UniOption[]>(() => [
  {
    type: 'Input',
    field: 'username',
    label: () => $t('user.username'),
    required: true,
    rules: [
      { required: true, message: $t('user.usernameRequired') },
      { min: 3, max: 20, message: $t('user.usernameLength') },
    ],
    dynamicAttrs: () => ({
      disabled: Boolean(editingUserId.value),
    }),
  },
  { type: 'Input', field: 'realName', label: () => $t('user.realName'), required: true },
  {
    type: 'Input',
    field: 'email',
    label: () => $t('user.email'),
    required: true,
    rules: [
      { required: true, message: $t('user.emailRequired') },
      { type: 'email', message: $t('validation.email') },
    ],
  },
  {
    type: 'Input',
    field: 'phone',
    label: () => $t('user.phone'),
    rules: [{ pattern: /^1[3-9]\d{9}$/, message: $t('validation.phone') }],
  },
  {
    type: 'Select',
    field: 'gender',
    label: () => $t('user.gender'),
    options: { source: () => genderOptions.value },
  },
  {
    type: 'Switch',
    field: 'status',
    label: () => $t('user.status'),
    required: true,
    dynamicAttrs: () => ({
      checkedChildren: $t('user.active'),
      unCheckedChildren: $t('user.inactive'),
    }),
  },
  {
    type: 'Select',
    field: 'roleIds',
    label: () => $t('user.role'),
    options: { source: () => roleSelectOptions.value },
    rules: [
      {
        validator: (_context: unknown, value: unknown) =>
          Array.isArray(value) && value.length > 0 ? true : new Error($t('user.selectRole')),
      },
    ],
    dynamicAttrs: () => ({
      mode: 'multiple',
      allowClear: true,
    }),
  },
  {
    type: 'TextArea',
    field: 'bio',
    label: () => $t('user.bio'),
    span: 2 * 12,
    dynamicAttrs: () => ({
      rows: 3,
      maxLength: 200,
      showCount: true,
    }),
  },
]);

function createDefaultFormValues(): UserFormValues {
  return {
    username: '',
    realName: '',
    email: '',
    phone: '',
    gender: 'male',
    status: true,
    roleIds: [],
    bio: '',
  };
}

const formatRoleNames = (roles: Role[]) => {
  if (!roles || roles.length === 0) {
    return '-';
  }
  return roles.map((role) => role.name).join(', ');
};

const fetchTableData = async (params: Record<string, unknown>, config?: RequestConfig) => {
  const response = await usersApi.getUserList(
    {
      current: Number(params.current || 1),
      pageSize: Number(params.pageSize || 10),
      username: (params.username as string)?.trim() || undefined,
      email: (params.email as string)?.trim() || undefined,
      status: params.status as string,
    },
    config,
  );

  const list = response.list.map((item) => ({
    ...item,
    roleNames: formatRoleNames(item.roles),
  }));

  return {
    records: list,
    total: response.total,
    current: Number(params.current ?? 1),
    size: Number(params.pageSize ?? 10),
  };
};

const fetchRoleOptions = async () => {
  const response = await rolesApi.getRoleList({ current: 1, pageSize: 200 });
  roleOptions.value = response.list;
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

const handleEdit = (record: User) => {
  const statusStr = record.status || 'active';
  const initialValues: UserFormValues = {
    username: record.username,
    realName: record.realName,
    email: record.email,
    phone: record.phone,
    gender: record.gender || 'male',
    status: statusStr === 'active',
    roleIds: (record.roles || []).map((role) => role.id),
    bio: record.bio || '',
  };
  openEditForm(record, initialValues);
};

const handleCancel = () => {
  closeFormModal();
};

const handleDelete = async (record: User) => {
  Modal.confirm({
    title: $t('user.deleteUser'),
    content: $t('user.confirmDelete'),
    onOk: async () => {
      await usersApi.deleteUser(record.id);
      message.success($t('common.success'));
      refreshTable();
    },
  });
};

const handleSubmit = async (rawValues: Record<string, unknown>) => {
  const values = rawValues as UserFormValues;

  const selectedRoles = roleOptions.value.filter((role) => values.roleIds?.includes(role.id));

  const payload: UserInput = {
    username: values.username?.trim(),
    realName: values.realName?.trim(),
    email: values.email?.trim(),
    phone: values.phone?.trim(),
    gender: values.gender,
    status: values.status ? 'active' : 'inactive',
    bio: values.bio?.trim(),
    roles: selectedRoles,
  };

  submitting.value = true;
  try {
    if (editingUserId.value) {
      await usersApi.updateUser(editingUserId.value, payload);
      message.success($t('user.updateSuccess'));
      refreshTable();
    } else {
      await usersApi.createUser(payload);
      message.success($t('user.createSuccess'));
      reloadTable();
    }
    closeFormModal();
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await fetchRoleOptions();
});

// export user data
const handleExport = async () => {
  try {
    const response = await usersApi.getUserList({ current: 1, pageSize: 9999 });
    const list = response.list;
    exportToCSV(
      [
        { dataIndex: 'username', title: $t('user.username') },
        { dataIndex: 'realName', title: $t('user.realName') },
        { dataIndex: 'email', title: $t('user.email') },
        { dataIndex: 'phone', title: $t('user.phone') },
        {
          dataIndex: 'gender',
          title: $t('user.gender'),
          render: (text: unknown) =>
            ((v: unknown) => (v === 'male' ? $t('user.male') : $t('user.female')))(text),
        },
        {
          dataIndex: 'status',
          title: $t('user.status'),
          render: (text: unknown) =>
            ((v: unknown) => (v === 'active' ? $t('user.active') : $t('user.inactive')))(text),
        },
        {
          dataIndex: 'roles',
          title: $t('user.role'),
          render: (text, record) =>
            ((_: unknown, r: unknown) =>
              (((r as Record<string, unknown>).roles as Array<{ name: string }>) || [])
                .map((role) => role.name)
                .join(', '))(text, record),
        },
        { dataIndex: 'createdAt', title: $t('common.createTime') },
      ],
      list,
      `${$t('user.title')}_${new Date().toISOString().slice(0, 10)}`,
    );
    message.success($t('user.exportSuccess'));
  } catch {
    message.error($t('user.exportFailed'));
  }
};

// import user data
const handleImport = async (file: File) => {
  try {
    const rows = await parseCSV(file);
    if (rows.length < 2) {
      message.warning($t('user.importEmpty'));
      return false;
    }
    const header = rows[0];
    const usernameIdx = header.findIndex((title) => title.includes('Username') || title.includes('username'));
    const realNameIdx = header.findIndex((title) => title.includes('Name') || title.includes('name'));
    const emailIdx = header.findIndex((title) => title.includes('Email') || title.includes('email'));

    if (usernameIdx === -1 || realNameIdx === -1 || emailIdx === -1) {
      message.error($t('user.importFormatError'));
      return false;
    }

    const importTasks = rows
      .slice(1)
      .filter((row) => row[usernameIdx])
      .map((row) =>
        usersApi.createUser({
          username: row[usernameIdx],
          realName: row[realNameIdx] || '',
          email: row[emailIdx] || '',
          status: 'active',
        }),
      );
    const results = await Promise.allSettled(importTasks);
    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    message.success($t('user.importSuccess', { count: successCount }));
    refreshTable();
  } catch {
    message.error($t('user.importFailed'));
  }
  return false;
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
