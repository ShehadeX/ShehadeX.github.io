#!/usr/bin/env node
/**
 * GitHub Pages 是纯静态托管，没有 SPA 的 history fallback。
 * 直接访问 /project/bidos 这类深链接会 404，因此需要：
 *   1. 为每个路由生成一个包含 index.html 的目录
 *   2. 生成 404.html，内容为跳转到 /404.html 的脚本
 * 两条路径都能让 Vue Router 正常接管。
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve(process.cwd(), 'dist')
const indexHtml = readFileSync(resolve(dist, 'index.html'), 'utf8')

const routes = [
  'research',
  'project/bidos',
  'project/cga-smart',
  'project/moca',
  'project/fupan',
  'project/polymed',
]

for (const route of routes) {
  const dir = resolve(dist, route)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, 'index.html'), indexHtml)
}

copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))

console.log(`[pages] generated ${routes.length} route fallbacks + 404.html`)
