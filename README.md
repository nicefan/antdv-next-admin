# Antdv SuperForm Admin

以 **SuperForm、api-datamodel、async-result-cache** 为核心的 Vue 前端开发脚手架，保留权限路由、主题、国际化、Mock、布局和业务示例，供开发者与 AI 使用同一套接口、Schema 和扩展规范开发业务。

开始开发前阅读 [AGENTS.md](./AGENTS.md) 和 [本地依赖指南入口](./AI_GUIDE.md)。脚手架改造要求单独记录在 [改造规范](./docs/refactor-spec.md)，不混入业务开发约束。

## 本地运行

本仓库通过 `file:../antdv-superform/packages/superform-antdv` 使用本地 SuperForm 包，因此需将两个仓库放在同一父目录。依赖仓库必须使用 `next-dev` 分支；本次适配基于提交 `ff912d3`。不要使用 main 分支的旧产物。

首次准备环境时，先在同级目录准备依赖源码与产品包产物（以下命令由开发者执行）：

~~~sh
git clone --branch next-dev --single-branch https://github.com/nicefan/antdv-superform.git
cd antdv-superform
pnpm install
pnpm --filter superform-antdv build
cd ../antdv-next-admin
pnpm install
~~~

已有依赖时确认 `superform-antdv/dist` 来自上述分支，直接执行：

~~~sh
pnpm dev
~~~

默认地址为 http://localhost:3000 。Mock 演示账号为 `admin / 123456` 和 `user / 123456`。新环境缺少依赖时由开发者执行 `pnpm install`；脚手架使用约定禁止 AI 自动安装或构建。

## 目录与职责

~~~text
openapi/                       # 本地示例接口契约
api-datamodel.config.mjs        # Codegen 配置
src/setupSuperForm.ts          # Adapter 覆盖、自定义字段和统一配置
src/api/
  service/                     # Service、Axios 传输、鉴权与响应转换
  cache/                       # 统一缓存作用域、注册和失效
  generated/admin/             # 自动生成的业务 API 和接口类型
  generated/demo/              # 自动生成的隔离演示 API 和类型
  facade/                      # 缓存协调、接口组合、结果加工
src/components/
  Native/Table/                # 列设置、列宽、密度、表头筛选等原生增强
  Native/Modal/                # 拖动、缩放、全屏等原生弹窗增强
  Fields/                      # 远程选项、代码编辑器等自定义字段
  Display/                     # 状态、值格式化、图表、统计卡片、详情布局
  Layout/                      # 页面壳、分栏和分步布局
src/views/system/              # 用户、角色、权限、部门、字典、配置、文件、日志
src/views/examples/            # 原生 Schema 和独立能力示例
~~~

`components/Pro` 及旧配置协议已移除。表单、搜索、数据查询、分页和详情由 SuperForm 系列组件管理；表格与弹窗增强通过外部组件覆盖官方 Adapter 的原生渲染。增强组件不另外建立请求、CRUD 或表单引擎。

## 页面开发

从 `superform-antdv` 公共入口导入 `SuperForm`、`SuperTable`、`SuperDetail`、`useForm`、`useTable` 等，直接使用公开 Schema 类型。

~~~ts
import { computed } from 'vue';
import { usersApi } from '@/api/generated/admin/User';
import type { ExtColumnsItem } from 'superform-antdv';

const columns = computed<ExtColumnsItem[]>(() => [
  { field: 'username', label: () => '用户名' },
  { field: 'email', label: () => '邮箱' },
]);

async function query(params: Record<string, unknown>, config?: RequestConfig) {
  const current = Number(params.current ?? 1);
  const size = Number(params.pageSize ?? 10);
  const result = await usersApi.getUserList(
    { current, pageSize: size, username: params.username ? String(params.username) : undefined },
    config,
  );
  return { records: result.list, total: result.total, current, size };
}
~~~

~~~vue
<SuperTable
  :schema="{
    columns,
    apis: { query },
    attrs: { pagination: {} },
    searchForm: { subItems: [{ type: 'Input', field: 'username', label: '用户名' }] },
  }"
/>
~~~

表格查询返回 `records / total / current / size`。本项目将请求分页字段统一映射为 `current / pageSize`，不要把每次查询的页码写死为 1。查询包装函数接收并透传第二个请求配置参数，保留 SuperTable 的取消信号。

页面插槽必须在 Schema 的 `slots` 中映射，例如 `slots: { extra: 'extra', bodyCell: 'bodyCell' }`；单字段展示使用 `viewRender` 或命名插槽。

新增/编辑以 `await form.submit()` 返回的数据为准，声明需要的 Hidden 字段；弹窗会话复用 `useCrudFormSession`。原生输入属性使用 `attrs` 或 `dynamicAttrs`，不混用旧 `name / dataIndex / props / valueType` 表单协议。完整用法以 [本地 SuperForm 指南](./AI_GUIDE.md) 为准。

## 原生扩展与自定义字段

`src/setupSuperForm.ts` 是统一入口：

- Table 覆盖消费公开的 `UITableRenderProps`，转换原生列渲染、选择、展开、分页和变更事件后交给增强组件；不读取官方 VNode 的内部结构。
- Modal 通过 `overrides.uiComponents.modal` 接入外部增强组件，显式转换 visible/open 协议；官方上下文 service 保持有效。拖拽、缩放和全屏属于原生交互。
- Form 覆盖解包当前本地包根表单的动态 Ref 属性，继续使用官方属性适配。
- JsonInput、I18nInput、IconPicker、RemoteSelect、RemoteTreeSelect、CodeEditor 注册为字段。CodeEditor 使用 `modelValue / update:modelValue`，其他字段沿用 `value / update:value`。
- 自定义字段公开 props 在 `src/types/superform.d.ts` 中声明，不依赖包内部路径。
- 上传使用 SuperForm 原生 Upload，`dragger` 属性通过外部渲染覆盖切换原生 UploadDragger。示例采用提交上传模式，失败后再次提交可重试未成功文件；上传契约转换在 facade。

本项目的 `columnProps.headerFilter` 是外部原生 Table 扩展属性。`useTableParams().filterSortTransform` 放在 `attrs.filterSortTransform`，只负责转换后端参数；条件快照、回第一页、查询和导出参数由 SuperTable 管理。不要同时把筛选结果写入 `params` 或在原生事件内再次查询。`attrs.onChange`、`attrs.onFilterChange`、`attrs.onSortChange` 仍保留原生事件参数，供业务通知使用。client 模式只筛选当前数据；server 模式交给后端；hybrid 模式保留本地与远程筛选。

分页放在 `attrs.pagination`；全局请求分页字段通过 `defaultProps.SuperTable.pageTransform` 映射。旧 `tableApiSetting` 与根级 `pagination` 不再使用。`useSectionStyle` 控制容器外观。内置文案使用库的中文/英文语言包，字段占位符沿用核心默认的标签提示。启动先加载已保存语言，语言切换持久化后整页刷新，以便 Schema 与内置文案统一初始化。

表格示例使用同一份 `columns` 定义查询、编辑与详情，`exclude` 区分场景；`rowEditor.form` 仅配置布局。特殊业务确实需要独立字段时才声明 `subItems`。

SuperTable 自行渲染标题栏，原生 Table 扩展无法直接获得根组件的 `title` 插槽。需要将工具栏放在标题右侧时，在 `slots: { title: 'title' }` 对应的插槽内提供元素挂载点，并通过 `attrs.toolbarTarget` 传入该元素的 Ref；扩展组件将工具栏传送到挂载点，不查找 DOM、不接管标题或业务按钮。完整用法见 `src/views/examples/table/index.vue`。未提供挂载点的已有页面暂保留原工具栏位置，`attrs.tableTools: false` 关闭工具栏。

这些属性和事件属于外部原生扩展，不增加 SuperTable 核心 Schema 协议。普通图表、布局、验证码等独立展示能力无需套入业务表单。

## 接口生成与服务

~~~sh
pnpm api:generate
pnpm api:generate:demo
~~~

两个命令分别读取 `openapi/admin.json`、`openapi/demo.json`，只输出至对应的 `src/api/generated` 子目录。业务契约当前覆盖 49 个操作；正式项目应替换为实际后端 OpenAPI，并维护服务导入配置。生成需要 api-datamodel 的可选生成依赖（swagger-typescript-api、inquirer、jiti）；安装行为由开发者执行。

本次产物已使用本机已有的 api-datamodel 1.1.9 官方 Codegen 实际生成，未手写冒充生成代码。默认命令使用项目安装的 CLI；当前机器也可执行：

~~~sh
node D:/work/api-datamodel/codegen/main.js admin --config api-datamodel.config.mjs
node D:/work/api-datamodel/codegen/main.js demo --config api-datamodel.config.mjs
~~~

业务接口走 `api/service/index.ts`，以 Axios 作为传输适配器。传输层处理 Token 和 401 刷新队列；Service 解包业务结果，Request Hooks 统一反馈失败。页面直接使用解包后的结果，成功文案由页面决定。没有额外加工时直接调用生成 API。

演示鉴权、可观测性和上传走独立的 `api/service/demo.ts` 与生成的 demo API；演示失败不会清除真实登录会话。这个适配器是本地模拟服务，不应作为生产后端配置使用。

## 公共结果缓存

字典和完整部门结果在 `api/cache` 中统一注册，使用 `async-result-cache/vue`。部门和字典 facade 负责缓存读取、复制结果和写后失效。搜索、分页列表、日志和写请求保持实时。字典 Store 与字段共享同一缓存源，退出登录清理统一作用域。

不假设 TTL 或自动过期能力。外部系统修改公共数据后，可主动清理对应缓存并重新读取；编辑前复制共享缓存对象。

## 验证与历史资料

常用静态检查是 `pnpm type-check`、`pnpm lint` 和 `pnpm format:check`。遵循 AGENTS：未经用户明确要求，不主动运行测试、构建或修改单元测试。

仓库中的旧 Pro 单测引用已移除的实现，需另行授权迁移后才能纳入当前架构验证；旧测试不能证明本次改造通过。历史设计位于 [docs/plans](./docs/plans/README.md)，不作为当前开发约束。

[部署说明](./DEPLOYMENT.md) · [MIT License](./LICENSE)
