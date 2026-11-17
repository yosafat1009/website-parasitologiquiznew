(function(){
'use strict';
var DATA=window.SPECIES||[];
var CATS=[];DATA.forEach(function(s){if(CATS.indexOf(s.cat)<0)CATS.push(s.cat)});
var $view=document.getElementById('view');
var KEY='parasit-settings-v1';
var S={mode:'quiz',cats:CATS.slice(),time:15,count:10,cardTime:0};
try{var sv=JSON.parse(localStorage.getItem(KEY)||'null');if(sv){S.time=sv.time;S.count=sv.count;S.cardTime=sv.cardTime||0;if(sv.cats&&sv.cats.length)S.cats=sv.cats.filter(function(c){return CATS.indexOf(c)>-1});if(!S.cats.length)S.cats=CATS.slice();}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify({time:S.time,count:S.count,cardTime:S.cardTime,cats:S.cats}))}catch(e){}}
var run=null,timer=null;

function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pool(){return DATA.filter(function(s){return S.cats.indexOf(s.cat)>-1})}
function stopTimer(){if(timer){clearInterval(timer);timer=null}}
function imgTag(sp,i,cls){var im=sp.imgs[i];return '<img src="'+im[0]+'" alt="Preparat mikroskop" draggable="false" class="'+(im[1]==='s'?'sq':'')+' '+(cls||'')+'">'}
function timeLabel(t){return t?t+' detik':'Tanpa waktu'}

/* ---------- shared setup bits ---------- */
function chipsHtml(){
  return '<div class="chips">'+CATS.map(function(c){
    var n=DATA.filter(function(s){return s.cat===c}).length;
    return '<button class="chip" data-cat="'+esc(c)+'" aria-pressed="'+(S.cats.indexOf(c)>-1)+'">'+esc(c)+' · '+n+'</button>';
  }).join('')+'</div><div class="actions" style="margin-top:10px"><button class="chip small" data-allcats="1" aria-pressed="false">Pilih semua</button><button class="chip small" data-nocats="1" aria-pressed="false">Kosongkan</button></div>';
}
function segHtml(attr,vals,cur,fmt){
  return '<div class="seg">'+vals.map(function(v){return '<button data-'+attr+'="'+v+'" aria-pressed="'+(v===cur)+'">'+fmt(v)+'</button>'}).join('')+'</div>';
}

/* ---------- QUIZ ---------- */
function quizSetup(){
  stopTimer();run=null;
  var p=pool();
  $view.innerHTML='<section class="card"><h2>Kuis tebak parasit</h2><p class="lead">Lihat preparatnya, pilih nama parasit yang benar.</p>'
  +'<div class="group"><span class="lbl">Kelompok</span>'+chipsHtml()+'</div>'
  +'<div class="group"><span class="lbl">Waktu per gambar</span>'+segHtml('time',[0,10,15,20],S.time,function(v){return v?v+' dtk':'Tanpa waktu'})+'</div>'
  +'<div class="group"><span class="lbl">Jumlah soal</span>'+segHtml('count',[10,20,0],S.count,function(v){return v?v:'Semua'})+'</div>'
  +'<p class="meta">'+p.length+' parasit tersedia dari kelompok terpilih.</p>'
  +'<div class="actions"><button class="btn" id="start"'+(p.length<2?' disabled':'')+'>Mulai kuis</button></div></section>';
}
function makeQuestions(list){
  var qs=shuffle(list);
  if(S.count&&qs.length>S.count)qs=qs.slice(0,S.count);
  return qs.map(function(sp){
    var same=shuffle(DATA.filter(function(d){return d.id!==sp.id&&d.cat===sp.cat}));
    var other=shuffle(DATA.filter(function(d){return d.id!==sp.id&&d.cat!==sp.cat}));
    var opts=same.slice(0,3);
    if(opts.length<3)opts=opts.concat(other.slice(0,3-opts.length));
    opts=shuffle(opts.concat([sp]));
    return {sp:sp,img:Math.floor(Math.random()*sp.imgs.length),opts:opts};
  });
}
function startQuiz(list){
  run={type:'quiz',qs:makeQuestions(list),i:0,score:0,wrong:[],done:false};
  showQ();
}
function showQ(){
  stopTimer();
  var q=run.qs[run.i];run.done=false;run.left=S.time;
  var multi=q.sp.imgs.length>1;
  $view.innerHTML='<section class="card">'
  +'<div class="qhead"><span>Soal '+(run.i+1)+' dari '+run.qs.length+'</span><span>Skor '+run.score+'</span>'+(S.time?'<b class="t" id="tl">'+S.time+'</b>':'')+'</div>'
  +'<div class="bar"><i style="width:'+(run.i/run.qs.length*100)+'%"></i></div>'
  +(S.time?'<div class="bar time" style="margin-top:6px"><i id="tb" style="width:100%"></i></div>':'')
  +'<div class="stage two"><div><div class="scope" id="scope">'+imgTag(q.sp,q.img)+'</div>'
  +(multi?'<div class="thumbs big" id="thumbs" style="margin-top:8px">'+q.sp.imgs.map(function(_,k){return '<button data-ph="'+k+'" aria-label="Foto '+(k+1)+'" aria-current="'+(k===q.img)+'"></button>'}).join('')+'</div>':'')
  +'</div><div><div class="opts" id="opts">'
  +q.opts.map(function(o,k){return '<button class="opt" data-opt="'+o.id+'"><span class="k">'+(k+1)+'</span><span>'+esc(o.name)+'</span></button>'}).join('')
  +'</div><div id="fb"></div></div></div></section>';
  if(S.time){
    var t0=Date.now();
    timer=setInterval(function(){
      var el=(Date.now()-t0)/1000,left=Math.max(0,S.time-el);
      var tb=document.getElementById('tb'),tl=document.getElementById('tl');
      if(tb)tb.style.width=(left/S.time*100)+'%';
      if(tl)tl.textContent=Math.ceil(left);
      if(left<=0){stopTimer();answer(null)}
    },100);
  }
}
function answer(id){
  if(!run||run.done)return;
  run.done=true;stopTimer();
  var q=run.qs[run.i],ok=id===q.sp.id;
  if(ok)run.score++;else run.wrong.push(q);
  document.querySelectorAll('#opts .opt').forEach(function(b){
    b.disabled=true;var o=b.getAttribute('data-opt');
    if(o===q.sp.id)b.classList.add('ok');else if(o===id)b.classList.add('bad');
  });
  var last=run.i===run.qs.length-1;
  document.getElementById('fb').innerHTML='<div class="reveal"><div class="v '+(ok?'ok':'bad')+'">'+(ok?'Benar!':(id===null?'Waktu habis. Jawaban: ':'Kurang tepat. Jawaban: '))+(ok?'':'<i>'+esc(q.sp.name)+'</i>')+'</div>'
  +'<span class="tag">'+esc(q.sp.cat)+'</span><ul class="feat">'+q.sp.feat.map(function(f){return '<li>'+esc(f)+'</li>'}).join('')+'</ul></div>'
  +'<div class="actions"><button class="btn" id="next">'+(last?'Lihat hasil':'Soal berikutnya')+'</button></div>';
  var n=document.getElementById('next');if(n)n.focus({preventScroll:true});
}
function nextQ(){
  if(!run.done)return;
  if(run.i>=run.qs.length-1)return quizResult();
  run.i++;showQ();window.scrollTo({top:0});
}
function quizResult(){
  stopTimer();
  var n=run.qs.length,pct=Math.round(run.score/n*100);
  var msg=pct>=80?'Mantap, hampir semua tepat.':pct>=50?'Lumayan, terus diulang.':'Ayo ulangi, pasti makin hafal.';
  $view.innerHTML='<section class="card"><h2>Hasil kuis</h2><p class="lead">'+msg+'</p>'
  +'<div class="score">'+run.score+'<small> / '+n+' · '+pct+'%</small></div>'
  +(run.wrong.length?'<div class="wrong">'+run.wrong.map(function(q){return '<div class="row">'+imgTag(q.sp,q.img)+'<div><b>'+esc(q.sp.name)+'</b><small>'+esc(q.sp.feat[0])+'</small></div></div>'}).join('')+'</div>':'')
  +'<div class="actions">'+(run.wrong.length?'<button class="btn" id="retryw">Ulangi yang salah</button>':'')+'<button class="btn ghost" id="again">Kuis baru</button></div></section>';
}

/* ---------- FLASHCARDS ---------- */
function cardSetup(){
  stopTimer();run=null;
  var p=pool();
  $view.innerHTML='<section class="card"><h2>Kartu belajar</h2><p class="lead">Lihat gambar, tebak namanya, lalu balik kartu untuk melihat ciri-cirinya.</p>'
  +'<div class="group"><span class="lbl">Kelompok</span>'+chipsHtml()+'</div>'
  +'<div class="group"><span class="lbl">Balik otomatis setelah</span>'+segHtml('ctime',[0,10,15,20],S.cardTime,function(v){return v?v+' dtk':'Tanpa waktu'})+'</div>'
  +'<p class="meta">'+p.length+' kartu tersedia. Tanpa waktu: balik kartu dengan ketuk atau tombol Spasi.</p>'
  +'<div class="actions"><button class="btn" id="startc"'+(p.length<1?' disabled':'')+'>Mulai belajar</button></div></section>';
}
function startCards(list){
  run={type:'cards',deck:shuffle(list),i:0,flip:false,ph:0,known:0,again:[],hist:[]};
  showCard();
}
function showCard(){
  stopTimer();
  if(run.i>=run.deck.length)return cardEnd();
  var sp=run.deck[run.i];run.flip=false;run.ph=0;
  var multi=sp.imgs.length>1;
  $view.innerHTML='<section>'
  +'<div class="qhead"><span>Kartu '+(run.i+1)+' dari '+run.deck.length+'</span><span>Hafal '+run.known+'</span>'+(S.cardTime?'<b class="t" id="tl">'+S.cardTime+'</b>':'')+'</div>'
  +'<div class="bar"><i style="width:'+(run.i/run.deck.length*100)+'%"></i></div>'
  +(S.cardTime?'<div class="bar time" style="margin-top:6px"><i id="tb" style="width:100%"></i></div>':'')
  +'<div class="flip"><div class="fc" id="fc" tabindex="0" role="button" aria-label="Balik kartu">'
  +'<div class="face front"><div class="scope" id="scope">'+imgTag(sp,0)+'</div>'
  +(multi?'<div class="thumbs big" id="thumbs">'+sp.imgs.map(function(_,k){return '<button data-ph="'+k+'" aria-label="Foto '+(k+1)+'" aria-current="'+(k===0)+'"></button>'}).join('')+'</div>':'')
  +'<span class="hint">Ketuk kartu untuk melihat jawaban</span></div>'
  +'<div class="face back"><span class="tag">'+esc(sp.cat)+'</span><h3>'+esc(sp.name)+'</h3><ul class="feat">'+sp.feat.map(function(f){return '<li>'+esc(f)+'</li>'}).join('')+'</ul></div>'
  +'</div></div>'
  +'<div class="rate" id="rate" style="visibility:hidden"><button class="btn no" id="no">Belum hafal</button><button class="btn yes" id="yes">Hafal</button></div>'
  +'<div class="navrow"><button class="btn ghost" id="prevc"'+(run.i===0?' disabled':'')+'>Sebelumnya</button><button class="btn ghost" id="skipc">Lewati</button></div></section>';
  if(S.cardTime){
    var t0=Date.now();
    timer=setInterval(function(){
      var left=Math.max(0,S.cardTime-(Date.now()-t0)/1000);
      var tb=document.getElementById('tb'),tl=document.getElementById('tl');
      if(tb)tb.style.width=(left/S.cardTime*100)+'%';
      if(tl)tl.textContent=Math.ceil(left);
      if(left<=0){stopTimer();setFlip(true)}
    },100);
  }
}
function setFlip(v){
  if(!run||run.type!=='cards')return;
  run.flip=v;
  var fc=document.getElementById('fc'),rate=document.getElementById('rate');
  if(!fc)return;
  fc.classList.toggle('on',v);
  rate.style.visibility=v?'visible':'hidden';
  if(v){stopTimer();var tl=document.getElementById('tl');if(tl)tl.textContent='';var tb=document.getElementById('tb');if(tb)tb.style.width='0'}
}
function rate(known){
  var sp=run.deck[run.i];
  if(known)run.known++;else run.again.push(sp);
  run.hist.push(known);
  run.i++;showCard();window.scrollTo({top:0});
}
function cardEnd(){
  stopTimer();
  var n=run.deck.length;
  $view.innerHTML='<section class="card"><h2>Selesai!</h2><p class="lead">Kamu sudah melewati semua kartu.</p>'
  +'<div class="score">'+run.known+'<small> / '+n+' hafal</small></div>'
  +'<div class="actions">'+(run.again.length?'<button class="btn" id="redo">Ulangi '+run.again.length+' yang belum hafal</button>':'')+'<button class="btn ghost" id="again">Sesi baru</button></div></section>';
}

/* ---------- routing & events ---------- */
function home(){S.mode==='quiz'?quizSetup():cardSetup()}
document.querySelectorAll('.tabs button').forEach(function(b){
  b.addEventListener('click',function(){
    S.mode=b.getAttribute('data-mode');
    document.querySelectorAll('.tabs button').forEach(function(x){x.setAttribute('aria-selected',x===b)});
    home();
  });
});
$view.addEventListener('click',function(e){
  var t=e.target.closest('button,#fc');if(!t)return;
  if(t.hasAttribute('data-cat')){
    var c=t.getAttribute('data-cat'),i=S.cats.indexOf(c);
    if(i>-1)S.cats.splice(i,1);else S.cats.push(c);
    save();return home();
  }
  if(t.hasAttribute('data-allcats')){S.cats=CATS.slice();save();return home()}
  if(t.hasAttribute('data-nocats')){S.cats=[];save();return home()}
  if(t.hasAttribute('data-time')){S.time=+t.getAttribute('data-time');save();return home()}
  if(t.hasAttribute('data-count')){S.count=+t.getAttribute('data-count');save();return home()}
  if(t.hasAttribute('data-ctime')){S.cardTime=+t.getAttribute('data-ctime');save();return home()}
  if(t.hasAttribute('data-opt'))return answer(t.getAttribute('data-opt'));
  if(t.hasAttribute('data-ph')){
    var k=+t.getAttribute('data-ph'),sp=run.type==='quiz'?run.qs[run.i].sp:run.deck[run.i];
    var sc=document.getElementById('scope');sc.innerHTML=imgTag(sp,k);
    document.querySelectorAll('#thumbs button').forEach(function(b){b.setAttribute('aria-current',b===t)});
    e.stopPropagation();return;
  }
  switch(t.id){
    case 'start':return startQuiz(pool());
    case 'startc':return startCards(pool());
    case 'next':return nextQ();
    case 'retryw':var w=run.wrong.map(function(q){return q.sp});return startQuiz(w);
    case 'again':return home();
    case 'fc':return setFlip(!run.flip);
    case 'yes':return rate(true);
    case 'no':return rate(false);
    case 'skipc':return rate(false);
    case 'prevc':if(run.i>0){var wk=run.hist.pop();run.i--;if(wk)run.known--;else run.again.pop();showCard()}return;
    case 'redo':var r=run.again;return startCards(r);
  }
});
document.addEventListener('keydown',function(e){
  if(!run)return;
  if(run.type==='quiz'){
    if(!run.done&&e.key>='1'&&e.key<='4'){var q=run.qs[run.i],o=q.opts[+e.key-1];if(o)answer(o.id)}
    else if(run.done&&(e.key==='Enter'||e.key===' ')){e.preventDefault();nextQ()}
  }else if(run.type==='cards'&&run.i<run.deck.length){
    if(e.key===' '||e.key==='Enter'){if(document.activeElement&&document.activeElement.tagName==='BUTTON')return;e.preventDefault();setFlip(!run.flip)}
    else if(e.key==='ArrowRight'&&run.flip)rate(true);
    else if(e.key==='ArrowLeft'&&run.flip)rate(false);
  }
});
document.getElementById('view').addEventListener('keydown',function(e){});
home();
})();
