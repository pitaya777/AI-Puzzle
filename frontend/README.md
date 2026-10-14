# 前端目录说明

本项目采用原生 JavaScript 的单页应用结构。`index.html` 是唯一入口，各业务页面由独立模块负责渲染，页面切换不会重复加载公共导航和资源。

## JavaScript

- `app.js`：应用入口、页面路由和交互事件。
- `js/core.js`：接口请求、选择器、转义、提示等公共工具。
- `js/state.js`：前端状态与回忆问题配置。
- `js/pages/home.js`：首页、照片上传、照片裁剪。
- `js/pages/puzzle.js`：拼图和回忆进度。
- `js/pages/generation.js`：漫画生成、视频任务、成片结果。
- `js/pages/library.js`：我的作品和分享页。
- `js/pages/admin.js`：管理登录和统计后台。

## CSS

- `styles/base.css`：全局变量、导航、按钮和公共组件。
- `styles/home.css`：首页。
- `styles/creation.css`：上传、裁剪及生成过场。
- `styles/puzzle.css`：拼图和回忆问答。
- `styles/result.css`：作品列表、视频及故事。
- `styles/admin.css`：管理后台。
- `styles/responsive.css`：手机、平板和电脑断点。

设计图片统一存放在 `design/`。所有前端资源继续由 FastAPI 的 `/assets` 路径提供。
