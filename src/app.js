(function(){
'use strict';
var ENG=[{id:'pg',name:'Aurora PG',full:'Aurora PostgreSQL'},{id:'ms',name:'SQL Server',full:'SQL Server'},{id:'mg',name:'MongoDB',full:'MongoDB (mongosh)'},{id:'ml',name:'MarkLogic',full:'MarkLogic'}];
var CATS=[{id:'sessions',name:'Sessions & locks'},{id:'perf',name:'Performance'},{id:'tempdb',name:'🗄️ tempdb (SQL Server)'},{id:'backup',name:'Backup & restore'},{id:'users',name:'Users & permissions'},{id:'storage',name:'Storage & size'},{id:'repl',name:'Replication & HA'},{id:'pglogical',name:'🔁 pglogical (Aurora PG)'},{id:'index',name:'Indexes'},{id:'maint',name:'Maintenance'},{id:'config',name:'Config & server info'}];
CATS.push({id:'linux',name:'🐧 Linux (AL & RHEL)'});var LX={id:'lx',name:'Linux',full:'Linux · Amazon Linux 2 / AL2023 / RHEL 8-9'};
var CATNAME={};CATS.forEach(function(c){CATNAME[c.id]=c.name});
var LANG={pg:'SQL',ms:'T-SQL',mg:'mongosh',ml:'XQuery'};
var SYN=[
 ['kill','terminate','end','disconnect','abort','stop'],
 ['cancel','abort','interrupt','stop'],
 ['session','sessions','connection','connections','process','processes','spid','pid','client','clients','backend'],
 ['blocking','blocked','blocker','block','blocks','lock','locks','locking','wait','waiting','contention','stuck','hung'],
 ['replication','replica','replicas','standby','secondary','secondaries','ag','availability','mirror','hadr','reader','readers'],
 ['lag','delay','behind','latency'],
 ['size','sizes','space','disk','storage','bytes','big','large','largest','biggest','usage'],
 ['table','tables','collection','collections','relation'],
 ['long','longest','slow','slowest','expensive','heavy','top'],
 ['running','active','current','now','executing'],
 ['query','queries','statement','statements','sql','request','requests','op','ops','operation','operations'],
 ['backup','backups','dump','snapshot','export'],
 ['restore','recover','recovery','import'],
 ['user','users','login','logins','role','roles','account','principal'],
 ['permission','permissions','privilege','privileges','grant','grants','access','rights'],
 ['index','indexes','indices','idx'],
 ['stats','statistics','analyze','counters'],
 ['config','configuration','setting','settings','parameter','parameters','param','option'],
 ['version','build','release','edition'],
 ['failover','switchover','stepdown','promote'],
 ['primary','writer','master','leader'],
 ['vacuum','bloat','dead','cleanup'],
 ['log','logs','errorlog','wal','journal','oplog'],
 ['count','counts','rows','number','how many'],
 ['transaction','transactions','txn','xact','tran'],
 ['memory','ram','cache','buffer'],
 ['free','left','available','remaining','full'],
 ['drop','delete','remove'],
 ['create','add','new','make'],
 ['password','pwd','passwd'],
 ['plan','explain','showplan'],
 ['health','status','state','check']
];
var SYNMAP={};SYN.forEach(function(g){g.forEach(function(w){(SYNMAP[w]=SYNMAP[w]||[]);g.forEach(function(x){if(SYNMAP[w].indexOf(x)<0)SYNMAP[w].push(x)})})});
var LS='dbcs.v1';
var st={stars:[],custom:[],notes:{},vals:{},theme:'auto',eng:['pg','ms','mg','ml']};
var ui={q:'',cat:'all',tab:{}};
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function load(){try{var d=JSON.parse(localStorage.getItem(LS)||'null');if(d&&typeof d==='object'){for(var k in st)if(d[k]!==undefined)st[k]=d[k]}}catch(e){}
 if(!Array.isArray(st.eng)||!st.eng.length)st.eng=['pg','ms','mg','ml']}
function save(){try{localStorage.setItem(LS,JSON.stringify(st))}catch(e){toast('Could not save (storage full or blocked)')}}
function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show')},1800)}
/* ---------- theme ---------- */
function applyTheme(){/* theme is owned by the shared bar (mg-shared.js, key mg-theme); st.theme mirrors it */
 if(window.MG){st.theme=MG.pref();return}
 var t=st.theme;if(t==='auto')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}
window.addEventListener('mg-theme',function(e){if(st.theme!==e.detail.pref){st.theme=e.detail.pref;save()}});
/* ---------- data ---------- */
function allTasks(){var c=st.custom.map(function(s){var o={id:s.id,cat:s.cat,t:s.t,k:s.k||'',custom:1,danger:s.d?1:0};o[s.eng]={c:s.c,n:s.n,d:s.d?1:0};return o});return TASKS.concat(c)}
function words(s){return String(s).toLowerCase().replace(/[^a-z0-9_$]+/g,' ').split(' ').filter(Boolean)}
var IDX={};
function indexTask(t){if(IDX[t.id]&&IDX[t.id].src===t)return IDX[t.id];var main=words(t.t+' '+t.k+' '+(CATNAME[t.cat]||''));var code='';ENG.concat([LX]).forEach(function(e){var x=t[e.id];if(x)code+=' '+(x.c||x.na||'')+' '+(x.n||'')});
 return IDX[t.id]={src:t,main:main,code:code.toLowerCase(),title:t.t.toLowerCase()}}
function lev1(a,b){if(Math.abs(a.length-b.length)>1)return false;var i=0,j=0,d=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++d>1)return false;
 if(a.length>b.length)i++;else if(b.length>a.length)j++;else{ if(a[i+1]===b[j]&&a[i]===b[j+1]){i+=2;j+=2;continue} i++;j++}}return d+(a.length-i)+(b.length-j)<=1}
function tokScore(tok,ix,deep){if(!SYNMAP[tok]&&tok.length>=5&&!deep){for(var sk in SYNMAP){if(sk.length>=5&&lev1(tok,sk)){tok=sk;break}}}var alts=SYNMAP[tok]||[tok];var best=0;
 for(var a=0;a<alts.length;a++){var w=alts[a],syn=w!==tok,s=0;
  for(var i=0;i<ix.main.length;i++){var m=ix.main[i];if(m===w)s=Math.max(s,3);else if(w.length>=3&&m.indexOf(w)===0)s=Math.max(s,2.2);else if(w.length>=4&&lev1(w,m))s=Math.max(s,1.6)}
  if(!s&&w.length>=3&&ix.code.indexOf(w)>=0)s=1;
  if(syn)s*=0.8;best=Math.max(best,s)}
 if(!best&&!deep&&tok.length>=5){for(var k in SYNMAP){if(lev1(tok,k)){var r=tokScore(k,ix,1);if(r)return r*0.7}}}
 return best}
function score(t,q){var ix=indexTask(t);var toks=words(q);if(!toks.length)return 1;var tot=0;
 for(var i=0;i<toks.length;i++){var s=tokScore(toks[i],ix);if(!s)return 0;tot+=s}
 if(ix.title.indexOf(q.toLowerCase().trim())>=0)tot+=4;return tot}
function hasEng(t){if(t.lx)return true;return st.eng.some(function(e){return t[e]&&!t[e].na})}
function visible(){var q=ui.q.trim(),cat=ui.cat,stars=st.stars;var res=[];
 allTasks().forEach(function(t,i){if(cat==='tri'&&!t.tri)return;if(cat==='star'&&stars.indexOf(t.id)<0)return;if(cat==='mine'&&!t.custom)return;
  if(CATNAME[cat]&&t.cat!==cat)return;if(!hasEng(t))return;var s=score(t,q);if(!s)return;res.push({t:t,s:s,i:i,star:stars.indexOf(t.id)>=0})});
 res.sort(function(a,b){if(a.star!==b.star)return a.star?-1:1;if(q&&b.s!==a.s)return b.s-a.s;var da=a.t.danger?1:0,db=b.t.danger?1:0;if(cat!=='tri'&&da!==db)return da-db;return a.i-b.i});
 return res.map(function(r){return r.t})}
/* ---------- render ---------- */
var PH=/\{([a-z][a-z0-9_]*)\}/g;
function phNames(code){var m,o=[];PH.lastIndex=0;while((m=PH.exec(code)))if(o.indexOf(m[1])<0)o.push(m[1]);return o}
function fill(code){return code.replace(PH,function(all,n){var v=st.vals[n];return v?v:all})}
function codeHtml(code){var out='',last=0,m;PH.lastIndex=0;while((m=PH.exec(code))){out+=esc(code.slice(last,m.index));var v=st.vals[m[1]];
 out+='<span class="p'+(v?' f':'')+'" data-ph="'+m[1]+'">'+esc(v||m[0])+'</span>';last=PH.lastIndex}return out+esc(code.slice(last))}
function chips(){var e=$('engChips');e.innerHTML='<button class="chip" data-eng="all" aria-pressed="'+(st.eng.length===4)+'">All engines</button>'+ENG.map(function(x){return '<button class="chip e" style="--ec:var(--'+x.id+')" data-eng="'+x.id+'" aria-pressed="'+(st.eng.indexOf(x.id)>=0&&st.eng.length<4)+'">'+x.name+'</button>'}).join('');
 var c=$('catChips');var list=[{id:'all',name:'All'},{id:'tri',name:'🚨 3 AM triage'},{id:'star',name:'★ Starred'}].concat(CATS).concat([{id:'mine',name:'✍️ My snippets'}]);
 c.innerHTML=list.map(function(x){return '<button class="chip" data-cat="'+x.id+'" aria-pressed="'+(ui.cat===x.id)+'">'+esc(x.name)+'</button>'}).join('')}
function panel(t,e,on){var x=t[e.id];var h='<div class="pn'+(on?' on':'')+'" style="--ec:var(--'+e.id+')" data-e="'+e.id+'"><div class="eh">'+e.full+'</div>';
 if(!x){return h+'<div class="na">—</div></div>'}
 if(x.na){return h+'<div class="na"><b>No direct equivalent.</b> '+esc(x.na)+'</div></div>'}
 var b='<span class="b">'+(x.l==='shell'?'shell':x.l==='curl'?'curl · REST :8002':LANG[e.id])+'</span>';if(x.d)b+='<span class="b dz">⚠ Destructive</span>';if(x.v)b+='<span class="b v">'+esc(x.v)+'</span>';
 h+='<div class="badges">'+b+'</div>';var ph=phNames(x.c);
 if(ph.length)h+='<div class="phs">'+ph.map(function(n){return '<label>{'+n+'}<input data-fill="'+n+'" value="'+esc(st.vals[n]||'')+'" placeholder="'+n+'" autocomplete="off" autocapitalize="off" spellcheck="false"></label>'}).join('')+'</div>';
 h+='<pre>'+codeHtml(x.c)+'</pre>';if(x.n)h+='<p class="note">💡 '+esc(x.n)+'</p>';
 h+='<div class="acts"><button class="btn pri" data-copy="'+esc(t.id)+'|'+e.id+'">'+(x.d?'⚠ Copy':'Copy')+'</button>'+(t.custom?'<button class="btn dz" data-del="'+esc(t.id)+'">Delete snippet</button>':'')+'</div>';
 return h+'</div>'}
function card(t){var engs=ENG.filter(function(e){return st.eng.indexOf(e.id)>=0&&(t[e.id]||!t.custom)});if(t.custom)engs=engs.filter(function(e){return t[e.id]});if(t.lx)engs=[LX];if(t.pgo)engs=engs.filter(function(e){return e.id==='pg'});if(t.only)engs=engs.filter(function(e){return e.id===t.only});
 var act=ui.tab[t.id];if(!engs.some(function(e){return e.id===act})){var f=engs.filter(function(e){return t[e.id]&&!t[e.id].na})[0]||engs[0];act=f&&f.id}
 var star=st.stars.indexOf(t.id)>=0;var note=st.notes[t.id];
 var h='<article class="card" data-id="'+esc(t.id)+'"><div class="ch"><div style="flex:1;min-width:0"><h3 id="task-'+esc(t.id)+'">'+esc(t.t)+'</h3><div class="sub"><span class="tag">'+esc(CATNAME[t.cat]||t.cat)+'</span>'+(t.tri?'<span class="tag cu">3 AM</span>':'')+(t.danger?'<span class="tag dz">⚠ Destructive</span>':'')+(t.custom?'<span class="tag cu">Mine</span>':'')+'</div></div>'+
 '<button class="star" data-star="'+esc(t.id)+'" aria-pressed="'+star+'" aria-label="Star">'+(star?'★':'☆')+'</button></div>';
 if(engs.length>1)h+='<div class="tabs" role="tablist">'+engs.map(function(e){var x=t[e.id];return '<button class="tab'+(!x||x.na?' tna':'')+'" role="tab" style="--ec:var(--'+e.id+')" data-tab="'+e.id+'" aria-selected="'+(e.id===act)+'">'+e.name+'</button>'}).join('')+'</div>';
 h+='<div class="panels" style="--n:'+engs.length+'">'+engs.map(function(e){return panel(t,e,e.id===act)}).join('')+'</div>';
 h+='<div class="unote">'+(note?'<div class="saved">📝 '+esc(note)+'</div>':'')+'<button class="btn" data-note="'+esc(t.id)+'">'+(note?'Edit note':'📝 Add note')+'</button></div>';
 return h+'</article>'}
var TRI='<div class="banner"><b>🚨 3 AM triage, in order:</b><ol><li>Who is connected and what is running (sessions, connection count)</li><li>Blocking and the head blocker, idle-in-transaction sessions</li><li>Long-running queries and waits</li><li>Replication / cluster health and lag</li><li>Disk, log space, XID age, error log</li></ol>Look first; kill only after you know what the session is doing.</div>';
function render(){chips();var v=visible();$('banner').innerHTML=ui.cat==='tri'&&!ui.q?TRI:'';
 $('meta').textContent=v.length+' task'+(v.length===1?'':'s')+(ui.q?' matching "'+ui.q.trim()+'"':'')+(st.eng.length<4?' · '+st.eng.map(function(e){return ENG.filter(function(x){return x.id===e})[0].name}).join(', '):'');
 $('list').innerHTML=v.length?v.map(card).join(''):'<div class="empty">No matching tasks. Try other words (e.g. "lock", "size", "lag"), or add your own snippet from the ⋯ menu.</div>';
 $('clr').style.display=ui.q?'block':'none'}
/* ---------- copy ---------- */
function copyText(s){if(navigator.clipboard&&window.isSecureContext){return navigator.clipboard.writeText(s).catch(function(){return legacy(s)})}return Promise.resolve(legacy(s))}
function legacy(s){var ta=document.createElement('textarea');ta.value=s;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}document.body.removeChild(ta);if(!ok)throw new Error('copy failed');return ok}
function findTask(id){return allTasks().filter(function(t){return t.id===id})[0]}
/* ---------- events ---------- */
document.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;var d=b.dataset;
 if(d.eng){if(d.eng==='all')st.eng=['pg','ms','mg','ml'];else if(st.eng.length===4)st.eng=[d.eng];else{var i=st.eng.indexOf(d.eng);if(i>=0){st.eng.splice(i,1);if(!st.eng.length)st.eng=['pg','ms','mg','ml']}else st.eng.push(d.eng)}
  st.eng.sort(function(a,b){return 'pgmsmgml'.indexOf(a)-'pgmsmgml'.indexOf(b)});save();render();return}
 if(d.cat){ui.cat=d.cat;render();window.scrollTo(0,0);return}
 if(d.tab){var c=b.closest('.card');ui.tab[c.dataset.id]=d.tab;c.querySelectorAll('.tab').forEach(function(x){x.setAttribute('aria-selected',x===b)});c.querySelectorAll('.pn').forEach(function(p){p.classList.toggle('on',p.dataset.e===d.tab)});return}
 if(d.star){var k=st.stars.indexOf(d.star);if(k>=0)st.stars.splice(k,1);else st.stars.push(d.star);save();toast(k>=0?'Removed from starred':'Starred, it now sorts first');render();return}
 if(d.copy){var p=d.copy.split('|'),t=findTask(p[0]);if(!t||!t[p[1]])return;var txt=fill(t[p[1]].c);copyText(txt).then(function(){b.classList.add('ok');b.textContent='Copied ✓';var left=phNames(txt).length;toast(left?'Copied · '+left+' placeholder(s) still empty':'Copied to clipboard');setTimeout(function(){b.classList.remove('ok');b.textContent=t[p[1]].d?'⚠ Copy':'Copy'},1400)}).catch(function(){toast('Copy blocked; long-press the code to copy')});return}
 if(d.note){var cur=st.notes[d.note]||'';var unote=b.parentNode;unote.innerHTML='<textarea placeholder="Your note: env specifics, ticket links…">'+esc(cur)+'</textarea><div class="acts"><button class="btn pri" data-nsave="'+esc(d.note)+'">Save note</button><button class="btn" data-ncancel="1">Cancel</button></div>';unote.querySelector('textarea').focus();return}
 if(d.nsave){var v=b.closest('.unote').querySelector('textarea').value.trim();if(v)st.notes[d.nsave]=v;else delete st.notes[d.nsave];save();render();toast('Note saved');return}
 if(d.ncancel){render();return}
 if(d.del){if(!confirm('Delete this snippet?'))return;st.custom=st.custom.filter(function(s){return s.id!==d.del});var si=st.stars.indexOf(d.del);if(si>=0)st.stars.splice(si,1);delete st.notes[d.del];save();render();toast('Snippet deleted');return}
});
document.addEventListener('input',function(ev){var n=ev.target.dataset&&ev.target.dataset.fill;if(!n)return;var v=ev.target.value;if(v)st.vals[n]=v;else delete st.vals[n];save();
 document.querySelectorAll('span.p[data-ph="'+n+'"]').forEach(function(s){s.textContent=v||'{'+n+'}';s.classList.toggle('f',!!v)});
 document.querySelectorAll('input[data-fill="'+n+'"]').forEach(function(i){if(i!==ev.target)i.value=v})});
var qt;$('q').addEventListener('input',function(){clearTimeout(qt);var v=this.value;qt=setTimeout(function(){ui.q=v;render()},120)});
$('clr').onclick=function(){$('q').value='';ui.q='';render();$('q').focus()};
$('themeBtn').onclick=function(){if(window.MG)MG.cycle()};
function sheet(id,open){$(id).classList.toggle('open',open)}
$('menuBtn').onclick=function(){sheet('menuSheet',true)};
$('mClose').onclick=function(){sheet('menuSheet',false)};
document.querySelectorAll('.sheet').forEach(function(s){s.addEventListener('click',function(e){if(e.target===s)s.classList.remove('open')})});
$('aE').innerHTML=ENG.map(function(e){return '<option value="'+e.id+'">'+e.full+'</option>'}).join('');
$('aC').innerHTML=CATS.filter(function(c){return c.id!=='linux'}).map(function(c){return '<option value="'+c.id+'">'+c.name+'</option>'}).join('');
$('mAdd').onclick=function(){sheet('menuSheet',false);['aT','aCode','aN','aK'].forEach(function(i){$(i).value=''});$('aD').checked=false;if(st.eng.length<4)$('aE').value=st.eng[0];sheet('addSheet',true);$('aT').focus()};
$('aCancel').onclick=function(){sheet('addSheet',false)};
$('aSave').onclick=function(){var t=$('aT').value.trim(),c=$('aCode').value.replace(/\s+$/,'');if(!t||!c){toast('Title and command are required');return}
 st.custom.push({id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),t:t,eng:$('aE').value,cat:$('aC').value,c:c,n:$('aN').value.trim(),k:$('aK').value.trim(),d:$('aD').checked});save();sheet('addSheet',false);ui.cat='mine';ui.q='';$('q').value='';render();toast('Snippet saved')};
$('mExport').onclick=function(){var data={app:'db-cheatsheet',version:1,exported:new Date().toISOString(),stars:st.stars,custom:st.custom,notes:st.notes,vals:st.vals};
 var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='db-cheatsheet-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);toast('Backup downloaded')};
$('mImport').onclick=function(){$('fileIn').value='';$('fileIn').click()};
$('fileIn').onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{importData(JSON.parse(r.result));sheet('menuSheet',false)}catch(e){toast('Not a valid backup file')}};r.readAsText(f)};
function importData(d){if(!d||d.app!=='db-cheatsheet')throw new Error('bad');var ids={};st.custom.forEach(function(s){ids[s.id]=1});
 (d.custom||[]).forEach(function(s){if(s&&s.id&&s.t&&s.c&&!ids[s.id]&&ENG.some(function(e){return e.id===s.eng})){st.custom.push({id:String(s.id),t:String(s.t),eng:s.eng,cat:CATNAME[s.cat]?s.cat:'maint',c:String(s.c),n:String(s.n||''),k:String(s.k||''),d:!!s.d});ids[s.id]=1}});
 (d.stars||[]).forEach(function(s){if(typeof s==='string'&&st.stars.indexOf(s)<0)st.stars.push(s)});
 if(d.notes&&typeof d.notes==='object')for(var k in d.notes)if(typeof d.notes[k]==='string')st.notes[k]=d.notes[k];
 if(d.vals&&typeof d.vals==='object')for(var v in d.vals)if(typeof d.vals[v]==='string')st.vals[v]=d.vals[v];
 save();render();toast('Backup imported')}
window.__dbcsImport=importData;
$('mClearVals').onclick=function(){st.vals={};save();render();sheet('menuSheet',false);toast('Placeholder values cleared')};
/* ---------- persistence + manifest ---------- */
function persist(){var el=$('storeInfo');if(navigator.storage&&navigator.storage.persist){navigator.storage.persisted().then(function(p){return p||navigator.storage.persist()}).then(function(p){el.textContent=p?'🔒 Storage is persistent on this device.':'Storage may be cleared by the browser; export a backup now and then. Adding to the home screen helps.'}).catch(function(){})}}
function makeIcon(size){try{var c=document.createElement('canvas');c.width=c.height=size;var x=c.getContext('2d');x.fillStyle='#2f5bd3';x.fillRect(0,0,size,size);x.fillStyle='#fff';x.font='bold '+Math.round(size*.42)+'px ui-monospace,monospace';x.textAlign='center';x.textBaseline='middle';x.fillText('>_',size/2,size*.52);return c.toDataURL('image/png')}catch(e){return ''}}
try{$('appleIcon').href=makeIcon(180);var base=location.href.split('#')[0].split('?')[0];
 var man={name:'DBA Cheat Sheet',short_name:'DBA Cheats',description:'Offline DBA commands for Aurora PostgreSQL, SQL Server, MongoDB and MarkLogic',start_url:base,scope:base.replace(/[^\/]*$/,''),display:'standalone',background_color:'#f3f5f9',theme_color:'#2f5bd3',icons:[{src:makeIcon(192),sizes:'192x192',type:'image/png',purpose:'any maskable'},{src:makeIcon(512),sizes:'512x512',type:'image/png',purpose:'any maskable'}]};
 $('manifestLink').href='data:application/manifest+json,'+encodeURIComponent(JSON.stringify(man))}catch(e){}
/* ---------- deep links (#task-<id>, used by the cross-site search) ---------- */
function showHash(){var m=/^#task-(.+)$/.exec(location.hash);if(!m)return;var id;try{id=decodeURIComponent(m[1])}catch(e){return}var t=findTask(id);if(!t)return;
 if(!document.getElementById('task-'+id)){if(!hasEng(t)){st.eng=['pg','ms','mg','ml'];save()}ui.cat='all';ui.q='';$('q').value='';render()}
 var h=document.getElementById('task-'+id);if(!h)return;var top=document.querySelector('header.top'),off=(top?top.offsetHeight:0)+12;
 window.scrollTo(0,Math.max(0,h.getBoundingClientRect().top+window.pageYOffset-off));var c=h.closest('.card');if(c){c.classList.remove('mg-s-hit');void c.offsetWidth;c.classList.add('mg-s-hit')}}
window.addEventListener('hashchange',showHash);
load();applyTheme();render();persist();showHash();
})();
