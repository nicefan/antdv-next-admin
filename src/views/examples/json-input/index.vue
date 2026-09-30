<template>
  <div class="page-container">
    <div class="card">
      <h2>JsonInput {{ $t('common.component') || 'Component' }}</h2>
      <p class="mb-lg">
        {{ $t('examples.jsonInput.description') }}
      </p>

      <a-divider orientation="left">{{ $t('common.basicUsage') }}</a-divider>

      <SuperForm @register="registerEditorForm">
        <template #formSection2>
          <a-divider orientation="left">{{ $t('common.advancedUsage') }}</a-divider>
        </template>
      </SuperForm>

      <a-divider orientation="left">{{ $t('common.preview') }}</a-divider>

      <a-card title="Data Preview" size="small">
        <pre class="json-preview">{{ JSON.stringify(formState, null, 2) }}</pre>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SuperForm, useForm } from 'superform-antdv';
import { reactive } from 'vue';

import { $t as translate } from '@/locales';

const formState = reactive({
  userConfig: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 28,
    isActive: true,
    tags: ['developer', 'admin'],
    address: '123 Main St, City',
  },
  productInfo: {
    name: 'MacBook Pro',
    price: 1999,
    stock: 50,
    description: 'High-performance laptop for professionals',
  },
  i18nConfig: {
    name: '张三',
    email: 'zhangsan@example.com',
    age: 30,
    department: '技术部',
    position: '高级工程师',
  },
  systemConfig: {
    id: 'sys-001',
    apiKey: 'sk-1234567890abcdef',
    endpoint: 'https://api.example.com',
    timeout: 30,
  },
  nestedData: {
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    settings: {
      theme: 'dark',
      language: 'zh-CN',
    },
  },
  newConfig: null as Record<string, unknown> | null,
});
// 自定义编辑器保留值协议和预览，表单布局交由 SuperForm。
const [registerEditorForm] = useForm({
  dataSource: formState,
  subSpan: 24,
  attrs: { layout: 'vertical' },
  subItems: [
    {
      type: 'JsonInput',
      field: 'userConfig',
      label: () => translate('examples.jsonInput.userConfig'),
      dynamicAttrs: () => ({
        fieldConfig: {
          address: { component: 'textarea', maxLength: 500 },
        },
        placeholder: translate('examples.jsonInput.clickToEdit'),
        modalTitle: translate('examples.jsonInput.editUserConfig'),
      }),
    },
    {
      type: 'JsonInput',
      field: 'productInfo',
      label: () => translate('examples.jsonInput.displayValue'),
      dynamicAttrs: () => ({
        displayKey: 'name',
        fieldConfig: {
          description: { component: 'textarea', maxLength: 500 },
        },
        placeholder: translate('examples.jsonInput.selectProduct'),
      }),
    },
    { type: 'InfoSlot', block: true, render: 'formSection2' },
    {
      type: 'JsonInput',
      field: 'i18nConfig',
      label: () => translate('examples.jsonInput.withI18nKeys'),
      dynamicAttrs: () => ({
        labelMap: {
          name: translate('user.username'),
          email: translate('user.email'),
          age: translate('user.age'),
          department: translate('user.department'),
          position: translate('user.position'),
        },
        placeholder: translate('examples.jsonInput.clickToEdit'),
      }),
    },
    {
      type: 'JsonInput',
      field: 'systemConfig',
      label: () => translate('examples.jsonInput.withDisabledFields'),
      dynamicAttrs: () => ({
        disabledFields: ['id', 'apiKey'],
        placeholder: translate('examples.jsonInput.systemConfig'),
      }),
    },
    {
      type: 'JsonInput',
      field: 'nestedData',
      label: () => translate('examples.jsonInput.nestedObject'),
      dynamicAttrs: () => ({ placeholder: translate('examples.jsonInput.nestedData') }),
    },
    {
      type: 'JsonInput',
      field: 'newConfig',
      label: () => translate('examples.jsonInput.emptyObject'),
      dynamicAttrs: () => ({ placeholder: translate('examples.jsonInput.createNew') }),
    },
  ],
});
</script>

<style scoped lang="scss">
.page-container {
  padding: 0;
}

.card {
  background: var(--color-bg-container);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.mb-lg {
  margin-bottom: 24px;
}

.json-preview {
  background: var(--color-bg-layout);
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  font-size: 12px;
}

.hint {
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

:deep(.ant-divider) {
  margin: 24px 0;
}
</style>
