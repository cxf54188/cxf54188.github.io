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

当前采用 **GitHub Issues 方案**：留言 = 仓库里的 Issue。

### 原理

| 操作 | 实现方式 |
|---|---|
| 查看留言 | 前端公开读取仓库 Issues（无需 Token） |
| 发表留言 | 跳转到 GitHub 新建 Issue 页面，提交后自动出现在页面 |

### 为什么安全

代码中**不包含任何 Token 或密钥**。读取用的是 GitHub 公开 API，
提交走的是 GitHub 官方新建 Issue 页面，不需要在网页里暴露身份凭证。

### 留言板功能

- 顶部导航「✍ 留言」一键跳转
- 实时统计留言条数
- 卡片式展示：彩色头像（按名字自动生成）、昵称、楼层号、相对时间（刚刚 / X 分钟前 / X 天前）
- 字数统计（0 / 300，超 280 变红提示）
- 一键刷新（加载中带动画）
- 空状态 / 加载失败重试

### 管理留言

所有留言都在仓库的 **Issues** 里，带 `guestbook` 标签。
在 GitHub 上可以删除、编辑、回复任意一条留言。

### （可选）自动回复

如果希望留言提交后自动回复一条确认，在仓库加 `.github/workflows/guestbook.yml`，
Token 放在 Settings → Secrets 里（变量名可叫 `BLOG_NEWS_TOKEN` 等任意名字），
这样 Token 也不会出现在网页代码中。

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
