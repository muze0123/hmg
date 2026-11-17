/**
 * @wangeditor/editor-for-vue v5 的 package.json exports 未声明 types 条件，
 * 在 moduleResolution: Bundler 下 TS 无法解析其随包发布的 dist/src/index.d.ts。
 * 这里显式补一个模块声明，让 Editor / Toolbar 以组件类型被识别。
 */
declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue';
  export const Editor: DefineComponent<Record<string, unknown>>;
  export const Toolbar: DefineComponent<Record<string, unknown>>;
}
