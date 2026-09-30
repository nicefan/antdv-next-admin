<template>
  <div class="page-container">
    <SuperTable @register="registerTable">
      <template #title>
        <div class="table-heading">
          <span>{{ $t('exampleTable.userList') }}</span>
          <small>{{ $t('exampleTable.subTitle') }}</small>
          <div ref="toolbarTarget" class="table-toolbar-target" />
        </div>
      </template>
    </SuperTable>
  </div>
</template>

<script setup lang="ts">
import type { User } from '@/api/generated/admin/data-contracts';
import type { ExtColumnsItem, UniOption } from 'superform-antdv';

import { ReloadOutlined } from '@antdv-next/icons';
import { message, Switch } from 'antdv-next';
import { SuperTable, useTable } from 'superform-antdv';
import { computed, h, reactive, shallowRef } from 'vue';

import { userTableApi } from '@/api/facade/userTable';
import ValueView from '@/components/Display/ValueView.vue';
import { useTableParams } from '@/composables/useTableParams';
import { $t } from '@/locales';
import { commonRules } from '@/utils/formRules';

const genderOptions = computed(() => [
  { label: $t('user.male'), value: 'male' },
  { label: $t('user.female'), value: 'female' },
]);
// Switch 直接绑定业务字符串，回填与提交无需维护第二套布尔状态。
const statusOptions = computed(() => [
  { label: $t('user.inactive'), value: 'inactive' },
  { label: $t('user.active'), value: 'active' },
]);
const pendingStatus = reactive(new Set<string>());

const columns: ExtColumnsItem[] = [
  { type: 'Hidden', field: 'id' },
  {
    type: 'Input',
    field: 'username',
    label: () => $t('user.username'),
    columnProps: {
      width: 180,
      fixed: 'left',
      headerFilter: {
        type: 'keyword',
        mode: 'server',
        get placeholder() {
          return $t('proForm.enterPlaceholder', { label: $t('user.username') });
        },
      },
    },
  },
  {
    type: 'Input',
    field: 'email',
    label: () => $t('user.email'),
    viewRender: ({ text }: { text: unknown }) => h(ValueView, { value: text, copyable: true }),
    columnProps: { width: 240 },
  },
  { field: 'realName', label: () => $t('user.realName'), columnProps: { width: 200 } },
  { field: 'phone', label: () => $t('user.phone'), columnProps: { width: 150 } },
  {
    type: 'Select',
    field: 'gender',
    label: () => $t('user.gender'),
    options: { source: genderOptions },
    columnProps: { width: 90 },
  },
  {
    field: 'status',
    label: () => $t('common.status'),
    // 即时状态操作独立于弹窗编辑，保留业务交互并阻止同一行重复写入。
    viewRender: ({ record }: { record: User }) =>
      h(Switch, {
        checked: record.status === 'active',
        checkedChildren: $t('user.active'),
        unCheckedChildren: $t('user.inactive'),
        loading: pendingStatus.has(record.id),
        disabled: pendingStatus.has(record.id),
        onChange: (checked) => changeStatus(record, Boolean(checked)),
      }),
    columnProps: {
      width: 130,
      headerFilter: {
        type: 'select',
        mode: 'server',
        get options() {
          return statusOptions.value;
        },
      },
    },
  },
  {
    field: 'createdAt',
    label: () => $t('common.createTime'),
    viewRender: ({ text }: { text: unknown }) => h(ValueView, { value: text, type: 'dateTime' }),
    columnProps: { width: 190 },
  },
];

const formItems: UniOption[] = [
  { type: 'Hidden', field: 'id' },
  {
    type: 'Input',
    field: 'username',
    label: () => $t('user.username'),
    required: true,
    rules: [commonRules.length(3, 20), commonRules.username()],
  },
  {
    type: 'Input',
    field: 'email',
    label: () => $t('user.email'),
    required: true,
    rules: commonRules.email(),
  },
  { type: 'Input', field: 'realName', label: () => $t('user.realName'), required: true },
  { type: 'Input', field: 'phone', label: () => $t('user.phone'), rules: commonRules.phone() },
  {
    type: 'Select',
    field: 'gender',
    label: () => $t('user.gender'),
    required: true,
    initialValue: 'male',
    options: { source: genderOptions },
  },
  {
    type: 'Switch',
    field: 'status',
    label: () => $t('common.status'),
    required: true,
    initialValue: 'active',
    options: { source: statusOptions },
  },
  {
    type: 'TextArea',
    field: 'bio',
    label: () => $t('user.bio'),
    span: 24,
    attrs: { rows: 4, maxLength: 200, showCount: true },
  },
];

const headerQuery = useTableParams(() => columns);
const toolbarTarget = shallowRef<HTMLElement | null>(null);
// 注册一次稳定 Schema，弹窗与行状态变化不再重新初始化查询和分页。
const [registerTable, table] = useTable({
  isContainer: true,
  maxHeight: 'viewport',
  fixedHeight: true,
  heightOffset: 20,
  columns,
  slots: { title: 'title' },
  params: headerQuery.params,
  indexColumn: false,
  columnProps: { ellipsis: true },
  attrs: {
    rowKey: 'id',
    scroll: { x: 1400 },
    tableTools: ['density', 'columnSetting'],
    toolbarTarget,
    onFilterChange: headerQuery.onFilterChange,
    onSortChange: headerQuery.onSortChange,
  },
  searchForm: {
    // 查询仅使用实际接口支持的字段；表头筛选负责用户名、状态，避免参数同名覆盖。
    subSpan: 8,
    subItems: [
      'email',
      {
        type: 'Select',
        field: 'gender',
        label: () => $t('user.gender'),
        attrs: { mode: 'multiple' },
        options: { source: genderOptions },
      },
    ],
  },
  buttons: {
    actions: [
      { name: 'add', label: () => $t('exampleTable.createUser') },
      {
        label: () => $t('common.refresh'),
        icon: () => h(ReloadOutlined),
        onClick: () => table.reload(),
      },
    ],
  },
  rowButtons: {
    actions: [
      { name: 'edit', label: () => $t('common.edit') },
      {
        name: 'delete',
        label: () => $t('common.delete'),
        confirmText: () => $t('user.confirmDelete'),
        attrs: { danger: true },
      },
    ],
    columnProps: { title: () => $t('common.actions'), width: 190, fixed: 'right' },
  },
  rowEditor: {
    addMode: 'modal',
    editMode: 'modal',
    form: { subSpan: 12, attrs: { layout: 'vertical' }, subItems: formItems },
    modalProps: {
      width: 600,
      title: ({ meta }: { meta: { isNew: boolean } }) =>
        $t(meta.isNew ? 'exampleTable.createUser' : 'exampleTable.editUser'),
    },
  },
  apis: {
    query: userTableApi.query,
    info: userTableApi.info,
    async save(data) {
      await userTableApi.save(data);
      message.success($t('exampleTable.createSuccess'));
    },
    async update(data) {
      await userTableApi.update(data);
      message.success($t('exampleTable.updateSuccess'));
    },
    async delete(keys) {
      await userTableApi.delete(keys);
      message.success($t('exampleTable.deleteSuccess'));
    },
  },
});

async function changeStatus(record: User, checked: boolean) {
  if (pendingStatus.has(record.id)) return;
  pendingStatus.add(record.id);
  try {
    await userTableApi.update({ ...record, status: checked ? 'active' : 'inactive' });
    message.success($t('exampleTable.updateSuccess'));
    await table.reload();
  } catch {
    // 接口失败由服务层反馈，不改变当前行，也不重复提示。
  } finally {
    pendingStatus.delete(record.id);
  }
}
</script>

<style scoped>
:deep(.sup-title) {
  flex: 1 1 auto !important;
  min-width: 0;
}
:deep(.sup-title-buttons) {
  flex: 0 0 auto !important;
}
:deep(.table-heading) {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.table-toolbar-target {
  margin-left: auto;
  flex-shrink: 0;
}
:deep(.table-heading small) {
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: normal;
}
</style>
