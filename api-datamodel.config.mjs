export default {
  outputDir: 'src/api/generated',
  importStatement: "import { createApi } from '@/api/service'",
  duplicateMethodStrategy: 'error',
  responseSchema: { namePrefix: 'AjaxResult', dataField: 'data' },
  apis: {
    admin: { label: '脚手架 Mock 接口', url: 'openapi/admin.json', outputFolder: 'admin' },
    demo: {
      label: '隔离演示接口',
      url: 'openapi/demo.json',
      outputFolder: 'demo',
      importStatement: "import { createApi } from '@/api/service/demo'",
    },
  },
};
