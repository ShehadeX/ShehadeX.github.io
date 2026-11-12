# 肖致浩 · AI Engineering Desk

个人技术作品集网站。终端风格的首页 + 五个项目的独立案例详情页。

- **栈：** Vue 3 + TypeScript + Vite + Tailwind CSS v4 + Vue Router + Mermaid
- **设计系统：** `anthropic-ui-skills`（Anthropic 浅色设计系统）
  - 页面底色 `#ECE9E0` · 卡片 `#DBD1C0` · 覆盖层 `#0F0F10`
  - Inter 字体 + 等宽终端字体 · 4px 栅格 · 圆角仅 3px / 15px
  - 焦点态 2px `#5E6AD2` outline，动画仅使用 `transform` / `opacity`
  - 尊重 `prefers-reduced-motion`

## 开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 类型检查 + 产物构建到 dist/
npm run preview    # 预览构建产物
```

## 截图（无头 Chrome）

```bash
bash scripts/screenshot.sh /tmp/pf-shots          # 首页 + 五个详情页
bash scripts/screenshot-sections.sh /tmp/pf-shots  # 首页分区
```

## 目录结构

```
src/
├─ data/projects.ts        # 全部项目内容（正文 / 架构图 Mermaid / 图集 / 事实卡）
├─ components/
│  ├─ SiteHeader.vue       # 顶部导航
│  ├─ SiteFooter.vue       # 页脚 + 终端回显
│  ├─ ProjectCard.vue      # 首页项目卡片
│  ├─ BeforeBuiltAfter.vue # Before → Built → After 三栏
│  └─ MermaidDiagram.vue   # 懒加载 Mermaid，滚动进入视口才渲染
├─ views/
│  ├─ HomeView.vue         # 首页五大区块
│  └─ ProjectView.vue      # 案例详情页
├─ router/index.ts
└─ style.css               # 设计令牌 + 组件层
public/img/
├─ bidos/  cga/  moca/  fupanpolymed/   # 真实界面截图
```

## 内容维护

新增项目只需编辑 `src/data/projects.ts`：追加一个 `Project` 对象即可，
首页卡片与详情页会自动生成。架构图用 Mermaid 源码内联在同文件的 `diagrams` 字段。

## 说明

项目截图为系统实际运行界面，界面中的企业、医院、投标项目与人员信息均为虚构测试数据。
