# MonoTrack

**Language:** [中文](#中文) | [English](#english)

---

## 中文

MonoTrack 是一个在电脑本地运行的运动轨迹查看工具。你可以把 Strava、Garmin、手表或手机导出的轨迹文件导入进来，在一张地图上查看、筛选、对比和管理自己的运动路线。

你的轨迹数据默认保存在本机，不需要账号，也不需要上传到云端。

### 你可以用它做什么

- 导入 `GPX`、`FIT`、`TCX`、`GZ` 和 Strava 批量导出的 `ZIP` 文件。
- 在地图上查看多条跑步、骑行、徒步等轨迹。
- 按运动类型、日期和名称筛选轨迹。
- 单独查看一条轨迹，或多选几条轨迹一起对比。
- 查看距离、运动时长、均速、海拔和累计爬升。
- 重命名和删除已导入的轨迹。
- 下次打开时自动保留本地已导入的数据。

### 开始之前

你只需要先安装两个东西：

1. **Node.js 22.5 或更新版本**
   下载地址：[https://nodejs.org](https://nodejs.org)

2. **Python 3**
   下载地址：[https://www.python.org/downloads/](https://www.python.org/downloads/)

安装完成后，重新打开命令行窗口。

### 不懂 Git 怎么下载

如果你不知道 Git 是什么，可以这样做：

1. 打开项目页面：[https://github.com/Mukj1/MonoTrack](https://github.com/Mukj1/MonoTrack)
2. 点击绿色的 **Code** 按钮。
3. 点击 **Download ZIP**。
4. 解压这个 ZIP 文件。
5. 记住解压后的文件夹位置，例如：
   - Windows: `E:\model_dataset\gemini_app\MonoTrack`
   - macOS: `/Users/yourname/Downloads/MonoTrack`

### Windows 启动方式

打开 **PowerShell**，进入项目文件夹：

```powershell
cd "E:\model_dataset\gemini_app\MonoTrack"
```

如果你的文件夹位置不同，请把上面的路径换成你自己的路径。

第一次运行前，安装依赖：

```powershell
npm install
```

启动 MonoTrack：

```powershell
npm run dev
```

看到类似下面的文字就说明启动成功：

```text
MonoTrack local server: http://127.0.0.1:3000/
```

然后在浏览器打开：

```text
http://127.0.0.1:3000/
```

### macOS 启动方式

打开 **Terminal**，进入项目文件夹：

```bash
cd ~/Downloads/MonoTrack
```

如果你的文件夹位置不同，请把上面的路径换成你自己的路径。

第一次运行前，安装依赖：

```bash
npm install
```

启动 MonoTrack：

```bash
npm run dev
```

看到类似下面的文字就说明启动成功：

```text
MonoTrack local server: http://127.0.0.1:3000/
```

然后在浏览器打开：

```text
http://127.0.0.1:3000/
```

### 如果你会 Git

你也可以用命令下载：

```bash
git clone https://github.com/Mukj1/MonoTrack.git
cd MonoTrack
npm install
npm run dev
```

### 怎么停止

回到正在运行 MonoTrack 的命令行窗口，按：

```text
Ctrl + C
```

### 常见问题

**提示 `npm` 不是命令**
说明 Node.js 没有装好，或者安装后没有重新打开命令行。请重新安装 Node.js，然后重新打开 PowerShell 或 Terminal。

**提示 Python 相关错误**
MonoTrack 会尽量自动寻找 Python。即使 Python 增强步骤失败，基本导入和查看仍会继续工作。建议确认 Python 3 已安装，并重新打开命令行。

**浏览器打不开 `127.0.0.1:3000`**
确认命令行窗口里 `npm run dev` 还在运行。如果已经停止，请重新执行 `npm run dev`。

**想清空本地轨迹数据**
可以在应用里使用清空功能，也可以删除项目目录下的：

```text
data/monotrack.sqlite
```

---

## English

MonoTrack is a local activity track viewer for your own GPS workouts. Import files exported from Strava, Garmin, watches, or mobile apps, then view, filter, compare, and manage your routes on one map.

Your activity data stays on your computer by default. No account is required.

### What You Can Do

- Import `GPX`, `FIT`, `TCX`, `GZ`, and Strava bulk export `ZIP` files.
- View running, cycling, hiking, and other GPS tracks on one map.
- Filter tracks by sport type, date, and name.
- Focus on one track or compare multiple selected tracks.
- See distance, moving time, average speed, elevation, and estimated climbing gain.
- Rename and delete imported tracks.
- Keep imported tracks locally so you do not need to upload them again next time.

### Before You Start

Install these two tools first:

1. **Node.js 22.5 or newer**
   Download: [https://nodejs.org](https://nodejs.org)

2. **Python 3**
   Download: [https://www.python.org/downloads/](https://www.python.org/downloads/)

After installation, open a new terminal window.

### Download Without Git

If you do not know Git, use this simple download method:

1. Open the project page: [https://github.com/Mukj1/MonoTrack](https://github.com/Mukj1/MonoTrack)
2. Click the green **Code** button.
3. Click **Download ZIP**.
4. Unzip the file.
5. Remember the folder location, for example:
   - Windows: `E:\model_dataset\gemini_app\MonoTrack`
   - macOS: `/Users/yourname/Downloads/MonoTrack`

### Start on Windows

Open **PowerShell** and enter the project folder:

```powershell
cd "E:\model_dataset\gemini_app\MonoTrack"
```

If your folder is somewhere else, replace the path above with your own path.

Install dependencies the first time:

```powershell
npm install
```

Start MonoTrack:

```powershell
npm run dev
```

When you see this message, the app is running:

```text
MonoTrack local server: http://127.0.0.1:3000/
```

Open this address in your browser:

```text
http://127.0.0.1:3000/
```

### Start on macOS

Open **Terminal** and enter the project folder:

```bash
cd ~/Downloads/MonoTrack
```

If your folder is somewhere else, replace the path above with your own path.

Install dependencies the first time:

```bash
npm install
```

Start MonoTrack:

```bash
npm run dev
```

When you see this message, the app is running:

```text
MonoTrack local server: http://127.0.0.1:3000/
```

Open this address in your browser:

```text
http://127.0.0.1:3000/
```

### If You Use Git

You can download and start it with:

```bash
git clone https://github.com/Mukj1/MonoTrack.git
cd MonoTrack
npm install
npm run dev
```

### Stop the App

Go back to the terminal window running MonoTrack and press:

```text
Ctrl + C
```

### Common Questions

**`npm` is not recognized**
Node.js is probably not installed correctly, or the terminal was opened before installation. Reinstall Node.js, then open a new PowerShell or Terminal window.

**Python error appears**
MonoTrack will try to find Python automatically. If the Python enhancement step fails, basic importing and viewing can still continue. Installing Python 3 and reopening the terminal usually fixes it.

**`127.0.0.1:3000` does not open**
Make sure `npm run dev` is still running in the terminal. If it stopped, run `npm run dev` again.

**Clear local activity data**
Use the clear action inside the app, or delete this file:

```text
data/monotrack.sqlite
```
