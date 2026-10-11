<template>
  <div class="page-container">
    <SuperTable
      ref="nativeTableRef1"
      :schema="{
        slots: { bodyCell: 'bodyCell' },
        columns: columns,
        apis: { query: loadFileList },
        searchForm: { subItems: searchFormItems, limit: 2 },
        indexColumn: false,
        title: {
          title: t('file.title'),
          actions: [],
        }.title,
        attrs: {
          pagination: {},
          filterSortTransform: nativeQuery1.filterSortTransform,
          tableTools: undefined,
          onReload: () => nativeTableRef1?.reload(),
        },
      }"
      :key="refreshKey"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'originalName'">
          <div class="file-name">
            <span class="file-icon" :style="{ color: getExtColor(record.ext) }">
              <FileImageOutlined v-if="isImage(record.ext)" />
              <VideoCameraOutlined v-else-if="isVideo(record.ext)" />
              <FilePdfOutlined v-else-if="record.ext === 'pdf'" />
              <FileExcelOutlined v-else-if="['xlsx', 'xls'].includes(record.ext)" />
              <FileWordOutlined v-else-if="['docx', 'doc'].includes(record.ext)" />
              <FilePptOutlined v-else-if="['pptx', 'ppt'].includes(record.ext)" />
              <FileZipOutlined v-else-if="['zip', 'rar', '7z'].includes(record.ext)" />
              <FileTextOutlined v-else />
            </span>
            <span>{{ record.originalName }}</span>
          </div>
        </template>
        <template v-if="column.key === 'size'">
          {{ formatSize(record.size) }}
        </template>
        <template v-if="column.key === 'storage'">
          <a-tag :color="storageColor[record.storage]">{{
            t(`file.storageType.${record.storage}`)
          }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space :size="4">
            <a-button type="link" size="small" danger @click="handleDelete(record)">
              <template #icon><DeleteOutlined /></template>
              {{ t('file.delete') }}
            </a-button>
          </a-space>
        </template>
      </template>
    </SuperTable>
  </div>
</template>

<script setup lang="ts">
import type { SysFile } from '@/types/file';
import type { UniOption, ExtColumnsItem } from 'superform-antdv';

import {
  DeleteOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileZipOutlined,
  FileTextOutlined,
} from '@antdv-next/icons';
import { message, Modal } from 'antdv-next';
import { SuperTable } from 'superform-antdv';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { fileApi } from '@/api/generated/admin/File';
const { t } = useI18n();
const refreshKey = ref(0);

const storageColor: Record<string, string> = {
  local: 'default',
  oss: 'blue',
  cos: 'green',
};

const isImage = (ext: string) => ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
const isVideo = (ext: string) => ['mp4', 'avi', 'mov', 'wmv'].includes(ext);

const getExtColor = (ext: string) => {
  const colors: Record<string, string> = {
    jpg: '#f5222d',
    jpeg: '#f5222d',
    png: '#fa541c',
    gif: '#fa8c16',
    svg: '#a0d911',
    pdf: '#cf1322',
    docx: '#1677ff',
    doc: '#1677ff',
    xlsx: '#52c41a',
    xls: '#52c41a',
    pptx: '#fa541c',
    ppt: '#fa541c',
    zip: '#faad14',
    rar: '#faad14',
    mp4: '#722ed1',
    txt: '#8c8c8c',
  };
  return colors[ext] || '#8c8c8c';
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

const searchFormItems = computed<UniOption[]>(() => [
  { type: 'Input', field: 'originalName', label: () => t('file.fileName') },
  {
    type: 'Select',
    field: 'ext',
    label: () => t('file.ext'),
    options: {
      source: () => [
        { label: t('file.extType.imageJpg'), value: 'jpg' },
        { label: t('file.extType.imagePng'), value: 'png' },
        { label: t('file.extType.pdf'), value: 'pdf' },
        { label: t('file.extType.word'), value: 'docx' },
        { label: t('file.extType.excel'), value: 'xlsx' },
        { label: t('file.extType.zip'), value: 'zip' },
        { label: t('file.extType.video'), value: 'mp4' },
        { label: t('file.extType.text'), value: 'txt' },
        { label: t('file.extType.ppt'), value: 'pptx' },
        { label: t('file.extType.svg'), value: 'svg' },
      ],
    },
  },
  {
    type: 'Select',
    field: 'storage',
    label: () => t('file.storage'),
    options: {
      source: () => [
        { label: t('file.storageType.local'), value: 'local' },
        { label: t('file.storageType.oss'), value: 'oss' },
        { label: t('file.storageType.cos'), value: 'cos' },
      ],
    },
  },
]);

const columns = computed<ExtColumnsItem[]>(() => [
  {
    field: 'originalName',
    label: () => t('file.fileName'),
    columnProps: { key: 'originalName', ellipsis: true },
  },
  { field: 'ext', label: () => t('file.ext'), columnProps: { key: 'ext', width: 90 } },
  { field: 'size', label: () => t('file.size'), columnProps: { key: 'size', width: 120 } },
  { field: 'storage', label: () => t('file.storage'), columnProps: { key: 'storage', width: 100 } },
  {
    field: 'uploader',
    label: () => t('file.uploader'),
    columnProps: { key: 'uploader', width: 100 },
  },
  {
    field: 'createTime',
    label: () => t('file.uploadTime'),
    columnProps: { key: 'createTime', width: 180 },
  },
  {
    field: 'action',
    label: () => t('file.action'),
    columnProps: { key: 'action', width: 100, fixed: 'right' },
  },
]);

const loadFileList = async (params: Record<string, unknown>, config?: RequestConfig) => {
  try {
    const response = await fileApi.getFileList(
      {
        name: params.originalName as string,
        ext: params.ext as string,
        storage: params.storage as string,
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
    console.error(t('file.loadFailed'), (error as Error).message);
  }
  return {
    records: [],
    total: 0,
    current: Number(params.current ?? 1),
    size: Number(params.pageSize ?? 10),
  };
};

const handleDelete = (record: SysFile) => {
  Modal.confirm({
    title: t('file.confirmDelete'),
    content: t('file.confirmDeleteContent', { name: record.originalName }),
    onOk: async () => {
      try {
        await fileApi.deleteFile(record.id);

        message.success(t('file.deleteSuccess'));
        refreshKey.value++;
      } catch (_error: unknown) {
        // 校验由表单展示，请求错误由统一 Service Hooks 反馈。
      }
    },
  });
};

const nativeTableRef1 = ref<{ reload: () => Promise<unknown> }>();
const nativeQuery1 = useTableParams(() => columns.value);

import { useTableParams } from '@/composables/useTableParams';
</script>

<style scoped lang="scss">
.file-name {
  display: flex;
  align-items: center;
  gap: 8px;

  .file-icon {
    font-size: 18px;
    flex-shrink: 0;
  }
}
</style>
