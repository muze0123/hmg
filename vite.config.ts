import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { vitePluginForArco } from '@arco-plugins/vite-vue';

/**
 * @vue-office/* 用 postinstall 按 Vue 版本生成 lib/index.js；pnpm 默认不执行这类
 * 安装期脚本（见 pnpm-workspace.yaml 的 allowBuilds），因此包入口 lib/index.js 不存在。
 * 这里直接锚定发布包自带的 Vue 3 ESM 构建，既不依赖安装期脚本，也让 Vite 拿到
 * 原生 ESM 以便按需拆包。正则精确匹配包名，避免误伤同包下的 CSS 子路径导入。
 * 组件的 vue-demi 依赖由 pnpm 的 peer 链接解析到 Vue 3 版本。
 */
const vueOfficeEntry = (pkg: string, file: string) =>
  fileURLToPath(new URL(`./node_modules/@vue-office/${pkg}/lib/v3/${file}`, import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    vitePluginForArco({ style: 'css' }),
  ],
  resolve: {
    alias: [
      { find: /^@vue-office\/pdf$/, replacement: vueOfficeEntry('pdf', 'vue-office-pdf.mjs') },
      { find: /^@vue-office\/docx$/, replacement: vueOfficeEntry('docx', 'vue-office-docx.mjs') },
      { find: /^@vue-office\/excel$/, replacement: vueOfficeEntry('excel', 'vue-office-excel.mjs') },
    ],
  },
  /* 部署（2026-11-02）：发布沙箱经反向代理访问，dev/preview 需绑定 0.0.0.0
     并放行任意 Host，否则 Vite 以 "Blocked request. This host is not allowed." 拒绝 */
  server: { host: '0.0.0.0', allowedHosts: true },
  preview: { host: '0.0.0.0', allowedHosts: true },
});
