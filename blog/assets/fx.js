/* ===== cxf54188.github.io 全站特效 =====
   包含：粒子连线背景 / 鼠标光晕 / 点击涟漪 /
        Konami 彩蛋 / 每日一词 / 成就系统
   用法：页面 </body> 前引入 <script src="/blog/assets/fx.js"></script>
*/
(function () {
  'use strict';

  var isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  /* ---------- 通用：toast ---------- */
  function toast(msg, sub) {
    var box = document.getElementById('fx-toast-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'fx-toast-box';
      box.style.cssText =
        'position:fixed;right:18px;bottom:18px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(box);
    }
    var el = document.createElement('div');
    el.style.cssText =
      'background:rgba(10,16,28,.92);border:1px solid rgba(34,211,238,.45);' +
      'color:#dbe6f5;padding:11px 16px;border-radius:12px;font-size:13px;' +
      'box-shadow:0 10px 30px rgba(0,0,0,.5);opacity:0;transform:translateY(10px);' +
      'transition:.3s;font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;';
    el.innerHTML = msg + (sub ? '<div style="color:#7c8aa5;font-size:11px;margin-top:3px;letter-spacing:1px">' + sub + '</div>' : '');
    box.appendChild(el);
    requestAnimationFrame(function () { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(function () {
      el.style.opacity = '0'; el.style.transform = 'translateY(10px)';
      setTimeout(function () { el.remove(); }, 350);
    }, 3200);
  }
  window.fxToast = toast;

  /* ---------- 成就系统 ---------- */
  var ACH = {
    first_visit: { name: '初次见面', desc: '第一次来到这里' },
    night_owl:   { name: '夜猫子',   desc: '凌晨 0–5 点访问' },
    konami:      { name: '上上下下', desc: '触发 Konami 秘籍' },
    all_games:   { name: '全能玩家', desc: '玩过全部 4 个游戏' },
    clear_one:   { name: '初尝胜果', desc: '通关任意一个游戏' },
    clear_all:   { name: '全数通关', desc: '通关全部 4 个游戏' },
    wanderer:    { name: '漫游者',   desc: '访问过 5 个不同页面' },
    clicker:     { name: '手速惊人', desc: '单页点击 50 次' },
    daily:       { name: '今日份',   desc: '查看过每日一词' },
    secret:      { name: '发现了',   desc: '找到隐藏入口' }
  };
  var KEY_ACH = 'fx_ach_v1';
  var KEY_VISIT = 'fx_visits_v1';

  function getAch() {
    try { return JSON.parse(localStorage.getItem(KEY_ACH) || '{}'); } catch (e) { return {}; }
  }
  function unlock(id) {
    var a = getAch();
    if (a[id]) return;
    a[id] = Date.now();
    localStorage.setItem(KEY_ACH, JSON.stringify(a));
    var meta = ACH[id] || { name: id, desc: '' };
    toast('🏆 解锁成就：' + meta.name, meta.desc);
  }
  window.fxUnlock = unlock;

  // 初次访问
  if (!localStorage.getItem('fx_seen')) {
    localStorage.setItem('fx_seen', '1');
    setTimeout(function () { unlock('first_visit'); }, 900);
  }
  // 夜猫子
  var h = new Date().getHours();
  if (h >= 0 && h < 5) unlock('night_owl');
  // 漫游者
  (function () {
    var v;
    try { v = JSON.parse(localStorage.getItem(KEY_VISIT) || '[]'); } catch (e) { v = []; }
    var p = location.pathname;
    if (v.indexOf(p) < 0) { v.push(p); localStorage.setItem(KEY_VISIT, JSON.stringify(v)); }
    if (v.length >= 5) unlock('wanderer');
  })();
  // 点击狂魔
  (function () {
    var n = 0;
    document.addEventListener('click', function () {
      n++;
      if (n >= 50) unlock('clicker');
    }, { passive: true });
  })();

  /* ---------- 粒子连线背景 ---------- */
  function initParticles() {
    if (document.getElementById('fx-canvas')) return;
    var cv = document.createElement('canvas');
    cv.id = 'fx-canvas';
    cv.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;opacity:.85;';
    document.body.insertBefore(cv, document.body.firstChild);

    var ctx = cv.getContext('2d');
    var W, H, dots = [], mouse = { x: -9999, y: -9999 };
    var COUNT = isMobile ? 26 : 64;
    var LINK = isMobile ? 90 : 130;

    function resize() {
      W = cv.width = window.innerWidth * devicePixelRatio;
      H = cv.height = window.innerHeight * devicePixelRatio;
      cv.style.width = window.innerWidth + 'px';
      cv.style.height = window.innerHeight + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < COUNT; i++) {
      dots.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - .5) * .35,
        vy: (Math.random() - .5) * .35,
        r: Math.random() * 1.6 + .8
      });
    }

    if (!isMobile) {
      window.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX; mouse.y = e.clientY;
      }, { passive: true });
      window.addEventListener('mouseleave', function () {
        mouse.x = mouse.y = -9999;
      });
    }

    function loop() {
      var w = window.innerWidth, h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // 连线
      for (var i = 0; i < dots.length; i++) {
        for (var j = i + 1; j < dots.length; j++) {
          var dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = 'rgba(34,211,238,' + (0.16 * (1 - d / LINK)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      // 点 + 鼠标连线
      for (var k = 0; k < dots.length; k++) {
        var p = dots[k];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.fillStyle = 'rgba(125,211,252,.75)';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        if (mouse.x > -9999) {
          var mdx = p.x - mouse.x, mdy = p.y - mouse.y;
          var md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 170) {
            ctx.strokeStyle = 'rgba(34,211,238,' + (0.32 * (1 - md / 170)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(loop);
    }
    loop();
  }
  initParticles();

  /* ---------- 鼠标光晕 + 点击涟漪 ---------- */
  if (!isMobile) {
    var glow = document.createElement('div');
    glow.style.cssText =
      'position:fixed;width:340px;height:340px;border-radius:50%;pointer-events:none;z-index:-1;' +
      'background:radial-gradient(circle,rgba(34,211,238,.10),transparent 70%);' +
      'transform:translate(-50%,-50%);transition:opacity .3s;left:-999px;top:-999px;';
    document.body.appendChild(glow);
    window.addEventListener('mousemove', function (e) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });

    document.addEventListener('click', function (e) {
      var r = document.createElement('div');
      r.style.cssText =
        'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
        'width:10px;height:10px;border-radius:50%;pointer-events:none;z-index:99998;' +
        'border:1.5px solid rgba(34,211,238,.7);transform:translate(-50%,-50%) scale(1);' +
        'transition:transform .5s ease-out,opacity .5s ease-out;opacity:1;';
      document.body.appendChild(r);
      requestAnimationFrame(function () {
        r.style.transform = 'translate(-50%,-50%) scale(9)';
        r.style.opacity = '0';
      });
      setTimeout(function () { r.remove(); }, 600);
    });
  }

  /* ---------- Konami 彩蛋 ---------- */
  (function () {
    var seq = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    var idx = 0;
    document.addEventListener('keydown', function (e) {
      if (e.keyCode === seq[idx]) {
        idx++;
        if (idx === seq.length) {
          idx = 0;
          konamiBoom();
        }
      } else {
        idx = (e.keyCode === seq[0]) ? 1 : 0;
      }
    });

    function konamiBoom() {
      unlock('konami');
      // 粒子爆炸
      var colors = ['#22d3ee', '#a78bfa', '#fbbf24', '#c084fc', '#fff'];
      for (var i = 0; i < 90; i++) {
        var p = document.createElement('div');
        var size = Math.random() * 7 + 3;
        p.style.cssText =
          'position:fixed;left:50%;top:50%;width:' + size + 'px;height:' + size + 'px;' +
          'border-radius:50%;pointer-events:none;z-index:99997;' +
          'background:' + colors[(Math.random() * colors.length) | 0] + ';' +
          'transform:translate(-50%,-50%);transition:transform 1s cubic-bezier(.2,.8,.3,1),opacity 1s;';
        document.body.appendChild(p);
        (function (el) {
          var ang = Math.random() * Math.PI * 2;
          var dist = 200 + Math.random() * 400;
          requestAnimationFrame(function () {
            el.style.transform = 'translate(calc(-50% + ' + Math.cos(ang) * dist + 'px),calc(-50% + ' + Math.sin(ang) * dist + 'px))';
            el.style.opacity = '0';
          });
          setTimeout(function () { el.remove(); }, 1100);
        })(p);
      }
      toast('🎮 你发现了什么', '↑↑↓↓←→←→BA');
    }
  })();

  /* ---------- 每日一词 ---------- */
  (function () {
    var WORDS = [
      ['你走过的路，会一遍遍改写成新的样子。', 'VORTEX'],
      ['改变自己，而不是改变世界。', 'BREATHE'],
      ['地板变墙，墙变路，唯独你脚下被钉住。', 'FLIPSIDE'],
      ['用同一串动作，点亮所有相位的符文。', 'ECHO DRIFT'],
      ['有些答案，只在回头时才看得见。', '—'],
      ['慢一点，也是一种前进。', '—'],
      ['所有卡关，都是还没找到那个视角。', '—'],
      ['把简单的事做到极致，就是难度。', '—'],
      ['别怕重来，重来也是进度。', '—'],
      ['你不是在解谜，你是在认识自己。', '—']
    ];
    var d = new Date();
    var seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    var w = WORDS[seed % WORDS.length];

    var box = document.createElement('div');
    box.id = 'fx-daily';
    box.style.cssText =
      'position:fixed;left:18px;bottom:18px;z-index:99996;cursor:pointer;' +
      'background:rgba(10,16,28,.85);border:1px solid rgba(255,255,255,.09);' +
      'border-radius:14px;padding:12px 16px;max-width:300px;' +
      'font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;' +
      'transition:.25s;backdrop-filter:blur(8px);';
    box.innerHTML =
      '<div style="font-size:10px;letter-spacing:3px;color:#7c8aa5;margin-bottom:6px">每日一词 · DAILY</div>' +
      '<div style="font-size:13px;line-height:1.7;color:#dbe6f5">' + w[0] + '</div>' +
      '<div style="font-size:10px;letter-spacing:2px;color:#4d5a70;margin-top:6px">' + w[1] + '</div>';
    box.onmouseenter = function () { box.style.borderColor = 'rgba(34,211,238,.5)'; };
    box.onmouseleave = function () { box.style.borderColor = 'rgba(255,255,255,.09)'; };
    box.onclick = function () { unlock('daily'); };
    document.body.appendChild(box);
  })();

})();
