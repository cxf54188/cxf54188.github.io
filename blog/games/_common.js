// 公共工具函数
const YB_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="50" fill="#00a86b"/><path d="M30 58 Q30 30 55 28 Q72 26 72 45 Q72 58 58 60 Q46 62 46 72 Q46 80 38 80 Q30 80 30 72 Z" fill="#fff"/><rect x="38" y="35" width="6" height="12" rx="3" fill="#000"/><path d="M52 38 Q55 42 53 46 Q50 43 52 38Z" fill="#000"/></svg>`;

function makeTopbar(extra){
  return `<div class="topbar">
    <img class="avatar" src="../../img/avatar.png" alt="cxf54188" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="avatar-fallback" style="display:none;width:30px;height:30px;border-radius:50%;background:#4fc3f7;align-items:center;justify-content:center;font-size:14px">👤</div>
    <div class="info"><b>作者：cxf54188</b> &nbsp;|&nbsp; <span class="yb">${YB_AVATAR_SVG}</span><b>辅助：元宝AI</b>${extra||''}</div>
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
