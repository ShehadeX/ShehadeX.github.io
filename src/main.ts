import { createApp } from 'vue'
import './style.css'

/*
 * 字体自托管。
 *
 * 之前用 Google Fonts CDN，在这个网络环境下不可达（fonts.googleapis.com
 * 连通性失败），导致 --font-display / --font-mono 全部退回到系统字体，
 * Claude 衬线风格完全没生效。
 *
 * 改为通过 @fontsource 从本地 node_modules 引入，由 Vite 打包成 woff2
 * 并带上 hash 指纹，随站点一起部署 —— 不依赖任何外部 CDN。
 *
 * 只引入需要的子集与字重：
 * - latin：英文正文与展示标题
 * - latin-ext / vietnamese：欧语重音字符
 * - chinese-simplified：中文衬线（体积较大，按需）
 */

// ---- Source Serif 4：Claude 气质正文衬线（英文） ----
import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/400-italic.css'

// ---- Noto Serif SC：中文衬线，保证中英混排不掉回黑体 ----
import '@fontsource/noto-serif-sc/chinese-simplified-400.css'
import '@fontsource/noto-serif-sc/chinese-simplified-600.css'

// ---- JetBrains Mono：等宽，终端块与代码感排版 ----
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'

import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
