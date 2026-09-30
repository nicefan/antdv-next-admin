import { createAntdvAdapter, type UIComponentRender } from 'superform-antdv';
import { h, isVNode, reactive } from 'vue';

import NativeModal from '../Modal/index.vue';
import NativeTable from './index.vue';
const officialAdapter = createAntdvAdapter();
// 当前本地包的根表单属性可能携带 Ref，交给原生组件前统一解包。
export const renderNativeForm: UIComponentRender<'form'> = ({ attrs, slots }) =>
  officialAdapter.render.form?.(reactive(attrs), slots);
// 复用官方状态转换，仅覆盖最终原生组件，不接管 SuperTable 的请求和分页。
export const renderNativeTable: UIComponentRender<'table'> = ({ state, slots }) => {
  const node = officialAdapter.render.table?.(state, slots);
  return isVNode(node) ? h(NativeTable, node.props ?? {}, slots) : node;
};
export const renderNativeModal: UIComponentRender<'modal'> = ({ attrs, slots }) => {
  // 内置弹窗使用 visible 协议，先保留官方 open 与事件映射，再替换原生组件。
  const node = officialAdapter.render.modal?.(reactive(attrs), slots);
  return isVNode(node) ? h(NativeModal, node.props ?? {}, slots) : node;
};
