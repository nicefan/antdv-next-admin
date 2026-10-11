<template>
  <div class="page-container">
    <div class="log-container">
      <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <a-tab-pane key="operation" :tab="t('log.operationLog')">
          <SuperTable
            ref="operationTableRef"
            :schema="{
              slots: { extra: 'extra', bodyCell: 'bodyCell' },
              columns: operationColumns,
              apis: { query: loadOperationLogs },
              searchForm: { subItems: operationSearchFormItems, limit: 2 },
              indexColumn: false,
              title: { title: t('log.operationLog') }.title,
              attrs: {
                pagination: {},
                filterSortTransform: nativeQuery1.filterSortTransform,
                tableTools: undefined,
                onReload: () => operationTableRef?.reload(),
              },
            }"
            :key="'operation-' + operationRefreshKey"
          >
            <template #extra>
              <a-button danger @click="handleClearOperationLog">
                <DeleteOutlined /> {{ t('log.clearLog') }}
              </a-button>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-tag :color="actionColorMap[record.action] || 'default'">
                  {{ t(`log.actionTypes.${record.action}`) || record.action }}
                </a-tag>
              </template>
              <template v-if="column.key === 'status'">
                <Status :value="record.status" :status-map="logStatusMap" />
              </template>
              <template v-if="column.key === 'duration'">
                <span
                  :style="{
                    color:
                      record.duration > 300
                        ? '#ff4d4f'
                        : record.duration > 100
                          ? '#faad14'
                          : '#52c41a',
                  }"
                >
                  {{ record.duration }}ms
                </span>
              </template>
            </template>
          </SuperTable>
        </a-tab-pane>

        <a-tab-pane key="login" :tab="t('log.loginLog')">
          <SuperTable
            ref="loginTableRef"
            :schema="{
              slots: { extra: 'extra', bodyCell: 'bodyCell' },
              columns: loginColumns,
              apis: { query: loadLoginLogs },
              searchForm: { subItems: loginSearchFormItems, limit: 2 },
              indexColumn: false,
              title: { title: t('log.loginLog') }.title,
              attrs: {
                pagination: {},
                filterSortTransform: nativeQuery2.filterSortTransform,
                tableTools: undefined,
                onReload: () => loginTableRef?.reload(),
              },
            }"
            :key="'login-' + loginRefreshKey"
          >
            <template #extra>
              <a-button danger @click="handleClearLoginLog">
                <DeleteOutlined /> {{ t('log.clearLog') }}
              </a-button>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Status :value="record.status" :status-map="logStatusMap" />
              </template>
            </template>
          </SuperTable>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusMap } from '@/types/display';
import type { UniOption, ExtColumnsItem } from 'superform-antdv';

import { DeleteOutlined } from '@antdv-next/icons';
import { message, Modal } from 'antdv-next';
import { SuperTable } from 'superform-antdv';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { logApi } from '@/api/generated/admin/Log';
import Status from '@/components/Display/Status/index.vue';
const { t } = useI18n();

const logStatusMap = computed<StatusMap>(() => ({
  success: { text: t('log.success'), color: '#52c41a' },
  fail: { text: t('log.fail'), color: '#ff4d4f' },
}));

const activeTab = ref('operation');
const operationRefreshKey = ref(0);
const loginRefreshKey = ref(0);

const actionColorMap: Record<string, string> = {
  login: 'blue',
  logout: 'default',
  create: 'green',
  update: 'orange',
  delete: 'red',
  export: 'purple',
  import: 'cyan',
  other: 'default',
};

// operation log search form items
const operationSearchFormItems = computed<UniOption[]>(() => [
  { type: 'Input', field: 'username', label: () => t('log.operationUser') },
  {
    type: 'Select',
    field: 'module',
    label: () => t('log.operationModule'),
    options: {
      source: () => [
        { label: t('log.modules.userManagement'), value: 'userManagement' },
        { label: t('log.modules.roleManagement'), value: 'roleManagement' },
        { label: t('log.modules.menuManagement'), value: 'menuManagement' },
        { label: t('log.modules.dictionary'), value: 'dictionary' },
        { label: t('log.modules.systemLogin'), value: 'systemLogin' },
        { label: t('log.modules.profile'), value: 'profile' },
        { label: t('log.modules.dashboard'), value: 'dashboard' },
      ],
    },
  },
  {
    type: 'Select',
    field: 'action',
    label: () => t('log.operationType'),
    options: {
      source: () => [
        { label: t('log.actionTypes.login'), value: 'login' },
        { label: t('log.actionTypes.logout'), value: 'logout' },
        { label: t('log.actionTypes.create'), value: 'create' },
        { label: t('log.actionTypes.update'), value: 'update' },
        { label: t('log.actionTypes.delete'), value: 'delete' },
        { label: t('log.actionTypes.export'), value: 'export' },
      ],
    },
  },
  {
    type: 'Select',
    field: 'status',
    label: () => t('common.status'),
    options: {
      source: () => [
        { label: t('log.success'), value: 'success' },
        { label: t('log.fail'), value: 'fail' },
      ],
    },
  },
]);

// operation log columns
const operationColumns = computed<ExtColumnsItem[]>(() => [
  {
    field: 'username',
    label: () => t('log.operationUser'),
    columnProps: { key: 'username', width: 100 },
  },
  {
    field: 'module',
    label: () => t('log.operationModule'),
    columnProps: { key: 'module', width: 110 },
  },
  {
    field: 'action',
    label: () => t('log.operationType'),
    columnProps: { key: 'action', width: 90 },
  },
  {
    field: 'description',
    label: () => t('log.operationDescription'),
    columnProps: { key: 'description', ellipsis: true },
  },
  {
    field: 'method',
    label: () => t('log.requestMethod'),
    columnProps: { key: 'method', width: 90 },
  },
  { field: 'ip', label: () => t('log.ipAddress'), columnProps: { key: 'ip', width: 130 } },
  { field: 'status', label: () => t('common.status'), columnProps: { key: 'status', width: 80 } },
  {
    field: 'duration',
    label: () => t('log.duration'),
    columnProps: { key: 'duration', width: 80 },
  },
  {
    field: 'createTime',
    label: () => t('log.operationTime'),
    columnProps: { key: 'createTime', width: 170 },
  },
]);

// login log search form items
const loginSearchFormItems = computed<UniOption[]>(() => [
  { type: 'Input', field: 'username', label: () => t('log.username') },
  { type: 'Input', field: 'ip', label: () => t('log.ipAddress') },
  {
    type: 'Select',
    field: 'status',
    label: () => t('common.status'),
    options: {
      source: () => [
        { label: t('log.success'), value: 'success' },
        { label: t('log.fail'), value: 'fail' },
      ],
    },
  },
]);

// login log columns
const loginColumns = computed<ExtColumnsItem[]>(() => [
  {
    field: 'username',
    label: () => t('log.username'),
    columnProps: { key: 'username', width: 120 },
  },
  { field: 'ip', label: () => t('log.ipAddress'), columnProps: { key: 'ip', width: 140 } },
  { field: 'browser', label: () => t('log.browser'), columnProps: { key: 'browser', width: 130 } },
  { field: 'os', label: () => t('log.os'), columnProps: { key: 'os', width: 130 } },
  { field: 'status', label: () => t('common.status'), columnProps: { key: 'status', width: 80 } },
  {
    field: 'message',
    label: () => t('log.message'),
    columnProps: { key: 'message', ellipsis: true },
  },
  {
    field: 'createTime',
    label: () => t('log.loginTime'),
    columnProps: { key: 'createTime', width: 170 },
  },
]);

const handleTabChange = () => {};

const loadOperationLogs = async (params: Record<string, unknown>, config?: RequestConfig) => {
  try {
    const response = await logApi.getOperationLogList(
      {
        username: params.username as string,
        module: params.module as string,
        action: params.action as string,
        status: params.status as string,
        page: params.current as number,
        pageSize: params.pageSize as number,
      },
      config,
    );

    return {
      records: response.list,
      total: response.total,
      current: Number(params.current ?? 1),
      size: Number(params.pageSize ?? 10),
    };
  } catch (error: unknown) {
    console.error(t('log.loadOperationLogFailed'), (error as Error).message);
  }
  return {
    records: [],
    total: 0,
    current: Number(params.current ?? 1),
    size: Number(params.pageSize ?? 10),
  };
};

const loadLoginLogs = async (params: Record<string, unknown>, config?: RequestConfig) => {
  try {
    const response = await logApi.getLoginLogList(
      {
        username: params.username as string,
        ip: params.ip as string,
        status: params.status as string,
        page: params.current as number,
        pageSize: params.pageSize as number,
      },
      config,
    );

    return {
      records: response.list,
      total: response.total,
      current: Number(params.current ?? 1),
      size: Number(params.pageSize ?? 10),
    };
  } catch (error: unknown) {
    console.error(t('log.loadLoginLogFailed'), (error as Error).message);
  }
  return {
    records: [],
    total: 0,
    current: Number(params.current ?? 1),
    size: Number(params.pageSize ?? 10),
  };
};

const handleClearOperationLog = () => {
  Modal.confirm({
    title: t('log.confirmClear'),
    content: t('log.confirmClearOperation'),
    okType: 'danger',
    onOk: async () => {
      try {
        await logApi.clearOperationLog();

        message.success(t('log.clearSuccess'));
        operationRefreshKey.value++;
      } catch (_error: unknown) {
        // 校验由表单展示，请求错误由统一 Service Hooks 反馈。
      }
    },
  });
};

const handleClearLoginLog = () => {
  Modal.confirm({
    title: t('log.confirmClear'),
    content: t('log.confirmClearLogin'),
    okType: 'danger',
    onOk: async () => {
      try {
        await logApi.clearLoginLog();

        message.success(t('log.clearSuccess'));
        loginRefreshKey.value++;
      } catch (_error: unknown) {
        // 校验由表单展示，请求错误由统一 Service Hooks 反馈。
      }
    },
  });
};

const nativeQuery1 = useTableParams(() => operationColumns.value);
const nativeQuery2 = useTableParams(() => loginColumns.value);

import { useTableParams } from '@/composables/useTableParams';

const operationTableRef = ref<{ reload: () => Promise<unknown> }>();
const loginTableRef = ref<{ reload: () => Promise<unknown> }>();
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
