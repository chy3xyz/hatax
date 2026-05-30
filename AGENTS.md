# AGENTS.md — Vite + Alpine.js + HTMX + Tailwind 管理后台

> 本文档面向 AI 编程助手。如果你正在阅读本文件，说明你对这个项目一无所知；本文将帮助你快速理解项目结构、技术栈、构建方式与开发约定。

---

## 一、项目概述

本项目是一个**纯前端、轻量化管理后台模板**，对标 Vben Admin 的页面结构，但技术栈极度精简：

- **Vite**：构建工具与开发服务器（端口 3000）
- **Alpine.js**：轻量级响应式框架，负责全局状态、组件交互、弹窗/表单校验逻辑
- **HTMX**：通过 HTML 属性实现无刷新局部更新，直接对接后端接口
- **Tailwind CSS**：原子化 CSS 框架，内置暗黑模式支持

项目**无后端依赖**，`mock-api/` 目录下提供前端模拟接口，用于演示 HTMX 交互。生产环境只需将这些模拟接口替换为真实后端即可。

---

## 二、技术栈与关键配置

| 技术 | 版本 | 用途 |
|------|------|------|
| `vite` | ^6.0.11 | 构建、热更新、预览 |
| `alpinejs` | ^3.14.7 | 响应式状态、组件交互、弹窗/表单校验逻辑 |
| `htmx.org` | ^1.9.12 | AJAX 局部刷新、请求交互 |
| `tailwindcss` | ^3.4.17 | 原子样式、暗黑模式 |
| `postcss` / `autoprefixer` | — | Tailwind 后处理 |

### 关键配置文件

- **`vite.config.js`**：开发服务器端口 3000，多页面入口扫描（`pages/` 目录下所有 HTML）
- **`tailwind.config.js`**：启用 `darkMode: 'class'`，内容扫描 `./*.html`、`./pages/**/*.html`、`./components/**/*.html`，主色调 `primary: '#1890ff'`
- **`package.json`**：`type: "module"`，脚本仅 `dev` / `build` / `preview`

---

## 三、项目结构

```
.
├── package.json              # 依赖与脚本
├── vite.config.js            # Vite 配置（多页面入口）
├── tailwind.config.js        # Tailwind 配置
├── main.js                   # 全局入口：Alpine store、HTMX 配置、工具函数
├── index.html                # 入口：自动重定向到 /pages/dashboard.html
├── style.css                 # Tailwind 指令 + 自定义组件类 + CSS 动画
├── readme.md                 # 原始项目说明
├── components/               # 可复用 HTML 组件（供内联参考）
│   ├── layout/
│   │   ├── header.html       # 顶部导航栏（命令面板 ⌘K、7色主题切换、暗黑、通知、用户下拉）
│   │   ├── sidebar.html      # 侧边栏（分组菜单、图标、折叠/展开、移动端 overlay）
│   │   ├── tab-bar.html      # 多标签页（滚动+左右箭头+溢出下拉菜单+刷新按钮）
│   │   ├── breadcrumb.html   # 面包屑导航
│   │   └── footer.html       # 页脚（自适应侧边栏折叠）
│   └── ui/
│       ├── button.html       # 按钮组件
│       ├── modal.html        # 弹窗组件
│       ├── drawer.html        # 抽屉组件（右/左滑入、过渡动画）
│       ├── icon-picker.html   # 图标选择器（48 SVG 图标、搜索过滤）
│       └── skeleton.html      # 骨架屏（淡入脉冲动画）
├── pages/                    # 业务页面（每个页面完整 HTML，内联所有 layout/ui 组件）
│   ├── login.html            # 登录页（用户名/密码、记住我）
│   ├── dashboard.html        # 仪表盘（ECharts 折线图+饼图、统计卡片、Drawer 导出）
│   ├── user.html             # 用户管理（CRUD、弹窗表单、HTMX 表格）
│   ├── role.html             # 角色权限（左侧角色列表 + 右侧权限配置）
│   ├── menu.html             # 菜单管理（树形表格、展开折叠、排序、状态切换）
│   ├── form-basic.html       # 基础表单（用户名、邮箱、手机号等）
│   ├── form-advanced.html    # 高级表单（分组表单项、通知人配置）
│   ├── table.html            # 表格列表（Alpine 响应式数据绑定：搜索/筛选/分页/删除）
│   ├── profile.html          # 个人中心（Tab 切换：基本资料/安全设置）
│   ├── error-403.html        # 403 无权限页面
│   ├── error-404.html        # 404 页面未找到
│   └── error-500.html        # 500 服务器错误
└── mock-api/                 # 前端模拟接口（HTMX 对接演示）
    ├── user-list.html        # 用户列表片段（搜索/分页后替换表格 tbody）
    └── user/
        ├── 1.html            # 删除用户 1 的返回片段
        └── 2.html            # 删除用户 2 的返回片段
```

---

## 四、构建与运行命令

```bash
# 安装依赖
npm install

# 启动开发服务器（热更新，端口 3000）
npm run dev

# 生产构建（输出到 dist/）
npm run build

# 预览生产构建产物
npm run preview
```

> 本项目**无测试框架**，无 lint 配置，无 CI/CD 脚本。如需添加，请自行引入。

---

## 五、代码风格与开发约定

### 5.1 语言与注释

- 项目主要使用**中文**编写界面文本、注释和文档。
- 代码中的变量名、函数名使用英文（如 `sidebarOpen`、`activeMenu`、`checkRequired`）。

### 5.2 HTML 组件化规则

每个页面是**完整独立 HTML 文档**，所有 layout/ui 组件内联在页面中（不再使用 `<link rel="html">` 导入）：

- 页面级文件（`pages/*.html`）包含完整 HTML 结构 + 内联 layout（Header、Sidebar、Tab Bar、Footer、Command Palette）
- `components/` 目录下的 HTML 片段作为**参考模板**，开发者可复制粘贴到页面中
- UI 组件使用 `<script type="text/template" id="tpl-xxx">` 定义模板，供 Alpine.js 或自定义元素渲染
- 页面底部引入 `<script type="module" src="/main.js">`
- 页面级 Alpine 组件（如 `tablePage`）通过 `Alpine.data(name, fn)` 在 `<script type="module">` 中注册，**必须** `import '/main.js'` 确保 Alpine.start() 先执行

### 5.3 CSS 约定

- 使用 Tailwind 原子类为主
- 自定义复用类定义在 `style.css` 的 `@layer components` 中：
  - `.sidebar-item` — 侧边栏菜单项
  - `.sidebar-item.active` — 激活态
  - `.form-error` — 表单错误提示
  - `.btn-danger` — 危险按钮
  - `.btn-default` — 默认边框按钮
  - `.global-loading` — 全局加载遮罩

### 5.4 Alpine.js 使用模式

- **全局状态**：`Alpine.store('app', {...})`，包含 `dark`、`sidebarOpen`、`activeMenu`、`tabs`、`loading`、`breadcrumbs`、`menuGroups`、`themeColor`、`commandPaletteOpen`、`drawerOpen`
- **全局工具**：`Alpine.notify`（success/error/warning/info 消息提示，带进度条）、`Alpine.storage`（localStorage 封装，带 `hatax_` 前缀）
- **全局组件逻辑**：`Alpine.data('modal', ...)`、`Alpine.data('drawer', ...)`、`Alpine.data('formRule', ...)`、`Alpine.data('iconPicker', ...)`、`Alpine.data('commandPalette', ...)`
- 在 HTML 中通过 `x-data`、`x-show`、`x-bind`（`:class`）、`x-on`（`@click`）、`x-model` 等指令驱动交互
- 标签页通过 `$store.app.addTab(name, title)` 和 `$store.app.closeTab(index)` 管理
- 导航通过 `$store.app.navigate(item)` 管理（自动更新 tabs + breadcrumbs）
- 面包屑通过 `$store.app.setBreadcrumbs([{title, path}])` 设置
- 主题色通过 `$store.app.setThemeColor(color)` 设置（更新 CSS 变量 `--primary`）
- 命令面板通过 `$store.app.openCommandPalette()` 打开，`Ctrl/Cmd+K` 全局快捷键

### 5.5 HTMX 使用模式

- HTMX 属性直接写在 HTML 元素上：
  - `hx-get` / `hx-post` / `hx-delete`：请求方法
  - `hx-target`：接收响应并替换的目标元素（如 `#user-table-body`）
  - `hx-swap`：替换方式（通常为 `innerHTML`）
  - `hx-include`：包含额外表单字段
  - `hx-confirm`：删除前二次确认
- 全局配置在 `main.js` 中：
  - `htmx.config.historyEnabled = false`（管理后台不使用前端路由历史）
  - `htmx.config.globalViewTransitions = true`
- 全局事件监听：
  - `htmx:beforeRequest` → 显示全局 loading
  - `htmx:afterRequest` → 隐藏全局 loading
  - `htmx:error` → `Alpine.notify.error(...)` 并隐藏 loading

---

## 六、页面与路由机制

- **无前端路由**：采用传统页面跳转（`location.href`）
- `index.html` 自动重定向到 `/pages/dashboard.html`
- 侧边栏菜单点击后跳转到对应页面（如 `/pages/user.html`），同时联动标签页状态
- 每个页面独立加载 `main.js`，因此 Alpine store 在每个页面都会重新初始化（适合无后端 session 的纯前端场景；生产环境若需持久化状态，需自行补充 `localStorage` 或后端 session）
- 移动端（`<1024px`）：侧边栏默认隐藏，点击 hamburger 按钮通过 `$store.app.mobileMenuOpen` 控制 overlay 模式

---

## 七、mock-api 说明

`mock-api/` 下的文件**仅用于前端演示 HTMX 交互**：

- `mock-api/user-list.html`：模拟后端返回的表格 `<tr>` 片段，供搜索/分页后替换 `tbody`
- `mock-api/user/1.html`、`mock-api/user/2.html`：模拟删除后返回的提示片段

**生产环境对接规范**：
1. 将 `mock-api` 替换为真实后端接口（Java/Go/PHP/Python 等均可）
2. 后端接口**只返回 HTML 片段**（非完整页面），配合 `hx-target` 实现局部刷新
3. 权限控制由后端判断，直接控制按钮/菜单是否渲染
4. 分页数据、字典数据、复杂状态全部由后端维护

---

## 八、扩展建议（供 AI 参考）

- **新增页面**：在 `pages/` 下新建完整 HTML 文件，参考 `dashboard.html` 或 `user.html` 结构，引入所需 layout/ui 组件
- **新增 UI 组件**：在 `components/ui/` 下新建 HTML 文件，使用 `<script type="text/template" id="tpl-xxx">` 定义模板
- **新增菜单项**：修改 `main.js` 中的 `MENU_GROUPS` 和 `MENU_MAP`，添加新的菜单配置
- **图表**：可引入 `ECharts`，结合 Alpine 状态渲染（参考 `dashboard.html`）
- **文件上传**：使用 HTMX 文件上传属性 + 后端接收
- **登录鉴权**：由后端拦截未登录请求并返回登录页；前端检查 `sessionStorage.hatax_token`

---

## 九、安全注意事项

- 当前为纯前端模板，**无身份验证、无 XSS 防护、无 CSRF 防护**
- `mock-api/` 中的删除确认仅依赖 `hx-confirm`，可被绕过；生产环境必须由后端做权限校验
- 表单校验目前只有前端 `checkRequired`，后端必须再次校验所有输入
- `htmx:error` 中使用 `alert()` 暴露错误信息，生产环境应替换为更友好的提示组件，并避免泄露敏感服务端信息
