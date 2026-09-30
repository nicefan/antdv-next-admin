<template>
  <div class="page-container">
    <div class="card">
      <h2>I18nInput {{ $t('common.component') }}</h2>
      <p class="mb-lg">
        {{ $t('examples.i18nInput.description') }}
      </p>

      <a-divider orientation="left">{{ $t('common.basicUsage') }}</a-divider>

      <SuperForm @register="registerEditorForm">
        <template #formSection2>
          <a-divider orientation="left">{{ $t('common.advancedUsage') }}</a-divider>
        </template>
      </SuperForm>

      <a-divider orientation="left">{{ $t('common.preview') }}</a-divider>

      <a-card :title="$t('examples.i18nInput.dataPreview')" size="small">
        <pre class="json-preview">{{ JSON.stringify(formState, null, 2) }}</pre>
      </a-card>

      <a-divider orientation="left">{{ $t('examples.i18nInput.valueType') }}</a-divider>

      <a-space>
        <a-button @click="toggleValueType">
          {{
            showAsString
              ? $t('examples.i18nInput.showAsObject')
              : $t('examples.i18nInput.showAsString')
          }}
        </a-button>
      </a-space>

      <div v-if="showAsString" class="value-preview">
        <h4>{{ $t('examples.i18nInput.stringValue') }}</h4>
        <pre>{{ JSON.stringify(formState.productName) }}</pre>
      </div>
      <div v-else class="value-preview">
        <h4>{{ $t('examples.i18nInput.objectValue') }}</h4>
        <pre>{{ formState.productName }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SuperForm, useForm } from 'superform-antdv';
import { reactive, ref } from 'vue';

import { $t as translate } from '@/locales';

const formState = reactive({
  productName: {
    'zh-CN': '苹果手机',
    'en-US': 'iPhone',
    'ja-JP': 'iPhone',
    'ko-KR': '아이폰',
  },
  productDescription: {
    'zh-CN': '这是最新款的智能手机，拥有强大的性能和优秀的拍照功能。',
    'en-US':
      'This is the latest smartphone with powerful performance and excellent camera capabilities.',
    'ja-JP': 'これは最新のスマートフォンで、強力な性能と優れたカメラ機能を備えています。',
    'ko-KR': '강력한 성능과 뛰어난 카메라 기능을 갖춘 최신 스마트폰입니다.',
  },
  stringFormat:
    '{"zh-CN": "字符串格式", "en-US": "String Format", "ja-JP": "文字列形式", "ko-KR": "문자열 형식"}',
  withLocale: {
    'zh-CN': '指定显示日语',
    'en-US': 'Show Japanese value',
    'ja-JP': '日本語表示を指定',
    'ko-KR': '일본어 표시 지정',
  },
  emptyValue: undefined as Record<string, string> | string | undefined,
});

const showAsString = ref(false);

function toggleValueType() {
  showAsString.value = !showAsString.value;
}
// 自定义编辑器保留值协议和预览，表单布局交由 SuperForm。
const [registerEditorForm] = useForm({
  dataSource: formState,
  subSpan: 24,
  attrs: { layout: 'vertical' },
  subItems: [
    {
      type: 'I18nInput',
      field: 'productName',
      label: () => translate('examples.i18nInput.productName'),
      dynamicAttrs: () => ({
        placeholder: translate('examples.i18nInput.clickToEdit'),
        modalTitle: translate('examples.i18nInput.editProductName'),
      }),
    },
    {
      type: 'I18nInput',
      field: 'productDescription',
      label: () => translate('examples.i18nInput.productDescription'),
      dynamicAttrs: () => ({
        placeholder: translate('examples.i18nInput.clickToEdit'),
        modalTitle: translate('examples.i18nInput.editProductDesc'),
      }),
    },
    { type: 'InfoSlot', block: true, render: 'formSection2' },
    {
      type: 'I18nInput',
      field: 'stringFormat',
      label: () => translate('examples.i18nInput.stringFormat'),
      dynamicAttrs: () => ({ placeholder: translate('examples.i18nInput.clickToEdit') }),
    },
    {
      type: 'I18nInput',
      field: 'withLocale',
      label: () => translate('examples.i18nInput.currentLocale'),
      dynamicAttrs: () => ({
        locale: 'ja-JP',
        placeholder: translate('examples.i18nInput.clickToEdit'),
      }),
    },
    {
      type: 'I18nInput',
      field: 'emptyValue',
      label: () => translate('examples.i18nInput.emptyValue'),
      dynamicAttrs: () => ({ placeholder: translate('examples.i18nInput.clickToEdit') }),
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

.hint {
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.json-preview {
  background: var(--color-bg-layout);
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  font-size: 12px;
}

.value-preview {
  margin-top: 16px;
  padding: 16px;
  background: var(--color-bg-layout);
  border-radius: 4px;

  h4 {
    margin-bottom: 8px;
    color: var(--color-text-secondary);
  }

  pre {
    font-family: monospace;
    font-size: 12px;
    overflow-x: auto;
  }
}

:deep(.ant-divider) {
  margin: 24px 0;
}
</style>
