/* 课堂违纪互动看板 · 数据与常量（源自两份《课堂违纪》登记表） */

/* ============ 安全取值：元素不存在时返回哑对象，避免误删节点导致脚本中断 ============ */
var FAKE_STYLE = new Proxy({}, {get:function(){return '';}, set:function(){return true;}});
var FAKE_CL = {add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}};
var FAKE = new Proxy(function(){}, {
  get: function(t,k){
    if(k==='innerHTML'||k==='textContent'||k==='value'||k==='src'||k==='href') return '';
    if(k==='style') return FAKE_STYLE;
    if(k==='classList') return FAKE_CL;
    if(k==='scrollHeight'||k==='scrollTop'||k==='offsetWidth'||k==='offsetHeight'||k==='length') return 0;
    if(k==='options') return [];
    if(k==='files') return [];
    if(k===Symbol.toPrimitive||k==='toString') return function(){return '';};
    return function(){ return FAKE; };
  },
  set: function(){ return true; }
});
function $(id){ return document.getElementById(id) || FAKE; }

/* ============ 基础数据 ============ */
const SUBS  = ['语文','数学','英语','物理','政治','历史','生物','地理','信息','音乐','美术','体育','不详'];
const RAW = [["艾XY",[1,2,2,4,0,1,2],
[1,2,0,1,2,0,0,1,0,3,1,0,1]],
["敖JS",[0,0,0,2,0,0,0],
[0,0,0,0,1,0,0,1,0,0,0,0,0]],
["曾YC",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["陈BS",[0,0,2,0,0,0,1],
[0,0,0,0,0,1,0,0,0,1,1,0,0]],
["陈CX",[0,0,0,0,1,0,0],
[0,0,0,0,1,0,0,0,0,0,0,0,0]],
["陈XF",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["陈YM",[0,1,0,1,0,0,0],
[0,1,0,0,1,0,0,0,0,0,0,0,0]],
["陈ZY",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["杜YT",[1,0,0,0,1,0,0],
[2,0,0,0,0,0,0,0,0,0,0,0,0]],
["段PY",[0,0,0,2,2,1,1],
[1,0,0,3,0,0,1,1,0,0,0,0,0]],
["付JY",[2,2,1,4,1,1,0],
[1,2,0,1,4,0,0,1,1,0,1,0,0]],
["葛YT",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["郭SR",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["韩CX",[0,1,0,0,0,0,0],
[0,0,0,1,0,0,0,0,0,0,0,0,0]],
["何YM",[1,1,2,5,1,1,2],
[0,3,0,1,3,0,1,2,0,2,1,0,0]],
["何ZQ",[0,0,3,2,1,0,2],
[1,1,0,2,1,0,0,1,0,1,1,0,0]],
["黄KC",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["黄SQ",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["惠CY",[0,0,0,1,0,0,0],
[0,0,0,0,0,0,1,0,0,0,0,0,0]],
["江KY",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["蒋HY",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["李H",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["李KX",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["李PL",[0,0,1,0,0,1,0],
[0,0,0,0,0,0,0,0,1,1,0,0,0]],
["梁BL",[1,1,1,2,0,0,2],
[1,3,0,0,0,0,0,0,0,1,1,0,1]],
["刘RX",[0,0,0,0,0,0,1],
[0,0,0,1,0,0,0,0,0,0,0,0,0]],
["刘XY",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["刘YX",[1,0,0,1,0,1,1],
[0,1,0,0,1,0,1,1,0,0,0,0,0]],
["罗YX",[0,1,1,2,0,0,0],
[0,1,0,0,0,0,0,1,0,1,0,0,1]],
["牟HR",[0,0,1,1,0,0,0],
[0,1,0,1,0,0,0,0,0,0,0,0,0]],
["穆XH",[0,0,3,5,1,0,0],
[0,2,0,1,2,0,0,0,0,2,2,0,0]],
["秦WM",[0,0,1,3,0,0,0],
[1,2,0,0,0,0,0,0,0,1,0,0,0]],
["邱YL",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["任YL",[1,0,0,0,1,0,0],
[0,0,0,0,2,0,0,0,0,0,0,0,0]],
["舒T",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["汤HY",[0,0,0,2,0,0,1],
[0,1,0,0,1,0,0,1,0,0,0,0,0]],
["唐K",[0,0,0,0,0,2,0],
[0,1,0,0,0,0,0,0,0,1,0,0,0]],
["田YC",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["王W",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["王YH",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["王ZY",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["韦ZX",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["杨YR",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["张JC",[0,0,0,1,1,0,0],
[0,0,0,0,1,0,0,0,0,0,1,0,0]],
["张JR",[0,0,0,1,0,0,0],
[0,0,0,0,0,0,1,0,0,0,0,0,0]],
["张JY",[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0]],
["张YH",[0,0,0,1,0,0,0],
[0,1,0,0,0,0,0,0,0,0,0,0,0]],
["张ZT",[1,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,1,0,0,0,0]],
["张ZY",[0,1,2,0,0,2,1],
[0,0,0,1,1,0,1,0,1,2,0,0,0]],
["赵RR",[0,0,2,0,1,0,1],
[0,0,0,0,3,0,0,0,0,1,0,0,0]],
["周YT",[0,1,1,1,0,0,0],
[0,0,0,0,0,0,0,1,0,1,0,0,1]],
["朱RZY",[0,1,0,0,0,0,1],
[0,0,0,0,1,0,0,0,0,0,0,0,1]]];
/* 周数完全由数据决定：7 周、8 周或更多都能自动适配，无需改代码 */
const CN_NUM = ['零','一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五'];
const NW = RAW[0][1].length;
const NS = RAW[0][2].length;
const WEEKS = [], SHORT = [];
(function(){ for(var i=0;i<NW;i++){ WEEKS.push('第'+CN_NUM[i+1]+'周'); SHORT.push('W'+(i+1)); } })();
const WEEKSTXT = CN_NUM[NW] + '周';                 /* 七周 / 八周 */
const L = NW-1, L2 = NW-2, L3 = NW-3;               /* 最后一周 / 倒数第二 / 倒数第三 */
const HALF = Math.floor(NW/2);                      /* 前半程周数（7周→3，8周→4） */
const WEEK_F = '前'+CN_NUM[HALF]+'周（W1–W'+HALF+'）';                 /* 前三周（W1–W3） */
const WEEK_S = '后'+CN_NUM[NW-HALF]+'周（W'+(HALF+1)+'–W'+NW+'）';     /* 后四周（W4–W7） */
const WEEK_R2 = '第'+CN_NUM[NW-1]+'–'+CN_NUM[NW]+'周';                 /* 第六–七周 */
function sumW(a, s, e){ var t=0; for(var i=s;i<e;i++) t += (a[i]||0); return t; }
const STORE_KEY = 'classDiscipline_7w_sub_v1';

let S = RAW.map(function(r){ return {name:r[0], w:r[1].slice(), sub:r[2].slice()}; });
let BAD = S.filter(function(s){ return s.w.reduce(function(a,b){return a+b;},0) > 0; });
let RANK = [], TOTAL = 0, PEAK = 0, weekTotals = [], weekPeople = [], subTotals = [], subPeople = [];

function compute(){
  S.forEach(function(s){
    s.total  = s.w.reduce(function(a,b){return a+b;},0);
    s.subTotal = s.sub.reduce(function(a,b){return a+b;},0);
    s.spread = s.w.filter(function(x){return x>0;}).length;
    s.subSpread = s.sub.filter(function(x){return x>0;}).length;
    s.first  = s.w[0]+s.w[1]+s.w[2];
    s.last   = sumW(s.w,HALF,NW);
    s.delta  = s.last - s.first;
    s.recent = s.w[L];
    s.maxw   = Math.max.apply(null, s.w);
    s.maxSub = Math.max.apply(null, s.sub);
    s.topSub = SUBS[s.sub.indexOf(s.maxSub)];
    s.level  = s.total>=9 ? 'high' : (s.total>=4 ? 'mid' : (s.total>0 ? 'low':'zero'));
    s.streak = maxStreak(s.w);
  });
  RANK = BAD.slice().sort(function(a,b){return b.total-a.total || b.recent-a.recent || a.name.localeCompare(b.name);});
  RANK.forEach(function(s,i){ s.rank = i+1; });
  TOTAL = S.reduce(function(a,s){return a+s.total;},0);
  weekTotals = []; weekPeople = [];
  for(var i=0;i<NW;i++){
    weekTotals.push(S.reduce(function(a,s){return a+s.w[i];},0));
    weekPeople.push(S.filter(function(s){return s.w[i]>0;}).length);
  }
  subTotals = []; subPeople = [];
  for(var j=0;j<NS;j++){
    subTotals.push(S.reduce(function(a,s){return a+s.sub[j];},0));
    subPeople.push(S.filter(function(s){return s.sub[j]>0;}).length);
  }
  PEAK = weekTotals.indexOf(Math.max.apply(null,weekTotals));
}
function maxStreak(w){
  var best=0, cur=0;
  for(var i=0;i<w.length;i++){ if(w[i]>0){cur++; if(cur>best) best=cur;} else cur=0; }
  return best;
}
compute();

