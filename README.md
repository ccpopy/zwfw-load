# zwfw-load

代理负载均衡管理系统。当前版本已从单体 Node.js 服务重构为 Tauri v2 桌面应用：后端核心由 Rust 实现，前端由 React、Vite、shadcn/ui 和 lucide-react 构建，旧 Node.js 实现仅作为 legacy 入口保留。

## 项目现状

- 桌面壳：Tauri v2
- 后端服务：Rust、Axum、Tokio、rusqlite
- 前端界面：React、Vite、TypeScript、shadcn/ui、lucide-react、Recharts
- 数据存储：SQLite，本地持久化代理、分组、DNS 映射、设置和请求日志
- 代理协议：HTTP、HTTPS、SOCKS4、SOCKS5
- 默认管理 API 端口：`3333`
- 默认代理服务端口：`5678`

Tauri 启动后会同时拉起两个本地服务：管理 API 服务和代理转发服务。前端在 Tauri 环境中通过 `get_service_info` 获取真实端口；浏览器开发模式下默认访问 `http://127.0.0.1:3333`。

## 功能

- 代理配置管理：新增、编辑、删除、启用、停用和连通性测试。
- DNS 映射：按域名覆盖解析结果。
- 代理分组：按域名规则选择代理组，支持默认分组。
- 负载设置：支持 `adaptive`、`weighted_round_robin`、`least_connections`、`sticky_host`。
- 高级配置：代理端口、日志保留、连接池、熔断器、快速失败等运行参数。
- 系统状态：请求趋势、响应耗时、代理使用排行、目标资源排行。
- 流量日志：分页查看请求日志，支持清空日志。
- 实时刷新：通过 WebSocket 推送代理、DNS、分组和请求日志变化。
- 主题：shadcn Teal 色系，支持亮色和暗色切换。

## 目录结构

```text
zwfw-load/
├── src-tauri/                 # Tauri 和 Rust 后端
│   ├── src/
│   │   ├── api.rs             # 管理 API 和 WebSocket
│   │   ├── database.rs        # SQLite schema、迁移和数据访问
│   │   ├── proxy.rs           # 代理服务、负载均衡、连接池和熔断器
│   │   ├── proxy_tester.rs    # 代理连通性测试
│   │   ├── state.rs           # 应用状态和服务启动参数
│   │   └── version.rs         # 版本信息
│   ├── Cargo.toml
│   └── tauri.conf.json
├── web/                       # React 前端
│   ├── src/
│   │   ├── App.tsx            # 主界面和业务交互
│   │   ├── components/ui/     # shadcn/ui 组件
│   │   ├── lib/api.ts         # API 和 WebSocket 地址封装
│   │   ├── styles.css         # Tailwind v4 主题变量
│   │   └── types.ts           # 前端类型定义
│   └── vite.config.ts
├── public/                    # 旧 Node.js 前端静态文件，legacy 保留
├── src/                       # 旧 Node.js 后端模块，legacy 保留
├── app.js                     # 旧 Node.js 服务入口，legacy 保留
├── .github/workflows/         # GitHub Actions 发布工作流
├── package.json
└── README.md
```

## 环境要求

- Node.js `>= 20`
- Rust stable
- Windows：需要 WebView2 Runtime，通常 Windows 10/11 已内置或可由 Tauri 安装流程处理。
- macOS：需要 Xcode Command Line Tools。
- Linux：构建 Tauri 需要 WebKitGTK 等系统依赖。

Ubuntu 22.04 示例：

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

## 安装依赖

```bash
npm install
```

CI 环境建议使用：

```bash
npm ci
```

## 开发

启动 Tauri 桌面应用：

```bash
npm start
```

等价于：

```bash
npm run tauri:dev
```

仅启动前端 Vite 开发服务：

```bash
npm run dev
```

注意：单独运行 `npm run dev` 只启动前端，仍需要有管理 API 服务在 `3333` 端口运行，否则页面无法读取代理、日志和统计数据。

## 构建

只构建前端：

```bash
npm run build:web
```

检查 Rust 后端：

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

构建桌面安装包：

```bash
npm run tauri:build
```

Windows 构建完成后，产物通常位于：

```text
src-tauri/target/release/bundle/msi/
src-tauri/target/release/bundle/nsis/
```

## 发布工作流

仓库包含 tag 触发的 GitHub Actions workflow：

```text
.github/workflows/release.yml
```

触发规则：

```text
v*
```

例如推送 `v1.2.3` tag 后，会在 GitHub Actions 中构建：

- Linux x64
- Windows x64
- macOS Apple Silicon
- macOS Intel

workflow 会创建 draft release，并上传 Tauri bundle 和 workflow artifacts。当前提交不会触发发布，只有推送匹配规则的 tag 才会触发。

## 运行端口和配置

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3333` | 管理 API 端口 |
| `PROXY_PORT` | `5678` | 首次初始化代理服务端口 |
| `proxy_port` | `5678` | 高级配置中的代理端口，保存于 SQLite |
| `periodic_test_interval` | `300000` | 定期测试间隔，单位毫秒 |
| `log_retention_days` | `7` | 请求日志保留天数 |
| `stats_retention_days` | `30` | 统计数据保留天数 |
| `pool_max_size` | `50` | 连接池最大连接数 |
| `circuit_failure_threshold` | `5` | 熔断失败阈值 |
| `failfast_enabled` | `true` | 是否启用快速失败 |

部分高级配置保存后需要重启应用才能完全生效，尤其是代理服务端口。

## 管理 API

### 代理

```http
GET    /api/proxies
POST   /api/proxies
PUT    /api/proxies/{id}
DELETE /api/proxies/{id}
PUT    /api/proxies/{id}/priority
POST   /api/proxies/{id}/test
POST   /api/proxies/priorities
```

### DNS 映射

```http
GET    /api/dns-mappings
POST   /api/dns-mappings
PUT    /api/dns-mappings/{id}
DELETE /api/dns-mappings/{id}
PUT    /api/dns-mappings/{id}/toggle
```

### 代理分组

```http
GET    /api/proxy-groups
POST   /api/proxy-groups
PUT    /api/proxy-groups/{id}
DELETE /api/proxy-groups/{id}
```

### 设置和高级配置

```http
GET  /api/settings
POST /api/settings
GET  /api/advanced-config
POST /api/advanced-config
POST /api/advanced-config/reset
GET  /api/advanced-config/export
GET  /api/test-urls
```

### 统计和日志

```http
GET    /api/stats/overview
GET    /api/stats/hourly
GET    /api/stats/proxy-usage
GET    /api/stats/targets
GET    /api/stats/failed-targets
GET    /api/stats/circuit-breakers
GET    /api/stats/connection-pools
GET    /api/traffic-logs?page=1&page_size=25
DELETE /api/traffic-logs
GET    /api/version
```

### WebSocket

```text
ws://127.0.0.1:3333/ws
```

用于推送代理、DNS、分组、测试结果和请求日志变化。

## 数据库

当前版本使用 SQLite。主要表包括：

- `proxies`：代理配置、状态、测试结果和优先级。
- `settings`：负载算法、运行配置和高级配置。
- `dns_mappings`：域名到 IP 的映射规则。
- `proxy_groups`：代理分组。
- `proxy_group_domains`：分组域名规则。
- `proxy_group_members`：分组成员代理。
- `request_logs`：请求流量日志。
- `load_stats`：负载统计数据。

Rust 后端启动时会自动创建表，并补齐缺失字段。

## 旧 Node.js 入口

旧实现仍保留在 `app.js`、`src/` 和 `public/` 中，用于对照和兼容验证：

```bash
npm run legacy:start
npm run legacy:dev
```

当前推荐入口是 Tauri：

```bash
npm start
```

## 质量检查

常用检查命令：

```bash
npm run build:web
cargo check --manifest-path src-tauri/Cargo.toml
```

完整打包检查：

```bash
npm run tauri:build
```

## 许可证

以仓库根目录 `LICENSE` 文件为准。
