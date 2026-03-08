import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "login" },
    { path: "/login", component: "login" },
    { path: "/home", component: "home" },
    { path: "/docs", component: "docs" },
  ],
  npmClient: 'pnpm',
});
