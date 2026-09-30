<template>
  <div class="page-container">
    <SplitLayout :side-width="280">
      <template #side>
        <!-- dept tree -->
        <div class="dept-tree-header">
          <h3>{{ t('dept.organizationStructure') }}</h3>
          <a-button type="primary" size="small" @click="handleAdd(null)">
            <template #icon><PlusOutlined /></template>
            {{ t('common.add') }}
          </a-button>
        </div>
        <div class="dept-tree-search">
          <a-input-search
            v-model:value="searchText"
            :placeholder="t('dept.searchDept')"
            allow-clear
            @search="loadDeptTree"
          />
        </div>
        <div class="dept-tree-body">
          <a-tree
            v-if="treeData.length"
            :tree-data="treeData"
            :field-names="{ title: 'name', key: 'id', children: 'children' }"
            :selected-keys="selectedKeys"
            default-expand-all
            block-node
            @select="handleTreeSelect"
          >
            <template #title="{ name, status }">
              <div class="tree-node">
                <span class="tree-node-name">{{ name }}</span>
                <span v-if="status === 'disabled'" class="tree-node-badge">{{
                  t('dept.disabled')
                }}</span>
              </div>
            </template>
          </a-tree>
          <a-empty v-else :image="null" :description="t('common.noData')" />
        </div>
      </template>

      <template #main>
        <!-- dept detail -->
        <template v-if="selectedDept">
          <div class="dept-detail-header">
            <div class="dept-detail-title">
              <h3>{{ selectedDept.name }}</h3>
              <Status :value="selectedDept.status" :status-map="deptStatusMap" />
            </div>
            <a-space>
              <a-button type="primary" size="small" @click="handleAdd(selectedDept.id)">
                <template #icon><PlusOutlined /></template>
                {{ t('dept.addChildDept') }}
              </a-button>
              <a-button size="small" @click="handleEdit(selectedDept)">
                <template #icon><EditOutlined /></template>
                {{ t('common.edit') }}
              </a-button>
              <a-button size="small" danger @click="handleDelete(selectedDept)">
                <template #icon><DeleteOutlined /></template>
                {{ t('common.delete') }}
              </a-button>
            </a-space>
          </div>
          <SuperDetail
            :schema="{
              subItems: deptDescColumns,
              attrs: { column: 2, bordered: true, size: 'middle' },
            }"
            :data-source="deptDescData"
            class="dept-descriptions"
          />

          <!-- child dept list -->
          <div class="dept-children">
            <SuperTable
              ref="nativeTableRef1"
              :schema="{
                slots: { bodyCell: 'bodyCell' },
                columns: childColumns,
                apis: { query: loadChildDepts },
                params: nativeQuery1.params,
                pagination: false,
                indexColumn: false,
                title: {
                  title: `${t('dept.childDepts')} (${childDepts.length})`,
                }.title,
                attrs: {
                  onChange: nativeQuery1.onChange,
                  tableTools: undefined,
                  onReload: () => nativeTableRef1?.reload(),
                },
              }"
              :key="selectedDept.id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <Status :value="record.status" :status-map="deptStatusMap" />
                </template>
                <template v-if="column.key === 'action'">
                  <a-space :size="4">
                    <a-button type="link" size="small" @click="selectDept(record.id)">{{
                      t('common.view')
                    }}</a-button>
                    <a-button type="link" size="small" @click="handleEdit(record)">{{
                      t('common.edit')
                    }}</a-button>
                  </a-space>
                </template>
              </template>
            </SuperTable>
          </div>
        </template>
        <div v-else class="dept-detail-empty">
          <a-empty :description="t('dept.selectDeptNode')" />
        </div>
      </template>
    </SplitLayout>

    <!-- add/edit modal -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      :confirm-loading="submitting"
      :cancel-button-props="{ disabled: submitting }"
      :closable="!submitting"
      :mask-closable="!submitting"
      :keyboard="!submitting"
      :width="520"
    >
      <SuperForm @register="registerForm" style="margin-top: 16px" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { Department } from '@/types/dept';
import type { StatusMap } from '@/types/display';
import type { ExtColumnsItem } from 'superform-antdv';

import { PlusOutlined, EditOutlined, DeleteOutlined } from '@antdv-next/icons';
import { message, Modal } from 'antdv-next';
import { SuperForm, SuperDetail, useForm, SuperTable } from 'superform-antdv';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { getDeptTree, getDeptList, createDept, updateDept, deleteDept } from '@/api/facade/dept';
import Status from '@/components/Display/Status/index.vue';
import SplitLayout from '@/components/Layout/SplitLayout/index.vue';
const { t } = useI18n();

const deptStatusMap = computed<StatusMap>(() => ({
  enabled: { text: t('dept.enabled'), color: '#52c41a' },
  disabled: { text: t('dept.disabled'), color: '#bfbfbf' },
}));

const searchText = ref('');
const treeData = ref<Department[]>([]);
const flatList = ref<Department[]>([]);
const selectedKeys = ref<string[]>([]);

const selectedDept = computed(() => {
  if (!selectedKeys.value.length) return null;
  return flatList.value.find((d) => d.id === selectedKeys.value[0]) || null;
});

const childDepts = computed(() => {
  if (!selectedDept.value) return [];
  return flatList.value
    .filter((d) => d.parentId === selectedDept.value!.id)
    .toSorted((a, b) => a.sort - b.sort);
});

// 上级使用完整部门数据，并排除自身及子孙节点，避免搜索截断选项或形成循环。
const parentTreeData = computed(() => {
  const excluded = new Set<string>();
  function excludeBranch(id: string): void {
    if (excluded.has(id)) return;
    excluded.add(id);
    flatList.value.filter((dept) => dept.parentId === id).forEach((dept) => excludeBranch(dept.id));
  }
  if (form.value.id) excludeBranch(form.value.id);
  const nodes = new Map<string, Department>(
    flatList.value
      .filter((dept) => !excluded.has(dept.id))
      .map((dept) => [dept.id, { ...dept, children: [] }]),
  );
  const roots: Department[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children!.push(node);
    else roots.push(node);
  }
  return roots;
});

// modal
const modalVisible = ref(false);
const modalTitle = computed(() => (form.value.id ? t('dept.editDept') : t('dept.createDept')));
const form = ref<Partial<Department>>({
  name: '',
  parentId: null,
  leader: '',
  phone: '',
  email: '',
  sort: 0,
  status: 'enabled',
  remark: '',
});

const submitting = ref(false);
const [registerForm, deptForm] = useForm({
  dataSource: form,
  subSpan: 24,
  attrs: { labelCol: { span: 6 } },
  subItems: [
    { type: 'Hidden', field: 'id' },
    {
      type: 'TreeSelect',
      field: 'parentId',
      label: () => t('dept.parentDept'),
      dynamicAttrs: () => ({
        treeData: parentTreeData.value,
        fieldNames: { label: 'name', value: 'id', children: 'children' },
        placeholder: t('dept.noneTopLevelDept'),
        allowClear: true,
        treeDefaultExpandAll: true,
      }),
    },
    {
      type: 'Input',
      field: 'name',
      label: () => t('dept.deptName'),
      required: true,
      rules: { message: t('dept.pleaseEnterDeptName') },
      dynamicAttrs: () => ({ placeholder: t('dept.pleaseEnterDeptName') }),
    },
    { type: 'Input', field: 'leader', label: () => t('dept.leader') },
    { type: 'Input', field: 'phone', label: () => t('dept.phone') },
    { type: 'Input', field: 'email', label: () => t('dept.email'), rules: { type: 'email' } },
    {
      type: 'InputNumber',
      field: 'sort',
      label: () => t('dept.sort'),
      attrs: { min: 0, precision: 0, style: { width: '100%' } },
    },
    {
      type: 'RadioGroup',
      field: 'status',
      label: () => t('dept.status'),
      options: {
        source: () => [
          { label: t('dept.enabled'), value: 'enabled' },
          { label: t('dept.disabled'), value: 'disabled' },
        ],
      },
    },
    { type: 'TextArea', field: 'remark', label: () => t('dept.remark'), attrs: { rows: 3 } },
  ],
});

const childColumns = computed<ExtColumnsItem[]>(() => [
  { field: 'name', label: () => t('dept.deptName'), columnProps: { key: 'name' } },
  { field: 'leader', label: () => t('dept.leader'), columnProps: { key: 'leader', width: 100 } },
  { field: 'sort', label: () => t('dept.sort'), columnProps: { key: 'sort', width: 70 } },
  { field: 'status', label: () => t('dept.status'), columnProps: { key: 'status', width: 80 } },
  { field: 'action', label: () => t('common.actions'), columnProps: { key: 'action', width: 120 } },
]);

const deptDescColumns = computed<ExtColumnsItem[]>(() => [
  { field: 'name', label: () => t('dept.deptName') },
  { field: 'parentName', label: () => t('dept.parentDept') },
  { field: 'leader', label: () => t('dept.leader') },
  { field: 'phone', label: () => t('dept.phone') },
  { field: 'email', label: () => t('dept.email') },
  { field: 'sort', label: () => t('dept.sort') },
  { field: 'createTime', label: () => t('dept.createTime') },
  { field: 'updateTime', label: () => t('dept.updateTime') },
  { field: 'remark', label: () => t('dept.remark'), span: 2 },
]);

const deptDescData = computed(() => {
  if (!selectedDept.value) return {};
  return {
    ...selectedDept.value,
    parentName: getParentName(selectedDept.value.parentId),
  };
});

const getParentName = (parentId: string | null) => {
  if (!parentId) return t('dept.noneTopLevel');
  return flatList.value.find((d) => d.id === parentId)?.name || '-';
};

const selectDept = (id: string) => {
  selectedKeys.value = [id];
};

const loadChildDepts = async (params: Record<string, unknown>) => {
  return {
    records: childDepts.value,
    total: childDepts.value.length,
    current: Number(params.current ?? 1),
    size: Number(params.pageSize ?? 10),
  };
};

const loadDeptTree = async () => {
  try {
    const params: Record<string, unknown> = {};
    if (searchText.value) params.name = searchText.value;
    const [treeRes, listRes] = await Promise.all([getDeptTree(params), getDeptList()]);

    treeData.value = treeRes;

    flatList.value = listRes;

    if (!selectedKeys.value.length && treeData.value.length) {
      selectedKeys.value = [treeData.value[0].id];
    }
    await nativeTableRef1.value?.reload();
  } catch (error: unknown) {
    console.error(t('dept.loadDataFailed'), (error as Error).message);
  }
};

const handleTreeSelect = (keys: string[]) => {
  if (keys.length) selectedKeys.value = keys;
};

const handleAdd = (parentId: string | null) => {
  form.value = {
    name: '',
    parentId,
    leader: '',
    phone: '',
    email: '',
    sort: 0,
    status: 'enabled',
    remark: '',
  };
  modalVisible.value = true;
};

const handleEdit = (dept: Department) => {
  form.value = { ...dept };
  modalVisible.value = true;
};

const handleDelete = (dept: Department) => {
  const hasChildren = flatList.value.some((d) => d.parentId === dept.id);
  if (hasChildren) {
    message.warning(t('dept.hasChildrenWarning'));
    return;
  }
  Modal.confirm({
    title: t('dept.confirmDelete'),
    content: t('dept.confirmDeleteContent', { name: dept.name }),
    onOk: async () => {
      try {
        await deleteDept(dept.id);

        message.success(t('dept.deleteSuccess'));
        selectedKeys.value = [];
        loadDeptTree();
      } catch (_error: unknown) {
        // 校验由表单展示，请求错误由统一 Service Hooks 反馈。
      }
    },
  });
};

const handleSubmit = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const data: Partial<Department> = await deptForm.submit();
    // 清空上级表示顶级部门，只提交可编辑字段，避免把 children 等展示数据传回接口。
    const payload: Partial<Department> = {
      name: data.name?.trim(),
      parentId: data.parentId || null,
      leader: data.leader,
      phone: data.phone,
      email: data.email,
      sort: data.sort,
      status: data.status,
      remark: data.remark,
    };
    if (data.id) await updateDept(data.id, payload);
    else await createDept(payload);

    message.success(t(data.id ? 'dept.updateSuccess' : 'dept.createSuccess'));
    modalVisible.value = false;
    await loadDeptTree();
  } catch (error: unknown) {
    // 校验由表单展示，请求错误由统一 Service Hooks 反馈。
  } finally {
    submitting.value = false;
  }
};

// init
loadDeptTree();

const nativeTableRef1 = ref<{ reload: () => Promise<unknown> }>();
const nativeQuery1 = useTableParams(() => childColumns.value);

import { useTableParams } from '@/composables/useTableParams';
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
