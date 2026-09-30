# 本地依赖接入

本项目使用 `file:../antdv-superform/packages/superform-antdv`，要求 admin 与 antdv-superform 仓库位于同一父目录。api-datamodel 和 async-result-cache 使用 npm 依赖。

所有 AI 指南通过 [AI_GUIDE.md](../AI_GUIDE.md) 引用本地文件，维护实际存在的入口，不复制正文。

统一初始化位于 `src/setupSuperForm.ts`；接口生成配置位于 `api-datamodel.config.mjs`。目录职责、运行命令和业务开发方式见 [README](../README.md)，改造验收见 [改造规范](./refactor-spec.md)。

此前仅替换 ProForm 内部渲染的接入方案已被直接使用 SuperForm Schema 的方案取代。
