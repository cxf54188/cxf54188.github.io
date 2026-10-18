# 大九班快报 · 南渝中学秋季田径运动会特刊

初二（9）班伍仁组出品的新闻专题网页。可部署到 GitHub Pages。

## 目录结构

```
大九班快报/
├── index.html        # 主页
├── style.css         # 样式（青莲紫主题）
├── app.js            # 灯箱、进度条、滚动动画
├── guestbook.js      # 留言板
├── messages.json     # 留言数据（全员共享，人人可见）
├── images/           # 9 张正文配图 + 画廊图
│   ├── lead.jpg      # 开幕式舞龙
│   ├── parade.jpg    # 入场式方阵
│   ├── dance.jpg     # 特色舞蹈
│   ├── relay.jpg     # 迎面穿梭接力
│   ├── zhang100.jpg  # 张竞元 100 米
│   ├── jiang1000.jpg # 蒋泓宇 1000 米
│   ├── jiang400.jpg  # 江科毅 400 米
│   ├── mou400.jpg    # 牟鸿睿 400 米
│   └── truth.jpg     # 真心话大冒险
└── backend/
    └── guestbook.py  # 追加留言到 messages.json
```

## 本地预览

双击 `index.html` 即可用浏览器打开。

**推荐**：用 VS Code 的 Live Server 打开，可避免 `file://` 协议下留言板无法读取
`messages.json` 的问题（此时留言只能存本机）。

## 部署到 GitHub Pages

1. 新建仓库（如 `djbfp`），把整个文件夹 push 上去。
2. 仓库 Settings → Pages → Source 选 `main` 分支 `/root`，保存。
3. 等待约 1 分钟，访问 `https://<你的用户名>.github.io/<仓库名>/` 即可。

## 关于留言板「人人都能看到」

`messages.json` 是公开文件，**任何人打开页面都能看到里面的全部留言**。

### 三种提交方案

| 方案 | 能否自助发言 | 成本 | 说明 |
|------|------------|------|------|
| A 纯静态（默认） | ❌ | 0 | 同学把想说的发你，你跑下方脚本追加后 push |
| B Waline | ✅ | 免费 | 独立评论系统，5 分钟接入 |
| C Giscus | ✅ | 免费 | 基于 GitHub Discussions，零服务器 |

### 方案 A：追加留言（无需服务器）

```bash
python3 backend/guestbook.py add "昵称" "留言内容"
```

例如：

```bash
python3 backend/guestbook.py add "黄诗情" "运动会太燃了！"
```

脚本会自动写入 `messages.json`，push 后全员可见。

### 方案 B / C：自助发言

如需同学自己发留言，可接入 Waline 或 Giscus。详见：
- Waline：https://waline.js.org/
- Giscus：https://giscus.app/

接入后在 `guestbook.js` 中替换渲染逻辑即可，HTML 结构无需改动。

## 图片对应表

| 板块 | 图片文件 | 内容 |
|------|---------|------|
| 头条 · 主图 | lead.jpg | 开幕式舞龙 |
| 头条 · 侧栏 | parade.jpg | 入场式方阵 |
| 头条 · 侧栏 | dance.jpg | 特色舞蹈 |
| 焦点 · 配图 | relay.jpg | 迎面穿梭接力 |
| 赛场直击 | jiang1000.jpg | 蒋泓宇 1000 米 |
| 赛场直击 | jiang400.jpg | 江科毅 400 米 |
| 赛场直击 | mou400.jpg | 牟鸿睿 400 米 |
| 现场声音 | zhang100.jpg | 张竞元 100 米 |
| 场边 | truth.jpg | 真心话大冒险 |
| 精彩瞬间 | 以上 9 张全部展示 | — |

## 更换图片

把同名文件替换到 `images/` 目录即可，无需改动代码。建议压缩到 200KB 以内以加快加载。
