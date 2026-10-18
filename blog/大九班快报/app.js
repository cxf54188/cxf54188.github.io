/* 大九班快报 · 交互脚本 */

(function () {
  'use strict';

  /* ---------- 大图灯箱 ---------- */
  var lightbox   = document.getElementById('lightbox');
  var lbImg      = document.getElementById('lightboxImg');
  var lbCap      = document.getElementById('lightboxCap');
  var lbClose    = document.getElementById('lightboxClose');

  function openLightbox(src, alt, cap) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lbCap.textContent = cap || alt || '';
    lightbox.hidden = false;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  // 点击任意配图 / 画廊图 → 打开灯箱
  var zoomables = document.querySelectorAll('figure img, .gallery img');
  zoomables.forEach(function (img) {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function () {
      var cap = img.closest('figure') ? img.closest('figure').querySelector('figcaption') : null;
      openLightbox(img.src, img.alt, cap ? cap.textContent : '');
    });
  });

  // 关闭方式一：点 × 按钮
  if (lbClose) lbClose.addEventListener('click', closeLightbox);

  // 关闭方式二：点遮罩空白区域
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  // 关闭方式三：按 Esc 键
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  /* ---------- 阅读进度条 + 回到顶部 ---------- */
  var progressBar = document.getElementById('progressBar');
  var toTopBtn   = document.getElementById('toTop');

  function onScroll() {
    var st = window.pageYOffset || document.documentElement.scrollTop;
    var h  = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    progressBar.style.width = (h > 0 ? (st / h * 100) : 0) + '%';
    toTopBtn.style.display = st > 300 ? 'flex' : 'none';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTopBtn) {
    toTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 滚动入场动画 ---------- */
  var sections = document.querySelectorAll('main > section');
  sections.forEach(function (s) { s.style.opacity = '0'; s.style.transform = 'translateY(28px)'; s.style.transition = 'opacity .8s ease, transform .8s ease'; });
  function reveal() {
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top < window.innerHeight * 0.85) {
        s.style.opacity = '1';
        s.style.transform = 'none';
      }
    });
  }
  window.addEventListener('scroll', reveal, { passive: true });
  reveal();

  /* ---------- 防止刷新后 URL 锚点误触发灯箱 ---------- */
  if (window.location.hash) {
    var el = document.querySelector(window.location.hash);
    if (el) setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  }

})();
