import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "login" },
    { path: "/home", component: "index" },
    { path: "/docs", component: "docs" },
  ],
  npmClient: 'pnpm',
  // 配置 watch 选项，忽略系统文件
  watch: {
    ignored: [
      '**/C:/DumpStack.log.tmp',
      '**/C:/hiberfil.sys',
      '**/C:/pagefile.sys',
      '**/C:/swapfile.sys',
      '**/*.sys',
      '**/*.tmp',
    ],
  },
});
