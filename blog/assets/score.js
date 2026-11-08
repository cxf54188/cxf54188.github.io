/* ===== 通用成绩上报组件 score.js  v4 =====
   调用（游戏结算时）：
     ScoreBridge.submit({
       game:'qq-speed', name:'飞车 3D',
       mode:'道具模式', track:'11城', rule:'一路狂飙',   // 本局实际值，由游戏读取
       score:133450, unit:'ms', better:'low',
       show:'02:13.45', detail:'第1名 · 3圈'
     });

   v4 规则：
     · 玩家名字 = GitHub 登录名，自动获取，面板里不可编辑
     · 模式 / 赛道 / 规则 = 游戏传进来的「当前这一局」，不可编辑
     · 已登录：点一次直接在页面内创建 Issue，不跳转、不弹确认框
     · 未登录：弹一次性 GitHub 登录，登录完自动把这一局交上去

   登录方式：GitHub 经典访问令牌（classic PAT，勾选 public_repo）。
     纯静态页无法完成 OAuth 令牌交换（GitHub 的 token 端点不允许浏览器
     跨域，且必须服务端保管 client_secret），所以用「一次性粘贴令牌」。
     令牌只存在访客本机 localStorage，不写入仓库、不发给任何第三方，
     访客随时可以在 GitHub → Settings → Developer settings 里撤销。

   可选后端：把 SCORE_API 填成你自己的 /submit 地址，会优先 POST 到后端，
     那种模式下连本机令牌都不需要（可换成真·OAuth 弹窗授权）。

   数据协议（一条成绩 = 一个 open issue，与排行榜页完全对齐）：
     title : Leaderboard: <game> / <榜单名> - <player> - <score>
     body  : Game / Name / Mode / Track / Rule / Player / Score / Show /
             Unit / Better / Detail / Submitted at
     label : leaderboard（标签不存在时自动降级为无标签，靠标题前缀识别）
============================================================ */
(function () {
  'use strict';

  var OWNER = 'cxf54188';
  var REPO  = 'cxf54188.github.io';
  var LB_URL = '/blog/games/leaderboard/';
  var ISSUE_API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/issues';
  var USER_API  = 'https://api.github.com/user';

  /* 留空 = 直接用 GitHub API；填了 = 优先走你自己的后端 */
  var SCORE_API = '';

  var TK = 'fx_gh_token_v1';
  var LK = 'fx_gh_login_v1';
  var AK = 'fx_gh_avatar_v1';

  var TOKEN_NEW_URL = 'https://github.com/settings/tokens/new'
    + '?scopes=public_repo&description=cxf54188-leaderboard';

  var BUSY = false;

  /* ---------- 小工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function fmt(score, unit) {
    if (unit === 'ms') {
      var t = Number(score) / 1000;
      if (!isFinite(t)) return '--:--.--';
      var m = Math.floor(t / 60), s = Math.floor(t % 60), c = Math.floor((t % 1) * 100);
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
           + '.' + String(c).padStart(2, '0');
    }
    var n = Number(score);
    return isFinite(n) ? n.toLocaleString('zh-CN') : String(score);
  }
  function norm(o) {
    return {
      mode:  String(o.mode  == null || o.mode  === '' ? '默认' : o.mode),
      track: String(o.track == null || o.track === '' ? '-'    : o.track),
      rule:  String(o.rule  == null || o.rule  === '' ? '-'    : o.rule)
    };
  }
  function boardLabel(o) {
    var n = norm(o);
    var label = n.mode + ' · ' + n.track;
    if (n.rule && n.rule !== '-') label += ' · ' + n.rule;
    return label;
  }
  function ruleText(rule) { return (!rule || rule === '-') ? '无道具' : rule; }
  function boardUrl(game, mode, track, rule) {
    var q = '?game=' + encodeURIComponent(game || '');
    if (mode)  q += '&mode='  + encodeURIComponent(mode);
    if (track) q += '&track=' + encodeURIComponent(track);
    if (rule)  q += '&rule='  + encodeURIComponent(rule);
    return LB_URL + q;
  }
  function toast(msg, bad) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:50%;top:24px;transform:translateX(-50%);z-index:100000;'
      + 'background:rgba(5,12,28,.96);border:1px solid '
      + (bad ? 'rgba(255,95,168,.6)' : 'rgba(0,240,255,.55)') + ';color:#eaf6ff;'
      + 'padding:12px 20px;border-radius:10px;font-size:13px;letter-spacing:.5px;'
      + 'font-family:"PingFang SC","Microsoft YaHei",sans-serif;'
      + 'box-shadow:0 10px 30px rgba(0,0,0,.55);max-width:86vw;text-align:center;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, bad ? 6000 : 3800);
  }

  /* ---------- 会话（只存在访客本机） ---------- */
  function getSession() {
    try {
      var t = localStorage.getItem(TK), l = localStorage.getItem(LK);
      if (t && l) return { token: t, login: l, avatar: localStorage.getItem(AK) || '' };
    } catch (e) {}
    return null;
  }
  function saveSession(t, u) {
    try {
      localStorage.setItem(TK, t);
      localStorage.setItem(LK, u.login);
      localStorage.setItem(AK, u.avatar_url || '');
    } catch (e) {}
  }
  function clearSession() {
    try { localStorage.removeItem(TK); localStorage.removeItem(LK); localStorage.removeItem(AK); } catch (e) {}
  }
  function ghHeaders(token) {
    return {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }
  function verify(token) {
    return fetch(USER_API, { headers: ghHeaders(token) }).then(function (r) {
      if (r.status === 401) throw new Error('令牌无效或已过期');
      if (!r.ok) throw new Error('GitHub 返回 ' + r.status);
      return r.json();
    });
  }

  /* ---------- 一次性登录面板 ---------- */
  function loginPanel(onDone) {
    var old = document.getElementById('fx-gh-login');
    if (old) old.remove();

    var mask = document.createElement('div');
    mask.id = 'fx-gh-login';
    mask.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(3,7,18,.82);'
      + 'display:flex;align-items:center;justify-content:center;padding:18px;'
      + 'backdrop-filter:blur(7px);font-family:"PingFang SC","Microsoft YaHei",sans-serif;';
    mask.innerHTML =
      '<div style="width:min(440px,100%);background:rgba(10,18,38,.98);'
      + 'border:1px solid rgba(0,240,255,.42);border-radius:18px;padding:24px;color:#eaf6ff;'
      + 'box-shadow:0 24px 70px rgba(0,0,0,.65)">'
      + '<div style="font-size:10.5px;letter-spacing:4px;color:#00f0ff;margin-bottom:6px">GITHUB SIGN IN</div>'
      + '<h2 style="font-size:20px;margin:0 0 8px">用 GitHub 账号登录</h2>'
      + '<p style="font-size:12px;color:#9db4cd;line-height:1.8;margin:0 0 16px">'
      + '排行榜直接用你的 GitHub 用户名记分，名字不可修改。登录后本页直接提交，不会再跳到 GitHub。</p>'
      + '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);'
      + 'border-radius:12px;padding:13px 14px;margin-bottom:14px;font-size:12px;line-height:1.9;color:#a9c0d8">'
      + '<b style="color:#ffd25a">①</b> 点下面按钮打开 GitHub（已预勾选 <code>public_repo</code>），'
      + '拉到底点 <b>Generate token</b>，复制 <code>ghp_</code> 开头那串字符。<br>'
      + '<b style="color:#ffd25a">②</b> 粘回这里点「连接」。只需做一次，之后 10 个游戏都能一键提交。'
      + '</div>'
      + '<a href="' + TOKEN_NEW_URL + '" target="_blank" rel="noopener" '
      + 'style="display:block;text-align:center;text-decoration:none;padding:11px;border-radius:10px;'
      + 'background:rgba(0,240,255,.1);border:1px solid rgba(0,240,255,.45);color:#00f0ff;'
      + 'font-size:13px;font-weight:700;margin-bottom:14px">① 去 GitHub 生成令牌 ↗</a>'
      + '<label style="display:block;font-size:11.5px;color:#9db4cd;margin-bottom:6px">② 粘贴令牌</label>'
      + '<input id="fx-gh-token" type="password" autocomplete="off" spellcheck="false" '
      + 'placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" '
      + 'style="width:100%;box-sizing:border-box;padding:11px 13px;border-radius:10px;'
      + 'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);'
      + 'color:#fff;font-size:13px;outline:none;margin-bottom:12px">'
      + '<div id="fx-gh-err" style="font-size:11.5px;color:#ff5fa8;min-height:16px;margin-bottom:8px"></div>'
      + '<div style="display:flex;gap:10px">'
      + '<button id="fx-gh-ok" style="flex:1;padding:11px;border:0;border-radius:10px;cursor:pointer;'
      + 'background:linear-gradient(90deg,#00f0ff,#7b2ff7);color:#04101c;font-weight:800;font-size:14px">连接并继续</button>'
      + '<button id="fx-gh-no" style="padding:11px 20px;border:1px solid rgba(255,255,255,.18);'
      + 'border-radius:10px;cursor:pointer;background:rgba(255,255,255,.05);color:#9db4cd;font-size:14px">取消</button>'
      + '</div>'
      + '<p style="font-size:10.5px;color:#5f7894;line-height:1.8;margin:14px 0 0">'
      + '令牌只保存在你这台浏览器（localStorage），不会写进网站代码，也不会发给第三方；'
      + '只用于向 <b>cxf54188/cxf54188.github.io</b> 提交成绩。随时可在 GitHub 设置里撤销。</p>'
      + '</div>';
    document.body.appendChild(mask);

    mask.addEventListener('click', function (e) { if (e.target === mask) mask.remove(); });
    document.getElementById('fx-gh-no').onclick = function () { mask.remove(); };

    var input = document.getElementById('fx-gh-token');
    var err = document.getElementById('fx-gh-err');
    var btn = document.getElementById('fx-gh-ok');
    input.focus();

    function go() {
      var t = (input.value || '').trim();
      if (!t) { err.textContent = '先把令牌粘进来'; return; }
      btn.disabled = true;
      btn.textContent = '正在核对身份…';
      err.textContent = '';
      verify(t).then(function (u) {
        if (!u || !u.login) throw new Error('没读到 GitHub 用户名');
        saveSession(t, u);
        mask.remove();
        toast('✅ 已登录 @' + u.login);
        onDone({ token: t, login: u.login, avatar: u.avatar_url || '' });
      }).catch(function (e) {
        btn.disabled = false;
        btn.textContent = '连接并继续';
        err.textContent = '连接失败：' + e.message
          + '（请确认用的是 classic 令牌且勾了 public_repo）';
      });
    }
    btn.onclick = go;
    input.onkeydown = function (e) { if (e.key === 'Enter') go(); };
  }

  function ensureLogin(cb) {
    var s = getSession();
    if (s) { cb(s); return; }
    loginPanel(cb);
  }

  /* ---------- 组装 Issue（格式与 v3 一致，排行榜页不用改） ---------- */
  function issueTitle(o, n) {
    return 'Leaderboard: ' + o.game + ' / ' + boardLabel(o)
         + ' - ' + o.player + ' - ' + o.score;
  }
  function issueBody(o, n) {
    return [
      'Game: ' + o.game,
      'Name: ' + o.name,
      'Mode: ' + n.mode,
      'Track: ' + n.track,
      'Rule: ' + n.rule,
      'Player: ' + o.player,
      'Score: ' + o.score,
      'Show: ' + (o.show || fmt(o.score, o.unit)),
      'Unit: ' + (o.unit || ''),
      'Better: ' + (o.better || 'high'),
      'Detail: ' + (o.detail || ''),
      'Submitted at: ' + new Date().toISOString()
    ].join('\n');
  }
  /* 兼容旧代码里可能有人调 issueUrl()：只返回链接，不再用于跳转 */
  function issueUrl(o) {
    var q = '?title=' + encodeURIComponent(issueTitle(o, norm(o)))
          + '&body=' + encodeURIComponent(issueBody(o, norm(o)));
    return 'https://github.com/' + OWNER + '/' + REPO + '/issues/new' + q;
  }

  /* ---------- 提交 ---------- */
  function postViaBackend(o, n) {
    return fetch(SCORE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: o.game, name: o.name, player: o.player,
        mode: n.mode, track: n.track, rule: n.rule,
        score: o.score, unit: o.unit, better: o.better, detail: o.detail
      })
    }).then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) throw new Error((d && d.error) || '后端返回失败');
      });
  }

  function postIssue(o, s, n, noLabel) {
    var payload = { title: issueTitle(o, n), body: issueBody(o, n) };
    if (!noLabel) payload.labels = ['leaderboard'];

    return fetch(ISSUE_API, {
      method: 'POST',
      headers: ghHeaders(s.token),
      body: JSON.stringify(payload)
    }).then(function (r) {
      /* 仓库里没建 leaderboard 标签时，去掉标签重试一次 */
      if (r.status === 422 && !noLabel) return postIssue(o, s, n, true);
      if (r.status === 401) {
        clearSession();
        throw new Error('LOGIN_EXPIRED');
      }
      if (r.status === 403) throw new Error('令牌权限不足：需要 public_repo');
      if (!r.ok) {
        return r.json().then(function (d) {
          throw new Error('GitHub 返回 ' + r.status + '：' + (d.message || '未知错误'));
        }).catch(function (e) { throw new Error(e.message || ('HTTP ' + r.status)); });
      }
      return r.json().then(function (issue) {
        /* 降级重试时静默补标签，失败也不影响成绩 */
        if (noLabel && issue && issue.number) {
          fetch(ISSUE_API + '/' + issue.number + '/labels', {
            method: 'POST',
            headers: ghHeaders(s.token),
            body: JSON.stringify({ labels: ['leaderboard'] })
          }).catch(function () {});
        }
      });
    });
  }

  function deliver(o, s) {
    var n = norm(o);
    var payload = Object.assign({}, o, {
      player: s.login,          /* 强制：名字 = GitHub 登录名 */
      mode: n.mode, track: n.track, rule: n.rule
    });
    var done = SCORE_API ? postViaBackend(payload, n) : postIssue(payload, s, n, false);

    return done.then(function () {
      toast('🏆 已上榜：@' + s.login + ' · ' + (o.show || fmt(o.score, o.unit)));
    }).catch(function (e) {
      if (e && e.message === 'LOGIN_EXPIRED') {
        toast('登录已失效，请重新登录', true);
        ensureLogin(function (s2) { deliver(o, s2); });
      } else {
        toast('⚠️ 提交失败：' + (e && e.message ? e.message : '网络错误'), true);
      }
    }).then(function () { BUSY = false; });
  }

  function submit(o) {
    if (!o || !o.game || o.score == null) return;
    if (BUSY) { toast('正在提交上一局，稍等一下…'); return; }
    o.name = o.name || o.game;
    o.better = o.better || 'high';
    o.unit = o.unit || '';
    BUSY = true;

    if (SCORE_API) {
      /* 后端模式：由后端识别身份，前端不需要令牌 */
      var n = norm(o);
      var p = Object.assign({}, o, { player: '', mode: n.mode, track: n.track, rule: n.rule });
      postViaBackend(p, n).then(function () { toast('🏆 成绩已上榜'); })
        .catch(function (e) { toast('⚠️ 提交失败：' + e.message, true); })
        .then(function () { BUSY = false; });
      return;
    }
    ensureLogin(function (s) { deliver(o, s); });
  }

  /* ---------- 导出 ---------- */
  window.ScoreBridge = {
    submit: submit,
    fmt: fmt,
    issueUrl: issueUrl,
    boardUrl: boardUrl,
    boardLabel: boardLabel,
    ruleText: ruleText,
    getPlayer: function () { var s = getSession(); return s ? s.login : ''; },
    getSession: getSession,
    login: function (cb) { ensureLogin(cb || function () {}); },
    logout: function () { clearSession(); toast('已退出 GitHub 登录'); }
  };
})();
