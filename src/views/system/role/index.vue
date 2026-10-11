<template>
  <div class="page-container">
    <SuperTable @register="register" />
  </div>
</template>

<script setup lang="ts">
import type { Permission } from '@/types/auth';
import type { TreeSelectProps } from 'antdv-next';
import type { ExtColumnsItem } from 'superform-antdv';
import type { RoleEditorData } from '@/api/facade/systemRole';
import { Tag, message } from 'antdv-next';
import { SuperTable, useTable } from 'superform-antdv';
import { computed, h, onMounted, ref } from 'vue';
import { permissionsApi } from '@/api/generated/admin/Permission';
import { rolesApi } from '@/api/generated/admin/Role';
import { getRoleEditor, saveRoleEditor } from '@/api/facade/systemRole';
import { $t, getLocale } from '@/locales';
import { resolveLocalizedText } from '@/utils/localizedText';
import ValueView from '@/components/Display/ValueView.vue';
import { getPermissionTypePresentation } from './permissionTypePresentation';
type PermissionOption = {
  label: string;
  value: string;
  children?: PermissionOption[];
};
const permissionTree = ref<Permission[]>([]);
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
  const map = new Map<string,
  Permission>();
  const traverse = (nodes: Permission[]) => {
    nodes.forEach((node) => {
      map.set(node.id, {
        ...node,
        children: node.children ?[...node.children] : undefined,
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
  return h('span',{
    style: {
      alignItems:'center',
      display:'inline-flex',
      gap:'8px',
    },
  },[
    h('span', title),
    h(
    Tag,{
      class:'permission-type-tag',
      color: presentation.color,
      style: { marginInlineEnd: 0 },
    },() => $t(presentation.labelKey),),
  ],);
};
const columns: ExtColumnsItem[] = [
  { type: 'Hidden', field: 'id' },
  {
    type: 'Input',
    field: 'name',
    label: $t('role.name'),
    required: true,
    columnProps: { width: 200 }
  },
  {
    type: 'Input',
    field: 'code',
    label: $t('role.code'),
    required: true,
    disabled: ({ formData }) => Boolean(formData?.id),
    rules: { pattern: /^[a-zA-Z0-9_.-]+$/, message: $t('role.codePattern') },
    columnProps: { width: 200 }
  },
  {
    type: 'TextArea',
    field: 'description',
    label: $t('role.description'),
    span: 24,
    attrs: { rows: 3 }
  },
  {
    type: 'TreeSelect',
    field: 'permissionIds',
    label: $t('role.permissions'),
    initialValue: [],
    span: 24,
    options: { source: permissionOptions },
    rules: {
      validator: (_context, value) => Array.isArray(value) && value.length > 0 || new Error($t('role.selectPermissions'))
    },
    attrs: {
      class: 'permission-role-tree-select',
      treeCheckable: true,
      allowClear: true,
      treeDefaultExpandAll: true,
      showCheckedStrategy:'SHOW_PARENT',
      maxTagCount: 2,
      treeTitleRender: renderPermissionTreeTitle
    },
    viewRender: ({ record }) => record.permissions?.length || 0,
    columnProps: { width: 120 }
  },
  {
    field: 'updatedAt',
    label: $t('common.updateTime'),
    exclude: ['form'],
    viewRender: ({ text }) => h(ValueView, { value: text, type: 'dateTime' }),
    columnProps: { width: 200 }
  },
];
async function save(data: RoleEditorData) {
  const result = await saveRoleEditor(data, permissionMap.value);
  message.success($t(data.id ? 'role.updateSuccess' : 'role.createSuccess'));
  return result;
}
const [register, table] = useTable({
  title: $t('role.title'),
  columns,
  indexColumn: false,
  searchForm: { subItems: ['name', 'code'] },
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
  beforeQuery: (params) => ({ ...params, name: params.name?.trim() || undefined, code: params.code?.trim() || undefined }),
  apis: {
    query: rolesApi.getRoleList.bind(rolesApi),
    info: getRoleEditor,
    save,
    update: save,
    delete: async (keys: string[]) => {
      await Promise.all(keys.map((id) => rolesApi.deleteRole(id)));
      message.success($t('common.success'));
    }
  },
  buttons: { actions: [{ name: 'add', label: $t('role.createRole') }] },
  rowButtons: { actions: ['edit', { name: 'delete', confirmText: $t('role.confirmDelete') }] },
  rowEditor: {
    addMode: 'modal',
    editMode: 'modal',
    modalProps: { width: 820 },
    form: { subSpan: 12, attrs: { layout: 'vertical' } }
  },
});
onMounted(async () => { permissionTree.value = await permissionsApi.getPermissionTree();
});
</script>

<style>
.permission-role-tree-select .ant-select-selection-item .permission-type-tag {
  display: none;
}
</style>
