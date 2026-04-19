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

最小可用只需要安装 **Node.js**：

- **Node.js 22.5 或更新版本**

下载地址：[https://nodejs.org](https://nodejs.org)

安装完成后，重新打开命令行窗口。

Git 不是必需项。不会 Git 的用户用 ZIP 下载即可；已经安装 Git 的用户，可以看后面的可选命令方式。Python 3 也不是启动必需项；没有 Python 时，MonoTrack 仍然可以导入和查看轨迹，只是部分统计增强会跳过。

### 下载项目

推荐普通用户直接下载 ZIP：

1. 打开项目页面：[https://github.com/Mukj1/MonoTrack](https://github.com/Mukj1/MonoTrack)
2. 点击绿色的 **Code** 按钮。
3. 点击 **Download ZIP**。
4. 解压这个 ZIP 文件。
5. 记住解压后的文件夹位置，例如：
   - Windows: `C:\Users\YourName\Downloads\MonoTrack`
   - macOS: `/Users/YourName/Downloads/MonoTrack`

### Windows 启动方式

打开 **PowerShell**，进入项目文件夹：

```powershell
cd "C:\Users\YourName\Downloads\MonoTrack"
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

### 可选：如果你会 Git

如果你已经安装 Git，也可以用命令下载。不会 Git 的用户可以忽略这一段：

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
可以先忽略。Python 只是统计增强用的可选工具，基本导入和查看仍会继续工作。想补上增强统计时，再安装 Python 3 即可。

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

For the minimum working setup, install **Node.js** only:

- **Node.js 22.5 or newer**

Download: [https://nodejs.org](https://nodejs.org)

After installation, open a new terminal window.

Git is not required. If you do not know Git, use the ZIP download method. If you already have Git installed, you can use the optional command-line method below. Python 3 is also optional; without Python, MonoTrack can still import and view tracks, while some statistics enhancement will be skipped.

### Download the Project

For most users, downloading the ZIP is the easiest way:

1. Open the project page: [https://github.com/Mukj1/MonoTrack](https://github.com/Mukj1/MonoTrack)
2. Click the green **Code** button.
3. Click **Download ZIP**.
4. Unzip the file.
5. Remember the folder location, for example:
   - Windows: `C:\Users\YourName\Downloads\MonoTrack`
   - macOS: `/Users/YourName/Downloads/MonoTrack`

### Start on Windows

Open **PowerShell** and enter the project folder:

```powershell
cd "C:\Users\YourName\Downloads\MonoTrack"
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

### Optional: If You Use Git

If you already have Git installed, you can download and start it with the commands below. If you do not know Git, skip this section:

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
You can ignore it at first. Python is only used for optional statistics enhancement. Basic importing and viewing still work. Install Python 3 later if you want the enhancement step.

**`127.0.0.1:3000` does not open**
Make sure `npm run dev` is still running in the terminal. If it stopped, run `npm run dev` again.

**Clear local activity data**
Use the clear action inside the app, or delete this file:

```text
data/monotrack.sqlite
```
