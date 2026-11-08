/* ===== 通用成绩上报组件 score.js  v3 =====
   用法：游戏页面 </body> 前引入
        <script src="/blog/assets/score.js"></script>
   结算时调用：
        ScoreBridge.submit({
          game:'qq-speed', name:'飞车 3D',
          mode:'道具模式', track:'11城', rule:'一路狂飙',  // ← v3 新增 rule
          score:133450, unit:'ms', better:'low',
          show:'02:13.45', detail:'第1名 · 2圈'
        });

   数据协议：一条成绩 = 一个 open issue
   title : Leaderboard: <game> / <榜单名> - <player> - <score>
   body  : Game / Name / Mode / Track / Rule / Player / Score / Show /
           Unit / Better / Detail / Submitted at
   labels: leaderboard, game-<game>

   向后兼容：
     v1 老成绩（无 Mode/Track）       → 归到「默认 · -」榜
     v2 成绩（有 Mode/Track，无 Rule） → 归到 rule「-」，原榜不变
     rule 为 '-' 或留空时，榜单名仍写作「模式 · 赛道」，标题格式不变。

   零后端模式（默认）：打开预填好的 GitHub Issue 新建页，访客登录后点 Submit。
   后端模式：把 SCORE_API 填成 Deno Deploy 的 /submit 地址，即改为一键 POST。
*/
(function () {
  'use strict';

  var OWNER = 'cxf54188';
  var REPO  = 'cxf54188.github.io';
  var LB_URL = '/blog/games/leaderboard/';

  /* Deno Deploy 跑通后填这里，例如 https://xxx.deno.dev/submit */
  var SCORE_API = '';

  var NAME_KEY = 'fx_player_name_v1';

  function getName() { try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; } }
  function setName(n) { try { localStorage.setItem(NAME_KEY, n); } catch (e) {} }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(score, unit) {
    if (unit === 'ms') {
      var t = Number(score) / 1000;
      if (!isFinite(t)) return '--:--.--';
      var m = Math.floor(t / 60), s = Math.floor(t % 60), c = Math.floor((t % 1) * 100);
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(c).padStart(2, '0');
    }
    var n = Number(score);
    return isFinite(n) ? n.toLocaleString('zh-CN') : String(score);
  }

  /* 榜单键：模式 + 赛道 + 规则。没给就补默认值 */
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

  function issueUrl(o) {
    var n = norm(o);
    var body = [
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
    var title = 'Leaderboard: ' + o.game + ' / ' + boardLabel(o)
              + ' - ' + o.player + ' - ' + o.score;
    var q = '?title=' + encodeURIComponent(title)
          + '&body=' + encodeURIComponent(body)
          + '&labels=' + encodeURIComponent('leaderboard,game-' + o.game);
    return 'https://github.com/' + OWNER + '/' + REPO + '/issues/new' + q;
  }

  /* 直接跳到某个榜单，游戏结算后可放一个「查看本榜」链接 */
  function boardUrl(game, mode, track, rule) {
    var q = '?game=' + encodeURIComponent(game || '');
    if (mode)  q += '&mode='  + encodeURIComponent(mode);
    if (track) q += '&track=' + encodeURIComponent(track);
    if (rule)  q += '&rule='  + encodeURIComponent(rule);
    return LB_URL + q;
  }

  function toast(msg) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:50%;top:24px;transform:translateX(-50%);z-index:100000;'
      + 'background:rgba(5,12,28,.95);border:1px solid rgba(0,240,255,.5);color:#eaf6ff;'
      + 'padding:12px 20px;border-radius:10px;font-size:13px;'
      + 'font-family:"PingFang SC","Microsoft YaHei",sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 4200);
  }

  function openPanel(o) {
    var old = document.getElementById('fx-score-mask');
    if (old) old.remove();
    var n = norm(o);
    var mask = document.createElement('div');
    mask.id = 'fx-score-mask';
    mask.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(3,7,18,.78);'
      + 'display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(6px);';
    mask.innerHTML =
      '<div style="width:min(420px,100%);background:rgba(10,18,38,.97);border:1px solid rgba(0,240,255,.4);'
      + 'border-radius:18px;padding:24px;font-family:\'PingFang SC\',\'Microsoft YaHei\',sans-serif;color:#eaf6ff;'
      + 'box-shadow:0 24px 70px rgba(0,0,0,.6)">'
      + '<div style="font-size:11px;letter-spacing:4px;color:#00f0ff;margin-bottom:6px">LEADERBOARD</div>'
      + '<h2 style="font-size:21px;margin:0 0 16px">把这一局记上去？</h2>'
      + '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);'
      + 'border-radius:12px;padding:14px;margin-bottom:16px">'
      + '<div style="font-size:12px;color:#7d9bb8">' + esc(o.name) + '</div>'
      + '<div style="display:inline-block;margin-top:8px;font-size:10.5px;letter-spacing:1px;'
      + 'color:#00f0ff;border:1px solid rgba(0,240,255,.35);border-radius:6px;padding:3px 9px">'
      + esc(boardLabel(o)) + '</div>'
      + '<div style="font-size:30px;font-weight:900;letter-spacing:1px;margin:8px 0;color:#ffd25a">'
      + esc(o.show || fmt(o.score, o.unit)) + '</div>'
      + '<div style="font-size:11.5px;color:#9db4cd;line-height:1.7">' + esc(o.detail || '') + '</div>'
      + '</div>'
      + '<label style="display:block;font-size:12px;color:#9db4cd;margin-bottom:6px">显示在排行榜上的名字</label>'
      + '<input id="fx-score-name" maxlength="24" value="' + esc(getName()) + '" placeholder="你的昵称" '
      + 'style="width:100%;box-sizing:border-box;padding:11px 13px;border-radius:10px;'
      + 'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);color:#fff;'
      + 'font-size:14px;outline:none;margin-bottom:18px">'
      + '<div style="display:flex;gap:10px">'
      + '<button id="fx-score-ok" style="flex:1;padding:11px;border:0;border-radius:10px;cursor:pointer;'
      + 'background:linear-gradient(90deg,#00f0ff,#7b2ff7);color:#04101c;font-weight:800;font-size:14px">提交</button>'
      + '<button id="fx-score-no" style="padding:11px 20px;border:1px solid rgba(255,255,255,.18);'
      + 'border-radius:10px;cursor:pointer;background:rgba(255,255,255,.05);color:#9db4cd;font-size:14px">取消</button>'
      + '</div>'
      + '<p style="font-size:11px;color:#5f7894;line-height:1.7;margin:14px 0 0">'
      + '提交会在 GitHub 打开一个预填好的页面，登录后点 “Submit new issue” 即可。'
      + '需要 GitHub 账号；成绩会公开显示。</p>'
      + '</div>';
    document.body.appendChild(mask);

    mask.addEventListener('click', function (e) { if (e.target === mask) mask.remove(); });
    document.getElementById('fx-score-no').onclick = function () { mask.remove(); };
    document.getElementById('fx-score-ok').onclick = function () {
      var nick = (document.getElementById('fx-score-name').value || '').trim();
      if (!nick) { toast('先填个名字吧'); return; }
      setName(nick);
      var payload = Object.assign({}, o, {
        player: nick, mode: n.mode, track: n.track, rule: n.rule
      });
      mask.remove();
      send(payload);
    };
  }

  function send(o) {
    var n = norm(o);
    if (SCORE_API) {
      fetch(SCORE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: o.game, name: o.name, player: o.player,
          mode: n.mode, track: n.track, rule: n.rule,
          score: o.score, unit: o.unit, better: o.better, detail: o.detail
        })
      }).then(function (r) { return r.json(); })
        .then(function (d) { toast(d && d.ok ? '✅ 成绩已上榜' : '⚠️ 提交失败：' + (d && d.error || '未知错误')); })
        .catch(function (e) { toast('⚠️ 网络错误：' + e.message); });
    } else {
      window.open(issueUrl(o), '_blank', 'noopener');
      toast('已打开提交页面 → 登录后点 Submit new issue');
    }
  }

  window.ScoreBridge = {
    submit: function (o) {
      if (!o || !o.game || o.score == null) return;
      o.name = o.name || o.game;
      o.better = o.better || 'high';
      o.unit = o.unit || '';
      openPanel(o);
    },
    fmt: fmt,
    issueUrl: issueUrl,
    boardUrl: boardUrl,
    boardLabel: boardLabel,
    ruleText: ruleText,
    getPlayer: getName
  };
})();
