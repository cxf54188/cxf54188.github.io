/* =====================================================
   大九班快报 · 读者留言板（GitHub Issues 版）
   - 读取：公开读取仓库 Issues，不需要任何 Token
   - 提交：跳转到 GitHub 新建 Issue 页面（带预填内容）
   - 安全：代码中不含任何密钥，Token 不会泄露
   ===================================================== */

(function () {
  'use strict';

  var REPO = 'cxf54188/cxf54188.github.io';   // 仓库（所有者/仓库名）
  var LABEL = 'guestbook';                    // 留言标签（在 GitHub 端方便管理）

  var form    = document.getElementById('gbForm');
  var nameI   = document.getElementById('gbName');
  var textI   = document.getElementById('gbText');
  var hint    = document.getElementById('gbHint');
  var list    = document.getElementById('gbList');
  var countEl = document.getElementById('gbCount');
  var counter = document.getElementById('gbCounter');
  var refresh = document.getElementById('gbRefresh');
  var avatar  = document.getElementById('gbAvatar');

  var AVATAR_COLORS = ['#5b2a8a', '#7b3fa8', '#8e5cc7', '#6a3d9a', '#4a2470', '#9b6fd4'];

  /* ---------- 工具函数 ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // 由名字生成稳定的头像颜色
  function colorOf(name) {
    var sum = 0;
    for (var i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
  }

  // 取头像显示文字（中文取首字，英文取首字母）
  function initialOf(name) {
    if (!name) return '?';
    var first = name.trim().charAt(0);
    return /[a-zA-Z]/.test(first) ? first.toUpperCase() : first;
  }

  // 相对时间
  function timeAgo(dateStr) {
    var t = new Date(dateStr).getTime();
    if (isNaN(t)) return '';
    var diff = Date.now() - t;
    var min = 60000, hour = 3600000, day = 86400000;
    if (diff < min) return '刚刚';
    if (diff < hour) return Math.floor(diff / min) + ' 分钟前';
    if (diff < day) return Math.floor(diff / hour) + ' 小时前';
    if (diff < day * 7) return Math.floor(diff / day) + ' 天前';
    var d = new Date(t);
    return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
  }

  // 从 Issue 标题中解析昵称（格式：“昵称：留言摘要”）
  function nameOf(issue) {
    var title = issue.title || '';
    var m = title.split(/[：:]/);
    var n = (m.length > 1 ? m[0] : title).trim();
    return n.length > 20 ? n.slice(0, 20) : (n || '匿名同学');
  }

  /* ---------- 渲染 ---------- */
  function renderLoading() {
    list.innerHTML =
      '<div class="gb-loading">' +
        '<span class="gb-loading__dot"></span>' +
        '<span class="gb-loading__dot"></span>' +
        '<span class="gb-loading__dot"></span>' +
        '<span class="gb-loading__text">正在加载留言……</span>' +
      '</div>';
  }

  function renderEmpty() {
    countEl.textContent = '0';
    list.innerHTML =
      '<div class="gb-empty">' +
        '<div class="gb-empty__icon">📝</div>' +
        '<div class="gb-empty__title">还没有留言</div>' +
        '<div class="gb-empty__sub">来当第一个留下感受的人吧～</div>' +
      '</div>';
  }

  function renderError(msg) {
    list.innerHTML =
      '<div class="gb-error">' + esc(msg || '留言加载失败') +
        '<br><button type="button" id="gbRetry">重试</button>' +
      '</div>';
    var btn = document.getElementById('gbRetry');
    if (btn) btn.addEventListener('click', load);
  }

  function renderList(issues) {
    countEl.textContent = issues.length;

    if (!issues.length) { renderEmpty(); return; }

    var html = '';
    issues.forEach(function (issue, i) {
      var name = nameOf(issue);
      var text = issue.body || '（这条留言没有正文）';
      var floor = issues.length - i;   // 最新的楼层号最大
      html +=
        '<div class="gb-card">' +
          '<div class="gb-card__avatar" style="background:' + colorOf(name) + '">' + esc(initialOf(name)) + '</div>' +
          '<div class="gb-card__body">' +
            '<div class="gb-card__head">' +
              '<span class="gb-card__name">' + esc(name) + '</span>' +
              '<span class="gb-card__floor">#' + floor + '</span>' +
              '<span class="gb-card__time">' + timeAgo(issue.created_at) + '</span>' +
            '</div>' +
            '<div class="gb-card__text">' + esc(text) + '</div>' +
          '</div>' +
        '</div>';
    });
    list.innerHTML = html;
  }

  /* ---------- 加载留言 ---------- */
  function load() {
    renderLoading();
    if (refresh) refresh.disabled = true;

    fetch('https://api.github.com/repos/' + REPO + '/issues?state=all&per_page=100', {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        // 过滤：排除 Pull Request，只保留真正的留言
        var msgs = (data || []).filter(function (it) { return !it.pull_request; });
        // 按时间倒序（最新在前）
        msgs.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
        renderList(msgs);
      })
      .catch(function (e) {
        renderError('留言加载失败：' + (e && e.message ? e.message : '网络错误'));
      })
      .then(function () {
        if (refresh) refresh.disabled = false;
      });
  }

  /* ---------- 提交留言（跳转 GitHub 新建 Issue） ---------- */
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hint.className = 'gb-hint';

      var name = (nameI.value || '').trim();
      var text = (textI.value || '').trim();

      if (!name) { hint.classList.add('error'); hint.textContent = '请填写你的名字～'; nameI.focus(); return; }
      if (!text) { hint.classList.add('error'); hint.textContent = '留言内容不能为空哦～'; textI.focus(); return; }
      if (text.length > 300) { hint.classList.add('error'); hint.textContent = '内容超出 300 字啦。'; return; }

      var title = name + '：' + text.slice(0, 30);
      var url = 'https://github.com/' + REPO + '/issues/new' +
                '?title=' + encodeURIComponent(title) +
                '&body=' + encodeURIComponent(text) +
                '&labels=' + encodeURIComponent(LABEL);

      window.open(url, '_blank');

      hint.classList.add('ok');
      hint.textContent = '已在新标签页打开留言表单，在 GitHub 点「Submit new issue」提交后，回来点「刷新」即可看到～';
      textI.value = '';
      updateCounter();
    });
  }

  /* ---------- 字数统计 + 头像随名字变化 ---------- */
  function updateCounter() {
    if (!counter) return;
    var len = (textI.value || '').length;
    counter.textContent = len + ' / 300';
    counter.classList.toggle('warn', len > 280);
  }

  if (textI) textI.addEventListener('input', updateCounter);

  if (nameI) nameI.addEventListener('input', function () {
    var n = (nameI.value || '').trim();
    if (avatar) {
      avatar.textContent = n ? initialOf(n) : '✎';
      avatar.style.background = n ? colorOf(n) : 'var(--purple)';
    }
  });

  /* ---------- 刷新按钮 ---------- */
  if (refresh) refresh.addEventListener('click', load);

  /* ---------- 初始化 ---------- */
  updateCounter();
  load();
})();
