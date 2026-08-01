// 公共工具函数
const YB_AVATAR = `<img class="yb-avatar" src="yb_avatar.svg" alt="元宝AI" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%2300a86b%22/><text x=%2250%22 y=%2258%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22white%22>元</text></svg>'">`;

function makeTopbar(extra){
  return `<div class="topbar">
    <img class="avatar" src="../img/avatar.png" alt="cxf54188" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="avatar-fallback" style="display:none;width:30px;height:30px;border-radius:50%;background:#4fc3f7;align-items:center;justify-content:center;font-size:14px">👤</div>
    <div class="info"><b>作者：cxf54188</b> &nbsp;|&nbsp; <span class="yb-label">辅助：</span>${YB_AVATAR}<b>元宝AI</b>${extra||''}</div>
  </div>`;
}

function makeOverlay(title, rulesHtml, btnText='开始游戏'){
  return `<div class="overlay" id="overlay">
    <h2>${title}</h2>
    <div class="rules">${rulesHtml}</div>
    <button class="btn" id="startBtn">${btnText}</button>
  </div>`;
}

function bindStart(callback){
  const btn=document.getElementById('startBtn');
  if(btn){btn.addEventListener('click',()=>{
    const ov=document.getElementById('overlay');if(ov)ov.style.display='none';
    setTimeout(callback,100);
  });}
}

// 阻止方向键滚动页面
window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)){
    e.preventDefault();
  }
},{passive:false});

// localStorage 包装
const Store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};

// 简易洗牌
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}

// 颜色工具
function lerpColor(a,b,t){const ah=parseInt(a.slice(1),16),bh=parseInt(b.slice(1),16),r=Math.round(((ah>>16)&255)*(1-t)+(((bh>>16)&255)*t)),g=Math.round(((ah>>8)&255)*(1-t)+(((bh>>8)&255)*t)),bl=Math.round((ah&255)*(1-t)+((bh&255)*t));return`rgb(${r},${g},${bl})`}

// 触屏滑动检测
function addSwipe(el,dirs){let sx=0,sy=0;el.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});el.addEventListener('touchmove',e=>{if(!sx)return;const dx=e.touches[0].clientX-sx,dy=e.touches[0].clientY-sy;if(Math.abs(dx)>40||Math.abs(dy)>40){if(Math.abs(dx)>Math.abs(dy)){dirs[dx>0?'right':'left']?.()}else{dirs[dy>0?'down':'up']?.()}sx=0}},{passive:true})}
