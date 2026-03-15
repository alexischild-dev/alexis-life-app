import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "alexis_life_v4";
function loadData() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }
function todayKey() { return new Date().toISOString().slice(0,10); }
function monthKey() { return new Date().toISOString().slice(0,7); }
function getDayName() { return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()]; }
function getWeekStart(){
  const d=new Date();
  const day=d.getDay();
  const diff=d.getDate()-(day===0?6:day-1);
  const mon=new Date(d.setDate(diff));
  return mon.toISOString().slice(0,10);
}
function getGreeting() { const h=new Date().getHours(); return h<12?"good morning":h<17?"good afternoon":"good evening"; }
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_LONG=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const G={bg:"#faf7f2",bgCard:"#ffffff",bgCardAlt:"#f5f0ea",rose:"#c4725a",roseLight:"#e8a898",plum:"#8b6ba8",plumLight:"#b99fd4",gold:"#c49a4e",goldLight:"#d4b06a",sage:"#6a9470",sageLight:"#8ab894",moonBlue:"#6a86b8",dustyRose:"#c4806a",text:"#3a2e28",textMid:"#8a7060",textLight:"#b8a898",border:"#e8ddd4"};

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
::-webkit-scrollbar{display:none;}
body{background:${G.bg};font-family:'Jost',sans-serif;color:${G.text};overscroll-behavior:none;}
.cinzel{font-family:'Cinzel',serif;}
.crimson{font-family:'Crimson Pro',serif;}
@keyframes twinkle{0%,100%{opacity:0.15;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
.star{position:absolute;border-radius:50%;background:#c49a4e;animation:twinkle var(--dur,3s) ease-in-out infinite;animation-delay:var(--delay,0s);}
.shimmer-text{background:linear-gradient(90deg,${G.gold},${G.rose},${G.plum},${G.gold});background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite;}
input,textarea{font-family:'Jost',sans-serif;color:${G.text};}
input::placeholder,textarea::placeholder{color:${G.textLight};}
button{font-family:'Jost',sans-serif;}
`;

const DAILY_ANCHORS=[
  {id:"no_phone",label:"No phone for first 30 mins",icon:"📵",points:12,cat:"morning"},
  {id:"dressed",label:"Get dressed properly",icon:"👗",points:10,cat:"morning"},
  {id:"breakfast",label:"Eat breakfast before 10am",icon:"🍳",points:12,cat:"morning"},
  {id:"outside",label:"Get outside for 5 mins",icon:"🌿",points:10,cat:"morning"},
  {id:"water_first",label:"Drink water before coffee",icon:"💧",points:8,cat:"morning"},
  {id:"intention",label:"Set one intention for today",icon:"✨",points:10,cat:"morning"},
  {id:"wind_down",label:"Start wind-down by 10pm",icon:"🌙",points:12,cat:"evening"},
  {id:"for_me",label:"Do one thing just for me",icon:"💜",points:14,cat:"evening"},
  {id:"tidy_10",label:"10-min evening tidy",icon:"🏠",points:10,cat:"evening"},
  {id:"tomorrow",label:"One thing ready for tomorrow",icon:"🌟",points:8,cat:"evening"},
];

const CLEANING_SCHEDULE={
  Monday:{theme:"Quick Reset",color:G.sage,time:"10 mins",tasks:[{id:"m_dishes",label:"Dishwasher on / empty if full",icon:"🍽️",timer:5},{id:"m_kitchen",label:"Wipe kitchen surfaces",icon:"✨",timer:5},{id:"m_clutter",label:"Quick clutter sweep — one surface",icon:"🧹",timer:5},{id:"m_hallway",label:"Hallway — shoes away, quick wipe",icon:"🚪",timer:5}]},
  Tuesday:{theme:"Downstairs Focus",color:G.moonBlue,time:"15 mins",tasks:[{id:"t_dishes",label:"Dishwasher on / empty if full",icon:"🍽️",timer:5},{id:"t_surfaces",label:"Kitchen surfaces + hob wipe",icon:"✨",timer:7},{id:"t_toilet",label:"Downstairs toilet — quick clean",icon:"🚽",timer:8},{id:"t_clutter",label:"Living room clutter sweep",icon:"🧹",timer:5}]},
  Wednesday:{theme:"Mid-Week Reset",color:G.gold,time:"20–25 mins",tasks:[{id:"w_dishes",label:"Dishwasher on / empty if full",icon:"🍽️",timer:5},{id:"w_kitchen",label:"Kitchen deeper — sink, hob, microwave",icon:"🍳",timer:10},{id:"w_surfaces",label:"Wipe all downstairs surfaces",icon:"✨",timer:7},{id:"w_spare",label:"Spare room — 5 min timer only, one corner",icon:"📦",timer:5},{id:"w_bins",label:"Check bins — empty if needed",icon:"🗑️",timer:3}]},
  Thursday:{theme:"Light Day",color:G.dustyRose,time:"10 mins",tasks:[{id:"th_dishes",label:"Dishwasher on / empty if full",icon:"🍽️",timer:5},{id:"th_kitchen",label:"Kitchen wipe down",icon:"✨",timer:5},{id:"th_clutter",label:"One room — quick tidy, nothing more",icon:"🧹",timer:5}]},
  Friday:{theme:"Weekend Prep",color:G.plumLight,time:"15 mins",tasks:[{id:"f_dishes",label:"Dishwasher on / empty if full",icon:"🍽️",timer:5},{id:"f_kitchen",label:"Kitchen reset before the weekend",icon:"🍳",timer:7},{id:"f_living",label:"Living room — tidy and reset",icon:"🛋️",timer:8},{id:"f_bins",label:"Empty all bins",icon:"🗑️",timer:5}]},
  Saturday:{theme:"Big Clean Day 🌟",color:G.rose,time:"60–90 mins",tasks:[{id:"sa_dishes",label:"Dishwasher on / empty",icon:"🍽️",timer:5},{id:"sa_kitchen",label:"Kitchen deep clean — everything",icon:"🍳",timer:20},{id:"sa_bathroom",label:"Upstairs bathroom — full clean",icon:"🛁",timer:20},{id:"sa_hoov_dn",label:"Hoover downstairs",icon:"🧹",timer:15},{id:"sa_hoov_up",label:"Hoover upstairs + hallways",icon:"🧹",timer:15},{id:"sa_living",label:"Living room — dust + clean properly",icon:"🛋️",timer:15},{id:"sa_bedding",label:"Change bedding",icon:"🛏️",timer:15},{id:"sa_mop",label:"Mop kitchen + hallway floors",icon:"🪣",timer:15}]},
  Sunday:{theme:"Reset & Restore 🌙",color:G.plum,time:"45–60 mins",tasks:[{id:"su_bedroom",label:"Bedroom — proper tidy, not just surface",icon:"🛏️",timer:20},{id:"su_spare",label:"Spare room/office — 20 min timer, stop when done",icon:"📦",timer:20},{id:"su_garden",label:"Garden — tidy, sweep, water plants",icon:"🌱",timer:20},{id:"su_upstairs",label:"Upstairs hallway — sweep + wipe",icon:"🚪",timer:10},{id:"su_reset",label:"Reset house for the week — surfaces clear",icon:"✨",timer:10},{id:"su_laundry",label:"Put a wash on",icon:"👕",timer:5}]},
};

const MONTHLY_TASKS=[{id:"oven",label:"Clean the oven",icon:"🍳"},{id:"windows",label:"Clean windows inside",icon:"🪟"},{id:"fridge",label:"Clean out the fridge",icon:"❄️"},{id:"skirting",label:"Wipe skirting boards",icon:"🧹"},{id:"behind",label:"Clean behind furniture",icon:"🛋️"},{id:"switches",label:"Wipe light switches + handles",icon:"💡"}];

const MORNING_HABITS=[{id:"water_morning",label:"Drink water before phone",icon:"💧"},{id:"no_phone_30",label:"No phone for 30 mins after waking",icon:"📵"},{id:"breakfast_hab",label:"Eat breakfast",icon:"🍳"},{id:"sunlight",label:"Get natural light / go outside",icon:"☀️"},{id:"movement",label:"Move your body (any way)",icon:"🌿"},{id:"dressed_hab",label:"Get dressed / feel like yourself",icon:"🌸"},{id:"intention_hab",label:"Set 1–3 intentions for today",icon:"🌙"}];
const EVENING_HABITS=[{id:"tidy_10ev",label:"10-min tidy",icon:"🏠"},{id:"tomorrow_prep",label:"Prep for tomorrow",icon:"🌟"},{id:"screen_off",label:"Screens off 30 mins before bed",icon:"🌙"},{id:"journal_done",label:"Journal or brain dump",icon:"📖"},{id:"wind_down_hab",label:"Do something calming",icon:"🫧"},{id:"bed_time",label:"In bed by 11pm",icon:"💫"}];

const SENSORY_TOOLKIT=[{id:"cold_water",label:"Cold water on face or wrists",icon:"💧",cat:"grounding"},{id:"deep_breath",label:"4-7-8 breathing (4 in, 7 hold, 8 out)",icon:"🌬️",cat:"breathe"},{id:"weighted",label:"Weighted blanket or tight hug",icon:"🫂",cat:"body"},{id:"fidget",label:"Fidget tool or tactile object",icon:"🌀",cat:"body"},{id:"music",label:"Put headphones in — your safe music",icon:"🎵",cat:"sensory"},{id:"walk",label:"Short walk, even just outside the door",icon:"🌿",cat:"movement"},{id:"low_light",label:"Dim the lights, reduce noise",icon:"🕯️",cat:"environment"},{id:"mumford",label:"Cuddle Mumford",icon:"🐾",cat:"connection"},{id:"finn",label:"Tell Finn how you're feeling",icon:"💌",cat:"connection"},{id:"snack",label:"Eat something — blood sugar check",icon:"🍫",cat:"body"},{id:"body_scan",label:"Body scan — where is the tension?",icon:"✨",cat:"grounding"}];

const JOURNAL_PROMPTS=["What's one small thing that went well today?","What felt hard today, and why might that be?","What does my body need right now?","What am I proud of myself for recently?","What's taking up space in my head?","What would feel like a win tomorrow?","When did I feel most like myself today?","What am I grateful for, however small?","What patterns am I noticing in my mood?","What can I let go of today?","What does my nervous system need?","Write freely — no rules, just thoughts."];

const AFFIRMATIONS=["My brain works differently, not deficiently.","I am allowed to take up space.","Rest is not a reward — it's a requirement.","I am doing better than I give myself credit for.","My sensitivity is a superpower, not a flaw.","I don't need to earn my worth.","Progress is not linear and that's okay.","I am learning to be my own safe place.","Small steps still move me forward.","I am allowed to change my mind.","My needs are valid and worth meeting.","Today I choose gentleness with myself.","Other people's silence is rarely about me.","I got through every hard day so far — 100% record.","I am more than my to-do list."];

const MAX_SCORE=280;

function computeScore(key,s,customTasks){
  let score=0;
  const tasks=s.tasks[key]||{};
  DAILY_ANCHORS.forEach(t=>{if(tasks[t.id])score+=t.points;});
  const dayName=getDayName();
  const sched=CLEANING_SCHEDULE[dayName];
  if(sched)sched.tasks.forEach(t=>{if((s.cleanDone||{})[`${key}_${t.id}`])score+=8;});
  (customTasks||[]).forEach(t=>{if(t.days.includes(getDayName())&&(s.customDone||{})[`${key}_${t.id}`])score+=t.points||10;});
  Object.values(s.morningHabits[key]||{}).filter(Boolean).forEach(()=>{score+=6;});
  Object.values(s.eveningHabits[key]||{}).filter(Boolean).forEach(()=>{score+=6;});
  if(s.mood[key])score+=5;
  if((s.journal[key]||{}).text)score+=15;
  return score;
}

function StarField(){
  const stars=[
    {x:8,y:12},{x:22,y:28},{x:35,y:8},{x:48,y:22},{x:62,y:6},{x:75,y:18},{x:88,y:10},
    {x:15,y:45},{x:30,y:55},{x:45,y:40},{x:60,y:52},{x:72,y:38},{x:85,y:48},{x:5,y:65},
    {x:18,y:72},{x:38,y:80},{x:52,y:68},{x:66,y:78},{x:80,y:62},{x:92,y:75},{x:25,y:90},
    {x:55,y:88},{x:70,y:95},{x:10,y:88},{x:42,y:96},{x:90,y:88},{x:50,y:35},{x:78,y:85},
  ];
  const lines=[
    [0,3],[3,6],[1,4],[4,7],[2,5],[7,13],[13,14],[14,18],[18,20],[20,23],
    [9,10],[10,11],[11,16],[16,17],[6,12],[12,19],[19,22],[22,25],[8,15],[15,21],[21,24],
  ];
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      <svg width="100%" height="100%" style={{position:"absolute",inset:0}} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c49a4e" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#c49a4e" stopOpacity="0"/>
          </radialGradient>
        </defs>
        {lines.map((l,i)=>(
          <line key={i} x1={`${stars[l[0]].x}%`} y1={`${stars[l[0]].y}%`} x2={`${stars[l[1]].x}%`} y2={`${stars[l[1]].y}%`}
            stroke="#c49a4e" strokeWidth="0.12" strokeOpacity="0.18"/>
        ))}
        {stars.map((s,i)=>(
          <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={i%5===0?"0.55":i%3===0?"0.4":"0.28"}
            fill="#c49a4e" opacity={i%5===0?"0.7":i%3===0?"0.5":"0.35"}>
            <animate attributeName="opacity" values={i%5===0?"0.7;1;0.7":i%3===0?"0.5;0.8;0.5":"0.35;0.6;0.35"} dur={`${2.5+i*0.3}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </svg>
    </div>
  );
}

function Card({children,style}){return <div style={{background:G.bgCard,borderRadius:18,border:`1px solid ${G.border}`,marginBottom:12,overflow:"hidden",...style}}>{children}</div>;}
function CardHead({icon,title,accent,right}){return(<div style={{padding:"12px 18px 10px",borderBottom:`1px solid ${G.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:"1rem"}}>{icon}</span><span className="cinzel" style={{fontSize:"0.82rem",color:accent||G.gold,letterSpacing:"0.04em"}}>{title}</span></div>{right}</div>);}
function CardBody({children,style}){return <div style={{padding:"14px 18px",...style}}>{children}</div>;}
function ProgBar({pct,color,height=10}){return(<div style={{background:G.border,borderRadius:100,height,overflow:"hidden"}}><div style={{height:"100%",borderRadius:100,background:`linear-gradient(90deg,${color},${color}cc)`,width:`${Math.min(100,pct)}%`,transition:"width 0.6s ease",boxShadow:`0 0 8px ${color}66`}}/></div>);}
function PrimaryBtn({children,onClick,color}){return(<button onClick={onClick} style={{width:"100%",padding:"14px",borderRadius:14,border:`1px solid ${color}66`,background:`linear-gradient(135deg,${color}33,${color}11)`,color,fontSize:"0.9rem",fontWeight:600,cursor:"pointer",marginTop:10}}>{children}</button>);}
function SectionLabel({children}){return <div style={{fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.1em",color:G.textLight,marginBottom:8,marginTop:12}}>{children}</div>;}
function Toast({msg}){return msg?<div style={{position:"fixed",bottom:96,left:"50%",transform:"translateX(-50%)",background:G.bgCardAlt,border:`1px solid ${G.border}`,borderRadius:100,padding:"10px 20px",fontSize:"0.85rem",color:G.text,zIndex:200,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",whiteSpace:"nowrap"}}>{msg}</div>:null;}

function TimerBtn({minutes,onDone}){
  const [running,setRunning]=useState(false);
  const [left,setLeft]=useState(minutes*60);
  const ref=useRef(null);
  useEffect(()=>{if(running){ref.current=setInterval(()=>setLeft(t=>{if(t<=1){clearInterval(ref.current);setRunning(false);onDone&&onDone();return minutes*60;}return t-1;}),1000);}else clearInterval(ref.current);return()=>clearInterval(ref.current);},[running]);
  const m=Math.floor(left/60),s=left%60;
  return(<button onClick={()=>setRunning(r=>!r)} style={{flexShrink:0,padding:"5px 10px",borderRadius:100,border:`1px solid ${running?G.rose:G.border}`,background:running?`${G.rose}22`:"transparent",color:running?G.roseLight:G.textMid,fontSize:"0.68rem",fontWeight:600,cursor:"pointer",minWidth:52}}>{running?`${m}:${s.toString().padStart(2,"0")}`:`${minutes}m`}</button>);
}

function XpBar({score,streak}){
  const pct=Math.min(100,Math.round(score/MAX_SCORE*100));
  const level=score<50?1:score<100?2:score<160?3:score<220?4:5;
  const labels=["","Seedling 🌱","Growing 🌿","Blooming 🌸","Glowing ✨","Radiant 🌟"];
  return(
    <div style={{padding:"10px 16px 8px",background:"rgba(250,247,242,0.95)",borderBottom:`1px solid ${G.border}22`,position:"sticky",top:0,zIndex:50,backdropFilter:"blur(12px)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span className="cinzel" style={{fontSize:"0.7rem",color:G.gold,letterSpacing:"0.06em"}}>{labels[level]}</span>
          <span style={{fontSize:"0.65rem",color:G.textLight}}>· {score} XP today</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {streak>0&&<div style={{display:"flex",alignItems:"center",gap:4,background:`${G.gold}15`,border:`1px solid ${G.gold}33`,borderRadius:100,padding:"2px 10px"}}><span style={{fontSize:"0.75rem"}}>🔥</span><span style={{fontSize:"0.7rem",fontWeight:600,color:G.gold}}>{streak} day{streak!==1?"s":""}</span></div>}
          <span style={{fontSize:"0.65rem",color:G.textLight}}>{pct}%</span>
        </div>
      </div>
      <ProgBar pct={pct} color={G.gold} height={7}/>
    </div>
  );
}

function TodayScreen({state,update,toast,score,streak}){
  const key=todayKey();
  const now=new Date();
  const dayName=getDayName();
  const schedule=CLEANING_SCHEDULE[dayName];
  const tasks=state.tasks[key]||{};
  const mood=state.mood[key]||{};
  const customTasks=state.customTasks||[];
  const todayCustom=customTasks.filter(t=>t.days.includes(dayName));
  const morningAnchors=DAILY_ANCHORS.filter(t=>t.cat==="morning");
  const eveningAnchors=DAILY_ANCHORS.filter(t=>t.cat==="evening");
  const doneCount=DAILY_ANCHORS.filter(t=>tasks[t.id]).length;

  const [cleanOpen,setCleanOpen]=useState(false);
  const toggleTask=(id,pts)=>{const newT={...tasks,[id]:!tasks[id]};update({tasks:{...state.tasks,[key]:newT}});if(!tasks[id])toast(`+${pts} XP ✨`);};
  const toggleClean=(taskId)=>{const c={...(state.cleanDone||{})};const dk=`${key}_${taskId}`;c[dk]=!c[dk];update({cleanDone:c});if(c[dk])toast("+8 XP 🏠");};
  const toggleCustom=(taskId)=>{const c={...(state.customDone||{})};const dk=`${key}_${taskId}`;c[dk]=!c[dk];update({customDone:c});if(c[dk])toast("+10 XP ✅");};

  const moods=[{e:"😶‍🌫️",l:"foggy"},{e:"😔",l:"low"},{e:"😐",l:"okay"},{e:"🙂",l:"good"},{e:"✨",l:"great"}];

  const AnchorList=({anchors,color})=>(
    anchors.map((t,i)=>(
      <div key={t.id} onClick={()=>toggleTask(t.id,t.points)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:i<anchors.length-1?`1px solid ${G.border}`:"none",cursor:"pointer"}}>
        <div style={{width:36,height:36,borderRadius:10,flexShrink:0,border:`1.5px solid ${tasks[t.id]?color:G.border}`,background:tasks[t.id]?`${color}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",transition:"all 0.2s"}}>
          {tasks[t.id]?"✓":t.icon}
        </div>
        <div style={{flex:1,fontSize:"0.87rem",color:tasks[t.id]?G.textLight:G.text,textDecoration:tasks[t.id]?"line-through":"none"}}>{t.label}</div>
        <div style={{fontSize:"0.62rem",color,background:`${color}11`,border:`1px solid ${color}22`,borderRadius:100,padding:"2px 7px"}}>+{t.points}</div>
      </div>
    ))
  );

  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:"linear-gradient(160deg,#f5ede0 0%,#ede4f5 100%)",padding:"24px 20px 18px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,${G.plum}12 0%,transparent 70%)`}}/>
        <div style={{fontSize:"0.78rem",color:G.textMid,fontStyle:"italic",marginBottom:2,fontFamily:"'Crimson Pro',serif"}}>{getGreeting()}</div>
        <div className="cinzel shimmer-text" style={{fontSize:"1.5rem",fontWeight:600,marginBottom:2}}>{DAYS_LONG[now.getDay()]}, {MONTHS[now.getMonth()]} {now.getDate()}</div>
        <div style={{fontSize:"0.75rem",color:G.textMid,marginTop:4}}>{doneCount}/{DAILY_ANCHORS.length} anchors · {Math.round(doneCount/DAILY_ANCHORS.length*100)}% of today</div>
      </div>
      <XpBar score={score} streak={streak}/>
      <div style={{padding:"12px 16px 0"}}>

        <Card>
          <CardHead icon="🌡️" title="How are you right now?" accent={G.plumLight}/>
          <CardBody>
            <div style={{display:"flex",gap:6,justifyContent:"space-between",marginBottom:10}}>
              {moods.map(m=>(
                <button key={m.l} onClick={()=>{update({mood:{...state.mood,[key]:{...mood,mood:m.l}}});if(!mood.mood)toast("+5 XP 🌙");}} style={{flex:1,padding:"10px 4px",borderRadius:12,border:`1.5px solid ${mood.mood===m.l?G.plumLight:G.border}`,background:mood.mood===m.l?`${G.plum}33`:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all 0.2s"}}>
                  <div style={{fontSize:"1.3rem"}}>{m.e}</div>
                  <div style={{fontSize:"0.58rem",color:mood.mood===m.l?G.plumLight:G.textMid,fontWeight:600}}>{m.l}</div>
                </button>
              ))}
            </div>
            <div style={{borderTop:`1px solid ${G.border}`,paddingTop:10}}>
              <div style={{fontSize:"0.68rem",color:G.textLight,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Energy level</div>
              <div style={{display:"flex",gap:6}}>
                {[{l:"Low",e:"🔋",c:G.rose},{l:"Medium",e:"⚡",c:G.gold},{l:"High",e:"🚀",c:G.sage}].map(en=>(
                  <button key={en.l} onClick={()=>update({mood:{...state.mood,[key]:{...mood,energy:en.l}}})}
                    style={{flex:1,padding:"8px 4px",borderRadius:10,border:`1.5px solid ${mood.energy===en.l?en.c:G.border}`,background:mood.energy===en.l?`${en.c}22`:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.2s"}}>
                    <div style={{fontSize:"1rem"}}>{en.e}</div>
                    <div style={{fontSize:"0.58rem",color:mood.energy===en.l?en.c:G.textMid,fontWeight:600}}>{en.l}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <div style={{background:`linear-gradient(135deg,#f8f0e8,#f0e8f8)`,borderRadius:16,padding:"16px 18px",marginBottom:12,border:`1px solid ${G.gold}22`,textAlign:"center"}}>
          <div className="crimson" style={{fontSize:"1rem",color:G.goldLight,lineHeight:1.6,fontStyle:"italic"}}>"{AFFIRMATIONS[now.getDate()%AFFIRMATIONS.length]}"</div>
          <div style={{fontSize:"0.6rem",color:G.textLight,marginTop:6,letterSpacing:"0.1em",textTransform:"uppercase"}}>today's reminder</div>
        </div>

        <Card>
          <CardHead icon="🌅" title="Morning Anchors" accent={G.gold} right={<span style={{fontSize:"0.7rem",color:G.textLight}}>{morningAnchors.filter(t=>tasks[t.id]).length}/{morningAnchors.length}</span>}/>
          <div style={{padding:"6px 18px 4px"}}><ProgBar pct={Math.round(morningAnchors.filter(t=>tasks[t.id]).length/morningAnchors.length*100)} color={G.gold} height={5}/></div>
          <CardBody style={{padding:"4px 18px 10px"}}><AnchorList anchors={morningAnchors} color={G.gold}/></CardBody>
        </Card>

        {schedule?(
          <Card>
            <div onClick={()=>setCleanOpen(o=>!o)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px 10px",borderBottom:cleanOpen?`1px solid ${G.border}`:"none",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:"1rem"}}>🏠</span>
                <span className="cinzel" style={{fontSize:"0.82rem",color:schedule.color,letterSpacing:"0.04em"}}>{dayName} — {schedule.theme}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:"0.7rem",color:G.textLight}}>⏱ {schedule.time}</span>
                <span style={{fontSize:"0.65rem",color:G.textLight,background:G.bgCardAlt,borderRadius:100,padding:"2px 8px",border:`1px solid ${G.border}`}}>{schedule.tasks.filter(t=>(state.cleanDone||{})[`${key}_${t.id}`]).length}/{schedule.tasks.length} {cleanOpen?"▲":"▼"}</span>
              </div>
            </div>
            {cleanOpen&&<>
              <div style={{padding:"6px 18px 4px"}}><ProgBar pct={Math.round(schedule.tasks.filter(t=>(state.cleanDone||{})[`${key}_${t.id}`]).length/schedule.tasks.length*100)} color={schedule.color} height={5}/></div>
              <CardBody style={{padding:"4px 18px 10px"}}>
                {schedule.tasks.map((t,i)=>{
                  const done=!!(state.cleanDone||{})[`${key}_${t.id}`];
                  return(
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:i<schedule.tasks.length-1?`1px solid ${G.border}`:"none"}}>
                      <div onClick={()=>toggleClean(t.id)} style={{width:36,height:36,borderRadius:10,flexShrink:0,border:`1.5px solid ${done?schedule.color:G.border}`,background:done?`${schedule.color}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",cursor:"pointer",transition:"all 0.2s"}}>{done?"✓":t.icon}</div>
                      <div style={{flex:1,fontSize:"0.87rem",color:done?G.textLight:G.text,textDecoration:done?"line-through":"none",cursor:"pointer"}} onClick={()=>toggleClean(t.id)}>{t.label}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{fontSize:"0.62rem",color:schedule.color,background:`${schedule.color}11`,border:`1px solid ${schedule.color}22`,borderRadius:100,padding:"2px 7px"}}>+8</div>
                        <TimerBtn minutes={t.timer} onDone={()=>toast(`⏰ ${t.timer} mins up!`)}/>
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </>}
          </Card>
        ):(
          <div style={{background:`${G.plum}08`,borderRadius:16,padding:"16px 18px",marginBottom:12,border:`1px solid ${G.plum}18`,textAlign:"center"}}>
            <div style={{fontSize:"1.5rem",marginBottom:6}}>🌙</div>
            <div className="cinzel" style={{fontSize:"0.9rem",color:G.plumLight,marginBottom:4}}>Rest day</div>
            <div style={{fontSize:"0.78rem",color:G.textMid,lineHeight:1.6}}>No cleaning today. Check the House tab if you're feeling it — otherwise genuinely rest.</div>
          </div>
        )}

        {todayCustom.length>0&&(
          <Card>
            <CardHead icon="📋" title="Your Tasks Today" accent={G.sage}/>
            <CardBody style={{padding:"4px 18px 10px"}}>
              {todayCustom.map((t,i)=>{
                const done=!!(state.customDone||{})[`${key}_${t.id}`];
                return(
                  <div key={t.id} onClick={()=>toggleCustom(t.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:i<todayCustom.length-1?`1px solid ${G.border}`:"none",cursor:"pointer"}}>
                    <div style={{width:36,height:36,borderRadius:10,flexShrink:0,border:`1.5px solid ${done?G.sage:G.border}`,background:done?`${G.sage}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",transition:"all 0.2s"}}>{done?"✓":t.icon||"✅"}</div>
                    <div style={{flex:1,fontSize:"0.87rem",color:done?G.textLight:G.text,textDecoration:done?"line-through":"none"}}>{t.label}</div>
                    <div style={{fontSize:"0.62rem",color:G.sage,background:`${G.sage}11`,border:`1px solid ${G.sage}22`,borderRadius:100,padding:"2px 7px"}}>+{t.points||10}</div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHead icon="🌙" title="Evening Anchors" accent={G.plumLight} right={<span style={{fontSize:"0.7rem",color:G.textLight}}>{eveningAnchors.filter(t=>tasks[t.id]).length}/{eveningAnchors.length}</span>}/>
          <div style={{padding:"6px 18px 4px"}}><ProgBar pct={Math.round(eveningAnchors.filter(t=>tasks[t.id]).length/eveningAnchors.length*100)} color={G.plumLight} height={5}/></div>
          <CardBody style={{padding:"4px 18px 10px"}}><AnchorList anchors={eveningAnchors} color={G.plumLight}/></CardBody>
        </Card>

        <div style={{background:`linear-gradient(135deg,${G.gold}15,${G.plum}08)`,borderRadius:16,padding:"16px 18px",marginBottom:12,border:`1px solid ${G.gold}22`,display:"flex",alignItems:"center",gap:16}}>
          <div style={{textAlign:"center",minWidth:60}}>
            <div className="cinzel" style={{fontSize:"2rem",color:G.gold,lineHeight:1}}>{score}</div>
            <div style={{fontSize:"0.58rem",color:G.textLight,textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>today's XP</div>
          </div>
          <div style={{flex:1}}>
            <ProgBar pct={Math.min(100,Math.round(score/MAX_SCORE*100))} color={G.gold}/>
            <div style={{fontSize:"0.7rem",color:G.textMid,marginTop:6}}>{score<60?"Keep going, every tick counts 💜":score<130?"You're doing great today ✨":score<200?"Incredible effort today 🌟":"Absolutely smashing it 🏆"}</div>
          </div>
        </div>

        <Card>
          <CardHead icon="💛" title="Daily Win" accent={G.gold}/>
          <CardBody>
            <div style={{fontSize:"0.78rem",color:G.textMid,marginBottom:8,lineHeight:1.6}}>What's one thing you did well today? However small.</div>
            <textarea
              value={state.dailyWin[key]||""}
              onChange={e=>update({dailyWin:{...state.dailyWin,[key]:e.target.value}})}
              placeholder="Something small counts. Ate breakfast. Showed up. Drank water."
              style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${G.border}`,fontSize:"0.85rem",background:"#fdf9f5",color:G.text,resize:"none",outline:"none",minHeight:80,lineHeight:1.7}}/>
          </CardBody>
        </Card>

        <Card>
          <CardHead icon="💪" title="Workouts This Week" accent={G.sage}/>
          <CardBody>
            <div style={{display:"flex",gap:6}}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day,i)=>{
                const wk=`workout_${getWeekStart()}_${day}`;
                const done=!!(state.workoutDone||{})[wk];
                const isToday=new Date().getDay()===(i===6?0:i+1);
                return(
                  <div key={day} onClick={()=>{
                    const wd={...(state.workoutDone||{})};
                    wd[wk]=!done;
                    update({workoutDone:wd});
                    if(!done)toast("💪 Workout logged!");
                  }} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
                    <div style={{width:"100%",aspectRatio:"1",borderRadius:8,border:`1.5px solid ${done?G.sage:isToday?G.gold:G.border}`,background:done?`${G.sage}22`:isToday?`${G.gold}11`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.9rem",transition:"all 0.2s"}}>
                      {done?"✓":"·"}
                    </div>
                    <div style={{fontSize:"0.58rem",color:isToday?G.gold:G.textLight,fontWeight:isToday?600:400}}>{day}</div>
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:"0.7rem",color:G.textMid,marginTop:10,textAlign:"center"}}>
              {(()=>{const count=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].filter(day=>!!(state.workoutDone||{})[`workout_${getWeekStart()}_${day}`]).length;return count===0?"Tap a day to log a workout 🌿":count===1?"1 session this week — great start ✨":`${count} sessions this week 💪`;})()}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function HouseScreen({state,update,toast}){
  const [tab,setTab]=useState("week");
  const key=todayKey();
  const mKey=monthKey();
  const dayName=getDayName();
  const weekDays=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const toggleClean=(taskId)=>{const c={...(state.cleanDone||{})};const dk=`${key}_${taskId}`;c[dk]=!c[dk];update({cleanDone:c});if(c[dk])toast("🏠 Done! +8 XP");};
  const toggleMonthly=(id)=>{const c={...(state.cleanDone||{})};const mk=`${mKey}_${id}`;c[mk]=!c[mk];update({cleanDone:c});if(c[mk])toast("⭐ Monthly job done!");};
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:"linear-gradient(160deg,#e8f0e4 0%,#f5f0ea 100%)",padding:"28px 20px 20px"}}>
        <div style={{fontSize:"2rem",marginBottom:6}}>🏠</div>
        <div className="cinzel shimmer-text" style={{fontSize:"1.4rem",fontWeight:600,marginBottom:4}}>Your Home</div>
        <div style={{fontSize:"0.78rem",color:G.textMid,lineHeight:1.6}}>Small consistent effort beats the big overwhelming clean.</div>
      </div>
      <div style={{padding:"12px 16px 0"}}>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[{id:"week",label:"📅 Full Week"},{id:"monthly",label:"⭐ Monthly"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px 4px",borderRadius:12,border:`1px solid ${tab===t.id?G.sage:G.border}`,background:tab===t.id?`${G.sage}22`:"transparent",color:tab===t.id?G.sageLight:G.textMid,fontSize:"0.75rem",fontWeight:600,cursor:"pointer"}}>{t.label}</button>
          ))}
        </div>
        {tab==="week"&&weekDays.map(day=>{
          const sched=CLEANING_SCHEDULE[day];
          if(!sched)return null;
          const isToday=day===dayName;
          const todayDone=sched.tasks.filter(t=>(state.cleanDone||{})[`${key}_${t.id}`]).length;
          return(
            <Card key={day} style={{border:isToday?`1px solid ${sched.color}44`:undefined}}>
              <div style={{padding:"12px 18px 10px",background:G.bgCardAlt,borderBottom:`1px solid ${G.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div className="cinzel" style={{fontSize:"0.85rem",color:isToday?sched.color:G.text}}>{isToday?"⭐ Today — ":""}{day}</div>
                  <div style={{fontSize:"0.7rem",color:G.textMid}}>{sched.theme} · {sched.time}</div>
                </div>
                {isToday&&<div style={{fontSize:"0.7rem",color:sched.color,fontWeight:600,background:`${sched.color}11`,border:`1px solid ${sched.color}22`,borderRadius:100,padding:"3px 10px"}}>{todayDone}/{sched.tasks.length} done</div>}
              </div>
              <CardBody style={{padding:"6px 18px"}}>
                {sched.tasks.map((t,i)=>{
                  const done=isToday?!!(state.cleanDone||{})[`${key}_${t.id}`]:false;
                  return(
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<sched.tasks.length-1?`1px solid ${G.border}`:"none",cursor:isToday?"pointer":"default",opacity:isToday?1:0.7}} onClick={()=>isToday&&toggleClean(t.id)}>
                      {isToday?<div style={{width:28,height:28,borderRadius:8,flexShrink:0,border:`1.5px solid ${done?sched.color:G.border}`,background:done?`${sched.color}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.85rem",transition:"all 0.2s"}}>{done?"✓":t.icon}</div>:<span style={{fontSize:"0.85rem",width:28,textAlign:"center",flexShrink:0}}>{t.icon}</span>}
                      <div style={{flex:1,fontSize:"0.83rem",color:done?G.textLight:G.textMid,textDecoration:done?"line-through":"none"}}>{t.label}</div>
                      <span style={{fontSize:"0.68rem",color:G.textLight,flexShrink:0}}>{t.timer}m</span>
                      {isToday&&<TimerBtn minutes={t.timer} onDone={()=>toast(`⏰ ${t.timer} mins up!`)}/>}
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          );
        })}
        {tab==="monthly"&&(
          <>
            <div style={{fontSize:"0.78rem",color:G.textMid,marginBottom:12,fontStyle:"italic",lineHeight:1.6}}>Once this month — no specific day needed. Tap to tick off 🌿</div>
            <Card><CardBody style={{padding:"8px 18px"}}>
              {MONTHLY_TASKS.map((t,i)=>{
                const done=!!(state.cleanDone||{})[`${mKey}_${t.id}`];
                return(
                  <div key={t.id} onClick={()=>toggleMonthly(t.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<MONTHLY_TASKS.length-1?`1px solid ${G.border}`:"none",cursor:"pointer"}}>
                    <div style={{width:36,height:36,borderRadius:10,flexShrink:0,border:`1.5px solid ${done?G.gold:G.border}`,background:done?`${G.gold}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",transition:"all 0.2s"}}>{done?"✓":t.icon}</div>
                    <div style={{flex:1,fontSize:"0.87rem",color:done?G.textLight:G.text,textDecoration:done?"line-through":"none"}}>{t.label}</div>
                    {done&&<span style={{fontSize:"0.65rem",color:G.gold,fontWeight:600}}>✓ Done</span>}
                  </div>
                );
              })}
            </CardBody></Card>
          </>
        )}
      </div>
    </div>
  );
}

function MindScreen({state,update,toast}){
  const [tab,setTab]=useState("morning");
  const key=todayKey();
  const morningDone=state.morningHabits[key]||{};
  const eveningDone=state.eveningHabits[key]||{};
  const sensoryDone=state.sensoryLog[key]||{};
  const HabitList=({habits,done,onToggle,color})=>(
    <Card><CardBody style={{padding:"8px 18px"}}>{habits.map((h,i)=>(
      <div key={h.id} onClick={()=>onToggle(h.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:i<habits.length-1?`1px solid ${G.border}`:"none",cursor:"pointer"}}>
        <div style={{width:36,height:36,borderRadius:10,flexShrink:0,border:`1.5px solid ${done[h.id]?color:G.border}`,background:done[h.id]?`${color}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",transition:"all 0.2s"}}>{done[h.id]?"✓":h.icon}</div>
        <div style={{flex:1,fontSize:"0.88rem",color:done[h.id]?G.textLight:G.text,textDecoration:done[h.id]?"line-through":"none"}}>{h.label}</div>
        <div style={{fontSize:"0.62rem",color,background:`${color}11`,border:`1px solid ${color}22`,borderRadius:100,padding:"2px 7px"}}>+6</div>
      </div>
    ))}</CardBody></Card>
  );
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:"linear-gradient(160deg,#ede8f8 0%,#f8f0ea 100%)",padding:"28px 20px 20px"}}>
        <div style={{fontSize:"2rem",marginBottom:6}}>🌙</div>
        <div className="cinzel shimmer-text" style={{fontSize:"1.4rem",fontWeight:600,marginBottom:4}}>Mind & Soul</div>
        <div style={{fontSize:"0.78rem",color:G.textMid,lineHeight:1.6}}>Daily rituals for a regulated nervous system.</div>
      </div>
      <div style={{padding:"12px 16px 0"}}>
        <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
          {[{id:"morning",label:"🌅 Morning"},{id:"evening",label:"🌙 Evening"},{id:"sensory",label:"🫧 Sensory"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flexShrink:0,padding:"8px 14px",borderRadius:100,border:`1px solid ${tab===t.id?G.plumLight:G.border}`,background:tab===t.id?`${G.plum}33`:"transparent",color:tab===t.id?G.plumLight:G.textMid,fontSize:"0.72rem",fontWeight:600,cursor:"pointer"}}>{t.label}</button>
          ))}
        </div>
        {tab==="morning"&&<>
          <div style={{background:`linear-gradient(135deg,#fdf8f0,#f8f5e8)`,borderRadius:18,padding:"16px 18px",marginBottom:12,border:`1px solid ${G.gold}22`}}>
            <div className="cinzel" style={{color:G.goldLight,fontSize:"0.85rem",marginBottom:4}}>✨ Morning Ritual</div>
            <div style={{fontSize:"0.78rem",color:G.textMid,lineHeight:1.6,marginBottom:8}}>These habits help regulate your nervous system before the day asks anything of you.</div>
            <ProgBar pct={Math.round(Object.values(morningDone).filter(Boolean).length/MORNING_HABITS.length*100)} color={G.gold}/>
            <div style={{fontSize:"0.65rem",color:G.textLight,marginTop:4}}>{Object.values(morningDone).filter(Boolean).length}/{MORNING_HABITS.length} done · +{Object.values(morningDone).filter(Boolean).length*6} XP</div>
          </div>
          <HabitList habits={MORNING_HABITS} done={morningDone} onToggle={id=>{const d={...morningDone,[id]:!morningDone[id]};update({morningHabits:{...state.morningHabits,[key]:d}});if(d[id])toast("+6 XP 🌅");}} color={G.gold}/>
        </>}
        {tab==="evening"&&<>
          <div style={{background:`linear-gradient(135deg,#f0ecf8,#ece8f8)`,borderRadius:18,padding:"16px 18px",marginBottom:12,border:`1px solid ${G.plumLight}22`}}>
            <div className="cinzel" style={{color:G.plumLight,fontSize:"0.85rem",marginBottom:4}}>🌙 Wind-Down Ritual</div>
            <div style={{fontSize:"0.78rem",color:G.textMid,lineHeight:1.6,marginBottom:8}}>Gentle transitions help your nervous system shift from doing to resting.</div>
            <ProgBar pct={Math.round(Object.values(eveningDone).filter(Boolean).length/EVENING_HABITS.length*100)} color={G.plumLight}/>
            <div style={{fontSize:"0.65rem",color:G.textLight,marginTop:4}}>{Object.values(eveningDone).filter(Boolean).length}/{EVENING_HABITS.length} done · +{Object.values(eveningDone).filter(Boolean).length*6} XP</div>
          </div>
          <HabitList habits={EVENING_HABITS} done={eveningDone} onToggle={id=>{const d={...eveningDone,[id]:!eveningDone[id]};update({eveningHabits:{...state.eveningHabits,[key]:d}});if(d[id])toast("+6 XP 🌙");}} color={G.plumLight}/>
        </>}
        {tab==="sensory"&&<>
          <div style={{background:`linear-gradient(135deg,#eef8f0,#f0f8ee)`,borderRadius:18,padding:"16px 18px",marginBottom:12,border:`1px solid ${G.sage}22`}}>
            <div className="cinzel" style={{color:G.sageLight,fontSize:"0.85rem",marginBottom:6}}>🫧 Sensory Toolkit</div>
            <div style={{fontSize:"0.78rem",color:G.textMid,lineHeight:1.7}}>When your nervous system is overwhelmed. Just one tool. Start small.</div>
          </div>
          <Card>
            <CardHead icon="🌡️" title="Nervous System Check" accent={G.plum}/>
            <CardBody>
              <div style={{display:"flex",gap:6}}>
                {["😌 Calm","😤 Tense","😰 Anxious","🌊 Flooded"].map((s,i)=>{
                  const cols=[G.sage,G.gold,G.rose,G.plum];const cur=(state.sensoryLog[key]||{})._state;
                  return <button key={s} onClick={()=>update({sensoryLog:{...state.sensoryLog,[key]:{...(state.sensoryLog[key]||{}),_state:s}}})} style={{flex:1,padding:"8px 4px",borderRadius:10,fontSize:"0.63rem",border:`1px solid ${cur===s?cols[i]:G.border}`,background:cur===s?`${cols[i]}22`:"transparent",color:cur===s?cols[i]:G.textMid,cursor:"pointer",lineHeight:1.4}}>{s}</button>;
                })}
              </div>
            </CardBody>
          </Card>
          <Card><CardHead icon="🛠️" title="Your Tools" accent={G.sage}/><CardBody style={{padding:"8px 18px"}}>
            {SENSORY_TOOLKIT.map((tool,i)=>{
              const done=!!sensoryDone[tool.id];
              return(
                <div key={tool.id} onClick={()=>{const d={...sensoryDone,[tool.id]:!done};update({sensoryLog:{...state.sensoryLog,[key]:d}});if(!done)toast("💜 Logged.");}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:i<SENSORY_TOOLKIT.length-1?`1px solid ${G.border}`:"none",cursor:"pointer"}}>
                  <div style={{width:36,height:36,borderRadius:10,flexShrink:0,border:`1.5px solid ${done?G.sage:G.border}`,background:done?`${G.sage}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",transition:"all 0.2s"}}>{done?"✓":tool.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"0.87rem",color:done?G.textLight:G.text,textDecoration:done?"line-through":"none"}}>{tool.label}</div>
                    <div style={{fontSize:"0.62rem",padding:"1px 8px",borderRadius:100,display:"inline-block",marginTop:3,background:`${G.sage}11`,color:G.sage,fontWeight:600}}>{tool.cat}</div>
                  </div>
                </div>
              );
            })}
          </CardBody></Card>
        </>}
      </div>
    </div>
  );
}

function JournalScreen({state,update,toast}){
  const key=todayKey();
  const now=new Date();
  const journalData=state.journal[key]||{text:"",gratitude:"",intention:""};
  const evidence=state.evidence||[];
  const [evidenceInput,setEvidenceInput]=useState("");
  const [tab,setTab]=useState("journal");
  const saveJournal=(field,val)=>update({journal:{...state.journal,[key]:{...journalData,[field]:val}}});
  const addEvidence=()=>{if(!evidenceInput.trim())return;const entry={text:evidenceInput,date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short"})};update({evidence:[entry,...evidence]});setEvidenceInput("");toast("+15 XP 💛");};
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:"linear-gradient(160deg,#f8ede4 0%,#f5f0ea 100%)",padding:"28px 20px 20px"}}>
        <div style={{fontSize:"2rem",marginBottom:6}}>📖</div>
        <div className="cinzel shimmer-text" style={{fontSize:"1.4rem",fontWeight:600,marginBottom:4}}>Journal</div>
        <div style={{fontSize:"0.78rem",color:G.textMid,lineHeight:1.6}}>Your private space. No rules, just you.</div>
      </div>
      <div style={{padding:"12px 16px 0"}}>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[{id:"journal",label:"📖 Today"},{id:"evidence",label:"💛 Evidence Locker"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px 4px",borderRadius:12,border:`1px solid ${tab===t.id?G.gold:G.border}`,background:tab===t.id?`${G.gold}22`:"transparent",color:tab===t.id?G.goldLight:G.textMid,fontSize:"0.75rem",fontWeight:600,cursor:"pointer"}}>{t.label}</button>
          ))}
        </div>
        {tab==="journal"&&<>
          <div style={{background:`linear-gradient(135deg,#f8f0e8,#f0e8f8)`,borderRadius:18,padding:"18px",marginBottom:12,border:`1px solid ${G.gold}33`,textAlign:"center"}}>
            <div className="crimson" style={{fontSize:"1.05rem",color:G.goldLight,lineHeight:1.6,fontStyle:"italic"}}>"{AFFIRMATIONS[now.getDate()%AFFIRMATIONS.length]}"</div>
            <div style={{fontSize:"0.6rem",color:G.textLight,marginTop:8,letterSpacing:"0.1em",textTransform:"uppercase"}}>Today's affirmation</div>
          </div>
          <Card>
            <CardHead icon="📖" title="Daily Journal" accent={G.gold} right={<span style={{fontSize:"0.65rem",color:G.gold}}>+15 XP</span>}/>
            <CardBody>
              <SectionLabel>Today's prompt</SectionLabel>
              <div style={{background:`${G.plum}22`,borderRadius:10,padding:"10px 14px",fontSize:"0.83rem",color:G.plumLight,lineHeight:1.6,marginBottom:12,border:`1px solid ${G.plum}44`,fontStyle:"italic"}}>💭 {JOURNAL_PROMPTS[now.getDate()%JOURNAL_PROMPTS.length]}</div>
              <textarea value={journalData.text||""} onChange={e=>saveJournal("text",e.target.value)} placeholder="Write freely here..." style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${G.border}`,fontSize:"0.85rem",background:"#fdf9f5",color:G.text,resize:"none",outline:"none",minHeight:120,lineHeight:1.7}}/>
              <SectionLabel>One thing I'm grateful for</SectionLabel>
              <textarea value={journalData.gratitude||""} onChange={e=>saveJournal("gratitude",e.target.value)} placeholder="However small — it counts..." style={{width:"100%",padding:"10px 14px",borderRadius:12,border:`1.5px solid ${G.border}`,fontSize:"0.85rem",background:"#fdf9f5",color:G.text,resize:"none",outline:"none",minHeight:70,lineHeight:1.7}}/>
              <SectionLabel>My intention for today</SectionLabel>
              <textarea value={journalData.intention||""} onChange={e=>saveJournal("intention",e.target.value)} placeholder="One word, one feeling, one focus..." style={{width:"100%",padding:"10px 14px",borderRadius:12,border:`1.5px solid ${G.border}`,fontSize:"0.85rem",background:"#fdf9f5",color:G.text,resize:"none",outline:"none",minHeight:60,lineHeight:1.7}}/>
              <PrimaryBtn onClick={()=>toast("💫 Saved ✨")} color={G.gold}>Save Entry ✨</PrimaryBtn>
            </CardBody>
          </Card>
        </>}
        {tab==="evidence"&&<>
          <div style={{background:`linear-gradient(135deg,#fdf8f0,#fdf5ec)`,borderRadius:18,padding:"16px 18px",marginBottom:12,border:`1px solid ${G.gold}22`}}>
            <div className="cinzel" style={{color:G.goldLight,fontSize:"0.85rem",marginBottom:6}}>💛 Evidence Locker</div>
            <div style={{fontSize:"0.78rem",color:G.textMid,lineHeight:1.7}}>Proof that you're doing okay. When the "everyone hates me" feeling hits, open this. These are real moments, not opinions — and they don't lie.</div>
          </div>
          <Card>
            <CardHead icon="+" title="Add New Evidence" accent={G.gold} right={<span style={{fontSize:"0.65rem",color:G.gold}}>+15 XP</span>}/>
            <CardBody>
              <textarea value={evidenceInput} onChange={e=>setEvidenceInput(e.target.value)} placeholder="Something kind someone said… a task you finished… a hard day you got through…" style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${G.border}`,fontSize:"0.85rem",background:"#fdf9f5",color:G.text,resize:"none",outline:"none",minHeight:90,lineHeight:1.7}}/>
              <PrimaryBtn onClick={addEvidence} color={G.gold}>Add to my evidence 💛</PrimaryBtn>
            </CardBody>
          </Card>
          {evidence.length===0&&<div style={{textAlign:"center",padding:"32px 20px",color:G.textMid}}><div style={{fontSize:"2rem",marginBottom:8}}>💛</div><div style={{fontSize:"0.82rem",lineHeight:1.7}}>Your evidence locker is empty. Add your first entry above.</div></div>}
          {evidence.map((e,i)=>(
            <div key={i} style={{background:`${G.gold}08`,borderRadius:14,padding:"14px 16px",marginBottom:8,border:`1px solid ${G.gold}18`}}>
              <div className="crimson" style={{fontSize:"0.95rem",color:G.goldLight,lineHeight:1.5,fontStyle:"italic"}}>"{e.text}"</div>
              <div style={{fontSize:"0.65rem",color:G.textLight,marginTop:6}}>{e.date}</div>
            </div>
          ))}
        </>}
      </div>
    </div>
  );
}

function SettingsScreen({state,update,toast,resetApp}){
  const [confirmClear,setConfirmClear]=useState(false);
  const [newTask,setNewTask]=useState({label:"",icon:"✅",days:[],points:10});
  const [adding,setAdding]=useState(false);
  const customTasks=state.customTasks||[];
  const weekDays=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const iconOptions=["✅","🌿","🪴","💊","📚","🐾","🗑️","🧺","📦","🧹","🪥","🛒","📞","💌","🌱","⭐","🎯","🫧"];
  const addCustomTask=()=>{if(!newTask.label.trim()||newTask.days.length===0){toast("Add a name and at least one day");return;}const task={...newTask,id:`custom_${Date.now()}`};update({customTasks:[...customTasks,task]});setNewTask({label:"",icon:"✅",days:[],points:10});setAdding(false);toast("✅ Task added!");};
  const removeTask=(id)=>{update({customTasks:customTasks.filter(t=>t.id!==id)});toast("Removed");};
  const toggleDay=(day)=>setNewTask(t=>({...t,days:t.days.includes(day)?t.days.filter(d=>d!==day):[...t.days,day]}));
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:"linear-gradient(160deg,#ede8f8 0%,#f5f0ea 100%)",padding:"28px 20px 20px"}}>
        <div style={{fontSize:"2rem",marginBottom:6}}>⚙️</div>
        <div className="cinzel shimmer-text" style={{fontSize:"1.4rem",fontWeight:600,marginBottom:4}}>Settings</div>
        <div style={{fontSize:"0.78rem",color:G.textMid}}>Customise your app.</div>
      </div>
      <div style={{padding:"12px 16px 0"}}>
        <Card>
          <CardHead icon="📋" title="Custom Recurring Tasks" accent={G.sage}/>
          <CardBody>
            <div style={{fontSize:"0.78rem",color:G.textMid,lineHeight:1.6,marginBottom:14}}>Add things like watering plants, medication, bins — they'll appear on Today automatically on the right days.</div>
            {customTasks.length>0&&<div style={{marginBottom:14}}>{customTasks.map((t,i)=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<customTasks.length-1?`1px solid ${G.border}`:"none"}}>
                <span style={{fontSize:"1.2rem"}}>{t.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:"0.87rem"}}>{t.label}</div>
                  <div style={{fontSize:"0.65rem",color:G.textMid,marginTop:2}}>{t.days.join(", ")} · +{t.points} XP</div>
                </div>
                <button onClick={()=>removeTask(t.id)} style={{padding:"4px 10px",borderRadius:8,border:`1px solid ${G.rose}44`,background:"transparent",color:G.rose,fontSize:"0.7rem",cursor:"pointer"}}>Remove</button>
              </div>
            ))}</div>}
            {adding?(
              <div style={{background:G.bgCardAlt,borderRadius:14,padding:"14px",border:`1px solid ${G.border}`}}>
                <SectionLabel>Task name</SectionLabel>
                <input value={newTask.label} onChange={e=>setNewTask(t=>({...t,label:e.target.value}))} placeholder="e.g. Water the plants" style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${G.border}`,fontSize:"0.85rem",background:G.bg,color:G.text,outline:"none",marginBottom:10}}/>
                <SectionLabel>Icon</SectionLabel>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{iconOptions.map(icon=>(<button key={icon} onClick={()=>setNewTask(t=>({...t,icon}))} style={{width:36,height:36,borderRadius:8,border:`1.5px solid ${newTask.icon===icon?G.sage:G.border}`,background:newTask.icon===icon?`${G.sage}22`:"transparent",fontSize:"1.1rem",cursor:"pointer"}}>{icon}</button>))}</div>
                <SectionLabel>Repeat on</SectionLabel>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>{weekDays.map(day=>(<button key={day} onClick={()=>toggleDay(day)} style={{padding:"5px 10px",borderRadius:100,border:`1px solid ${newTask.days.includes(day)?G.sage:G.border}`,background:newTask.days.includes(day)?`${G.sage}22`:"transparent",color:newTask.days.includes(day)?G.sageLight:G.textMid,fontSize:"0.68rem",fontWeight:600,cursor:"pointer"}}>{day.slice(0,3)}</button>))}</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={addCustomTask} style={{flex:2,padding:"10px",borderRadius:12,border:`1px solid ${G.sage}`,background:`${G.sage}22`,color:G.sageLight,fontSize:"0.82rem",fontWeight:600,cursor:"pointer"}}>Add Task ✓</button>
                  <button onClick={()=>setAdding(false)} style={{flex:1,padding:"10px",borderRadius:12,border:`1px solid ${G.border}`,background:"transparent",color:G.textMid,fontSize:"0.82rem",cursor:"pointer"}}>Cancel</button>
                </div>
              </div>
            ):(
              <button onClick={()=>setAdding(true)} style={{width:"100%",padding:"11px",borderRadius:12,border:`1px dashed ${G.sage}55`,background:"transparent",color:G.sage,fontSize:"0.82rem",fontWeight:600,cursor:"pointer"}}>+ Add a custom task</button>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHead icon="🔄" title="Data & Reset" accent={G.rose}/>
          <CardBody>
            <div style={{fontSize:"0.8rem",fontWeight:600,marginBottom:4,color:G.text}}>Full reset — clear everything</div>
            <div style={{fontSize:"0.75rem",color:G.textMid,marginBottom:10,lineHeight:1.6}}>Wipes all data — habits, journal, tasks, evidence. Cannot be undone.</div>
            {confirmClear?<div style={{display:"flex",gap:8}}>
              <button onClick={()=>{resetApp();setConfirmClear(false);}} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${G.rose}`,background:`${G.rose}33`,color:G.roseLight,fontSize:"0.8rem",fontWeight:700,cursor:"pointer"}}>Yes, clear everything</button>
              <button onClick={()=>setConfirmClear(false)} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${G.border}`,background:"transparent",color:G.textMid,fontSize:"0.8rem",cursor:"pointer"}}>Cancel</button>
            </div>:<button onClick={()=>setConfirmClear(true)} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px solid ${G.rose}44`,background:`${G.rose}11`,color:G.rose,fontSize:"0.8rem",fontWeight:600,cursor:"pointer"}}>⚠️ Full reset — clear all data</button>}
          </CardBody>
        </Card>
        <Card><CardBody><div style={{fontSize:"0.8rem",color:G.textMid,lineHeight:2}}>Built just for you 💜<br/>Version 3.0 · Life Edition<br/>Data stored on this device only<br/>No account · No subscription · Yours forever</div></CardBody></Card>
      </div>
    </div>
  );
}


function ProgressScreen({state,update,toast}){
  const [tab,setTab]=useState("overview");

  function getStreak(habitKey,source){
    let streak=0;
    const today=new Date();
    for(let i=0;i<30;i++){
      const d=new Date(today);d.setDate(d.getDate()-i);
      const k=d.toISOString().slice(0,10);
      const src=source==="morning"?state.morningHabits:state.eveningHabits;
      if((src[k]||{})[habitKey])streak++;
      else if(i>0)break;
    }
    return streak;
  }

  const moodMap={"foggy":1,"low":2,"okay":3,"good":4,"great":5};
  const moodEmoji=["","😶\u200d🌫️","😔","😐","🙂","✨"];
  const last7=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-6+i);
    const k=d.toISOString().slice(0,10);
    const dayScore=computeScore(k,state,state.customTasks||[]);
    return{day:["Su","Mo","Tu","We","Th","Fr","Sa"][d.getDay()],mood:moodMap[(state.mood[k]||{}).mood]||0,score:Math.min(100,Math.round(dayScore/MAX_SCORE*100))};
  });

  const streaks=[
    {label:"Morning water",streak:getStreak("water_morning","morning"),icon:"💧"},
    {label:"Get dressed",streak:getStreak("dressed_hab","morning"),icon:"👗"},
    {label:"Get outside",streak:getStreak("sunlight","morning"),icon:"☀️"},
    {label:"Wind-down",streak:getStreak("wind_down_hab","evening"),icon:"🌙"},
    {label:"Journal done",streak:getStreak("journal_done","evening"),icon:"📖"},
    {label:"In bed by 11",streak:getStreak("bed_time","evening"),icon:"💫"},
  ];

  const daysTracked=Object.keys(state.tasks||{}).length;
  const todayScore=computeScore(todayKey(),state,state.customTasks||[]);
  const currentStreak=state.streaks?.current||0;
  const totalEvidence=(state.evidence||[]).length;

  function BarChart({data,valueKey,color,maxVal}){
    return(
      <div style={{display:"flex",gap:5,alignItems:"flex-end",height:80}}>
        {data.map((d,i)=>{
          const pct=maxVal?Math.round((d[valueKey]/(maxVal))*100):d[valueKey];
          return(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{fontSize:"0.58rem",color:d[valueKey]>0?color:G.textLight,fontWeight:600}}>{d[valueKey]>0?d[valueKey]:""}</div>
              <div style={{width:"100%",background:G.border,borderRadius:5,height:54,display:"flex",flexDirection:"column",justifyContent:"flex-end",overflow:"hidden"}}>
                <div style={{width:"100%",background:`linear-gradient(180deg,${color},${color}99)`,height:`${pct}%`,borderRadius:5,transition:"height 0.6s ease",boxShadow:pct>0?`0 0 6px ${color}44`:"none"}}/>
              </div>
              <div style={{fontSize:"0.58rem",color:G.textLight}}>{d.day}</div>
            </div>
          );
        })}
      </div>
    );
  }

  const habitRows=[
    {label:"Morning water",key:"water_morning",src:"morning"},
    {label:"Get dressed",key:"dressed_hab",src:"morning"},
    {label:"Breakfast",key:"breakfast_hab",src:"morning"},
    {label:"Get outside",key:"sunlight",src:"morning"},
    {label:"10-min tidy",key:"tidy_10ev",src:"evening"},
    {label:"Journal done",key:"journal_done",src:"evening"},
    {label:"In bed by 11",key:"bed_time",src:"evening"},
  ];

  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:"linear-gradient(160deg,#f8f0e0 0%,#f0e8f8 100%)",padding:"28px 20px 20px"}}>
        <div style={{fontSize:"2rem",marginBottom:6}}>🌟</div>
        <div className="cinzel shimmer-text" style={{fontSize:"1.4rem",fontWeight:600,marginBottom:4}}>Progress</div>
        <div style={{fontSize:"0.78rem",color:G.textMid,lineHeight:1.6}}>Your journey, tracked. Every tick matters.</div>
      </div>
      <div style={{padding:"12px 16px 0"}}>
        <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
          {[{id:"overview",label:"📊 Overview"},{id:"streaks",label:"🔥 Streaks"},{id:"habits",label:"📅 Habits"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flexShrink:0,padding:"8px 14px",borderRadius:100,border:`1px solid ${tab===t.id?G.gold:G.border}`,background:tab===t.id?`${G.gold}22`:"transparent",color:tab===t.id?G.gold:G.textMid,fontSize:"0.72rem",fontWeight:600,cursor:"pointer"}}>{t.label}</button>
          ))}
        </div>

        {tab==="overview"&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[
              {label:"Today\'s XP",val:todayScore,sub:`of ${MAX_SCORE} possible`,col:G.gold},
              {label:"Day Streak",val:currentStreak,sub:"days in a row",col:G.rose},
              {label:"Days Tracked",val:daysTracked,sub:"total days logged",col:G.plum},
              {label:"Evidence",val:totalEvidence,sub:"things proving you\'re ok",col:G.sage},
            ].map(s=>(
              <div key={s.label} style={{background:G.bgCard,borderRadius:16,padding:"16px 14px",border:`1px solid ${s.col}22`,textAlign:"center",boxShadow:`0 2px 12px ${s.col}10`}}>
                <div className="cinzel" style={{fontSize:"2rem",color:s.col,lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:"0.58rem",color:G.textLight,textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>{s.sub}</div>
                <div style={{fontSize:"0.7rem",color:G.textMid,marginTop:4,fontWeight:500}}>{s.label}</div>
              </div>
            ))}
          </div>
          <Card>
            <CardHead icon="📊" title="Daily Score — This Week" accent={G.gold}/>
            <CardBody><BarChart data={last7} valueKey="score" color={G.gold} maxVal={100}/></CardBody>
          </Card>
          <Card>
            <CardHead icon="🌙" title="Mood — This Week" accent={G.plum}/>
            <CardBody>
              <div style={{display:"flex",gap:5,alignItems:"flex-end",height:90}}>
                {last7.map((d,i)=>(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <div style={{fontSize:"1rem",height:22,display:"flex",alignItems:"center"}}>{d.mood?moodEmoji[d.mood]:""}</div>
                    <div style={{width:"100%",background:G.border,borderRadius:5,height:44,display:"flex",flexDirection:"column",justifyContent:"flex-end",overflow:"hidden"}}>
                      <div style={{width:"100%",background:`linear-gradient(180deg,${G.plumLight},${G.plum})`,height:`${(d.mood/5)*100}%`,borderRadius:5,transition:"height 0.6s ease"}}/>
                    </div>
                    <div style={{fontSize:"0.58rem",color:G.textLight}}>{d.day}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </>}

        {tab==="streaks"&&<>
          <div style={{background:`${G.gold}15`,borderRadius:16,padding:"14px 18px",marginBottom:12,border:`1px solid ${G.gold}25`,fontSize:"0.78rem",color:G.textMid,lineHeight:1.6}}>
            🔥 Even 1 day is a streak worth celebrating. Every single one.
          </div>
          {streaks.map((s,i)=>(
            <Card key={i}>
              <CardBody>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:s.streak>0?10:0}}>
                  <div style={{fontSize:"1.8rem"}}>{s.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"0.85rem",fontWeight:500,color:G.text}}>{s.label}</div>
                    <div style={{fontSize:"0.7rem",color:G.textMid,marginTop:2}}>
                      {s.streak===0?"Not started yet — today could be day 1 💜":s.streak===1?"Day 1 — you started! 🌱":s.streak<5?`${s.streak} days — building momentum ✨`:`${s.streak} days — you\'re on a roll! 🔥`}
                    </div>
                  </div>
                  <div style={{textAlign:"center",background:s.streak>0?`${G.gold}18`:G.bgCardAlt,borderRadius:12,padding:"10px 14px",border:`1px solid ${s.streak>0?G.gold:G.border}`}}>
                    <div className="cinzel" style={{fontSize:"1.5rem",color:s.streak>0?G.gold:G.textLight}}>{s.streak}</div>
                    <div style={{fontSize:"0.6rem",color:G.textLight}}>days</div>
                  </div>
                </div>
                {s.streak>0&&<ProgBar pct={Math.min(100,(s.streak/30)*100)} color={G.gold}/>}
              </CardBody>
            </Card>
          ))}
        </>}

        {tab==="habits"&&(
          <Card>
            <CardHead icon="📅" title="Habit Tracker — This Week" accent={G.gold}/>
            <CardBody>
              {habitRows.map((h,hi)=>(
                <div key={hi} style={{marginBottom:hi<habitRows.length-1?16:0}}>
                  <div style={{fontSize:"0.78rem",fontWeight:500,marginBottom:6,color:G.text}}>{h.label}</div>
                  <div style={{display:"flex",gap:4}}>
                    {["M","T","W","T","F","S","S"].map((d,di)=>{
                      const dayDate=new Date();dayDate.setDate(dayDate.getDate()-dayDate.getDay()+1+di);
                      const dayKey=dayDate.toISOString().slice(0,10);
                      const src=h.src==="morning"?state.morningHabits:state.eveningHabits;
                      const done=!!(src[dayKey]||{})[h.key];
                      return(
                        <div key={di} onClick={()=>{
                          if(h.src==="morning"){const cur=state.morningHabits[dayKey]||{};update({morningHabits:{...state.morningHabits,[dayKey]:{...cur,[h.key]:!cur[h.key]}}});}
                          else{const cur=state.eveningHabits[dayKey]||{};update({eveningHabits:{...state.eveningHabits,[dayKey]:{...cur,[h.key]:!cur[h.key]}}});}
                        }} style={{flex:1,aspectRatio:"1",borderRadius:7,background:done?G.gold:G.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.58rem",color:done?"white":G.textLight,fontWeight:700,cursor:"pointer",transition:"all 0.2s",boxShadow:done?`0 0 8px ${G.gold}44`:"none"}}>
                          {done?"✓":d}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

const INIT_STATE={tasks:{},mood:{},cleanDone:{},customDone:{},morningHabits:{},eveningHabits:{},sensoryLog:{},journal:{},evidence:[],customTasks:[],streaks:{current:0},lastActive:null,dailyWin:{},workoutDone:{}};

export default function App(){
  const [screen,setScreen]=useState("today");
  const [appState,setAppState]=useState(INIT_STATE);
  const [loaded,setLoaded]=useState(false);
  const [toastMsg,setToastMsg]=useState("");
  const toastTimer=useRef(null);
  const saveTimer=useRef(null);

  useEffect(()=>{const saved=loadData();if(saved&&Object.keys(saved).length>0)setAppState(s=>({...INIT_STATE,...s,...saved}));setLoaded(true);},[]);
  useEffect(()=>{if(!loaded)return;clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>saveData(appState),500);},[appState,loaded]);
  useEffect(()=>{
    if(!loaded)return;
    const key=todayKey();
    if(appState.lastActive!==key){
      const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
      const hadYesterday=Object.values(appState.tasks[yesterday]||{}).some(Boolean);
      const cur=appState.streaks?.current||0;
      setAppState(s=>({...s,lastActive:key,streaks:{...s.streaks,current:hadYesterday?cur+1:1}}));
    }
  },[loaded]);

  const update=(patch)=>setAppState(s=>({...s,...patch}));
  const toast=(msg)=>{setToastMsg(msg);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToastMsg(""),2200);};
  const key=todayKey();
  const score=loaded?computeScore(key,appState,appState.customTasks):0;
  const streak=appState.streaks?.current||0;
  const nav=[{id:"today",icon:"🌙",label:"Today"},{id:"house",icon:"🏠",label:"House"},{id:"mind",icon:"✨",label:"Mind"},{id:"journal",icon:"📖",label:"Journal"},{id:"progress",icon:"🌟",label:"Progress"},{id:"settings",icon:"⚙️",label:"Me"}];

  if(!loaded)return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:G.bg,flexDirection:"column",gap:16}}><div style={{fontSize:"3rem",animation:"float 2s ease-in-out infinite"}}>🌙</div><div className="cinzel shimmer-text" style={{fontSize:"1.2rem"}}>Loading your universe...</div><style>{CSS}</style></div>);

  return(
    <>
      <style>{CSS}</style>
      <div style={{background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",position:"relative"}}>
        <StarField/>
        <div style={{overflowY:"auto",height:"100vh",paddingBottom:90,position:"relative",zIndex:1}}>
          {screen==="today"&&<TodayScreen state={appState} update={update} toast={toast} score={score} streak={streak}/>}
          {screen==="house"&&<HouseScreen state={appState} update={update} toast={toast}/>}
          {screen==="mind"&&<MindScreen state={appState} update={update} toast={toast}/>}
          {screen==="journal"&&<JournalScreen state={appState} update={update} toast={toast}/>}
          {screen==="progress"&&<ProgressScreen state={appState} update={update} toast={toast}/> }
          {screen==="settings"&&<SettingsScreen state={appState} update={update} toast={toast} resetApp={()=>{setAppState(INIT_STATE);toast("✨ Fresh start!");setScreen("today");}}/>}
        </div>
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(250,247,242,0.97)",backdropFilter:"blur(16px)",borderTop:`1px solid ${G.border}`,display:"flex",padding:"8px 0 max(8px,env(safe-area-inset-bottom))",zIndex:100}}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>setScreen(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"4px 0"}}>
              <div style={{fontSize:"1.1rem",lineHeight:1,filter:screen===n.id?"none":"opacity(0.4)",transform:screen===n.id?"scale(1.15)":"scale(1)",transition:"all 0.2s"}}>{n.icon}</div>
              <div style={{fontSize:"0.52rem",fontWeight:600,letterSpacing:"0.04em",color:screen===n.id?G.gold:G.textLight}}>{n.label}</div>
              {screen===n.id&&<div style={{width:3,height:3,borderRadius:"50%",background:G.gold,boxShadow:`0 0 6px ${G.gold}`}}/>}
            </button>
          ))}
        </div>
        <Toast msg={toastMsg}/>
      </div>
    </>
  );
}
