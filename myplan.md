# OpenPi 中文整合版计划

## 项目目标

基于 OpenPi 二次开发一个面向中文用户的 Pi 桌面整合包，让用户下载并安装后即可使用 Pi 的核心能力，不需要先理解 TUI、手动编辑 JSON、额外安装 Pi CLI，或自行研究国内 AI provider 的接入方式。

核心定位是：

- 内置 OpenPi 桌面工作台。
- 内置 Pi 核心 runtime/SDK 与基础依赖。
- 内置中文界面、中文 onboarding、中文错误诊断。
- 内置国内 AI provider 接入向导。
- 内置基础工作台能力和默认配置。
- 允许用户后续在线安装额外 package、extension、skill、theme。

一句话目标：

> 核心能力随安装包交付，扩展能力保持在线可选。

## 产品边界

本项目不是重新实现 Pi agent，也不是 fork Pi runtime 后另起一套生态。OpenPi 仍然作为桌面 UI 和工作台底座，Pi SDK/runtime 继续负责 agent loop、session、model/provider、extension/package 等核心语义。

第一阶段不追求完全离线生态包。安装包需要做到首次启动和核心使用不依赖用户额外拉取关键依赖，但高级 package、extension、模型列表刷新、在线更新可以作为可选增强能力。

## 第一阶段能力

1. 中文界面与首次启动流程
   - 提供中文 onboarding。
   - 引导用户选择 workspace。
   - 引导用户选择 AI 服务商。
   - 避免用户直接接触 `auth.json`、`models.json` 等底层配置文件。

2. 国内 provider wizard
   - 预置 DeepSeek、Kimi、智谱/ZAI、MiniMax、通义/Qwen 兼容接口、硅基流动、火山方舟、百炼等常见服务商。
   - 支持输入 API Key、Base URL、默认模型。
   - 支持自动测试连通性。
   - 支持拉取 `/v1/models` 或使用静态推荐模型列表。
   - 支持中文错误解释，例如 Key 错误、余额不足、Base URL 错误、模型不存在、网络不可达。

3. 配置写入
   - 将用户选择写入 Pi 兼容的 auth/model 配置。
   - 优先复用 Pi SDK 现有的 `AuthStorage`、`ModelRegistry` 或 OpenPi 已有设置体系。
   - 不在 renderer 中直接处理敏感凭据，遵循 OpenPi 现有 Electron main / preload / renderer 边界。

4. 整合包发行
   - 固定 OpenPi、Pi SDK、Electron、native modules 的版本。
   - 使用现有 `electron-builder` 打包能力。
   - 处理 `better-sqlite3`、`node-pty` 等 native modules 的平台 rebuild/unpack。
   - 将 provider preset、中文帮助、默认配置模板打入 app resources。

5. 扩展能力
   - 保留 OpenPi package/customization 方向。
   - 默认内置一组基础能力。
   - 允许用户后续在线安装额外 package、extension、skill、prompt、theme。

## 技术路线

主线选择 OpenPi，因为它更适合作为桌面工作台和 provider 配置中心：

- Electron + SolidJS 的前端工程更适合快速做中文 UI 和设置向导。
- Electron main 已经承担 filesystem、PTY、Git、SQLite、secrets 等 OS 能力。
- OpenPi 通过 `@earendil-works/pi-coding-agent` 接入 Pi 核心能力，不需要重写 agent。
- ROADMAP 中已有 customizations、packages、settings、onboarding 等方向，适合扩展 provider wizard。

Pi Studio 作为参考对象：

- 参考它的 embedded runtime、无需终端、开箱即用体验。
- 不把它作为第一阶段主线，因为 provider/credential 管理需要补较多桌面 UI 与配置写入能力。

## 初始里程碑

### M0: 项目启动

- 克隆 OpenPi 仓库。
- 阅读 `README.md`、`ROADMAP.md`、`DESIGN.md`、`package.json`。
- 梳理 Electron main、preload、renderer、Pi SDK 接入点。
- 确认设置页、customizations、auth/model 配置相关代码位置。

### M1: Provider Wizard 原型

- 新增中文 provider preset 数据结构。
- 做一个最小可用的 provider 选择与 API Key 输入界面。
- 支持写入本地配置。
- 支持最基础的连通性测试。

### M2: 中文化与 onboarding

- 建立 i18n 结构。
- 翻译核心导航、设置、错误、onboarding。
- 首次启动时引导用户完成 provider 配置。

### M3: 整合包验证

- 跑通本地开发环境。
- 跑通 Electron 打包。
- 验证 Windows/macOS/Linux 的 native module 处理策略。
- 验证首次启动不依赖额外拉取核心依赖。

## 当前下一步

先从源码结构入手，找到以下入口：

- OpenPi 如何启动 Pi SDK。
- Model/provider/auth 配置在哪里读写。
- Settings/customizations 页面如何组织。
- Electron IPC 和 secret storage 的边界。
- 打包配置如何包含 app resources。

然后优先实现一个窄切片：

> 在设置页或 onboarding 中选择 DeepSeek，输入 API Key，测试连通性，并写入 Pi 可识别配置。
