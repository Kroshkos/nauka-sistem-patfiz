/* ============ Наука · Контур 1 — страницы и логика ============ */
function renderPage(){
 const V=$('#view');const s=stats();
 $('#page-title').textContent=(NAV.find(n=>n.id===state.page)||{}).name||'';
 switch(state.page){
  case 'dash':V.innerHTML=pageDash(s);break;
  case 'works':V.innerHTML=pageWorks();bindWorks();break;
  case 'kanban':V.innerHTML=pageKanban();bindKanban();break;
  case 'depts':V.innerHTML=pageDepts();break;
  case 'people':V.innerHTML=pagePeople();break;
  case 'analytics':V.innerHTML=pageAnalytics(s);break;
  case 'reports':V.innerHTML=pageReports();break;
  case 'events':V.innerHTML=pageEvents();break;
 }
 requestAnimationFrame(()=>$$('.bar-fill[data-w]').forEach(b=>b.style.width=b.dataset.w+'%'));
}

/* ---------- Дашборд ---------- */
function pageDash(s){
 const upcoming=WORKS.filter(w=>w.due&&w.status!=='done').sort((a,b)=>new Date(a.due)-new Date(b.due)).slice(0,5);
 return `
 <div class="grid g4">
   ${statCard(s.total,'Всего работ','folder','#4f8cff',s.active+' актив.','up')}
   ${statCard(s.pubs,'Публикации','book','#7c5cff',null)}
   ${statCard(fmtMl(s.budget),'Привлечено грантов','flask','#2dd4a0',null)}
   ${statCard(s.overdue,'Просрочено','clock','#f4645f',s.done+' заверш.','up')}
 </div>
 <div class="grid g2">
   <div class="card"><h3>${ic('chart')} Активность по подразделениям</h3>${barsByDept()}</div>
   <div class="card"><h3>${ic('calendar')} Ближайшие сроки</h3>${upcoming.length?upcoming.map(w=>`
     <div class="feed-item"><div class="feed-ic" style="background:${wtype(w.type).color}22;color:${wtype(w.type).color}">${ic(wtype(w.type).icon)}</div>
      <div style="min-width:0"><div class="t">${esc(w.title)}</div><div class="s">${dept(w.dept).short} · ${person(w.lead).name}</div></div>
      <span class="when" style="color:var(--warn)">${fmtDate(w.due)}</span></div>`).join(''):emptyBox('Нет запланированных сроков')}</div>
 </div>
 <div class="grid g2">
   <div class="card"><h3>${ic('bell')} Лента событий</h3><div class="feed">${FEED.map(f=>`
     <div class="feed-item"><div class="feed-ic" style="background:${f.c}22;color:${f.c}">${ic(f.ic)}</div>
      <div><div class="t">${esc(f.t)}</div><div class="s">${esc(f.s)}</div></div><span class="when">${f.when}</span></div>`).join('')}</div></div>
   <div class="card"><h3>${ic('star')} Рейтинг исследователей</h3>${leaderboard()}</div>
 </div>`;
}
function barsByDept(){
 const m={};WORKS.forEach(w=>m[w.dept]=(m[w.dept]||0)+1);
 const max=Math.max(...Object.values(m),1);
 return DEPTS.map(d=>`<div class="bar-row"><span class="bar-name">${d.short}</span>
  <div class="bar-track"><div class="bar-fill" data-w="${Math.round(100*(m[d.id]||0)/max)}" style="width:0"></div></div>
  <span class="bar-val mono">${m[d.id]||0}</span></div>`).join('');
}
function leaderboard(){
 const sc={};WORKS.forEach(w=>{const base=w.status==='done'?3:w.status==='review'?2:1;sc[w.lead]=(sc[w.lead]||0)+base+(w.cite||0)*0.1});
 const top=Object.entries(sc).sort((a,b)=>b[1]-a[1]).slice(0,5);const max=top[0]?top[0][1]:1;
 return top.map(([id,v])=>{const p=person(id);return `<div class="bar-row"><span class="bar-name">${p.name}</span>
  <div class="bar-track"><div class="bar-fill" data-w="${Math.round(100*v/max)}" style="width:0"></div></div>
  <span class="bar-val mono">${Math.round(v)}</span></div>`}).join('');
}

/* ---------- Научные работы ---------- */
function pageWorks(){
 const ws=filteredWorks();
 return `
 <div class="toolbar">
   <div class="chips">${['','article','grant','thesis','patent','event'].map(t=>{
     const tt=WORK_TYPES.find(x=>x.id===t);
     return `<button class="chip ${state.fType===t?'on':''}" data-ft="${t}">${tt?tt.name:'Все'}</button>`}).join('')}</div>
   <select class="f" id="f-dept"><option value="">Все подразделения</option>${DEPTS.map(d=>`<option value="${d.id}" ${state.fDept===d.id?'selected':''}>${d.short}</option>`).join('')}</select>
   <select class="f" id="f-status"><option value="">Любой статус</option>${STATUSES.map(s=>`<option value="${s.id}" ${state.fStatus===s.id?'selected':''}>${s.name}</option>`).join('')}</select>
   <select class="f" id="f-sort"><option value="due" ${state.sort==='due'?'selected':''}>Срок</option><option value="prio" ${state.sort==='prio'?'selected':''}>Приоритет</option><option value="title" ${state.sort==='title'?'selected':''}>Название</option><option value="year" ${state.sort==='year'?'selected':''}>Год</option></select>
   <button class="btn ghost sm" id="reset-f">Сбросить</button>
 </div>
 ${ws.length?`<div class="table-wrap"><table><thead><tr>
   <th>Работа</th><th>Тип</th><th>Подразделение</th><th>Руководитель</th><th>Статус</th><th>Срок</th><th></th></tr></thead>
   <tbody>${ws.map(w=>`<tr data-open="${w.id}">
     <td><div class="t-title">${esc(w.title)}</div><div class="t-sub">${w.journal?esc(w.journal)+' · ':''}${w.year}${(w.tags||[]).length?' · #'+w.tags.join(' #'):''}</div></td>
     <td><span class="badge" style="color:${wtype(w.type).color};border-color:${wtype(w.type).color}55;background:${wtype(w.type).color}14">${wtype(w.type).name}</span></td>
     <td><span class="pill-dept">${dept(w.dept).short}</span></td>
     <td>${person(w.lead).name}<div class="t-sub">${person(w.lead).deg}</div></td>
     <td><span class="badge ${stat(w.status).cls}">${stat(w.status).name}</span></td>
     <td class="mono" style="${w.due&&w.status!=='done'&&new Date(w.due)<new Date()?'color:var(--danger);font-weight:700':''}">${w.due?fmtDate(w.due):'—'}</td>
     <td><div class="row-actions"><button class="mini" data-edit="${w.id}">${ic('edit')}</button><button class="mini del" data-del="${w.id}">${ic('trash')}</button></div></td></tr>`).join('')}</tbody></table></div>`
 :emptyBox('Ничего не найдено — измените фильтры')}`;
}
function bindWorks(){
 $$('[data-ft]').forEach(b=>b.onclick=()=>{state.fType=b.dataset.ft;renderPage()});
 $('#f-dept').onchange=e=>{state.fDept=e.target.value;renderPage()};
 $('#f-status').onchange=e=>{state.fStatus=e.target.value;renderPage()};
 $('#f-sort').onchange=e=>{state.sort=e.target.value;renderPage()};
 $('#reset-f').onclick=()=>{state.fType=state.fDept=state.fStatus='';state.q='';render()};
 $$('[data-edit]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();openWorkModal(b.dataset.edit)});
 $$('[data-del]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();delWork(b.dataset.del)});
 $$('[data-open]').forEach(tr=>{tr.style.cursor='pointer';tr.onclick=()=>openWorkModal(tr.dataset.open)});
}
function delWork(id){const w=byId(id);if(!w)return;
 confirmBox('Удалить работу?','«'+w.title+'» будет удалена без возможности восстановления.',()=>{
   WORKS=WORKS.filter(x=>x.id!==id);toast('Работа удалена','warn');renderPage()})}

/* ---------- Модалка работы ---------- */
function openWorkModal(id){
 const w=id?byId(id):null;
 const fld=(l,n,inner)=>`<div class="field" data-f="${n}"><label>${l}</label>${inner}<span class="err">Обязательное поле</span></div>`;
 $('#modal-root').innerHTML=`<div class="modal-bg" id="mbg"><div class="modal">
 <div class="modal-head"><b>${w?'Редактировать работу':'Новая научная работа'}</b><button class="icon-btn" id="mx">${ic('x')}</button></div>
 <div class="modal-body">
   ${fld('Название','title',`<input id="m-title" value="${esc(w&&w.title||'')}" placeholder="Тема исследования…">`)}
   <div class="frow">
     ${fld('Тип','type',`<select id="m-type">${WORK_TYPES.map(t=>`<option value="${t.id}" ${w&&w.type===t.id?'selected':''}>${t.name}</option>`).join('')}</select>`)}
     ${fld('Статус','status',`<select id="m-status">${STATUSES.map(s=>`<option value="${s.id}" ${w&&w.status===s.id?'selected':''}>${s.name}</option>`).join('')}</select>`)}
   </div>
   <div class="frow">
     ${fld('Подразделение','dept',`<select id="m-dept">${DEPTS.map(d=>`<option value="${d.id}" ${w&&w.dept===d.id?'selected':''}>${d.name}</option>`).join('')}</select>`)}
     ${fld('Руководитель','lead',`<select id="m-lead">${PEOPLE.map(p=>`<option value="${p.id}" ${w&&w.lead===p.id?'selected':''}>${p.name} (${p.deg})</option>`).join('')}</select>`)}
   </div>
   <div class="frow">
     ${fld('Год','year',`<input id="m-year" type="number" min="2000" max="2035" value="${w&&w.year||2026}">`)}
     ${fld('Срок сдачи','due',`<input id="m-due" type="date" value="${w&&w.due||''}">`)}
   </div>
   <div class="frow">
     ${fld('Приоритет','prio',`<select id="m-prio">${Object.entries(PRIOS).map(([k,v])=>`<option value="${k}" ${w&&w.prio===k?'selected':''}>${v}</option>`).join('')}</select>`)}
     ${fld('Бюджет, ₽ (для грантов)','budget',`<input id="m-budget" type="number" min="0" value="${w&&w.budget||''}" placeholder="0">`)}
   </div>
   ${fld('Теги (через запятую)','tags',`<input id="m-tags" value="${esc((w&&w.tags||[]).join(', '))}" placeholder="кардиология, РНФ">`)}
 </div>
 <div class="modal-foot"><button class="btn ghost" id="mc">Отмена</button><button class="btn primary" id="ms">${ic('check')}${w?'Сохранить':'Создать'}</button></div>
 </div></div>`;
 const close=()=>$('#modal-root').innerHTML='';
 $('#mx').onclick=close;$('#mc').onclick=close;
 $('#mbg').onclick=e=>{if(e.target.id==='mbg')close()};
 document.addEventListener('keydown',function h(e){if(e.key==='Escape'){close()}document.removeEventListener('keydown',h)});
 $('#ms').onclick=()=>{
   const g=id=>$('#m-'+id).value.trim();
   const data={title:g('title'),type:g('type'),status:g('status'),dept:g('dept'),lead:g('lead'),
     year:+g('year')||2026,due:g('due')||null,prio:g('prio'),budget:+g('budget')||null,
     tags:g('tags')?g('tags').split(',').map(s=>s.trim()).filter(Boolean):[]};
   let bad=false;
   [['title',data.title],['year',data.year]].forEach(([n,v])=>{const f=$('[data-f="'+n+'"]');f.classList.toggle('invalid',!v);if(!v)bad=true});
   if(bad){toast('Заполните обязательные поля','err');return}
   if(w){Object.assign(w,data);toast('Изменения сохранены')}
   else{data.id='w'+Date.now();WORKS.unshift(data);toast('Работа добавлена')}
   close();render();
 };
}

/* ---------- Канбан ---------- */
function pageKanban(){
 const groups=state.kanbanTab==='status'?STATUSES.map(s=>({key:s.id,name:s.name,cls:s.cls})):
   WORK_TYPES.map(t=>({key:t.id,name:t.name,color:t.color}));
 return `<div class="tabs">${[['status','По статусу'],['type','По типу']].map(([k,n])=>
   `<div class="tab ${state.kanbanTab===k?'on':''}" data-ktab="${k}">${n}</div>`).join('')}</div>
 <div class="kanban">${groups.map(g=>{
   const items=filteredWorks().filter(w=>w[state.kanbanTab]===g.key);
   return `<div class="kcol" data-col="${g.key}"><div class="kcol-h" style="${g.cls?'':'color:'+g.color}">${g.name}<span class="n">${items.length}</span></div>
   ${items.map(w=>`<div class="kcard" draggable="true" data-id="${w.id}">
     <div style="font-weight:600">${esc(w.title.length>60?w.title.slice(0,60)+'…':w.title)}</div>
     <div class="meta"><span class="pill-dept">${dept(w.dept).short}</span>
     ${state.kanbanTab==='status'?`<span class="badge" style="color:${wtype(w.type).color};border-color:${wtype(w.type).color}55;background:${wtype(w.type).color}12">${wtype(w.type).name}</span>`:`<span class="badge ${stat(w.status).cls}">${stat(w.status).name}</span>`}
     ${w.due?`<span class="t-sub" style="margin-left:auto">${fmtDate(w.due)}</span>`:''}</div></div>`).join('')||'<div class="t-sub" style="padding:8px;color:var(--dim)">пусто</div>'}</div>`}).join('')}</div>`;
}
function bindKanban(){
 $$('[data-ktab]').forEach(t=>t.onclick=()=>{state.kanbanTab=t.dataset.ktab;renderPage()});
 $$('.kcard').forEach(c=>{
   c.ondragstart=()=>{state.drag=c.dataset.id;c.classList.add('dragging')};
   c.ondragend=()=>c.classList.remove('dragging');
   c.onclick=()=>openWorkModal(c.dataset.id);
 });
 $$('.kcol').forEach(col=>{
   col.ondragover=e=>{e.preventDefault();col.classList.add('over')};
   col.ondragleave=()=>col.classList.remove('over');
   col.ondrop=e=>{e.preventDefault();col.classList.remove('over');const w=byId(state.drag);if(!w)return;
     w[state.kanbanTab]=col.dataset.col;toast('Перемещено: '+stat(w.status).name);renderPage()};
 });
}

/* ---------- Подразделения ---------- */
function pageDepts(){
 return `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${DEPTS.map(d=>{
   const ws=WORKS.filter(w=>w.dept===d.id);
   const pubs=ws.filter(w=>w.type==='article').length;const gr=ws.filter(w=>w.type==='grant');
   const plan=(typeof PLAN_2026!=='undefined'&&PLAN_2026[d.id])||{pubs:10};const pct=Math.min(100,Math.round(100*pubs/plan.pubs));
   const staff=PEOPLE.filter(p=>p.dept===d.id);
   return `<div class="card"><h3>${ic('building')} ${d.name}</h3>
    <div class="t-sub" style="margin-bottom:12px">Заведующий: ${d.head}</div>
    <div class="grid" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:12px">
      <div><div style="font-size:19px;font-weight:800">${ws.length}</div><div style="font-size:11px;color:var(--muted)">работ</div></div>
      <div><div style="font-size:19px;font-weight:800">${pubs}</div><div style="font-size:11px;color:var(--muted)">публикаций</div></div>
      <div><div style="font-size:19px;font-weight:800">${fmtMl(gr.reduce((s,w)=>s+(w.budget||0),0))}</div><div style="font-size:11px;color:var(--muted)">гранты</div></div>
    </div>
    <div style="font-size:11.5px;color:var(--muted);display:flex;justify-content:space-between;margin-bottom:5px"><span>План публикаций 2026</span><b>${pubs}/${plan.pubs}</b></div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div style="display:flex;gap:6px;margin-top:13px;flex-wrap:wrap">${staff.slice(0,4).map(p=>`<span class="pill-dept">${p.name}</span>`).join('')}${staff.length>4?`<span class="pill-dept">+${staff.length-4}</span>`:''}</div></div>`}).join('')}</div>`;
}

/* ---------- Исследователи ---------- */
function pagePeople(){
 const q=state.q.toLowerCase().trim();
 const ps=q?PEOPLE.filter(p=>(p.name+p.deg+dept(p.dept).name).toLowerCase().includes(q)):PEOPLE;
 return `<div class="table-wrap"><table><thead><tr><th>Сотрудник</th><th>Подразделение</th><th>Активных работ</th><th>Публикации</th><th>Цитирования</th><th>Рейтинг</th></tr></thead>
 <tbody>${ps.map(p=>{const ws=WORKS.filter(w=>w.lead===p.id);const act=ws.filter(w=>w.status!=='done').length;
   const pub=ws.filter(w=>w.type==='article').length;const cit=ws.reduce((s,w)=>s+(w.cite||0),0);
   const rt=Math.round(act*2+pub*3+cit*0.5);
   return `<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="avatar" style="width:30px;height:30px;font-size:11px">${p.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
    <div><div style="font-weight:600">${p.name}</div><div class="t-sub">${p.deg}</div></div></div></td>
    <td><span class="pill-dept">${dept(p.dept).short}</span></td><td class="mono">${act}</td><td class="mono">${pub}</td><td class="mono">${cit}</td>
    <td><span class="badge b-violet">${rt} баллов</span></td></tr>`}).join('')}</tbody></table></div>`;
}

/* ---------- Аналитика ---------- */
function donut(){
 const total=WORKS.length||1;let a=0;const cols=['#4f8cff','#7c5cff','#2dd4a0','#f5b74e','#f4645f'];
 const segs=WORK_TYPES.map((t,i)=>{const v=WORKS.filter(w=>w.type===t.id).length;const from=a/total*360;a+=v;
   return {t,v,from,c:cols[i]}});
 const r=52,C=2*Math.PI*r;
 return `<div class="donut-wrap"><svg width="140" height="140" viewBox="0 0 140 140">
  <circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--panel2)" stroke-width="18"/>
  ${segs.filter(s=>s.v).map(s=>`<circle cx="70" cy="70" r="${r}" fill="none" stroke="${s.c}" stroke-width="18"
    stroke-dasharray="${C*s.v/total} ${C}" stroke-dashoffset="${-C*s.from/360}" transform="rotate(-90 70 70)"/>`).join('')}
  <text x="70" y="66" text-anchor="middle" font-size="22" font-weight="800" fill="var(--text)">${total}</text>
  <text x="70" y="84" text-anchor="middle" font-size="10" fill="var(--muted)">работ</text></svg>
  <div class="legend">${segs.map(s=>`<span><i style="background:${s.c}"></i>${s.t.name} — <b>${s.v}</b></span>`).join('')}</div></div>`;
}
function pageAnalytics(s){
 const years=[2024,2025,2026];
 return `<div class="grid g4">
   ${statCard(s.total,'Всего работ','folder','#4f8cff')}
   ${statCard(Math.round(100*s.done/Math.max(s.total,1))+'%','Доля завершённых','check','#2dd4a0')}
   ${statCard(WORKS.filter(w=>w.scopus).length,'Публикации Scopus/WoS','book','#7c5cff')}
   ${statCard(WORKS.reduce((a,w)=>a+(w.cite||0),0),'Всего цитирований','star','#f5b74e')}
 </div>
 <div class="grid g2">
  <div class="card"><h3>${ic('chart')} Структура по типам</h3>${donut()}</div>
  <div class="card"><h3>${ic('calendar')} Динамика по годам</h3>
   ${years.map(y=>{const n=WORKS.filter(w=>w.year===y).length;const mx=Math.max.apply(null,years.map(yy=>WORKS.filter(w=>w.year===yy).length).concat([1]));
     return `<div class="bar-row"><span class="bar-name">${y} год</span><div class="bar-track"><div class="bar-fill" data-w="${Math.round(100*n/mx)}" style="width:0"></div></div><span class="bar-val mono">${n}</span></div>`}).join('')}
   <div class="t-sub" style="margin-top:10px">В 2026 году загруженность выросла относительно прошлого периода — рекомендуется усилить контроль сроков по грантам.</div></div>
 </div>
 <div class="card"><h3>${ic('building')} Выполнение плана по подразделениям (публикации, 2026)</h3>
  ${DEPTS.map(d=>{const fact=WORKS.filter(w=>w.dept===d.id&&w.type==='article'&&w.year===2026).length;
    const plan=(typeof PLAN_2026!=='undefined'&&PLAN_2026[d.id]&&PLAN_2026[d.id].pubs)||10;const pct=Math.min(100,Math.round(100*fact/plan));
    return `<div class="bar-row"><span class="bar-name">${d.short}</span><div class="bar-track"><div class="bar-fill" data-w="${pct}" style="width:0;${pct<40?'background:linear-gradient(135deg,#f4645f,#f5b74e)':''}"></div></div><span class="bar-val mono">${fact}/${plan}</span></div>`}).join('')}</div>`;
}

/* ---------- Отчёты ---------- */
function pageReports(){
 return `<div class="toolbar" style="justify-content:space-between">
   <div class="chips">${[['reports','Отчёты'],['templates','Шаблоны']].map(([k,n])=>`<button class="chip ${state.reportTab===k?'on':''}" data-rtab="${k}">${n}</button>`).join('')}</div>
   <button class="btn primary" id="gen-rep">${ic('download')}Сформировать сводный отчёт</button></div>
 ${state.reportTab==='reports'?`<div class="table-wrap"><table><thead><tr><th>Отчёт</th><th>Подразделение</th><th>Год</th><th>Позиций</th><th>Готовность</th><th>Статус</th></tr></thead>
  <tbody>${REPORTS.map(r=>`<tr><td style="font-weight:600">${esc(r.title)}</td><td><span class="pill-dept">${dept(r.dept).short}</span></td>
   <td class="mono">${r.year}</td><td class="mono">${r.items}</td>
   <td style="min-width:130px"><div style="display:flex;gap:8px;align-items:center"><div class="progress" style="flex:1"><i style="width:${r.progress}%"></i></div><span class="mono" style="font-size:11.5px">${r.progress}%</span></div></td>
   <td><span class="badge ${stat(r.status).cls}">${stat(r.status).name}</span></td></tr>`).join('')}</tbody></table></div>`
 :`<div class="grid g2">${[
   ['Годовой отчёт подразделения','Шаблон 4-НИД: публикации, гранты, подготовка кадров. Автоподстановка из карточек работ.','file'],
   ['Отчёт по гранту (РНФ / МиОб)','Технический + финансовый отчёт, реестр результатов с привязкой к свидетельствам и статьям.','flask'],
   ['Анкета для рейтинга','Экспорт метрик: баллы за Scopus/WoS, цитирования, подготовка кадров — для внутреннего рейтинга кафедр.','chart'],
   ['Справка об участии в мероприятиях','Вытягивается из Контура 2 (сайт мероприятий): доклады, тезисы, организация — одним кликом.','calendar'],
 ].map(([t,d,i])=>`<div class="card"><h3>${ic(i)} ${t}</h3><p class="t-sub" style="line-height:1.6">${d}</p><button class="btn sm ghost tpl-use" style="margin-top:10px">${ic('plus')} Использовать шаблон</button></div>`).join('')}</div>`}`;
}
function csvExport(){
 const rows=[['Название','Тип','Подразделение','Руководитель','Статус','Год','Срок','Бюджет']];
 WORKS.forEach(w=>rows.push([w.title,wtype(w.type).name,dept(w.dept).name,person(w.lead).name,stat(w.status).name,w.year,w.due||'',w.budget||'']));
 const csv='\uFEFF'+rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(';')).join('\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='nauka-otchet-2026.csv';a.click();
}

/* ---------- Мероприятия (Контур 2) ---------- */
const SITE_EVENTS=[
 {t:'Всероссийская конференция «Медицина будущего»',d:'2026-11-18',pl:'Главный аудиторный корпус',st:'Регистрация открыта',c:'#2dd4a0',n:214},
 {t:'Школа молодого учёного: дизайн экспериментов',d:'2026-10-30',pl:'УЛК, ауд. 312',st:'Скоро',c:'#f5b74e',n:64},
 {t:'Семинар «Биоинформатика в клинической практике»',d:'2026-12-05',pl:'НИЛ БМЕ',st:'Сбор заявок',c:'#4f8cff',n:38},
 {t:'Конкурс студенческих НИР «Ломоносовские чтения»',d:'2027-01-22',pl:'Кафедра терапии',st:'Анонс',c:'#7c5cff',n:120},
];
function pageEvents(){
 return `<div class="card" style="display:flex;gap:12px;align-items:center;border-left:3px solid var(--accent)">
   ${ic('link')}<div><b>Данные синхронизируются с Контуром 2</b>
   <div class="t-sub">Сайт мероприятий: <a href="https://nauka-site-patfiz.waw0.amvera.tech" target="_blank">nauka-site-patfiz.waw0.amvera.tech</a> · API: GET /api/events</div></div>
   <button class="btn sm ghost" id="sync-ev" style="margin-left:auto">${ic('arrow')} Обновить</button></div>
 <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${SITE_EVENTS.map(e=>{
   const dd=new Date(e.d);const days=Math.round((dd-new Date())/864e5);
   return `<div class="card"><div style="display:flex;gap:14px;align-items:start">
    <div style="text-align:center;background:var(--panel2);border:1px solid var(--border);border-radius:12px;padding:9px 13px;flex-shrink:0">
      <div style="font-size:20px;font-weight:800;color:${e.c}">${dd.getDate()}</div>
      <div style="font-size:10.5px;color:var(--muted);text-transform:uppercase">${dd.toLocaleDateString('ru-RU',{month:'short'})}</div></div>
    <div style="min-width:0"><div style="font-weight:700;font-size:14px">${e.t}</div>
     <div class="t-sub" style="margin-top:3px">${e.pl}</div>
     <div style="margin-top:8px;display:flex;gap:7px;flex-wrap:wrap"><span class="badge" style="color:${e.c};border-color:${e.c}55;background:${e.c}12">${e.st}</span>
     <span class="pill-dept">${days>0?'через '+days+' дн.':'прошло'}</span><span class="pill-dept">${e.n} участников</span></div></div></div></div>`}).join('')}</div>`;
}

/* ---------- глобальные обработчики ---------- */
function bindGlobal(){
 document.addEventListener('click',e=>{
   const rt=e.target.closest('[data-rtab]');if(rt){state.reportTab=rt.dataset.rtab;renderPage();return}
   if(e.target.closest('.tpl-use')){toast('Шаблон скопирован в «Мои документы» (демо)');return}
   if(e.target.closest('#sync-ev')){toast('Синхронизация с Контуром 2 выполнена');return}
   const gen=e.target.closest('#gen-rep');if(gen){
     gen.disabled=true;gen.textContent='Формируем…';
     setTimeout(()=>{toast('Сводный отчёт 2026 готов — CSV выгружен');gen.disabled=false;
       gen.innerHTML=ic('download')+'Сформировать сводный отчёт';csvExport()},900);
   }
 });
}
