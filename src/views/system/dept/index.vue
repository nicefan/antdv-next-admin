<template>
  <div class="page-container">
    <SplitLayout :side-width="280">
      <template #side>
        <div class="dept-tree-header">
          <h3>{{ $t('dept.organizationStructure') }}</h3>
          <SuperButtons :actions="rootAddActions" />
        </div>
        <div class="dept-tree-search">
          <SuperForm @register="registerSearch" />
        </div>
        <div class="dept-tree-body">
          <a-tree v-if="treeData.length" :tree-data="treeData" :field-names="{ title: 'name', key: 'id', children: 'children' }" :selected-keys="selectedKeys" default-expand-all block-node @select="handleTreeSelect">
            <template #title="{ name, status }">
              <div class="tree-node">
                <span class="tree-node-name">{{ name }}</span>
                <span v-if="status === 'disabled'" class="tree-node-badge">{{ $t('dept.disabled') }}</span>
              </div>
            </template>
          </a-tree>
          <a-empty v-else :image="null" :description="$t('common.noData')" />
        </div>
      </template>
      <template #main>
        <template v-if="selectedDept">
          <div class="dept-detail-header">
            <div class="dept-detail-title">
              <h3>{{ selectedDept.name }}</h3>
              <Status :value="selectedDept.status" :status-map="statusMap" />
            </div>
            <SuperButtons :actions="headerActions" :effect-data="{ record: selectedDept }" :button-props="{ size: 'small' }" />
          </div>
          <SuperDetail :schema="detailSchema" :data-source="selectedDept" class="dept-descriptions" />
        </template>
        <div v-show="selectedDept" class="dept-children">
          <SuperTable @register="register" />
        </div>
        <div v-if="!selectedDept" class="dept-detail-empty">
          <a-empty :description="$t('dept.selectDeptNode')" />
        </div>
      </template>
    </SplitLayout>
  </div>
</template>

<script setup lang="ts">
import type { Department } from '@/types/dept';
import type { DepartmentInput } from '@/api/generated/admin/data-contracts';
import type { StatusMap } from '@/types/display';
import type { ExtColumnsItem, ExtDescriptionsOption, ButtonItem } from 'superform-antdv';
import { message } from 'antdv-next';
import { SuperForm, SuperDetail, SuperTable, SuperButtons, useForm, useTable } from 'superform-antdv';
import { ref, computed, h, onMounted } from 'vue';
import { getDeptTree, getDeptList, getDeptChildren, saveDeptEditor, deleteDept } from '@/api/facade/dept';
import Status from '@/components/Display/Status/index.vue';
import SplitLayout from '@/components/Layout/SplitLayout/index.vue';
import { $t } from '@/locales';
const statusOptions = [
  { label: $t('dept.enabled'), value: 'enabled' },
  { label: $t('dept.disabled'), value: 'disabled' }
];
const statusMap: StatusMap = {
  enabled: { text: $t('dept.enabled'), color: '#52c41a' },
  disabled: { text: $t('dept.disabled'), color: '#bfbfbf' }
};
const searchText = ref('');
const treeData = ref<Department[]>([]);
const flatList = ref<Department[]>([]);
const selectedKeys = ref<string[]>([]);
const selectedDept = computed(() => flatList.value.find((dept) => dept.id === selectedKeys.value[0]) || null);
const selectedId = computed(() => selectedDept.value?.id || null);
const childCount = computed(() => flatList.value.filter((dept) => dept.parentId === selectedId.value).length);
async function loadDeptTree() {
  const [tree, list] = await Promise.all([getDeptTree({ name: searchText.value.trim() || undefined }), getDeptList()]);
  treeData.value = tree;
  flatList.value = list;
  if (!list.some((dept) => dept.id === selectedKeys.value[0])) selectedKeys.value = tree[0] ? [tree[0].id] : [];
}
function handleTreeSelect(keys: string[]) { if (keys.length) selectedKeys.value = keys;
}// 父级选项排除当前部门及其子孙节点，避免移动部门时形成循环。
function getParentOptions(id?: string) {
  const excluded = new Set<string>();
  function excludeBranch(key: string) {
    if (excluded.has(key)) return;
    excluded.add(key);
    flatList.value.filter((dept) => dept.parentId === key).forEach((dept) => excludeBranch(dept.id));
  }
  if (id) excludeBranch(id);
  const nodes = new Map<string,
  Department>(flatList.value.filter((dept) => !excluded.has(dept.id)).map((dept) => [dept.id, { ...dept, children: [] }]));
  const roots: Department[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children?.push(node);
    else roots.push(node);
  }
  return roots;
}
const [registerSearch] = useForm({
  subSpan: 24,
  subItems: [
    {
      type: 'InputSearch',
      field: 'name',
      value: searchText,
      attrs: {
        placeholder: $t('dept.searchDept'),
        allowClear: true,
        onSearch: () => { void loadDeptTree().catch(console.error);
        }
      }
    },
  ]
});
const columns: ExtColumnsItem[] = [
  { type: 'Hidden', field: 'id' },
  { type: 'Input', field: 'name', label: $t('dept.deptName'), required: true },
  {
    type: 'TreeSelect',
    field: 'parentId',
    label: $t('dept.parentDept'),
    initialValue: null,
    exclude: ['table'],
    options: {
      source: ({ formData }) => getParentOptions(formData?.id),
      fieldNames: { label: 'name', value: 'id', children: 'children' }
    },
    attrs: { placeholder: $t('dept.noneTopLevelDept'), allowClear: true, treeDefaultExpandAll: true },
    viewRender: ({ text }) => text ? flatList.value.find((dept) => dept.id === text)?.name || '-' : $t('dept.noneTopLevel')
  },
  { type: 'Input', field: 'leader', label: $t('dept.leader'), columnProps: { width: 100 } },
  { type: 'Input', field: 'phone', label: $t('dept.phone'), exclude: ['table'] },
  {
    type: 'Input',
    field: 'email',
    label: $t('dept.email'),
    rules: { type: 'email' },
    exclude: ['table']
  },
  {
    type: 'InputNumber',
    field: 'sort',
    label: $t('dept.sort'),
    initialValue: 0,
    attrs: { min: 0, precision: 0 },
    columnProps: { width: 70 }
  },
  {
    type: 'RadioGroup',
    field: 'status',
    label: $t('dept.status'),
    initialValue: 'enabled',
    options: { source: statusOptions },
    viewRender: ({ text }) => h(Status, { value: text, statusMap }),
    columnProps: { width: 90 }
  },
  { field: 'createTime', label: $t('dept.createTime'), exclude: ['table', 'form'] },
  { field: 'updateTime', label: $t('dept.updateTime'), exclude: ['table', 'form'] },
  {
    type: 'TextArea',
    field: 'remark',
    label: $t('dept.remark'),
    attrs: { rows: 3 },
    span: 24,
    exclude: ['table']
  },
];
const detailSchema: ExtDescriptionsOption = { subItems: columns, attrs: { column: 2, bordered: true, size: 'middle' } };
function refreshOrganization() { void loadDeptTree().catch(console.error);
}
async function save(data: DepartmentInput & { id?: string }) {
  const result = await saveDeptEditor(data);
  message.success($t(data.id ? 'dept.updateSuccess' : 'dept.createSuccess'));
  refreshOrganization();
  return result;
}
const [register, table] = useTable({
  title: () => `${$t('dept.childDepts')} (${childCount.value})`,
  columns,
  indexColumn: false,
  params: { parentId: selectedId },
  attrs: { rowKey: 'id', onReload: () => table.reload(), pagination: false },
  apis: {
    query: getDeptChildren,
    save,
    update: save,
    delete: async (keys: string[]) => {
      if (flatList.value.some((dept) => dept.parentId && keys.includes(dept.parentId))) throw new Error($t('dept.hasChildrenWarning'));
      await Promise.all(keys.map((id) => deleteDept(id)));
      message.success($t('dept.deleteSuccess'));
      refreshOrganization();
    }
  },
  rowButtons: {
    actions: [
      { label: $t('common.view'), onClick: ({ record }) => { selectedKeys.value = [record.id];
      } },
      'edit',
    ]
  },
  rowEditor: {
    addMode: 'modal',
    editMode: 'modal',
    modalProps: { width: 520 },
    form: { subSpan: 24, attrs: { labelCol: { span: 6 } } }
  },
});
const rootAddActions: ButtonItem[] = [{ label: $t('common.add'), onClick: () => table.add({ resetData: { parentId: null } }) }];
const headerActions: ButtonItem[] = [
  {
    name: 'add',
    label: $t('dept.addChildDept'),
    onClick: ({ record }) => table.add({ resetData: { parentId: record.id } })
  },
  { name: 'edit', onClick: ({ record }) => table.edit({ record }) },
  {
    name: 'delete',
    confirmText: ({ record }) => $t('dept.confirmDeleteContent', { name: record.name }),
    onClick: async ({ record }) => {
      if (flatList.value.some((dept) => dept.parentId === record.id)) { message.warning($t('dept.hasChildrenWarning'));
      return false;
      }
      await table.setSelectedRows([record]);
      return table.delete();
    }
  },
];
onMounted(() => { void loadDeptTree().catch(console.error);
});
</script>

<style scoped lang="scss">
// dept tree content
.dept-tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
  }
}

.dept-tree-search {
  margin-bottom: 12px;
}

.dept-tree-body {
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  :deep(.ant-tree-node-content-wrapper) {
    flex: 1;
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: 8px;

    .tree-node-name {
      flex: 1;
    }

    .tree-node-badge {
      font-size: 11px;
      padding: 0 6px;
      border-radius: 8px;
      background: #fff1f0;
      color: #cf1322;
      line-height: 18px;
    }
  }
}

// dept detail content
.dept-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border-secondary, #f0f0f0);

  .dept-detail-title {
    display: flex;
    align-items: center;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }
  }
}

.dept-descriptions {
  margin-bottom: 24px;
}

.dept-children {
  :deep(.ant-table-thead > tr > th) {
    background: var(--color-fill-quaternary);
  }
}

.dept-detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
