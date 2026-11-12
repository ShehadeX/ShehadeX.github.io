# 肖致浩 · AI Engineering Desk

个人技术作品集网站。终端风格的首页 + 五个项目的独立案例详情页 + ICLR 论文页。

**线上地址：**

| 入口 | 地址 | 说明 |
|---|---|---|
| 自有服务器（主） | http://47.114.90.122:5000 | 全部资源（图片 / PDF）由自己的服务器提供 |
| GitHub Pages（备份） | https://shehadex.github.io/ | 自动部署，内容与服务器端一致 |

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
npm run build      # 类型检查 + 产物构建到 dist/ + 生成 GitHub Pages 路由 fallback
npm run preview    # 预览构建产物
```

## 部署

两处并行，内容由同一份 `dist/` 产出：

### 1. 自有服务器（主入口，端口 5000）

阿里云 ECS `47.114.90.122`，nginx 监听 5000 端口。

```bash
npm run build
# 上传 dist/ 与 deploy/nginx-portfolio.conf 到服务器
#   root /www/portfolio
#   conf /etc/nginx/conf.d/portfolio.conf
#   然后 nginx -t && nginx -s reload
```

配置见 `deploy/nginx-portfolio.conf`。

> 端口 5000 的原因：阿里云会对未备案域名的 80/443 做 ICP 拦截，
> 5000 不在拦截范围内。绑定的是 IP 而非域名，因此不依赖任何域名解析。

### 2. GitHub Pages（备份入口）

推送到 `main` 分支即由 GitHub Actions 自动部署（`.github/workflows/deploy.yml`）。

```bash
git push
```

构建产物 `dist/` 会额外生成各路由的 `index.html` 与 `404.html`，
用于绕开 GitHub Pages 没有 history fallback 的限制。

## 图片

图片已通过 `scripts/optimize-images.sh` 压缩为 WebP（1600px / q78），
总体积从 16MB 降到 2.2MB（-87%）。

页面使用 `src/components/LazyImage.vue`：不使用原生 `loading="lazy"`
（在本项目的长列表布局下原生懒加载不会发起请求，图片永远停在未加载状态），
改为显式 IntersectionObserver 控制，并有加载失败兜底。

## 截图（无头 Chrome）

```bash
bash scripts/screenshot.sh /tmp/pf-shots          # 首页 + 五个详情页
bash scripts/screenshot-sections.sh /tmp/pf-shots  # 首页分区
```

## 目录结构

```
src/
├─ data/
│  ├─ projects.ts          # 五个项目内容（正文 / 架构图 Mermaid / 图集 / 事实卡）
│  └─ research.ts          # ICLR 论文内容（贡献 / 协议 / 关键发现 / 局限 / AI 声明）
├─ components/
│  ├─ SiteHeader.vue       # 顶部导航
│  ├─ SiteFooter.vue       # 页脚 + 终端回显
│  ├─ ProjectCard.vue      # 首页项目卡片
│  ├─ BeforeBuiltAfter.vue # Before → Built → After 三栏
│  ├─ LazyImage.vue        # IntersectionObserver 图片加载（含失败兜底）
│  └─ MermaidDiagram.vue   # 懒加载 Mermaid，滚动进入视口才渲染
├─ views/
│  ├─ HomeView.vue         # 首页五大区块
│  ├─ ProjectView.vue      # 案例详情页
│  └─ ResearchView.vue     # ICLR 论文页
├─ utils/asset.ts          # BASE_URL 感知的静态资源路径
├─ router/index.ts
└─ style.css               # 设计令牌 + 组件层
public/
├─ img/                    # 真实界面截图（bidos / cga / moca / fupanpolymed）
├─ paper/                  # 论文 PDF
└─ favicon.svg
scripts/
├─ postbuild-pages.mjs     # 生成 Pages 路由 fallback
├─ optimize-images.sh      # 压缩图片为 WebP
├─ screenshot.sh           # 无头 Chrome 批量截图
└─ screenshot-sections.sh  # 首页分区截图
deploy/
└─ nginx-portfolio.conf    # 自有服务器 nginx 配置（5000 端口）
```

## 内容维护

新增项目只需编辑 `src/data/projects.ts`：追加一个 `Project` 对象即可，
首页卡片与详情页会自动生成。架构图用 Mermaid 源码内联在同文件的 `diagrams` 字段。
论文页内容集中在 `src/data/research.ts`。

## 说明

项目截图为系统实际运行界面，界面中的企业、医院、投标项目与人员信息均为虚构测试数据。
