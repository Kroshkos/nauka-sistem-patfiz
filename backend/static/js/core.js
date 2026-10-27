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
state.user=loadUser(); // приоритет: отдельный ключ nauka1-user
function persist(){try{localStorage.setItem('nauka1-state',JSON.stringify({page:state.page,theme:state.theme,user:state.user}))}catch(e){}}

/* ============ СИСТЕМА РОЛЕЙ (RBAC) ============ */
const ROLES={
 admin :{name:'Администратор системы',color:'#7c5cff',ic:'shield',desc:'Полный доступ: все модули, редактирование и удаление любых записей, управление пользователями.'},
 science:{name:'Учёный секретарь / отдел науки',color:'#4f8cff',ic:'cap',desc:'Управление работами, отчётами и аналитикой всех подразделений; публикация мероприятий.'},
 head  :{name:'Руководитель подразделения',color:'#2dd4a0',ic:'building',desc:'Работы своего подразделения: создание и редактирование, проверка отчётов. Чужие подразделения — только просмотр.'},
 staff :{name:'Научный сотрудник',color:'#f5b74e',ic:'users',desc:'Просмотр всех данных; создание и редактирование собственных работ; статус «на проверке».'},
 viewer:{name:'Наблюдатель',color:'#8aa0b8',ic:'eye',desc:'Режим чтения: дашборд, исследования, аналитика, мероприятия. Без изменений.'},
};
const PERMS={ // матрица прав: роль -> набор разрешений
 admin :['see','edit','create','delete','manage_users','approve','export'],
 science:['see','edit','create','delete','approve','export'],
 head  :['see','edit','create','approve','export'],   // + ограничение по своему подразделению
 staff :['see','edit','create','export'],              // edit — только свои работы
 viewer:['see'],
};
const DEMO_USERS=[
 {id:'u1',name:'Отдел науки',   role:'science',dept:null, init:'ОН'},
 {id:'u2',name:'Смирнов А.И.',  role:'head',   dept:'d2', init:'СА'},
 {id:'u3',name:'Иванов И.И.',   role:'staff',  dept:'d2', init:'ИИ', personId:'p1'},
 {id:'u4',name:'Фёдорова Л.Н.', role:'staff',  dept:'d6', init:'ФЛ', personId:'p6'},
 {id:'u5',name:'Наблюдатель',   role:'viewer', dept:null, init:'НБ'},
 {id:'u9',name:'Admin',         role:'admin',  dept:null, init:'AD'},
];
function can(perm){return (PERMS[(state.user&&state.user.role)||'viewer']||[]).includes(perm)}
function isReadOnly(){return !can('edit')&&!can('create')}
function userDepts(){ // подразделения, в которых текущий пользователь может писать
 const u=state.user||{};
 if(u.role==='head'&&u.dept)return[u.dept];
 return DEPTS.map(d=>d.id);
}
function canEditWork(w){ // точечная проверка для конкретной записи
 if(!state.user)return false;
 switch(state.user.role){
  case 'admin':case 'science':return true;
  case 'head':return w.dept===state.user.dept;
  case 'staff':return w.lead===state.user.personId||(w.createdBy===state.user.id);
  default:return false;
 }
}
function loadUser(){try{const u=localStorage.getItem('nauka1-user');if(u)return JSON.parse(u)}catch(e){}return null}
function saveUser(u){try{u?localStorage.setItem('nauka1-user',JSON.stringify(u)):localStorage.removeItem('nauka1-user')}catch(e){}state.user=u}

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
 {id:'roles',name:'Роли и доступ',ic:'shield',group:'Настройки',adminOnly:true},
];
function navVisible(n){return !n.adminOnly||(state.user&&state.user.role==='admin')}
function navCount(id){switch(id){
 case 'works':return WORKS.length;case 'kanban':return WORKS.filter(w=>w.status!=='done').length;
 case 'depts':return DEPTS.length;case 'people':return PEOPLE.length;case 'reports':return REPORTS.length;default:return null}}

/* ---------- Экран входа / выбор роли ---------- */
function renderLogin(){
 document.documentElement.dataset.theme=state.theme||'dark';
 $('#app').innerHTML=`<div class="login-wrap"><div class="login-card card">
  <div class="login-brand"><div class="brand-emblem" style="width:52px;height:52px;border-radius:15px;font-size:24px">Н</div>
   <div><b style="font-size:19px">Наука · Контур 1</b><div class="t-sub">Система учёта научной работы — вход по роли (демо)</div></div></div>
  <div class="login-roles">${DEMO_USERS.map(u=>{const r=ROLES[u.role];return `
   <button class="role-pick" data-login="${u.id}">
     <div class="avatar" style="background:${r.color};box-shadow:0 0 0 3px ${r.color}33">${u.init}</div>
     <div style="min-width:0;text-align:left"><div class="rp-n">${esc(u.name)}</div>
      <div class="rp-r" style="color:${r.color}">${ic(r.ic,13)} ${r.name}${u.dept?' · '+dept(u.dept).short:''}</div></div>
     ${ic('arrow',16)}</button>`}).join('')}</div>
  <div class="t-sub" style="text-align:center;margin-top:14px;display:flex;align-items:center;justify-content:center;gap:6px">
   ${ic('info',14)} В проде — аутентификация через FastAPI + LDAP/ВМедА; роли задаёт администратор.</div>
 </div></div>`;
 $$('[data-login]').forEach(b=>b.onclick=()=>{
   const u=DEMO_USERS.find(x=>x.id===b.dataset.login);
   saveUser(u);persist();toast('Вход выполнен: '+u.name+' — '+ROLES[u.role].name);render();});
}

function renderShell(){
 const u=state.user||{};const r=ROLES[u.role]||ROLES.viewer;
 $('#app').innerHTML=`
 <aside class="sidebar" id="sidebar">
   <div class="brand"><div class="brand-emblem">Н</div><div><b>Наука</b><span>Контур учёта · 2026</span></div></div>
   <nav class="nav">${NAV.filter(navVisible).map((n,i,a)=>(i===0||a[i-1].group!==n.group?`<div class="nav-label">${n.group}</div>`:'')+
     `<div class="nav-item ${state.page===n.id?'active':''}" data-nav="${n.id}">${ic(n.ic)}<span>${n.name}</span>${navCount(n.id)?`<i class="cnt" style="font-style:normal">${navCount(n.id)}</i>`:''}</div>`).join('')}</nav>
   <div class="sidebar-foot">
     <div class="userchip" id="userchip" title="Сменить роль / выйти">
       <div class="avatar" style="background:${r.color}">${u.init||'—'}</div>
       <div style="min-width:0"><div class="u-n">${esc(u.name||'Гость')}</div><div class="u-r" style="color:${r.color}">${r.name}</div></div>
       ${ic('logout',14)}
     </div>
   </div>
 </aside>
 <div class="main">
   <header class="topbar">
     <button class="icon-btn burger" id="burger">${ic('menu')}</button>
     <h1 id="page-title"></h1>
     ${isReadOnly()?`<span class="badge b-warn ro-badge" title="Только просмотр">${ic('eye',12)} Только чтение</span>`:''}
     <div class="search">${ic('search')}<input id="q" placeholder="Поиск по работам, людям, кафедрам…" value="${esc(state.q)}"></div>
     <button class="icon-btn dot-badge" title="Уведомления" id="bell">${ic('bell')}</button>
     <button class="icon-btn" title="Сменить тему" id="theme-btn"></button>
     ${can('create')?`<button class="btn primary" id="add-btn">${ic('plus')}Добавить работу</button>`:''}
   </header>
   <div class="content" id="view"></div>
 </div>`;
 $$('[data-nav]').forEach(el=>el.onclick=()=>{state.page=el.dataset.nav;persist();render()});
 $('#burger').onclick=()=>{$('#sidebar').classList.toggle('open');
   if($('#sidebar').classList.contains('open')&&!$('.scrim')){const s=document.createElement('div');s.className='scrim';s.onclick=()=>{s.remove();$('#sidebar').classList.remove('open')};document.body.appendChild(s)}};
 $('#theme-btn').onclick=toggleTheme;
 const ab=$('#add-btn');if(ab)ab.onclick=()=>openWorkModal();
 $('#bell').onclick=()=>toast('3 просроченных задачи и 2 отчёта на проверке','warn');
 $('#userchip').onclick=()=>confirmBox('Сменить роль?',(state.user&&state.user.name)+' ('+ROLES[state.user.role].name+')',
   ()=>{saveUser(null);persist();renderLogin()},'Выйти','Остаться');
 const qi=$('#q');qi.oninput=()=>{state.q=qi.value;renderPage()};
 applyTheme();
}
function render(){if(!state.user){renderLogin();return}renderShell();renderPage()}

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

function confirmBox(title,text,onYes,okLabel='Удалить',cancelLabel='Отмена'){
 $('#modal-root').innerHTML=`<div class="modal-bg" id="mbg"><div class="modal" style="width:min(420px,100%)">
 <div class="modal-head"><b>${title}</b></div><div class="modal-body" style="color:var(--muted)">${esc(text)}</div>
 <div class="modal-foot"><button class="btn ghost" id="cn">${cancelLabel}</button><button class="btn danger" id="cy">${okLabel}</button></div></div></div>`;
 $('#cn').onclick=()=>$('#modal-root').innerHTML='';
 $('#mbg').onclick=e=>{if(e.target.id==='mbg')$('#modal-root').innerHTML=''};
 $('#cy').onclick=()=>{onYes();$('#modal-root').innerHTML=''};
}

window.addEventListener('DOMContentLoaded',()=>{
 const mr=document.createElement('div');mr.id='modal-root';document.body.appendChild(mr);
 const tl=document.createElement('div');tl.id='toasts';document.body.appendChild(tl);
 bindGlobal();render();
 if(typeof loadEvents==='function')loadEvents();   // фоновая загрузка мероприятий Контура 2
});
