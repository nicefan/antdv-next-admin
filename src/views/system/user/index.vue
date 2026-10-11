<template>
  <div class="page-container">
    <SuperTable @register="register" />
  </div>
</template>

<script setup lang="ts">
import type { Role } from '@/types/auth';
import type { ExtColumnsItem } from 'superform-antdv';
import type { UserEditorData } from '@/api/facade/systemUser';
import { message } from 'antdv-next';
import { SuperTable, useTable, useModalForm } from 'superform-antdv';
import { onMounted, ref, h } from 'vue';
import { rolesApi } from '@/api/generated/admin/Role';
import { usersApi } from '@/api/generated/admin/User';
import { getUserEditor, saveUserEditor } from '@/api/facade/systemUser';
import ValueView from '@/components/Display/ValueView.vue';
import { $t } from '@/locales';
import { exportToCSV, parseCSV } from '@/utils/export';
const roles = ref<Role[]>([]);
const statusOptions = [
  { label: $t('user.inactive'), value: 'inactive' },
  { label: $t('user.active'), value: 'active' },
];
const genderOptions = [
  { label: $t('user.male'), value: 'male' },
  { label: $t('user.female'), value: 'female' },
];
const statusEnum = {
  active: { text: $t('user.active'), status: 'success' },
  inactive: { text: $t('user.inactive'), status: 'default' },
};
const columns: ExtColumnsItem[] = [
  { type: 'Hidden', field: 'id' },
  {
    type: 'Input',
    field: 'username',
    label: $t('user.username'),
    required: true,
    rules: { min: 3, max: 20, message: $t('user.usernameLength') },
    disabled: ({ formData }) => Boolean(formData?.id),
    columnProps: { width: 150, fixed: 'left' }
  },
  {
    type: 'Input',
    field: 'realName',
    label: $t('user.realName'),
    required: true,
    columnProps: { width: 140 }
  },
  {
    type: 'Input',
    field: 'email',
    label: $t('user.email'),
    required: true,
    rules: { type: 'email', message: $t('validation.email') },
    columnProps: { width: 220 }
  },
  {
    type: 'Input',
    field: 'phone',
    label: $t('user.phone'),
    rules: { pattern: /^1[3-9]\d{9}$/, message: $t('validation.phone') },
    columnProps: { width: 150 }
  },
  {
    type: 'Select',
    field: 'roleIds',
    label: $t('user.role'),
    initialValue: [],
    options: { source: roles, fieldNames: { label: 'name', value: 'id' } },
    attrs: { mode: 'multiple', allowClear: true },
    rules: {
      validator: (_context, value) => Array.isArray(value) && value.length > 0 || new Error($t('user.selectRole'))
    },
    viewRender: ({ record }) => record.roles?.map((role: Role) => role.name).join(', ') || '-',
    columnProps: { width: 220 }
  },
  {
    type: 'Select',
    field: 'gender',
    label: $t('user.gender'),
    initialValue: 'male',
    options: { source: genderOptions },
    columnProps: { width: 100 }
  },
  {
    type: 'Switch',
    field: 'status',
    label: $t('user.status'),
    initialValue: 'active',
    options: { source: statusOptions },
    viewRender: ({ text }) => h(ValueView, { value: text, type: 'badge', enum: statusEnum }),
    columnProps: { width: 120 }
  },
  {
    type: 'TextArea',
    field: 'bio',
    label: $t('user.bio'),
    exclude: ['table'],
    span: 24,
    attrs: { rows: 3, maxLength: 200, showCount: true }
  },
  {
    field: 'createdAt',
    label: $t('common.createTime'),
    exclude: ['form'],
    viewRender: ({ text }) => h(ValueView, { value: text, type: 'dateTime' }),
    columnProps: { width: 200 }
  },
];
async function save(data: UserEditorData) {
  const result = await saveUserEditor(data, roles.value);
  message.success($t(data.id ? 'user.updateSuccess' : 'user.createSuccess'));
  return result;
}
const [register, table] = useTable({
  title: $t('user.title'),
  columns,
  indexColumn: false,
  attrs: {
    rowKey: 'id',
    onReload: () => table.reload(),
    resultTransform: (response) => ({
      records: response.list,
      total: response.total,
      current: response.current ?? response.page,
      size: response.pageSize
    })
  },
  searchForm: {
    subItems: [
      'username',
      'email',
      {
        type: 'Select',
        field: 'status',
        label: $t('user.status'),
        options: { source: statusOptions }
      }
    ],
    limit: 2
  },
  beforeQuery: (params) => ({
    ...params,
    username: params.username?.trim() || undefined,
    email: params.email?.trim() || undefined
  }),
  apis: {
    query: usersApi.getUserList.bind(usersApi),
    info: getUserEditor,
    save,
    update: save,
    delete: async (keys: string[]) => {
      await Promise.all(keys.map((id) => usersApi.deleteUser(id)));
      message.success($t('common.success'));
    },
  },
  buttons: {
    actions: [
      { label: $t('common.import'), onClick: () => importModal.openModal() },
      { label: $t('common.export'), onClick: handleExport },
      { name: 'add', label: $t('user.createUser') },
    ]
  },
  rowButtons: { actions: ['edit', { name: 'delete', confirmText: $t('user.confirmDelete') }] },
  rowEditor: {
    addMode: 'modal',
    editMode: 'modal',
    modalProps: { width: 760 },
    form: { subSpan: 12, attrs: { layout: 'vertical' } }
  },
});
const importModal = useModalForm({
  subItems: [
    {
      type: 'Upload',
      field: 'csv',
      required: true,
      attrs: { uploadMode: 'custom', isSingle: true, accept: '.csv' }
    },
  ]
}, { title: $t('common.import'), onOk: async (data) => handleImport(data.csv.file) });
onMounted(async () => { roles.value = (await rolesApi.getRoleList({ current: 1, pageSize: 200 })).list;
});
async function handleExport() {
  const response = await usersApi.getUserList({ ...table.getQueryParams(), current: 1, pageSize: 9999 });
  exportToCSV([
    { dataIndex: 'username', title: $t('user.username') },
    { dataIndex: 'realName', title: $t('user.realName') },
    { dataIndex: 'email', title: $t('user.email') },
    { dataIndex: 'phone', title: $t('user.phone') },
    {
      dataIndex: 'gender',
      title: $t('user.gender'),
      render: (text) => genderOptions.find((option) => option.value === text)?.label || ''
    },
    {
      dataIndex: 'status',
      title: $t('user.status'),
      render: (text) => statusOptions.find((option) => option.value === text)?.label || ''
    },
    {
      dataIndex: 'roles',
      title: $t('user.role'),
      render: (_text, record) => ((record as { roles: Role[] }).roles).map((role) => role.name).join(', ')
    },
    { dataIndex: 'createdAt', title: $t('common.createTime') },
  ], response.list, `${$t('user.title')}_${new Date().toISOString().slice(0, 10)}`);
  message.success($t('user.exportSuccess'));
}
async function handleImport(file: File) {
  const rows = await parseCSV(file);
  if (rows.length < 2) { message.warning($t('user.importEmpty'));
  return false;
  }
  const header = rows[0].map((title) => title.trim());
  const findColumn =(field: string, label: string) => header.findIndex((title) => title.toLowerCase() === field.toLowerCase() || title === label);
  const usernameIndex = findColumn('username', $t('user.username'));
  const nameIndex = findColumn('name', $t('user.realName'));
  const emailIndex = findColumn('email', $t('user.email'));
  if ([usernameIndex, nameIndex, emailIndex].includes(-1)) { message.error($t('user.importFormatError'));
  return false;
  }
  const results = await Promise.allSettled(rows.slice(1).filter((row) => row[usernameIndex]).map((row) => usersApi.createUser({
    username: row[usernameIndex],
    realName: row[nameIndex] || '',
    email: row[emailIndex] || '',
    status: 'active',
  })));
  message.success($t('user.importSuccess', { count: results.filter((result) => result.status === 'fulfilled').length }));
  await table.reload();
}
</script>
