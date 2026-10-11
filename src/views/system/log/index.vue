<template>
  <div class="page-container">
    <div class="log-container">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="operation" :tab="$t('log.operationLog')">
          <SuperTable @register="registerOperation" />
        </a-tab-pane>
        <a-tab-pane key="login" :tab="$t('log.loginLog')">
          <SuperTable @register="registerLogin" />
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExtColumnsItem } from 'superform-antdv';
import type { StatusMap } from '@/types/display';
import { Tag, message } from 'antdv-next';
import { SuperTable, useTable } from 'superform-antdv';
import { h, ref } from 'vue';
import { logApi } from '@/api/generated/admin/Log';
import Status from '@/components/Display/Status/index.vue';
import { $t } from '@/locales';
const activeTab = ref('operation');
const statusMap: StatusMap = {
  success: { text: $t('log.success'), color: '#52c41a' },
  fail: { text: $t('log.fail'), color: '#ff4d4f' }
};
const statusOptions = ['success', 'fail'].map((value) => ({ label: $t(`log.${value}`), value }));
const statusColumn: ExtColumnsItem = {
  type: 'Select',
  field: 'status',
  label: $t('common.status'),
  options: { source: statusOptions },
  viewRender: ({ text }) => h(Status, { value: text, statusMap }),
  columnProps: { width: 80 }
};
const actionColors: Record<string, string> = {
  login: 'blue',
  logout: 'default',
  create: 'green',
  update: 'orange',
  delete: 'red',
  export: 'purple',
  import: 'cyan',
  other: 'default'
};
const actionOptions = Object.keys(actionColors).map((value) => ({ label: $t(`log.actionTypes.${value}`), value }));
const moduleOptions = [
  'userManagement',
  'roleManagement',
  'menuManagement',
  'dictionary',
  'systemLogin',
  'profile',
  'dashboard'
].map((value) => ({ label: $t(`log.modules.${value}`), value }));
const operationColumns: ExtColumnsItem[] = [
  {
    type: 'Input',
    field: 'username',
    label: $t('log.operationUser'),
    columnProps: { width: 100 }
  },
  {
    type: 'Select',
    field: 'module',
    label: $t('log.operationModule'),
    options: { source: moduleOptions },
    tagViewer: false,
    columnProps: { width: 110 }
  },
  {
    type: 'Select',
    field: 'action',
    label: $t('log.operationType'),
    options: { source: actionOptions },
    columnProps: { width: 90 },
    viewRender: ({ text }) => h(Tag, { color: actionColors[text] }, () => actionOptions.find((option) => option.value === text)?.label || text)
  },
  {
    field: 'description',
    label: $t('log.operationDescription'),
    columnProps: { ellipsis: true }
  },
  { field: 'method', label: $t('log.requestMethod'), columnProps: { width: 90 } },
  { field: 'ip', label: $t('log.ipAddress'), columnProps: { width: 130 } },
  statusColumn,
  {
    field: 'duration',
    label: $t('log.duration'),
    columnProps: { width: 80 },
    viewRender: ({ text }) => h('span', { style: { color: text > 300 ? '#ff4d4f' : text > 100 ? '#faad14' : '#52c41a' } }, `${text}ms`)
  },
  { field: 'createTime', label: $t('log.operationTime'), columnProps: { width: 170 } },
];
const loginColumns: ExtColumnsItem[] = [
  { type: 'Input', field: 'username', label: $t('log.username'), columnProps: { width: 120 } },
  { type: 'Input', field: 'ip', label: $t('log.ipAddress'), columnProps: { width: 140 } },
  { field: 'browser', label: $t('log.browser'), columnProps: { width: 130 } },
  { field: 'os', label: $t('log.os'), columnProps: { width: 130 } },
  { ...statusColumn },
  { field: 'message', label: $t('log.message'), columnProps: { ellipsis: true } },
  { field: 'createTime', label: $t('log.loginTime'), columnProps: { width: 170 } },
];
const [registerOperation, operationTable] = useTable({
  title: $t('log.operationLog'),
  columns: operationColumns,
  indexColumn: false,
  searchForm: { subItems: ['username', 'module', 'action', 'status'], limit: 2 },
  apis: { query: logApi.getOperationLogList.bind(logApi) },
  attrs: {
    onReload: () => operationTable.reload(),
    pageTransform: ({ current, size }) => ({ page: current, pageSize: size }),
    resultTransform: (response) => ({
      records: response.list,
      total: response.total,
      current: response.current ?? response.page,
      size: response.pageSize
    })
  },
  buttons: {
    actions: [
      {
        label: $t('log.clearLog'),
        attrs: { danger: true },
        confirmText: $t('log.confirmClearOperation'),
        onClick: async () => {
          await logApi.clearOperationLog();
          message.success($t('log.clearSuccess'));
          await operationTable.query();
        }
      }
    ]
  },
});
const [registerLogin, loginTable] = useTable({
  title: $t('log.loginLog'),
  columns: loginColumns,
  indexColumn: false,
  searchForm: { subItems: ['username', 'ip', 'status'], limit: 2 },
  apis: { query: logApi.getLoginLogList.bind(logApi) },
  attrs: {
    onReload: () => loginTable.reload(),
    pageTransform: ({ current, size }) => ({ page: current, pageSize: size }),
    resultTransform: (response) => ({
      records: response.list,
      total: response.total,
      current: response.current ?? response.page,
      size: response.pageSize
    })
  },
  buttons: {
    actions: [
      {
        label: $t('log.clearLog'),
        attrs: { danger: true },
        confirmText: $t('log.confirmClearLogin'),
        onClick: async () => {
          await logApi.clearLoginLog();
          message.success($t('log.clearSuccess'));
          await loginTable.query();
        }
      }
    ]
  },
});
</script>

<style scoped lang="scss">
.log-container {
  background: var(--color-bg-container);
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.ant-tabs) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  :deep(.ant-tabs-content-holder) {
    flex: 1;
    min-height: 0;
  }

  :deep(.ant-tabs-content) {
    height: 100%;
  }

  :deep(.ant-tabs-tabpane) {
    height: 100%;
  }

  :deep(.ant-tabs-nav) {
    margin-bottom: 8px;
  }

  :deep(.ant-table-thead > tr > th),
  :deep(.ant-table-thead > tr > td) {
    background: var(--color-fill-quaternary);
  }
}
</style>
