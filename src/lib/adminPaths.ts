/** Obscure admin UI prefix (see D:\proj\GITREPO\ADMIN-PATHS.md — local only). */
export const ADMIN_UI_PREFIX = 'y8m4k2n7'

export const BLOG_ADMIN_PATH = `/${ADMIN_UI_PREFIX}/blog`
export const DIGITAL_PRODUCTS_ADMIN_PATH = `/${ADMIN_UI_PREFIX}/digital-products`

export function isAdminUiPath(path: string): boolean {
  return path === `/${ADMIN_UI_PREFIX}` || path.startsWith(`/${ADMIN_UI_PREFIX}/`)
}
