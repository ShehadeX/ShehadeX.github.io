/**
 * 静态资源基址。
 * GitHub Pages 部署在子路径 (/shehade.github.io/)，public/ 下的图片与 PDF
 * 不会被打包器重写，必须在运行时显式拼接 BASE_URL。
 */
export const ASSET_BASE = import.meta.env.BASE_URL

export const asset = (path: string) => {
  const clean = path.replace(/^\/+/, '')
  return `${ASSET_BASE}${clean}`
}
