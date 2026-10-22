/* 课堂违纪互动看板 · 交互逻辑 */
/* ============ 状态 ============ */
const state = {
  sort:'total', filter:'all', q:'', week:6,
  classSize:52, picked:[], wheelSrc:'all', wheelMode:'call', noRepeat:true, weighted:false, sim:0
};
function zeroNamesInData(){ return S.filter(function(s){return s.total===0;}).map(function(s){return s.name;}); }
function unknownCount(){ return Math.max(0, state.classSize - S.length); }
function zeroCount(){ return zeroNamesInData().length + unknownCount(); }
function color(v){ return v>=4?'#dc2626' : v>=3?'#f97316' : v>=2?'#f59e0b' : '#818cf8'; }
function lv(v){ return v>=4?'lv4' : v===3?'lv3' : v===2?'lv2' : v===1?'lv1' : 'lv0'; }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function byName(n){ return S.filter(function(x){return x.name===n;})[0]; }
function rnd(n){ return Math.floor(Math.random()*n); }

/* ============ 存档 ============ */
function save(){
  try{
    localStorage.setItem(STORE_KEY, JSON.stringify({
      size:state.classSize,
      data:S.map(function(s){return {n:s.name, w:s.w, sub:s.sub};})
    }));
    var el=$('saveState');
    if(el) el.textContent = '已自动保存 · ' + new Date().toLocaleTimeString('zh-CN');
  }catch(e){}
}
function load(){
  try{
    var raw = localStorage.getItem(STORE_KEY);
    if(!raw) return false;
    var o = JSON.parse(raw);
    if(!o || !o.data || !o.data.length) return false;
    S = o.data.map(function(d){ return {name:d.n, w:d.w.slice(), sub:d.sub.slice()}; });
    if(o.size) state.classSize = o.size;
    BAD = S.filter(function(s){ return s.w.reduce(function(a,b){return a+b;},0) > 0; });
    compute(); return true;
  }catch(e){ return false; }
}

/* ============ KPI ============ */
function renderKpis(){
  var perClass = (TOTAL/state.classSize).toFixed(2);
  var perBad = (TOTAL/(BAD.length||1)).toFixed(2);
  var fh = weekTotals[0]+weekTotals[1]+weekTotals[2];
  var sh = weekTotals[3]+weekTotals[4]+weekTotals[5]+weekTotals[6];
  var d = sh-fh, pct = fh ? Math.round(Math.abs(d)/fh*100) : 0;
  var topSubIdx = subTotals.indexOf(Math.max.apply(null,subTotals));
  var items = [
    ['累计违纪次数', TOTAL+' 次', RANK.length+' 名同学合计，'+WEEKS[PEAK]+'最高', 'var(--brand)'],
    ['违纪人数占比', RANK.length+' / '+state.classSize, '覆盖率 '+Math.round(RANK.length/state.classSize*100)+'%', 'var(--red)'],
    ['零违纪人数', zeroCount()+' 人', '七周内无违纪记录', 'var(--green)'],
    ['全班人均', perClass+' 次', '违纪同学人均 '+perBad+' 次', 'var(--orange)'],
    ['后半程变化', (d>0?'+':'')+d+' 次', '较前三周'+(d>0?'上升':'下降')+' '+pct+'%', d>0?'var(--red)':'var(--green)'],
    ['最危险学科', SUBS[topSubIdx], subTotals[topSubIdx]+' 次 / '+subPeople[topSubIdx]+' 人', 'var(--brand2)']
  ];
  $('kpis').innerHTML = items.map(function(it){
    return '<div class="kpi"><div class="bar" style="background:'+it[3]+'"></div>'+
      '<div class="k-label">'+it[0]+'</div><div class="k-val">'+it[1]+'</div><div class="k-sub">'+it[2]+'</div></div>';
  }).join('');
  $('b1').textContent = '统计周期：七周（W1–W7）';
  $('b2').textContent = '违纪 '+RANK.length+' 人 / 班级 '+state.classSize+' 人';
  $('b3').textContent = '累计 '+TOTAL+' 次';
  $('b4').textContent = '维度：周次 × 学科';
  $('b5').textContent = '全员 '+S.length+' 人已录入 · 零违纪 '+zeroCount()+' 人' +
    (unknownCount() ? '（另有未录入 '+unknownCount()+' 人）' : '');
}

/* ============ 每周柱状 + 折线 ============ */
function renderWeekBars(){
  var W=760,H=330,pl=44,pr=46,pt=26,pb=44;
  var iw=W-pl-pr, ih=H-pt-pb;
  var maxT=Math.max.apply(null,weekTotals)||1, maxP=Math.max.apply(null,weekPeople)||1;
  var step=iw/NW, bw=step*0.5, g='';
  for(var i=0;i<=4;i++){
    var y=pt+ih-ih*i/4;
    g += '<line x1="'+pl+'" y1="'+y+'" x2="'+(W-pr)+'" y2="'+y+'" stroke="#eef1f8"/>'+
         '<text x="'+(pl-8)+'" y="'+(y+4)+'" font-size="11" fill="#9aa3b8" text-anchor="end">'+Math.round(maxT*i/4)+'</text>'+
         '<text x="'+(W-pr+8)+'" y="'+(y+4)+'" font-size="11" fill="#c9a227">'+Math.round(maxP*i/4)+'</text>';
  }
  weekTotals.forEach(function(v,i){
    var x=pl+step*i+step/2, h=v/maxT*ih, y=pt+ih-h;
    var on = state.week===i;
    g += '<rect x="'+(x-bw/2)+'" y="'+y+'" width="'+bw+'" height="'+Math.max(h,2)+'" rx="6" fill="url(#gb)" opacity="'+(on?1:.85)+'" style="cursor:pointer" data-w="'+i+'"/>'+
      '<text x="'+x+'" y="'+(y-8)+'" font-size="12" font-weight="700" fill="#4338ca" text-anchor="middle">'+v+'</text>'+
      '<text x="'+x+'" y="'+(pt+ih+20)+'" font-size="12" fill="'+(on?'#4338ca':'#7c859e')+'" font-weight="'+(on?700:500)+'" text-anchor="middle">'+SHORT[i]+'</text>'+
      '<text x="'+x+'" y="'+(pt+ih+36)+'" font-size="10" fill="#aeb5c7" text-anchor="middle">'+WEEKS[i]+'</text>';
  });
  var pts = weekPeople.map(function(p,i){ return (pl+step*i+step/2)+','+(pt+ih-p/maxP*ih); }).join(' ');
  g += '<polyline points="'+pts+'" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linejoin="round"/>';
  weekPeople.forEach(function(p,i){
    var x=pl+step*i+step/2, y=pt+ih-p/maxP*ih;
    g += '<circle cx="'+x+'" cy="'+y+'" r="4" fill="#fff" stroke="#f59e0b" stroke-width="2.5"><title>'+WEEKS[i]+'：'+p+' 人</title></circle>';
  });
  var el = $('weekBars');
  el.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block">'+
    '<defs><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">'+
    '<stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#a5b4fc"/></linearGradient></defs>'+g+'</svg>';
  el.querySelectorAll('rect[data-w]').forEach(function(r){
    r.addEventListener('click', function(){
      state.week = +r.getAttribute('data-w');
      document.querySelector('.tab[data-t=week]').click(); render();
    });
  });
}

/* ============ 分层环形 ============ */
function renderDonut(){
  var groups = [
    {k:'high', label:'重点关注 ≥9 次', c:'#e11d48', n:BAD.filter(function(s){return s.level==='high';}).length},
    {k:'mid',  label:'需提醒 4–8 次',  c:'#f59e0b', n:BAD.filter(function(s){return s.level==='mid';}).length},
    {k:'low',  label:'偶发 1–3 次',    c:'#818cf8', n:BAD.filter(function(s){return s.level==='low';}).length},
    {k:'zero', label:'零违纪',         c:'#10b981', n:zeroCount()}
  ];
  var sum = groups.reduce(function(a,g){return a+g.n;},0) || 1;
  var R=64, C=2*Math.PI*R, off=0, seg='';
  groups.forEach(function(g){
    var len = g.n/sum*C;
    seg += '<circle cx="100" cy="100" r="'+R+'" fill="none" stroke="'+g.c+'" stroke-width="26" '+
      'stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 100 100)" opacity=".92"/>';
    off += len;
  });
  $('donut').innerHTML =
    '<svg viewBox="0 0 200 200" width="100%" style="max-width:220px;display:block;margin:0 auto">'+seg+
    '<text x="100" y="96" font-size="30" font-weight="800" fill="#1e2439" text-anchor="middle">'+sum+'</text>'+
    '<text x="100" y="118" font-size="12" fill="#7c859e" text-anchor="middle">班级总人数</text></svg>';
  $('donutLegend').innerHTML = '<div style="margin-top:14px;display:grid;gap:8px">'+
    groups.map(function(g){
      return '<div style="display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer" data-go="'+g.k+'">'+
        '<i style="width:12px;height:12px;border-radius:4px;background:'+g.c+'"></i>'+
        '<span style="flex:1">'+g.label+'</span><b>'+g.n+' 人</b>'+
        '<span style="color:#aeb5c7;width:42px;text-align:right">'+Math.round(g.n/sum*100)+'%</span></div>';
    }).join('')+'</div>';
  document.querySelectorAll('#donutLegend [data-go]').forEach(function(d){
    d.addEventListener('click', function(){
      var k = d.getAttribute('data-go');
      state.filter = (k==='zero') ? 'all' : k;
      render(); document.querySelector('.tab[data-t=rank]').click();
    });
  });
}

/* ============ 前后半程 ============ */
function renderCompare(){
  var fh = weekTotals[0]+weekTotals[1]+weekTotals[2];
  var sh = weekTotals[3]+weekTotals[4]+weekTotals[5]+weekTotals[6];
  var d = sh-fh;
  $('cmpStat').innerHTML =
    '<div class="stat"><b>'+fh+'</b><span>前三周（W1–W3）</span></div>'+
    '<div class="stat"><b>'+sh+'</b><span>后四周（W4–W7）</span></div>'+
    '<div class="stat"><b style="color:'+(d>0?'#e11d48':'#10b981')+'">'+(d>0?'+':'')+d+'</b><span>净变化'+(d>0?'（扩散）':'（收敛）')+'</span></div>';
  var arr = RANK.slice().sort(function(a,b){return Math.abs(b.delta)-Math.abs(a.delta) || b.total-a.total;}).slice(0,10);
  var max = Math.max.apply(null, arr.map(function(s){return Math.abs(s.delta);})) || 1;
  var html = '<div style="display:grid;gap:7px;margin-top:6px">';
  arr.forEach(function(s){
    var w = Math.abs(s.delta)/max*45, neg = s.delta<0;
    html += '<div style="display:grid;grid-template-columns:78px 1fr 60px;gap:8px;align-items:center;cursor:pointer" data-n="'+esc(s.name)+'">'+
      '<span style="font-size:13px;font-weight:700">'+esc(s.name)+'</span>'+
      '<div style="display:flex;align-items:center;position:relative;height:18px;background:#f6f8fd;border-radius:5px">'+
        '<div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:#dfe4f2"></div>'+
        '<div style="position:absolute;'+(neg?'right:50%;':'left:50%;')+'width:'+w+'%;height:14px;border-radius:4px;background:'+(neg?'#10b981':'#ef4444')+'"></div></div>'+
      '<span style="font-size:12.5px;text-align:right;font-weight:700;color:'+(neg?'#10b981':(s.delta>0?'#ef4444':'#aeb5c7'))+'">'+(s.delta>0?'+':'')+s.delta+'</span></div>';
  });
  html += '</div><div class="desc" style="margin:12px 0 0">左侧绿色＝后半程减少，右侧红色＝后半程增加；点击姓名查看档案。</div>';
  var el = $('cmpBars');
  el.innerHTML = html;
  el.querySelectorAll('[data-n]').forEach(function(n){
    n.addEventListener('click', function(){ openSheet(n.getAttribute('data-n')); });
  });
}

/* ============ 重点关注 ============ */
function renderFocus(){
  var top = RANK.slice(0,5);
  var active = BAD.filter(function(s){return s.w[6]>0 || s.w[5]>0;})
                .sort(function(a,b){return (b.w[6]*2+b.w[5])-(a.w[6]*2+a.w[5]);});
  var html = '<div style="font-size:12.5px;color:#7c859e;margin-bottom:8px">累计 Top 5</div><div class="chips">';
  top.forEach(function(s){ html += '<span class="pill red" data-n="'+esc(s.name)+'">'+esc(s.name)+' · '+s.total+' 次</span>'; });
  html += '</div><div style="font-size:12.5px;color:#7c859e;margin:16px 0 8px">第六–七周仍在违纪（'+active.length+' 人）</div><div class="chips">';
  active.forEach(function(s){ html += '<span class="pill" data-n="'+esc(s.name)+'">'+esc(s.name)+' · W6 '+s.w[5]+' / W7 '+s.w[6]+'</span>'; });
  html += '</div>';
  var el = $('focus');
  el.innerHTML = html;
  el.querySelectorAll('[data-n]').forEach(function(n){
    n.addEventListener('click', function(){ openSheet(n.getAttribute('data-n')); });
  });
}

/* ============ 气象台 ============ */
function renderWeather(){
  var v = weekTotals[6], p = weekPeople[6];
  var map = [
    {max:5,  em:'☀️', t:'晴',   d:'风平浪静，适合表扬一波'},
    {max:11, em:'🌤️', t:'多云', d:'零星波动，正常范围'},
    {max:18, em:'⛅', t:'阴',   d:'有点闷，需要提前提醒'},
    {max:28, em:'🌧️', t:'小雨', d:'纪律开始漏水，得盯一盯'},
    {max:99, em:'⛈️', t:'暴雨', d:'高压预警，建议开一次主题班会'}
  ];
  var w = map.filter(function(m){return v<=m.max;})[0];
  var cmp = v - weekTotals[5];
  var html = '<div class="wx"><div class="em">'+w.em+'</div><div class="tx"><b>本周天气：'+w.t+'（'+v+' 次 / '+p+' 人）</b>'+
    '<div>'+w.d+'<br>较上周 '+(cmp>0?'增加 '+cmp+' 次':(cmp<0?'减少 '+(-cmp)+' 次':'持平'))+' · 七周均值 '+(TOTAL/7).toFixed(1)+' 次</div></div></div>';
  $('wxBox').innerHTML = html;
}

/* ============ 学科重灾区 ============ */
function renderTopSub(){
  var idx = subTotals.map(function(v,i){return i;}).sort(function(a,b){return subTotals[b]-subTotals[a];}).slice(0,6);
  var mx = Math.max.apply(null, subTotals) || 1;
  $('topSub').innerHTML = idx.map(function(i){
    return '<div class="subbar"><span style="font-weight:700">'+SUBS[i]+'</span>'+
      '<div class="t"><i style="width:'+(subTotals[i]/mx*100)+'%"></i></div>'+
      '<em>'+subTotals[i]+' 次 / '+subPeople[i]+' 人</em></div>';
  }).join('');
}

/* ============ 排行榜 ============ */
function renderRank(){
  var list = RANK.slice();
  if(state.filter==='high') list = list.filter(function(s){return s.level==='high';});
  if(state.filter==='mid') list = list.filter(function(s){return s.level==='mid';});
  if(state.filter==='low') list = list.filter(function(s){return s.level==='low';});
  if(state.filter==='active') list = list.filter(function(s){return s.w[6]>0||s.w[5]>0;});
  if(state.filter==='worse') list = list.filter(function(s){return s.delta>0;});
  if(state.q) list = list.filter(function(s){return s.name.toLowerCase().indexOf(state.q.toLowerCase())>=0;});
  var key = state.sort;
  list.sort(function(a,b){
    if(key==='total') return b.total-a.total || b.recent-a.recent;
    if(key==='recent') return (b.w[6]-a.w[6]) || (b.w[5]-a.w[5]) || (b.total-a.total);
    if(key==='delta') return b.delta-a.delta || b.total-a.total;
    if(key==='subspread') return b.subSpread-a.subSpread || b.total-a.total;
    return b.spread-a.spread || b.total-a.total;
  });
  var max = Math.max.apply(null, list.map(function(s){return s.total;})) || 1;
  $('rankList').innerHTML = list.length ? list.map(function(s){
    var t = s.delta>0 ? '<span class="trend-up">▲'+s.delta+'</span>'
          : s.delta<0 ? '<span class="trend-down">▼'+(-s.delta)+'</span>'
          : '<span class="trend-flat">—</span>';
    return '<div class="row" data-n="'+esc(s.name)+'">'+
      '<div class="rk'+(s.rank<=5?' top':'')+'">'+s.rank+'</div>'+
      '<div class="nm">'+esc(s.name)+'<small>活跃 '+s.spread+' 周 · '+s.subSpread+' 科</small></div>'+
      '<div class="track"><div class="fill" style="width:'+(s.total/max*100)+'%;background:'+color(s.total)+'"></div></div>'+
      '<div class="val">'+s.total+' 次 '+t+'</div></div>';
  }).join('') : '<div class="desc" style="padding:20px;text-align:center">没有符合条件的同学</div>';
  document.querySelectorAll('#rankList .row').forEach(function(r){
    r.addEventListener('click', function(){ openSheet(r.getAttribute('data-n')); });
  });
}

/* ============ 周明细 ============ */
function renderWeek(){
  $('weekChips').innerHTML = SHORT.map(function(s,i){
    return '<span class="chip'+(state.week===i?' on':'')+'" data-w="'+i+'">'+s+' · '+weekTotals[i]+' 次 / '+weekPeople[i]+' 人</span>';
  }).join('');
  document.querySelectorAll('#weekChips .chip').forEach(function(c){
    c.addEventListener('click', function(){ state.week = +c.getAttribute('data-w'); render(); });
  });
  var i = state.week;
  var rows = BAD.filter(function(s){return s.w[i]>0;}).sort(function(a,b){return b.w[i]-a.w[i];});
  var html = '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:10px">'+
    '<b style="font-size:15px">'+WEEKS[i]+'</b>'+
    '<span style="font-size:12.5px;color:#7c859e">违纪 '+weekTotals[i]+' 次 · 涉及 '+weekPeople[i]+' 人 · 占班级 '+Math.round(weekPeople[i]/state.classSize*100)+'%</span></div>';
  if(!rows.length){ html += '<div class="desc">该周无违纪记录。</div>'; }
  else{
    html += '<table><thead><tr><th style="width:52px">#</th><th>姓名</th><th style="width:80px" class="num">本周</th>'+
            '<th style="width:80px" class="num">累计</th><th style="width:150px">七周分布</th></tr></thead><tbody>';
    rows.forEach(function(s,idx){
      var mini = s.w.map(function(v,j){
        return '<i title="'+SHORT[j]+'" style="display:inline-block;width:13px;height:13px;margin-right:2px;border-radius:3px;background:'+
          (v? color(v) : '#eef1f8')+(j===i?';outline:2px solid #1e2439;outline-offset:1px':'')+'"></i>';
      }).join('');
      html += '<tr data-n="'+esc(s.name)+'" style="cursor:pointer"><td>'+(idx+1)+'</td><td><b>'+esc(s.name)+'</b></td>'+
        '<td class="num"><b style="color:'+color(s.w[i])+'">'+s.w[i]+'</b></td><td class="num">'+s.total+'</td><td>'+mini+'</td></tr>';
    });
    html += '</tbody></table>';
  }
  var el = $('weekTable');
  el.innerHTML = html;
  el.querySelectorAll('tr[data-n]').forEach(function(tr){
    tr.addEventListener('click', function(){ openSheet(tr.getAttribute('data-n')); });
  });

  var ft = '<thead><tr><th>姓名</th>'+SHORT.map(function(s){return '<th class="num">'+s+'</th>';}).join('')+'<th class="num">总计</th></tr></thead><tbody>';
  RANK.forEach(function(s){
    ft += '<tr data-n="'+esc(s.name)+'" style="cursor:pointer"><td><b>'+esc(s.name)+'</b></td>'+
      s.w.map(function(v){return '<td class="num" style="color:'+(v?color(v):'#c8cdd9')+'">'+(v||'·')+'</td>';}).join('')+
      '<td class="num"><b>'+s.total+'</b></td></tr>';
  });
  ft += '</tbody><tfoot><tr><th>合计</th>'+weekTotals.map(function(v){return '<th class="num">'+v+'</th>';}).join('')+
        '<th class="num">'+TOTAL+'</th></tr></tfoot>';
  var ftel = $('fullTable');
  ftel.innerHTML = ft;
  ftel.querySelectorAll('tr[data-n]').forEach(function(tr){
    tr.addEventListener('click', function(){ openSheet(tr.getAttribute('data-n')); });
  });
}

/* ============ 学科透视 ============ */
function renderSubBars(){
  var mxT = Math.max.apply(null,subTotals)||1, mxP = Math.max.apply(null,subPeople)||1;
  var idx = subTotals.map(function(v,i){return i;}).sort(function(a,b){return subTotals[b]-subTotals[a];});
  $('subBars').innerHTML = idx.map(function(i){
    return '<div class="subbar"><span style="font-weight:700">'+SUBS[i]+'</span>'+
      '<div class="t" style="position:relative"><i style="width:'+(subTotals[i]/mxT*100)+'%"></i>'+
      '<b style="position:absolute;left:'+(subPeople[i]/mxP*100)+'%;top:-2px;bottom:-2px;width:2px;background:#f59e0b"></b></div>'+
      '<em>'+subTotals[i]+' 次 / '+subPeople[i]+' 人</em></div>';
  }).join('') + '<div class="desc" style="margin-top:10px">紫色条＝违纪次数，黄色竖线＝涉及人数（相对刻度）。</div>';
}
function renderSubKings(){
  var html = '<div class="chips">';
  SUBS.forEach(function(sub,j){
    var arr = BAD.filter(function(s){return s.sub[j]>0;}).sort(function(a,b){return b.sub[j]-a.sub[j];});
    if(!arr.length){ html += '<span class="pill green">'+sub+' · 全员安好</span>'; return; }
    var top = arr[0];
    html += '<span class="pill '+(top.sub[j]>=3?'red':(top.sub[j]>=2?'gold':'blue'))+'" data-n="'+esc(top.name)+'">'+
      sub+' 👑 '+esc(top.name)+' · '+top.sub[j]+' 次</span>';
  });
  html += '</div>';
  var el = $('subKings');
  el.innerHTML = html;
  el.querySelectorAll('[data-n]').forEach(function(n){
    n.addEventListener('click', function(){ openSheet(n.getAttribute('data-n')); });
  });
}
function renderSubSpread(){
  var buckets = [
    {t:'一科专精（1 科）', c:'#818cf8', n:BAD.filter(function(s){return s.subSpread===1;}).length},
    {t:'双线作战（2 科）', c:'#3b82f6', n:BAD.filter(function(s){return s.subSpread===2;}).length},
    {t:'三科涉猎（3 科）', c:'#f59e0b', n:BAD.filter(function(s){return s.subSpread===3;}).length},
    {t:'全面开花（≥4 科）', c:'#e11d48', n:BAD.filter(function(s){return s.subSpread>=4;}).length}
  ];
  var sum = buckets.reduce(function(a,b){return a+b.n;},0)||1;
  $('subSpreadBox').innerHTML = buckets.map(function(b){
    return '<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px">'+
      '<span>'+b.t+'</span><b>'+b.n+' 人 · '+Math.round(b.n/sum*100)+'%</b></div>'+
      '<div style="height:14px;background:#f1f3fa;border-radius:7px;overflow:hidden">'+
      '<i style="display:block;height:100%;width:'+(b.n/sum*100)+'%;background:'+b.c+';border-radius:7px"></i></div></div>';
  }).join('');
}
function renderSubHeat(){
  var list = RANK.slice();
  if(state.q) list = list.filter(function(s){return s.name.toLowerCase().indexOf(state.q.toLowerCase())>=0;});
  var g = $('subHeat');
  g.style.gridTemplateColumns = '92px repeat('+NS+',minmax(34px,1fr))';
  g.style.minWidth = '680px';
  var html = '<div class="hhead"></div>'+SUBS.map(function(s){return '<div class="hhead">'+s+'</div>';}).join('');
  list.forEach(function(s){
    html += '<div class="hname" data-n="'+esc(s.name)+'">'+esc(s.name)+'</div>';
    s.sub.forEach(function(v,j){
      html += '<div class="hcell '+lv(v)+'" data-t="'+esc(s.name)+' · '+SUBS[j]+'：'+v+' 次（全班该科 '+subTotals[j]+' 次）">'+(v||'')+'</div>';
    });
  });
  g.innerHTML = html;
  g.querySelectorAll('.hcell').forEach(function(c){
    var t = c.getAttribute('data-t');
    c.addEventListener('mousemove', function(e){ showTip(e,t); });
    c.addEventListener('mouseleave', hideTip);
  });
  g.querySelectorAll('.hname').forEach(function(h){
    h.addEventListener('click', function(){ openSheet(h.getAttribute('data-n')); });
  });
}

/* ============ 热力图（只读） ============ */
function renderHeat(){
  var list = RANK.slice();
  if(state.q) list = list.filter(function(s){return s.name.toLowerCase().indexOf(state.q.toLowerCase())>=0;});
  var g = $('heatGrid');
  g.style.gridTemplateColumns = '92px repeat('+NW+',minmax(42px,1fr))';
  g.style.minWidth = '520px';
  var html = '<div class="hhead"></div>'+SHORT.map(function(s){return '<div class="hhead">'+s+'</div>';}).join('');
  list.forEach(function(s){
    html += '<div class="hname" data-n="'+esc(s.name)+'">'+esc(s.name)+'</div>';
    s.w.forEach(function(v,j){
      html += '<div class="hcell '+lv(v)+'" data-n="'+esc(s.name)+'" '+
        'data-t="'+esc(s.name)+' · '+WEEKS[j]+'：'+v+' 次（全班当周 '+weekTotals[j]+' 次）">'+(v||'')+'</div>';
    });
  });
  g.innerHTML = html;
  g.querySelectorAll('.hcell').forEach(function(c){
    var name = c.getAttribute('data-n');
    c.addEventListener('click', function(){ openSheet(name); });
    var t = c.getAttribute('data-t');
    c.addEventListener('mousemove', function(e){ showTip(e,t); });
    c.addEventListener('mouseleave', hideTip);
  });
  g.querySelectorAll('.hname').forEach(function(h){
    h.addEventListener('click', function(){ openSheet(h.getAttribute('data-n')); });
  });
}

/* ============ 形态分类 ============ */
function renderPattern(){
  var groups = {
    '持续型': BAD.filter(function(s){return s.spread>=4;}),
    '集中爆发型': BAD.filter(function(s){return s.spread<=2 && s.total>=2;}),
    '新增/复发型': BAD.filter(function(s){return s.spread<=3 && (s.w[6]+s.w[5])>0 && s.first>0;}),
    '已收敛型': BAD.filter(function(s){return s.first>0 && (s.w[3]+s.w[4]===0);})
  };
  var tips = {
    '持续型':'七周中有 4 周以上违纪，习惯性问题，需长期跟踪',
    '集中爆发型':'次数集中在 1–2 周内，多为偶发冲突或特定事件',
    '新增/复发型':'前期有过、近期又出现，需要及时提醒',
    '已收敛型':'第四周起已归零，干预见效或已自行改正'
  };
  var html = '<div class="grid2b" style="gap:12px">';
  Object.keys(groups).forEach(function(k){
    var arr = groups[k].sort(function(a,b){return b.total-a.total;});
    html += '<div class="card" style="margin:0;box-shadow:none"><h3 style="font-size:14.5px">'+k+' <span style="color:#aeb5c7;font-weight:600">'+arr.length+' 人</span></h3>'+
      '<div class="desc" style="margin-bottom:10px">'+tips[k]+'</div><div class="chips">'+
      (arr.length? arr.map(function(s){return '<span class="pill" data-n="'+esc(s.name)+'">'+esc(s.name)+' · '+s.total+'</span>';}).join('') : '<span class="desc">无</span>')+
      '</div></div>';
  });
  html += '</div>';
  var el = $('pattern');
  el.innerHTML = html;
  el.querySelectorAll('[data-n]').forEach(function(n){
    n.addEventListener('click', function(){ openSheet(n.getAttribute('data-n')); });
  });
}

/* ============ 个人档案 ============ */
function openSheet(name){
  var s = byName(name);
  if(!s) return;
  var W=560,H=190,pl=30,pt=26,pb=34, iw=W-pl-20, ih=H-pt-pb;
  var max = Math.max.apply(null, s.w.concat([1])), step = iw/NW, g='';
  for(var i=0;i<=2;i++){
    var y=pt+ih-ih*i/2;
    g += '<line x1="'+pl+'" y1="'+y+'" x2="'+(W-20)+'" y2="'+y+'" stroke="#eef1f8"/>'+
         '<text x="'+(pl-6)+'" y="'+(y+4)+'" font-size="10" fill="#aeb5c7" text-anchor="end">'+Math.round(max*i/2)+'</text>';
  }
  s.w.forEach(function(v,i){
    var x=pl+step*i+step/2, h=v/max*ih, y=pt+ih-h, bw=step*0.5;
    g += '<rect x="'+(x-bw/2)+'" y="'+y+'" width="'+bw+'" height="'+Math.max(h,2)+'" rx="5" fill="'+(v?color(v):'#eef1f8')+'"/>'+
      '<text x="'+x+'" y="'+(y-7)+'" font-size="11" font-weight="700" fill="'+(v?color(v):'#c8cdd9')+'" text-anchor="middle">'+v+'</text>'+
      '<text x="'+x+'" y="'+(pt+ih+18)+'" font-size="10.5" fill="#7c859e" text-anchor="middle">'+SHORT[i]+'</text>';
  });
  var submx = Math.max.apply(null, s.sub.concat([1]));
  var subHtml = s.sub.map(function(v,j){
    if(!v) return '';
    return '<div class="subbar"><span>'+SUBS[j]+'</span><div class="t"><i style="width:'+(v/submx*100)+'%"></i></div><em>'+v+' 次</em></div>';
  }).join('') || '<div class="desc">无学科明细记录</div>';
  var tags = [];
  if(s.total>=9) tags.push(['高频违纪','#fee2e2','#be123c']);
  else if(s.total>=4) tags.push(['需要提醒','#ffedd5','#c2410c']);
  else tags.push(['偶发','#e0e7ff','#4338ca']);
  if(s.w[6]>0) tags.push(['第七周仍在发生','#fee2e2','#be123c']);
  else if(s.w[5]>0) tags.push(['上周有、本周暂无','#fef3c7','#92400e']);
  else if(s.last===0 && s.first>0) tags.push(['后半程已归零','#d1fae5','#047857']);
  if(s.delta>0) tags.push(['后半程上升 '+s.delta,'#fee2e2','#be123c']);
  else if(s.delta<0) tags.push(['后半程下降 '+(-s.delta),'#d1fae5','#047857']);
  if(s.spread>=4) tags.push(['持续型','#ede9fe','#6d28d9']);
  else if(s.spread<=2 && s.total>=2) tags.push(['集中爆发型','#fce7f3','#9d174d']);
  if(s.subSpread>=4) tags.push(['全面开花','#fee2e2','#be123c']);
  else if(s.subSpread===1) tags.push(['一科专精','#e0e7ff','#4338ca']);
  $('sheet').innerHTML =
    '<button class="close" id="cls">✕</button>'+
    '<h2>'+esc(s.name)+'<span style="font-size:13px;color:#7c859e;font-weight:600;margin-left:10px">班级第 '+s.rank+' / '+RANK.length+' 位</span></h2>'+
    '<div class="sub">七周累计 <b>'+s.total+'</b> 次 · 活跃 '+s.spread+' / 7 周 · 单周最高 '+s.maxw+' 次 · 涉及 '+s.subSpread+' 门学科</div>'+
    '<div style="margin-top:10px">'+tags.map(function(t){return '<span class="tag" style="background:'+t[1]+';color:'+t[2]+'">'+t[0]+'</span>';}).join('')+'</div>'+
    '<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block;margin-top:12px">'+g+'</svg>'+
    '<div class="statgrid">'+
      '<div class="stat"><b>'+s.first+'</b><span>前三周 W1–W3</span></div>'+
      '<div class="stat"><b>'+s.last+'</b><span>后四周 W4–W7</span></div>'+
      '<div class="stat"><b style="color:'+(s.delta>0?'#e11d48':'#10b981')+'">'+(s.delta>0?'+':'')+s.delta+'</b><span>后半程变化</span></div>'+
      '<div class="stat"><b>'+Math.round(s.total/(TOTAL||1)*100)+'%</b><span>占全班违纪</span></div></div>'+
    '<div style="font-size:12.5px;color:#7c859e;margin:6px 0">学科明细（主战场：'+s.topSub+' '+s.maxSub+' 次）</div>'+
    subHtml+
    '<div class="advice" style="background:#fffbeb;border-color:#fde68a"><b>趣味称号：</b>'+badgesOf(s).map(function(b){return b.t;}).join('、')+'</div>';
  $('modal').classList.add('on');
  $('cls').addEventListener('click', closeSheet);
}
function closeSheet(){ $('modal').classList.remove('on'); }
$('modal').addEventListener('click', function(e){ if(e.target.id==='modal') closeSheet(); });
document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeSheet(); });

/* ============ 徽章 ============ */
function badgesOf(s){
  var b = [];
  if(s.spread===NW) b.push({t:'七周全勤',d:'七周全部上榜，一次没落下'});
  else if(s.spread>=5) b.push({t:'高频常客',d:'七周里 '+s.spread+' 周有记录'});
  if(s.maxw>=4) b.push({t:'单周四杀',d:'单周最高 '+s.maxw+' 次'});
  if(s.streak>=4) b.push({t:'连续 '+s.streak+' 连',d:'连续 '+s.streak+' 周违纪，习惯性强'});
  if(s.first>0 && s.last===0) b.push({t:'浪子回头',d:'后半程完全归零'});
  if(s.first===0 && s.last>0) b.push({t:'后半程新秀',d:'前半程干净，后半程开始出现'});
  if(s.delta<=-3) b.push({t:'急速刹车',d:'后半程减少 '+(-s.delta)+' 次'});
  if(s.delta>=3) b.push({t:'油门踩到底',d:'后半程增加 '+s.delta+' 次'});
  if(s.total===1) b.push({t:'差一点就完美',d:'七周只出现过 1 次'});
  if(s.w[0]>0 && s.total===s.w[0] && s.total>0) b.push({t:'开局即巅峰',d:'所有违纪都发生在第一周'});
  if(s.w[6]>0 && s.w[5]===0) b.push({t:'突然袭击',d:'第六周安静，第七周又出现'});
  if(s.total>=9) b.push({t:'榜单常青树',d:'累计 '+s.total+' 次，位居前列'});
  if(s.subSpread>=5) b.push({t:'五科开花',d:'在 '+s.subSpread+' 门学科都有记录'});
  else if(s.subSpread===1 && s.total>0) b.push({t:'一科专精',d:'只在'+s.topSub+'出过状况'});
  if(s.maxSub>=3) b.push({t:s.topSub+'课钉子户',d:s.topSub+'课累计 '+s.maxSub+' 次'});
  if(s.sub[9]>=2) b.push({t:'音乐课驻唱',d:'音乐课 '+s.sub[9]+' 次'});
  if(s.sub[4]>=3) b.push({t:'政治课辩手',d:'政治课 '+s.sub[4]+' 次'});
  if(s.sub[12]>0) b.push({t:'查无实据',d:'有 '+s.sub[12]+' 次未记录学科'});
  if(s.w[PEAK]>0) b.push({t:'峰值周见证者',d:'在违纪最多的'+WEEKS[PEAK]+'也有记录'});
  if(!b.length) b.push({t:'安静选手',d:'偶发、低频，没什么起伏'});
  return b;
}
function renderBadges(){
  var html = '<div class="grid3" style="gap:10px">';
  RANK.forEach(function(s){
    var bs = badgesOf(s);
    html += '<div style="border:1px solid var(--line);border-radius:14px;padding:12px 14px;cursor:pointer" data-n="'+esc(s.name)+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline">'+
      '<b style="font-size:14px">'+esc(s.name)+'</b><span style="font-size:12px;color:#7c859e">'+s.total+' 次</span></div>'+
      '<div class="badges" style="margin-top:8px">'+bs.slice(0,3).map(function(b,i){
        return '<span class="bg'+(i===0?' g':'')+'" title="'+b.d+'">'+(i===0?'🏅':'🎖️')+' '+b.t+'</span>';
      }).join('')+'</div></div>';
  });
  html += '</div>';
  var el = $('badgeWall');
  el.innerHTML = html;
  el.querySelectorAll('[data-n]').forEach(function(n){
    n.addEventListener('click', function(){ openSheet(n.getAttribute('data-n')); });
  });
}

/* ============ 荣誉墙（零违纪） ============ */
var ZERO_TITLES = ['隐形大佬','纪律标兵','空气感选手','静音模式','背景板艺术家','低调王者','完美主义者','零失误选手','省心代表','结界持有者','稳定器','模范座标'];
function allZeroNames(){
  var arr = zeroNamesInData();
  for(var i=0;i<unknownCount();i++) arr.push('神秘同学 #'+(i+1));
  return arr;
}
function renderHonor(){
  var arr = allZeroNames();
  var html = '<div class="statgrid">'+
    '<div class="stat"><b style="color:#10b981">'+zeroCount()+'</b><span>零违纪人数</span></div>'+
    '<div class="stat"><b>'+Math.round(zeroCount()/state.classSize*100)+'%</b><span>占班级比例</span></div>'+
    (unknownCount() ? '<div class="stat"><b>'+unknownCount()+'</b><span>未录入（神秘同学）</span></div>' : '')+'</div>';
  if(!arr.length){ html += '<div class="desc">当前班级人数设置下没有零违纪名额。</div>'; }
  else{
    html += '<div class="chips">'+arr.map(function(n,i){
      var t = ZERO_TITLES[i % ZERO_TITLES.length];
      return '<span class="pill green">🛡️ '+esc(n)+' · '+t+'</span>';
    }).join('')+'</div>';
  }
  $('honor').innerHTML = html;
}

/* ============ 颁奖典礼 ============ */
function buildAwards(){
  var A = [];
  function top1(arr, key){
    if(!arr.length) return null;
    return arr.slice().sort(function(a,b){ return key(b)-key(a); })[0];
  }
  var a;
  a = top1(BAD, function(s){return s.total;});
  if(a) A.push({ico:'👑', ttl:'终身成就奖', who:a.name, why:'七周累计 '+a.total+' 次，全班的「天花板」', rib:'累计最高', bg:'linear-gradient(135deg,#f43f5e,#f97316)'});
  a = top1(BAD, function(s){return s.maxw;});
  if(a) A.push({ico:'💥', ttl:'单周爆发奖', who:a.name, why:'单周最高 '+a.maxw+' 次，'+WEEKS[a.w.indexOf(a.maxw)]+'火力全开', rib:'单周峰值', bg:'linear-gradient(135deg,#dc2626,#a855f7)'});
  a = top1(BAD, function(s){return s.spread;});
  if(a) A.push({ico:'📆', ttl:'全勤上榜奖', who:a.name, why:'七周里 '+a.spread+' 周都有记录，稳定得让人心疼', rib:'活跃周数', bg:'linear-gradient(135deg,#7c3aed,#4f46e5)'});
  a = top1(BAD, function(s){return s.subSpread;});
  if(a) A.push({ico:'🎨', ttl:'全面开花奖', who:a.name, why:'横跨 '+a.subSpread+' 门学科，主战场是'+a.topSub, rib:'学科广度', bg:'linear-gradient(135deg,#db2777,#f59e0b)'});
  a = top1(BAD.filter(function(s){return s.first>0 && s.last===0;}), function(s){return s.first;});
  if(a) A.push({ico:'🕊️', ttl:'浪子回头奖', who:a.name, why:'前三周 '+a.first+' 次，后四周直接归零', rib:'最强反转', bg:'linear-gradient(135deg,#10b981,#3b82f6)'});
  a = top1(BAD.filter(function(s){return s.delta>0;}), function(s){return s.delta;});
  if(a) A.push({ico:'📈', ttl:'反弹之星奖', who:a.name, why:'后半程比前半程多了 '+a.delta+' 次，需要重新关注', rib:'后半程上升', bg:'linear-gradient(135deg,#f59e0b,#ef4444)'});
  a = top1(BAD.filter(function(s){return s.delta<0;}), function(s){return -s.delta;});
  if(a) A.push({ico:'📉', ttl:'进步最快奖', who:a.name, why:'后半程减少了 '+(-a.delta)+' 次，改变看得见', rib:'后半程下降', bg:'linear-gradient(135deg,#3b82f6,#10b981)'});
  a = top1(BAD.filter(function(s){return s.w[6]>0;}), function(s){return s.w[6];});
  if(a) A.push({ico:'⚡', ttl:'闪电侠奖', who:a.name, why:'第七周就有 '+a.w[6]+' 次，收尾还在冲', rib:'最近一周', bg:'linear-gradient(135deg,#0ea5e9,#6366f1)'});
  var one = BAD.filter(function(s){return s.total===1;});
  if(one.length) A.push({ico:'🎯', ttl:'差一点就完美奖', who:one[0].name+' 等 '+one.length+' 人', why:'七周只出现过 1 次，四舍五入就是没犯过', rib:'最轻微', bg:'linear-gradient(135deg,#64748b,#94a3b8)'});
  a = top1(BAD.filter(function(s){return s.first===0 && s.last>0;}), function(s){return s.last;});
  if(a) A.push({ico:'🌱', ttl:'后半程新秀奖', who:a.name, why:'前半程零记录，后四周出现 '+a.last+' 次，需要及时提醒', rib:'新出现', bg:'linear-gradient(135deg,#db2777,#f59e0b)'});
  a = top1(BAD.filter(function(s){return s.streak>=3;}), function(s){return s.streak;});
  if(a) A.push({ico:'🔥', ttl:'连续剧奖', who:a.name, why:'最长连续 '+a.streak+' 周违纪，堪称连续剧主角', rib:'连续周数', bg:'linear-gradient(135deg,#b91c1c,#7c3aed)'});
  var sci = BAD.filter(function(s){return s.sub[1]>0;});
  a = top1(sci, function(s){return s.sub[1];});
  if(a) A.push({ico:'🔢', ttl:'数学课杀手', who:a.name, why:'数学课 '+a.sub[1]+' 次，黑板上的函数大概在跳舞', rib:'学科单项', bg:'linear-gradient(135deg,#4f46e5,#0ea5e9)'});
  a = top1(BAD.filter(function(s){return s.sub[4]>0;}), function(s){return s.sub[4];});
  if(a) A.push({ico:'🗣️', ttl:'政治课嘴强王者', who:a.name, why:'政治课 '+a.sub[4]+' 次，辩论天赋点满了', rib:'学科单项', bg:'linear-gradient(135deg,#be123c,#f59e0b)'});
  a = top1(BAD.filter(function(s){return s.sub[9]>0;}), function(s){return s.sub[9];});
  if(a) A.push({ico:'🎤', ttl:'音乐课驻唱嘉宾', who:a.name, why:'音乐课 '+a.sub[9]+' 次，嗓子比课本忙', rib:'学科单项', bg:'linear-gradient(135deg,#7c3aed,#db2777)'});
  a = top1(BAD.filter(function(s){return s.sub[12]>0;}), function(s){return s.sub[12];});
  if(a) A.push({ico:'❓', ttl:'神秘失踪奖', who:a.name, why:'有 '+a.sub[12]+' 次违纪连科目都没记清', rib:'不详', bg:'linear-gradient(135deg,#475569,#94a3b8)'});
  var zc = zeroCount();
  A.push({ico:'🛡️', ttl:'集体免疫奖', who:zc+' 位零违纪同学', why:'七周一次没上榜，班级的稳定器', rib:'零违纪', bg:'linear-gradient(135deg,#059669,#0d9488)'});
  A.push({ico:'🌋', ttl:'最疯狂一周', who:WEEKS[PEAK], why:'全班 '+weekTotals[PEAK]+' 次、涉及 '+weekPeople[PEAK]+' 人，占七周总量 '+Math.round(weekTotals[PEAK]/(TOTAL||1)*100)+'%', rib:'峰值周', bg:'linear-gradient(135deg,#7c2d12,#dc2626)'});
  var si = subTotals.indexOf(Math.max.apply(null,subTotals));
  A.push({ico:'📚', ttl:'最难hold住的课', who:SUBS[si], why:'全班 '+subTotals[si]+' 次、'+subPeople[si]+' 人在这一科翻过车', rib:'学科重灾区', bg:'linear-gradient(135deg,#4338ca,#7c3aed)'});
  return A;
}
var AWARDS = [], revealed = 0;
function renderAwards(){
  AWARDS = buildAwards();
  $('awards').innerHTML = AWARDS.map(function(a,i){
    var hide = (i < revealed) ? '' : ' hide';
    return '<div class="award'+hide+'" style="background:'+a.bg+'" data-i="'+i+'">'+
      '<div class="rib">'+esc(a.rib)+'</div><div class="ico">'+a.ico+'</div>'+
      '<div class="ttl">'+esc(a.ttl)+'</div><div class="who">'+esc(a.who)+'</div>'+
      '<div class="why">'+esc(a.why)+'</div></div>';
  }).join('');
  document.querySelectorAll('#awards .award').forEach(function(c){
    c.addEventListener('click', function(){
      var a = AWARDS[+c.getAttribute('data-i')];
      var n = a.who.split(' ')[0];
      if(byName(n)) openSheet(n);
    });
  });
}
$('revealBtn').addEventListener('click', function(){
  revealed = 0; renderAwards();
  var timer = setInterval(function(){
    revealed++; renderAwards();
    var cards = document.querySelectorAll('#awards .award');
    if(cards[revealed-1]) cards[revealed-1].classList.add('reveal');
    if(revealed >= AWARDS.length) clearInterval(timer);
  }, 620);
});
$('showAllBtn').addEventListener('click', function(){ revealed = AWARDS.length; renderAwards(); });

/* ============ 幸运转盘 ============ */
var wheelAngle = 0, spinning = false, wheelNamesCache = [];
function wheelNames(){
  var arr = [];
  if(state.wheelSrc==='all') arr = RANK.map(function(s){return s.name;}).concat(allZeroNames());
  else if(state.wheelSrc==='bad') arr = RANK.map(function(s){return s.name;});
  else if(state.wheelSrc==='zero') arr = allZeroNames();
  else if(state.wheelSrc==='top') arr = RANK.slice(0,10).map(function(s){return s.name;});
  else{
    var raw = $('customNames').value || '';
    arr = raw.split(/[\s,，、;；]+/).filter(function(x){return x.length;});
  }
  if(state.noRepeat) arr = arr.filter(function(n){return state.picked.indexOf(n)<0;});
  if(!arr.length) arr = ['（名单为空，请切换来源）'];
  return arr;
}
/* 用 CSS conic-gradient 画盘面 + DOM 文字，纯 CSS 渲染，不依赖 canvas */
var WHEEL_PALETTE = ['#6366f1','#f43f5e','#f59e0b','#10b981','#8b5cf6','#0ea5e9','#ec4899','#14b8a6','#f97316','#3b82f6','#a855f7','#ef4444'];
function drawWheel(names){
  var el = $('wheelDisc');
  if(!el) return;
  wheelNamesCache = names.slice();
  var n = names.length, seg = 360/n;
  var stops = names.map(function(_, i){
    var c = n<=2 ? WHEEL_PALETTE[i] : WHEEL_PALETTE[i % WHEEL_PALETTE.length];
    return c + ' ' + (i*seg).toFixed(3) + 'deg ' + ((i+1)*seg).toFixed(3) + 'deg';
  });
  el.style.background = 'conic-gradient(' + stops.join(',') + ')';
  var fs = n<=8 ? 15 : (n<=16 ? 12 : (n<=30 ? 10 : 8.5));
  var rStart = n<=16 ? 0.42 : 0.52;
  var labels = names.map(function(nm, i){
    var a = -90 + i*seg + seg/2;              // 盘面坐标：0°＝12点，顺时针
    var label = nm.length > 6 ? nm.slice(0,6) + '…' : nm;
    return '<span class="wlabel" data-n="' + esc(nm) + '" style="font-size:' + fs + 'px;transform:rotate(' + a.toFixed(2) +
      'deg) translate(' + (150*rStart).toFixed(1) + 'px,-50%)">' + esc(label) + '</span>';
  }).join('');
  el.innerHTML = labels;
  el.style.transform = 'rotate(' + wheelAngle + 'deg)';
}
function paintWheel(){
  var el = $('wheelDisc');
  if(el) el.style.transform = 'rotate(' + wheelAngle + 'deg)';
}
function renderWheelStat(){
  var names = wheelNames();
  $('wheelStat').innerHTML =
    '<div class="stat"><b>'+names.length+'</b><span>当前参与人数</span></div>'+
    '<div class="stat"><b>'+state.picked.length+'</b><span>已抽过</span></div>'+
    '<div class="stat"><b>'+(state.noRepeat?'开':'关')+'</b><span>去重模式</span></div>'+
    '<div class="stat"><b>'+(state.weighted?'开':'关')+'</b><span>违纪加权</span></div>';
  $('pickedList').innerHTML = state.picked.length
    ? '已抽取：'+state.picked.map(function(n){return esc(n);}).join('、')
    : '还没有抽取记录。';
}
function pickIndex(names){
  if(!state.weighted) return rnd(names.length);
  var ws = names.map(function(n){ var s = byName(n); return (s ? s.total : 0) + 1; });
  var sum = ws.reduce(function(a,b){return a+b;},0);
  var r = Math.random()*sum;
  for(var i=0;i<ws.length;i++){ r -= ws[i]; if(r<=0) return i; }
  return names.length-1;
}
function spin(){
  if(spinning) return;
  var names = wheelNames();
  if(names.length === 1 && names[0].indexOf('（')===0){ toast('当前名单为空，换个名单来源试试'); return; }
  drawWheel(names);
  var n = names.length, seg = 360/n;
  var target = pickIndex(names);
  var from = wheelAngle;
  // 指针固定在正上方（对应绘制起点 -90°），要让第 target 格中心停在指针处，
  // 盘面需旋转 -center 度；加上 5 整圈保证有旋转过程
  var center = target*seg + seg/2;
  var cur = ((from % 360) + 360) % 360;
  var need = (360 - cur) + 360*5 + (360 - center);
  spinning = true;
  var btn = $('spinBtn');
  btn.disabled = true; btn.style.opacity = .6; btn.textContent = '转动中…';
  $('wheelResult').classList.remove('on');
  var dur = 4200, t0 = null, done = false, timer = null;
  function finish(){
    if(done) return;
    done = true;
    if(timer) clearTimeout(timer);
    wheelAngle = from + need;
    paintWheel();
    spinning = false;
    btn.disabled = false; btn.style.opacity = 1; btn.textContent = '开始转动';
    var winner = names[target];
    if(state.noRepeat && winner.indexOf('（')<0) state.picked.push(winner);
    var s = byName(winner);
    var modeTxt = {
      call:'请这位同学起立亮相',
      answer:'这道题就交给你了',
      focus:'本周重点关注对象',
      lucky:'今日幸运儿，奖励一次提问机会'
    }[state.wheelMode];
    var extraTxt = s ? '<br><span style="font-size:12.5px;color:#7c859e">七周累计 '+s.total+' 次 · 最近一周 '+s.w[6]+' 次 · 主战场 '+s.topSub+'</span>' : '';
    var el = $('wheelResult');
    el.innerHTML = modeTxt+'<b>🎉 '+esc(winner)+'</b><span>'+(new Date()).toLocaleString('zh-CN')+'</span>'+extraTxt;
    el.classList.add('on');
    renderWheelStat();
    markPicked();
  }
  function frame(ts){
    if(t0 === null) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    var e = 1 - Math.pow(1 - p, 4);           // easeOutQuart
    wheelAngle = from + need * e;
    paintWheel();
    if(p < 1){ requestAnimationFrame(frame); return; }
    finish();
  }
  requestAnimationFrame(frame);
  // 兜底：若动画帧未正常回调，4.8s 后直接落定，保证一定能出结果
  timer = setTimeout(finish, dur + 600);
}
/* 已抽过的名字在盘面上淡化 + 加删除线（不重建盘面，避免指针错位） */
function markPicked(){
  var el = $('wheelDisc');
  if(!el) return;
  var labels = el.querySelectorAll('.wlabel');
  for(var i=0;i<labels.length;i++){
    var t = labels[i].getAttribute('data-n') || labels[i].textContent;
    if(state.picked.indexOf(t) >= 0){
      labels[i].style.opacity = .3;
      labels[i].style.textDecoration = 'line-through';
    }
  }
}
$('spinBtn').addEventListener('click', spin);
var hubEl = document.querySelector('.hub');
if(hubEl) hubEl.addEventListener('click', spin);
var wheelEl = $('wheelDisc');
if(wheelEl) wheelEl.addEventListener('click', spin);
document.querySelectorAll('#wheelSrc [data-src]').forEach(function(c){
  c.addEventListener('click', function(){
    document.querySelectorAll('#wheelSrc [data-src]').forEach(function(x){x.classList.remove('on');});
    c.classList.add('on');
    state.wheelSrc = c.getAttribute('data-src');
    $('customBox').style.display = state.wheelSrc==='custom' ? 'flex' : 'none';
    drawWheel(wheelNames()); renderWheelStat();
  });
});
document.querySelectorAll('#wheelMode [data-mode]').forEach(function(c){
  c.addEventListener('click', function(){
    document.querySelectorAll('#wheelMode [data-mode]').forEach(function(x){x.classList.remove('on');});
    c.classList.add('on'); state.wheelMode = c.getAttribute('data-mode');
  });
});
$('noRepeat').addEventListener('click', function(){
  state.noRepeat = !state.noRepeat;
  this.textContent = '抽过的不再出现：' + (state.noRepeat?'开':'关');
  this.classList.toggle('on', state.noRepeat);
  renderWheelStat(); drawWheel(wheelNames());
});
$('weightMode').addEventListener('click', function(){
  state.weighted = !state.weighted;
  this.textContent = '违纪加权：' + (state.weighted?'开':'关');
  this.classList.toggle('on', state.weighted);
  renderWheelStat();
});
$('clearPicked').addEventListener('click', function(){
  state.picked = []; renderWheelStat(); drawWheel(wheelNames());
});
$('customNames').addEventListener('input', function(){ drawWheel(wheelNames()); renderWheelStat(); });
$('noRepeat').classList.add('on');

/* ============ 小工具 ============ */
function shuffleArr(a){
  var r = a.slice();
  for(var i=r.length-1;i>0;i--){ var j = rnd(i+1); var t = r[i]; r[i]=r[j]; r[j]=t; }
  return r;
}
function allNames(){ return RANK.map(function(s){return s.name;}).concat(allZeroNames()); }
function out(id, html){ var el = $(id); if(el) el.innerHTML = html; }
function val(id, def){ var el = $(id); var v = el ? parseInt(el.value,10) : NaN; return isNaN(v) ? def : v; }

/* 1. 全班随机排序 */
$('tShuffle').addEventListener('click', function(){
  var arr = shuffleArr(allNames());
  out('tShuffleOut', arr.map(function(n,i){
    var s = byName(n);
    return '<span class="seq" style="'+(s&&s.total>0?'background:#fff1f2;color:#be123c':'background:#ecfdf5;color:#047857')+'">'+(i+1)+'. '+esc(n)+'</span>';
  }).join(''));
});

/* 2. 随机抽 N 人 */
$('tPickBtn').addEventListener('click', function(){
  var n = Math.max(1, Math.min(allNames().length, val('tPickN',5)));
  var picks = shuffleArr(allNames()).slice(0,n);
  out('tPickOut', '<div style="margin-bottom:4px"><b style="font-size:15px;color:#1e2439">🎉 '+picks.map(esc).join('、')+'</b></div>'+
    picks.map(function(nm){
      var s = byName(nm);
      return '<div class="grp"><i>'+esc(nm)+'</i>'+(s ? '累计 '+s.total+' 次 · 主战场 '+s.topSub : '零违纪，稳')+'</div>';
    }).join(''));
});

/* 3. 随机座位表 */
$('tSeatBtn').addEventListener('click', function(){
  var col = Math.max(2, Math.min(10, val('tSeatCol',6)));
  var arr = shuffleArr(allNames());
  var rows = Math.ceil(arr.length/col);
  var g = document.createElement('div');
  var html = '<div class="seattab" style="grid-template-columns:repeat('+col+',1fr)">';
  var k = 0;
  for(var r=0;r<rows;r++){
    for(var c=0;c<col;c++){
      html += k < arr.length
        ? '<div class="seat">'+esc(arr[k++])+'</div>'
        : '<div class="seat empty">空</div>';
    }
  }
  html += '</div><div style="margin-top:6px;font-size:11.5px;color:#7c859e">共 '+arr.length+' 人 / '+col+' 列 / '+rows+' 排'+(arr.length%col? '，末排空 '+(col-arr.length%col)+' 位':'')+'</div>';
  out('tSeatOut', html);
});

/* 4. 一周值日表 */
$('tDutyBtn').addEventListener('click', function(){
  var days = ['周一','周二','周三','周四','周五'];
  var arr = shuffleArr(allNames());
  var g = [], k = 0, per = Math.ceil(arr.length/5);
  arr.forEach(function(nm){
    if(!g[k]) g[k] = [];
    g[k].push(nm);
    if(g[k].length >= per && k < 4) k++;
  });
  out('tDutyOut', days.map(function(d,i){
    var grp = g[i] || [];
    return '<div class="grp"><i>'+d+'</i>（'+grp.length+' 人）<br>'+grp.map(esc).join('、')+'</div>';
  }).join(''));
});

/* 5. 随机两两配对 */
$('tPairBtn').addEventListener('click', function(){
  var arr = shuffleArr(allNames());
  var pairs = [], i = 0;
  while(i < arr.length){
    if(i + 2 < arr.length) pairs.push([arr[i], arr[i+1]]), i += 2;
    else { pairs.push(arr.slice(i)); i = arr.length; }
  }
  out('tPairOut', pairs.map(function(p,idx){
    return '<div class="grp"><i>第 '+(idx+1)+' 组</i>'+p.map(esc).join(' ＋ ')+'</div>';
  }).join('') + '<div style="font-size:11.5px;color:#7c859e;margin-top:4px">共 '+pairs.length+' 组</div>');
});

/* 6. 违纪角色抽签 */



/* 7. 是非决策器 */



/* 8. 数字抽签 */


/* ===== 趣味实验室：大富翁 ===== */
var MP_CELLS = [
  {t:'起点', k:'start', e:'🏁', d:''},
  {t:'数学课\n被点名', k:'b', e:'📐', d:'退 2 格'},
  {t:'主动\n回答问题', k:'g', e:'🙋', d:'进 2 格'},
  {t:'第四周\n综合症', k:'b', e:'🌋', d:'退 3 格'},
  {t:'作业\n全对', k:'g', e:'💯', d:'进 3 格'},
  {t:'走神\n被抓', k:'b', e:'🫥', d:'退 1 格'},
  {t:'帮同学\n讲题', k:'g', e:'🤝', d:'进 2 格'},
  {t:'音乐课\n开口跪', k:'n', e:'🎤', d:'原地不动'},
  {t:'连续两周\n零违纪', k:'g', e:'✨', d:'进 4 格'},
  {t:'和同桌\n讲话', k:'b', e:'🗣️', d:'退 2 格'},
  {t:'体育课\n全员安好', k:'n', e:'⚽', d:'原地不动'},
  {t:'政治课\n辩赢了', k:'g', e:'⚖️', d:'进 2 格'},
  {t:'迟到\n一分钟', k:'b', e:'⏰', d:'退 1 格'},
  {t:'被老师\n表扬', k:'g', e:'🌟', d:'进 3 格'},
  {t:'信息课\n摸鱼', k:'b', e:'🐟', d:'退 2 格'},
  {t:'月考\n进步', k:'g', e:'📈', d:'进 3 格'},
  {t:'美术课\n走神', k:'n', e:'🎨', d:'原地不动'},
  {t:'上课\n吃东西', k:'b', e:'🍜', d:'退 3 格'},
  {t:'值日\n被夸', k:'g', e:'🧹', d:'进 2 格'},
  {t:'语文课\n朗读', k:'g', e:'📖', d:'进 1 格'},
  {t:'后排\n开小会', k:'b', e:'🤫', d:'退 2 格'},
  {t:'物理实验\n成功', k:'g', e:'🔬', d:'进 2 格'},
  {t:'被请\n家长', k:'b', e:'📞', d:'退回起点'},
  {t:'刑满\n释放', k:'end', e:'🎊', d:'到达终点'}
];
var mp = {pos:0, who:'', log:[], done:false};
function mpBoard(){
  var html = '<div class="mpgrid">';
  MP_CELLS.forEach(function(c,i){
    var cls = c.k==='start' ? 'start' : (c.k==='end' ? 'end' : c.k);
    html += '<div class="mpcell '+cls+(mp.pos===i?' here':'')+'" title="'+esc(c.t.replace(/\n/g,''))+'　'+(c.d||'')+'">'+
      '<i>'+c.e+'</i>'+esc(c.t).replace(/\n/g,'<br>')+'</div>';
  });
  html += '</div>';
  $('mpBoard').innerHTML = html;
}
function mpRender(){ mpBoard(); $('mpLog').innerHTML = mp.log.slice().reverse().map(function(x){return '<div>'+x+'</div>';}).join('') || '<div style="color:#aeb5c7">还没有开始，掷个骰子试试。</div>'; }
function mpStart(){
  mp.pos = 0; mp.log = []; mp.done = false;
  var sel = $('mpWho');
  mp.who = sel.value || (RANK[0] ? RANK[0].name : '');
  mpRender();
}
$('mpRoll').addEventListener('click', function(){
  if(mp.done){ toast('这局已经结束啦，点重新开始'); return; }
  var who = $('mpWho').value;
  var d = rnd(6)+1;
  $('mpDice').textContent = ['⚀','⚁','⚂','⚃','⚄','⚅'][d-1];
  var from = mp.pos;
  mp.pos = Math.min(MP_CELLS.length-1, mp.pos + d);
  var cell = MP_CELLS[mp.pos];
  mp.log.push('🎲 ' + esc(who) + ' 掷出 ' + d + ' → ' + String(from+1) + ' → ' + String(mp.pos+1) + ' 号格「' + cell.t.replace(/\n/g,'') + '」');
  if(mp.pos > 0 && mp.pos < MP_CELLS.length-1){
    if(cell.k==='g'){
      var adv = (cell.d.match(/(\d+)/)||[0,0])[1]|0;
      mp.pos = Math.min(MP_CELLS.length-1, mp.pos + adv);
      mp.log.push('　　' + cell.e + ' ' + cell.d + ' → 前进到 ' + String(mp.pos+1) + ' 号格');
    }else if(cell.k==='b'){
      if(cell.d.indexOf('起点')>=0){
        mp.pos = 0;
        mp.log.push('　　' + cell.e + ' 被请家长 → 打回起点 😱');
      }else{
        var back = (cell.d.match(/(\d+)/)||[0,0])[1]|0;
        mp.pos = Math.max(0, mp.pos - back);
        mp.log.push('　　' + cell.e + ' ' + cell.d + ' → 退到 ' + String(mp.pos+1) + ' 号格');
      }
    }else{
      mp.log.push('　　' + cell.e + ' 原地不动，躲过一劫');
    }
  }
  if(mp.pos >= MP_CELLS.length-1){
    mp.done = true;
    mp.log.push('🎊 ' + esc(who) + ' 走到终点，刑满释放！');
  }
  mpRender();
});
$('mpReset').addEventListener('click', function(){ mpStart(); $('mpDice').textContent=''; });
$('mpWho').addEventListener('change', function(){ mpStart(); });

/* ===== 趣味实验室：战力对决 ===== */
function powerOf(s){
  return [
    {k:'累计次数', a:s.total, w:1},
    {k:'单周峰值', a:s.maxw, w:2},
    {k:'学科广度', a:s.subSpread, w:2},
    {k:'活跃周数', a:s.spread, w:2},
    {k:'近期状态', a:s.w[6]*3 + s.w[5], w:1}
  ];
}
$('bpGo').addEventListener('click', function(){
  var A = byName($('bpA').value), B = byName($('bpB').value);
  if(!A || !B) return;
  if(A.name===B.name){ $('bpOut').innerHTML = '<div class="warn">选两个不同的同学吧。</div>'; return; }
  var pa = powerOf(A), pb = powerOf(B);
  var sa = 0, sb = 0, rows = '';
  pa.forEach(function(p,i){
    var q = pb[i];
    var mx = Math.max(1, p.a, q.a);
    var win = p.a > q.a ? 'l' : (q.a > p.a ? 'r' : '');
    if(p.a > q.a) sa++; else if(q.a > p.a) sb++;
    rows += '<div class="bprow"><span>' + p.k + '</span>' +
      '<div class="tk"><i class="l" style="width:' + (p.a/mx*50) + '%"></i><i class="r" style="width:' + (q.a/mx*50) + '%"></i></div>' +
      '<em style="color:' + (win==='l'?'#4f46e5':(win==='r'?'#e11d48':'#aeb5c7')) + '">' + p.a + ' : ' + q.a + '</em></div>';
  });
  var verdict = sa===sb
    ? '🤝 ' + esc(A.name) + ' 与 ' + esc(B.name) + ' 战成 ' + sa + ' : ' + sb + ' 平手，旗鼓相当'
    : (sa>sb
      ? '🏆 <b>' + esc(A.name) + '</b> 以 ' + sa + ' : ' + sb + ' 拿下这场对决'
      : '🏆 <b>' + esc(B.name) + '</b> 以 ' + sb + ' : ' + sa + ' 拿下这场对决');
  var totA = A.total, totB = B.total;
  var taunt = totA===totB ? '累计次数完全相同，纯靠分项决胜负。'
    : (totA>totB ? esc(A.name)+' 累计多 '+(totA-totB)+' 次，但战力看的是综合形态。'
                 : esc(B.name)+' 累计多 '+(totB-totA)+' 次，但战力看的是综合形态。');
  $('bpOut').innerHTML =
    '<div style="font-size:12.5px;color:#7c859e;margin-bottom:6px">🔵 ' + esc(A.name) + '　VS　🔴 ' + esc(B.name) + '</div>' +
    rows +
    '<div class="ok" style="margin-top:8px">' + verdict + '<br><span style="font-size:11.5px">' + taunt + '</span></div>';
});

/* ===== 趣味实验室：时光机 ===== */
var tmTimer = null;
function renderTimeMachine(){
  var upto = parseInt($('tmRange').value,10) || 7;
  $('tmLabel').textContent = '截至第' + ['一','二','三','四','五','六','七'][upto-1] + '周';
  var arr = S.map(function(s){
    var t = 0;
    for(var i=0;i<upto;i++) t += s.w[i];
    return {name:s.name, t:t, cur:s.w[upto-1]};
  }).filter(function(x){return x.t>0;}).sort(function(a,b){return b.t-a.t;});
  var mx = Math.max.apply(null, arr.map(function(x){return x.t;}).concat([1]));
  var html = '<div style="font-size:12.5px;color:#7c859e;margin-bottom:6px">截至 W' + upto + '：' + arr.length + ' 人有违纪记录，累计 ' +
    arr.reduce(function(a,b){return a+b.t;},0) + ' 次</div>';
  html += arr.slice(0,10).map(function(x,i){
    return '<div class="tmrow" data-n="' + esc(x.name) + '"><span class="rk">' + (i+1) + '</span>' +
      '<div class="tk"><i style="width:' + (x.t/mx*100) + '%"></i></div>' +
      '<em>' + x.t + ' 次' + (x.cur ? '（本周 +' + x.cur + '）' : '') + '</em></div>';
  }).join('');
  var fresh = arr.filter(function(x){ return x.cur>0 && x.t===x.cur; }).map(function(x){return x.name;});
  if(fresh.length){
    html += '<div class="tmnew">🌱 本周新上榜：' + fresh.map(esc).join('、') + '</div>';
  }
  var el = $('tmOut');
  el.innerHTML = html;
  el.querySelectorAll('.tmrow').forEach(function(r){
    r.addEventListener('click', function(){ openSheet(r.getAttribute('data-n')); });
  });
}
$('tmRange').addEventListener('input', renderTimeMachine);
$('tmPlay').addEventListener('click', function(){
  if(tmTimer){ clearInterval(tmTimer); tmTimer = null; this.textContent = '▶ 自动播放'; return; }
  var r = $('tmRange');
  r.value = 1; renderTimeMachine();
  var self = this;
  self.textContent = '⏸ 暂停';
  tmTimer = setInterval(function(){
    var v = parseInt(r.value,10) + 1;
    if(v > 7){ clearInterval(tmTimer); tmTimer = null; self.textContent = '▶ 自动播放'; return; }
    r.value = v; renderTimeMachine();
  }, 1100);
});

/* ===== 趣味实验室：段位赛 ===== */
var DW = [
  {t:'纪律王者',  min:0,  max:0,      c:'#f59e0b', e:'👑', d:'七周零违纪，全班最强'},
  {t:'秩序钻石',  min:1,  max:2,      c:'#0ea5e9', e:'💎', d:'偶有闪失，整体很稳'},
  {t:'规矩铂金',  min:3,  max:5,      c:'#10b981', e:'🛡️', d:'需要偶尔提醒一下'},
  {t:'活跃黄金',  min:6,  max:8,      c:'#eab308', e:'🥇', d:'已经进入观察名单'},
  {t:'重点白银',  min:9,  max:12,     c:'#94a3b8', e:'🥈', d:'频次偏高，得盯一盯'},
  {t:'传说青铜',  min:13, max:9999,   c:'#b45309', e:'🏺', d:'七周累计上两位数，传说级'}
];
function dwOf(n){
  var t = (typeof n === 'number') ? n : 0;
  return DW.filter(function(d){ return t>=d.min && t<=d.max; })[0] || DW[DW.length-1];
}
function renderDuanwei(){
  var buckets = DW.map(function(d){
    return {d:d, n:S.filter(function(s){ return dwOf(s.total).t === d.t; }).length};
  }).filter(function(b){ return b.n>0; });
  var sum = S.length || 1;
  var bar = '<div class="dwbar">' + buckets.map(function(b){
    var pct = b.n/sum*100;
    return '<i style="width:' + pct + '%;background:' + b.d.c + '" title="' + b.d.t + '：' + b.n + ' 人">' +
      (pct>7 ? b.d.e + ' ' + b.n : '') + '</i>';
  }).join('') + '</div>';
  var leg = '<div class="legend">' + buckets.map(function(b){
    return '<span><i style="background:' + b.d.c + '"></i>' + b.d.e + ' ' + b.d.t + ' ' + b.n + ' 人 · ' + Math.round(b.n/sum*100) + '%</span>';
  }).join('') + '</div>';
  var list = '<div class="dwlist">' + S.slice().sort(function(a,b){return a.total-b.total;}).map(function(s){
    var d = dwOf(s.total);
    return '<div class="dwcard" data-n="' + esc(s.name) + '"><b>' + esc(s.name) + '</b>' +
      '<span>' + s.total + ' 次 · ' + (s.total ? '主战场 ' + s.topSub : '七周全勤零违纪') + '</span>' +
      '<span class="dwbadge" style="background:' + d.c + '">' + d.e + ' ' + d.t + '</span></div>';
  }).join('') + '</div>';
  var el = $('dwOut');
  el.innerHTML = bar + leg + list;
  el.querySelectorAll('.dwcard').forEach(function(c){
    c.addEventListener('click', function(){ openSheet(c.getAttribute('data-n')); });
  });
}

/* ============ 趣味实验室：预测 ============ */
$('guessBtn').addEventListener('click', function(){
  var g = parseInt($('guess').value,10);
  if(isNaN(g)){ $('guessOut').innerHTML = '<div class="warn">先输入一个数字吧。</div>'; return; }
  var avg = TOTAL/7;
  var last4 = (weekTotals[3]+weekTotals[4]+weekTotals[5]+weekTotals[6])/4;
  var last2 = (weekTotals[5]+weekTotals[6])/2;
  var ref = Math.round(last4*0.5 + last2*0.3 + avg*0.2);
  var lo = Math.max(0, Math.round(ref*0.6)), hi = Math.round(ref*1.5);
  var diff = g - ref;
  var comment;
  if(Math.abs(diff)<=1) comment = '🎯 神了！你的直觉和系统参考值只差 '+Math.abs(diff)+' 次，可以直接当预言家。';
  else if(Math.abs(diff)<=4) comment = '👍 相当接近，参考值 '+ref+' 次，误差 '+Math.abs(diff)+' 次。';
  else if(g>ref) comment = '😅 你比系统悲观不少，参考值才 '+ref+' 次。是对哪几位同学没信心？';
  else comment = '🌈 你比系统乐观，参考值 '+ref+' 次。希望如此！';
  $('guessOut').innerHTML =
    '<div class="statgrid"><div class="stat"><b>'+ref+'</b><span>系统参考值</span></div>'+
    '<div class="stat"><b>'+lo+'–'+hi+'</b><span>合理区间</span></div>'+
    '<div class="stat"><b>'+Math.round(avg*10)/10+'</b><span>七周均值</span></div></div>'+
    '<div class="ok">'+comment+'<br><span style="font-size:11.5px">参考值＝近四周均值×50% ＋ 近两周均值×30% ＋ 七周均值×20%，仅供娱乐</span></div>';
});

/* ============ 换算器 ============ */
$('calcBtn').addEventListener('click', function(){
  var per = Math.max(1, parseInt($('perMin').value,10) || 2);
  var mins = TOTAL * per;
  var lessons = (mins/40).toFixed(1);
  var milk = (mins/8).toFixed(0);
  var km = (mins/12).toFixed(1);
  var words = TOTAL * 200;
  $('calcOut').innerHTML =
    '<div class="statgrid">'+
    '<div class="stat"><b>'+mins+'</b><span>分钟处理时间</span></div>'+
    '<div class="stat"><b>'+lessons+'</b><span>节课（40 分钟）</span></div>'+
    '<div class="stat"><b>'+milk+'</b><span>杯奶茶（按 8 分钟喝完）</span></div>'+
    '<div class="stat"><b>'+km+'</b><span>公里（步行 12 分钟/公里）</span></div></div>'+
    '<div class="ok">换算依据：'+TOTAL+' 次 × '+per+' 分钟。如果每次违纪都要写下 '+words+' 字的说明，全班累计要写 '+ (words/1000).toFixed(1) +' 万字，约等于 '+Math.round(words/800)+' 篇 800 字作文。</div>';
});

/* ============ 性格小测试 ============ */
var QUIZ = [
  {q:'上课走神被提醒时，你通常？', a:['马上回神','过两分钟才回神','完全没听见','其实我只是看窗外']},
  {q:'一周里你最容易出现状况的是？', a:['周一','周三','周五','随机，看心情']},
  {q:'被点名后的反应是？', a:['立刻改正','嘴上答应心里不服','一脸无辜','下次还敢']},
  {q:'你觉得违纪的主要原因是？', a:['同桌太有趣','课太无聊','昨天没睡好','说不清楚']}
];
var quizAns = [0,0,0,0];
function renderQuiz(){
  $('quiz').innerHTML = QUIZ.map(function(item,i){
    return '<div class="quiz-q">'+(i+1)+'. '+item.q+'</div>'+
      item.a.map(function(a,j){
        return '<div class="quiz-a'+(quizAns[i]===j?' on':'')+'" data-i="'+i+'" data-j="'+j+'">'+String.fromCharCode(65+j)+'. '+a+'</div>';
      }).join('');
  }).join('');
  document.querySelectorAll('.quiz-a').forEach(function(d){
    d.addEventListener('click', function(){
      var i = +d.getAttribute('data-i'), j = +d.getAttribute('data-j');
      quizAns[i] = j;
      document.querySelectorAll('.quiz-a[data-i="'+i+'"]').forEach(function(x){x.classList.remove('on');});
      d.classList.add('on');
    });
  });
}
$('quizBtn').addEventListener('click', function(){
  var sum = quizAns.reduce(function(a,b){return a+b;},0);
  var types = [
    {t:'🫥 梦游型', d:'人坐在教室里，灵魂在窗外飘。建议：坐前排 + 多喝水。'},
    {t:'🗣️ 话痨型', d:'同桌是你的最佳听众，可惜老师不同意。建议：换个不爱说话的同桌。'},
    {t:'🎭 表演型', d:'你大概是班里的气氛组组长。建议：把才华留给文艺汇演。'},
    {t:'😴 电量不足型', d:'你需要的不是批评，是一顿早睡。建议：晚上少刷十分钟手机。'},
    {t:'🎲 薛定谔型', d:'谁也说不准你下一节课会不会上榜。建议：给自己定个小目标。'}
  ];
  var t = types[Math.min(types.length-1, Math.floor(sum/3))];
  $('quizOut').innerHTML = '<div class="ok" style="margin-top:12px"><b style="font-size:16px">'+t.t+'</b><br>'+t.d+'</div>';
});

/* ============ 假如…… ============ */
function renderSim(){
  var n = state.sim;
  var zeroed = RANK.slice(0,n);
  var cut = zeroed.reduce(function(a,s){return a+s.total;},0);
  var left = TOTAL - cut;
  var perClass = (left/state.classSize).toFixed(2);
  var wt = [];
  for(var i=0;i<NW;i++){
    wt.push(weekTotals[i] - zeroed.reduce(function(a,s){return a+s.w[i];},0));
  }
  var peak = wt.indexOf(Math.max.apply(null,wt));
  $('simLabel').textContent = 'Top '+n+' 人归零';
  var mx = Math.max.apply(null,wt.concat([1]));
  $('simOut').innerHTML =
    '<div class="statgrid"><div class="stat"><b>'+left+'</b><span>剩余违纪次数</span></div>'+
    '<div class="stat"><b style="color:#10b981">-'+cut+'</b><span>减少（'+(TOTAL? Math.round(cut/TOTAL*100):0)+'%）</span></div>'+
    '<div class="stat"><b>'+perClass+'</b><span>全班人均</span></div>'+
    '<div class="stat"><b>'+Math.max(0,RANK.length-n)+'</b><span>仍有违纪人数</span></div></div>'+
    '<div style="display:grid;gap:6px;margin-top:6px">'+wt.map(function(v,i){
      return '<div class="subbar"><span>'+SHORT[i]+'</span><div class="t"><i style="width:'+(v/mx*100)+'%"></i></div><em>'+v+' 次</em></div>';
    }).join('')+'</div>'+
    '<div class="ok" style="margin-top:10px">'+(n===0?'拖动滑块试试：如果 Top N 同学突然「改过自新」，班级数据会变成什么样。'
      :'如果 '+zeroed.map(function(s){return esc(s.name);}).join('、')+' 全部归零，全班只剩 '+left+' 次违纪，峰值周变成'+WEEKS[peak]+'。')+'</div>';
}
$('simRange').addEventListener('input', function(){
  state.sim = parseInt(this.value,10)||0; renderSim();
});

/* ===== 趣味实验室：下周上榜预测 ===== */
function forecastRisk(){
  return S.map(function(s){
    var recent = s.w[4]*1.0 + s.w[5]*1.5 + s.w[6]*2.0;
    var stable = s.spread/NW*3.0;
    var worse  = s.delta>0 ? s.delta*1.2 : 0;
    var broad  = s.subSpread/NS*2.0;
    var noise  = Math.random()*2.0;
    var score  = recent + stable + worse + broad + noise;
    var why=[];
    if(s.w[6]>0) why.push('第七周仍在榜（'+s.w[6]+' 次）');
    if(s.w[5]>0) why.push('第六周有过记录');
    if(s.spread>=4) why.push('七周里活跃 '+s.spread+' 周，习惯性强');
    if(s.delta>0) why.push('后半程呈上升（+'+s.delta+'）');
    if(s.subSpread>=4) why.push('横跨 '+s.subSpread+' 门学科，覆盖面广');
    if(!why.length) why.push('近期安静，属低风险观察对象');
    return {s:s, score:score, why:why};
  }).sort(function(a,b){ return b.score-a.score; });
}
function renderForecast(){
  var arr=forecastRisk().slice(0,5);
  var mx=Math.max.apply(null, arr.map(function(x){return x.score;})) || 1;
  var html='<div style="font-size:12px;color:#7c859e;margin-bottom:8px">风险分＝近期活跃 ×1.0/1.5/2.0 ＋ 稳定性 ＋ 恶化趋势 ＋ 学科广度 ＋ 随机扰动</div>';
  arr.forEach(function(x,i){
    var lv = x.score>mx*0.75 ? ['极高','#e11d48'] : (x.score>mx*0.5 ? ['偏高','#f59e0b'] : ['中等','#6366f1']);
    html+='<div class="grp" style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:7px;background:#fff">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline">'+
      '<b style="font-size:14px">'+(i+1)+'. '+esc(x.s.name)+'</b>'+
      '<span style="font-size:12px;color:'+lv[1]+';font-weight:700">'+lv[0]+' · '+x.score.toFixed(1)+' 分</span></div>'+
      '<div style="height:8px;background:#f1f3fa;border-radius:5px;margin:6px 0;overflow:hidden">'+
      '<i style="display:block;height:100%;width:'+(x.score/mx*100).toFixed(1)+'%;background:'+lv[1]+';border-radius:5px"></i></div>'+
      '<div style="font-size:12px;color:#5b6178">'+x.why.join(' · ')+'</div></div>';
  });
  var safe=S.filter(function(s){return s.total===0;}).length;
  html+='<div class="ok" style="margin-top:8px">预测仅供参考，别当真。班级里还有 <b>'+safe+'</b> 位同学七周零违纪，'+
    '他们才是「下周一定不上榜」的稳选。</div>';
  $('fcOut').innerHTML=html;
}

/* ===== 趣味实验室：违纪刮刮卡 ===== */
var SC_COMMENTS = ['这波实锤','证据确凿','当场被抓','老熟人了','又双叒叕','意料之中','有点意外','经典重现'];
function scPool(){
  var pool=[];
  BAD.forEach(function(s){
    s.w.forEach(function(v,i){ if(v>0) pool.push({k:'w', s:s, i:i, n:v}); });
    s.sub.forEach(function(v,j){ if(v>0) pool.push({k:'s', s:s, i:j, n:v}); });
  });
  return pool;
}
function renderScratch(){
  var box=$('scOut');
  if(!box) return;
  var pool=shuffleArr(scPool()).slice(0,9);
  if(!pool.length){ box.innerHTML='<div class="desc">暂无记录</div>'; return; }
  box.innerHTML=pool.map(function(p,i){
    var title = p.k==='w' ? (p.s.name+' · '+WEEKS[p.i]) : (p.s.name+' · '+SUBS[p.i]+'课');
    var sub   = p.k==='w' ? ('第七周制 · 上榜 '+p.n+' 次') : ('主战场候选 · 上榜 '+p.n+' 次');
    var cmt   = SC_COMMENTS[rnd(SC_COMMENTS.length)];
    return '<div class="scard" data-i="'+i+'">'+
      '<div class="cover">🎫 刮开</div>'+
      '<div class="body"><b>'+esc(title)+'</b><em>'+esc(sub)+'</em>'+
      '<div style="margin-top:6px;font-size:11px;color:#b45309">'+cmt+' · 累计 '+p.s.total+' 次</div></div></div>';
  }).join('');
  [].forEach.call(box.querySelectorAll('.scard'), function(c){
    c.addEventListener('click', function(){ c.classList.add('open'); });
  });
}

/* ===== 趣味实验室：违纪罚单 ===== */
var TK_PUNISH = [
  '罚抄《课堂纪律三字经》{n} 遍，次日交',
  '罚当一日「纪律监督员」，负责记录本班违纪',
  '罚在班会上演唱一首完整歌曲，不许跑调',
  '罚为全班同学做一周的值日，含擦黑板',
  '罚写 {n}00 字《我为什么会被记名字》',
  '罚背诵本学科本章知识点，老师随机抽查',
  '罚下周座位调至第一排正中，为期一周',
  '罚上交手机至班主任处保管至周五'
];
function tkHash(name){
  var h=0;
  for(var i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))%1000000;
  return h;
}
function tkNo(name){
  return 'WJ-2026-'+String(tkHash(name)%100000).padStart(5,'0');
}
function renderTicket(){
  var s = pickWho('thWho');
  var box=$('thOut');
  if(!s) return;
  var facts=s.w.map(function(v,i){ return v>0 ? (WEEKS[i]+'　'+v+' 次') : null; }).filter(Boolean);
  var hsh=tkHash(s.name);
  var pun=TK_PUNISH[hsh % TK_PUNISH.length].replace('{n}', String(Math.max(1, s.total)));
  var fine=s.total*5;
  var level = s.total>=9?'高危':(s.total>=4?'中度':'轻度');
  box.innerHTML='<div class="ticket">'+
    '<h4>课堂违纪现场处罚决定书</h4>'+
    '<div class="tn">编号 '+tkNo(s.name)+' 　班级记录专用</div>'+
    '<div class="ln"><span>当事人</span><b>'+esc(s.name)+'</b></div>'+
    '<div class="ln"><span>所属班级</span>本班（全员 '+S.length+' 人）</div>'+
    '<div class="ln"><span>统计周期</span>七周（W1–W7）</div>'+
    '<div class="ln"><span>累计次数</span><b>'+s.total+' 次</b>　危险等级：'+level+'</div>'+
    '<div class="ln"><span>主要阵地</span>'+s.topSub+'课（'+s.maxSub+' 次）</div>'+
    '<div class="ln"><span>活跃周数</span>'+s.spread+' / 7 周</div>'+
    '<div class="ln"><span>涉及学科</span>'+s.subSpread+' 门</div>'+
    '<div class="ln" style="border:0"><span>违法事实</span>'+(facts.length? facts.join('；') : '七周内无违纪记录')+'</div>'+
    '<div class="rule"><b>处罚决定：</b>'+(s.total===0
      ? '经核查，该同学七周内无任何违纪记录，不予处罚，特此表扬 🎉'
      : pun+'。<br>另处「纪律分」扣减 '+s.total+' 分，折合虚拟罚金 '+fine+' 元（本罚单不具备任何实际效力）。')+'</div>'+
    '<div class="sign">班级纪律委员会（虚构）　签发日期：'+new Date().toLocaleDateString('zh-CN')+'</div>'+
    '</div>'+
    '<div class="desc" style="margin-top:8px">罚单内容除「处罚决定」外均来自真实数据；仅用于班级娱乐，不具任何效力。</div>';
}

/* ===== 趣味实验室：违纪老虎机 ===== */
var slTimers=[];
function slotGo(){
  var box1=$('sl1'), box2=$('sl2'), box3=$('sl3');
  if(!box1) return;
  slTimers.forEach(clearInterval); slTimers=[];
  var names=S.map(function(s){return s.name;});
  var cols=[WEEKS.slice(), SUBS.slice(0,12), names];
  var els=[box1,box2,box3];
  var stops=[900,1400,1950];
  var result=[null,null,null];
  els.forEach(function(el,i){ el.classList.add('spin'); });
  cols.forEach(function(col,i){
    var t0=Date.now(), n=0;
    var tmr=setInterval(function(){
      n++;
      els[i].textContent = col[rnd(col.length)];
      if(Date.now()-t0>=stops[i] || n>60){
        clearInterval(tmr);
        result[i]=col[rnd(col.length)];
        els[i].textContent=result[i];
        els[i].classList.remove('spin');
        if(i===2) slotResult(result);
      }
    }, 70);
    slTimers.push(tmr);
  });
  $('slOut').innerHTML='<div class="desc">摇动中……</div>';
}
function slotResult(r){
  var wi=WEEKS.indexOf(r[0]), si=SUBS.indexOf(r[1]), who=byName(r[2]);
  var out=$('slOut');
  if(!who){ out.innerHTML='<div class="warn">名单里没有这位同学</div>'; return; }
  var hitW = wi>=0 && who.w[wi]>0;
  var hitS = si>=0 && who.sub[si]>0;
  var both = hitW && hitS;
  var cls = both?'ok':(hitW||hitS?'warn':'ok');
  var txt = both
    ? '💥 <b>双杀命中！</b>'+esc(who.name)+'在'+r[0]+'确实有违纪（'+who.w[wi]+' 次），'+r[1]+'课也有记录（'+who.sub[si]+' 次）。这组合是真实发生过的。'
    : (hitW ? '🎯 <b>命中周次！</b>'+esc(who.name)+'在'+r[0]+'上榜 '+who.w[wi]+' 次，但'+r[1]+'课是清白的。'
    : (hitS ? '🎯 <b>命中学科！</b>'+esc(who.name)+'在'+r[1]+'课有 '+who.sub[si]+' 次记录，但'+r[0]+'那周很安分。'
    : '😌 <b>虚惊一场。</b>'+esc(who.name)+'在'+r[0]+'和'+r[1]+'课都没有违纪记录，这组合同框纯属巧合。'));
  out.innerHTML='<div class="'+cls+'">'+txt+'<br><span style="font-size:11.5px">组合：'+esc(r[0])+' × '+esc(r[1])+' × '+esc(who.name)+
    ' · 该同学七周累计 '+who.total+' 次</span></div>';
}

/* ===== 趣味实验室：七周年度回忆 ===== */
function yearWord(s){
  if(s.total===0) return ['零帧起手','#10b981'];
  if(s.spread>=5) return ['常驻嘉宾','#e11d48'];
  if(s.maxw>=4)   return ['爆发型选手','#f97316'];
  if(s.subSpread>=4) return ['全面开花','#db2777'];
  if(s.delta>0)   return ['持续升温','#f59e0b'];
  if(s.delta<0)   return ['正在收敛','#3b82f6'];
  if(s.spread===1) return ['一闪而过','#6366f1'];
  return ['偶发选手','#8b5cf6'];
}
function renderYear(){
  var s = pickWho('thWho');
  var box=$('thOut');
  if(!s) return;
  var w=yearWord(s);
  var peakIdx=s.w.indexOf(s.maxw);
  var quiet=s.w.map(function(v,i){return v===0?i:-1;}).filter(function(i){return i>=0;});
  var firstIdx=s.w.findIndex? s.w.findIndex(function(v){return v>0;}) : -1;
  if(firstIdx<0){ for(var q=0;q<7;q++){ if(s.w[q]>0){ firstIdx=q; break; } } }
  box.innerHTML=
    '<div style="text-align:center;padding:12px;border-radius:12px;background:linear-gradient(135deg,#eef2ff,#fdf2f8);margin-bottom:10px">'+
      '<div style="font-size:12px;color:#7c859e">'+esc(s.name)+' 的七周违纪年度报告</div>'+
      '<div style="font-size:26px;font-weight:800;color:'+w[1]+';margin:4px 0">'+w[0]+'</div>'+
      '<div style="font-size:12px;color:#5b6178">年度累计 '+s.total+' 次 · 班级第 '+(s.rank||'-')+' 位</div>'+
    '</div>'+
    '<div class="statgrid">'+
      '<div class="stat"><b>'+s.total+'</b><span>年度总次数</span></div>'+
      '<div class="stat"><b>'+s.maxw+'</b><span>单周峰值</span></div>'+
      '<div class="stat"><b>'+s.spread+'/7</b><span>活跃周数</span></div>'+
      '<div class="stat"><b>'+s.subSpread+'</b><span>涉及学科</span></div>'+
    '</div>'+
    (s.total===0
      ? '<div class="ok">🎉 <b>全年无违纪。</b>七周四十九个格子里，你的名字一次都没出现过。这是全班 '+zeroCount()+' 位「零帧起手」同学之一。</div>'
      : '<div class="grp" style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:7px;background:#fff">'+
        '<b>📌 高光时刻</b><br>'+WEEKS[peakIdx]+'，单周 '+s.maxw+' 次，占个人全年 '+Math.round(s.maxw/s.total*100)+'%。<br>'+
        '<span style="color:#7c859e">首次上榜于'+WEEKS[firstIdx<0?0:firstIdx]+'，主战场是'+s.topSub+'课（'+s.maxSub+' 次）。</span></div>'+
        '<div class="grp" style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:7px;background:#fff">'+
        '<b>📊 vs 班级</b><br>你占全班违纪总量的 '+(TOTAL? Math.round(s.total/TOTAL*100):0)+'%，'+
        '高于全班 '+(S.length-Math.round(s.total/(TOTAL||1)*S.length))+' 位同学。<br>'+
        '<span style="color:#7c859e">'+(quiet.length? ('你在'+quiet.map(function(i){return WEEKS[i];}).join('、')+'完全消失过。') : '七周里没有一周是完全干净的。')+'</span></div>'+
        '<div class="ok"><b>年度评语：</b>'+yearComment(s)+'</div>');
}
function yearComment(s){
  if(s.spread>=5) return '七周里有 '+s.spread+' 周都能看到你，稳定得像课程设置的一部分。';
  if(s.maxw>=4) return '你的违纪不分散，一出手就是'+WEEKS[s.w.indexOf(s.maxw)]+'那种集中爆发。';
  if(s.subSpread>=4) return '横跨 '+s.subSpread+' 门学科，这份「雨露均沾」也是种本事。';
  if(s.delta>0) return '后半程比前半程多了 '+s.delta+' 次，趋势是向上的 —— 这里指的是次数。';
  if(s.delta<0) return '后半程少了 '+(-s.delta)+' 次，正在往好的方向走，保持住。';
  if(s.total<=2) return '总共就 '+s.total+' 次，基本属于偶发，不必放在心上。';
  return '不温不火，没什么大起大落，属于班级里的中间地带。';
}

/* ===== 趣味实验室：违纪广播台 ===== */
var rdTimer=null, rdIdx=0, rdItems=[];
function rdScript(){
  var top=RANK[0], si=subTotals.indexOf(Math.max.apply(null,subTotals));
  var cmp=weekTotals[6]-weekTotals[5];
  var guest=BAD[rnd(BAD.length)] || S[0];
  var zeroN=zeroCount();
  return [
    ['开场','各位同学中午好，这里是「班级纪律之声」，我是自动播报员。今天是第七周播报日，我们先来看本周要闻。'],
    ['本周要闻','本周全班违纪 <b>'+weekTotals[6]+' 次</b>，涉及 <b>'+weekPeople[6]+' 人</b>，较上周'+
      (cmp>0?('增加 '+cmp+' 次'):(cmp<0?('减少 '+(-cmp)+' 次'):'持平'))+'。七周累计 <b>'+TOTAL+' 次</b>，人均 '+(TOTAL/state.classSize).toFixed(2)+' 次。'],
    ['学科快讯','本周最热闹的板块依然是<b>'+SUBS[si]+'课</b>，七周累计 '+subTotals[si]+' 次、'+subPeople[si]+' 人涉案。'+
      (subTotals[2]===0? '值得一提的是，英语课至今零违纪，请保持。' : '')+
      (subTotals[11]===0? '体育课同样零记录，值得表扬。' : '')],
    ['人物专访','本期专访对象：<b>'+esc(guest.name)+'</b>。七周累计 '+guest.total+' 次，主战场'+guest.topSub+''+
      (guest.maxSub>0? '课（'+guest.maxSub+' 次）' : '')+'，活跃 '+guest.spread+' 周。'+
      (guest.total===0? '这位同学七周零违纪，是本次专访的正能量代表。' : '')],
    ['气象预报','纪律气象台发布：本周班级天气为<b>'+wxWord(weekTotals[6])+'</b>。'+
      '请同学们注意，峰值为'+WEEKS[PEAK]+'的 '+weekTotals[PEAK]+' 次，是全周期最高，那周的天气是暴雨。'],
    ['红榜时间','截至目前，全班有 <b>'+zeroN+'</b> 位同学七周零违纪，占班级 '+Math.round(zeroN/state.classSize*100)+'%。'+
      '他们是班级的稳定器，掌声送给他们。'],
    ['结束语','以上就是本周播报的全部内容。数据来自班级真实登记，播报词由程序自动生成，仅供娱乐。我们下周同一时间再见。']
  ];
}
function wxWord(v){
  return v<=5?'晴 ☀️':(v<=11?'多云 🌤️':(v<=18?'阴 ⛅':(v<=28?'小雨 🌧️':'暴雨 ⛈️')));
}
function radioPlay(){
  var box=$('rdOut');
  if(!box) return;
  radioStop();
  rdItems=rdScript(); rdIdx=0; box.innerHTML='';
  (function next(){
    if(rdIdx>=rdItems.length){ box.innerHTML+='<div class="ok">📻 播报结束，谢谢收听。</div>'; rdTimer=null; return; }
    var it=rdItems[rdIdx++];
    box.innerHTML+='<div class="rditem"><b>【'+it[0]+'】</b>'+it[1]+'</div>';
    box.scrollTop=box.scrollHeight;
    rdTimer=setTimeout(next, 900);
  })();
}
function radioStop(){ if(rdTimer){ clearTimeout(rdTimer); rdTimer=null; } }

/* ===== 趣味实验室：违纪宾果 ===== */
var BINGO_POOL=[
  {t:'有人累计违纪 ≥ 12 次',     f:function(){ return BAD.filter(function(s){return s.total>=12;}).length>0; }},
  {t:'有人累计违纪 ≥ 15 次',     f:function(){ return BAD.filter(function(s){return s.total>=15;}).length>0; }},
  {t:'有人单周违纪 ≥ 5 次',      f:function(){ return BAD.filter(function(s){return s.maxw>=5;}).length>0; }},
  {t:'有人单周违纪 ≥ 6 次',      f:function(){ return BAD.filter(function(s){return s.maxw>=6;}).length>0; }},
  {t:'政治课累计 ≥ 25 次',       f:function(){ return subTotals[4]>=25; }},
  {t:'数学课累计 ≥ 25 次',       f:function(){ return subTotals[1]>=25; }},
  {t:'音乐课累计 ≥ 20 次',       f:function(){ return subTotals[9]>=20; }},
  {t:'英语课 0 次违纪',          f:function(){ return subTotals[2]===0; }},
  {t:'体育课 0 次违纪',          f:function(){ return subTotals[11]===0; }},
  {t:'第四周全班 ≥ 40 次',       f:function(){ return weekTotals[3]>=40; }},
  {t:'第四周全班 ≥ 45 次',       f:function(){ return weekTotals[3]>=45; }},
  {t:'第七周全班 ≥ 20 次',       f:function(){ return weekTotals[6]>=20; }},
  {t:'零违纪同学 ≥ 20 人',       f:function(){ return zeroCount()>=20; }},
  {t:'零违纪同学 ≥ 25 人',       f:function(){ return zeroCount()>=25; }},
  {t:'有人横跨 ≥ 6 门学科',      f:function(){ return BAD.filter(function(s){return s.subSpread>=6;}).length>0; }},
  {t:'有人横跨 ≥ 8 门学科',      f:function(){ return BAD.filter(function(s){return s.subSpread>=8;}).length>0; }},
  {t:'有人连续 ≥ 5 周违纪',      f:function(){ return BAD.filter(function(s){return s.streak>=5;}).length>0; }},
  {t:'有人七周周周上榜',         f:function(){ return BAD.filter(function(s){return s.spread===7;}).length>0; }},
  {t:'存在「不详」学科记录',     f:function(){ return subTotals[12]>0; }},
  {t:'有人后半程完全归零',       f:function(){ return BAD.filter(function(s){return s.first>0&&s.last===0;}).length>0; }},
  {t:'有人后半程增加 ≥ 4 次',    f:function(){ return BAD.filter(function(s){return s.delta>=4;}).length>0; }},
  {t:'单周涉及人数 ≥ 19 人',     f:function(){ return Math.max.apply(null,weekPeople)>=19; }},
  {t:'单周涉及人数 ≥ 25 人',     f:function(){ return Math.max.apply(null,weekPeople)>=25; }},
  {t:'有人主战场是地理课',       f:function(){ return BAD.filter(function(s){return s.maxSub>0&&s.topSub==='地理';}).length>0; }},
  {t:'有人主战场是英语课',       f:function(){ return BAD.filter(function(s){return s.maxSub>0&&s.topSub==='英语';}).length>0; }},
  {t:'有人主战场是体育课',       f:function(){ return BAD.filter(function(s){return s.maxSub>0&&s.topSub==='体育';}).length>0; }},
  {t:'后四周比前三周更多',       f:function(){ return (weekTotals[3]+weekTotals[4]+weekTotals[5]+weekTotals[6])>(weekTotals[0]+weekTotals[1]+weekTotals[2]); }},
  {t:'全班人均 ≥ 3 次',          f:function(){ return TOTAL/state.classSize>=3; }},
  {t:'有人只违纪过 1 次',        f:function(){ return BAD.filter(function(s){return s.total===1;}).length>0; }},
  {t:'有 ≥ 10 人以数学为主战场', f:function(){ return BAD.filter(function(s){return s.maxSub>0&&s.topSub==='数学';}).length>=10; }}
];
function renderBingo(){
  var box=$('bgOut');
  if(!box) return;
  var pick=shuffleArr(BINGO_POOL).slice(0,24);
  var cells=[];
  for(var i=0;i<25;i++){
    if(i===12){ cells.push({free:true, hit:true}); continue; }
    var p=pick.pop();
    cells.push({t:p.t, hit:(function(){ try{ return !!p.f(); }catch(e){ return false; } })()});
  }
  var html=cells.map(function(c,i){
    var cls = c.free ? 'bcell free' : (c.hit ? 'bcell hit' : 'bcell');
    return '<div class="'+cls+'" data-i="'+i+'">'+(c.free? 'FREE<br>本班专属' : esc(c.t))+'</div>';
  }).join('');
  box.innerHTML=html;
  // 统计连线
  var idx=function(r,c){ return r*5+c; };
  var lines=[];
  for(var r=0;r<5;r++){ var a=[]; for(var c=0;c<5;c++) a.push(idx(r,c)); lines.push(a); }
  for(var c=0;c<5;c++){ var b=[]; for(var r2=0;r2<5;r2++) b.push(idx(r2,c)); lines.push(b); }
  lines.push([idx(0,0),idx(1,1),idx(2,2),idx(3,3),idx(4,4)]);
  lines.push([idx(0,4),idx(1,3),idx(2,2),idx(3,1),idx(4,0)]);
  var hitCount=0, winCells={};
  lines.forEach(function(ln){
    var all=ln.every(function(i){ return cells[i].hit; });
    if(all){ hitCount++; ln.forEach(function(i){ winCells[i]=1; }); }
  });
  [].forEach.call(box.querySelectorAll('.bcell'), function(el){
    var i=+el.getAttribute('data-i');
    if(winCells[i]) el.classList.add('line');
  });
  var lb=$('bgLine');
  if(lb) lb.textContent = hitCount? ('🎉 连成 '+hitCount+' 条线！') : ('已点亮 '+cells.filter(function(c){return c.hit;}).length+' / 25 格，暂无连线');
}

/* ===== 趣味实验室：初始化 ===== */
function fillArcadeSelects(){
  var opts=S.slice().sort(function(a,b){ return b.total-a.total || a.name.localeCompare(b.name,'zh'); })
    .map(function(s){ return '<option value="'+esc(s.name)+'">'+esc(s.name)+'（'+s.total+' 次）</option>'; }).join('');
  ['thWho'].forEach(function(id){
    var el=$(id); if(!el) return;
    var cur=el.value; el.innerHTML=opts;
    if(cur && S.filter(function(s){return s.name===cur;}).length) el.value=cur;
  });
}
$('fcBtn').addEventListener('click', renderForecast);
$('scNew').addEventListener('click', renderScratch);
$('tkBtn').addEventListener('click', renderTicket);
$('slGo').addEventListener('click', slotGo);
$('yrBtn').addEventListener('click', renderYear);
$('rdBtn').addEventListener('click', radioPlay);
$('rdStop').addEventListener('click', radioStop);
$('bgNew').addEventListener('click', renderBingo);
var thEl=$('thWho');
if(thEl) thEl.addEventListener('change', renderTheatre);
function renderArcade(){
  fillArcadeSelects();
  renderStock(); renderTicket(); renderYear();
  if(!$('fcOut').innerHTML) renderForecast();
  if(!$('scOut').innerHTML) renderScratch();
  if(!$('bgOut').innerHTML) renderBingo();
}

/* ============ 导出 ============ */
function toCsv(){
  var lines = ['姓名,'+SHORT.join(',')+',总计,'+SUBS.join(',')];
  S.forEach(function(s){
    lines.push([s.name].concat(s.w).concat([s.total]).concat(s.sub).join(','));
  });
  lines.push(['合计'].concat(weekTotals).concat([TOTAL]).concat(subTotals).join(','));
  return lines.join('\n');
}
function download(name, text, mime){
  var b = new Blob([text], {type:mime});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = name; a.click();
}
$('exportCsv').addEventListener('click', function(){
  download('课堂违纪数据.csv', '\ufeff'+toCsv(), 'text/csv;charset=utf-8');
});
$('exportJson').addEventListener('click', function(){
  download('课堂违纪存档.json', JSON.stringify({size:state.classSize, data:S.map(function(s){return {n:s.name,w:s.w,sub:s.sub};})}, null, 1), 'application/json');
});
$('importJson').addEventListener('click', function(){ $('fileInput').click(); });
$('fileInput').addEventListener('change', function(e){
  var f = e.target.files[0]; if(!f) return;
  var r = new FileReader();
  r.onload = function(){
    try{
      var o = JSON.parse(r.result);
      if(!o.data || !o.data.length) throw 0;
      S = o.data.map(function(d){ return {name:d.n, w:d.w.slice(), sub:d.sub.slice()}; });
      if(o.size) state.classSize = o.size;
      compute(); save(); render();
      $('saveState').textContent = '导入成功';
    }catch(err){ $('saveState').textContent = '文件格式不对'; }
  };
  r.readAsText(f);
});
$('print').addEventListener('click', function(){ window.print(); });
$('hardReset').addEventListener('click', function(){
  if(!confirm('清空本机存档并恢复原始表格？')) return;
  try{ localStorage.removeItem(STORE_KEY); }catch(e){}
  S = RAW.map(function(r){ return {name:r[0], w:r[1].slice(), sub:r[2].slice()}; });
  state.classSize = 52;
  compute(); render();
  $('saveState').textContent = '已恢复原始表格';
});

/* ============ 全局交互 ============ */
document.querySelectorAll('.tab').forEach(function(t){
  t.addEventListener('click', function(){
    document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('on');});
    t.classList.add('on');
    document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('on');});
    $(t.getAttribute('data-t')).classList.add('on');
    window.scrollTo({top:0, behavior:'smooth'});
  });
});
document.querySelectorAll('[data-sort]').forEach(function(c){
  c.addEventListener('click', function(){
    document.querySelectorAll('[data-sort]').forEach(function(x){x.classList.remove('on');});
    c.classList.add('on'); state.sort = c.getAttribute('data-sort'); render();
  });
});
document.querySelectorAll('#filters [data-f]').forEach(function(c){
  c.addEventListener('click', function(){
    document.querySelectorAll('#filters [data-f]').forEach(function(x){x.classList.remove('on');});
    c.classList.add('on'); state.filter = c.getAttribute('data-f'); render();
  });
});
$('q').addEventListener('input', function(){ state.q = this.value.trim(); render(); });
/* 违纪游乐场事件 */
var dtNewEl = $('dtNew');
if(dtNewEl) dtNewEl.addEventListener('click', dtNewCase);
var dtClueEl = $('dtClue');
if(dtClueEl) dtClueEl.addEventListener('click', dtShowClue);
var dtGiveEl = $('dtGive');
if(dtGiveEl) dtGiveEl.addEventListener('click', function(){ dtReveal(false); });
var dtSubmitEl = $('dtSubmit');
if(dtSubmitEl) dtSubmitEl.addEventListener('click', function(){
  if(!dtCase || dtCase.over) return;
  var g = $('dtGuess').value;
  dtReveal(g === dtCase.s.name);
});
['diagWho','momentWho','evoWho'].forEach(function(id){
  var el = $(id);
  if(!el) return;
  el.addEventListener('change', function(){
    if(id==='diagWho') renderDiag();
    if(id==='momentWho') renderMoment();
    if(id==='evoWho') renderEvo();
  });
});
function showTip(e, t){
  var el = $('tip');
  el.textContent = t; el.style.display='block';
  el.style.left = Math.min(e.clientX+14, window.innerWidth-260)+'px';
  el.style.top = (e.clientY+16)+'px';
}
function hideTip(){ $('tip').style.display='none'; }
var toastTimer = null;
function toast(msg){
  var el = $('tip');
  if(!el) return;
  el.textContent = msg; el.style.display = 'block';
  el.style.left = '50%'; el.style.top = 'auto'; el.style.bottom = '24px';
  el.style.transform = 'translateX(-50%)'; el.style.position = 'fixed';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.style.display='none'; el.style.transform=''; }, 2000);
}

/* ============ 违纪游乐场 ============ */
/* --- 1. 违纪侦探 --- */
var dtCase = null, dtScore = {win:0, lose:0, streak:0, best:0};
function dtCluePool(s){
  var pool = [
    {ico:'📅', t:'活跃周数', d:'这位同学七周里有 '+s.spread+' 周上过榜。'},
    {ico:'🎨', t:'学科广度', d:'违纪记录一共涉及 '+s.subSpread+' 门学科。'},
    {ico:'📚', t:'主战场', d:'最常出状况的是「'+s.topSub+'」课，共 '+s.maxSub+' 次。'},
    {ico:'💥', t:'峰值周', d:'火力最猛的是'+WEEKS[s.w.indexOf(s.maxw)]+'，单周 '+s.maxw+' 次。'},
    {ico:'📈', t:'前后对比', d:'前三周 '+s.first+' 次，后四周 '+s.last+' 次 —— '+(s.delta>0?'后半程加重':(s.delta<0?'后半程好转':'前后持平'))+'。'},
    {ico:'🔤', t:'姓名线索', d:'姓名以「'+s.name.charAt(0)+'」开头，一共 '+s.name.length+' 个字。'},
    {ico:'🔢', t:'次数区间', d:'累计违纪在 '+Math.max(1,s.total-2)+' – '+(s.total+2)+' 次之间。'},
    {ico:'🏅', t:'排名区间', d:'在违纪榜上大约排第 '+Math.max(1,s.rank-2)+' – '+(s.rank+2)+' 名。'},
    {ico:'🎯', t:'单周纪录', d:'个人单周最高纪录是 '+s.maxw+' 次。'},
    {ico:'🎖️', t:'身上称号', d:'系统给他的第一个称号是「'+badgesOf(s)[0].t+'」。'}
  ];
  return pool;
}
function dtNewCase(){
  var pool = S.filter(function(s){return s.total>0;});
  if(!pool.length) return;
  dtCase = { s: pool[rnd(pool.length)], pool: dtCluePool(pool[0]), used: 0, over: false };
  dtCase.pool = dtCluePool(dtCase.s);
  var el = $('dtClues');
  if(el) el.innerHTML = '<div class="ph">🔒 已锁定一位同学，点「放出一条线索」开始推理<br><span style="font-size:11.5px">共 10 条线索，用得越少分越高</span></div>';
  var o = $('dtOut'); if(o) o.innerHTML = '';
  renderDtScore();
}
function dtShowClue(){
  if(!dtCase || dtCase.over) return;
  if(dtCase.used >= dtCase.pool.length){
    var el = $('dtClues');
    if(el) el.innerHTML += '<div class="clue"><i>🚫</i><div><b>线索已经全部放完</b><span>再不放答案就说不过去了。</span></div></div>';
    return;
  }
  var c = dtCase.pool[dtCase.used++];
  var el = $('dtClues');
  if(el){
    if(el.innerHTML.indexOf('class="ph"') >= 0) el.innerHTML = '';
    el.innerHTML += '<div class="clue"><i>'+c.ico+'</i><div><b>第 '+dtCase.used+' 条 · '+c.t+'</b><span>'+c.d+'</span></div></div>';
  }
}
function dtReveal(win){
  if(!dtCase || dtCase.over) return;
  dtCase.over = true;
  var s = dtCase.s, used = dtCase.used;
  var gain = 0;
  if(win){
    gain = Math.max(10, 110 - used*10) + Math.min(50, dtScore.streak*5);
    dtScore.win++; dtScore.streak++;
    if(gain > dtScore.best) dtScore.best = gain;
  }else{
    dtScore.lose++; dtScore.streak = 0;
  }
  var el = $('dtOut');
  if(el){
    el.innerHTML = '<div class="'+(win?'ok':'warn')+'" style="margin-top:12px">'+
      '<b style="font-size:15px">'+(win?'🎉 答对了！就是 '+esc(s.name):'🫣 答案是 '+esc(s.name))+'</b><br>'+
      '用了 '+used+' 条线索'+(win?(' · 本局得分 <b>'+gain+'</b> 分'+(dtScore.streak>1?(' · 连胜 '+dtScore.streak+' 局 🔥'):'')):' · 本局 0 分')+
      '<br><span style="font-size:11.5px">七周累计 '+s.total+' 次 · 主战场 '+s.topSub+' · 峰值 '+WEEKS[s.w.indexOf(s.maxw)]+'</span>'+
      '<div style="margin-top:8px"><button class="btn ghost" id="dtNext">再来一局</button></div></div>';
    var nx = $('dtNext');
    if(nx) nx.addEventListener('click', dtNewCase);
  }
  renderDtScore();
}
function renderDtScore(){
  var el = $('dtScore');
  if(!el) return;
  var tot = dtScore.win + dtScore.lose;
  var rate = tot ? Math.round(dtScore.win/tot*100) : 0;
  el.innerHTML = '<span>答对 <b>'+dtScore.win+'</b></span><span>答错 <b>'+dtScore.lose+'</b></span>'+
    '<span>正确率 <b>'+rate+'%</b></span><span>当前连胜 <b>'+dtScore.streak+'</b></span>'+
    '<span>单局最高 <b>'+dtScore.best+'</b></span>';
}
function dtFillGuess(){
  var sel = $('dtGuess');
  if(!sel) return;
  sel.innerHTML = S.filter(function(s){return s.total>0;})
    .sort(function(a,b){return a.name.localeCompare(b.name,'zh');})
    .map(function(s){return '<option value="'+esc(s.name)+'">'+esc(s.name)+'</option>';}).join('');
}

/* --- 2. 违纪诊断书 --- */
var EVO = [
  {max:0,  e:'🥚', t:'纪律之卵', r:'0 次',  d:'七周零违纪，纯净状态'},
  {max:1,  e:'🌱', t:'初犯萌芽', r:'1 次',  d:'只出现过一次，几乎可以忽略'},
  {max:3,  e:'🍃', t:'轻度走神', r:'2–3 次', d:'偶发范围，属于正常波动'},
  {max:6,  e:'🔥', t:'活跃分子', r:'4–6 次', d:'已进入老师的常规视线'},
  {max:9,  e:'⚡', t:'重点关注', r:'7–9 次', d:'名字开始被高频念到'},
  {max:99, e:'👑', t:'传说级',   r:'10 次+', d:'全班天花板级别'}
];
function evoOf(s){
  for(var i=0;i<EVO.length;i++) if(s.total <= EVO[i].max) return {i:i, e:EVO[i]};
  return {i:EVO.length-1, e:EVO[EVO.length-1]};
}
function renderDiag(){
  var s = pickWho('thWho'); if(!s) return;
  var ev = evoOf(s);
  var sym = [];
  if(s.maxw>=4) sym.push('单周集中爆发（最高 '+s.maxw+' 次）');
  if(s.spread>=5) sym.push('高频持续（'+s.spread+' 周在榜）');
  if(s.subSpread>=4) sym.push('跨科扩散（涉及 '+s.subSpread+' 门学科）');
  if(s.delta>0) sym.push('近期加重（后半程 +'+s.delta+'）');
  else if(s.delta<0) sym.push('近期好转（后半程 '+s.delta+'）');
  if(s.streak>=3) sym.push('连续性发作（最长连续 '+s.streak+' 周）');
  if(!sym.length) sym.push('偶发，未发现系统性症状');
  var dept = s.total>0 ? s.topSub : '全科';
  var rx = s.total===0
    ? '无需用药。建议继续保持，并在班会上作为正面案例点名一次。'
    : (s.total>=9
      ? '【处方一】座位前移一排，每日一次 【处方二】课堂发言指标 ≥1 次/节 【处方三】与同桌签署「互不打扰条约」 【处方四】每周五自我复盘 5 分钟'
      : (s.delta>0
        ? '【处方一】排查近期座位与同伴变动 【处方二】主战场「'+s.topSub+'」课提前预习 10 分钟 【处方三】设定「连续两周为 0」小目标'
        : '【处方一】一般性口头提醒即可，不必单独施压 【处方二】纳入常规观察名单 【处方三】见效后及时正向反馈'));
  var verdict = '查 '+esc(s.name)+'，七周之内违纪 '+s.total+' 次，尤以「'+dept+'」课为甚。'+
    (s.total===0 ? '念其七周守纪、始终如一，着即通报表扬，免除一切"用药"。'
      : (s.delta<0 ? '念其后期收敛、确有悔改之意，着以观后效，暂不追加处置。'
        : (s.delta>0 ? '然其后半程反有加重之势，着令重点关注，限期整改。'
          : '念其前后如一、未见恶化，着以常规提醒，记录在案。')));
  $('thOut').innerHTML =
    '<div class="diag"><div class="dl">'+
      '<b>就诊人</b><span>'+esc(s.name)+'</span>'+
      '<b>科室</b><span>'+dept+'科</span>'+
      '<b>当前形态</b><span>'+ev.e.e+' '+ev.e.t+'（'+ev.e.r+'）</span>'+
      '<b>主诉</b><span>'+(s.total===0?'七周内无任何违纪主诉':'近七周于「'+dept+'」等课出现注意力脱离共 '+s.total+' 次')+'</span>'+
      '<b>既往史</b><span>'+SHORT.map(function(w,i){return w+' '+s.w[i];}).join(' / ')+'</span>'+
      '<b>症状</b><span>'+sym.join('；')+'</span>'+
      '<b>诊断</b><span>'+ev.e.t+(s.subSpread>=4?' · 伴跨科扩散':(s.subSpread===1&&s.total>0?' · 单科局限型':''))+'</span>'+
    '</div>'+
    '<div class="verdict"><b>判词：</b>'+verdict+'</div>'+
    '<div class="rx"><b>处方：</b>'+rx+'</div></div>';
}

/* --- 3. 违纪朋友圈 --- */
var MOMENT_TPL = {
  high:[
    '第 {n} 次被记名字了，我感觉我的名字比课本内容还熟。',
    '老师说名单上又有我，我怀疑这个名单是不是专门为我设的。',
    '本周战况：{n} 次。别问，问就是课太有意思了。',
    '我和讲台的距离，只剩下这 {n} 次违纪了。'
  ],
  mid:[
    '又被记了一次……这个学期还剩几周来着？',
    '明明只是转了个头，怎么就上榜了呢。',
    '累计 {n} 次了，开始有点慌。',
    '这 {n} 次里至少有两次是被冤枉的（大概）。'
  ],
  low:[
    '七年……啊不，七周就 {n} 次，四舍五入等于没有吧。',
    '被记了 {n} 次，老师可能只是想记住我的名字。',
    '我的违纪记录少得可怜，但我还是想发个朋友圈纪念一下。'
  ],
  zero:[
    '七周零违纪，低调，勿cue。',
    '名单上没有我，这很合理。',
    '老师说要表扬零违纪的同学，我先提前高兴一下。'
  ]
};
function renderMoment(){
  var s = pickWho('thWho'); if(!s) return;
  var key = s.total>=9 ? 'high' : (s.total>=4 ? 'mid' : (s.total>0 ? 'low' : 'zero'));
  var arr = MOMENT_TPL[key];
  var text = arr[rnd(arr.length)].replace('{n}', s.total);
  if(s.total>0) text += ' #'+s.topSub+'课';
  var others = S.filter(function(x){return x.name!==s.name;});
  var picks = shuffleArr(others).slice(0, 3 + rnd(2));
  var cmts = picks.map(function(o){
    var t;
    if(o.total===0) t = ['震惊，我坐你旁边居然没发现','下次带上我（不是）','？我一直以为你是好学生','老师：名单上怎么会有你'][rnd(4)];
    else if(o.total>=9) t = ['兄弟，同道中人','你这数据还是比我差点','一起罚站啊','懂的都懂 🤝'][rnd(4)];
    else if(o.total>=4) t = ['保重','我懂你','下次注意点','要不咱俩换个座位'][rnd(4)];
    else t = ['哈哈哈哈哈哈','还行，就一次','下次别了','已阅'][rnd(4)];
    return '<div class="cmt"><b>'+esc(o.name)+'</b>'+t+'</div>';
  }).join('');
  var likes = s.total===0 ? (10 + rnd(30)) : Math.max(2, Math.min(state.classSize, state.classSize - s.rank + rnd(8)));
  $('thOut').innerHTML =
    '<div class="moment"><div class="hd"><div class="av">'+esc(s.name.charAt(0))+'</div>'+
    '<div class="who"><b>'+esc(s.name)+'</b><span>七周累计 '+s.total+' 次 · '+evoOf(s).e.t+'</span></div></div>'+
    '<div class="body">'+esc(text)+'</div>'+
    '<div class="like">❤️ '+likes+' 人点赞</div>'+cmts+'</div>';
}

/* --- 4. 违纪进化链 --- */
function renderEvo(){
  var s = pickWho('evoWho'); if(!s) return;
  var cur = evoOf(s).i;
  var html = '<div class="evo">';
  EVO.forEach(function(e,i){
    if(i>0) html += '<span class="arrow">▶</span>';
    html += '<div class="evobox'+(i===cur?' on':'')+'"><div class="e">'+e.e+'</div>'+
      '<div class="t">'+e.t+'</div><div class="r">'+e.r+'</div></div>';
  });
  html += '</div>';
  var next = (cur < EVO.length-1) ? EVO[cur+1] : null;
  var need = next ? (EVO[cur].max + 1 - s.total) : 0;
  html += '<div style="margin-top:12px;font-size:13px">'+
    '<b>'+esc(s.name)+'</b> 目前停在 <b>'+EVO[cur].e+' '+EVO[cur].t+'</b>（'+s.total+' 次）'+
    (next ? '，距离进化成 <b>'+next.e+' '+next.t+'</b> 还差 <b style="color:#e11d48">'+need+'</b> 次。'
          : '，已经是本班的最终形态了 👑')+'</div>'+
    '<div style="font-size:12px;color:#7c859e;margin-top:4px">'+EVO[cur].d+'</div>';
  $('evoOut').innerHTML = html;
  // 全班分布
  var dist = EVO.map(function(e){ return {e:e, n:S.filter(function(x){return evoOf(x).i===EVO.indexOf(e);}).length}; });
  var mx = Math.max.apply(null, dist.map(function(d){return d.n;})) || 1;
  $('evoDist').innerHTML = dist.map(function(d){
    return '<div class="subbar"><span>'+d.e.e+' '+d.e.t+'</span>'+
      '<div class="t" style="height:18px"><i style="width:'+(d.n/mx*100)+'%"></i></div><em>'+d.n+' 人</em></div>';
  }).join('');
}
/* --- 5. 共犯雷达 --- */
function renderCo(){
  var bad = S.filter(function(s){return s.total>0;});
  var pairs = [];
  for(var i=0;i<bad.length;i++){
    for(var j=i+1;j<bad.length;j++){
      var a=bad[i], b=bad[j], sw=0, ss=0;
      for(var k=0;k<NW;k++) if(a.w[k]>0 && b.w[k]>0) sw += Math.min(a.w[k],b.w[k]);
      for(var m=0;m<NS;m++) if(a.sub[m]>0 && b.sub[m]>0) ss += Math.min(a.sub[m],b.sub[m]);
      var score = sw*2 + ss*3 + (a.topSub===b.topSub ? 4 : 0);
      if(score>0) pairs.push({a:a,b:b,sw:sw,ss:ss,score:score});
    }
  }
  pairs.sort(function(x,y){return y.score-x.score;});
  var top = pairs.slice(0,12);
  var mx = top.length ? top[0].score : 1;
  var html = '<div class="statgrid" style="margin-top:0">'+
    '<div class="stat"><b>'+pairs.length+'</b><span>存在关联的组合</span></div>'+
    '<div class="stat"><b>'+(top.length?top[0].score:0)+'</b><span>最强关联值</span></div>'+
    '<div class="stat"><b>'+(top.length?esc(top[0].a.name)+' & '+esc(top[0].b.name):'—')+'</b><span>头号组合</span></div></div>';
  html += top.map(function(p){
    var reason = [];
    if(p.sw) reason.push('同期上榜 '+p.sw+' 次');
    if(p.ss) reason.push('同科违纪 '+p.ss+' 次');
    if(p.a.topSub===p.b.topSub) reason.push('主战场同为'+p.a.topSub);
    return '<div class="copair">'+
      '<div class="nm" data-n="'+esc(p.a.name)+'"><b>'+esc(p.a.name)+'</b><span>'+p.a.total+' 次 · '+p.a.topSub+'</span></div>'+
      '<div class="nm" data-n="'+esc(p.b.name)+'"><b>'+esc(p.b.name)+'</b><span>'+p.b.total+' 次 · '+p.b.topSub+'</span></div>'+
      '<div style="display:flex;align-items:center;gap:8px"><div class="tk" style="width:90px"><i style="width:'+(p.score/mx*100)+'%"></i></div>'+
      '<span class="sc">'+p.score+'</span></div></div>'+
      '<div style="font-size:11.5px;color:#7c859e;margin:-4px 0 8px 4px">'+reason.join(' · ')+'</div>';
  }).join('');
  var el = $('coOut');
  el.innerHTML = html;
  el.querySelectorAll('[data-n]').forEach(function(x){
    x.addEventListener('click', function(){ openSheet(x.getAttribute('data-n')); });
  });
}

/* --- 6. 班级成就墙 --- */
var ACHS = [
  {e:'👑', t:'违纪之王', d:'累计次数全班第一', f:function(s){return s.rank===1;}},
  {e:'💥', t:'单周四杀', d:'某一周违纪 4 次及以上', f:function(s){return s.maxw>=4;}},
  {e:'📆', t:'七周全勤', d:'七周每周都有上榜记录', f:function(s){return s.spread===NW;}},
  {e:'🎨', t:'五科开花', d:'违纪涉及 5 门及以上学科', f:function(s){return s.subSpread>=5;}},
  {e:'🎯', t:'一科专精', d:'违纪全部集中在 1 门学科', f:function(s){return s.subSpread===1 && s.total>0;}},
  {e:'🔥', t:'连续剧主角', d:'最长连续 3 周及以上违纪', f:function(s){return s.streak>=3;}},
  {e:'🚀', t:'开局即巅峰', d:'违纪全部发生在第一周', f:function(s){return s.w[0]>0 && s.total===s.w[0];}},
  {e:'🕊️', t:'浪子回头', d:'前半程有违纪，后半程完全归零', f:function(s){return s.first>0 && s.last===0;}},
  {e:'🌱', t:'后半程新秀', d:'前半程干净，后半程才出现', f:function(s){return s.first===0 && s.last>0;}},
  {e:'📉', t:'急速刹车', d:'后半程比前半程减少 3 次及以上', f:function(s){return s.delta<=-3;}},
  {e:'📈', t:'油门到底', d:'后半程比前半程增加 3 次及以上', f:function(s){return s.delta>=3;}},
  {e:'🗣️', t:'政治课辩手', d:'政治课违纪 3 次及以上', f:function(s){return s.sub[4]>=3;}},
  {e:'🔢', t:'数学克星', d:'数学课违纪 3 次及以上', f:function(s){return s.sub[1]>=3;}},
  {e:'🎤', t:'音乐课驻唱', d:'音乐课违纪 2 次及以上', f:function(s){return s.sub[9]>=2;}},
  {e:'❓', t:'查无实据', d:'存在未注明学科的违纪记录', f:function(s){return s.sub[12]>0;}},
  {e:'🏁', t:'收尾还在冲', d:'第七周仍有违纪记录', f:function(s){return s.w[6]>0;}}
];
function renderAch(){
  var html = '<div class="grid3" style="gap:10px">';
  ACHS.forEach(function(a){
    var who = S.filter(function(s){ return s.total>0 && a.f(s); });
    var names = who.map(function(s){return s.name;});
    html += '<div class="ach'+(names.length?' done':'')+'"><span class="e">'+(names.length?a.e:'🔒')+'</span><div>'+
      '<b>'+a.t+'</b><div class="d">'+a.d+'</div>'+
      (names.length
        ? '<div class="w">✅ '+names.length+' 人解锁：'+esc(names.slice(0,6).join('、'))+(names.length>6?' 等':'')+'</div>'
        : '<div class="lock">尚未解锁</div>')+
      '</div></div>';
  });
  html += '</div>';
  var el = $('achWall');
  el.innerHTML = html;
  var done = ACHS.filter(function(a){ return S.some(function(s){return s.total>0 && a.f(s);}); }).length;
  el.innerHTML = '<div style="font-size:12.5px;color:#7c859e;margin-bottom:10px">已解锁 '+done+' / '+ACHS.length+' 项成就</div>' + html;
}
/* 取下拉当前值，无效时回退到排名第一的同学 */
function pickWho(id){
  var el = $(id);
  var s = el && el.value ? byName(el.value) : null;
  return s || RANK[0] || S[0];
}
function fillFunSelects(){
  var opts = S.slice().sort(function(a,b){ return b.total-a.total || a.name.localeCompare(b.name,'zh'); })
    .map(function(s){ return '<option value="'+esc(s.name)+'">'+esc(s.name)+'（'+s.total+' 次）</option>'; }).join('');
  ['#thWho','#evoWho'].forEach(function(sel){
    var el = document.querySelector(sel); if(!el) return;
    var cur = el.value; el.innerHTML = opts; if(cur) el.value = cur;
  });
}


/* ============ 单人剧场：四种文体切换 ============ */
var THEATRE = {
  tk:  {f:'renderTicket', label:'🧾 违纪罚单'},
  mom: {f:'renderMoment', label:'📱 朋友圈'},
  yr:  {f:'renderYear',   label:'🎬 年度回忆'},
  dg:  {f:'renderDiag',   label:'📜 诊断书'}
};
var theatreNow = 'tk';
function renderTheatre(){
  var t = THEATRE[theatreNow] || THEATRE.tk;
  if(typeof window[t.f] === 'function') window[t.f]();
}
document.querySelectorAll('[data-th]').forEach(function(c){
  c.addEventListener('click', function(){
    document.querySelectorAll('[data-th]').forEach(function(x){x.classList.remove('on');});
    c.classList.add('on');
    theatreNow = c.getAttribute('data-th');
    renderTheatre();
  });
});



/* 展开时自动给一次初始结果，避免空白 */
function calcInit(){ var b=document.getElementById('calcBtn'); if(b) b.click(); }
function duelInit(){ fillPlaySelects(); var b=document.getElementById('bpGo'); if(b) b.click(); }
function toolsInit(){ var b=document.getElementById('tShuffle'); if(b) b.click(); }
function slotInit(){
  var o=document.getElementById('slOut');
  if(o && !o.innerHTML.trim()) o.innerHTML='<div class="desc">点「🎰 拉杆」，三列会依次停下并核对是否命中真实记录。</div>';
}
function radioInit(){
  var o=document.getElementById('rdOut');
  if(o && !o.innerHTML.trim()) o.innerHTML='<div class="desc">点「📻 开始播报」，电台会逐条播出本周违纪要闻。</div>';
}

/* ============ 趣味实验室：按需展开 + 懒渲染 ============ */
var LAB_KEY = 'kb_lab_open_v1';
var labOpen = {};
var labDone = {};
function labLoad(){
  try{ labOpen = JSON.parse(localStorage.getItem(LAB_KEY)) || {}; }catch(e){ labOpen = {}; }
}
function labSave(){ try{ localStorage.setItem(LAB_KEY, JSON.stringify(labOpen)); }catch(e){} }
function labRun(pid){
  var box = document.getElementById('play-'+pid);
  if(!box) return;
  var fn = box.getAttribute('data-fn');
  if(fn && !labDone[pid]){
    labDone[pid] = 1;
    try{
      if(typeof window[fn] === 'function') window[fn]();
      if(fn === 'wheel') drawWheel(wheelNames());
    }catch(e){}
  }
}
function labSet(pid, on){
  var box = document.getElementById('play-'+pid);
  if(!box) return;
  labOpen[pid] = !!on;
  box.style.display = on ? '' : 'none';
  var btn = document.querySelector('[data-play="'+pid+'"]');
  if(btn) btn.classList.toggle('on', !!on);
  if(on) labRun(pid);
  labSave();
  labCount();
}
function labCount(){
  var n = Object.keys(labOpen).filter(function(k){ return labOpen[k]; }).length;
  var el = document.getElementById('labCount');
  if(el) el.textContent = '当前展开 ' + n + ' / 22 个玩法';
}
document.querySelectorAll('[data-play]').forEach(function(b){
  b.addEventListener('click', function(){ labSet(b.getAttribute('data-play'), !labOpen[b.getAttribute('data-play')]); });
});
document.querySelectorAll('[data-fold]').forEach(function(b){
  b.addEventListener('click', function(){ labSet(b.getAttribute('data-fold'), false); });
});
$('labAll').addEventListener('click', function(){
  document.querySelectorAll('[data-play]').forEach(function(b){ labSet(b.getAttribute('data-play'), true); });
});
$('labNone').addEventListener('click', function(){
  document.querySelectorAll('[data-play]').forEach(function(b){ labSet(b.getAttribute('data-play'), false); });
});
function labRestore(){
  document.querySelectorAll('[data-play]').forEach(function(b){
    var pid = b.getAttribute('data-play');
    if(labOpen[pid]) labSet(pid, true);
  });
  labCount();
}

/* ============ 渲染入口 ============ */
function render(){
  renderKpis(); renderWeekBars(); renderDonut(); renderCompare(); renderFocus();
  renderTopSub(); renderWeather(); renderRank(); renderWeek();
  renderSubBars(); renderSubKings(); renderSubSpread(); renderSubHeat();
  renderHeat(); renderPattern(); renderBadges(); renderHonor(); renderAwards();
  renderCo(); renderAch(); renderDuanwei();
  renderWheelStat(); renderSim();
  drawWheel(wheelNames());
  renderTheatre();
}
/* 填充「玩坏了」面板的四个下拉框（此前遗漏，导致该面板不可用） */
function fillPlaySelects(){
  var opts = S.slice().sort(function(a,b){ return a.name.localeCompare(b.name,'zh'); })
    .map(function(s){ return '<option value="'+esc(s.name)+'">'+esc(s.name)+'</option>'; }).join('');
  var badOpts = S.filter(function(s){return s.total>0;}).sort(function(a,b){return a.name.localeCompare(b.name,'zh');})
    .map(function(s){ return '<option value="'+esc(s.name)+'">'+esc(s.name)+'</option>'; }).join('');
  var mpw = $('mpWho'); if(mpw){ mpw.innerHTML = opts; }
  var ggp = $('ggPick'); if(ggp){ ggp.innerHTML = badOpts; }
  var pa = $('bpA'), pb = $('bpB');
  if(pa){ pa.innerHTML = opts; if(RANK[0]) pa.value = RANK[0].name; }
  if(pb){ pb.innerHTML = opts; if(RANK[1]) pb.value = RANK[1].name; }
}
function init(){
  load(); labLoad();
  $('simRange').max = Math.max(1, RANK.length);
  renderQuiz(); render();
  dtFillGuess(); fillFunSelects(); fillArcadeSelects();
  dtNewCase(); renderEvo(); renderTimeMachine();
  fillPlaySelects(); mpStart();
  renderForecast(); renderScratch(); renderBingo(); renderTheatre();
  // 玩法默认收起，仅恢复上次展开过的（其它等点开时再渲染）
  labDone = {awards:1, badges:1, honor:1, duanwei:1, ach:1, wheel:1, evo:1, co:1, quiz:1, sim:1, timemachine:1, forecast:1, theatre:1};
  labRestore();
  var so=$('slOut'); if(so && !so.innerHTML) so.innerHTML='<div class="desc">点「拉杆」开始，三列会依次停下。</div>';
  var ro=$('rdOut'); if(ro && !ro.innerHTML) ro.innerHTML='<div class="desc">点「开始播报」，电台会逐条播出本周违纪要闻。</div>';
  var wsumv = S.reduce(function(a,s){return a+s.total;},0);
  var ssumv = S.reduce(function(a,s){return a+s.subTotal;},0);
  $('dataNote').innerHTML =
    '· 数据来自两份《课堂违纪》登记表（周次分类 + 学科分类），全班 '+S.length+' 人已全部录入，累计 '+TOTAL+' 次违纪。<br>'+
    '· 周次口径合计 '+wsumv+' 次、学科口径 '+ssumv+' 次，两表完全对齐；两侧互为补充：周次看时间分布，学科看课堂归属。<br>'+
    '· 「不详」指原表中未注明学科的违纪记录。<br>'+
    '· 姓名为脱敏形式（姓氏 + 首字母），导出与打印时保持原样。';
}
init();
