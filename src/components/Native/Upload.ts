import { UploadDragger } from 'antdv-next';
import { createAntdvAdapter, type UIComponentRender } from 'superform-antdv';
import { h, isVNode, cloneVNode } from 'vue';
const adapter = createAntdvAdapter();
export const renderNativeUpload: UIComponentRender<'upload'> = ({ state, slots }) => {
  const { dragger, ...attrs } = state.attrs;
  const node = adapter.render.upload?.({ ...state, attrs }, slots);
  if (!dragger || !isVNode(node) || !Array.isArray(node.children)) return node;
  const children = node.children.map((child, index) =>
    index === 0 && isVNode(child)
      ? h(UploadDragger, child.props ?? {}, child.children as Record<string, () => unknown>)
      : child,
  );
  const result = cloneVNode(node);
  result.children = children;
  return result;
};
