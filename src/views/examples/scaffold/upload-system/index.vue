<template>
  <div class="page-container">
    <div class="card">
      <h2>{{ $t('examples.scaffold.uploadSystem.title') }}</h2>
      <p class="text-secondary mb-lg">
        {{ $t('examples.scaffold.uploadSystem.description') }}
      </p>

      <a-space wrap class="mb-md">
        <a-tag color="processing"
          >{{ $t('examples.scaffold.uploadSystem.uploading') }} {{ uploadingCount }}</a-tag
        >
        <a-tag color="success"
          >{{ $t('examples.scaffold.uploadSystem.success') }} {{ doneCount }}</a-tag
        >
        <a-tag color="error"
          >{{ $t('examples.scaffold.uploadSystem.failed') }} {{ errorCount }}</a-tag
        >
      </a-space>

      <SuperForm @register="registerUploadForm" />

      <div class="toolbar">
        <a-space>
          <a-button :disabled="uploadingCount > 0 || fileList.length === 0" @click="retryFailed">{{
            $t(errorCount ? 'examples.scaffold.uploadSystem.retryButton' : 'common.submit')
          }}</a-button>
          <a-button danger :disabled="fileList.length === 0" @click="clearAll">{{
            $t('examples.scaffold.uploadSystem.clearButton')
          }}</a-button>
        </a-space>
        <div class="text-secondary">
          {{ $t('examples.scaffold.uploadSystem.failureRate') }}{{ Math.round(failureRate * 100) }}%
        </div>
      </div>

      <a-slider v-model:value="failureRate" :min="0" :max="0.9" :step="0.05" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'antdv-next';
import { SuperForm, useForm, type UIUploadFile } from 'superform-antdv';
import { computed, ref } from 'vue';

import { uploadDemoFile } from '@/api/facade/demo';
import { $t } from '@/locales';

const fileList = ref<UIUploadFile[]>([]);
const failureRate = ref(0.25);

const uploadingCount = computed(
  () => fileList.value.filter((item) => item.status === 'uploading').length,
);
const doneCount = computed(() => fileList.value.filter((item) => item.status === 'done').length);
const errorCount = computed(() => fileList.value.filter((item) => item.status === 'error').length);

// 上传、失败重试及提交等待统一交给 SuperForm 的 Upload 字段。
const [registerUploadForm, uploadForm] = useForm({
  subSpan: 24,
  subItems: [
    {
      type: 'Upload',
      field: 'files',
      attrs: {
        dragger: true,
        class: 'upload-system-dragger',
        accept: '.png,.jpg,.jpeg,.pdf,.csv',
        multiple: true,
        uploadMode: 'submit',
        title: () => $t('examples.scaffold.uploadSystem.dragText'),
        tip: $t('examples.scaffold.uploadSystem.dragHint'),
        onChange: ({ fileList: files }: { fileList: UIUploadFile[] }) => {
          fileList.value = files;
        },
        apis: {
          upload: (data: FormData, config: RequestConfig) =>
            uploadDemoFile(data, config, failureRate.value),
        },
      },
    },
  ],
});
const retryFailed = async () => {
  try {
    await uploadForm.submit();
    message.success($t('common.success'));
  } catch (error) {
    message.error((error as { message?: string }).message || $t('common.error'));
  }
};
const clearAll = async () => {
  await uploadForm.resetFields();
  fileList.value = [];
};
</script>

<style scoped lang="scss">
.mb-lg {
  margin-bottom: var(--spacing-lg);
}

.mb-md {
  margin-bottom: var(--spacing-md);
}

.toolbar {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

:deep(.upload-system-dragger.ant-upload-wrapper .ant-upload-drag) {
  height: 220px;
  min-height: 220px;
  background: var(--color-bg-layout);
}

:deep(.upload-system-dragger.ant-upload-wrapper .ant-upload-drag .ant-upload) {
  height: 100%;
  padding: 16px;
  background: transparent;
}

:deep(.upload-system-dragger.ant-upload-wrapper .ant-upload-drag .ant-upload-btn) {
  background: transparent;
}

:deep(.upload-system-dragger.ant-upload-wrapper .ant-upload-list) {
  margin-top: 10px;
}

.preview-image {
  width: 100%;
  max-height: 72vh;
  object-fit: contain;
  border-radius: 8px;
}
</style>
