/* 大九班快报 · 留言板（纯前端版） */
/* 说明：messages.json 是公开共享文件，所有人打开页面都能看到里面的全部留言。 */

(function () {
  'use strict';

  var form  = document.getElementById('gbForm');
  var nameI = document.getElementById('gbName');
  var textI = document.getElementById('gbText');
  var hint  = document.getElementById('gbHint');
  var list  = document.getElementById('gbList');
  var STORE = 'djbfp_guestbook_msgs'; // localStorage 键（本地预览缓存）

  /* 渲染留言列表 */
  function render(msgs) {
    list.innerHTML = '';
    if (!msgs || msgs.length === 0) {
      list.innerHTML = '<p style="color:#999;font-size:.9rem;">还没有留言，快来抢沙发吧～</p>';
      return;
    }
    msgs.forEach(function (m) {
      var item = document.createElement('div');
      item.className = 'msg-item';
      item.innerHTML =
        '<div class="msg-item__head">' +
          '<span class="msg-item__name"></span>' +
          '<span class="msg-item__time"></span>' +
        '</div>' +
        '<div class="msg-item__text"></div>';
      item.querySelector('.msg-item__name').textContent  = m.name;
      item.querySelector('.msg-item__time').textContent  = m.time || '';
      item.querySelector('.msg-item__text').textContent  = m.text;
      list.appendChild(item);
    });
  }

  /* 加载留言：优先用 messages.json（全员共享），失败回退本地缓存 */
  function load() {
    fetch('messages.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('network');
        return r.json();
      })
      .then(function (data) {
        render((data && data.messages) || []);
      })
      .catch(function () {
        var local = [];
        try { local = JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { local = []; }
        render(local);
        hint.textContent = '提示：当前为本地预览模式，留言仅保存在本机，部署到 GitHub 后可读取共享留言。';
      });
  }

  /* 提交留言：纯静态页面无法直接写文件，写入本地缓存并提示 */
  function submitMsg(name, text) {
    var msgs = [];
    try { msgs = JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { msgs = []; }
    msgs.unshift({ name: name, text: text, time: new Date().toLocaleString('zh-CN') });
    localStorage.setItem(STORE, JSON.stringify(msgs));
    render(msgs);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (nameI.value || '').trim();
      var text = (textI.value || '').trim();
      hint.classList.remove('error');

      if (!name) { hint.classList.add('error'); hint.textContent = '请填写你的名字～'; return; }
      if (!text) { hint.classList.add('error'); hint.textContent = '留言内容不能为空哦～'; return; }

      submitMsg(name, text);
      hint.textContent = '留言已张贴到本机 ✔ 若想让全站同学看到，请让管理员追加到 messages.json 后重新部署。';
      nameI.value = ''; textI.value = '';
    });
  }

  load();
})();
