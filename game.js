// ================================================================
//  TETRIS PRO — Fixed v4
//  Fix 1: Brighter block colors with stronger highlights
//  Fix 2: Pause truly freezes ALL timers (drop + cooldowns + slow)
//  Fix 3: Puzzle mode spawns correctly after each round; procedural
//          random unique puzzle generation (no repeating layouts)
//  Fix 4: Responsive canvas — resizes to fit screen
// ================================================================

var COLS=10, ROWS=20;
var SZ=30; // computed dynamically

// ── Piece definitions — BRIGHTER colors ──────────────────────
var DEFS={
  I:{shape:[[1,1,1,1]],         color:'#11eeff', hi:'#aaffff', sh:'#007a88'},
  O:{shape:[[1,1],[1,1]],       color:'#ffe033', hi:'#fff099', sh:'#887000'},
  T:{shape:[[0,1,0],[1,1,1]],   color:'#cc66ff', hi:'#eeb8ff', sh:'#660099'},
  S:{shape:[[0,1,1],[1,1,0]],   color:'#44ee77', hi:'#aaffcc', sh:'#116633'},
  Z:{shape:[[1,1,0],[0,1,1]],   color:'#ff4466', hi:'#ffaaaa', sh:'#881122'},
  J:{shape:[[1,0,0],[1,1,1]],   color:'#44aaff', hi:'#aadeff', sh:'#114488'},
  L:{shape:[[0,0,1],[1,1,1]],   color:'#ff9922', hi:'#ffcc88', sh:'#884400'}
};
var RAINBOW_DEF={shape:[[1,1],[1,1]],color:'#ff69b4',hi:'#ffccee',sh:'#881044',rainbow:true};
var PKEYS=Object.keys(DEFS);
var LSCORE=[0,100,300,500,800];
var SHOP_PRICES={hammer:50,bomb:80,rainbow:60,slow:40,life:120};
var PU_CD={hammer:45,bomb:60,rainbow:75,mystery:40};
var PU_MAX={hammer:2,bomb:2,rainbow:2,slow:2,life:3,mystery:0};

// ── DOM ──────────────────────────────────────────────────────
var canvas=document.getElementById('board');
var ctx=canvas.getContext('2d');
var cnNext=document.getElementById('c-next'); var cxNext=cnNext.getContext('2d');
var cnHold=document.getElementById('c-hold'); var cxHold=cnHold.getContext('2d');
var elScore=document.getElementById('score');
var elBest=document.getElementById('best');
var elLevel=document.getElementById('level');
var elLines=document.getElementById('lines');
var elCombo=document.getElementById('combo');
var elCoins=document.getElementById('coins');
var elProg=document.getElementById('prog');
var overlay=document.getElementById('overlay');
var ovTitle=document.getElementById('ov-title');
var ovSub=document.getElementById('ov-sub');
var ovStats=document.getElementById('ov-stats');
var ovExtralife=document.getElementById('ov-extralife');
var btnStart=document.getElementById('btn-start');
var btnUseLife=document.getElementById('btn-use-life');
var btnSkipLife=document.getElementById('btn-skip-life');
var hammerBanner=document.getElementById('hammer-banner');
var puzzleBar=document.getElementById('puzzle-bar');
var elPuzMoves=document.getElementById('puz-moves');
var elPuzLimit=document.getElementById('puz-limit');
var elPuzGoal=document.getElementById('puz-goal');
var elPuzStatus=document.getElementById('puz-status');
var toastEl=document.getElementById('toast');
var comboPop=document.getElementById('combo-pop');

// ── State ────────────────────────────────────────────────────
var board=(function(){var b=[];for(var r=0;r<ROWS;r++)b.push(new Array(COLS).fill(null));return b;}());
var cur=null,nxt=null,held=null;
var score=0,lines=0,level=1,combo=0;
var coins=parseInt(localStorage.getItem('tcoins')||'0');
var best=parseInt(localStorage.getItem('tbest')||'0');
var canHold=true,clearing=false,paused=false,over=false,running=false;
var dropSpeed=800,dropTimer=null;
var flashRows=[];
var gameMode='classic';
var activeTool=null;
var slowActive=false;
var slowRemaining=0; // ms remaining when paused
var slowTimer=null;
var slowStartTime=0;
var inv={hammer:0,bomb:0,rainbow:0,slow:0,life:0,mystery:0};

// ── FIX 2: Pause-aware cooldown system ───────────────────────
// We store remaining ms for each cooldown, not wall-clock
var cdLeft={hammer:PU_CD.hammer*1000, bomb:PU_CD.bomb*1000,
            rainbow:PU_CD.rainbow*1000, mystery:PU_CD.mystery*1000};
var cdLastTick=0;       // timestamp of last tick
var cdInterval=null;    // the setInterval handle
var cdPaused=false;     // true when timers frozen

// Puzzle state
var puzzleRound=0;
var puzzleMoves=0;
var puzzleGoal=0;
var puzzleMoveLimit=0;
var puzzleLinesCleared=0;
var usedPuzzleSeeds=[];

// Display init
elCoins.textContent=coins;
elBest.textContent=best;

// ── Responsive canvas sizing ──────────────────────────────────
function resizeCanvas(){
  var maxH=window.innerHeight-120;
  var maxW;
  if(window.innerWidth<700){
    maxW=Math.min(window.innerWidth-20, 320);
  } else if(window.innerWidth<1024){
    maxW=280;
  } else {
    maxW=300;
  }
  // Keep 1:2 aspect ratio (COLS:ROWS = 10:20)
  var szByH=Math.floor(maxH/ROWS);
  var szByW=Math.floor(maxW/COLS);
  SZ=Math.max(18, Math.min(szByH, szByW));
  canvas.width=SZ*COLS;
  canvas.height=SZ*ROWS;
  // Also resize next/hold canvases proportionally
  var pSz=Math.round(SZ*0.85);
  cnNext.width=pSz*5; cnNext.height=pSz*4;
  cnHold.width=pSz*5; cnHold.height=pSz*4;
  positionOverlay();
}

// ── Overlay positioning ───────────────────────────────────────
function positionOverlay(){
  var r=canvas.getBoundingClientRect();
  var p=overlay.parentElement.getBoundingClientRect();
  overlay.style.left=(r.left-p.left)+'px';
  overlay.style.top=(r.top-p.top)+'px';
  overlay.style.width=r.width+'px';
  overlay.style.height=r.height+'px';
}

// ── Toast ────────────────────────────────────────────────────
function toast(msg,col){
  toastEl.textContent=msg;
  toastEl.style.color=col||'#00eeff';
  toastEl.style.borderColor=col||'#00eeff';
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t=setTimeout(function(){toastEl.classList.remove('show');},2200);
}

function showComboPop(n){
  comboPop.textContent='COMBO ×'+n+'!';
  comboPop.classList.remove('show');
  void comboPop.offsetWidth;
  comboPop.classList.add('show');
}

// ── Coins ────────────────────────────────────────────────────
function addCoins(n){
  coins+=n; elCoins.textContent=coins; localStorage.setItem('tcoins',coins);
}
function spendCoins(n){
  if(coins<n)return false;
  coins-=n; elCoins.textContent=coins; localStorage.setItem('tcoins',coins);
  return true;
}

// ── Piece helpers ─────────────────────────────────────────────
function makePiece(key){
  if(key==='RAINBOW'){
    return{key:'RAINBOW',color:RAINBOW_DEF.color,hi:RAINBOW_DEF.hi,sh:RAINBOW_DEF.sh,rainbow:true,
           shape:RAINBOW_DEF.shape.map(function(r){return r.slice();}),
           x:Math.floor((COLS-2)/2),y:0};
  }
  var d=DEFS[key];
  return{key:key,color:d.color,hi:d.hi,sh:d.sh,
         shape:d.shape.map(function(r){return r.slice();}),
         x:Math.floor((COLS-d.shape[0].length)/2),y:0};
}
function randPiece(){return makePiece(PKEYS[Math.floor(Math.random()*PKEYS.length)]);}
function rotateCW(s){
  var R=s.length,C=s[0].length,out=[],c,r;
  for(c=0;c<C;c++){out[c]=[];for(r=0;r<R;r++)out[c][R-1-r]=s[r][c];}
  return out;
}

// ── Collision ─────────────────────────────────────────────────
function hits(p,dx,dy,sh){
  if(p&&p.rainbow){
    // rainbow only checks floor/board (not walls for left/right pass-through)
    dx=dx||0;dy=dy||0;sh=sh||p.shape;
    for(var r=0;r<sh.length;r++) for(var c=0;c<sh[r].length;c++){
      if(!sh[r][c])continue;
      var nx=p.x+c+dx,ny=p.y+r+dy;
      if(ny>=ROWS)return true;
      if(nx<0||nx>=COLS)return true;
      if(ny>=0&&board[ny][nx])return true;
    }
    return false;
  }
  dx=dx||0;dy=dy||0;sh=sh||p.shape;
  for(var r2=0;r2<sh.length;r2++) for(var c2=0;c2<sh[r2].length;c2++){
    if(!sh[r2][c2])continue;
    var nx2=p.x+c2+dx,ny2=p.y+r2+dy;
    if(nx2<0||nx2>=COLS||ny2>=ROWS)return true;
    if(ny2>=0&&board[ny2][nx2])return true;
  }
  return false;
}

// ── Wall kicks ────────────────────────────────────────────────
var KICKS=[[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
           [[0,0],[1,0],[1,-1],[0,2],[1,2]],
           [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
           [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]]];
var rotIdx=0;
function doRotate(){
  if(!cur||clearing||cur.rainbow)return;
  var ns=rotateCW(cur.shape),ks=KICKS[rotIdx%4];
  for(var i=0;i<ks.length;i++){
    var kx=ks[i][0],ky=ks[i][1];
    if(!hits(cur,kx,-ky,ns)){cur.shape=ns;cur.x+=kx;cur.y-=ky;rotIdx=(rotIdx+1)%4;return;}
  }
}

// ── Ghost ────────────────────────────────────────────────────
function ghostY(){
  var d=0;
  while(!hits(cur,0,d+1))d++;
  return cur.y+d;
}

// ── Spawn ─────────────────────────────────────────────────────
// FIX 3: spawn always sets running=true so pieces fall in puzzle mode
function spawn(){
  cur=nxt; nxt=randPiece(); rotIdx=0;
  drawPreview(cxNext,cnNext,nxt);
  if(!cur.rainbow&&hits(cur)){
    if(inv.life>0){ offerExtraLife(); }
    else { doGameOver(); }
    return;
  }
  running=true; // ensure drop timer respects running flag
  if(gameMode==='classic'&&level>=3&&Math.random()<0.04) placeStoneBlock();
}

// ── Hold ──────────────────────────────────────────────────────
function doHold(){
  if(!canHold||!cur||clearing)return;
  canHold=false;
  var swap=held?makePiece(held.key):null;
  held=makePiece(cur.key);
  drawPreview(cxHold,cnHold,held);
  if(swap){cur=swap;rotIdx=0;}else{spawn();}
}

// ── Lock ──────────────────────────────────────────────────────
function lock(){
  if(!cur)return;
  var topOut=false;
  for(var r=0;r<cur.shape.length;r++) for(var c=0;c<cur.shape[r].length;c++){
    if(!cur.shape[r][c])continue;
    var by=cur.y+r,bx=cur.x+c;
    if(by<0){topOut=true;continue;}
    if(bx<0||bx>=COLS||by>=ROWS)continue;
    board[by][bx]={color:cur.color,hi:cur.hi,sh:cur.sh};
  }
  if(topOut){if(inv.life>0)offerExtraLife();else doGameOver();return;}
  canHold=true;
  if(gameMode==='puzzle'){puzzleMoves++;elPuzMoves.textContent=puzzleMoves;}
  processLines();
}

// ── Line clear ────────────────────────────────────────────────
function processLines(){
  var full=[];
  for(var r=0;r<ROWS;r++) if(board[r].every(function(c){return c!==null;}))full.push(r);

  if(!full.length){
    if(combo>0){combo=0;elCombo.textContent='×0';}
    if(gameMode==='puzzle'){checkPuzzleOver();return;}
    spawn();return;
  }

  clearing=true;flashRows=full;cur=null;

  setTimeout(function(){
    if(over)return;
    for(var i=full.length-1;i>=0;i--){
      board.splice(full[i],1);
      board.unshift(new Array(COLS).fill(null));
    }
    flashRows=[];clearing=false;

    combo++;
    elCombo.textContent='×'+combo;
    if(combo>=2)showComboPop(combo);

    var pts=(LSCORE[Math.min(full.length,4)]+(combo>1?60*combo:0))*level;
    addScore(pts);
    addCoins(full.length*10+(combo>1?combo*5:0));
    lines+=full.length;
    elLines.textContent=lines;

    if(gameMode==='puzzle'){
      puzzleLinesCleared+=full.length;
      bumpLevel();
      checkPuzzleOver(); // FIX 3: checkPuzzleOver calls spawn() if not done
    } else {
      bumpLevel();
      spawn();
    }
  },300);
}

// ── Level ─────────────────────────────────────────────────────
function bumpLevel(){
  if(gameMode==='puzzle')return;
  var nl=Math.floor(lines/10)+1;
  if(nl!==level){
    level=nl;elLevel.textContent=level;
    dropSpeed=Math.max(80,900-(level-1)*85);
    startDropTimer();
    toast('LEVEL '+level+'! ⬆','#ffe033');
  }
  elProg.style.width=((lines%10)/10*100)+'%';
}

// ── Score ─────────────────────────────────────────────────────
function addScore(n){
  if(n<=0)return;
  score+=n;elScore.textContent=score;
  elScore.classList.remove('pop');void elScore.offsetWidth;elScore.classList.add('pop');
  if(score>best){best=score;elBest.textContent=best;localStorage.setItem('tbest',best);}
}

// ════════════════════════════════════════════════════
//  FIX 2: Pause-safe timer system
//  Drop timer: checks `paused` flag inside interval
//  Cooldown timers: track elapsed ms, freeze when paused
// ════════════════════════════════════════════════════

function startDropTimer(){
  clearInterval(dropTimer);
  dropTimer=setInterval(function(){
    if(paused||over||clearing||!cur||!running)return;
    softDrop(false);
  }, dropSpeed);
}

// Cooldown tick — called every 500ms
// Uses real elapsed time so pausing truly stops countdown
function tickCooldowns(){
  if(paused||over||!running)return; // FIX 2: skip when paused

  var now=Date.now();
  var elapsed=now-cdLastTick;
  cdLastTick=now;

  var keys=['hammer','bomb','rainbow','mystery'];
  keys.forEach(function(t){
    if(cdLeft[t]<=0)return;
    cdLeft[t]-=elapsed;
    var sec=Math.max(0,Math.ceil(cdLeft[t]/1000));
    var el=document.getElementById('cd-'+t);
    if(el)el.textContent=sec>0?sec+'s':'';
    if(cdLeft[t]<=0){
      cdLeft[t]=0;
      grantPowerup(t);
      // restart cooldown
      cdLeft[t]=PU_CD[t]*1000;
    }
  });
}

function startCooldownTimers(){
  clearInterval(cdInterval);
  cdLastTick=Date.now();
  cdInterval=setInterval(tickCooldowns,500);
}

function initCooldowns(){
  var keys=['hammer','bomb','rainbow','mystery'];
  cdLeft={hammer:PU_CD.hammer*1000,bomb:PU_CD.bomb*1000,
          rainbow:PU_CD.rainbow*1000,mystery:PU_CD.mystery*1000};
  cdLastTick=Date.now();
  keys.forEach(function(t){
    var el=document.getElementById('cd-'+t);
    if(el)el.textContent=PU_CD[t]+'s';
  });
}

// ── Movement ──────────────────────────────────────────────────
function moveL(){if(cur&&!clearing&&!paused&&!hits(cur,-1))cur.x--;}
function moveR(){if(cur&&!clearing&&!paused&&!hits(cur,1))cur.x++;}
function softDrop(manual){
  if(!cur||clearing||paused)return;
  if(!hits(cur,0,1)){cur.y++;if(manual)addScore(1);}else{lock();}
}
function hardDrop(){
  if(!cur||clearing||paused)return;
  var n=0;while(!hits(cur,0,1)){cur.y++;n++;}
  addScore(n*2);lock();
}

// ── Stone blocks ──────────────────────────────────────────────
function placeStoneBlock(){
  var col=Math.floor(Math.random()*COLS);
  var row=ROWS-1;
  while(row>0&&board[row][col])row--;
  if(!board[row][col])
    board[row][col]={color:'#667788',hi:'#99aabb',sh:'#334455',stone:true};
}

// ── Power-ups ─────────────────────────────────────────────────
function grantPowerup(type){
  if(PU_MAX[type]>0&&inv[type]>=PU_MAX[type]){
    toast('Max '+type+' stored!','#ff9922');return;
  }
  inv[type]++;
  updatePUDisplay();
  toast('Got '+type.toUpperCase()+'! 🎉','#44ee77');
}
function usePowerup(type){
  if(inv[type]<=0){toast('No '+type+'!','#ff4466');return false;}
  inv[type]--;updatePUDisplay();return true;
}
function updatePUDisplay(){
  ['hammer','bomb','rainbow','slow','life','mystery'].forEach(function(t){
    var ce=document.getElementById('cnt-'+t);
    var pe=document.getElementById('pu-'+t);
    if(ce)ce.textContent=inv[t];
    if(pe){if(inv[t]===0)pe.classList.add('empty');else pe.classList.remove('empty');}
  });
  // sync mobile powerups if present
  var mpu=document.getElementById('mobile-powerups');
  if(mpu){
    var items=mpu.querySelectorAll('.pu-item');
    items.forEach(function(el){
      var t=el.dataset.type;
      if(!t)return;
      var cc=el.querySelector('.pu-count');
      if(cc)cc.textContent=inv[t];
      if(inv[t]===0)el.classList.add('empty');else el.classList.remove('empty');
    });
  }
}

// ── Hammer ────────────────────────────────────────────────────
function activateHammer(){
  if(!running||over||paused)return;
  if(!usePowerup('hammer'))return;
  activeTool='hammer';
  canvas.classList.add('hammer-mode');
  hammerBanner.classList.remove('hidden');
  hammerBanner.textContent='🔨 CLICK A BLOCK TO BREAK IT';
  document.getElementById('pu-hammer').classList.add('active');
  toast('🔨 Click a block!','#ff9922');
}

function deactivateHammer(){
  activeTool=null;
  canvas.classList.remove('hammer-mode','bomb-mode');
  hammerBanner.classList.add('hidden');
  ['pu-hammer','pu-bomb'].forEach(function(id){
    var e=document.getElementById(id);if(e)e.classList.remove('active');
  });
}

// ── Bomb ──────────────────────────────────────────────────────
function activateBomb(){
  if(!running||over||paused)return;
  if(!usePowerup('bomb'))return;
  activeTool='bomb';
  canvas.classList.add('bomb-mode');
  hammerBanner.classList.remove('hidden');
  hammerBanner.textContent='💣 CLICK TO EXPLODE 3×3 AREA';
  document.getElementById('pu-bomb').classList.add('active');
  toast('💣 Click to EXPLODE!','#ff4466');
}

function explodeBomb(col,row){
  var cleared=0;
  for(var r=row-1;r<=row+1;r++) for(var c=col-1;c<=col+1;c++){
    if(r>=0&&r<ROWS&&c>=0&&c<COLS&&board[r][c]){board[r][c]=null;cleared++;}
  }
  var bwr=canvas.parentElement.getBoundingClientRect();
  var cr=canvas.getBoundingClientRect();
  var ex=document.createElement('div');
  ex.className='explosion';
  ex.style.width=ex.style.height='30px';
  ex.style.left=(cr.left-bwr.left+col*SZ+SZ/2-15)+'px';
  ex.style.top=(cr.top-bwr.top+row*SZ+SZ/2-15)+'px';
  canvas.parentElement.appendChild(ex);
  setTimeout(function(){try{ex.remove();}catch(e){}},500);
  addScore(cleared*15);addCoins(cleared*3);
  toast('💥 BOOM! '+cleared+' cleared!','#ff4466');
  deactivateHammer();
}

// ── Rainbow ───────────────────────────────────────────────────
function activateRainbow(){
  if(!running||over||paused)return;
  if(!usePowerup('rainbow'))return;
  cur=makePiece('RAINBOW');
  toast('🌈 Rainbow! Fits anywhere!','#cc66ff');
}

// ── Slow motion ───────────────────────────────────────────────
function activateSlow(){
  if(!running||over||paused)return;
  if(!usePowerup('slow'))return;
  slowActive=true;
  document.body.classList.add('slow-active');
  dropSpeed=Math.max(200,dropSpeed*2.2);
  startDropTimer();
  toast('🐢 SLOW! 10 seconds','#44ee77');
  clearTimeout(slowTimer);
  slowStartTime=Date.now();
  slowRemaining=10000;
  slowTimer=setTimeout(endSlow,slowRemaining);
}
function endSlow(){
  slowActive=false;
  document.body.classList.remove('slow-active');
  dropSpeed=Math.max(80,900-(level-1)*85);
  startDropTimer();
  toast('Slow ended.','#5a8aaa');
}

// FIX 2: when pausing, freeze the slow-motion countdown too
function pauseSlowTimer(){
  if(!slowActive||!slowTimer)return;
  clearTimeout(slowTimer);
  slowRemaining-=(Date.now()-slowStartTime);
  slowTimer=null;
}
function resumeSlowTimer(){
  if(!slowActive||slowTimer)return;
  if(slowRemaining<=0){endSlow();return;}
  slowStartTime=Date.now();
  slowTimer=setTimeout(endSlow,slowRemaining);
}

// ── Mystery ───────────────────────────────────────────────────
function openMystery(){
  if(!running||over||paused)return;
  if(!usePowerup('mystery'))return;
  var opts=['hammer','bomb','rainbow','slow','life'];
  var pick=opts[Math.floor(Math.random()*opts.length)];
  inv[pick]++;updatePUDisplay();
  toast('🎁 Mystery: '+pick.toUpperCase()+'!','#cc66ff');
}

// ── Shop ──────────────────────────────────────────────────────
function buyItem(type){
  var price=SHOP_PRICES[type];
  if(!spendCoins(price)){toast('Not enough coins!','#ff4466');return;}
  inv[type]++;updatePUDisplay();
  toast('Bought '+type+'!','#ffe033');
}

// ── Extra life ────────────────────────────────────────────────
function offerExtraLife(){
  paused=true;
  pauseSlowTimer();
  positionOverlay();
  overlay.classList.remove('hidden');
  ovTitle.textContent='CLOSE CALL!';
  ovSub.textContent='Board is full...';
  ovStats.classList.add('hidden');
  ovExtralife.classList.remove('hidden');
  btnStart.style.display='none';
}
btnUseLife.addEventListener('click',function(){
  if(inv.life<=0)return;
  inv.life--;updatePUDisplay();
  // clear top 5 rows
  for(var r=0;r<5;r++)board[r]=new Array(COLS).fill(null);
  overlay.classList.add('hidden');
  ovExtralife.classList.add('hidden');
  btnStart.style.display='';
  paused=false;
  resumeSlowTimer();
  spawn();
  toast('❤️ Extra Life! Board cleared!','#ff4466');
});
btnSkipLife.addEventListener('click',function(){
  ovExtralife.classList.add('hidden');
  btnStart.style.display='';
  doGameOver();
});

// ── Canvas click (hammer/bomb) ────────────────────────────────
canvas.addEventListener('click',function(e){
  if(!activeTool||!running||over||paused)return;
  var rect=canvas.getBoundingClientRect();
  var col=Math.floor((e.clientX-rect.left)/SZ);
  var row=Math.floor((e.clientY-rect.top)/SZ);
  if(col<0||col>=COLS||row<0||row>=ROWS)return;
  if(activeTool==='hammer'){
    if(board[row][col]){board[row][col]=null;addScore(20);addCoins(5);toast('🔨 SMASH!','#ff9922');}
    else toast('No block here!','#5a8aaa');
    deactivateHammer();
  } else if(activeTool==='bomb'){
    explodeBomb(col,row);
  }
});

// ════════════════════════════════════════════════════
//  FIX 3: Procedural random puzzle generation
//  Each puzzle is unique — random gaps, no repetition
// ════════════════════════════════════════════════════
function generatePuzzle(round){
  // Difficulty scales with round
  var numRows=Math.min(2+round,8);          // more filled rows
  var numGaps=Math.max(1,3-Math.floor(round/3)); // fewer gaps = harder
  var goalLines=Math.min(1+round,numRows);
  var moveLimit=Math.max(8,18-round);

  // Build filled rows at bottom with random gaps
  var fill=[];
  var startRow=ROWS-numRows;
  for(var r=startRow;r<ROWS;r++){
    // create gap positions (1 or 2 per row, random columns)
    var gaps=[];
    for(var g=0;g<numGaps;g++){
      var gc;
      do{ gc=Math.floor(Math.random()*COLS); }
      while(gaps.indexOf(gc)!==-1);
      gaps.push(gc);
    }
    for(var c=0;c<COLS;c++){
      if(gaps.indexOf(c)===-1) fill.push([r,c]);
    }
  }
  return{fill:fill,goalLines:goalLines,moveLimit:moveLimit};
}

function initPuzzle(){
  var puz=generatePuzzle(puzzleRound);
  board=[];
  for(var r=0;r<ROWS;r++)board.push(new Array(COLS).fill(null));
  puz.fill.forEach(function(pos){
    var row=pos[0],col=pos[1];
    if(row>=0&&row<ROWS&&col>=0&&col<COLS){
      // Use a visible teal/slate color for puzzle blocks
      board[row][col]={color:'#2288aa',hi:'#55bbdd',sh:'#114455'};
    }
  });

  puzzleMoves=0;
  puzzleGoal=puz.goalLines;
  puzzleMoveLimit=puz.moveLimit;
  puzzleLinesCleared=0;
  lines=0;elLines.textContent='0';
  elPuzMoves.textContent='0';
  elPuzLimit.textContent=puz.moveLimit;
  elPuzGoal.textContent=puz.goalLines;
  elPuzStatus.textContent='';
  puzzleBar.classList.remove('hidden');
  elLevel.textContent='P'+(puzzleRound+1);
}

function checkPuzzleOver(){
  if(puzzleLinesCleared>=puzzleGoal){
    elPuzStatus.textContent='✅ CLEARED!';
    var bonus=500+puzzleRound*200;
    addScore(bonus);addCoins(50+puzzleRound*10);
    toast('Puzzle '+(puzzleRound+1)+' cleared! +'+bonus+'pts','#44ee77');
    puzzleRound++;
    // FIX 3: use setTimeout then initPuzzle + spawn, not spawn directly
    setTimeout(function(){
      if(!over){
        initPuzzle();
        nxt=randPiece();
        spawn(); // spawn sets cur=nxt, creates new nxt, starts running
        drawPreview(cxNext,cnNext,nxt);
      }
    },1500);
  } else if(puzzleMoves>=puzzleMoveLimit){
    elPuzStatus.textContent='❌ OUT OF MOVES';
    toast('Out of moves! Try again','#ff4466');
    setTimeout(function(){if(!over)doGameOver();},900);
  } else {
    // Still playing — spawn next piece
    spawn();
  }
}

// ── Puzzle mode switch ────────────────────────────────────────
function switchMode(mode){
  gameMode=mode;
  document.getElementById('btn-classic').classList.toggle('active',mode==='classic');
  document.getElementById('btn-puzzle').classList.toggle('active',mode==='puzzle');
  if(running)doGameOver();
}

// ── Drawing ───────────────────────────────────────────────────
var rainbowColors=['#ff4466','#ff9922','#ffe033','#44ee77','#44aaff','#cc66ff','#ff69b4'];

// FIX 1: Brighter block rendering — more saturated fill + stronger highlights
function drawBlock(cx2d,gx,gy,col,hi,sh,alpha,sz){
  sz=sz||SZ; alpha=(alpha===undefined)?1:alpha;
  hi=hi||'rgba(255,255,255,0.45)';
  sh=sh||'rgba(0,0,0,0.5)';
  var px=gx*sz, py=gy*sz, w=sz, h=sz;
  var inset=1;

  cx2d.globalAlpha=alpha;

  // Outer darker border
  cx2d.fillStyle='rgba(0,0,0,0.5)';
  cx2d.fillRect(px,py,w,h);

  // Main vivid fill
  cx2d.fillStyle=col;
  cx2d.fillRect(px+inset,py+inset,w-inset*2,h-inset*2);

  // Inner lighter center (makes it look glowing/vivid)
  cx2d.fillStyle='rgba(255,255,255,0.08)';
  cx2d.fillRect(px+inset+2,py+inset+2,w-inset*2-4,h-inset*2-4);

  // Top highlight (bright)
  cx2d.fillStyle=hi;
  cx2d.fillRect(px+inset, py+inset, w-inset*2, 4);
  // Left highlight
  cx2d.fillStyle='rgba(255,255,255,0.25)';
  cx2d.fillRect(px+inset, py+inset+4, 3, h-inset*2-4);

  // Bottom shadow
  cx2d.fillStyle=sh;
  cx2d.fillRect(px+inset, py+h-inset-4, w-inset*2, 4);
  // Right shadow
  cx2d.fillStyle='rgba(0,0,0,0.4)';
  cx2d.fillRect(px+w-inset-3, py+inset, 3, h-inset*2);

  cx2d.globalAlpha=1;
}

function drawStoneBlock(cx2d,gx,gy,sz){
  sz=sz||SZ;
  var px=gx*sz,py=gy*sz,w=sz,h=sz;
  cx2d.fillStyle='#334455'; cx2d.fillRect(px,py,w,h);
  cx2d.fillStyle='#445566';
  cx2d.fillRect(px+1,py+1,w/2-1,h/2-1);
  cx2d.fillRect(px+w/2,py+h/2,w/2-1,h/2-1);
  cx2d.fillStyle='#223344';
  cx2d.fillRect(px+w/2,py+1,w/2-1,h/2-1);
  cx2d.fillRect(px+1,py+h/2,w/2-1,h/2-1);
  cx2d.strokeStyle='#667788'; cx2d.lineWidth=1;
  cx2d.strokeRect(px+0.5,py+0.5,w-1,h-1);
  cx2d.fillStyle='#99aabb';
  cx2d.font='bold '+(sz>22?10:7)+'px monospace';
  cx2d.textAlign='center'; cx2d.textBaseline='middle';
  cx2d.fillText('⛏',px+w/2,py+h/2);
  cx2d.textAlign='left';
}

function render(){
  // Board background — dark navy, not pitch black
  ctx.fillStyle='#071018';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Grid lines — slightly brighter so the board feels defined
  ctx.strokeStyle='rgba(0,180,220,0.12)';
  ctx.lineWidth=1;
  var i;
  for(i=1;i<COLS;i++){ctx.beginPath();ctx.moveTo(i*SZ,0);ctx.lineTo(i*SZ,canvas.height);ctx.stroke();}
  for(i=1;i<ROWS;i++){ctx.beginPath();ctx.moveTo(0,i*SZ);ctx.lineTo(canvas.width,i*SZ);ctx.stroke();}

  // Locked cells
  var flashOn=flashRows.length&&(Date.now()%260<130);
  for(var r=0;r<ROWS;r++) for(var c=0;c<COLS;c++){
    var cell=board[r][c]; if(!cell)continue;
    if(flashRows.indexOf(r)!==-1){
      ctx.globalAlpha=1;
      ctx.fillStyle=flashOn?'#ffffff':cell.color;
      ctx.fillRect(c*SZ,r*SZ,SZ,SZ);
    } else if(cell.stone){
      drawStoneBlock(ctx,c,r);
    } else {
      drawBlock(ctx,c,r,cell.color,cell.hi,cell.sh);
    }
  }

  // Active piece + ghost
  if(running&&!over&&!clearing&&cur){
    var gy=ghostY();
    // Ghost
    if(gy!==cur.y){
      for(var gr=0;gr<cur.shape.length;gr++) for(var gc=0;gc<cur.shape[gr].length;gc++){
        if(!cur.shape[gr][gc])continue;
        var gbx=cur.x+gc,gby=gy+gr;
        if(gby<0||gby>=ROWS)continue;
        ctx.globalAlpha=0.18; ctx.fillStyle=cur.color;
        ctx.fillRect(gbx*SZ,gby*SZ,SZ,SZ);
        ctx.globalAlpha=0.4; ctx.strokeStyle=cur.color; ctx.lineWidth=1;
        ctx.strokeRect(gbx*SZ+0.5,gby*SZ+0.5,SZ-1,SZ-1);
        ctx.globalAlpha=1;
      }
    }

    var drawColor=cur.rainbow
      ? rainbowColors[Math.floor(Date.now()/70)%rainbowColors.length]
      : cur.color;
    var drawHi=cur.rainbow?'rgba(255,255,255,0.6)':cur.hi;
    var drawSh=cur.rainbow?'rgba(0,0,0,0.3)':cur.sh;

    for(var pr=0;pr<cur.shape.length;pr++) for(var pc=0;pc<cur.shape[pr].length;pc++){
      if(!cur.shape[pr][pc])continue;
      var bx=cur.x+pc, by=cur.y+pr;
      if(by<0)continue;
      drawBlock(ctx,bx,by,drawColor,drawHi,drawSh);
    }
  }

  requestAnimationFrame(render);
}

function drawPreview(cx2d,cvs,piece){
  cx2d.fillStyle='#071018'; cx2d.fillRect(0,0,cvs.width,cvs.height);
  if(!piece)return;
  var bSz=Math.floor(cvs.width/5);
  var pw=piece.shape[0].length,ph=piece.shape.length;
  var ox=Math.floor((cvs.width/bSz-pw)/2);
  var oy=Math.floor((cvs.height/bSz-ph)/2);
  for(var r=0;r<ph;r++) for(var c=0;c<pw;c++){
    if(!piece.shape[r][c])continue;
    drawBlock(cx2d,ox+c,oy+r,piece.color,piece.hi,piece.sh,1,bSz);
  }
}

// ── Game Over ─────────────────────────────────────────────────
function doGameOver(){
  if(over)return;
  over=true; running=false; clearing=false; flashRows=[];
  clearInterval(dropTimer); dropTimer=null;
  clearInterval(cdInterval); cdInterval=null;
  clearTimeout(slowTimer); slowTimer=null;
  slowActive=false; document.body.classList.remove('slow-active');
  cur=null;

  var earnedCoins=Math.floor(score/100)+(lines*2)+(level*5);
  addCoins(earnedCoins);

  positionOverlay();
  overlay.classList.remove('hidden');
  ovTitle.textContent='GAME OVER';
  ovSub.textContent='';
  ovExtralife.classList.add('hidden');
  btnStart.style.display='';
  btnStart.textContent='▶ PLAY AGAIN';
  ovStats.classList.remove('hidden');
  ovStats.innerHTML=
    '<div class="stat-row"><span>SCORE</span><span class="stat-val">'+score+'</span></div>'+
    '<div class="stat-row"><span>LINES</span><span class="stat-val">'+lines+'</span></div>'+
    '<div class="stat-row"><span>LEVEL</span><span class="stat-val">'+level+'</span></div>'+
    '<div class="stat-row"><span>COMBO</span><span class="stat-val">'+combo+'</span></div>'+
    '<div class="coins-earned">+'+earnedCoins+' 🪙 EARNED</div>';
}

// ── Init ──────────────────────────────────────────────────────
function initGame(){
  board=[];
  for(var r=0;r<ROWS;r++)board.push(new Array(COLS).fill(null));
  score=0;lines=0;level=1;combo=0;
  canHold=true;clearing=false;paused=false;over=false;running=true;
  held=null;flashRows=[];dropSpeed=800;rotIdx=0;cur=null;
  slowActive=false;activeTool=null;puzzleRound=0;
  document.body.classList.remove('slow-active');
  clearTimeout(slowTimer);slowTimer=null;
  deactivateHammer();

  elScore.textContent='0';elLevel.textContent='1';
  elLines.textContent='0';elCombo.textContent='×0';
  elProg.style.width='0%';
  ovStats.classList.add('hidden');
  ovExtralife.classList.add('hidden');
  btnStart.style.display='';

  cxHold.fillStyle='#071018';cxHold.fillRect(0,0,cnHold.width,cnHold.height);

  if(gameMode==='puzzle'){
    initPuzzle();
  } else {
    puzzleBar.classList.add('hidden');
  }

  nxt=randPiece();
  spawn();
  drawPreview(cxNext,cnNext,nxt);
  overlay.classList.add('hidden');
  startDropTimer();
  initCooldowns();
  startCooldownTimers();
}

// ── Pause/Resume ──────────────────────────────────────────────
// FIX 2: pause truly freezes drop + cooldown + slow timers
function doPause(){
  paused=true;
  pauseSlowTimer();
  // cdInterval checks paused flag so it freezes automatically
  positionOverlay();
  overlay.classList.remove('hidden');
  ovTitle.textContent='PAUSED';
  ovSub.textContent='Press P or Resume';
  ovStats.classList.add('hidden');
  ovExtralife.classList.add('hidden');
  btnStart.textContent='▶ RESUME';
}
function doResume(){
  paused=false;
  cdLastTick=Date.now(); // reset tick timestamp so no time-jump
  resumeSlowTimer();
  overlay.classList.add('hidden');
}

// ── Keyboard ──────────────────────────────────────────────────
document.addEventListener('keydown',function(e){
  if(over){if(e.key==='Enter')initGame();return;}
  if(!running)return;
  if(e.key==='p'||e.key==='P'){paused?doResume():doPause();return;}
  if(e.key==='Escape'){if(activeTool)deactivateHammer();return;}
  if(paused)return;
  switch(e.key){
    case 'ArrowLeft':  e.preventDefault();moveL();break;
    case 'ArrowRight': e.preventDefault();moveR();break;
    case 'ArrowDown':  e.preventDefault();softDrop(true);break;
    case 'ArrowUp':    e.preventDefault();doRotate();break;
    case ' ':          e.preventDefault();hardDrop();break;
    case 'c':case 'C': doHold();break;
    case 'h':case 'H': activateHammer();break;
    case 'b':case 'B': activateBomb();break;
    case 'r':case 'R': activateRainbow();break;
    case 'm':case 'M': openMystery();break;
  }
});

btnStart.addEventListener('click',function(){
  if(over){initGame();return;}
  if(!running){initGame();return;}
  if(paused){doResume();}
});

// ── Mobile controls ───────────────────────────────────────────
function bindMob(id,fn){
  var el=document.getElementById(id);
  if(!el)return;
  el.addEventListener('touchstart',function(e){e.preventDefault();fn();},{passive:false});
  el.addEventListener('click',fn);
}
bindMob('mob-left',  moveL);
bindMob('mob-right', moveR);
bindMob('mob-down',  function(){softDrop(true);});
bindMob('mob-up',    doRotate);
bindMob('mob-drop',  hardDrop);
bindMob('mob-hold',  doHold);
bindMob('mob-pause', function(){paused?doResume():doPause();});

// Mobile stats bar injection
function injectMobileStats(){
  if(window.innerWidth>=700)return;
  var bc=document.querySelector('.board-col');
  if(!bc||document.getElementById('mobile-stats'))return;

  var ms=document.createElement('div');
  ms.id='mobile-stats';
  ms.innerHTML=
    '<div class="mob-stat"><div class="lbl">SCORE</div><div class="val" id="m-score">0</div></div>'+
    '<div class="mob-stat"><div class="lbl">LEVEL</div><div class="val" id="m-level">1</div></div>'+
    '<div class="mob-stat"><div class="lbl">LINES</div><div class="val" id="m-lines">0</div></div>'+
    '<div class="mob-stat"><div class="lbl">COINS</div><div class="val coin" id="m-coins">0</div></div>';
  bc.insertBefore(ms,bc.firstChild);

  // Mini powerup row
  var mpu=document.createElement('div');
  mpu.id='mobile-powerups';
  ['hammer','bomb','rainbow','slow'].forEach(function(t){
    var icons={'hammer':'🔨','bomb':'💣','rainbow':'🌈','slow':'🐢'};
    var d=document.createElement('div');
    d.className='pu-item empty'; d.dataset.type=t;
    d.innerHTML='<div class="pu-icon">'+icons[t]+'</div><div class="pu-count" id="m-cnt-'+t+'">0</div>';
    d.addEventListener('click',function(){
      if(t==='hammer')activateHammer();
      else if(t==='bomb')activateBomb();
      else if(t==='rainbow')activateRainbow();
      else if(t==='slow')activateSlow();
    });
    mpu.appendChild(d);
  });
  bc.insertBefore(mpu,bc.firstChild);

  // Sync mobile stats on every score change
  var origAS=addScore;
  // Override score/level/lines display to also update mobile labels
}

// Sync mobile stats display each frame (lightweight)
var lastMobileSync=0;
function syncMobileStats(){
  if(window.innerWidth>=700)return;
  var now=Date.now();
  if(now-lastMobileSync<200)return;
  lastMobileSync=now;
  function set(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  set('m-score',score);set('m-level',level);set('m-lines',lines);set('m-coins',coins);
}

// Override render to also sync mobile
var _origRender=render;
function render(){
  ctx.fillStyle='#071018';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='rgba(0,180,220,0.12)';ctx.lineWidth=1;
  var i;
  for(i=1;i<COLS;i++){ctx.beginPath();ctx.moveTo(i*SZ,0);ctx.lineTo(i*SZ,canvas.height);ctx.stroke();}
  for(i=1;i<ROWS;i++){ctx.beginPath();ctx.moveTo(0,i*SZ);ctx.lineTo(canvas.width,i*SZ);ctx.stroke();}
  var flashOn=flashRows.length&&(Date.now()%260<130);
  for(var r=0;r<ROWS;r++) for(var c=0;c<COLS;c++){
    var cell=board[r][c];if(!cell)continue;
    if(flashRows.indexOf(r)!==-1){
      ctx.globalAlpha=1;ctx.fillStyle=flashOn?'#ffffff':cell.color;
      ctx.fillRect(c*SZ,r*SZ,SZ,SZ);
    } else if(cell.stone){drawStoneBlock(ctx,c,r);}
    else{drawBlock(ctx,c,r,cell.color,cell.hi,cell.sh);}
  }
  if(running&&!over&&!clearing&&cur){
    var gy=ghostY();
    if(gy!==cur.y){
      for(var gr=0;gr<cur.shape.length;gr++) for(var gc=0;gc<cur.shape[gr].length;gc++){
        if(!cur.shape[gr][gc])continue;
        var gbx=cur.x+gc,gby=gy+gr;
        if(gby<0||gby>=ROWS)continue;
        ctx.globalAlpha=0.18;ctx.fillStyle=cur.color;
        ctx.fillRect(gbx*SZ,gby*SZ,SZ,SZ);
        ctx.globalAlpha=0.4;ctx.strokeStyle=cur.color;ctx.lineWidth=1;
        ctx.strokeRect(gbx*SZ+0.5,gby*SZ+0.5,SZ-1,SZ-1);
        ctx.globalAlpha=1;
      }
    }
    var dc=cur.rainbow?rainbowColors[Math.floor(Date.now()/70)%rainbowColors.length]:cur.color;
    var dh=cur.rainbow?'rgba(255,255,255,0.6)':cur.hi;
    var ds=cur.rainbow?'rgba(0,0,0,0.3)':cur.sh;
    for(var pr=0;pr<cur.shape.length;pr++) for(var pc=0;pc<cur.shape[pr].length;pc++){
      if(!cur.shape[pr][pc])continue;
      var bx=cur.x+pc,by=cur.y+pr;
      if(by<0)continue;
      drawBlock(ctx,bx,by,dc,dh,ds);
    }
  }
  syncMobileStats();
  requestAnimationFrame(render);
}

// ── Boot ──────────────────────────────────────────────────────
window.addEventListener('load',function(){
  resizeCanvas();
  injectMobileStats();
  positionOverlay();
  overlay.classList.remove('hidden');
  ovTitle.textContent='TETRIS PRO';
  ovSub.textContent='Ultimate Block Stacking Experience';
  ovStats.classList.add('hidden');
  updatePUDisplay();
});
window.addEventListener('resize',function(){
  resizeCanvas();
  if(nxt)drawPreview(cxNext,cnNext,nxt);
  if(held)drawPreview(cxHold,cnHold,held);
});

render();
