/* Демо-данные Контура 1 (в проде заменяются API FastAPI + PostgreSQL) */
const DEPTS = [
 {id:'d1',name:'Кафедра терапии',head:'акад. РАН Орлов В.П.',short:'Терапия'},
 {id:'d2',name:'Кафедра патологической физиологии',head:'проф. Смирнов А.И.',short:'Пат. физиол.'},
 {id:'d3',name:'Кафедра оперативной хирургии',head:'доц. Громова Е.С.',short:'Опер. хир.'},
 {id:'d4',name:'Кафедра фармакологии',head:'проф. Ветров Д.М.',short:'Фармакология'},
 {id:'d5',name:'НИЛ биомедицинской инженерии',head:'чл.-кор. РАН Лебедев К.О.',short:'НИЛ БМЕ'},
 {id:'d6',name:'Кафедра микробиологии',head:'доц. Соколова М.В.',short:'Микробиол.'},
];
const PEOPLE = [
 {id:'p1',name:'Иванов И.И.',deg:'д.м.н., проф.',dept:'d2'},
 {id:'p2',name:'Петрова А.С.',deg:'к.м.н., доц.',dept:'d1'},
 {id:'p3',name:'Сидоров В.К.',deg:'аспирант',dept:'d3'},
 {id:'p4',name:'Кузнецова М.Д.',deg:'к.б.н.',dept:'d4'},
 {id:'p5',name:'Морозов П.А.',deg:'ординатор',dept:'d5'},
 {id:'p6',name:'Фёдорова Л.Н.',deg:'д.м.н., проф.',dept:'d6'},
 {id:'p7',name:'Николаев С.С.',deg:'аспирант',dept:'d2'},
 {id:'p8',name:'Егорова Т.В.',deg:'науч. сотр.',dept:'d1'},
];
const WORK_TYPES=[
 {id:'article',name:'Публикация',icon:'book',color:'#4f8cff'},
 {id:'grant',name:'Грант / НИР',icon:'flask',color:'#7c5cff'},
 {id:'thesis',name:'Диссертация',icon:'cap',color:'#2dd4a0'},
 {id:'patent',name:'Изобретение / RI',icon:'shield',color:'#f5b74e'},
 {id:'event',name:'Мероприятие',icon:'calendar',color:'#f4645f'},
];
const STATUSES=[
 {id:'new',name:'Новая',cls:'b-muted',col:0},
 {id:'progress',name:'В работе',cls:'b-info',col:1},
 {id:'review',name:'На проверке',cls:'b-warn',col:2},
 {id:'done',name:'Завершена',cls:'b-ok',col:3},
];
const PRIOS={low:'Низкий',mid:'Средний',high:'Высокий'};

let WORKS = [
 {id:'w1',title:'Механизмы ремоделирования миокарда при хронической нагрузке',type:'article',dept:'d2',lead:'p1',status:'progress',prio:'high',year:2026,due:'2026-11-30',journal:'Российский физиологический журнал',scopus:true,cite:12,tags:['кардиология','эксперимент']},
 {id:'w2',title:'Грант РНФ №23-15-00412: нейроиммунные взаимодействия',type:'grant',dept:'d6',lead:'p6',status:'review',prio:'high',year:2026,due:'2026-12-15',budget:4800000,tags:['РНФ','нейроиммунология']},
 {id:'w3',title:'Диссертация: патогенез сепсиса у военных травм',type:'thesis',dept:'d3',lead:'p3',status:'progress',prio:'mid',year:2025,due:'2027-03-01',kind:'кандидатская',tags:['сепсис','травма']},
 {id:'w4',title:'Свидетельство RI 312xxxxx: устройство для мониторинга ЭКГ',type:'patent',dept:'d5',lead:'p5',status:'done',prio:'mid',year:2026,due:'2026-06-01',tags:['ЭКГ','прибор']},
 {id:'w5',title:'Публикация in vitro активность новых ингибиторов АХЭ',type:'article',dept:'d4',lead:'p4',status:'new',prio:'low',year:2026,journal:'Экспериментальная и клиническая фармакология',scopus:false,cite:0,tags:['фарм'],},
 {id:'w6',title:'Отчёт по НИР «Биоинженерные среды» (этап 2)',type:'grant',dept:'d5',lead:'p5',status:'review',prio:'mid',year:2026,budget:1200000,tags:['НИР','отчёт']},
 {id:'w7',title:'Диссертация: маркёры раннего нейродегенерации',type:'thesis',dept:'d1',lead:'p2',status:'progress',prio:'high',year:2024,due:'2026-12-20',kind:'докторская',tags:['маркёры']},
 {id:'w8',title:'Организация межвузовской конференции «Медицина будущего»',type:'event',dept:'d1',lead:'p8',status:'done',prio:'mid',year:2026,tags:['конференция'],link:'https://nauka-site-patfiz.waw0.amvera.tech'},
 {id:'w9',title:'Публикация: модели резистентности к антибиотикам',type:'article',dept:'d6',lead:'p6',status:'done',prio:'mid',year:2025,journal:'Antibiotics',scopus:true,cite:34,tags:['резистентность']},
 {id:'w10',title:'Грант Минобороны: адаптивная фармакотерапия',type:'grant',dept:'d4',lead:'p4',status:'new',prio:'high',year:2026,due:'2026-11-01',budget:2500000,tags:['МиОб','заявка']},
 {id:'w11',title:'Учебно-методическое пособие по патфизиологии',type:'patent',dept:'d2',lead:'p7',status:'progress',prio:'low',year:2026,tags:['методичка']},
 {id:'w12',title:'Публикация: телеметрический мониторинг в стационаре',type:'article',dept:'d5',lead:'p5',status:'review',prio:'mid',year:2026,journal:'Военно-медицинский журнал',scopus:false,cite:3,tags:['телеметрия']},
];

let REPORTS = [
 {id:'r1',title:'Годовой отчёт кафедры пат. физиологии — 2025',dept:'d2',year:2025,status:'done',progress:100,items:42},
 {id:'r2',title:'Отчёт о НИД за 1 полугодие 2026',dept:'d1',year:2026,status:'review',progress:80,items:57},
 {id:'r3',title:'Данные для рейтинга подразделения',dept:'d5',year:2026,status:'progress',progress:45,items:23},
 {id:'r4',title:'Отчёт по гранту РНФ (фин.)',dept:'d6',year:2026,status:'new',progress:10,items:12},
];

const PLAN_2026 = {
 d1:{pubs:30,grants:3,events:6}, d2:{pubs:24,grants:2,events:4},
 d3:{pubs:18,grants:1,events:3}, d4:{pubs:20,grants:2,events:4},
 d5:{pubs:15,grants:4,events:5}, d6:{pubs:22,grants:2,events:3},
};

const FEED=[
 {t:'Публикация принята к печати',s:'Иванов И.И. · Рос. физиол. журнал',ic:'book',c:'#4f8cff',when:'2 часа назад'},
 {t:'Грант РНФ отправлен на экспертизу',s:'Фёдорова Л.Н. · НИИ эпидемиологии',ic:'flask',c:'#7c5cff',when:'вчера'},
 {t:'Защищена диссертация',s:'Николаев С.С. · совет по патфизиологии',ic:'cap',c:'#2dd4a0',when:'3 дня назад'},
 {t:'Зарегистрировано изобретение',s:'Морозов П.А. · RI № 312xxxxx',ic:'shield',c:'#f5b74e',when:'на этой неделе'},
 {t:'Конференция «Медицина будущего» — 214 докладов',s:'Отдел науки · Контур мероприятий',ic:'calendar',c:'#f4645f',when:'2 недели назад'},
];
