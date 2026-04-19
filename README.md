# MonoTrack

MonoTrack is a local-first activity track viewer for comparing running, cycling, hiking, skiing, water sports, and other GPS activities on one map. It supports common exported workout files, renders tracks with MapLibre GL, and stores imported activities locally so you do not need to re-upload them every time you open the app.

## Features

- Import `.gpx`, `.fit`, `.tcx`, `.gz`, and Strava bulk export `.zip` files.
- View multiple GPS tracks on a clean, low-distraction map.
- Filter activities by sport type and date range.
- Search tracks by name.
- Select one track to isolate it on the map.
- Use multi-select mode to show, hide, or delete selected tracks.
- Rename imported tracks from the sidebar.
- Display distance, elapsed duration, moving-time average speed, elevation range, and estimated elevation gain.
- Store imported activities in a local SQLite database through the bundled Node/Express backend.
- Recompute activity statistics with a small Python enhancement step before storage.
- Switch between Chinese and English UI labels.

## Tech Stack

- React 19
- Vite
- TypeScript
- MapLibre GL
- Express local backend
- SQLite local storage
- Python 3 activity-stat enhancement
- `fit-file-parser` for FIT files
- `fflate` for ZIP/GZ extraction
- Tailwind CDN utilities

## Getting Started

Requirements:

- Node.js 22.5 or newer, because the local backend uses Node's built-in SQLite module.
- Python 3, used by the local activity-stat enhancement script. MonoTrack tries `python3`, `python`, and Windows `py -3`; set `PYTHON` if your interpreter uses a custom path.

Install dependencies:

```bash
npm install
```

Start the local app and backend:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:3000/
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Local Data

Imported activities are saved to:

```text
data/monotrack.sqlite
```

This file is intentionally ignored by Git because it contains personal activity data and can become large. To reset local data, delete `data/monotrack.sqlite` or use the app's clear-all action.

## Notes

- Average speed is calculated from detected moving time, while duration keeps the full elapsed time between the first and last track points.
- Elevation gain is estimated from file-provided altitude samples and recomputed by the local Python enhancer before storage. It may still differ from Strava, Garmin, or other platforms because those services may apply map elevation correction, barometric calibration, smoothing, or proprietary filtering.
- The default map source does not require an API key.
- Build output in `dist/`, dependencies in `node_modules/`, and local activity data are not required in source control.

---

# MonoTrack 中文说明

MonoTrack 是一个本地优先的运动轨迹查看工具，用于在同一张地图上对比跑步、骑行、徒步、滑雪、水上运动等 GPS 活动。它支持常见运动导出文件，使用 MapLibre GL 渲染轨迹，并通过本地后端保存已导入活动，因此再次打开时不需要重新上传。

## 功能

- 导入 `.gpx`、`.fit`、`.tcx`、`.gz` 和 Strava 批量导出 `.zip` 文件。
- 在干净、低干扰的地图上查看多条 GPS 轨迹。
- 按运动类型和日期范围筛选活动。
- 按名称搜索轨迹。
- 单选轨迹时，地图只显示当前选中的轨迹。
- 多选模式下可显示、隐藏或批量删除所选轨迹。
- 可在侧边栏重命名已导入轨迹。
- 显示距离、总经过时长、移动均速、海拔范围和估算累计爬升。
- 通过内置 Node/Express 后端把导入活动保存到本地 SQLite 数据库。
- 保存前通过一个轻量 Python 增强步骤重新计算活动统计数据。
- 支持中文和英文界面标签切换。

## 技术栈

- React 19
- Vite
- TypeScript
- MapLibre GL
- Express 本地后端
- SQLite 本地存储
- Python 3 活动统计增强
- `fit-file-parser` 解析 FIT 文件
- `fflate` 解压 ZIP/GZ 文件
- Tailwind CDN 工具类

## 本地运行

前置要求：

- Node.js 22.5 或更新版本，因为本地后端使用 Node 内置 SQLite 模块。
- Python 3，用于本地活动统计增强脚本。MonoTrack 会尝试 `python3`、`python` 和 Windows 的 `py -3`；如果你的解释器路径特殊，可以设置 `PYTHON`。

安装依赖：

```bash
npm install
```

启动本地应用和后端：

```bash
npm run dev
```

打开：

```text
http://127.0.0.1:3000/
```

构建生产版本：

```bash
npm run build
```

预览生产构建：

```bash
npm run preview
```

## 本地数据

导入后的活动会保存到：

```text
data/monotrack.sqlite
```

该文件已被 Git 忽略，因为它包含个人运动数据，并且可能非常大。若要重置本地数据，可以删除 `data/monotrack.sqlite`，也可以在应用中使用清空操作。

## 说明

- 均速按检测到的移动时间计算；时长仍保留第一和最后一个轨迹点之间的总经过时间。
- 累计爬升基于文件中的海拔采样估算，并会在保存前由本地 Python 增强脚本重新计算；它仍可能与 Strava、Garmin 等平台不同，因为这些平台可能会使用地图海拔校正、气压计校准、平滑或私有过滤算法。
- 默认地图源不需要 API key。
- `dist/` 构建产物、`node_modules/` 依赖目录和本地活动数据都不需要提交到源码仓库。
