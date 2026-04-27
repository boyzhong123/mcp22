/**
 * Chivox MCP 官网 · 服务端点统一配置
 *
 * 上线后「后端/MCP/FC 地址」都从这里读取，优先级：
 *   1. 构建/运行时的环境变量（NEXT_PUBLIC_*）
 *   2. 本文件定义的生产默认值
 *
 * 运维部署时只需要在 Netlify / 自建环境里覆盖 `NEXT_PUBLIC_API_BASE_URL` 等
 * 变量即可切换后端接口地址，不用改代码。
 *
 * 注意：
 *   - 以 NEXT_PUBLIC_ 开头的变量会被打进浏览器端 bundle。
 *   - 文档（docs 页面）里展示给用户复制的代码片段仍使用硬编码的生产 URL
 *     （见 PUBLIC_MCP_URL / PUBLIC_FC_URL 等常量），避免用户复制到错误地址。
 */

// ============================================================
// 生产环境默认地址（线上真实域名）
// ============================================================

/** MCP Streamable HTTP 服务地址（LLM / MCP 客户端连的远程地址） */
export const PUBLIC_MCP_URL = 'https://mcp.cloud.chivox.com';

/** Function Calling REST / WebSocket 服务地址 */
export const PUBLIC_FC_URL = 'https://fc.cloud.chivox.com';

/** Function Calling WebSocket 地址（wss） */
export const PUBLIC_FC_WS_URL = 'wss://fc.cloud.chivox.com';

/**
 * 文档里示例的"音频上传"地址。
 * 音频上传需要用户自己的 CDN / 对象存储，这里只是占位示例。
 */
export const PUBLIC_AUDIO_UPLOAD_PLACEHOLDER = 'https://your-audio-host.com/upload';

// ============================================================
// 运行时：后端接口地址（登录 / 密钥 / 计费等 Dashboard API）
// ============================================================

/**
 * 浏览器端固定走同域 `/api/*`，由 Next.js 服务端代理到真实后端地址。
 *
 * 好处：
 * - 运维只需要改服务器环境变量并重启服务即可（不必重新打包前端）
 * - 规避浏览器侧的 CORS 问题
 */
export function getApiBaseUrl(): string {
  return '/api';
}

// ============================================================
// 运行时：是否展示「English / Global」入口
// ============================================================

/**
 * 是否显示面向海外开发者的 /global 入口（首页浮层 + 登录页链接）。
 *
 * - `next dev`（NODE_ENV=development）默认显示，方便日常调试预览。
 * - `next build`（NODE_ENV=production）默认隐藏，线上不出现入口。
 * - 想在生产构建里临时预览 Global 入口，可设置：
 *     NEXT_PUBLIC_SHOW_GLOBAL_ENTRY=1
 */
export function isGlobalEntryVisible(): boolean {
  if (process.env.NEXT_PUBLIC_SHOW_GLOBAL_ENTRY === '1') return true;
  return process.env.NODE_ENV !== 'production';
}
