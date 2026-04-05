# Skill Manager

Skill Manager 是一个基于 Tauri、React、TypeScript 和 Rust 构建的桌面应用，用于统一管理本地 tools、skills 以及 marketplace 内容，方便进行配置、查看、测试与安装。

## 目录

- [核心能力](#核心能力)
- [界面截图](#界面截图)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [开发命令](#开发命令)
- [构建发布](#构建发布)
- [测试](#测试)
- [项目结构](#项目结构)

## 核心能力

- **Skills 管理**：查看、编辑、创建和删除本地 skill 文件。
- **Tools 管理**：统一管理本地工具配置，并为 tool 绑定对应 skill。
- **Marketplace**：浏览、检索、查看并安装 marketplace 中的 skills。
- **桌面端体验**：基于 Tauri 构建，具备更轻量的桌面应用体验。
- **现代前端栈**：使用 React、TypeScript、Redux Toolkit 和 Tailwind CSS 构建界面与状态管理。

## 界面截图

### Skills

![Skills](screenshots/screenshot_skills.png)

### Tools

![Tools](screenshots/screenshot_tools.png)

### Marketplace

![Marketplace](screenshots/screenshot_marketplace.png)

## 技术栈

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tauri](https://v2.tauri.app/)
- [Rust](https://www.rust-lang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Playwright](https://playwright.dev/)
- [Vitest](https://vitest.dev/)

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/en/) 18+
- [npm](https://www.npmjs.com/)
- [Rust](https://www.rust-lang.org/tools/install)

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run tauri dev
```

## 开发命令

```bash
# 前端开发
npm run dev

# Tauri 开发
npm run tauri dev

# 前端构建
npm run build

# 运行全部测试
npm run test

# 仅运行单元测试
npm run test:unit

# 仅运行 E2E 测试
npm run test:e2e
```

## 构建发布

### 默认构建

```bash
npm run tauri build
```

构建产物默认位于 `src-tauri/target/release/bundle`。

### 打包成 macOS DMG

若需专门打包为 macOS 下的 `.dmg` 安装包，请执行以下命令：

```bash
npm run tauri build -- --bundles dmg
```

> **提示**：在 macOS 环境下，默认的 `npm run tauri build` 也会在 `src-tauri/target/release/bundle/dmg` 目录下生成 DMG 文件。

## 测试

项目使用 Vitest 和 Playwright：

- `npm run test`
- `npm run test:unit`
- `npm run test:e2e`

## 项目结构

```text
.
├── src/                 # React 前端代码
│   ├── components/      # 通用组件
│   ├── lib/             # API 与工具函数
│   ├── store/           # Redux 状态管理
│   └── views/           # Skills / Tools / Marketplace 页面
├── src-tauri/           # Tauri Rust 后端与应用配置
├── skills/              # 本地 skills 示例或配置目录
├── tests/               # E2E 测试
└── screenshots/         # README 截图资源
```
