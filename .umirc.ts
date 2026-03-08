import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "login" },
    { path: "/home", component: "index" },
    { path: "/docs", component: "docs" },
  ],
  npmClient: 'pnpm',
});
