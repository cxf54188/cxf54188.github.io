games.zip  ·  A 结构（每个游戏一个文件夹）
============================================

解压后得到 10 个文件夹，每个文件夹里是 index.html。
把它们全部拖进 GitHub 网页端的 blog/games/ 即可：

  blog/games/qq-speed/index.html
  blog/games/chainburst/index.html
  blog/games/loopburst/index.html
  blog/games/gravitypen/index.html
  blog/games/bubblesweep/index.html
  blog/games/ghostwave/index.html
  blog/games/mirror/index.html
  blog/games/echostorm/index.html
  blog/games/cascade/index.html
  blog/games/graze/index.html

重要：用这个包，blog/game/index.html 里要把
  const FLAT = true;
改成
  const FLAT = false;

注意：GitHub 网页端拖拽"文件夹"上传时，部分浏览器会把
文件平铺、丢掉子目录。如果出现这种情况，改用 games-flat.zip
（10 个 xxx.html 平铺，一次全选拖进 blog/games/，大厅保持 FLAT = true）。

本包内 10 个 html 均为原文件原样复制，未改动任何游戏代码。
