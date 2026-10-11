<template>
  <div class="page-container">
    <SuperTable @register="register" />
  </div>
</template>

<script setup lang="ts">
import type { Permission } from '@/types/auth';
import type { ExtColumnsItem } from 'superform-antdv';
import type { PermissionEditorData } from '@/api/facade/systemPermission';
import { Alert, message } from 'antdv-next';
import { SuperTable, useTable } from 'superform-antdv';
import { ref, h } from 'vue';
import { permissionsApi } from '@/api/generated/admin/Permission';
import { getPermissionEditor, localizedPermissionName, savePermissionEditor } from '@/api/facade/systemPermission';
import ValueView from '@/components/Display/ValueView.vue';
import { $t, getLocale } from '@/locales';
import { useSettingsStore } from '@/stores/settings';
import { renderIcon } from '@/utils/icon';
import { resolveLocalizedText } from '@/utils/localizedText';
const localized = useSettingsStore().showLanguageSwitch;
const componentOptions = Object.keys(import.meta.glob('/src/views/**/*.vue'))
.map((path) => path.replace(/^\/src\/views\//, '').replace(/\.vue$/, '')).sort()
.map((value) => ({ label: value, value }));
const typeOptions = ['menu', 'button', 'api'].map((value) => ({ label: $t(`permission.${value}`), value }));
const statusOptions = [
  { label: $t('user.inactive'), value: 'inactive' },
  { label: $t('user.active'), value: 'active' }
];
const statusEnum = {
  active: { text: $t('user.active'), status: 'success' },
  inactive: { text: $t('user.inactive'), status: 'default' }
};
const expandPreference = ref(true);
function findParentName(nodes: Permission[], id: string): string {
  for (const node of nodes) {
    if (node.id === id) return resolveLocalizedText(node.name, getLocale());
    const name = node.children ? findParentName(node.children, id) : '';
    if (name) return name;
  }
  return '';
}
const columns: ExtColumnsItem[] = [
  { type: 'Hidden', field: 'id' },
  { type: 'Hidden', field: 'parentId' },
  {
    type: 'InfoSlot',
    block: true,
    exclude: ['table', 'description'],
    hidden: ({ formData }) => !formData?.parentId,
    render: ({ formData }) => h(Alert, {
      type: 'info',
      showIcon: true,
      message: `${$t('permission.parentMenu')}：${findParentName(table.getData() || [], formData.parentId) || '-'}`,
    }),
  },
  {
    type: 'Input',
    field: 'keyword',
    label: $t('common.search'),
    exclude: ['table', 'form', 'description']
  },
  {
    type: localized ? 'I18nInput' : 'Input',
    field: 'name',
    label: $t('permission.name'),
    required: true,
    initialValue: localized ? localizedPermissionName('') : '',
    viewRender: ({ text }) => resolveLocalizedText(text, getLocale()),
    columnProps: { width: 220, fixed: 'left' }
  },
  {
    type: 'Input',
    field: 'code',
    label: $t('permission.code'),
    required: true,
    disabled: ({ formData }) => Boolean(formData?.id),
    rules: { pattern: /^[a-zA-Z0-9_.-]+$/, message: $t('permission.codePattern') },
    columnProps: { width: 220 }
  },
  {
    type: 'Select',
    field: 'type',
    label: $t('permission.type'),
    required: true,
    initialValue: 'menu',
    options: { source: typeOptions },
    columnProps: { width: 120 }
  },
  {
    type: 'Input',
    field: 'path',
    label: $t('permission.routePath'),
    hidden: ({ formData }) => Boolean(formData && formData.type !== 'menu'),
    rules: {
      validator: ({ formData }, value) => formData.type !== 'menu' || Boolean(String(value || '').trim()) || new Error($t('permission.menuRouteRequired'))
    },
    columnProps: { width: 170 }
  },
  {
    type: 'Select',
    field: 'component',
    label: $t('permission.componentPath'),
    hidden: ({ formData }) => Boolean(formData && formData.type !== 'menu'),
    options: { source: componentOptions },
    attrs: { showSearch: true },
    tagViewer: false,
    columnProps: { width: 220 }
  },
  {
    type: 'IconPicker',
    field: 'icon',
    label: $t('permission.icon'),
    hidden: ({ formData }) => Boolean(formData && formData.type !== 'menu'),
    attrs: { onlineLimit: 160 },
    viewRender: ({ text }) => renderIcon(text) || '-',
    columnProps: { width: 80, align: 'center' }
  },
  {
    type: 'InputNumber',
    field: 'sort',
    label: $t('permission.sort'),
    initialValue: 0,
    hidden: ({ formData }) => Boolean(formData && formData.type !== 'menu'),
    attrs: { min: 0 },
    columnProps: { width: 90 }
  },
  {
    type: 'Switch',
    field: 'status',
    label: $t('common.status'),
    initialValue: 'active',
    options: { source: statusOptions },
    viewRender: ({ text }) => h(ValueView, { value: text, type: 'badge', enum: statusEnum }),
    columnProps: { width: 120 }
  },
  {
    type: 'Switch',
    field: 'visible',
    label: $t('permission.visibleStatus'),
    initialValue: true,
    options: {
      source: [{ label: $t('permission.hide'), value: false }, { label: $t('permission.show'), value: true }]
    },
    columnProps: { width: 100 }
  },
  {
    type: 'TextArea',
    field: 'description',
    label: $t('role.description'),
    span: 24,
    exclude: ['table'],
    attrs: { rows: 3 }
  },
];
async function save(data: PermissionEditorData) {
  const result = await savePermissionEditor(data);
  message.success($t(data.id ? 'permission.updateSuccess' : 'permission.createSuccess'));
  return result;
}
const [register, table] = useTable({
  title: $t('permission.title'),
  columns,
  indexColumn: false,
  attrs: {
    rowKey: 'id',
    onReload: () => table.reload(),
    pagination: false,
    childrenColumnName: 'children',
    expandable: { expandIconColumnIndex: 0 },
    defaultExpandLevel: 'all',
    onExpandedRowsChange: () => { expandPreference.value = false;
    }
  },
  searchForm: {
    subItems: [
      'keyword',
      {
        type: 'Select',
        field: 'type',
        label: $t('permission.type'),
        options: { source: typeOptions }
      },
      {
        type: 'Select',
        field: 'status',
        label: $t('common.status'),
        options: { source: statusOptions }
      }
    ]
  },
  onLoaded: async () => { if (expandPreference.value) await table.expandAll();
  },
  beforeQuery: (params) => ({ ...params, keyword: params.keyword?.trim() || undefined }),
  apis: {
    query: permissionsApi.getPermissionList.bind(permissionsApi),
    info: (id: string) => getPermissionEditor(id, localized),
    save,
    update: save,
    delete: async (keys: string[]) => {
      await Promise.all(keys.map((id) => permissionsApi.deletePermission(id)));
      message.success($t('common.success'));
    }
  },
  buttons: {
    actions: [
      { name: 'add', label: $t('permission.createPermission') },
      {
        label: $t('permission.expandAll'),
        onClick: () => { expandPreference.value = true;
        return table.expandAll();
        }
      },
      {
        label: $t('permission.collapseAll'),
        onClick: () => { expandPreference.value = false;
        return table.setExpandedRowKeys([]);
        }
      },
    ]
  },
  rowButtons: {
    actions: [
      'edit',
      { name: 'delete', confirmText: $t('permission.confirmDelete') },
      {
        label: $t('permission.addChild'),
        hidden: ({ record }) => record.type !== 'menu',
        onClick: ({ record }) => table.add({
          resetData: { parentId: record.id, type: 'menu' },
          meta: { title: $t('permission.createChildMenu') }
        })
      }
    ],
    columnProps: { width: 260, fixed: 'right' }
  },
  rowEditor: {
    addMode: 'modal',
    editMode: 'modal',
    modalProps: { width: 820 },
    form: { subSpan: 12, attrs: { layout: 'vertical' } }
  },
});
</script>
