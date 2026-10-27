/* ============ Наука · Контур 1 — утилиты, состояние, оболочка ============ */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dept=id=>DEPTS.find(d=>d.id===id)||{name:'—',short:'—'};
const person=id=>PEOPLE.find(p=>p.id===id)||{name:'—',deg:''};
const wtype=id=>WORK_TYPES.find(t=>t.id===id)||WORK_TYPES[0];
const stat=id=>STATUSES.find(s=>s.id===id)||STATUSES[0];
const fmtMoney=n=>n?new Intl.NumberFormat('ru-RU').format(n)+' ₽':'—';
const byId=id=>WORKS.find(w=>w.id===id);

let state={page:'dash',q:'',fType:'',fDept:'',fStatus:'',sort:'due',kanbanTab:'status',reportTab:'reports',drag:null};
try{const s=localStorage.getItem('nauka1-state');if(s)Object.assign(state,JSON.parse(s))}catch(e){}
function persist(){try{localStorage.setItem('nauka1-state',JSON.stringify({page:state.page,theme:state.theme}))}catch(e){}}

function applyTheme(){document.documentElement.dataset.theme=state.theme||'dark';$('#theme-btn').innerHTML=ic(state.theme==='light'?'moon':'sun')}
function toggleTheme(){state.theme=state.theme==='light'?'dark':'light';applyTheme();persist()}

function toast(msg,type='ok'){const t=document.createElement('div');t.className='toast '+type;
 t.innerHTML=ic(type==='err'?'x':type==='warn'?'bell':'check')+'<span>'+esc(msg)+'</span>';
 $('#toasts').appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transition='.3s';setTimeout(()=>t.remove(),350)},2600)}

const NAV=[
 {id:'dash',name:'Дашборд',ic:'home',group:'Обзор'},
 {id:'works',name:'Научные работы',ic:'folder',group:'Работа'},
 {id:'kanban',name:'Канбан задач',ic:'kanban',group:'Работа'},
 {id:'depts',name:'Подразделения',ic:'building',group:'Структура'},
 {id:'people',name:'Исследователи',ic:'users',group:'Структура'},
 {id:'analytics',name:'Аналитика',ic:'chart',group:'Отчётность'},
 {id:'reports',name:'Отчёты',ic:'file',group:'Отчётность'},
 {id:'events',name:'Мероприятия',ic:'calendar',group:'Отчётность'},
];
function navCount(id){switch(id){
 case 'works':return WORKS.length;case 'kanban':return WORKS.filter(w=>w.status!=='done').length;
 case 'depts':return DEPTS.length;case 'people':return PEOPLE.length;case 'reports':return REPORTS.length;default:return null}}

function renderShell(){
 $('#app').innerHTML=`
 <aside class="sidebar" id="sidebar">
   <div class="brand"><div class="brand-emblem">Н</div><div><b>Наука</b><span>Контур учёта · 2026</span></div></div>
   <nav class="nav">${NAV.map((n,i)=>(i===0||NAV[i-1].group!==n.group?`<div class="nav-label">${n.group}</div>`:'')+
     `<div class="nav-item ${state.page===n.id?'active':''}" data-nav="${n.id}">${ic(n.ic)}<span>${n.name}</span>${navCount(n.id)?`<i class="cnt" style="font-style:normal">${navCount(n.id)}</i>`:''}</div>`).join('')}</nav>
   <div class="sidebar-foot">
     <div class="userchip"><div class="avatar">ОН</div><div style="min-width:0"><div class="u-n">Отдел науки</div><div class="u-r">администратор</div></div></div>
   </div>
 </aside>
 <div class="main">
   <header class="topbar">
     <button class="icon-btn burger" id="burger">${ic('menu')}</button>
     <h1 id="page-title"></h1>
     <div class="search">${ic('search')}<input id="q" placeholder="Поиск по работам, людям, кафедрам…" value="${esc(state.q)}"></div>
     <button class="icon-btn dot-badge" title="Уведомления" id="bell">${ic('bell')}</button>
     <button class="icon-btn" title="Сменить тему" id="theme-btn"></button>
     <button class="btn primary" id="add-btn">${ic('plus')}Добавить работу</button>
   </header>
   <div class="content" id="view"></div>
 </div>`;
 $$('[data-nav]').forEach(el=>el.onclick=()=>{state.page=el.dataset.nav;persist();render()});
 $('#burger').onclick=()=>{$('#sidebar').classList.toggle('open');
   if($('#sidebar').classList.contains('open')&&!$('.scrim')){const s=document.createElement('div');s.className='scrim';s.onclick=()=>{s.remove();$('#sidebar').classList.remove('open')};document.body.appendChild(s)}};
 $('#theme-btn').onclick=toggleTheme;
 $('#add-btn').onclick=()=>openWorkModal();
 $('#bell').onclick=()=>toast('3 просроченных задачи и 2 отчёта на проверке','warn');
 const qi=$('#q');qi.oninput=()=>{state.q=qi.value;renderPage()};
 applyTheme();
}
function render(){renderShell();renderPage()}

function stats(){
 const done=WORKS.filter(w=>w.status==='done').length;
 const active=WORKS.filter(w=>w.status==='progress'||w.status==='review').length;
 const pubs=WORKS.filter(w=>w.type==='article').length;
 const budget=WORKS.filter(w=>w.type==='grant').reduce((s,w)=>s+(w.budget||0),0);
 const overdue=WORKS.filter(w=>w.due&&w.status!=='done'&&new Date(w.due)<new Date()).length;
 return {total:WORKS.length,done,active,pubs,budget,overdue};
}
function statCard(v,l,i,c,d,dc){return `<div class="card stat"><div class="stat-ic" style="background:${c}22;color:${c}">${ic(i)}</div>
 <div><div class="v">${v}</div><div class="l">${l}</div></div>${d?`<span class="d ${dc}">${d}</span>`:''}</div>`}
function emptyBox(t){return `<div class="empty">${ic('folder')}<div>${t}</div></div>`}
function fmtDate(iso){const d=new Date(iso);return d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}
function fmtMl(n){return n>=1e6?(n/1e6).toFixed(1).replace('.',',')+' млн ₽':fmtMoney(n)}

function filteredWorks(){
 let ws=WORKS.slice();
 const q=state.q.toLowerCase().trim();
 if(q)ws=ws.filter(w=>(w.title+' '+person(w.lead).name+' '+dept(w.dept).name+' '+(w.tags||[]).join(' ')+' '+(w.journal||'')).toLowerCase().includes(q));
 if(state.fType)ws=ws.filter(w=>w.type===state.fType);
 if(state.fDept)ws=ws.filter(w=>w.dept===state.fDept);
 if(state.fStatus)ws=ws.filter(w=>w.status===state.fStatus);
 const ord={due:(a,b)=>(a.due||'9999')<(b.due||'9999')?-1:1,title:(a,b)=>a.title.localeCompare(b.title,'ru'),year:(a,b)=>b.year-a.year};
 if(ord[state.sort])ws.sort(ord[state.sort]);else ws.sort((a,b)=>({high:0,mid:1,low:2})[a.prio]-({high:0,mid:1,low:2})[b.prio]);
 return ws;
}

function confirmBox(title,text,onYes,okLabel='Удалить'){
 $('#modal-root').innerHTML=`<div class="modal-bg" id="mbg"><div class="modal" style="width:min(420px,100%)">
 <div class="modal-head"><b>${title}</b></div><div class="modal-body" style="color:var(--muted)">${esc(text)}</div>
 <div class="modal-foot"><button class="btn ghost" id="cn">Отмена</button><button class="btn danger" id="cy">${okLabel}</button></div></div></div>`;
 $('#cn').onclick=()=>$('#modal-root').innerHTML='';
 $('#mbg').onclick=e=>{if(e.target.id==='mbg')$('#modal-root').innerHTML=''};
 $('#cy').onclick=()=>{onYes();$('#modal-root').innerHTML=''};
}

window.addEventListener('DOMContentLoaded',()=>{
 const mr=document.createElement('div');mr.id='modal-root';document.body.appendChild(mr);
 const tl=document.createElement('div');tl.id='toasts';document.body.appendChild(tl);
 bindGlobal();render();
});
