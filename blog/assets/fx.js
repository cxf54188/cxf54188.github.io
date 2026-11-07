/* ===== 全站特效 fx.js =====
   粒子连线背景 / 鼠标光晕 / 点击涟漪 / Konami / 每日一词 / 成就系统
   引入：<script src="/blog/assets/fx.js"></script>
   关闭粒子背景：<body data-fx-particles="off">
   不依赖具体游戏，游戏板块可随时增删
*/
(function () {
  'use strict';

  var isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  /* 主页等已有背景的页面可关闭粒子 */
  var NO_PARTICLES = document.body.getAttribute('data-fx-particles') === 'off';

  /* ---------- toast ---------- */
  function toast(msg, sub) {
    var box = document.getElementById('fx-toast-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'fx-toast-box';
      box.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(box);
    }
    var el = document.createElement('div');
    el.style.cssText = 'background:rgba(5,5,16,.94);border:1px solid rgba(0,240,255,.5);color:#e0e0ff;padding:11px 16px;border-radius:6px;font-size:13px;box-shadow:0 0 24px rgba(0,240,255,.18);opacity:0;transform:translateY(10px);transition:.3s;font-family:"JetBrains Mono","PingFang SC","Microsoft YaHei",monospace;';
    el.innerHTML = msg + (sub ? '<div style="color:rgba(200,200,255,.6);font-size:11px;margin-top:3px;letter-spacing:1px">' + sub + '</div>' : '');
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
    wanderer:    { name: '漫游者',   desc: '访问过 5 个不同页面' },
    clicker:     { name: '手速惊人', desc: '单页点击 50 次' },
    daily:       { name: '今日份',   desc: '查看过每日一词' },
    gamer:       { name: '爱玩的人', desc: '进过一次游戏大厅' }
  };
  var KEY_ACH = 'fx_ach_v1';
  var KEY_VISIT = 'fx_visits_v1';

  function getAch() {
    try { return JSON.parse(localStorage.getItem(KEY_ACH) || '{}'); } catch (e) { return {}; }
  }
  function unlock(id) {
    var a = getAch();
    if (a[id]) return;                       /* 已解锁过，不重复触发 */
    a[id] = Date.now();
    localStorage.setItem(KEY_ACH, JSON.stringify(a));
    var meta = ACH[id] || { name: id, desc: '' };
    toast('🏆 解锁成就：' + meta.name, meta.desc);
    if (window.fxAchRefresh) window.fxAchRefresh();
  }
  window.fxUnlock = unlock;
  window.fxAchList = ACH;

  if (!localStorage.getItem('fx_seen')) {
    localStorage.setItem('fx_seen', '1');
    setTimeout(function () { unlock('first_visit'); }, 900);
  }

  var h = new Date().getHours();
  if (h >= 0 && h < 5) unlock('night_owl');

  (function () {
    var v;
    try { v = JSON.parse(localStorage.getItem(KEY_VISIT) || '[]'); } catch (e) { v = []; }
    var p = location.pathname;
    if (v.indexOf(p) < 0) { v.push(p); localStorage.setItem(KEY_VISIT, JSON.stringify(v)); }
    if (v.length >= 5) unlock('wanderer');
  })();

  (function () {
    var n = 0;
    document.addEventListener('click', function () {
      n++;
      if (n >= 50) unlock('clicker');
    }, { passive: true });
  })();

  if (/\/blog\/game/.test(location.pathname)) unlock('gamer');

  /* ---------- 粒子连线背景：particles.js 2.0.0 现成模板 ---------- */
  function initParticles() {
    if (document.getElementById('fx-particles')) return;

    var box = document.createElement('div');
    box.id = 'fx-particles';
    box.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;';
    document.body.insertBefore(box, document.body.firstChild);

    function launch() {
      if (!window.particlesJS) return;
      window.particlesJS('fx-particles', {
        particles: {
          number: { value: isMobile ? 40 : 90, density: { enable: true, value_area: 900 } },
          color:  { value: '#00f0ff' },
          shape:  { type: 'circle' },
          opacity:{ value: 0.8, random: true },
          size:   { value: 2.4, random: true },
          line_linked: {
            enable: true, distance: 165,
            color: '#00f0ff', opacity: 0.22, width: 1
          },
          move: {
            enable: true, speed: 4,
            direction: 'none', random: true, out_mode: 'bounce', bounce: true
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: true, mode: 'grab' },
            onclick: { enable: true, mode: 'push' },
            resize: true
          },
          modes: {
            grab: { distance: 220, line_linked: { opacity: 0.5 } },
            push: { particles_nb: 3 }
          }
        },
        retina_detect: true
      });
    }

    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
    s.onload = launch;
    s.onerror = function () {
      // jsdelivr 抽风时回退 cdnjs
      var b = document.createElement('script');
      b.src = 'https://cdnjs.cloudflare.com/ajax/libs/particles.js/2.0.0/particles.min.js';
      b.onload = launch;
      document.head.appendChild(b);
    };
    document.head.appendChild(s);
  }
  if (!NO_PARTICLES) initParticles();

  /* ---------- 鼠标光晕 + 点击涟漪 ---------- */
  if (!isMobile) {
    var glow = document.createElement('div');
    glow.style.cssText = 'position:fixed;width:340px;height:340px;border-radius:50%;pointer-events:none;z-index:-1;background:radial-gradient(circle,rgba(0,240,255,.10),transparent 70%);transform:translate(-50%,-50%);left:-999px;top:-999px;';
    document.body.appendChild(glow);
    window.addEventListener('mousemove', function (e) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });

    document.addEventListener('click', function (e) {
      var r = document.createElement('div');
      r.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:10px;height:10px;border-radius:50%;pointer-events:none;z-index:99998;border:1.5px solid rgba(0,240,255,.75);box-shadow:0 0 10px rgba(0,240,255,.5);transform:translate(-50%,-50%) scale(1);transition:transform .5s ease-out,opacity .5s ease-out;opacity:1;';
      document.body.appendChild(r);
      requestAnimationFrame(function () {
        r.style.transform = 'translate(-50%,-50%) scale(9)';
        r.style.opacity = '0';
      });
      setTimeout(function () { r.remove(); }, 600);
    });
  }

  /* ---------- Konami 秘籍 ---------- */
  (function () {
    var seq = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    var idx = 0;
    document.addEventListener('keydown', function (e) {
      if (e.keyCode === seq[idx]) {
        idx++;
        if (idx === seq.length) { idx = 0; konamiBoom(); }
      } else {
        idx = (e.keyCode === seq[0]) ? 1 : 0;
      }
    });

    function konamiBoom() {
      unlock('konami');
      var colors = ['#00f0ff', '#7b2ff7', '#ff006e', '#ffffff'];
      for (var i = 0; i < 90; i++) {
        var p = document.createElement('div');
        var size = Math.random() * 7 + 3;
        p.style.cssText = 'position:fixed;left:50%;top:50%;width:' + size + 'px;height:' + size + 'px;border-radius:50%;pointer-events:none;z-index:99997;background:' + colors[(Math.random() * colors.length) | 0] + ';box-shadow:0 0 12px currentColor;transform:translate(-50%,-50%);transition:transform 1s cubic-bezier(.2,.8,.3,1),opacity 1s;';
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
    box.style.cssText = 'position:fixed;left:18px;bottom:18px;z-index:99996;cursor:pointer;background:rgba(5,5,16,.88);border:1px solid rgba(0,240,255,.22);border-radius:6px;padding:12px 16px;max-width:300px;font-family:"JetBrains Mono","PingFang SC","Microsoft YaHei",monospace;transition:.25s;backdrop-filter:blur(8px);';
    box.innerHTML = '<div style="font-size:10px;letter-spacing:3px;color:rgba(0,240,255,.6);margin-bottom:6px">每日一词 · DAILY</div><div style="font-size:13px;line-height:1.7;color:#e0e0ff">' + w[0] + '</div><div style="font-size:10px;letter-spacing:2px;color:rgba(200,200,255,.45);margin-top:6px">' + w[1] + '</div>';
    box.onmouseenter = function () { box.style.borderColor = 'rgba(0,240,255,.6)'; box.style.boxShadow = '0 0 16px rgba(0,240,255,.18)'; };
    box.onmouseleave = function () { box.style.borderColor = 'rgba(0,240,255,.22)'; box.style.boxShadow = 'none'; };
    box.onclick = function () { unlock('daily'); };
    document.body.appendChild(box);
  })();

})();
