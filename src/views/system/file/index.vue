<template>
  <div class="page-container">
    <SuperTable @register="register" />
  </div>
</template>

<script setup lang="ts">
import type { ExtColumnsItem } from 'superform-antdv';
import {
  FileImageOutlined,
  VideoCameraOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileZipOutlined,
  FileTextOutlined
} from '@antdv-next/icons';
import { Tag, message } from 'antdv-next';
import { SuperTable, useTable } from 'superform-antdv';
import { h } from 'vue';
import { fileApi } from '@/api/generated/admin/File';
import { $t } from '@/locales';
const isImage =(ext: string) => ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
const isVideo =(ext: string) => ['mp4', 'avi', 'mov', 'wmv'].includes(ext);
const getExtColor =(ext: string) => {
  const colors: Record<string,
  string> = {
    jpg:'#f5222d',
    jpeg:'#f5222d',
    png:'#fa541c',
    gif:'#fa8c16',
    svg:'#a0d911',
    pdf:'#cf1322',
    docx:'#1677ff',
    doc:'#1677ff',
    xlsx:'#52c41a',
    xls:'#52c41a',
    pptx:'#fa541c',
    ppt:'#fa541c',
    zip:'#faad14',
    rar:'#faad14',
    mp4:'#722ed1',
    txt:'#8c8c8c',
  };
  return colors[ext] || '#8c8c8c';
};
const formatSize =(bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return(bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};
const storageColors: Record<string, string> = { local: 'default', oss: 'blue', cos: 'green' };
const storageOptions = ['local', 'oss', 'cos'].map((value) => ({ label: $t(`file.storageType.${value}`), value }));
const extOptions = [
  ['jpg', 'imageJpg'],
  ['png', 'imagePng'],
  ['pdf', 'pdf'],
  ['docx', 'word'],
  ['xlsx', 'excel'],
  ['zip', 'zip'],
  ['mp4', 'video'],
  ['txt', 'text'],
  ['pptx', 'ppt'],
  ['svg', 'svg'],
].map(([value, label]) => ({ value, label: $t(`file.extType.${label}`) }));
const columns: ExtColumnsItem[] = [
  {
    type: 'Input',
    field: 'originalName',
    label: $t('file.fileName'),
    columnProps: { ellipsis: true },
    viewRender: ({ record, text }) => {
      const ext = record.ext;
      const icon = isImage(ext) ? FileImageOutlined : isVideo(ext) ? VideoCameraOutlined : ext === 'pdf' ? FilePdfOutlined
      :['xlsx', 'xls'].includes(ext) ? FileExcelOutlined : ['docx', 'doc'].includes(ext) ? FileWordOutlined
      :['pptx', 'ppt'].includes(ext) ? FilePptOutlined : ['zip', 'rar', '7z'].includes(ext) ? FileZipOutlined : FileTextOutlined;
      return h('div', { class: 'file-name' }, [
        h('span', { class: 'file-icon', style: { color: getExtColor(ext) } }, [h(icon)]),
        h('span', text)
      ]);
    }
  },
  {
    type: 'Select',
    field: 'ext',
    label: $t('file.ext'),
    options: { source: extOptions },
    viewRender: ({ text }) => text,
    columnProps: { width: 90 }
  },
  {
    field: 'size',
    label: $t('file.size'),
    viewRender: ({ text }) => formatSize(text),
    columnProps: { width: 120 }
  },
  {
    type: 'Select',
    field: 'storage',
    label: $t('file.storage'),
    options: { source: storageOptions },
    columnProps: { width: 100 },
    viewRender: ({ text }) => h(Tag, { color: storageColors[text] }, () => storageOptions.find((option) => option.value === text)?.label || text)
  },
  { field: 'uploader', label: $t('file.uploader'), columnProps: { width: 100 } },
  { field: 'createTime', label: $t('file.uploadTime'), columnProps: { width: 180 } },
];
const [register, table] = useTable({
  title: $t('file.title'),
  columns,
  indexColumn: false,
  searchForm: { subItems: ['originalName', 'ext', 'storage'], limit: 2 },
  attrs: {
    rowKey: 'id',
    onReload: () => table.reload(),
    pageTransform: ({ current, size }) => ({ page: current, pageSize: size }),
    resultTransform: (response) => ({
      records: response.list,
      total: response.total,
      current: response.current ?? response.page,
      size: response.pageSize
    })
  },
  beforeQuery: ({ originalName, ...params }) => ({ ...params, name: originalName }),
  apis: {
    query: fileApi.getFileList.bind(fileApi),
    delete: async (keys: string[]) => {
      await Promise.all(keys.map((id) => fileApi.deleteFile(id)));
      message.success($t('file.deleteSuccess'));
    }
  },
  rowButtons: {
    actions: [
      {
        name: 'delete',
        confirmText: ({ record }) => $t('file.confirmDeleteContent', { name: record.originalName })
      }
    ]
  },
});
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
