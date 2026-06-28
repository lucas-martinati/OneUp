const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/CardioModule-BpMuvXAJ.js","assets/preload-helper-CWMNGmfz.js","assets/react-vendor-xzyejlyb.js","assets/useCardio-CL1OmOEJ.js","assets/cardioService-DYaMVTh1.js","assets/index-rSjKql93.js","assets/i18n-vendor-D1hY1-9W.js","assets/ui-vendor-J7umfTtc.js","assets/dbSchema-BDSEOnNu.js","assets/useSwipe-BqfG8gdd.js","assets/exerciseLabel-DYZWeFlV.js","assets/SegmentedControl-BuLgh3bo.js","assets/index-ChSvmYiI.css","assets/map-vendor-CIGW-MKW.css","assets/Calendar-a3Z85Gf8.js","assets/DifficultyBadge-stu2Syzl.js","assets/Calendar-LAKu-7Z9.css","assets/Stats-ByLveOZJ.js","assets/sessionHistoryService-DCIMk9Ea.js","assets/SharePanel-WBHvb2M2.js","assets/useComputedStatsFromStore-DfcyYnJF.js","assets/buildBadges-FMhd3KyE.js","assets/Settings-CVDw7NUH.js","assets/ToggleSwitch-CPhQw8yi.js","assets/ThemeSwatch-ADugHmUq.js","assets/languages-CwD3RXv7.js","assets/ExercisePanel-yvLf91DL.js","assets/ExercisePanel-M0s0vDuu.css","assets/Leaderboard-Dusqv63F.js","assets/Spinner-DXrm_04L.js","assets/Spinner-B4wGVu_E.css","assets/Leaderboard-Cju3BmtK.css","assets/Achievements-CfBOcESC.js","assets/WorkoutSession-DZLfA1Aj.js","assets/WorkoutSession-BRPdkt52.css","assets/CustomExercisesModal-BRC5rwRS.js","assets/CategoryManagerModal-DiVOUUcj.js","assets/AdminPanel-DSs6GNe4.js"])))=>i.map(i=>d[i]);
import{r,j as e,b as ze,R as Te,c as Vt}from"./react-vendor-xzyejlyb.js";import{u as q}from"./i18n-vendor-D1hY1-9W.js";import{m as ya,n as va,R as wa,o as Sa,X as yt,p as ka,q as ja,r as Ca,k as Jt,s as Ea,i as Zt,C as Ia,t as Aa,F as Ra,T as za,g as Ta,u as Da,P as Qt,U as _a,v as Kt,w as Dt,j as Ma,c as Na,x as Oa,L as Pa,y as $a}from"./ui-vendor-J7umfTtc.js";import{A as ut,a as Fa,i as La,c as Ba,b as nt,g as ea,u as ta,d as qe,e as vt,f as G,h as Wa,S as rt,j as Ne,k as $e,E as le,W as Oe,l as Fe,B as gt,m as aa,n as Ha,o as Ga,p as Re,q as Ya,r as _t,s as na,t as wt,v as Ua,w as ye,x as Xa,y as St,z as Ie,F as Ae,C as qa}from"./index-rSjKql93.js";import{B as Xe,G as Va,I as ra,C as Ja,D as kt,h as Za,u as oa,U as Qa,g as sa,S as Ka,W as en,a as tn,s as an}from"./exerciseLabel-DYZWeFlV.js";import{_ as se}from"./preload-helper-CWMNGmfz.js";const Ye={MODAL:110,FLOATING_BUBBLE:999,TOAST:1e3,DELETE_OVERLAY:9999,DELETE_MODAL:1e4},nn=80,rn=20,ft=2500,ie=(t,a)=>Math.random()*(a-t)+t,Mt=["circle","square","rectangle"],on=(t,a)=>Array.from({length:a},(n,s)=>{const p=ie(0,360)*Math.PI/180,d=ie(20,80),o=Mt[Math.floor(Math.random()*Mt.length)];return{id:s,color:t[Math.floor(Math.random()*t.length)],dx:Math.cos(p)*d,dy:-Math.sin(p)*d,rx:ie(-1,1),ry:ie(-1,1),rz:ie(-1,1),rotation:ie(360,1440),size:ie(6,12),delay:ie(0,150),duration:ie(ft-500,ft+800),shape:o,gravity:ie(40,90)}});let Nt=!1;const sn=()=>{if(Nt)return;Nt=!0;const t=document.createElement("style");t.textContent=`
        @keyframes confettiBurst3D {
            0% {
                transform: translate3d(0, 0, 0) scale(0);
                opacity: 0;
                /* Expulsion rapide (décélération) */
                animation-timing-function: cubic-bezier(0.1, 0.9, 0.2, 1);
            }
            5% {
                opacity: 1;
                transform: translate3d(0, 0, 0) scale(1);
            }
            40% {
                /* Apogée de l'explosion : le confetti atteint sa distance max, la gravité va prendre le relais */
                transform: 
                    translate3d(
                        calc(var(--dx) * 1vw), 
                        calc(var(--dy) * 1vh), 
                        0
                    ) 
                    rotate3d(var(--rx), var(--ry), var(--rz), calc(var(--rot) * 0.4deg)) 
                    scale(1);
                /* Chute sous l'effet de la gravité (accélération) */
                animation-timing-function: ease-in;
            }
            100% {
                /* Fin de la chute */
                transform: 
                    translate3d(
                        calc(var(--dx) * 1vw), 
                        calc(var(--dy) * 1vh + var(--grav) * 1vh), 
                        0
                    ) 
                    rotate3d(var(--rx), var(--ry), var(--rz), calc(var(--rot) * 1deg)) 
                    scale(0.8);
                opacity: 0;
            }
        }
    `,document.head.appendChild(t)};function ln({active:t,colors:a=["#fbbf24","#8b5cf6","#10b981","#ec4899","#3b82f6"],onDone:n,reducedParticles:s=!1}){const[c,p]=r.useState(null),d=s?rn:nn;return r.useEffect(()=>{if(!t){queueMicrotask(()=>p(null));return}sn();const o=on(a,d);queueMicrotask(()=>p(o));const g=ft+800+150,i=setTimeout(()=>{p(null),n?.()},g);return()=>clearTimeout(i)},[t,a,n,d]),c?e.jsx("div",{"aria-hidden":"true",style:{position:"fixed",inset:0,pointerEvents:"none",zIndex:Ye.DELETE_OVERLAY,overflow:"hidden",perspective:"1000px"},children:c.map(o=>{const g=o.shape==="rectangle"?`${o.size*.4}px`:`${o.size}px`,i=o.shape==="rectangle"?`${o.size*1.5}px`:`${o.size}px`,l=o.shape==="circle"?"50%":"2px";return e.jsx("div",{style:{position:"absolute",left:"50%",top:"50%",width:g,height:i,borderRadius:l,background:o.color,"--dx":o.dx,"--dy":o.dy,"--rx":o.rx,"--ry":o.ry,"--rz":o.rz,"--rot":o.rotation,"--grav":o.gravity,animation:`confettiBurst3D ${o.duration}ms forwards ${o.delay}ms`,willChange:"transform, opacity"}},o.id)})}):null}function cn(){const[t,a]=r.useState(()=>typeof navigator>"u"?!0:navigator.onLine);return r.useEffect(()=>{const n=()=>a(!0),s=()=>a(!1),c=p=>a(!!p.detail?.online);return window.addEventListener("online",n),window.addEventListener("offline",s),window.addEventListener("oneup-debug-network",c),()=>{window.removeEventListener("online",n),window.removeEventListener("offline",s),window.removeEventListener("oneup-debug-network",c)}},[]),t}const dn=2600;function pn(){const{t}=q(),a=cn(),[n,s]=r.useState(a?"hidden":"offline"),[c,p]=r.useState("offline"),[d,o]=r.useState(!a),g=r.useRef(a);if(r.useEffect(()=>{if(!a){g.current=!1;let f;const u=requestAnimationFrame(()=>{p("offline"),o(!0),f=requestAnimationFrame(()=>s("offline"))});return()=>{cancelAnimationFrame(u),f&&cancelAnimationFrame(f)}}if(g.current===!1){g.current=!0;const f=requestAnimationFrame(()=>{p("reconnected"),s("reconnected")}),u=setTimeout(()=>s("hidden"),dn);return()=>{cancelAnimationFrame(f),clearTimeout(u)}}g.current=!0},[a]),!d)return null;const i=n!=="hidden",l=c==="reconnected";return e.jsx("div",{"aria-hidden":!i,onTransitionEnd:f=>{f.propertyName==="grid-template-rows"&&!i&&o(!1)},style:{display:"grid",gridTemplateRows:i?"1fr":"0fr",transition:"grid-template-rows 0.36s cubic-bezier(0.22,1,0.36,1)",flexShrink:0},children:e.jsx("div",{style:{overflow:"hidden",minHeight:0},children:e.jsxs("div",{role:"status","aria-live":"polite",style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"8px 14px",borderRadius:"var(--radius-md)",fontSize:"0.8rem",fontWeight:600,lineHeight:1.3,textAlign:"center",color:"#fff",background:l?"linear-gradient(135deg, #16a34a, #22c55e)":"linear-gradient(135deg, #dc2626, #ef4444)",boxShadow:l?"0 4px 14px rgba(34,197,94,0.35)":"0 4px 14px rgba(239,68,68,0.32)",transition:"background 0.4s ease, box-shadow 0.4s ease"},children:[l?e.jsx(ya,{size:16}):e.jsx(va,{size:16}),e.jsx("span",{children:t(l?"cloud.backOnline":"cloud.offlineMessage")})]})})})}const Ot="oneup_migration_dismissed";function un(){if(La()||typeof window>"u"||!ut)return!1;const t=window.location.hostname;if(!t||t==="localhost"||t==="127.0.0.1")return!1;const a=ut.replace(/^www\./,"");return t.replace(/^www\./,"")!==a}function gn(){const{t}=q(),[a,n]=r.useState(()=>{try{return sessionStorage.getItem(Ot)==="1"}catch{return!1}});if(a||!un())return null;const s=()=>{try{sessionStorage.setItem(Ot,"1")}catch{}n(!0)};return e.jsxs("div",{role:"alert",style:{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"var(--radius-md)",background:"linear-gradient(135deg, #6d28d9, #8b5cf6)",boxShadow:"0 4px 14px rgba(109,40,217,0.35)",color:"#fff",flexShrink:0},children:[e.jsx(wa,{size:18,style:{flexShrink:0}}),e.jsxs("div",{style:{flex:1,minWidth:0,lineHeight:1.3},children:[e.jsx("div",{style:{fontWeight:700,fontSize:"0.82rem"},children:t("migration.title",{host:ut})}),e.jsx("div",{style:{fontSize:"0.72rem",opacity:.92},children:t("migration.message")})]}),e.jsxs("a",{href:Fa,style:{display:"inline-flex",alignItems:"center",gap:"4px",padding:"7px 12px",borderRadius:"999px",background:"rgba(255,255,255,0.18)",color:"#fff",fontWeight:700,fontSize:"0.75rem",textDecoration:"none",whiteSpace:"nowrap",flexShrink:0},children:[t("migration.button"),e.jsx(Sa,{size:14})]}),e.jsx("button",{type:"button",onClick:s,"aria-label":t("common.close"),style:{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"4px",border:"none",background:"transparent",color:"#fff",cursor:"pointer",opacity:.8,flexShrink:0},children:e.jsx(yt,{size:16})})]})}const mt=Ba("SoundManager");let xt=null;const Ue={};function fn(t){xt=t}function Ve(t,a){if(!Ue[t]){const n=new Audio(a);n.preload="none",Ue[t]=n}return Ue[t]}const Je="/OneUp/";Ve("success",`${Je}sounds/success.mp3`);Ve("poke",`${Je}sounds/poke.mp3`);Ve("perfect",`${Je}sounds/perfect.mp3`);Ve("yaaas",`${Je}sounds/yaaas.mp3`);function mn(){const t=Math.random()*100;return t<.01?(mt.success("🌟 ULTRA RARE SOUND! YAAAS!"),"yaaas"):t<5?(mt.success("⭐ RARE SOUND! PERFECT!"),"perfect"):"success"}function ot(t){const a=Ue[t];if(!a){mt.warn(`Sound not found: ${t}`);return}const n=a.cloneNode();n.volume=.6,n.play().catch(s=>{console.debug("Sound play failed:",s)})}function st(t){if(!(xt&&!xt()?.soundsEnabled))try{if(t==="success"){const a=mn();ot(a)}else t==="click"?ot("click"):t==="poke"&&ot("poke")}catch(a){console.debug("Sound play failed:",a)}}const Pt={success:()=>st("success"),click:()=>st("click"),poke:()=>st("poke")},it=[["#6366f1","#8b5cf6"],["#ec4899","#f43f5e"],["#06b6d4","#3b82f6"],["#10b981","#059669"],["#f59e0b","#f97316"],["#8b5cf6","#d946ef"],["#f43f5e","#f97316"],["#3b82f6","#6366f1"],["#14b8a6","#0ea5e9"],["#a855f7","#ec4899"]];function xn(t){if(!t)return it[0];let a=0;for(let n=0;n<t.length;n++)a=t.charCodeAt(n)+((a<<5)-a);return it[Math.abs(a)%it.length]}function bn(t){return t?t.charAt(0).toUpperCase():"?"}function hn({photoURL:t,name:a,size:n=32,borderColor:s=null}){const[c,p]=xn(a||""),d=bn(a),[o,g]=r.useState(null),i=t&&o!==t;return e.jsxs("div",{style:{width:n,height:n,borderRadius:"50%",overflow:"hidden",flexShrink:0,position:"relative",background:i?"var(--sheet-bg)":`linear-gradient(145deg, ${c}, ${p})`,border:s?`1.5px solid ${s}`:"1.5px solid rgba(255,255,255,0.14)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:i?"none":`0 4px 14px ${c}55, inset 0 1.5px 1px rgba(255,255,255,0.3), inset 0 -2px 6px rgba(0,0,0,0.22)`},children:[!i&&e.jsxs(e.Fragment,{children:[e.jsx("span",{"aria-hidden":!0,style:{position:"absolute",inset:0,background:"radial-gradient(120% 120% at 28% 20%, rgba(255,255,255,0.42), rgba(255,255,255,0.08) 38%, transparent 62%)",pointerEvents:"none"}}),e.jsx("span",{style:{position:"relative",zIndex:1,fontSize:n*.42,fontWeight:700,letterSpacing:"-0.01em",color:"#fff",textShadow:"0 1px 3px rgba(0,0,0,0.3)"},children:d})]}),i&&e.jsx("img",{src:t,alt:"",referrerPolicy:"no-referrer",loading:"lazy",decoding:"async",onError:()=>g(t),style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}})]})}const yn="_stack_sbcoe_5",vn="_toast_sbcoe_14",wn="_toastIn_sbcoe_45",Sn="_avatarWrap_sbcoe_54",kn="_iconBadge_sbcoe_64",jn="_countBadge_sbcoe_86",Cn="_body_sbcoe_111",En="_name_sbcoe_116",In="_message_sbcoe_125",An="_close_sbcoe_135",Rn="_progress_sbcoe_155",oe={stack:yn,toast:vn,toastIn:wn,avatarWrap:Sn,iconBadge:kn,countBadge:jn,body:Cn,name:En,message:In,close:An,progress:Rn};function zn({toast:t,onDone:a}){const{exit:n,dismiss:s,cardProps:c}=ta({onClose:()=>a(t.key)});return e.jsxs("div",{className:`${oe.toast} ${oe.toastIn}`,...c,role:"alert",children:[e.jsxs("div",{className:oe.avatarWrap,children:[e.jsx(hn,{photoURL:t.fromPhoto,name:t.fromName,size:40}),e.jsx("span",{className:oe.iconBadge,children:e.jsx(ka,{size:12})}),t.count>1&&e.jsxs("span",{className:oe.countBadge,children:["×",t.count]},t.count)]}),e.jsxs("div",{className:oe.body,children:[e.jsx("div",{className:oe.name,children:t.fromName}),e.jsx("div",{className:oe.message,children:t.message})]}),e.jsx("button",{className:oe.close,onPointerDown:p=>p.stopPropagation(),onClick:p=>{p.stopPropagation(),s()},"aria-label":"dismiss",children:e.jsx(yt,{size:16})}),!n&&e.jsx("span",{className:oe.progress},t.count)]})}function Tn(){const[t,a]=r.useState([]),n=r.useRef(new Map),s=r.useRef(new Set),c=r.useCallback(o=>{s.current.add(o),a(g=>g.filter(i=>i.key!==o)),String(o).startsWith("debug-")||nt.deleteNotification(o)},[]),p=r.useCallback(o=>{const g=o.detail||{},i=g.fromName||"Debug",l=`debug-${i}`;s.current.delete(l),a(f=>f.find(m=>m.key===l)?f.map(m=>m.key===l?{...m,count:m.count+1,message:g.message||m.message}:m):[...f,{key:l,fromName:i,fromPhoto:g.fromPhoto||null,message:g.message||"👋 Poke de test !",count:1}]);try{Pt.poke()}catch{}},[]),d=r.useCallback(o=>{const g=o.filter(f=>!f.read),i=new Set(g.map(f=>f.id));for(const f of[...s.current])!String(f).startsWith("debug-")&&!i.has(f)&&s.current.delete(f);for(const f of[...n.current.keys()])i.has(f)||n.current.delete(f);let l=!1;for(const f of g){const u=f.count||1,m=n.current.get(f.id);!s.current.has(f.id)&&(m===void 0||u>m)&&(l=!0),n.current.set(f.id,u)}if(l)try{Pt.poke()}catch{}a(f=>{const u=f.filter(x=>String(x.key).startsWith("debug-"));return[...g.filter(x=>!s.current.has(x.id)).map(x=>({key:x.id,fromName:x.fromName,fromPhoto:x.fromPhoto,message:x.message,count:x.count||1})),...u]})},[]);return r.useEffect(()=>(window.addEventListener("oneup-debug-poke",p),()=>window.removeEventListener("oneup-debug-poke",p)),[p]),r.useEffect(()=>{let o=null;const g=()=>{o||(o=nt.listenToNotifications(d))},i=()=>{o&&(o(),o=null)},l=nt.subscribe(f=>{f.isSignedIn?g():(i(),n.current.clear(),s.current.clear(),a([]))});return()=>{i(),l()}},[d]),t.length===0?null:ze.createPortal(e.jsx("div",{className:oe.stack,style:{order:1},children:t.map(o=>e.jsx(zn,{toast:o,onDone:c},`${o.key}-${o.count}`))}),ea())}function Dn({conflictData:t,onResolveConflict:a}){const[n,s]=r.useState(!1),{t:c}=q(),[p,d]=r.useState(!1);if(!t)return null;const o=async g=>{s(!0);try{await a(g)}finally{s(!1)}};return ze.createPortal(e.jsx("div",{className:"conflict-fullscreen-overlay",children:e.jsxs("div",{className:"conflict-modal",children:[e.jsxs("div",{className:"conflict-header",children:[e.jsx(ja,{className:"conflict-icon"}),e.jsx("h2",{className:"panel-title",children:c("cloud.anonymousMergeTitle")})]}),e.jsx("p",{className:"conflict-message",children:c("cloud.anonymousMergeDesc")}),e.jsxs("div",{className:"conflict-actions",children:[e.jsxs("button",{className:"btn-conflict btn-merge",onClick:()=>o("upload"),disabled:n,children:[e.jsx(Ca,{}),e.jsxs("div",{children:[e.jsx("strong",{children:c("cloud.merge")}),e.jsx("span",{children:c("cloud.mergeDesc")})]})]}),e.jsxs("button",{className:`btn-conflict btn-restore ${p?"confirming":""}`,onClick:()=>{p?o("restore"):(d(!0),setTimeout(()=>d(!1),3e3))},disabled:n,style:p?{background:"linear-gradient(135deg, #ef4444, #dc2626)"}:{},children:[p?e.jsx(Jt,{}):e.jsx(Ea,{}),e.jsxs("div",{children:[e.jsx("strong",{children:c(p?"cloud.areYouSure":"cloud.restore")}),e.jsx("span",{children:c(p?"cloud.cannotBeUndone":"cloud.restoreDesc")})]})]})]})]})}),document.body)}function _n({open:t,message:a,onConfirm:n,onCancel:s,destructive:c=!1,confirmLabel:p,cancelLabel:d}){const{t:o}=q(),g=r.useRef(null),i=r.useRef(null),l=r.useCallback(u=>{u.key==="Escape"&&s()},[s]);r.useEffect(()=>(t&&(document.addEventListener("keydown",l),document.body.style.overflow="hidden"),()=>{document.removeEventListener("keydown",l),document.body.style.overflow=""}),[t,l]);const f=u=>{u.target===g.current&&s()};return t?ze.createPortal(e.jsx("div",{ref:g,onClick:f,style:{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",background:"rgba(0, 0, 0, 0.55)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",animation:"confirmOverlayIn 0.2s ease-out"},children:e.jsxs("div",{ref:i,style:{width:"100%",maxWidth:"340px",borderRadius:"20px",background:"linear-gradient(145deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 40, 0.98))",border:"1px solid rgba(139, 92, 246, 0.2)",boxShadow:"0 24px 64px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.08)",padding:"24px",display:"flex",flexDirection:"column",alignItems:"center",gap:"20px",animation:"confirmPanelIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"},children:[e.jsx("div",{style:{width:"48px",height:"48px",borderRadius:"50%",background:c?"linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15))":"linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(129, 140, 248, 0.15))",border:`1px solid ${c?"rgba(239, 68, 68, 0.3)":"rgba(139, 92, 246, 0.3)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},children:e.jsx(Jt,{size:22,color:c?"#f87171":"var(--accent-glow)"})}),e.jsx("p",{style:{margin:0,fontSize:"0.9rem",fontWeight:"500",color:"var(--text-primary)",textAlign:"center",lineHeight:"1.5"},children:a}),e.jsxs("div",{style:{display:"flex",gap:"10px",width:"100%"},children:[e.jsx(Xe,{variant:"secondary",size:"sm",onClick:s,style:{flex:1},children:d||o("common.cancel")}),e.jsx(Xe,{variant:c?"danger":"primary",size:"sm",onClick:n,style:{flex:1},children:p||o("common.confirm")})]})]})}),document.body):null}const $t="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z";function Mn({size:t=16,color:a="#38bdf8",style:n,className:s,...c}){const p=Te.useId().replace(/:/g,""),d=`ff-fill-${p}`,o=`ff-sheen-${p}`,g=`ff-clip-${p}`;return e.jsx("span",{className:s,style:{display:"inline-flex",alignItems:"center",justifyContent:"center",filter:`drop-shadow(0 0 3px ${a}66)`,...n},...c,children:e.jsxs("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none","aria-hidden":"true",children:[e.jsxs("defs",{children:[e.jsxs("linearGradient",{id:d,x1:"12",y1:"1.5",x2:"12",y2:"22",gradientUnits:"userSpaceOnUse",children:[e.jsx("stop",{offset:"0%",stopColor:"#f0f9ff"}),e.jsx("stop",{offset:"42%",stopColor:"#a5e3fd"}),e.jsx("stop",{offset:"100%",stopColor:a})]}),e.jsxs("radialGradient",{id:o,cx:"11",cy:"9",r:"8",gradientUnits:"userSpaceOnUse",children:[e.jsx("stop",{offset:"0%",stopColor:"#ffffff",stopOpacity:"0.85"}),e.jsx("stop",{offset:"55%",stopColor:"#ffffff",stopOpacity:"0.12"}),e.jsx("stop",{offset:"100%",stopColor:"#ffffff",stopOpacity:"0"})]}),e.jsx("clipPath",{id:g,children:e.jsx("path",{d:$t})})]}),e.jsx("path",{d:$t,fill:`url(#${d})`,stroke:a,strokeWidth:"1.4",strokeLinejoin:"round"}),e.jsx("g",{clipPath:`url(#${g})`,children:e.jsx("rect",{x:"0",y:"0",width:"24",height:"24",fill:`url(#${o})`})})]})})}function Nn({onClick:t,disabled:a=!1,label:n,className:s="",style:c}){const{t:p}=q();return e.jsxs("button",{type:"button",className:`btn-cloud-signin ${s}`.trim(),onClick:t,disabled:a,style:c,children:[e.jsx(Va,{className:"google-icon"}),n??p("cloud.signInWithGoogle")]})}const ee={started:"sessionStarted",queue:"workout_session_queue",currentIdx:"workout_session_current_idx",startTime:"workout_session_start_time",name:"workout_session_name",activeSlide:"workout_session_active_slide"};function On(){if(localStorage.getItem(ee.started)!=="true")return!1;try{const t=JSON.parse(localStorage.getItem(ee.queue)||"[]");return Array.isArray(t)&&t.length>0}catch{return!1}}function Pn(){let t=[];try{const c=localStorage.getItem(ee.queue);c&&(t=JSON.parse(c))}catch(c){console.error(c)}const a=localStorage.getItem(ee.currentIdx),n=localStorage.getItem(ee.startTime),s=localStorage.getItem(ee.activeSlide);return{queue:t,currentIdx:a!==null?parseInt(a,10):0,startTime:n!==null?parseInt(n,10):null,name:localStorage.getItem(ee.name)||"",activeSlide:s!==null?parseInt(s,10):null}}function _o({queue:t,currentIdx:a,startTime:n,name:s,activeSlide:c}){localStorage.setItem(ee.started,"true"),localStorage.setItem(ee.queue,JSON.stringify(t)),localStorage.setItem(ee.currentIdx,String(a)),n!=null&&localStorage.setItem(ee.startTime,String(n)),localStorage.setItem(ee.name,s),localStorage.setItem(ee.activeSlide,String(c))}function $n(){Object.values(ee).forEach(t=>localStorage.removeItem(t))}const B=Vt((t,a)=>({modals:{},modalStack:[],openModal:n=>t(s=>({modals:{...s.modals,[n]:!0},modalStack:[...s.modalStack.filter(c=>c!==n),n]})),closeModal:n=>t(s=>({modals:{...s.modals,[n]:!1},modalStack:s.modalStack.filter(c=>c!==n)})),closeTopModal:()=>{const{modalStack:n,closeModal:s}=a();return n.length===0?!1:(s(n[n.length-1]),!0)},openStoreDirectly:!1,openStore:()=>{t({openStoreDirectly:!0}),a().openModal("settings")},closeSettings:()=>{a().closeModal("settings"),t({openStoreDirectly:!1})},highlightedBadgeId:null,openAchievements:(n=null)=>{t({highlightedBadgeId:n}),a().openModal("achievements")},closeAchievements:()=>{a().closeModal("achievements"),t({highlightedBadgeId:null})},customExModalCatId:null,openCustomExercises:(n=null)=>{t({customExModalCatId:n}),a().openModal("customExercises")},closeCustomExercises:()=>{a().closeModal("customExercises"),t({customExModalCatId:null})},sessionInProgress:On(),setSessionInProgress:n=>t({sessionInProgress:n}),sessionMode:"config",openSession:n=>{t({sessionMode:n}),a().openModal("session")}})),pe="#38bdf8";function lt({value:t,label:a}){return e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"2px"},children:[e.jsx("span",{style:{fontSize:"1.5rem",fontWeight:900,color:pe},children:t}),e.jsx("span",{style:{fontSize:"0.7rem",fontWeight:600,color:"var(--text-secondary)",textAlign:"center"},children:a})]})}function Fn({open:t,onClose:a}){const{t:n}=q(),{isPro:s}=qe(),c=vt(),p=B(u=>u.openStore),d=G(u=>u.streakFreezes?.count||0),o=r.useRef(null),g=Wa(s),i=Math.round(rt.pro.perMonth/rt.free.perMonth),l=r.useCallback(u=>{u.key==="Escape"&&a()},[a]);if(r.useEffect(()=>{if(t)return document.addEventListener("keydown",l),document.body.style.overflow="hidden",()=>{document.removeEventListener("keydown",l),document.body.style.overflow=""}},[t,l]),!t)return null;const f=()=>{a(),p()};return ze.createPortal(e.jsx("div",{ref:o,onClick:u=>{u.target===o.current&&a()},style:{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",background:"rgba(0, 0, 0, 0.55)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",animation:"confirmOverlayIn 0.2s ease-out"},children:e.jsxs("div",{style:{position:"relative",width:"100%",maxWidth:"340px",borderRadius:"20px",background:"linear-gradient(145deg, rgba(20, 35, 50, 0.96), rgba(15, 25, 40, 0.98))",border:`1px solid ${pe}33`,boxShadow:`0 24px 64px rgba(0, 0, 0, 0.5), 0 0 40px ${pe}14`,padding:"24px",display:"flex",flexDirection:"column",alignItems:"center",gap:"16px",animation:"confirmPanelIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"},children:[e.jsx(ra,{icon:yt,variant:"glass",onClick:a,"aria-label":n("common.close"),style:{position:"absolute",top:"12px",right:"12px"}}),e.jsx("div",{style:{width:"52px",height:"52px",borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(circle at 32% 26%, ${pe}, ${pe}cc)`,border:`2px solid ${pe}`,boxShadow:`0 4px 16px ${pe}66`},children:e.jsx(Zt,{size:26,color:"#fff"})}),e.jsx("h3",{style:{margin:0,fontSize:"1.15rem",fontWeight:800,color:"var(--text-primary)"},children:n("streakFreeze.title")}),e.jsx("p",{style:{margin:0,fontSize:"0.85rem",color:"var(--text-secondary)",textAlign:"center",lineHeight:1.5},children:c.isSignedIn?n("streakFreeze.intro"):n("streakFreeze.guestDesc")}),!c.isSignedIn&&e.jsx(Nn,{onClick:()=>c.signIn(),className:"hover-lift",style:{width:"auto",marginTop:"2px"}}),c.isSignedIn&&e.jsxs("div",{style:{display:"flex",width:"100%",gap:"10px",padding:"14px",borderRadius:"14px",background:`${pe}12`,border:`1px solid ${pe}22`},children:[e.jsx(lt,{value:d,label:n("streakFreeze.statAvailable")}),e.jsx("div",{style:{width:"1px",background:"var(--border-subtle)"}}),e.jsx(lt,{value:`+${g.perMonth}`,label:n("streakFreeze.statPerMonth")}),e.jsx("div",{style:{width:"1px",background:"var(--border-subtle)"}}),e.jsx(lt,{value:g.maxStock,label:n("streakFreeze.statReserve")})]}),c.isSignedIn&&!s&&e.jsxs("div",{style:{width:"100%",display:"flex",flexDirection:"column",gap:"12px",padding:"14px",borderRadius:"14px",background:"linear-gradient(135deg, rgba(139,92,246,0.14), rgba(129,140,248,0.10))",border:"1px solid rgba(139,92,246,0.3)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[e.jsx(Ia,{size:18,color:"#a78bfa"}),e.jsx("span",{style:{fontSize:"0.85rem",fontWeight:700,color:"var(--text-primary)",lineHeight:1.4},children:n("streakFreeze.proPitch",{multiplier:i,count:rt.pro.perMonth})})]}),e.jsx(Xe,{variant:"primary",size:"sm",fullWidth:!0,onClick:f,children:n("streakFreeze.proCta")})]})]})}),document.body)}const Ln=t=>a=>a.filter(n=>!t.has(n.id)),Bn=Te.memo(({isAdmin:t,streakActive:a,streakFrozen:n,displayStreak:s,selectedExercise:c,totalReps:p})=>{const d=B(I=>I.openModal),{t:o}=q(),g=vt(),i=G(I=>I.streakFreezes?.count||0),[l,f]=r.useState(!1),u=!g.isSignedIn||i>0,m=g.isSignedIn?i:0,x=!a&&!!n,y=r.useRef(null),b=r.useRef(null),[k,j]=r.useState(500),[N,A]=r.useState([]),F=I=>{if(!a||s==0||s=="0")return;const M=I.currentTarget.getBoundingClientRect(),Y=y.current.getBoundingClientRect(),O=M.left+M.width/2-Y.left,E=M.top+M.height/2-Y.top,P=Array.from({length:12}).map((W,_)=>{const w=Math.random()*Math.PI,U=40+Math.random()*80,J=Math.cos(w)*U,ue=Math.sin(w)*U;return{id:Date.now()+_+Math.random(),x:O,y:E,tx:`${J}px`,ty:`${ue}px`,rot:`${(Math.random()-.5)*120}deg`,delay:Math.random()*.15,size:16+Math.random()*14,emoji:Math.random()>.3?"🔥":"✨"}});A(W=>[...W,...P]);const V=new Set(P.map(W=>W.id));setTimeout(()=>{A(Ln(V))},1200)};r.useEffect(()=>{if(!y.current||!b.current)return;const I=new ResizeObserver(()=>{if(y.current&&b.current){const M=y.current.getBoundingClientRect().width,Y=b.current.getBoundingClientRect().width,O=M-Y-40;j(E=>Math.abs(E-O)<2?E:O)}});return I.observe(y.current),I.observe(b.current),()=>I.disconnect()},[]);const v=k>=93,T=k>=35;let z;return a?z={bg:"linear-gradient(135deg, rgba(249,115,22,0.22), rgba(239,68,68,0.22))",border:"1px solid rgba(249,115,22,0.3)",shadow:"0 2px 8px rgba(249,115,22,0.15)",fg:"#f97316"}:x?z={bg:"linear-gradient(135deg, rgba(56,189,248,0.22), rgba(14,165,233,0.22))",border:"1px solid rgba(56,189,248,0.35)",shadow:"0 2px 8px rgba(56,189,248,0.18)",fg:"#38bdf8"}:z={bg:"linear-gradient(135deg, rgba(120,120,120,0.18), rgba(90,90,90,0.18))",border:"1px solid rgba(120,120,120,0.25)",shadow:"none",fg:"#888"},e.jsxs(Ja,{as:"header",ref:y,variant:"glass",padding:"none",className:"dashboard-header",style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"clamp(10px, 1.5vh, 16px) clamp(12px, 3vw, 20px)",minWidth:0,position:"relative",zIndex:10},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px",minWidth:0,flexShrink:1},children:[T&&e.jsx("img",{onClick:()=>window.location.reload(),src:"/OneUp/logo-64x64.webp",alt:"OneUp Logo",className:"bounce-on-hover",style:{width:"clamp(28px, 4vh, 40px)",height:"clamp(28px, 4vh, 40px)",flexShrink:0,borderRadius:"10px",cursor:"pointer",transition:"transform 0.3s ease"}}),v&&e.jsx("span",{className:"app-logo-text",style:{fontWeight:"800",fontSize:"clamp(1.1rem, 2.5vh, 1.5rem)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",minWidth:0},children:"OneUp"})]}),e.jsxs("div",{ref:b,style:{display:"flex",gap:"clamp(4px, 0.8vw, 8px)",alignItems:"center",flexShrink:0,justifyContent:"flex-end"},children:[t&&e.jsx(ra,{icon:Aa,variant:"danger",onClick:()=>d("admin"),"aria-label":"Admin Panel",className:"hover-lift"}),e.jsxs("div",{onClick:F,style:{background:z.bg,padding:"clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)",borderRadius:"16px",fontSize:"clamp(0.75rem, 1.6vh, 0.95rem)",display:"flex",alignItems:"center",gap:"5px",fontWeight:"700",border:z.border,boxShadow:z.shadow,opacity:a||x?1:.7,flexShrink:0,cursor:"pointer"},children:[x?e.jsx(Mn,{size:16,color:z.fg}):e.jsx(Ra,{size:16,color:z.fg}),e.jsx("span",{style:{color:z.fg},children:s})]}),u&&e.jsxs("button",{type:"button",onClick:()=>f(!0),"aria-label":o("streakFreeze.available",{count:m}),title:o("streakFreeze.available",{count:m}),style:{background:"linear-gradient(135deg, rgba(56,189,248,0.20), rgba(14,165,233,0.20))",padding:"clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)",borderRadius:"16px",fontSize:"clamp(0.75rem, 1.6vh, 0.95rem)",display:"flex",alignItems:"center",gap:"5px",fontWeight:"700",border:"1px solid rgba(56,189,248,0.3)",flexShrink:0,cursor:"pointer",color:"inherit",fontFamily:"inherit",boxSizing:"border-box",margin:0,appearance:"none",WebkitAppearance:"none"},children:[e.jsx(Zt,{size:16,color:"#38bdf8"}),e.jsx("span",{style:{color:"#38bdf8"},children:m})]}),l&&e.jsx(Fn,{open:l,onClose:()=>f(!1)}),e.jsxs("div",{className:"shimmer",style:{background:`linear-gradient(135deg, ${c.color}33, ${c.gradient[0]}33)`,padding:"clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)",borderRadius:"16px",fontSize:"clamp(0.75rem, 1.6vh, 0.95rem)",display:"flex",alignItems:"center",gap:"5px",fontWeight:"600",border:"1px solid var(--border-strong)",boxShadow:`0 2px 8px ${c.color}33`,flexShrink:0},children:[e.jsx(za,{size:16,color:c.color}),e.jsx("span",{children:p})]})]}),N.map(I=>e.jsx("div",{className:"streak-particle",style:{left:I.x,top:I.y,"--tx":I.tx,"--ty":I.ty,"--rot":I.rot,animationDelay:`${I.delay}s`,fontSize:`${I.size}px`},children:I.emoji},I.id))]})}),Wn="_navBar_1z0zf_1",Hn="_navItem_1z0zf_14",Gn="_label_1z0zf_37",Yn="_sessionBtn_1z0zf_47",Un="_sessionCircle_1z0zf_63",Xn="_sessionDot_1z0zf_82",he={navBar:Wn,navItem:Hn,label:Gn,sessionBtn:Yn,sessionCircle:Un,sessionDot:Xn},qn=Te.memo(({selectedExercise:t,activeCategoryColor:a})=>{const{t:n}=q(),s=B(l=>l.openModal),c=B(l=>l.openSession),p=B(l=>l.sessionInProgress),d=Ne(l=>l.pauseCloudSync),o=a||t.color,g=t.gradient&&t.gradient[1]||o,i=(l,f,u)=>e.jsxs("button",{onClick:()=>s(l),"aria-label":u,className:he.navItem,children:[e.jsx(f,{size:19}),e.jsx("span",{className:he.label,children:u})]},l);return e.jsxs("nav",{className:`${he.navBar} dashboard-nav-bar`,children:[i("calendar",Ta,n("dashboard.calendar")),i("stats",Da,n("stats.title")),e.jsxs("button",{onClick:()=>{c("config"),d?.()},"aria-label":n(p?"dashboard.editSession":"dashboard.session"),className:he.sessionBtn,children:[e.jsxs("span",{className:he.sessionCircle,style:{background:`linear-gradient(135deg, ${o}, ${g})`,boxShadow:`0 6px 20px ${o}55, 0 0 0 1px ${o}33`},children:[e.jsx(Qt,{size:22,color:"white",fill:"white",style:{marginLeft:"2px"}}),p&&e.jsx("span",{className:he.sessionDot})]}),e.jsx("span",{className:he.label,children:n("dashboard.session")})]}),i("leaderboard",_a,n("leaderboard.title")),i("settings",Kt,n("settings.title"))]})}),Vn="_bubbleContainer_jjo0c_3",Jn="_bubble_jjo0c_3",Zn="_bubbleDragging_jjo0c_66",Qn="_progressRingBlob_jjo0c_79",Kn="_longPressRingBlob_jjo0c_100",er="_liveIndicator_jjo0c_121",tr="_bubbleIcon_jjo0c_137",ar="_pulseGlow_jjo0c_160",nr="_trailSphereFixed_jjo0c_176",rr="_trailSphereCurrent_jjo0c_192",or="_trailSphereVisible_jjo0c_199",sr="_overflowBadgeFixed_jjo0c_205",te={bubbleContainer:Vn,bubble:Jn,bubbleDragging:Zn,progressRingBlob:Qn,longPressRingBlob:Kn,liveIndicator:er,bubbleIcon:tr,pulseGlow:ar,trailSphereFixed:nr,trailSphereCurrent:rr,trailSphereVisible:or,overflowBadgeFixed:sr},Ft=6,ir=500,K=56,Ce=10,ct="session_bubble_side",dt="session_bubble_y",lr=.22,cr=.025,Ee=8,Lt=.14,dr=t=>{const a=[];for(let n=0;n<t;n++)a.push(Math.max(22,36-n*3));return a},ia=Te.memo(({onResume:t,onDiscard:a})=>{const{customExercises:n}=$e(),s=r.useMemo(()=>[...le,...Oe,...n],[n]),[{queue:c,currentIdx:p}]=r.useState(()=>Pn()),d=r.useMemo(()=>c.map(C=>s.find(D=>D.id===C)).filter(Boolean),[c,s]),o=r.useMemo(()=>d.length===0?0:p/d.length,[p,d.length]),[g,i]=r.useState(()=>sessionStorage.getItem(ct)||"right"),[l,f]=r.useState(()=>{const C=sessionStorage.getItem(dt);return C?parseFloat(C):.3}),u=r.useRef(null),m=r.useRef(null),x=r.useRef([]),y=r.useRef({x:0,y:0}),b=r.useRef([]),k=r.useRef(null),j=r.useRef(!1),[N,A]=r.useState(!1),[F,v]=r.useState(!1),[T,z]=r.useState(!1),[I,M]=r.useState(0),Y=r.useRef(null),O=r.useRef(null),E=r.useRef(!1),P=r.useRef(!1),V=r.useRef(null),W=r.useRef(null),_=r.useMemo(()=>d.slice(0,Ft),[d]),w=d.length-Ft,U=r.useMemo(()=>dr(_.length),[_.length]),J=r.useRef(U);r.useEffect(()=>{J.current=U},[U]),r.useEffect(()=>{sessionStorage.setItem(ct,g),sessionStorage.setItem(dt,l.toString())},[g,l]);const ue=r.useCallback(C=>{const D=window.innerHeight;return Math.max(70,Math.min(D-90,C))},[]),ge=r.useCallback(C=>{u.current&&(u.current.style.transform=`translate3d(${C.x}px, ${C.y}px, 0)`)},[]),Z=r.useCallback((C,D)=>{const H=x.current[C];H&&(H.style.transform=`translate3d(${D.x}px, ${D.y}px, 0)`)},[]),ve=r.useCallback(C=>{const D=J.current,H=C.y<window.innerHeight*.6;b.current.forEach(($,X)=>{const L=D[X]||24,Q=X===0?C:b.current[X-1],re=X===0?K:D[X-1]||24,xe=Q.x+(re-L)/2,ke=H?Q.y+re+Ee-2:Q.y-Ee-L+2,be=Math.max(.06,lr-X*cr);$.x+=(xe-$.x)*be,$.y+=(ke-$.y)*be,Z(X,$)})},[Z]);r.useEffect(()=>{const C=window.innerWidth,D=window.innerHeight,H=sessionStorage.getItem(ct)||"right",$=parseFloat(sessionStorage.getItem(dt)||"0.3"),X=H==="right"?C-K-Ce:Ce,L=Math.max(70,Math.min(D-90,$*D-K/2)),Q={x:X,y:L};y.current={...Q},ge(Q),b.current=_.map(()=>({...Q}))},[]),r.useEffect(()=>{if(j.current)return;const C=window.innerWidth,D=window.innerHeight,H=g==="right"?C-K-Ce:Ce,$=ue(l*D-K/2),X=()=>{const L=y.current,Q=H-L.x,re=$-L.y;if(Math.abs(Q)<.3&&Math.abs(re)<.3){L.x=H,L.y=$,ge(L);const xe=J.current,ke=L.y<D*.6;let be=L.y+(ke?K+Ee:0);b.current.forEach((je,ce)=>{const de=xe[ce]||24;je.x=L.x+(K-de)/2,ke?(je.y=be,be+=de+Ee-2):je.y=L.y-Ee-de-ce*(de+Ee-2),Z(ce,je)});return}L.x+=Q*Lt,L.y+=re*Lt,ge(L),ve(L),k.current=requestAnimationFrame(X)};cancelAnimationFrame(k.current),k.current=requestAnimationFrame(X)},[g,l,ue,ge,Z,ve]);const me=r.useCallback(()=>{const C=()=>{j.current&&(ve(y.current),k.current=requestAnimationFrame(C))};cancelAnimationFrame(k.current),k.current=requestAnimationFrame(C)},[ve]),ae=r.useCallback(()=>{Y.current=performance.now(),E.current=!1;const C=D=>{if(!Y.current)return;const H=Math.min(1,(D-Y.current)/ir);if(M(H),H>=1){E.current=!0,Y.current=null,M(0),navigator.vibrate&&navigator.vibrate(30),a();return}O.current=requestAnimationFrame(C)};O.current=requestAnimationFrame(C)},[a]),we=r.useCallback(()=>{Y.current=null,cancelAnimationFrame(O.current),M(0)},[]),Le=r.useCallback(C=>{C.preventDefault(),C.stopPropagation(),m.current&&m.current.setPointerCapture(C.pointerId),V.current={x:C.clientX,y:C.clientY},E.current=!1,P.current=!1,ae()},[ae]),Se=r.useCallback(C=>{if(!V.current)return;const D=C.clientX-V.current.x,H=C.clientY-V.current.y;if(Math.sqrt(D*D+H*H)<=8)return;if(we(),P.current=!0,!j.current){j.current=!0,A(!0),cancelAnimationFrame(k.current);const L=y.current;b.current=_.map(()=>({x:L.x,y:L.y})),me(),W.current=setTimeout(()=>v(!0),100)}const $=Math.max(Ce,Math.min(window.innerWidth-K-Ce,C.clientX-K/2)),X=ue(C.clientY-K/2);y.current.x=$,y.current.y=X,ge(y.current)},[ue,we,me,ge,_]),De=r.useCallback(()=>{if(we(),clearTimeout(W.current),j.current){j.current=!1,cancelAnimationFrame(k.current);const D=y.current.x+K/2<window.innerWidth/2?"left":"right",H=window.innerHeight,$=Math.max(.1,Math.min(.9,(y.current.y+K/2)/H));i(D),f($),z(!0),setTimeout(()=>{v(!1),z(!1)},280),A(!1)}V.current=null,!P.current&&!E.current&&t(),P.current=!1},[t,we]);r.useEffect(()=>{F&&requestAnimationFrame(()=>{b.current.forEach((C,D)=>Z(D,C))})},[F,Z]),r.useEffect(()=>()=>{cancelAnimationFrame(k.current),cancelAnimationFrame(O.current),clearTimeout(W.current)},[]);const et=e.jsxs(e.Fragment,{children:[e.jsxs("div",{ref:u,className:te.bubbleContainer,style:{position:"fixed",top:0,left:0,width:`${K}px`,height:`${K}px`,zIndex:Ye.FLOATING_BUBBLE,willChange:"transform"},children:[!N&&I===0&&e.jsx("div",{className:te.pulseGlow}),I>0&&e.jsx("div",{className:te.longPressRingBlob,style:{background:`conic-gradient(from 0deg, #ef4444 0deg, #ef4444 ${I*360}deg, rgba(239,68,68,0.08) ${I*360}deg, rgba(239,68,68,0.08) 360deg)`}}),e.jsxs("div",{ref:m,className:`${te.bubble} ${N?te.bubbleDragging:""}`,onPointerDown:Le,onPointerMove:Se,onPointerUp:De,onPointerCancel:De,children:[e.jsx("div",{className:te.progressRingBlob,style:{background:`conic-gradient(from 0deg, #a78bfa 0deg, #a78bfa ${o*360}deg, rgba(255,255,255,0.06) ${o*360}deg, rgba(255,255,255,0.06) 360deg)`}}),e.jsx("div",{className:te.liveIndicator}),e.jsx("div",{className:te.bubbleIcon,children:e.jsx(Qt,{size:18,fill:"#a78bfa",color:"#a78bfa",style:{marginLeft:"2px"}})})]})]}),_.map((C,D)=>{const H=D===p,$=U[D],X=Math.max(.5,1-D*.1),L=F&&!T,Q=T;let re="0ms";return L?re=`${D*50}ms`:Q&&(re=`${(_.length-1-D)*30}ms`),e.jsx("div",{ref:xe=>{x.current[D]=xe},className:`${te.trailSphereFixed} ${H?te.trailSphereCurrent:""} ${L?te.trailSphereVisible:""}`,style:{position:"fixed",top:0,left:0,width:`${$}px`,height:`${$}px`,zIndex:Ye.FLOATING_BUBBLE-1,willChange:"transform",pointerEvents:"none",background:`linear-gradient(135deg, ${C.color}25, ${C.color}12)`,borderColor:H?`${C.color}80`:`${C.color}35`,"--sphere-glow":`${C.color}50`,opacity:L?X:0,transitionDelay:re},children:e.jsx(kt,{icon:C.icon,size:Math.max(10,$-14),color:C.color})},C.id)}),w>0&&e.jsxs("div",{className:`${te.overflowBadgeFixed} ${F&&!T?te.trailSphereVisible:""}`,style:{position:"fixed",zIndex:Ye.FLOATING_BUBBLE-1,pointerEvents:"none",opacity:F&&!T?1:0,transitionDelay:F&&!T?`${_.length*50}ms`:"0ms"},children:["+",w]})]});return ze.createPortal(et,document.body)});ia.displayName="SessionBubble";const R={BODYWEIGHT:"bodyweight",WEIGHTS:"weights",CARDIO:"cardio",CUSTOM:"custom"},pr=[R.CARDIO,R.BODYWEIGHT,R.WEIGHTS,R.CUSTOM],bt={[R.BODYWEIGHT]:"#8b5cf6",[R.WEIGHTS]:"#f97316",[R.CARDIO]:"#ef4444",[R.CUSTOM]:"#34d399"};function ur(t=[]){return[...pr,...t.filter(a=>a.id!=="custom").map(a=>a.id)]}function gr(t=[]){const a={...bt};return t.forEach(n=>{a[n.id]=n.color}),a}function fe(t){return typeof t=="string"&&t.startsWith("cat_")}const fr=({fullCategoryOrder:t,activeSlide:a,customCategories:n,scrollContainerRef:s,anyModalOpen:c})=>{const{t:p}=q(),[d,o]=r.useState(!1),[g,i]=r.useState(null),l=r.useRef({timer:null,startY:0,startX:0,isLongPress:!1}),f=r.useRef(null);r.useEffect(()=>{const m=f.current;if(!m)return;const x=y=>{l.current.isLongPress&&y.cancelable&&y.preventDefault()};return m.addEventListener("touchmove",x,{passive:!1}),()=>m.removeEventListener("touchmove",x)},[]);const u=(m,x)=>{const b=Math.max(1,x.height-24),k=Math.max(0,Math.min(b,m-x.top-12)),j=t.length,N=Math.floor(k/b*j);return Math.min(j-1,N)};return e.jsx("div",{ref:f,className:`category-nav-container ${d?"expanded":""}`,onPointerDown:m=>{const x=m.clientY,y=m.clientX,b=m.currentTarget,k=m.pointerType==="mouse";l.current.startY=x,l.current.startX=y,l.current.isLongPress=!1;const j=k?0:200;l.current.timer=setTimeout(()=>{l.current.isLongPress=!0,o(!0),b.setPointerCapture(m.pointerId),b.style.touchAction="none",window.navigator.vibrate&&navigator.userActivation?.hasBeenActive&&window.navigator.vibrate(k?2:10);const N=b.getBoundingClientRect(),A=u(x,N);i(A),A!==a&&s.current?.scrollTo({top:s.current.clientHeight*A,behavior:"smooth"})},j)},onPointerUp:m=>{if(clearTimeout(l.current.timer),l.current.isLongPress)o(!1),i(null),m.currentTarget.releasePointerCapture(m.pointerId),m.currentTarget.style.touchAction="pan-y",l.current.isLongPress=!1;else{if(m.target.closest(".category-nav-dot"))return;const y=m.clientX,b=m.clientY,k=m.currentTarget;k.style.pointerEvents="none";const j=document.elementFromPoint(y,b);k.style.pointerEvents="auto",j&&(typeof j.click=="function"?j.click():j.dispatchEvent(new MouseEvent("click",{bubbles:!0,cancelable:!0,view:window})))}},onPointerMove:m=>{if(!l.current.isLongPress){const k=Math.abs(m.clientY-l.current.startY),j=Math.abs(m.clientX-l.current.startX);(k>30||j>30)&&clearTimeout(l.current.timer);return}const y=m.currentTarget.getBoundingClientRect(),b=u(m.clientY,y);i(k=>{if(k!==b){const j=s.current;return j&&j.scrollTo({top:j.clientHeight*b,behavior:"smooth"}),window.navigator.vibrate&&m.pointerType!=="mouse"&&navigator.userActivation?.hasBeenActive&&window.navigator.vibrate(5),b}return k})},onPointerCancel:m=>{clearTimeout(l.current.timer),l.current.isLongPress&&(o(!1),i(null),m.currentTarget.style.touchAction="pan-y",l.current.isLongPress=!1)},onContextMenu:m=>{l.current.isLongPress&&m.preventDefault()},style:{pointerEvents:c?"none":"auto"},children:t.map((m,x)=>{const y=fe(m),b=d&&g===x,j=b||!d&&a===x,N=b,A=v=>v===R.BODYWEIGHT?p("common.bodyweight"):v===R.WEIGHTS?p("common.weights"):v===R.CARDIO?p("common.cardio"):v===R.CUSTOM?p("common.custom"):n.find(T=>T.id===v)?.name||v;let F;return j?F=y?"#94a3b8":"var(--text-primary)":F=y?"#475569":"var(--text-secondary)",e.jsx("div",{className:`category-nav-dot ${j?"active":""} ${N?"drag-over":""}`,onClick:v=>{v.stopPropagation();const T=s.current;T&&T.scrollTo({top:T.clientHeight*x,behavior:"smooth"})},style:{background:F},children:e.jsx("span",{className:"category-nav-label",children:A(m)})},x)})})},ht=Vt(t=>({hud:null,setHud:a=>t({hud:a})})),S=(t,a=0)=>{const n=Math.sin((t+1)*9301+a*4957)*49297;return n-Math.floor(n)};function mr(t,{today:a,dayNumber:n,getExerciseCount:s,getConfig:c,completions:p}){return r.useMemo(()=>t?le.length>0&&le.every(d=>{const o=s(a,d.id),g=c(d.id,a).difficulty,i=Fe(d,n,g);return p[a]?.[d.id]?.isCompleted||o>=i}):!1,[t,a,p,n,s,c])}function xr({active:t,perfect:a,introKey:n,doneKey:s,keepAmbianceAfterReward:c,autoReward:p}){const[d,o]=r.useState(()=>t&&!!sessionStorage.getItem(n)),[g,i]=r.useState(()=>t&&!!localStorage.getItem(s)),[l,f]=r.useState(!1),u=r.useRef(!1);r.useEffect(()=>{p&&t&&a&&!g&&!d&&setTimeout(()=>{i(!0),localStorage.setItem(s,"1")},0)},[p,t,a,g,d,s]);const m=t&&!d&&!g,x=t&&!l&&(c?d||g:d&&!g),y=r.useCallback(()=>{o(!0),sessionStorage.setItem(n,"1")},[n]),b=r.useCallback(()=>{u.current||(u.current=!0,f(!0))},[]);r.useEffect(()=>{if(!p||!(t&&d&&!g)||!a||u.current)return;let N=!1;return queueMicrotask(()=>{N||b()}),()=>{N=!0}},[p,t,d,g,a,b]);const k=r.useCallback(()=>{f(!1),i(!0),localStorage.setItem(s,"1")},[s]);return{showIntro:m,ambianceActive:x,showReward:l,done:g,dismissIntro:y,completeReward:k,triggerReward:b}}const Bt=(t,a)=>typeof t=="function"?t(a):t;function jt(t){const{isActive:a,introKey:n,doneKey:s,keepAmbianceAfterReward:c=!1,autoReward:p=!0,activeClasses:d=[],doneClass:o=null,hudProps:g,Intro:i,Decor:l,Hud:f,Reward:u}=t;return function(x){const y=a(x),b=mr(y,x),{showIntro:k,ambianceActive:j,showReward:N,done:A,dismissIntro:F,completeReward:v,triggerReward:T}=xr({active:y,perfect:b,introKey:Bt(n,x),doneKey:Bt(s,x),keepAmbianceAfterReward:c,autoReward:p});r.useEffect(()=>{const M=document.getElementById("root");if(M)return j?M.classList.add(...d):M.classList.remove(...d),o&&M.classList.toggle(o,A),()=>{M.classList.remove(...d),o&&M.classList.remove(o)}},[j,A]);const z=j&&f&&g?g(x):null,I=z?JSON.stringify(z):"";return r.useEffect(()=>{!j||!f||ht.getState().setHud({Component:f,props:{onSolve:T,...z||{}}})},[j,I,T]),r.useEffect(()=>{if(!(!j||!f))return()=>ht.getState().setHud(null)},[j]),y?e.jsxs(e.Fragment,{children:[k&&e.jsx(i,{onDismiss:F}),N&&e.jsx(u,{onComplete:v}),j&&l&&e.jsx(l,{})]}):null}}const Ct=()=>e.jsx("style",{dangerouslySetInnerHTML:{__html:`
        /* ── Global wrapper: tints the entire dashboard ── */
        .day100-global {
          position: relative;
        }

        /* ── PALETTE DE THÈME "HACK" (cohérente partout) ──
           On redéfinit l'ensemble des tokens du thème sur la racine de l'event,
           comme un vrai [data-theme]. Tout ce qui consomme var(--…) (modales,
           barres, cartes, mur cardio, sliders…) s'adapte automatiquement.
           Surfaces denses et opaques pour l'atmosphère d'intrusion. */
        .day100-global {
          /* Accent : rouge alerte + lueur */
          --accent: rgb(239, 68, 68) !important;
          --accent-glow: rgb(248, 113, 113) !important;

          /* Surfaces sombres rouges */
          --bg-color: rgb(8, 3, 3) !important;
          --card-bg: rgba(22, 8, 8, 0.45) !important;
          --surface-elevated: linear-gradient(135deg, rgba(28, 10, 10, 0.62), rgba(42, 12, 12, 0.66)) !important;
          --surface-section: linear-gradient(135deg, rgba(28, 10, 10, 0.85), rgba(42, 12, 12, 0.92)) !important;
          --surface-subtle: rgba(239, 68, 68, 0.06) !important;
          --surface-muted: rgba(239, 68, 68, 0.10) !important;
          --surface-dim: rgba(239, 68, 68, 0.14) !important;
          --surface-hover: rgba(239, 68, 68, 0.16) !important;

          /* Bordures rouges */
          --border-subtle: rgba(239, 68, 68, 0.10) !important;
          --border-muted: rgba(239, 68, 68, 0.14) !important;
          --border-default: rgba(239, 68, 68, 0.22) !important;
          --border-strong: rgba(239, 68, 68, 0.35) !important;

          /* Overlays / sheets */
          --overlay-bg: rgb(10, 3, 3) !important;
          --sheet-bg: rgba(18, 6, 6, 0.97) !important;
          --progress-track: rgba(239, 68, 68, 0.15) !important;

          /* Lueurs de fond : rouge + soupçon de cyan (glitch) */
          --body-glow-1: rgba(239, 68, 68, 0.12) !important;
          --body-glow-2: rgba(14, 165, 233, 0.06) !important;

          /* Gradients : rouge → cyan → vert (signature glitch) */
          --gradient-primary: linear-gradient(135deg, #ef4444 0%, #f97316 100%) !important;
          --gradient-accent: linear-gradient(135deg, #ef4444 0%, #0ea5e9 100%) !important;
          --gradient-glow: linear-gradient(135deg, #ef4444 0%, #0ea5e9 50%, #10b981 100%) !important;
          --glow-primary: 0 0 20px rgba(239, 68, 68, 0.4) !important;
          --glow-accent: 0 0 25px rgba(239, 68, 68, 0.5) !important;
        }
        .day100-global::before {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(239, 68, 68, 0.12) 0%, transparent 70%),
                      radial-gradient(ellipse at 70% 80%, rgba(239, 68, 68, 0.08) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
          animation: bgPulseHack 4s ease-in-out infinite alternate;
        }

        @keyframes bgPulseHack {
          0%   { opacity: 0.5; filter: hue-rotate(0deg); }
          50%  { opacity: 1;   filter: hue-rotate(10deg); }
          100% { opacity: 0.6; filter: hue-rotate(-5deg); }
        }

        /* ── CRT Scanlines overlay ── */
        .day100-scanlines {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.08) 2px,
            rgba(0, 0, 0, 0.08) 4px
          );
          animation: scanlineScroll 8s linear infinite;
        }

        @keyframes scanlineScroll {
          0%   { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }

        /* ── Horizontal glitch bars ── */
        .day100-glitch-bar-1, .day100-glitch-bar-2, .day100-glitch-bar-3 {
          position: fixed;
          left: 0;
          right: 0;
          height: 3px;
          pointer-events: none;
          z-index: 9998;
          background: linear-gradient(90deg, transparent 5%, rgba(239, 68, 68, 0.6) 15%, rgba(14, 165, 233, 0.4) 50%, rgba(239, 68, 68, 0.5) 85%, transparent 95%);
          mix-blend-mode: screen;
        }
        .day100-glitch-bar-1 { animation: glitchBar1 3.5s infinite; }
        .day100-glitch-bar-2 { animation: glitchBar2 4.2s infinite 0.8s; }
        .day100-glitch-bar-3 { animation: glitchBar3 2.8s infinite 1.5s; }

        @keyframes glitchBar1 {
          0%, 85%, 100% { opacity: 0; top: 20%; }
          87% { opacity: 1; top: 20%; }
          90% { opacity: 1; top: 22%; height: 2px; }
          93% { opacity: 0; top: 25%; }
        }
        @keyframes glitchBar2 {
          0%, 78%, 100% { opacity: 0; top: 55%; }
          80% { opacity: 1; top: 55%; }
          83% { opacity: 0.8; top: 58%; height: 4px; }
          86% { opacity: 0; top: 60%; }
        }
        @keyframes glitchBar3 {
          0%, 90%, 100% { opacity: 0; top: 75%; }
          92% { opacity: 1; top: 75%; height: 1px; }
          95% { opacity: 0.6; top: 78%; height: 6px; }
          97% { opacity: 0; top: 80%; }
        }

        /* ── Matrix rain columns ── */
        .day100-matrix-rain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .day100-matrix-col {
          position: absolute;
          top: -100%;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 14px;
          color: rgba(16, 185, 129, 0.35);
          text-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
          writing-mode: vertical-rl;
          white-space: nowrap;
          animation: matrixFall linear infinite;
          user-select: none;
        }

        @keyframes matrixFall {
          0%   { transform: translateY(0); }
          100% { transform: translateY(250vh); }
        }

        /* ── Glitch background for slides ── */
        .day100-global .dashboard-slide-bg {
          background: radial-gradient(circle at center, rgba(239, 68, 68, 0.06) 0%, transparent 70%) !important;
        }

        /* ── Main glitch text (the "100" number) ── */
        .day100-global .day-number,
        .day100-global .day-number-anim {
          color: #ef4444 !important;
          text-shadow: 3px 3px #0ea5e9, -3px -3px #10b981 !important;
          animation: textGlitch 0.5s steps(2) infinite !important;
          position: relative;
          font-family: 'Courier New', monospace !important;
          letter-spacing: 4px !important;
        }
        .day100-global .day-number::before,
        .day100-global .day-number::after,
        .day100-global .day-number-anim::before,
        .day100-global .day-number-anim::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          font-size: inherit;
          font-weight: inherit;
          line-height: inherit;
        }
        .day100-global .day-number::before,
        .day100-global .day-number-anim::before {
          color: #0ea5e9;
          animation: glitchClip1 2s steps(3) infinite;
          clip-path: inset(0 0 60% 0);
          transform: translate(-4px, -2px);
        }
        .day100-global .day-number::after,
        .day100-global .day-number-anim::after {
          color: #10b981;
          animation: glitchClip2 2.5s steps(3) infinite 0.3s;
          clip-path: inset(40% 0 0 0);
          transform: translate(4px, 2px);
        }

        @keyframes textGlitch {
          0%  { transform: translate(0); text-shadow: 3px 3px #0ea5e9, -3px -3px #10b981; }
          20% { transform: translate(-4px, 3px); text-shadow: -3px 3px #0ea5e9, 3px -3px #10b981; }
          40% { transform: translate(4px, -2px); text-shadow: 4px -3px #0ea5e9, -4px 3px #10b981; }
          60% { transform: translate(-2px, -4px) skewX(4deg); text-shadow: 2px 2px #0ea5e9, -2px -2px #10b981; opacity: 0.85; }
          80% { transform: translate(3px, 4px) skewX(-2deg); text-shadow: -3px 3px #0ea5e9, 3px -3px #10b981; opacity: 1; }
          100%{ transform: translate(0); text-shadow: 3px 3px #0ea5e9, -3px -3px #10b981; }
        }

        @keyframes glitchClip1 {
          0%   { clip-path: inset(0 0 80% 0); transform: translate(-4px, -2px); }
          25%  { clip-path: inset(20% 0 50% 0); transform: translate(3px, 1px); }
          50%  { clip-path: inset(50% 0 20% 0); transform: translate(-2px, 3px); }
          75%  { clip-path: inset(10% 0 70% 0); transform: translate(4px, -1px); }
          100% { clip-path: inset(0 0 80% 0); transform: translate(-4px, -2px); }
        }
        @keyframes glitchClip2 {
          0%   { clip-path: inset(60% 0 0 0); transform: translate(4px, 2px); }
          25%  { clip-path: inset(30% 0 40% 0); transform: translate(-3px, -1px); }
          50%  { clip-path: inset(70% 0 10% 0); transform: translate(2px, -3px); }
          75%  { clip-path: inset(45% 0 25% 0); transform: translate(-4px, 1px); }
          100% { clip-path: inset(60% 0 0 0); transform: translate(4px, 2px); }
        }

        /* ── Text overrides via CSS (Plug & Play) ── */
        .day100-global .app-logo-text {
          font-family: 'Courier New', monospace !important;
          color: #ef4444 !important;
          text-shadow: 0 0 8px rgba(239, 68, 68, 0.5) !important;
          font-size: 0 !important;
        }
        .day100-global .app-logo-text::after {
          content: 'HACKED';
          font-size: clamp(1.1rem, 2.5vh, 1.5rem);
        }

        .day100-global .day-label {
          color: #ef4444 !important;
          font-family: 'Courier New', monospace !important;
          text-transform: uppercase !important;
          letter-spacing: 6px !important;
          text-shadow: 0 0 12px rgba(239, 68, 68, 0.9), 0 0 40px rgba(239, 68, 68, 0.3) !important;
          animation: blinkHack 2s steps(8) infinite !important;
        }
        .day100-global .day-label-text {
          font-size: 0 !important;
        }
        .day100-global .day-label-text::after {
          content: 'SYSTEM_OVERRIDE';
          font-size: var(--day-label-size, clamp(0.75rem, 1.6vh, 1rem));
        }

        @keyframes blinkHack {
          0%, 100% { opacity: 1; }
          45% { opacity: 0.7; }
          50% { opacity: 0.1; }
          52% { opacity: 1; }
          55% { opacity: 0.3; }
          58% { opacity: 1; }
          80% { opacity: 0.9; }
          82% { opacity: 0.15; }
          85% { opacity: 1; }
        }

        /* ── Central button hacked style (le border est laissé à l'anneau) ── */
        .day100-global .counter-button {
          background: repeating-radial-gradient(circle, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.1) 4px, transparent 4px, transparent 8px) !important;
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.6), inset 0 0 25px rgba(239, 68, 68, 0.4) !important;
          animation: counterBlobMorph 9s ease-in-out infinite, buttonGlitch 3s infinite !important;
        }
        /* ── Year-progress ring: glitch-red tint ── */
        .day100-global .counter-ring {
          --ring-c1: #ef4444 !important;
          --ring-c2: #f87171 !important;
          --ring-track: rgba(239, 68, 68, 0.15) !important;
        }

        .day100-global .counter-button span {
          color: #ef4444 !important;
          font-family: 'Courier New', monospace !important;
          text-shadow: 0 0 8px rgba(239, 68, 68, 0.8) !important;
        }

        .day100-global .counter-button svg {
          color: #ef4444 !important;
          filter: drop-shadow(0 0 5px #ef4444) !important;
        }

        @keyframes buttonGlitch {
          0%, 100% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.6), inset 0 0 25px rgba(239, 68, 68, 0.4); transform: scale(1); }
          88% { transform: scale(1) translate(0); }
          90% { transform: scale(1.05) translate(4px, -3px); box-shadow: 0 0 50px rgba(239, 68, 68, 0.9), inset 0 0 40px rgba(239, 68, 68, 0.6); }
          92% { transform: scale(0.95) translate(-5px, 4px); box-shadow: 0 0 15px rgba(14, 165, 233, 0.7); }
          94% { transform: scale(1.02) translate(3px, 3px); box-shadow: 0 0 35px rgba(239, 68, 68, 0.8); }
          96% { transform: scale(1) translate(-2px, -2px); box-shadow: 0 0 30px rgba(239, 68, 68, 0.6); }
        }

        /* ── Hacked header style ── */
        .day100-global .dashboard-header {
          border-color: rgba(239, 68, 68, 0.3) !important;
          background: rgba(239, 68, 68, 0.04) !important;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.1), inset 0 0 30px rgba(239, 68, 68, 0.03) !important;
          animation: headerFlicker 4s infinite !important;
        }

        @keyframes headerFlicker {
          0%, 100% { border-color: rgba(239, 68, 68, 0.3); }
          48% { border-color: rgba(239, 68, 68, 0.3); }
          50% { border-color: rgba(14, 165, 233, 0.5); box-shadow: 0 0 20px rgba(14, 165, 233, 0.15); }
          52% { border-color: rgba(239, 68, 68, 0.3); }
          75% { border-color: rgba(239, 68, 68, 0.3); }
          76% { border-color: rgba(16, 185, 129, 0.4); }
          78% { border-color: rgba(239, 68, 68, 0.3); }
        }

        /* ── Hacked exercise buttons (Premium Glitch Style) ── */
        .day100-global .exercise-button {
          border: 1px solid rgba(239, 68, 68, 0.5) !important;
          background: repeating-linear-gradient(0deg, rgba(239, 68, 68, 0.03), rgba(239, 68, 68, 0.03) 2px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.3) 4px) !important;
          box-shadow: inset 0 0 15px rgba(239, 68, 68, 0.15), 0 4px 10px rgba(0, 0, 0, 0.4) !important;
          position: relative;
          overflow: hidden;
          animation: exBtnCorrupt 6s steps(5) infinite !important;
          border-radius: 4px !important; /* more geometric/terminal look */
        }
        
        .day100-global .exercise-button:hover {
          background: rgba(239, 68, 68, 0.15) !important;
          box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.4), 0 0 15px rgba(239, 68, 68, 0.5) !important;
          border-color: #ef4444 !important;
        }

        /* Glitch overlay on hover */
        .day100-global .exercise-button::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(14, 165, 233, 0.1);
          opacity: 0;
          pointer-events: none;
        }
        .day100-global .exercise-button:hover::after {
          animation: tileGlitchAnim 0.3s steps(2) infinite;
        }

        @keyframes tileGlitchAnim {
          0% { transform: translate(2px, -2px); opacity: 0.5; }
          50% { transform: translate(-2px, 2px); opacity: 0.8; }
          100% { transform: translate(0, 0); opacity: 0; }
        }

        /* Override all texts inside to red and monospace */
        .day100-global .exercise-button span {
          color: #ef4444 !important;
          font-family: 'Courier New', monospace !important;
          text-shadow: 0 0 5px rgba(239, 68, 68, 0.5) !important;
          letter-spacing: 1px !important;
        }
        
        /* The count text slightly brighter */
        .day100-global .exercise-button span:last-of-type {
          color: #fca5a5 !important;
          font-weight: 800 !important;
        }

        /* Override icon chip background and svg color */
        .day100-global .exercise-button > div:not(:last-child):not([class*="streak"]) {
          background: rgba(239, 68, 68, 0.1) !important;
          border: 1px dashed rgba(239, 68, 68, 0.4) !important;
          border-radius: 4px !important;
        }
        
        /* Ensure SVGs inherit the red corrupted color */
        .day100-global .exercise-button svg {
          color: #ef4444 !important;
          stroke: #ef4444 !important;
          filter: drop-shadow(0 0 2px #ef4444) !important;
        }

        /* Progress bar override */
        .day100-global .exercise-button > div:last-child {
          background: rgba(0, 0, 0, 0.5) !important;
          height: 4px !important;
        }
        .day100-global .exercise-button > div:last-child > div {
          background: #ef4444 !important;
          box-shadow: 0 0 8px #ef4444, 0 0 15px #ef4444 !important;
        }
        
        @keyframes exBtnCorrupt {
          0%, 92%, 100% { filter: none; transform: none; }
          94% { filter: hue-rotate(90deg) brightness(1.5); transform: skewX(2deg); }
          96% { filter: hue-rotate(-90deg) contrast(1.5); transform: skewX(-2deg); }
          98% { filter: invert(1); transform: none; }
        }

        /* ── Hacked bottom actions bar ── */
        .day100-global .dashboard-nav-bar button {
          border: 1px solid rgba(239, 68, 68, 0.4) !important;
          background: rgba(239, 68, 68, 0.1) !important;
          font-family: 'Courier New', monospace !important;
          color: #ef4444 !important;
          text-shadow: 0 0 6px rgba(239, 68, 68, 0.4) !important;
          box-shadow: inset 0 0 8px rgba(239, 68, 68, 0.2) !important;
          transition: all 0.2s ease !important;
        }
        
        .day100-global .dashboard-nav-bar button:hover {
          background: rgba(239, 68, 68, 0.25) !important;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.5), inset 0 0 12px rgba(239, 68, 68, 0.4) !important;
          border-color: #ef4444 !important;
        }
        
        .day100-global .dashboard-nav-bar span {
          color: #ef4444 !important;
        }
        .day100-global .dashboard-nav-bar svg {
          stroke: #ef4444 !important;
          filter: drop-shadow(0 0 3px #ef4444) !important;
        }
        
        /* ── Glitch Ring ── */
        .day100-global .progress-ring-svg {
          filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.6)) !important;
        }
        .day100-global .progress-ring-svg circle {
          stroke: #ef4444 !important;
          animation: ringPulse 2s infinite !important;
        }
        
        @keyframes ringPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* ── Floating hacked messages ── */
        .day100-msg {
          position: fixed;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          font-weight: 700;
          color: rgba(239, 68, 68, 0.6);
          text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
          pointer-events: none;
          z-index: 9997;
          white-space: nowrap;
          animation: msgFloat 6s ease-in-out infinite;
        }

        @keyframes msgFloat {
          0%   { opacity: 0; transform: translateX(-20px); }
          10%  { opacity: 0.8; }
          50%  { opacity: 0.6; transform: translateX(10px); }
          90%  { opacity: 0.3; }
          100% { opacity: 0; transform: translateX(30px); }
        }

        /* ── Screen-wide flicker effect ── */
        .day100-flicker {
          animation: screenFlicker 8s infinite;
        }

        @keyframes screenFlicker {
          0%, 100% { opacity: 1; }
          92%  { opacity: 1; }
          93%  { opacity: 0.6; }
          93.5%{ opacity: 1; }
          96%  { opacity: 1; }
          96.5%{ opacity: 0.3; }
          97%  { opacity: 0.9; }
          97.5%{ opacity: 1; }
        }

        /* ── Progress ring override for Day 100 ── */
        .day100-ring circle {
          stroke: #ef4444 !important;
          filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.5));
        }

        /* ── Vignette corners (dark burn) ── */
        .day100-vignette {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9996;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.4) 100%);
        }

        /* ── Day 100 Hack Modal animations ── */
        @keyframes hackModalIn {
          0%   { opacity: 0; }
          30%  { opacity: 0.3; }
          32%  { opacity: 0; }
          35%  { opacity: 0.6; }
          37%  { opacity: 0.1; }
          40%  { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes hackModalOut {
          0%   { opacity: 1; filter: none; }
          30%  { opacity: 0.8; filter: hue-rotate(40deg) brightness(1.5); }
          60%  { opacity: 0.3; filter: hue-rotate(90deg) brightness(2); }
          100% { opacity: 0; filter: hue-rotate(180deg) brightness(3); }
        }
        @keyframes terminalLineIn {
          0%   { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes terminalBtnIn {
          0%   { opacity: 0; transform: translateY(10px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* ── Day 100 Unhack (System Restored) animations ── */
        @keyframes unhackGlitchBurst {
          0%  { opacity: 0; }
          15% { opacity: 1; transform: translateX(5px); }
          25% { opacity: 0.3; transform: translateX(-8px); }
          40% { opacity: 0.8; transform: translateX(3px) skewX(2deg); }
          55% { opacity: 0.2; transform: translateX(-4px) skewX(-3deg); }
          70% { opacity: 0.9; transform: translateX(6px); }
          85% { opacity: 0.4; transform: translateX(-2px); }
          100%{ opacity: 0; transform: translateX(0); }
        }
        @keyframes whiteFlash {
          0%   { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes restoredReveal {
          0%   { opacity: 0; transform: scale(0.3) translateY(30px); filter: blur(10px); }
          60%  { opacity: 1; transform: scale(1.08) translateY(-5px); filter: blur(0); }
          100% { transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes unhackFadeOut {
          0%   { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ── Smooth unhack transition on dashboard ── */
        .day100-unhacking {
          animation: unhackCleanup 1.5s ease-out forwards;
        }
        @keyframes unhackCleanup {
          0%   { filter: hue-rotate(0deg) saturate(1); }
          50%  { filter: hue-rotate(30deg) saturate(1.5) brightness(1.1); }
          100% { filter: none; }
        }
    `}}),Wt="01アイウエオカキクケコABCDEF0123456789",Ht=["> ACCESS_GRANTED","BREACH DETECTED ███","// 100 DAYS — NO MERCY","SYS_OVERRIDE: 0x64","█▓▒░ HACK COMPLETE ░▒▓█","FIREWALL BYPASSED","> rm -rf weakness/","ENCRYPTION: NONE","100_DAYS.exe RUNNING...","WARNING: UNSTOPPABLE","PROTOCOL: BEAST_MODE","> sudo unlock --power"],br=(t,a)=>{let n="";for(let s=0;s<t;s++)n+=Wt[Math.floor(S(s,a)*Wt.length)];return n},hr=Array.from({length:18},(t,a)=>({id:a,left:`${a/18*100+S(a,1)*4}%`,text:br(40+Math.floor(S(a,2)*30),a),duration:`${8+S(a,3)*12}s`,delay:`${S(a,4)*8}s`,opacity:.15+S(a,5)*.25,fontSize:`${10+Math.floor(S(a,6)*4)}px`})),yr=Array.from({length:6},(t,a)=>({id:a,text:Ht[a%Ht.length],top:`${12+a*14+S(a,7)*5}%`,left:`${5+S(a,8)*60}%`,delay:`${a*1.5+S(a,9)*2}s`,animDuration:`${5+S(a,10)*4}s`})),vr=r.memo(()=>e.jsxs(e.Fragment,{children:[e.jsx(Ct,{}),e.jsx("div",{className:"day100-matrix-rain","aria-hidden":"true",children:hr.map(t=>e.jsx("div",{className:"day100-matrix-col",style:{left:t.left,animationDuration:t.duration,animationDelay:t.delay,opacity:t.opacity,fontSize:t.fontSize},children:t.text},t.id))}),e.jsx("div",{className:"day100-vignette","aria-hidden":"true"}),yr.map(t=>e.jsx("div",{className:"day100-msg",style:{top:t.top,left:t.left,animationDelay:t.delay,animationDuration:t.animDuration},children:t.text},t.id)),e.jsx("div",{className:"day100-glitch-bar-1","aria-hidden":"true"}),e.jsx("div",{className:"day100-glitch-bar-2","aria-hidden":"true"}),e.jsx("div",{className:"day100-glitch-bar-3","aria-hidden":"true"}),e.jsx("div",{className:"day100-scanlines","aria-hidden":"true"})]})),We=[{text:"> INTRUSION DÉTECTÉE...",delay:0,color:"#ef4444"},{text:"> PARE-FEU : DÉSACTIVÉ",delay:600,color:"#ef4444"},{text:"> CHIFFREMENT : COMPROMIS",delay:1200,color:"#f97316"},{text:"",delay:1600,color:"#666"},{text:"██████████████████████████████",delay:1800,color:"#ef4444"},{text:"  ALERTE SÉCURITÉ — JOUR 100",delay:2200,color:"#fbbf24"},{text:"██████████████████████████████",delay:2600,color:"#ef4444"},{text:"",delay:2800,color:"#666"},{text:"L'application a été piratée.",delay:3200,color:"#e2e8f0"},{text:"",delay:3400,color:"#666"},{text:"Des étudiants en BUT Informatique",delay:3800,color:"#e2e8f0"},{text:"tentent de corriger les failles.",delay:4400,color:"#e2e8f0"},{text:"",delay:4800,color:"#666"},{text:"Pour les aider, tu dois réaliser",delay:5200,color:"#10b981"},{text:"une JOURNÉE PARFAITE aujourd'hui.",delay:5800,color:"#10b981"},{text:"",delay:6200,color:"#666"},{text:"> Complète TOUS tes exercices.",delay:6600,color:"#0ea5e9"},{text:"> Le système sera restauré.",delay:7200,color:"#0ea5e9"}];function wr({onDismiss:t}){const[a,n]=r.useState(0),[s,c]=r.useState(!1),[p,d]=r.useState(!1);r.useEffect(()=>{const g=We.map((l,f)=>setTimeout(()=>n(f+1),l.delay)),i=setTimeout(()=>c(!0),We[We.length-1].delay+800);return()=>{g.forEach(clearTimeout),clearTimeout(i)}},[]);const o=()=>{d(!0),setTimeout(t,500)};return e.jsxs("div",{style:{position:"fixed",inset:0,background:"rgba(0, 0, 0, 0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2e4,padding:"20px",animation:p?"hackModalOut 0.5s ease-out forwards":"hackModalIn 0.6s ease-out"},children:[e.jsx(Ct,{}),e.jsxs("div",{style:{width:"100%",maxWidth:"420px",background:"rgba(10, 10, 15, 0.95)",border:"1px solid rgba(239, 68, 68, 0.4)",borderRadius:"12px",padding:"24px",boxShadow:"0 0 60px rgba(239, 68, 68, 0.15), 0 0 120px rgba(239, 68, 68, 0.05), inset 0 0 40px rgba(239, 68, 68, 0.03)",position:"relative",overflow:"hidden"},children:[e.jsx("div",{style:{position:"absolute",inset:0,background:"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",pointerEvents:"none",zIndex:1}}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px",marginBottom:"16px",paddingBottom:"10px",borderBottom:"1px solid rgba(239, 68, 68, 0.2)"},children:[e.jsx("div",{style:{width:"10px",height:"10px",borderRadius:"50%",background:"#ef4444",boxShadow:"0 0 6px #ef4444"}}),e.jsx("div",{style:{width:"10px",height:"10px",borderRadius:"50%",background:"#f97316",opacity:.6}}),e.jsx("div",{style:{width:"10px",height:"10px",borderRadius:"50%",background:"#22c55e",opacity:.4}}),e.jsx("span",{style:{marginLeft:"auto",fontFamily:"'Courier New', monospace",fontSize:"11px",color:"rgba(239, 68, 68, 0.6)",letterSpacing:"1px"},children:"TERMINAL — BREACH.SH"})]}),e.jsxs("div",{style:{fontFamily:"'Courier New', monospace",fontSize:"13px",lineHeight:"1.7",position:"relative",zIndex:2,minHeight:"280px"},children:[We.slice(0,a).map((g,i)=>e.jsx("div",{style:{color:g.color,animation:"terminalLineIn 0.15s ease-out",fontWeight:g.color==="#fbbf24"||g.color==="#10b981"?"700":"400",textShadow:g.color==="#ef4444"?"0 0 8px rgba(239,68,68,0.5)":"none"},children:g.text||" "},i)),!s&&e.jsx("span",{style:{display:"inline-block",width:"8px",height:"14px",background:"#10b981",animation:"cursorBlink 0.8s steps(2) infinite",verticalAlign:"text-bottom",marginLeft:"2px"}})]}),s&&e.jsx("button",{onClick:o,style:{width:"100%",marginTop:"20px",padding:"14px 24px",background:"linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08))",border:"1px solid rgba(239, 68, 68, 0.5)",borderRadius:"10px",color:"#ef4444",fontFamily:"'Courier New', monospace",fontSize:"14px",fontWeight:"700",letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",animation:"terminalBtnIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",textShadow:"0 0 10px rgba(239, 68, 68, 0.5)",position:"relative",zIndex:2,transition:"all 0.2s ease"},children:"> CORRIGER LES FAILLES"})]})]})}const ne={blackout:1e3,patching:2e3,progress:2e3,restored:1500,celebration:2e3},Sr=Object.values(ne).reduce((t,a)=>t+a,0),kr=Array.from({length:60},(t,a)=>({id:a,angle:S(a,1)*360,distance:30+S(a,2)*60,size:4+S(a,3)*8,color:["#10b981","#0ea5e9","#fbbf24","#8b5cf6","#ec4899","#6366f1"][Math.floor(S(a,4)*6)],duration:1200+S(a,5)*1e3,delay:S(a,6)*400,shape:Math.floor(S(a,7)*3)}));function jr({onComplete:t}){const[a,n]=r.useState("blackout"),[s,c]=r.useState(0);r.useEffect(()=>{const i=setTimeout(()=>n("patching"),ne.blackout),l=setTimeout(()=>n("progress"),ne.blackout+ne.patching),f=setTimeout(()=>n("restored"),ne.blackout+ne.patching+ne.progress),u=setTimeout(()=>n("celebration"),ne.blackout+ne.patching+ne.progress+ne.restored),m=setTimeout(t,Sr);return()=>[i,l,f,u,m].forEach(clearTimeout)},[t]),r.useEffect(()=>{if(a!=="progress")return;let i=null,l;const f=u=>{i||(i=u);const m=u-i,x=Math.min(m/ne.progress*100,100);c(x),x<100&&(l=requestAnimationFrame(f))};return l=requestAnimationFrame(f),()=>cancelAnimationFrame(l)},[a]);const p=a==="patching"||a==="progress"||a==="restored"||a==="celebration",d=a==="progress"||a==="restored"||a==="celebration",o=a==="restored"||a==="celebration",g=a==="celebration";return e.jsxs("div",{style:{position:"fixed",inset:0,background:"#000",zIndex:3e4,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden",animation:g?"unhackFadeOut 2s ease-out forwards":void 0},children:[e.jsx(Ct,{}),a==="blackout"&&e.jsx("div",{style:{position:"absolute",inset:0,animation:"unhackGlitchBurst 1s steps(4) forwards",background:"linear-gradient(180deg, transparent 30%, rgba(239,68,68,0.15) 50%, transparent 70%)"}}),p&&e.jsx("div",{style:{fontFamily:"'Courier New', monospace",fontSize:"clamp(14px, 3.5vw, 18px)",color:"#10b981",textShadow:"0 0 15px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.2)",letterSpacing:"3px",textTransform:"uppercase",animation:"terminalLineIn 0.3s ease-out",marginBottom:"24px",textAlign:"center",padding:"0 20px"},children:a==="patching"?"> CORRECTION DES FAILLES...":"> FAILLES CORRIGÉES ✓"}),d&&e.jsx("div",{style:{width:"min(80%, 320px)",height:"6px",background:"rgba(255,255,255,0.08)",borderRadius:"3px",overflow:"hidden",marginBottom:"32px",border:"1px solid rgba(16, 185, 129, 0.2)"},children:e.jsx("div",{style:{width:`${s}%`,height:"100%",borderRadius:"3px",background:"linear-gradient(90deg, #10b981, #0ea5e9)",boxShadow:"0 0 12px rgba(16, 185, 129, 0.6)",transition:a==="progress"?"none":"width 0.3s"}})}),o&&e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{position:"absolute",inset:0,background:"white",animation:"whiteFlash 0.6s ease-out forwards",pointerEvents:"none"}}),e.jsxs("div",{style:{fontSize:"clamp(2rem, 8vw, 4rem)",fontWeight:"900",fontFamily:"'Courier New', monospace",background:"linear-gradient(135deg, #10b981, #0ea5e9, #8b5cf6)",backgroundSize:"200% 200%",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",animation:"restoredReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), rainbowFlow 4s ease infinite",textShadow:"none",textAlign:"center",letterSpacing:"4px",padding:"0 16px"},children:["SYSTÈME",e.jsx("br",{}),"RESTAURÉ"]}),e.jsx("div",{style:{marginTop:"16px",fontSize:"clamp(0.8rem, 3vw, 1.1rem)",color:"rgba(255,255,255,0.7)",fontFamily:"'Courier New', monospace",textAlign:"center",animation:"terminalLineIn 0.4s ease-out 0.5s both"},children:"Merci, agent. Le Jour 100 est sécurisé. 🛡️"})]}),g&&e.jsx("div",{style:{position:"absolute",inset:0,pointerEvents:"none"},children:kr.map(i=>{const l=i.angle*Math.PI/180,f=["50%","3px","3px"],u=[i.size,i.size,i.size*.5],m=[i.size,i.size,i.size*1.6];return e.jsx("div",{style:{position:"absolute",left:"50%",top:"50%",width:u[i.shape],height:m[i.shape],borderRadius:f[i.shape],background:i.color,"--dx":Math.cos(l)*i.distance,"--dy":-Math.sin(l)*i.distance,"--grav":30+S(i.id,8)*50,animation:`confettiBurst3D ${i.duration}ms forwards ${i.delay}ms`,willChange:"transform, opacity"}},i.id)})})]})}const Cr=jt({isActive:({dayNumber:t})=>t===100,introKey:"day100_modal_shown",doneKey:"day100_unhacked",keepAmbianceAfterReward:!1,activeClasses:["day100-global","day100-flicker"],doneClass:"day100-unhacking",Intro:wr,Decor:vr,Reward:jr}),Ze=2e3,Er=42,Ir=22,Ar=({today:t,getExerciseCount:a})=>le.reduce((n,s)=>n+(a(t,s.id)||0),0),Me=(t,a,n)=>t+(a-t)*n,Qe=()=>e.jsx("style",{dangerouslySetInnerHTML:{__html:`
        /* ── PALETTE "CANICULE" : fournaise ambre / orange / braise ── */
        .day200-global {
          position: relative;
          --accent: rgb(249, 115, 22) !important;
          --accent-glow: rgb(251, 191, 36) !important;

          --bg-color: rgb(20, 8, 3) !important;
          --card-bg: rgba(48, 18, 8, 0.42) !important;
          --surface-elevated: linear-gradient(135deg, rgba(54, 20, 8, 0.60), rgba(64, 26, 10, 0.64)) !important;
          --surface-section: linear-gradient(135deg, rgba(54, 20, 8, 0.85), rgba(64, 26, 10, 0.90)) !important;
          --surface-subtle: rgba(251, 146, 60, 0.06) !important;
          --surface-muted: rgba(251, 146, 60, 0.10) !important;
          --surface-dim: rgba(251, 191, 36, 0.13) !important;
          --surface-hover: rgba(249, 115, 22, 0.16) !important;

          --border-subtle: rgba(251, 146, 60, 0.14) !important;
          --border-muted: rgba(251, 146, 60, 0.18) !important;
          --border-default: rgba(249, 115, 22, 0.30) !important;
          --border-strong: rgba(249, 115, 22, 0.50) !important;

          --overlay-bg: rgb(22, 9, 4) !important;
          --sheet-bg: rgba(34, 14, 7, 0.96) !important;
          --progress-track: rgba(251, 146, 60, 0.18) !important;

          --body-glow-1: rgba(249, 115, 22, 0.14) !important;
          --body-glow-2: rgba(234, 88, 12, 0.10) !important;

          --gradient-primary: linear-gradient(135deg, #f97316 0%, #ef4444 100%) !important;
          --gradient-accent: linear-gradient(135deg, #fbbf24 0%, #f97316 100%) !important;
          --gradient-glow: linear-gradient(135deg, #fde047 0%, #f97316 50%, #ef4444 100%) !important;
          --glow-primary: 0 0 20px rgba(249, 115, 22, 0.45) !important;
          --glow-accent: 0 0 25px rgba(251, 191, 36, 0.5) !important;
        }

        /* Fournaise de fond qui palpite (vague de chaleur) */
        .day200-global::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% -8%, rgba(253, 224, 71, 0.30) 0%, transparent 52%),
            radial-gradient(ellipse at 50% 0%, rgba(249, 115, 22, 0.20) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 105%, rgba(234, 88, 12, 0.18) 0%, transparent 55%);
          pointer-events: none;
          z-index: 0;
          animation: d200Furnace 5s ease-in-out infinite alternate;
        }
        @keyframes d200Furnace {
          0%   { opacity: 0.7; }
          100% { opacity: 1; }
        }

        /* ── Soleil aveuglant ── */
        .d200-sun {
          position: fixed;
          top: clamp(-70px, -5vh, -30px);
          left: 50%;
          width: clamp(160px, 30vh, 280px);
          height: clamp(160px, 30vh, 280px);
          transform: translateX(-50%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(circle, #ffffff 0%, #fff7d6 24%, #fdba74 52%, #f97316 74%, rgba(249, 115, 22, 0) 100%);
          box-shadow: 0 0 90px rgba(253, 224, 71, 0.7), 0 0 200px rgba(249, 115, 22, 0.5);
          animation: d200SunBlaze 4s ease-in-out infinite alternate;
        }
        @keyframes d200SunBlaze {
          0%   { filter: brightness(1);    transform: translateX(-50%) scale(1); }
          100% { filter: brightness(1.18); transform: translateX(-50%) scale(1.05); }
        }

        /* ── Air qui ondule (mirage / heat haze) ── */
        .d200-haze {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0;
          background: repeating-linear-gradient(0deg,
            rgba(255, 237, 213, 0) 0px,
            rgba(255, 237, 213, 0.05) 2px,
            rgba(255, 237, 213, 0) 5px);
          mix-blend-mode: screen;
          animation: d200Haze 6s ease-in-out infinite;
        }
        @keyframes d200Haze {
          0%, 100% { transform: translateY(0) skewX(0deg); opacity: 0.5; }
          50%      { transform: translateY(-8px) skewX(0.6deg); opacity: 0.95; }
        }

        /* ── Gouttes de sueur qui dégoulinent sur l'écran ── */
        .d200-sweat { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
        .d200-drop {
          position: absolute;
          top: -24px;
          width: 6px; height: 11px;
          border-radius: 50% 50% 50% 50% / 62% 62% 38% 38%;
          background: linear-gradient(180deg, rgba(224, 242, 254, 0.9), rgba(56, 189, 248, 0.5));
          box-shadow: 0 0 6px rgba(56, 189, 248, 0.5);
          animation: d200Drip linear infinite;
        }
        @keyframes d200Drip {
          0%   { transform: translateY(0) scaleY(0.8); opacity: 0; }
          12%  { opacity: 0.95; }
          100% { transform: translateY(112vh) scaleY(1.15); opacity: 0; }
        }

        /* ── Quolibets flottants (humour de canicule) ── */
        .d200-msg {
          position: fixed;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 13px; font-weight: 700;
          color: rgba(254, 215, 170, 0.7);
          text-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
          pointer-events: none; z-index: 1;
          white-space: nowrap;
          animation: d200MsgFloat ease-in-out infinite;
        }
        @keyframes d200MsgFloat {
          0%   { opacity: 0; transform: translateY(10px); }
          15%  { opacity: 0.85; }
          50%  { opacity: 0.6; transform: translateY(-8px); }
          85%  { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(-18px); }
        }

        /* ── Fond des slides : braise ── */
        .day200-global .dashboard-slide-bg {
          background: radial-gradient(circle at 50% 26%, rgba(249, 115, 22, 0.10) 0%, transparent 64%) !important;
        }

        /* ── Le grand numéro du jour : métal en fusion ── */
        .day200-global .day-number,
        .day200-global .day-number-anim {
          background: linear-gradient(135deg, #fde047 0%, #fb923c 40%, #ef4444 80%, #fde047 100%) !important;
          background-size: 220% 220% !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          filter: drop-shadow(0 0 14px rgba(249, 115, 22, 0.55)) !important;
          animation: d200Molten 6s ease infinite, d200Shimmer 4s ease-in-out infinite !important;
        }
        @keyframes d200Molten {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes d200Shimmer {
          0%, 100% { transform: translateY(0) skewX(0deg); }
          50%      { transform: translateY(-2px) skewX(-1.5deg); }
        }

        /* ── Label du jour ── */
        .day200-global .day-label {
          color: #fdba74 !important;
          letter-spacing: 6px !important;
          text-shadow: 0 0 12px rgba(249, 115, 22, 0.7), 0 0 30px rgba(239, 68, 68, 0.3) !important;
        }
        .day200-global .day-label-text { font-size: 0 !important; }
        .day200-global .day-label-text::after {
          content: 'CANICULE';
          font-size: var(--day-label-size, clamp(0.75rem, 1.6vh, 1rem));
        }

        /* ── Logo chauffé à blanc ── */
        .day200-global .app-logo-text {
          background: linear-gradient(135deg, #fde047, #fb923c, #ef4444) !important;
          background-size: 200% 200% !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.45)) !important;
          animation: d200Molten 7s ease infinite !important;
        }
        .day200-global .app-logo-text::after { content: ' 🔥'; font-size: 0.8em; }

        /* ── Bouton central : braise incandescente ── */
        .day200-global .counter-button {
          background: radial-gradient(circle at 50% 38%, rgba(249, 115, 22, 0.32), rgba(40, 12, 6, 0.5)) !important;
          box-shadow: 0 0 34px rgba(249, 115, 22, 0.55), inset 0 0 26px rgba(251, 191, 36, 0.4) !important;
          animation: counterBlobMorph 9s ease-in-out infinite, d200Ember 3.4s ease-in-out infinite !important;
        }
        .day200-global .counter-button span {
          color: #fff7e0 !important;
          text-shadow: 0 0 12px rgba(251, 191, 36, 0.7) !important;
        }
        .day200-global .counter-button svg {
          color: #fdba74 !important;
          filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.8)) !important;
        }
        @keyframes d200Ember {
          0%, 100% { box-shadow: 0 0 30px rgba(249,115,22,0.5),  inset 0 0 22px rgba(251,191,36,0.35); }
          50%      { box-shadow: 0 0 52px rgba(239,68,68,0.7),    inset 0 0 36px rgba(251,191,36,0.6); }
        }
        /* ── Anneau de progression de l'année : braise ── */
        .day200-global .counter-ring {
          --ring-c1: #fbbf24 !important;
          --ring-c2: #f97316 !important;
          --ring-track: rgba(251, 146, 60, 0.18) !important;
        }

        /* ── Header ── */
        .day200-global .dashboard-header {
          border-color: rgba(249, 115, 22, 0.3) !important;
          background: rgba(54, 20, 8, 0.22) !important;
          box-shadow: 0 0 18px rgba(249, 115, 22, 0.10), inset 0 0 30px rgba(251, 191, 36, 0.05) !important;
          backdrop-filter: blur(2px);
        }

        /* ── Tuiles d'exercices : plaques chauffées ── */
        .day200-global .exercise-button {
          border: 1px solid rgba(249, 115, 22, 0.4) !important;
          background: linear-gradient(160deg, rgba(60, 24, 10, 0.6), rgba(80, 28, 12, 0.45)) !important;
          box-shadow: inset 0 0 16px rgba(251, 191, 36, 0.12), 0 6px 14px rgba(0, 0, 0, 0.45) !important;
          border-radius: 14px !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease !important;
        }
        .day200-global .exercise-button:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 22px rgba(249, 115, 22, 0.25), inset 0 0 22px rgba(251, 191, 36, 0.3) !important;
          border-color: rgba(249, 115, 22, 0.8) !important;
        }
        .day200-global .exercise-button span { color: #fed7aa !important; text-shadow: 0 1px 3px rgba(0,0,0,0.6) !important; }
        .day200-global .exercise-button span:last-of-type {
          color: #fdba74 !important; font-weight: 800 !important;
          text-shadow: 0 0 8px rgba(249, 115, 22, 0.5) !important;
        }
        .day200-global .exercise-button > div:not(:last-child):not([class*="streak"]) {
          background: rgba(249, 115, 22, 0.12) !important;
          border: 1px solid rgba(251, 146, 60, 0.3) !important;
          border-radius: 10px !important;
        }
        .day200-global .exercise-button svg {
          color: #fdba74 !important; stroke: #fdba74 !important;
          filter: drop-shadow(0 0 3px rgba(249, 115, 22, 0.6)) !important;
        }
        .day200-global .exercise-button > div:last-child { background: rgba(0, 0, 0, 0.4) !important; }
        .day200-global .exercise-button > div:last-child > div {
          background: linear-gradient(90deg, #fbbf24, #f97316, #ef4444) !important;
          box-shadow: 0 0 8px rgba(249, 115, 22, 0.6) !important;
        }

        /* ── Barre de navigation ── */
        .day200-global .dashboard-nav-bar {
          background: rgba(54, 20, 8, 0.32) !important;
          border-color: rgba(249, 115, 22, 0.30) !important;
          box-shadow: 0 -2px 16px rgba(249, 115, 22, 0.12), 0 4px 14px rgba(0, 0, 0, 0.35) !important;
        }
        .day200-global .dashboard-nav-bar button { color: #fdba74 !important; }
        .day200-global .dashboard-nav-bar button span { color: #fed7aa !important; text-shadow: 0 1px 2px rgba(0,0,0,0.55) !important; }
        .day200-global .dashboard-nav-bar button:active { color: #fff7e0 !important; background: rgba(249, 115, 22, 0.14) !important; }

        .day200-global .progress-ring-svg { filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.5)) !important; }
        .day200-global .progress-ring-svg circle { stroke: #f97316 !important; }

        /* ── ✦ THERMOMÈTRE (HUD intégré) ──
           Mobile : HORIZONTAL, dans le flux (placé par l'hôte). Desktop : VERTICAL,
           épinglé dans la gouttière GAUCHE. Le remplissage est piloté par --fill
           (largeur en horizontal, hauteur en vertical). Jamais en superposition. */
        .d200-thermo {
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          margin: 6px auto;
          width: fit-content; max-width: 94vw;
          pointer-events: none;
          padding: 7px 14px;
          border-radius: 16px;
          background: rgba(28, 10, 4, 0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(249, 115, 22, 0.28);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          animation: d200ThermoIn 0.5s ease-out;
        }
        .d200-thermo-temp {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 15px; font-weight: 900;
          text-shadow: 0 0 10px currentColor;
          transition: color 0.5s ease;
        }
        /* Corps HORIZONTAL (mobile / défaut) */
        .d200-thermo-body { position: relative; width: clamp(180px, 60vw, 300px); height: 32px; }
        .d200-thermo-tube {
          position: absolute;
          top: 50%; transform: translateY(-50%);
          left: 24px; right: 0;
          height: 13px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.25);
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }
        .d200-thermo-mercury {
          position: absolute; top: 0; bottom: 0; left: 0;
          width: var(--fill, 90%);
          border-radius: 999px;
          transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1), height 0.5s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.5s ease, box-shadow 0.5s ease;
        }
        .d200-thermo-bulb {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 28px; height: 28px; border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.25);
          transition: background-color 0.5s ease, box-shadow 0.5s ease;
        }
        .d200-thermo-reps {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 11px; font-weight: 700;
          color: #fed7aa;
          text-shadow: 0 0 8px rgba(249, 115, 22, 0.5);
          white-space: nowrap;
        }
        .d200-thermo-reps small { opacity: 0.7; }
        @keyframes d200ThermoIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }

        @media (min-width: 768px) {
          .d200-thermo {
            position: fixed; left: 12px; top: 50%; transform: translateY(-50%);
            margin: 0;
          }
          .d200-thermo--dashboard { z-index: 50; }
          .d200-thermo--panel { z-index: 1100; }
          /* Corps VERTICAL */
          .d200-thermo .d200-thermo-body { width: 38px; height: clamp(150px, 38vh, 260px); }
          .d200-thermo .d200-thermo-tube {
            top: 0; bottom: 26px; left: 50%; right: auto;
            transform: translateX(-50%);
            width: 13px; height: auto;
            border-radius: 999px 999px 0 0;
          }
          .d200-thermo .d200-thermo-mercury {
            left: 0; right: 0; bottom: 0; top: auto;
            width: auto; height: var(--fill, 90%);
            border-radius: 999px 999px 0 0;
          }
          .d200-thermo .d200-thermo-bulb {
            left: 50%; top: auto; bottom: 0;
            transform: translateX(-50%);
            width: 30px; height: 30px;
          }
        }

        /* ── Carte d'alerte (modale d'accueil) ── */
        @keyframes d200AlertIn  { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes d200AlertOut { 0% { opacity: 1; } 100% { opacity: 0; transform: scale(1.04); } }
        @keyframes d200CardIn {
          0%   { opacity: 0; transform: translateY(24px) scale(0.94); }
          60%  { opacity: 1; transform: translateY(-5px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes d200CardOut { 0% { opacity: 1; } 100% { opacity: 0; transform: translateY(-22px) scale(0.96); } }
        @keyframes d200Rise { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes d200AlertPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70%      { box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); }
        }

        /* ── Récompense : l'orage qui casse la canicule ── */
        @keyframes d200StormSky {
          0%   { background: linear-gradient(180deg, #f97316 0%, #fb923c 45%, #ef4444 100%); }
          100% { background: linear-gradient(180deg, #1e293b 0%, #334155 50%, #475569 100%); }
        }
        @keyframes d200ReliefSky {
          0%   { background: linear-gradient(180deg, #1e293b 0%, #334155 50%, #475569 100%); }
          100% { background: linear-gradient(180deg, #0c4a6e 0%, #0ea5e9 45%, #7dd3fc 100%); }
        }
        @keyframes d200RainFall {
          0%   { transform: translateY(-12vh); opacity: 0; }
          10%  { opacity: 0.8; }
          100% { transform: translateY(112vh); opacity: 0.3; }
        }
        @keyframes d200Lightning {
          0%, 100% { opacity: 0; }
          47%, 49% { opacity: 0; }
          48%      { opacity: 0.9; }
          52%      { opacity: 0; }
          54%      { opacity: 0.6; }
          56%      { opacity: 0; }
        }
        @keyframes d200ReliefReveal {
          0%   { opacity: 0; transform: scale(0.5) translateY(24px); filter: blur(10px); }
          60%  { opacity: 1; transform: scale(1.06) translateY(-4px); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes d200RewardFade { 0% { opacity: 1; } 72% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes d200Confetti {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(var(--dx) * 1px), calc(var(--dy) * 1px + var(--grav) * 1px)) rotate(420deg); opacity: 0; }
        }

        /* ── Transition de sortie sur le dashboard (l'air se rafraîchit) ── */
        .day200-lifting { animation: d200Cooldown 1.6s ease-out forwards; }
        @keyframes d200Cooldown {
          0%   { filter: hue-rotate(0deg) saturate(1.4) brightness(1.1); }
          100% { filter: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .d200-sun, .d200-haze, .d200-drop, .d200-msg { animation: none !important; }
          .day200-global::before { animation: none !important; }
          .day200-global .day-number, .day200-global .day-number-anim,
          .day200-global .app-logo-text, .day200-global .counter-button { animation: none !important; }
        }
    `}}),Gt=["42°C à l'ombre… 🥵","Trop chaud pour réfléchir.","Le bitume fond.","Même les glaçons transpirent.","Bouge pas… non, bouge.","On crève de chaud."],Rr=Array.from({length:14},(t,a)=>({id:a,left:`${S(a,1)*100}%`,duration:`${3+S(a,2)*4}s`,delay:`${S(a,3)*-6}s`,scale:.7+S(a,4)*.9})),zr=Array.from({length:5},(t,a)=>({id:a,text:Gt[a%Gt.length],top:`${18+a*13+S(a,5)*5}%`,left:`${6+S(a,6)*52}%`,delay:`${a*2.2+S(a,7)*2}s`,duration:`${8+S(a,8)*5}s`})),la=r.memo(()=>e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"d200-sun","aria-hidden":"true"}),e.jsx("div",{className:"d200-haze","aria-hidden":"true"}),e.jsx("div",{className:"d200-sweat","aria-hidden":"true",children:Rr.map(t=>e.jsx("div",{className:"d200-drop",style:{left:t.left,animationDuration:t.duration,animationDelay:t.delay,transform:`scale(${t.scale})`}},t.id))}),zr.map(t=>e.jsx("div",{className:"d200-msg",style:{top:t.top,left:t.left,animationDelay:t.delay,animationDuration:t.duration},children:t.text},t.id))]})),Tr=t=>`rgb(${Math.round(Me(239,56,t))}, ${Math.round(Me(68,189,t))}, ${Math.round(Me(68,248,t))})`;function Dr({reps:t=0,goal:a=Ze,onSolve:n,placement:s="dashboard"}){const c=Math.min(t/a,1),p=t>=a;r.useEffect(()=>{p&&n?.()},[p,n]);const d=Math.round(Me(Er,Ir,c)),o=Tr(c),g=Me(92,16,c);return e.jsxs("div",{className:`d200-thermo d200-thermo--${s}`,children:[e.jsxs("div",{className:"d200-thermo-temp",style:{color:o},children:[d,"°C"]}),e.jsxs("div",{className:"d200-thermo-body",children:[e.jsx("div",{className:"d200-thermo-tube",children:e.jsx("div",{className:"d200-thermo-mercury",style:{"--fill":`${g}%`,backgroundColor:o,boxShadow:`0 0 12px ${o}`}})}),e.jsx("div",{className:"d200-thermo-bulb",style:{backgroundColor:o,boxShadow:`0 0 16px ${o}`}})]}),e.jsxs("div",{className:"d200-thermo-reps",children:[Math.min(t,a),e.jsxs("small",{children:["/",a," 💧"]})]})]})}function _r(){return e.jsxs(e.Fragment,{children:[e.jsx(Qe,{}),e.jsx(la,{})]})}function Mr({onSolve:t,reps:a,goal:n,placement:s}){return e.jsxs(e.Fragment,{children:[e.jsx(Qe,{}),e.jsx(Dr,{reps:a,goal:n,onSolve:t,placement:s})]})}function Nr({onDismiss:t}){const[a,n]=r.useState(!1),s=()=>{n(!0),setTimeout(t,450)};return e.jsxs("div",{style:{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2e4,padding:"22px",overflow:"hidden",background:"radial-gradient(ellipse at 50% 20%, rgba(249, 115, 22, 0.5) 0%, rgba(20, 8, 3, 0.94) 70%)",animation:a?"d200AlertOut 0.45s ease-out forwards":"d200AlertIn 0.5s ease-out"},children:[e.jsx(Qe,{}),e.jsx(la,{}),e.jsxs("div",{style:{position:"relative",zIndex:2,width:"100%",maxWidth:"440px",background:"linear-gradient(165deg, #2a1206 0%, #45160a 55%, #2a1206 100%)",border:"1px solid rgba(249, 115, 22, 0.45)",borderRadius:"18px",padding:"24px",boxShadow:"0 24px 70px rgba(0,0,0,0.6), 0 0 60px rgba(249, 115, 22, 0.18)",overflow:"hidden",animation:a?"d200CardOut 0.45s ease-in forwards":"d200CardIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",marginBottom:"18px",borderRadius:"12px",background:"linear-gradient(135deg, #ef4444, #f97316)",boxShadow:"0 6px 18px rgba(239, 68, 68, 0.4)",animation:"d200AlertPulse 2s ease-out infinite"},children:[e.jsx("span",{style:{fontSize:"24px"},children:"⚠️"}),e.jsx("span",{style:{fontFamily:"'Inter', system-ui, sans-serif",fontSize:"13px",fontWeight:900,letterSpacing:"2px",color:"#fff7ed",textTransform:"uppercase"},children:"Alerte Canicule — Jour 200"})]}),e.jsxs("div",{style:{display:"flex",alignItems:"baseline",justifyContent:"center",gap:"6px",marginBottom:"6px"},children:[e.jsx("span",{style:{fontFamily:"'Inter', system-ui, sans-serif",fontSize:"clamp(3.4rem, 18vw, 5rem)",fontWeight:900,lineHeight:.9,background:"linear-gradient(135deg, #fde047, #fb923c, #ef4444)",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",filter:"drop-shadow(0 0 20px rgba(249, 115, 22, 0.5))"},children:"42°C"}),e.jsx("span",{style:{fontSize:"2rem"},children:"🥵"})]}),e.jsxs("div",{style:{fontFamily:"'Inter', system-ui, sans-serif",fontSize:"clamp(0.9rem, 3.6vw, 1.02rem)",color:"#fed7aa",lineHeight:1.55,textAlign:"center",margin:"4px auto 0",maxWidth:"360px",animation:"d200Rise 0.6s ease-out 0.3s both"},children:["Bouger, c'est l'enfer. Mais rester immobile, c'est pire : tu fonds sur le canapé. 🫠",e.jsx("br",{}),e.jsx("br",{}),"Le seul échappatoire ? ",e.jsx("strong",{style:{color:"#fdba74"},children:"Transpirer un grand coup"})," pour activer ta climatisation interne. Sue ",e.jsxs("strong",{style:{color:"#fdba74"},children:[Ze," reps"]})," aujourd'hui : le thermomètre dégringole, l'orage éclate, la canicule cède. 🌧️"]}),e.jsx("button",{onClick:s,style:{width:"100%",marginTop:"22px",padding:"15px 24px",background:"linear-gradient(135deg, #f97316, #ef4444)",border:"none",borderRadius:"13px",color:"#fff7ed",fontFamily:"'Inter', system-ui, sans-serif",fontSize:"15px",fontWeight:900,letterSpacing:"0.5px",cursor:"pointer",boxShadow:"0 10px 26px rgba(239, 68, 68, 0.45)",animation:"d200Rise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both"},children:"🥵 Suer pour faire tomber la pluie"})]})]})}const ca={gather:1400,storm:1700,relief:1800,celebration:2400},Or=Object.values(ca).reduce((t,a)=>t+a,0),Pr=Array.from({length:60},(t,a)=>({id:a,left:`${S(a,1)*100}%`,delay:`${S(a,2)*1.2}s`,duration:`${.5+S(a,3)*.5}s`,height:`${12+S(a,4)*20}px`,opacity:.3+S(a,5)*.5})),$r=Array.from({length:56},(t,a)=>({id:a,angle:S(a,1)*360,distance:40+S(a,2)*75,size:5+S(a,3)*9,color:["#38bdf8","#7dd3fc","#0ea5e9","#bae6fd","#5eead4","#ffffff"][Math.floor(S(a,4)*6)],duration:1400+S(a,5)*1100,delay:S(a,6)*400,grav:30+S(a,7)*60,shape:Math.floor(S(a,8)*3)}));function Fr({onComplete:t}){const[a,n]=r.useState("gather");r.useEffect(()=>{const{gather:o,storm:g,relief:i}=ca,l=setTimeout(()=>n("storm"),o),f=setTimeout(()=>n("relief"),o+g),u=setTimeout(()=>n("celebration"),o+g+i),m=setTimeout(t,Or);return()=>[l,f,u,m].forEach(clearTimeout)},[t]);const s=a==="storm",c=a==="relief"||a==="celebration",p=a==="celebration";let d="d200StormSky 1.4s ease-out forwards";return c&&(d="d200ReliefSky 1.8s ease-out forwards"),p&&(d="d200RewardFade 2.4s ease-out forwards"),e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:3e4,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"linear-gradient(180deg, #f97316 0%, #fb923c 45%, #ef4444 100%)",animation:d},children:[e.jsx(Qe,{}),(s||c)&&e.jsx("div",{"aria-hidden":"true",style:{position:"absolute",inset:0,pointerEvents:"none"},children:Pr.map(o=>e.jsx("div",{style:{position:"absolute",top:0,left:o.left,width:"2px",height:o.height,background:"linear-gradient(180deg, rgba(186,230,253,0.9), transparent)",opacity:o.opacity,animation:`d200RainFall ${o.duration} linear infinite`,animationDelay:o.delay}},o.id))}),s&&e.jsx("div",{"aria-hidden":"true",style:{position:"absolute",inset:0,background:"#fff",animation:"d200Lightning 1.7s steps(1) infinite",pointerEvents:"none"}}),c&&e.jsxs("div",{style:{position:"relative",zIndex:2,textAlign:"center",padding:"0 20px"},children:[e.jsx("div",{style:{fontSize:"clamp(3rem, 12vw, 5rem)",lineHeight:1,marginBottom:"8px",animation:"d200ReliefReveal 0.8s cubic-bezier(0.34,1.56,0.64,1)"},children:"🌧️"}),e.jsxs("div",{style:{fontFamily:"'Inter', system-ui, sans-serif",fontSize:"clamp(2rem, 9vw, 4.2rem)",fontWeight:900,lineHeight:1.05,color:"#fff",letterSpacing:"1px",textShadow:"0 4px 24px rgba(8, 47, 73, 0.6), 0 0 50px rgba(125, 211, 252, 0.6)",animation:"d200ReliefReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both"},children:["CANICULE",e.jsx("br",{}),"VAINCUE"]}),e.jsxs("div",{style:{marginTop:"14px",fontFamily:"'Inter', system-ui, sans-serif",fontSize:"clamp(0.9rem, 3.4vw, 1.2rem)",color:"rgba(240, 249, 255, 0.95)",fontWeight:600,textShadow:"0 2px 10px rgba(8, 47, 73, 0.5)",animation:"d200Rise 0.5s ease-out 0.5s both"},children:[Ze," reps de sueur… et la pluie est tombée. 🌧️💧"]})]}),p&&e.jsx("div",{style:{position:"absolute",inset:0,pointerEvents:"none"},children:$r.map(o=>{const g=o.angle*Math.PI/180,i=["50%","2px","50% 50% 50% 50% / 60% 60% 40% 40%"],l=[o.size,o.size,o.size*.7],f=[o.size,o.size,o.size*1.4];return e.jsx("div",{style:{position:"absolute",left:"50%",top:"46%",width:l[o.shape],height:f[o.shape],borderRadius:i[o.shape],background:o.color,"--dx":Math.cos(g)*o.distance,"--dy":-Math.sin(g)*o.distance,"--grav":o.grav,animation:`d200Confetti ${o.duration}ms forwards ${o.delay}ms`,willChange:"transform, opacity"}},o.id)})})]})}const Lr=jt({isActive:({dayNumber:t})=>t===200,introKey:"day200_intro_shown",doneKey:"day200_challenge_done",keepAmbianceAfterReward:!1,autoReward:!1,activeClasses:["day200-global"],doneClass:"day200-lifting",hudProps:t=>({reps:Ar(t),goal:Ze}),Intro:Nr,Decor:_r,Hud:Mr,Reward:Fr}),Pe=9,Br=({today:t,dayNumber:a,getExerciseCount:n,getConfig:s,completions:c})=>le.reduce((p,d)=>{const o=n(t,d.id)||0,g=s(d.id,t).difficulty,i=Fe(d,a,g),l=c?.[t]?.[d.id]?.isCompleted||o>=i;return p+(l?1:0)},0),Ke=()=>e.jsx("style",{dangerouslySetInnerHTML:{__html:`
        /* ── PALETTE "ASCENSION COSMIQUE" : indigo nuit + cyan + or ──
           On redéfinit les tokens du thème sur la racine de l'event. */
        .day300-global {
          position: relative;
          --accent: rgb(56, 189, 248) !important;            /* cyan */
          --accent-glow: rgb(125, 211, 252) !important;

          --bg-color: rgb(5, 6, 20) !important;
          --card-bg: rgba(18, 20, 48, 0.46) !important;
          --surface-elevated: linear-gradient(135deg, rgba(20, 22, 54, 0.62), rgba(30, 18, 60, 0.66)) !important;
          --surface-section: linear-gradient(135deg, rgba(20, 22, 54, 0.86), rgba(30, 18, 60, 0.90)) !important;
          --surface-subtle: rgba(125, 211, 252, 0.05) !important;
          --surface-muted: rgba(125, 211, 252, 0.09) !important;
          --surface-dim: rgba(129, 140, 248, 0.13) !important;
          --surface-hover: rgba(56, 189, 248, 0.15) !important;

          --border-subtle: rgba(129, 140, 248, 0.12) !important;
          --border-muted: rgba(129, 140, 248, 0.16) !important;
          --border-default: rgba(56, 189, 248, 0.26) !important;
          --border-strong: rgba(56, 189, 248, 0.45) !important;

          --overlay-bg: rgb(6, 7, 22) !important;
          --sheet-bg: rgba(12, 14, 36, 0.97) !important;
          --progress-track: rgba(129, 140, 248, 0.18) !important;

          --body-glow-1: rgba(56, 189, 248, 0.10) !important;
          --body-glow-2: rgba(168, 85, 247, 0.10) !important;

          --gradient-primary: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%) !important;
          --gradient-accent: linear-gradient(135deg, #38bdf8 0%, #a855f7 100%) !important;
          --gradient-glow: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #fbbf24 100%) !important;
          --glow-primary: 0 0 20px rgba(56, 189, 248, 0.4) !important;
          --glow-accent: 0 0 25px rgba(129, 140, 248, 0.5) !important;
        }

        /* Nébuleuse de fond (douce, qui respire) */
        .day300-global::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 18% 22%, rgba(168, 85, 247, 0.18) 0%, transparent 50%),
            radial-gradient(ellipse at 82% 30%, rgba(56, 189, 248, 0.16) 0%, transparent 52%),
            radial-gradient(ellipse at 50% 88%, rgba(129, 140, 248, 0.14) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
          animation: d300Nebula 12s ease-in-out infinite alternate;
        }
        @keyframes d300Nebula {
          0%   { opacity: 0.6; transform: scale(1); }
          100% { opacity: 1;   transform: scale(1.08); }
        }

        /* ── Champ d'étoiles scintillantes ── */
        .d300-stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .d300-star {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          animation: d300Twinkle ease-in-out infinite;
        }
        @keyframes d300Twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.7); }
          50%      { opacity: 1;   transform: scale(1.25); }
        }

        /* ── Aurores qui ondulent en haut ── */
        .d300-aurora {
          position: fixed; top: 0; left: -10%;
          width: 120%; height: clamp(140px, 30vh, 320px);
          pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 40% 100% at 30% 0%, rgba(56, 189, 248, 0.22) 0%, transparent 70%),
            radial-gradient(ellipse 45% 100% at 65% 0%, rgba(168, 85, 247, 0.20) 0%, transparent 70%),
            radial-gradient(ellipse 35% 100% at 50% 0%, rgba(45, 212, 191, 0.16) 0%, transparent 70%);
          filter: blur(8px);
          opacity: 0.8;
          animation: d300Aurora 14s ease-in-out infinite alternate;
        }
        @keyframes d300Aurora {
          0%   { transform: translateX(-4%) skewX(-4deg); opacity: 0.65; }
          100% { transform: translateX(4%)  skewX(4deg);  opacity: 0.95; }
        }

        /* ── Étoiles filantes ── */
        .d300-shooting {
          position: fixed; z-index: 0; pointer-events: none;
          width: 2px; height: 2px; border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 6px 1px rgba(255,255,255,0.9);
          animation: d300Shoot linear infinite;
        }
        .d300-shooting::after {
          content: ''; position: absolute; right: 0; top: 50%;
          width: 120px; height: 1px; transform: translateY(-50%);
          background: linear-gradient(90deg, rgba(255,255,255,0.8), transparent);
        }
        @keyframes d300Shoot {
          0%   { opacity: 0; transform: translate(0, 0) rotate(18deg); }
          8%   { opacity: 1; }
          100% { opacity: 0; transform: translate(60vw, 30vh) rotate(18deg); }
        }

        /* ── Fond des slides : voile cosmique ── */
        .day300-global .dashboard-slide-bg {
          background: radial-gradient(circle at 50% 24%, rgba(56, 189, 248, 0.08) 0%, transparent 64%) !important;
        }

        /* ── Le grand numéro du jour : chrome stellaire ── */
        .day300-global .day-number,
        .day300-global .day-number-anim {
          background: linear-gradient(135deg, #7dd3fc 0%, #818cf8 45%, #c084fc 70%, #fbbf24 100%) !important;
          background-size: 220% 220% !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          filter: drop-shadow(0 0 14px rgba(129, 140, 248, 0.55)) !important;
          animation: d300StarFlow 7s ease infinite !important;
        }
        @keyframes d300StarFlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* ── Label du jour : cyan stellaire ── */
        .day300-global .day-label {
          color: #7dd3fc !important;
          letter-spacing: 6px !important;
          text-shadow: 0 0 12px rgba(56, 189, 248, 0.8), 0 0 36px rgba(129, 140, 248, 0.4) !important;
        }
        .day300-global .day-label-text { font-size: 0 !important; }
        .day300-global .day-label-text::after {
          content: 'ASCENSION';
          font-size: var(--day-label-size, clamp(0.75rem, 1.6vh, 1rem));
        }

        /* ── Logo cosmique ── */
        .day300-global .app-logo-text {
          background: linear-gradient(135deg, #38bdf8, #818cf8, #fbbf24) !important;
          background-size: 200% 200% !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.45)) !important;
          animation: d300StarFlow 8s ease infinite !important;
        }
        .day300-global .app-logo-text::after { content: ' ✦'; font-size: 0.8em; }

        /* ── Bouton central : astre (le border est volontairement laissé à l'anneau) ── */
        .day300-global .counter-button {
          background: radial-gradient(circle at 50% 38%, rgba(129, 140, 248, 0.3), rgba(10, 12, 34, 0.5)) !important;
          box-shadow: 0 0 34px rgba(56, 189, 248, 0.5), inset 0 0 26px rgba(129, 140, 248, 0.4) !important;
          animation: counterBlobMorph 9s ease-in-out infinite, d300AstroPulse 4s ease-in-out infinite !important;
        }
        /* ── Anneau de progression de l'année : teinte cosmique ── */
        .day300-global .counter-ring {
          --ring-c1: #38bdf8 !important;
          --ring-c2: #818cf8 !important;
          --ring-track: rgba(129, 140, 248, 0.20) !important;
        }
        .day300-global .counter-button span {
          color: #e0f2fe !important;
          text-shadow: 0 0 12px rgba(56, 189, 248, 0.7) !important;
        }
        .day300-global .counter-button svg {
          color: #7dd3fc !important;
          filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.8)) !important;
        }
        @keyframes d300AstroPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(56,189,248,0.45), inset 0 0 22px rgba(129,140,248,0.35); }
          50%      { box-shadow: 0 0 52px rgba(129,140,248,0.8), inset 0 0 36px rgba(56,189,248,0.6); }
        }

        /* ── Header : verre cosmique ── */
        .day300-global .dashboard-header {
          border-color: rgba(129, 140, 248, 0.3) !important;
          background: rgba(18, 20, 48, 0.20) !important;
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.10), inset 0 0 30px rgba(129, 140, 248, 0.05) !important;
          backdrop-filter: blur(2px);
        }

        /* ── Tuiles d'exercices : plaques de vaisseau ── */
        .day300-global .exercise-button {
          border: 1px solid rgba(56, 189, 248, 0.35) !important;
          background: linear-gradient(160deg, rgba(18, 22, 52, 0.6), rgba(30, 18, 56, 0.45)) !important;
          box-shadow: inset 0 0 16px rgba(129, 140, 248, 0.12), 0 6px 14px rgba(0, 0, 0, 0.45) !important;
          border-radius: 14px !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease !important;
        }
        .day300-global .exercise-button:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 22px rgba(56, 189, 248, 0.22), inset 0 0 22px rgba(129, 140, 248, 0.3) !important;
          border-color: rgba(56, 189, 248, 0.75) !important;
        }
        .day300-global .exercise-button span { color: #dbeafe !important; text-shadow: 0 1px 3px rgba(0,0,0,0.6) !important; }
        .day300-global .exercise-button span:last-of-type {
          color: #7dd3fc !important; font-weight: 800 !important;
          text-shadow: 0 0 8px rgba(56, 189, 248, 0.5) !important;
        }
        .day300-global .exercise-button > div:not(:last-child):not([class*="streak"]) {
          background: rgba(56, 189, 248, 0.12) !important;
          border: 1px solid rgba(129, 140, 248, 0.3) !important;
          border-radius: 10px !important;
        }
        .day300-global .exercise-button svg {
          color: #7dd3fc !important; stroke: #7dd3fc !important;
          filter: drop-shadow(0 0 3px rgba(56, 189, 248, 0.6)) !important;
        }
        .day300-global .exercise-button > div:last-child { background: rgba(0, 0, 0, 0.4) !important; }
        .day300-global .exercise-button > div:last-child > div {
          background: linear-gradient(90deg, #818cf8, #38bdf8) !important;
          box-shadow: 0 0 8px rgba(56, 189, 248, 0.6) !important;
        }

        /* ── Barre de navigation ── */
        .day300-global .dashboard-nav-bar {
          background: rgba(18, 20, 48, 0.32) !important;
          border-color: rgba(56, 189, 248, 0.28) !important;
          box-shadow: 0 -2px 16px rgba(129, 140, 248, 0.12), 0 4px 14px rgba(0, 0, 0, 0.35) !important;
        }
        .day300-global .dashboard-nav-bar button { color: #7dd3fc !important; }
        .day300-global .dashboard-nav-bar button span { color: #bae6fd !important; text-shadow: 0 1px 2px rgba(0,0,0,0.55) !important; }
        .day300-global .dashboard-nav-bar button:active { color: #e0f2fe !important; background: rgba(56, 189, 248, 0.14) !important; }

        .day300-global .progress-ring-svg { filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.55)) !important; }
        .day300-global .progress-ring-svg circle { stroke: #38bdf8 !important; }

        /* ── ✦ CONSTELLATION (HUD intégré) ──
           Une étoile par exercice à valider ; chaque exercice validé l'allume.
           Mobile : pastille DANS le flux (placée par l'hôte). Desktop : épinglée
           dans la gouttière GAUCHE, en colonne. Jamais en superposition. */
        .d300-constellation {
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          margin: 6px auto;
          width: fit-content; max-width: 92vw;
          pointer-events: none;
          padding: 7px 14px;
          border-radius: 16px;
          background: rgba(8, 10, 28, 0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(129, 140, 248, 0.28);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          animation: d300ConstellationIn 0.5s ease-out;
        }
        @media (min-width: 768px) {
          .d300-constellation {
            position: fixed; left: 12px; top: 50%; transform: translateY(-50%);
            margin: 0;
          }
          .d300-constellation--dashboard { z-index: 50; }
          .d300-constellation--panel { z-index: 1100; }
          .d300-constellation .d300-constellation-stars { flex-direction: column; }
        }
        .d300-constellation-label {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 1px;
          color: #7dd3fc;
          text-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
        }
        .d300-constellation-stars { display: flex; gap: 10px; }
        .d300-cstar {
          width: clamp(16px, 5vw, 22px);
          height: clamp(16px, 5vw, 22px);
          clip-path: polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          background: rgba(129, 140, 248, 0.30);
          transition: background 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease;
        }
        .d300-cstar-lit {
          background: #fbbf24;
          box-shadow: 0 0 8px #fbbf24, 0 0 16px rgba(251, 191, 36, 0.6);
          transform: scale(1.2);
          animation: d300StarPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes d300StarPop {
          0%   { transform: scale(0.6); }
          60%  { transform: scale(1.35); }
          100% { transform: scale(1.2); }
        }
        .d300-constellation-count {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 12px; font-weight: 800;
          color: #e0f2fe;
          text-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
        }
        @keyframes d300ConstellationIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }

        /* ── Carte d'accueil (splash cinématique, PAS un terminal) ── */
        @keyframes d300SplashIn  { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes d300SplashOut { 0% { opacity: 1; } 100% { opacity: 0; transform: scale(1.05); } }
        @keyframes d300BigNum {
          0%   { opacity: 0; transform: scale(0.4) translateY(20px); filter: blur(14px); letter-spacing: 30px; }
          60%  { opacity: 1; transform: scale(1.08) translateY(-4px); filter: blur(0); letter-spacing: 6px; }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); letter-spacing: 6px; }
        }
        @keyframes d300Rise {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes d300CardOrbit {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* ── Récompense : décollage + supernova ── */
        @keyframes d300Launch {
          0%   { transform: translate(-50%, 0) scale(1); opacity: 1; }
          70%  { transform: translate(-50%, -60vh) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -120vh) scale(0.6); opacity: 0; }
        }
        @keyframes d300Trail {
          0%   { opacity: 0; height: 0; }
          30%  { opacity: 0.9; }
          100% { opacity: 0; height: 120vh; }
        }
        @keyframes d300Supernova {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0); }
          40%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(3.2); }
        }
        @keyframes d300RewardReveal {
          0%   { opacity: 0; transform: scale(0.5) translateY(24px); filter: blur(10px); }
          60%  { opacity: 1; transform: scale(1.06) translateY(-4px); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes d300RewardFade {
          0% { opacity: 1; } 72% { opacity: 1; } 100% { opacity: 0; }
        }
        @keyframes d300Confetti {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(var(--dx) * 1px), calc(var(--dy) * 1px + var(--grav) * 1px)) rotate(440deg); opacity: 0; }
        }

        /* ── Transition de sortie sur le dashboard ── */
        .day300-lifting { animation: d300Settle 1.5s ease-out forwards; }
        @keyframes d300Settle {
          0%   { filter: hue-rotate(0deg) brightness(1.1) saturate(1.3); }
          100% { filter: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .d300-star, .d300-shooting, .d300-aurora { animation: none !important; }
          .d300-cstar-lit { animation: none !important; }
          .day300-global::before { animation: none !important; }
          .day300-global .day-number, .day300-global .day-number-anim,
          .day300-global .app-logo-text, .day300-global .counter-button { animation: none !important; }
        }
    `}}),Wr=Array.from({length:70},(t,a)=>({id:a,left:`${S(a,1)*100}%`,top:`${S(a,2)*100}%`,size:`${1+S(a,3)*2.5}px`,duration:`${2+S(a,4)*4}s`,delay:`${S(a,5)*4}s`})),Hr=Array.from({length:3},(t,a)=>({id:a,left:`${10+S(a,6)*50}%`,top:`${5+S(a,7)*30}%`,duration:`${6+S(a,8)*5}s`,delay:`${a*4+S(a,9)*6}s`})),Et=r.memo(()=>e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"d300-aurora","aria-hidden":"true"}),e.jsx("div",{className:"d300-stars","aria-hidden":"true",children:Wr.map(t=>e.jsx("div",{className:"d300-star",style:{left:t.left,top:t.top,width:t.size,height:t.size,animationDuration:t.duration,animationDelay:t.delay}},t.id))}),Hr.map(t=>e.jsx("div",{className:"d300-shooting","aria-hidden":"true",style:{left:t.left,top:t.top,animationDuration:t.duration,animationDelay:t.delay}},t.id))]}));function Gr({validated:t=0,goal:a=Pe,onSolve:n,placement:s="dashboard"}){const c=Math.min(t,a),p=a>0&&t>=a;return r.useEffect(()=>{p&&n?.()},[p,n]),e.jsxs("div",{className:`d300-constellation d300-constellation--${s}`,children:[e.jsx("div",{className:"d300-constellation-label",children:p?"Constellation rallumée ✦":"Valide des exercices"}),e.jsx("div",{className:"d300-constellation-stars","aria-hidden":"true",children:Array.from({length:a}).map((d,o)=>e.jsx("span",{className:o<c?"d300-cstar d300-cstar-lit":"d300-cstar"},o))}),e.jsxs("div",{className:"d300-constellation-count",children:[c," / ",a," exercices validés"]})]})}function Yr(){return e.jsxs(e.Fragment,{children:[e.jsx(Ke,{}),e.jsx(Et,{})]})}function Ur({onSolve:t,validated:a,goal:n,placement:s}){return e.jsxs(e.Fragment,{children:[e.jsx(Ke,{}),e.jsx(Gr,{validated:a,goal:n,onSolve:t,placement:s})]})}function Xr({onDismiss:t}){const[a,n]=r.useState(!1),s=()=>{n(!0),setTimeout(t,450)};return e.jsxs("div",{style:{position:"fixed",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:2e4,padding:"24px",overflow:"hidden",background:"radial-gradient(ellipse at 50% 35%, #1a1140 0%, #070818 70%)",animation:a?"d300SplashOut 0.45s ease-out forwards":"d300SplashIn 0.5s ease-out"},children:[e.jsx(Ke,{}),e.jsx(Et,{}),e.jsx("div",{"aria-hidden":"true",style:{position:"absolute",top:"50%",left:"50%",width:"clamp(220px, 60vw, 340px)",height:"clamp(220px, 60vw, 340px)",marginTop:"-30px",transform:"translate(-50%, -50%)",borderRadius:"50%",border:"1px solid rgba(129, 140, 248, 0.25)",boxShadow:"0 0 60px rgba(56, 189, 248, 0.15) inset",animation:"d300CardOrbit 24s linear infinite"},children:e.jsx("div",{style:{position:"absolute",top:"-5px",left:"50%",marginLeft:"-5px",width:"10px",height:"10px",borderRadius:"50%",background:"#fbbf24",boxShadow:"0 0 12px #fbbf24"}})}),e.jsxs("div",{style:{position:"relative",textAlign:"center",zIndex:2},children:[e.jsx("div",{style:{fontFamily:"'Inter', system-ui, sans-serif",fontSize:"13px",letterSpacing:"5px",fontWeight:700,textTransform:"uppercase",color:"#7dd3fc",textShadow:"0 0 14px rgba(56, 189, 248, 0.6)",marginBottom:"6px",animation:"d300Rise 0.6s ease-out 0.2s both"},children:"Défi du Jour"}),e.jsx("div",{style:{fontFamily:"'Inter', system-ui, sans-serif",fontSize:"clamp(5rem, 26vw, 11rem)",fontWeight:900,lineHeight:.9,background:"linear-gradient(135deg, #7dd3fc 0%, #818cf8 45%, #c084fc 70%, #fbbf24 100%)",backgroundSize:"200% 200%",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",filter:"drop-shadow(0 0 30px rgba(129, 140, 248, 0.5))",animation:"d300BigNum 1s cubic-bezier(0.22, 1, 0.36, 1) both, d300StarFlow 7s ease infinite"},children:"300"}),e.jsxs("div",{style:{fontFamily:"'Inter', system-ui, sans-serif",fontSize:"clamp(1rem, 4.5vw, 1.35rem)",fontWeight:700,color:"#e0f2fe",marginTop:"8px",animation:"d300Rise 0.6s ease-out 0.7s both"},children:[Pe," exercices à valider"]}),e.jsxs("div",{style:{fontFamily:"'Inter', system-ui, sans-serif",fontSize:"clamp(0.85rem, 3.4vw, 1rem)",color:"rgba(186, 230, 253, 0.75)",lineHeight:1.5,maxWidth:"330px",margin:"10px auto 0",animation:"d300Rise 0.6s ease-out 0.9s both"},children:["Valide ",Pe," exercices — ceux que tu veux. Chaque objectif du jour atteint rallume une étoile de la constellation. ✦"]}),e.jsx("button",{onClick:s,style:{marginTop:"28px",padding:"15px 34px",background:"linear-gradient(135deg, #38bdf8, #818cf8)",border:"none",borderRadius:"14px",color:"#06121f",fontFamily:"'Inter', system-ui, sans-serif",fontSize:"15px",fontWeight:900,letterSpacing:"1px",cursor:"pointer",boxShadow:"0 10px 30px rgba(56, 189, 248, 0.45), 0 0 0 1px rgba(255,255,255,0.1) inset",animation:"d300Rise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1.1s both"},children:"🚀 Lancer l'ascension"})]})]})}const da={launch:1500,nova:1100,reveal:1800,celebration:2400},qr=Object.values(da).reduce((t,a)=>t+a,0),Vr=Array.from({length:64},(t,a)=>({id:a,angle:S(a,1)*360,distance:40+S(a,2)*80,size:5+S(a,3)*9,color:["#38bdf8","#818cf8","#c084fc","#fbbf24","#5eead4","#fde68a"][Math.floor(S(a,4)*6)],duration:1400+S(a,5)*1100,delay:S(a,6)*400,grav:30+S(a,7)*60,shape:Math.floor(S(a,8)*3)}));function Jr({onComplete:t}){const[a,n]=r.useState("launch");r.useEffect(()=>{const{launch:d,nova:o,reveal:g}=da,i=setTimeout(()=>n("nova"),d),l=setTimeout(()=>n("reveal"),d+o),f=setTimeout(()=>n("celebration"),d+o+g),u=setTimeout(t,qr);return()=>[i,l,f,u].forEach(clearTimeout)},[t]);const s=a==="nova"||a==="reveal"||a==="celebration",c=a==="reveal"||a==="celebration",p=a==="celebration";return e.jsxs("div",{style:{position:"fixed",inset:0,zIndex:3e4,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"radial-gradient(ellipse at 50% 60%, #1a1140 0%, #050616 70%)",animation:p?"d300RewardFade 2.4s ease-out forwards":void 0},children:[e.jsx(Ke,{}),e.jsx(Et,{}),a==="launch"&&e.jsxs(e.Fragment,{children:[e.jsx("div",{"aria-hidden":"true",style:{position:"absolute",left:"50%",bottom:"12%",width:"3px",transform:"translateX(-50%)",background:"linear-gradient(180deg, rgba(56,189,248,0.9), rgba(251,191,36,0.5), transparent)",animation:"d300Trail 1.5s ease-in forwards"}}),e.jsx("div",{"aria-hidden":"true",style:{position:"absolute",left:"50%",bottom:"12%",fontSize:"clamp(48px, 12vw, 90px)",lineHeight:1,filter:"drop-shadow(0 0 16px rgba(56,189,248,0.9))",animation:"d300Launch 1.5s ease-in forwards"},children:"🚀"})]}),s&&e.jsx("div",{"aria-hidden":"true",style:{position:"absolute",top:"46%",left:"50%",width:"clamp(140px, 36vw, 260px)",height:"clamp(140px, 36vw, 260px)",borderRadius:"50%",background:"radial-gradient(circle, #ffffff 0%, #fde68a 25%, #38bdf8 55%, rgba(129,140,248,0) 72%)",boxShadow:"0 0 120px rgba(56, 189, 248, 0.7)",animation:"d300Supernova 1.4s ease-out forwards"}}),c&&e.jsxs("div",{style:{position:"relative",zIndex:2,textAlign:"center",padding:"0 20px"},children:[e.jsx("div",{style:{fontFamily:"'Inter', system-ui, sans-serif",fontSize:"clamp(2rem, 9vw, 4.4rem)",fontWeight:900,lineHeight:1.05,background:"linear-gradient(135deg, #7dd3fc, #818cf8, #fbbf24)",backgroundSize:"200% 200%",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",filter:"drop-shadow(0 0 30px rgba(129, 140, 248, 0.6))",animation:"d300RewardReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), d300StarFlow 5s ease infinite",letterSpacing:"2px"},children:"CIEL RALLUMÉ"}),e.jsxs("div",{style:{marginTop:"16px",fontFamily:"'Inter', system-ui, sans-serif",fontSize:"clamp(0.9rem, 3.4vw, 1.2rem)",color:"rgba(224, 242, 254, 0.92)",fontWeight:600,animation:"d300Rise 0.5s ease-out 0.5s both"},children:[Pe," exercices validés — la constellation s'embrase. ✦🚀"]})]}),p&&e.jsx("div",{style:{position:"absolute",inset:0,pointerEvents:"none"},children:Vr.map(d=>{const o=d.angle*Math.PI/180,g=["50%","2px","2px"],i=[d.size,d.size,d.size*.5],l=[d.size,d.size,d.size*1.6];return e.jsx("div",{style:{position:"absolute",left:"50%",top:"46%",width:i[d.shape],height:l[d.shape],borderRadius:g[d.shape],background:d.color,"--dx":Math.cos(o)*d.distance,"--dy":-Math.sin(o)*d.distance,"--grav":d.grav,animation:`d300Confetti ${d.duration}ms forwards ${d.delay}ms`,willChange:"transform, opacity"}},d.id)})})]})}const Zr=jt({isActive:({dayNumber:t})=>t===300,introKey:"day300_intro_shown",doneKey:"day300_challenge_done",keepAmbianceAfterReward:!1,autoReward:!1,activeClasses:["day300-global"],doneClass:"day300-lifting",hudProps:t=>({validated:Br(t),goal:Pe}),Intro:Xr,Decor:Yr,Hud:Ur,Reward:Jr});function Qr({placement:t="dashboard"}){const a=ht(c=>c.hud);if(!a)return null;const{Component:n,props:s}=a;return e.jsx(n,{...s,placement:t})}const Kr=[Cr,Lr,Zr];function eo(t){return e.jsx(e.Fragment,{children:Kr.map((a,n)=>e.jsx(a,{...t},n))})}const Yt=5e3;function to({achievement:t,count:a=1,onClose:n,onView:s}){const{t:c}=q(),[p,d]=r.useState(!1),{exit:o,cardProps:g}=ta({onClose:n,onTap:s,duration:Yt}),{style:i,...l}=g;if(r.useEffect(()=>{const u=requestAnimationFrame(()=>d(!0));return()=>cancelAnimationFrame(u)},[]),!t)return null;const f=t.icon;return ze.createPortal(e.jsx("div",{style:{order:0,...o?{position:"absolute",left:0,right:0,top:0,margin:"0 auto"}:null,transform:`translateY(${p?"0":"-24px"})`,opacity:p?1:0,transition:"transform 0.34s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",pointerEvents:p&&!o?"auto":"none",maxWidth:"min(360px, calc(100vw - 32px))",width:"100%",display:"flex",justifyContent:"center"},children:e.jsxs("div",{...l,className:"hover-lift",style:{position:"relative",overflow:"hidden",display:"flex",alignItems:"center",gap:"14px",padding:"14px 18px 16px 14px",borderRadius:"18px",background:`linear-gradient(135deg, ${t.color}26, rgba(0,0,0,0)) , var(--tooltip-bg)`,border:`1px solid ${t.color}55`,boxShadow:`0 10px 34px rgba(0,0,0,0.45), 0 6px 22px ${t.color}3a`,backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",minWidth:"290px",cursor:"pointer",...i},children:[e.jsx("span",{"aria-hidden":!0,style:{position:"absolute",top:0,bottom:0,left:0,width:"45%",background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",animation:"toastSheen 1.3s cubic-bezier(0.22,1,0.36,1) 0.25s 1 forwards",opacity:0,pointerEvents:"none"}}),e.jsxs("div",{style:{position:"relative",flexShrink:0,width:"46px",height:"46px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(circle at 32% 26%, ${t.color}, ${t.color}cc)`,border:`2px solid ${t.color}`,boxShadow:`0 4px 16px ${t.color}66, inset 0 1px 2px rgba(255,255,255,0.4)`},children:[e.jsx(f,{size:23,color:"#fff"}),e.jsx("span",{style:{position:"absolute",top:"-3px",right:"-3px",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(Dt,{size:14,color:"#fff",fill:"#fff",style:{filter:`drop-shadow(0 0 4px ${t.color})`}})}),a>1&&e.jsxs("span",{className:"scale-in",style:{position:"absolute",top:"-7px",left:"-7px",minWidth:"20px",height:"20px",padding:"0 5px",borderRadius:"10px",display:"grid",placeItems:"center",fontSize:"0.68rem",fontWeight:900,color:"#fff",background:t.color,border:"2px solid var(--tooltip-bg)",boxShadow:`0 2px 8px ${t.color}88`},children:["×",a]})]}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"5px",fontSize:"0.62rem",fontWeight:800,color:t.color,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"2px"},children:[e.jsx(Dt,{size:11}),c("achievementToast.title")]}),e.jsx("div",{style:{fontSize:"1.02rem",fontWeight:800,color:"var(--text-primary)",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:t.title})]}),e.jsx(Ma,{size:20,color:"var(--text-secondary)",style:{flexShrink:0,opacity:.7}}),!o&&e.jsx("span",{"aria-hidden":!0,style:{position:"absolute",left:0,bottom:0,height:"3px",width:"100%",transformOrigin:"left",background:t.color,opacity:.85,animation:`toastCountdown ${Yt}ms linear forwards`,pointerEvents:"none"}})]})}),ea())}function ao(t,a){const[n,s]=r.useState(null),{t:c}=q(),p=r.useCallback(i=>{Za.celebrate(),s(l=>({achievement:i,count:l?l.count+1:1,seq:(l?.seq||0)+1}))},[]),d=r.useCallback(i=>{const l=gt.find(u=>u.id===i);if(!l){console.warn("Badge not found:",i);return}const f=aa(l);p({id:l.id,title:c(`achievements.badges.${l.id}.title`,l.id),color:l.color,icon:f})},[c,a,p]),o=r.useCallback(()=>{s(null)},[]),g=r.useCallback(()=>{const i=n?.achievement?.id;o(),t?.(i)},[o,t,n]);return r.useEffect(()=>{const i=f=>{const{badgeId:u}=f.detail||{};u&&d(u)},l=f=>{const{title:u,color:m}=f.detail||{};u&&p({id:"custom",title:u,color:m||"#fbbf24",icon:Ha.Star})};return window.addEventListener("show-achievement",i),window.addEventListener("show-achievement-custom",l),()=>{window.removeEventListener("show-achievement",i),window.removeEventListener("show-achievement-custom",l)}},[d,p]),{showAchievement:d,hideAchievement:o,AchievementToast:n?e.jsx(to,{achievement:n.achievement,count:n.count,onClose:o,onView:g},n.seq):null}}function no(t,a){const n=r.useRef(null),[s,c]=r.useState(null),[p,d]=r.useState(!1);r.useEffect(()=>{const g=setTimeout(()=>d(!0),2500);return()=>clearTimeout(g)},[]),r.useEffect(()=>{const g={totalDays:t.totalDays,maxStreak:t.maxStreak,totalRepsAll:t.totalRepsAll,perfectDays:t.perfectDays,hasCompletedAllExercisesOnce:t.hasCompletedAllExercisesOnce,weekdayWorkouts:t.weekdayWorkouts,weekendWorkouts:t.weekendWorkouts,morningWorkouts:t.morningWorkouts,afternoonWorkouts:t.afternoonWorkouts,eveningWorkouts:t.eveningWorkouts,ghostWorkout:t.ghostWorkout,perfectStreak:t.perfectStreak,hasShared:t.hasShared},i=t.achievements||{},l=new Set;for(const u of gt)Ga(u.id,g,i)&&l.add(u.id);if(!p||n.current===null){n.current=l;return}const f=[...l].filter(u=>!n.current.has(u));if(f.length>0){const u=gt.find(m=>m.id===f[0]);if(u){const m=aa(u);c({id:u.id,title:a(`achievements.badges.${u.id}.title`,u.id),color:u.color,icon:m})}}n.current=l},[t.badgeCount,t.totalDays,t.maxStreak,t.totalRepsAll,t.perfectDays,t.hasCompletedAllExercisesOnce,t.weekdayWorkouts,t.weekendWorkouts,t.morningWorkouts,t.afternoonWorkouts,t.eveningWorkouts,t.ghostWorkout,t.perfectStreak,t.hasShared,t.achievements,a,p]);const o=r.useCallback(()=>c(null),[]);return{achievement:s,clearAchievement:o}}const He={id:"ui-refresh-v1",enabled:!0,emoji:"✨",titleKey:"announcement.title",bodyKey:"announcement.body",ctaKey:"announcement.cta",highlights:[{emoji:"🎨",key:"announcement.highlights.design"},{emoji:"⚡",key:"announcement.highlights.motion"},{emoji:"🧩",key:"announcement.highlights.components"},{emoji:"🚀",key:"announcement.highlights.onboarding"}],images:[]},Ut="announcement_seen_",Xt="oneup_has_opened";function ro(){const[t,a]=r.useState(!1);return r.useEffect(()=>{if(!He.enabled)return;if(!localStorage.getItem(Xt)){localStorage.setItem(Xt,"1");return}const c=Ut+He.id;if(!localStorage.getItem(c)){const d=setTimeout(()=>a(!0),800);return()=>clearTimeout(d)}},[]),{showAnnouncement:t,announcement:He,dismissAnnouncement:()=>{a(!1);const s=Ut+He.id;localStorage.setItem(s,"1")}}}function oo({announcement:t,onDismiss:a}){const{t:n}=q(),[s,c]=r.useState(!1),p=()=>{c(!0),setTimeout(a,400)};oa(()=>(p(),!0),!0);const d=n(t.titleKey,{defaultValue:t.titleKey}),o=n(t.bodyKey,{defaultValue:t.bodyKey}),g=n(t.ctaKey,{defaultValue:t.ctaKey}),i=t.images||[],l=t.highlights||[],f="/OneUp/";return e.jsx("div",{className:"ann-backdrop",style:{animation:s?"ann-fade-out 0.4s ease forwards":"ann-fade-in 0.4s ease"},onClick:p,children:e.jsxs("div",{className:"ann-card no-scrollbar",style:{animation:s?"ann-card-out 0.4s ease forwards":"ann-card-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"},onClick:u=>u.stopPropagation(),children:[e.jsx("div",{className:"ann-aura","aria-hidden":"true"}),e.jsxs("div",{className:"ann-hero",children:[e.jsx("span",{className:"ann-ring ann-ring-1","aria-hidden":"true"}),e.jsx("span",{className:"ann-ring ann-ring-2","aria-hidden":"true"}),e.jsx("div",{className:"ann-emoji",children:t.emoji})]}),e.jsx("div",{className:"ann-badge",children:n("announcement.badge",{defaultValue:"Nouveau"})}),e.jsx("h2",{className:"panel-title ann-title",children:d}),e.jsx("p",{className:"ann-body",children:o}),l.length>0&&e.jsx("ul",{className:"ann-highlights",children:l.map((u,m)=>e.jsxs("li",{className:"ann-highlight",style:{animationDelay:`${.55+m*.08}s`},children:[e.jsx("span",{className:"ann-highlight-icon",children:u.emoji}),e.jsx("span",{className:"ann-highlight-text",children:n(u.key,{defaultValue:u.key})})]},u.key||m))}),i.length>0&&e.jsx("div",{className:"ann-images",children:i.map((u,m)=>e.jsx("div",{className:"ann-image-frame",children:e.jsx("img",{src:`${f}${u.replace(/^\//,"")}`,alt:"",className:"ann-image"})},m))}),e.jsxs("button",{className:"ann-cta",onClick:p,onPointerDown:u=>{u.currentTarget.style.transform="scale(0.97)"},onPointerUp:u=>{u.currentTarget.style.transform="scale(1)"},onPointerLeave:u=>{u.currentTarget.style.transform="scale(1)"},children:[e.jsx("span",{className:"ann-cta-shine","aria-hidden":"true"}),e.jsx("span",{className:"ann-cta-label",children:g})]})]})})}function so(){const t=G(u=>u.getDayNumber),a=G(u=>u.isDayDone),n=Re(u=>u.settings),{scheduleNotification:s}=Ya({isDayDone:a,getDayNumber:t}),[c,p]=r.useState(_t(new Date)),[d,o]=r.useState(!1),[g,i]=r.useState(null),[l,f]=r.useState(!1);return r.useEffect(()=>{const u=()=>{const x=_t(new Date);if(x!==c){const y=t(c);t(x)>y&&(i(y),o(!0),f(!0),setTimeout(()=>{o(!1),i(null)},800)),p(x),s&&s(n)}};u();const m=setInterval(u,1e4);return()=>clearInterval(m)},[c,t,n,s]),{today:c,isCounterTransitioning:d,prevDayNumber:g,showDayConfetti:l,setShowDayConfetti:f}}function io(t,a,n,s){const{t:c}=q(),[p,d]=r.useState(le[0]?.id),[o,g]=r.useState(Oe[0]?.id),[i,l]=r.useState(a[0]?.id||"custom_placeholder"),[f,u]=r.useState({}),m=b=>{t===R.BODYWEIGHT?d(b):t===R.WEIGHTS?g(b):t===R.CUSTOM?l(b):fe(t)&&u(k=>({...k,[t]:b}))};let x=i;t===R.CARDIO?x="cardio":t===R.BODYWEIGHT?x=p:t===R.WEIGHTS?x=o:fe(t)&&(x=f[t]||s[t]?.[0]?.id||null);const y=r.useMemo(()=>t===R.CARDIO?{id:"cardio",color:"#ef4444",gradient:["#ef4444","#dc2626"],icon:"Heart",name:c("common.cardio")}:t===R.BODYWEIGHT?na[x]||le[0]:t===R.WEIGHTS?wt[x]||Oe[0]:n[x]||a[0]||{id:"custom_placeholder",color:"#8b5cf6",gradient:["#8b5cf6","#7c3aed"],icon:"Star",name:c("common.custom")},[t,x,a,n,c]);return{classicSelected:p,weightsSelected:o,customSelected:i,userCatSelected:f,globalSelectedId:x,selectedExercise:y,handleSelectExercise:m}}const lo="_goldBg_h7wtx_1",co={goldBg:lo},Ge=Te.memo(({isFuture:t,effectiveStart:a,dayNumber:n,today:s,getExerciseCount:c,completions:p,computedStats:d,isCounterTransitioning:o,prevDayNumber:g,pauseCloudSync:i,setShowCounter:l,activeExerciseId:f,onSelectExercise:u,exercisesList:m,exercisesMap:x,title:y,categoryColor:b,onManageCustom:k,onManageCategories:j,getConfig:N})=>{const{t:A,i18n:F}=q(),v=x[f]||m[0];if(!v)return e.jsxs("div",{className:"flex-col flex-center full-height text-center",style:{padding:"20px"},children:[y&&e.jsx("h2",{className:"panel-title",children:y}),e.jsx("div",{style:{color:"var(--text-muted)",marginBottom:"24px"},children:A("dashboard.noExercisesConfigured")}),k&&e.jsx("button",{onClick:k,className:"hover-lift",style:{padding:"12px 24px",borderRadius:"var(--radius-md)",background:"#8b5cf6",color:"white",fontWeight:"700",border:"none"},children:A("dashboard.configure")})]});const T=N(v.id,s).difficulty,z=Fe(v,n,T)||1,I=c(s,v.id),M=p[s]?.[v.id]?.isCompleted||I>=z,Y=Math.min(n/365*100,100),O=Ua(p[s],m),P=Math.ceil(m.length/3)>=4;let V="";o?V=O?"gradientShift 4s ease infinite, counterSlideUp 1s ease-out":"rainbowFlow 6s ease infinite, counterSlideUp 1s ease-out":V=O?"gradientShift 4s ease infinite, numberRoll 0.5s ease-out":"rainbowFlow 6s ease infinite, numberRoll 0.5s ease-out";let W="";return O?W="gradientShift 4s ease infinite, counterSlideDown 1s ease-out forwards":W="rainbowFlow 6s ease infinite, counterSlideDown 1s ease-out forwards",e.jsxs("div",{className:`flex-col flex-justify-evenly flex-align-center full-width full-height pos-relative hide-scrollbar gap-responsive dashboard-slide-bg ${O?co.goldBg:""}`,style:{paddingTop:y?"var(--dashboard-slide-padding-top, clamp(6px, 1vh, 12px))":"0",transition:"all 0.6s ease-in-out",overflow:"hidden",...P?{"--exercise-btn-min-height":"var(--exercise-btn-min-height-with-title, var(--exercise-btn-min-height))","--done-text-margin":"var(--done-text-margin-with-title, var(--done-text-margin))","--done-text-size":"var(--done-text-size-with-title, var(--done-text-size))"}:{},...P&&y?{"--day-label-size":"var(--day-label-size-with-title, var(--day-label-size))","--day-num-height":"var(--day-num-height-with-title, var(--day-num-height))","--day-num-font-size":"var(--day-num-font-size-with-title, var(--day-num-font-size))","--bottom-btn-size":"var(--bottom-btn-size-with-title, var(--bottom-btn-size))"}:{}},children:[O&&e.jsx(e.Fragment,{children:[{top:"10%",left:"15%",size:12,delay:"0s"},{top:"20%",right:"10%",size:8,delay:"1s"},{bottom:"15%",left:"10%",size:10,delay:"2s"},{bottom:"25%",right:"15%",size:7,delay:"3.5s"}].map((_,w)=>e.jsx(Na,{className:"sparkle-icon",size:_.size,fill:"#FFD700",style:{top:_.top,left:_.left,right:_.right,bottom:_.bottom,animationDelay:_.delay,opacity:.4}},w))}),y&&e.jsxs("div",{className:"flex-align-center",style:{gap:"8px"},children:[e.jsx("div",{style:{fontSize:"var(--category-title-size, 0.8rem)",fontWeight:"800",color:O?"#ffdf00":b||"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"2px",opacity:.8,textShadow:O?"0 0 10px rgba(255,223,0,0.5)":"none"},children:y}),k&&e.jsx("button",{onClick:k,"aria-label":"Manage custom exercises",style:{background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",opacity:.6,padding:"4px"},children:e.jsx(Kt,{size:14})}),j&&e.jsx("button",{onClick:j,"aria-label":"Manage categories",style:{background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",opacity:.6,padding:"4px"},children:e.jsx(Oa,{size:14})})]}),t?e.jsxs("div",{className:"glass-premium",style:{textAlign:"center",padding:"var(--spacing-xl)",borderRadius:"var(--radius-xl)",maxWidth:"320px"},children:[e.jsx("h2",{className:"panel-title",children:A("dashboard.waiting")}),e.jsxs("p",{style:{color:"var(--text-secondary)",lineHeight:"1.6"},children:[A("dashboard.challengeStarts")," ",e.jsx("br",{}),e.jsx("strong",{style:{color:"var(--text-primary)",fontSize:"1.1rem"},children:a})]})]}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{style:{textAlign:"center",position:"relative"},children:[e.jsx("div",{style:{fontSize:"var(--day-label-size, clamp(0.75rem, 1.6vh, 1rem))",lineHeight:1.2,color:O?"#ffdf00":"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"4px",marginBottom:"2px",fontWeight:"700",textShadow:O?"0 0 8px rgba(255,223,0,0.4)":"none"},className:"day-label",children:e.jsx("span",{className:"day-label-text",children:A("dashboard.day")})}),e.jsxs("div",{className:"flex-center pos-relative overflow-hidden day-number-container",style:{height:"var(--day-num-height, clamp(2.4rem, 8vh, 6.5rem))",marginBottom:"clamp(2px, 0.4vh, 6px)",filter:O?"drop-shadow(0 0 15px rgba(251,191,36,0.2))":"none"},children:[o&&g&&e.jsx("div",{className:`day-number-anim ${O?"gold-text":"rainbow-gradient"}`,style:{position:"absolute",fontSize:"var(--day-num-font-size, clamp(2.2rem, 7.5vh, 6rem))",fontWeight:"800",lineHeight:1,animation:W},children:g}),e.jsx("div",{className:`day-number ${O?"gold-text":"rainbow-gradient"}`,"data-text":n,style:{fontSize:"var(--day-num-font-size, clamp(2.2rem, 7.5vh, 6rem))",fontWeight:"800",lineHeight:1,animation:V},children:n},n)]})]}),e.jsx("div",{className:"exercise-grid flex-row flex-wrap flex-justify-center",style:{gap:"var(--exercise-btn-gap, clamp(4px, 1vh, 8px))",width:"100%",maxWidth:"640px",padding:"2px"},children:m.map(_=>e.jsx(po,{ex:_,isActive:_.id===f,dayNumber:n,today:s,getExerciseCount:c,completions:p,computedStats:d,onSelect:u,getConfig:N},_.id))}),e.jsxs("div",{className:"flex-col flex-align-center gap-responsive",children:[e.jsxs("div",{className:"flex-center pos-relative",style:{width:"var(--bottom-btn-size, clamp(72px, 12vh, 110px))",height:"var(--bottom-btn-size, clamp(72px, 12vh, 110px))"},children:[e.jsx("div",{style:{position:"absolute",inset:"-45%",borderRadius:"50%",background:`radial-gradient(circle, ${v.color}${M?"38":"24"} 0%, transparent 62%)`,pointerEvents:"none",transition:"background 0.6s ease"}}),e.jsxs("button",{"aria-label":`${sa(v)} counter`,onClick:()=>{i?.(),l(!0)},className:"ripple counter-button",style:{width:"100%",height:"100%",background:M?`linear-gradient(135deg, ${v.color} 0%, ${v.gradient[1]} 100%)`:"transparent",border:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1px",transition:"transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",willChange:"transform",transform:M?"scale(1.1)":"scale(1)",boxShadow:M?`0 0 50px ${v.color}aa, 0 8px 30px ${v.color}55, 0 0 0 4px ${v.color}33, inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.1)`:`0 0 16px ${v.color}33`,cursor:"pointer",position:"relative",overflow:"hidden"},children:[!M&&e.jsx("div",{className:"counter-ring","aria-hidden":"true",style:{"--ring-c1":v.gradient[0],"--ring-c2":v.gradient[1],"--ring-track":`${v.color}26`,"--ring-progress":`${Math.min(Y,100)}%`}}),M?e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{position:"absolute",inset:0,background:"linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",pointerEvents:"none"}}),e.jsx(Qa.Check,{size:26,color:"white",style:{filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))",position:"relative",zIndex:1}}),e.jsx("span",{style:{fontSize:"clamp(0.5rem, 1.2vh, 0.7rem)",color:"white",fontWeight:"800",textShadow:"0 1px 2px rgba(0,0,0,0.3)",position:"relative",zIndex:1},children:v.type==="timer"?`${ye(z)}/${ye(z)}`:`${z}/${z}`})]}):e.jsxs(e.Fragment,{children:[e.jsx(kt,{icon:v.icon,size:22,color:v.color}),e.jsx("span",{style:{fontSize:"clamp(0.45rem, 1.2vh, 0.65rem)",color:v.color,fontWeight:"700"},children:v.type==="timer"?`${ye(I)}/${ye(z)}`:`${I}/${z}`})]})]})]}),(()=>{const _=p[s]?.[f],w=_?.timestamp?Xa(_.timestamp):null,U=w?w.toLocaleTimeString(F.language,{hour:"2-digit",minute:"2-digit"}):null,J=M&&!!U;return e.jsx("div",{className:J?"scale-in":"",style:{color:"var(--text-secondary)",fontWeight:"500",marginTop:"var(--done-text-margin, clamp(4px, 0.8vh, 6px))",opacity:J?.75:0,visibility:J?"visible":"hidden",fontSize:"var(--done-text-size, clamp(0.65rem, 2.5vw, 0.85rem))",transition:"opacity 0.2s ease, visibility 0.2s ease",pointerEvents:"none",textAlign:"center",minHeight:"1.2em"},children:J?A("dashboard.doneAt",{time:U}):" "})})()]})]})]})}),po=Te.memo(({ex:t,isActive:a,dayNumber:n,today:s,getExerciseCount:c,completions:p,computedStats:d,onSelect:o,getConfig:g})=>{const i=d.exerciseStats?.find(I=>I.id===t.id),l=i?i.streak:0,f=!!i?.streakActive,u=c(s,t.id),{difficulty:m,weight:x}=g(t.id,s),y=Fe(t,n,m),b=p[s]?.[t.id]?.isCompleted||u>=y,k=b?100:Math.min(100,u/Math.max(y,1)*100);let j=`linear-gradient(160deg, ${t.color}0d 0%, var(--surface-subtle) 80%)`;b?j=`linear-gradient(160deg, ${t.color}26 0%, ${t.gradient[1]}14 100%)`:a&&(j=`linear-gradient(160deg, ${t.color}2e 0%, ${t.gradient[0]}16 100%)`);let N="1.5px solid var(--border-muted)";b?N=`1.5px solid ${t.color}66`:a&&(N=`1.5px solid ${t.color}88`);let A="none";b?A=`0 0 8px ${t.color}33`:a&&(A=`0 4px 16px ${t.color}22`);const F=b||a?t.color:"var(--text-secondary)",v=b||a?t.color:"var(--text-primary)",T=b||a?1:.75;let z="";return t.type==="timer"?z=b?ye(y):`${ye(u)}/${ye(y)}`:z=b?y:`${u}/${y}`,e.jsxs("button",{onClick:()=>o(t.id),className:"hover-lift exercise-button",style:{flex:"1 1 calc(33.333% - 8px)",minWidth:"clamp(60px, 18vw, 100px)",maxWidth:"130px",display:"flex",flexDirection:"column",alignItems:"center",gap:"var(--exercise-btn-gap, clamp(2px, 0.4vh, 5px))",padding:"var(--exercise-btn-padding, clamp(8px, 1.2vh, 12px) clamp(4px, 0.8vw, 8px))",borderRadius:"var(--radius-md)",minHeight:"var(--exercise-btn-min-height, clamp(44px, 7.2vh, 58px))",background:j,border:N,cursor:"pointer",transition:"all 0.25s ease",position:"relative",overflow:"hidden","--done-color":`${t.color}55`,"--done-color-dim":`${t.color}12`,animation:b?"doneGlow 3s ease-in-out infinite":"none",boxShadow:A},children:[b&&e.jsx("div",{style:{position:"absolute",top:"3px",right:"3px",width:"15px",height:"15px",borderRadius:"50%",background:`linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 8px ${t.color}66`,animation:"checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",zIndex:1},children:e.jsx("span",{style:{fontSize:"8px",color:"white",fontWeight:"700",lineHeight:1},children:"✓"})}),e.jsx(Ka,{streak:l,active:f,variant:"badge",style:{position:"absolute",top:"3px",left:"3px",zIndex:1}}),e.jsx("div",{style:{width:"var(--tile-icon-size, clamp(24px, 3.6vh, 30px))",height:"var(--tile-icon-size, clamp(24px, 3.6vh, 30px))",borderRadius:"30%",background:`${t.color}${b||a?"2e":"16"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.25s ease"},children:e.jsx(kt,{icon:t.icon,size:16,color:t.color,style:{transition:"opacity 0.2s ease",opacity:b||a?1:.85}})}),e.jsx("span",{style:{fontSize:"var(--tile-label-size, clamp(0.55rem, 1.25vh, 0.78rem))",fontWeight:"600",color:F,textAlign:"center",lineHeight:"1.1",transition:"color 0.2s ease"},children:sa(t)}),e.jsxs("span",{style:{fontSize:"var(--tile-count-size, clamp(0.6rem, 1.35vh, 0.82rem))",fontWeight:"700",lineHeight:1.2,color:v,opacity:T,transition:"color 0.2s ease",fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap"},children:[e.jsx("span",{style:{textDecorationLine:b?"line-through":"none",textDecorationColor:`${t.color}88`},children:z}),wt[t.id]&&e.jsx(en,{weight:x,color:t.color,style:{marginLeft:"5px"}})]}),e.jsx("div",{style:{position:"absolute",left:0,right:0,bottom:0,height:"3px",background:`${t.color}14`},children:e.jsx("div",{style:{height:"100%",width:`${k}%`,background:`linear-gradient(90deg, ${t.gradient[0]}, ${t.gradient[1]})`,boxShadow:k>0?`0 0 6px ${t.color}88`:"none",transition:"width 0.4s ease"}})})]})}),pt=({title:t,onOpenStore:a})=>{const{t:n}=q();return e.jsxs(tn,{align:"center",justify:"center",gap:"sm",style:{height:"100%",padding:"20px",textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"0.8rem",fontWeight:"800",color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"2px",opacity:.8},children:t}),e.jsx("div",{style:{width:"64px",height:"64px",borderRadius:"50%",background:"linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(139,92,246,0.3)",marginBottom:"8px"},children:e.jsx(Pa,{size:28,color:"#8b5cf6"})}),e.jsx("h2",{className:"panel-title",style:{margin:0},children:n("paywall.proRequired")}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"0.9rem",lineHeight:"1.5",margin:0,maxWidth:"280px"},children:n("paywall.proRequiredDesc")}),e.jsx(Xe,{variant:"success",icon:$a,onClick:a,className:"hover-lift",style:{marginTop:"8px",borderRadius:"var(--radius-xl)"},children:n("paywall.viewStore")})]})};function It(){const t=G(i=>i.completions),a=Re(i=>i.settings),n=Re(i=>i.updateSettings),{getWeight:s,setWeight:c}=$e(),p=r.useCallback((i,l=null)=>{if(l&&t?.[l]?.[i]?.isCompleted){const u=t[l][i].difficulty;return u!==void 0?u:1}const f=a?.exerciseDifficulties||{};return f[i]!==void 0?f[i]:1},[t,a?.exerciseDifficulties]),d=r.useCallback((i,l)=>{n(f=>({exerciseDifficulties:{...f.exerciseDifficulties||{},[i]:l}}))},[n]),o=r.useCallback((i,l=null)=>{if(!i)return{difficulty:1,weight:null};if(l&&t?.[l]?.[i]?.isCompleted){const f=t[l][i];let u=1;f.difficulty!==void 0?u=f.difficulty:p&&(u=p(i));let m=null;return f.weight!==void 0?m=f.weight:s&&(m=s(i)),{weight:m,difficulty:u}}return{difficulty:p?p(i):1,weight:s?s(i):null}},[t,p,s]),g=r.useCallback((i,{weight:l,difficulty:f}={})=>{l!==void 0&&c&&c(i,l),f!==void 0&&d&&d(i,f)},[c,d]);return{getConfig:o,updateConfig:g}}const uo=r.lazy(()=>se(()=>import("./CardioModule-BpMuvXAJ.js").then(t=>t.b),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13])).then(t=>({default:t.CardioModule})));function go({fullCategoryOrder:t,renderedSlides:a,isFuture:n,effectiveStart:s,dayNumber:c,today:p,isCounterTransitioning:d,prevDayNumber:o,classicSelected:g,weightsSelected:i,customSelected:l,userCatSelected:f,handleSelectExercise:u,customCategories:m}){const{t:x}=q(),y=G(E=>E.getExerciseCount),b=G(E=>E.completions),k=Ne(E=>E.pauseCloudSync),j=St(E=>E.stats),N=B(E=>E.openModal),A=B(E=>E.openStore),F=B(E=>E.openCustomExercises),v=E=>E&&N("counter"),{getConfig:T}=It(),{isPro:z}=qe(),{defaultCustomExercises:I,customExercisesMap:M,exercisesByUserCategory:Y,exercisesMapByUserCategory:O}=$e();return t.map((E,P)=>{if(!a.has(P))return e.jsx("div",{className:"dashboard-slide-container","data-slide-index":P,style:{flex:"0 0 100%",scrollSnapAlign:"start",height:"100%"}},E);if(E===R.CARDIO)return e.jsx("div",{className:"dashboard-slide-container","data-slide-index":P,style:{flex:"0 0 100%",scrollSnapAlign:"start",height:"100%"},children:e.jsx(r.Suspense,{fallback:null,children:e.jsx(uo,{})})},E);if(E===R.BODYWEIGHT)return e.jsx("div",{className:"dashboard-slide-container","data-slide-index":P,style:{flex:"0 0 100%",scrollSnapAlign:"start",height:"100%"},children:e.jsx(Ge,{isFuture:n,effectiveStart:s,dayNumber:c,today:p,getExerciseCount:y,completions:b,computedStats:j,isCounterTransitioning:d,prevDayNumber:o,pauseCloudSync:k,setShowCounter:v,activeExerciseId:g,onSelectExercise:u,exercisesList:le,exercisesMap:na,getConfig:T})},E);if(E===R.WEIGHTS)return e.jsx("div",{className:"dashboard-slide-container","data-slide-index":P,style:{flex:"0 0 100%",scrollSnapAlign:"start",height:"100%"},children:Ie(Ae.WEIGHTS,{isPro:z})?e.jsx(Ge,{title:x("common.weights"),categoryColor:bt[R.WEIGHTS],isFuture:n,effectiveStart:s,dayNumber:c,today:p,getExerciseCount:y,completions:b,computedStats:j,isCounterTransitioning:d,prevDayNumber:o,pauseCloudSync:k,setShowCounter:v,activeExerciseId:i,onSelectExercise:u,exercisesList:Oe,exercisesMap:wt,getConfig:T}):e.jsx(pt,{title:x("common.weights"),onOpenStore:A})},E);if(E===R.CUSTOM){const W=m.find(U=>U.id===E),_=W?.name||x("common.custom"),w=W?.color||bt[R.CUSTOM];return e.jsx("div",{className:"dashboard-slide-container","data-slide-index":P,style:{flex:"0 0 100%",scrollSnapAlign:"start",height:"100%"},children:Ie(Ae.CUSTOM_EXERCISES,{isPro:z})?e.jsx(Ge,{title:_,categoryColor:w,isFuture:n,effectiveStart:s,dayNumber:c,today:p,getExerciseCount:y,completions:b,computedStats:j,isCounterTransitioning:d,prevDayNumber:o,pauseCloudSync:k,setShowCounter:v,activeExerciseId:M[l]?l:I[0]?.id||null,onSelectExercise:u,exercisesList:I,exercisesMap:M,onManageCustom:()=>{F(null),k?.()},onManageCategories:()=>{N("categoryManager")},getConfig:T}):e.jsx(pt,{title:_,onOpenStore:A})},E)}if(fe(E)){const W=m.find(J=>J.id===E);if(!W)return null;const _=Y[E]||[],w=O[E]||{},U=f[E]||_[0]?.id||null;return e.jsx("div",{className:"dashboard-slide-container","data-slide-index":P,style:{flex:"0 0 100%",scrollSnapAlign:"start",height:"100%"},children:Ie(Ae.CUSTOM_CATEGORIES,{isPro:z})?e.jsx(Ge,{title:W.name,categoryColor:W.color,isFuture:n,effectiveStart:s,dayNumber:c,today:p,getExerciseCount:y,completions:b,computedStats:j,isCounterTransitioning:d,prevDayNumber:o,pauseCloudSync:k,setShowCounter:v,activeExerciseId:U,onSelectExercise:u,exercisesList:_,exercisesMap:w,onManageCustom:()=>{F(E),k?.()},getConfig:T}):e.jsx(pt,{title:W.name,onOpenStore:A})},E)}return null})}const fo=r.lazy(()=>se(()=>import("./Calendar-a3Z85Gf8.js"),__vite__mapDeps([14,2,10,7,1,5,6,15,12,16])).then(t=>({default:t.Calendar}))),mo=r.lazy(()=>se(()=>import("./Stats-ByLveOZJ.js"),__vite__mapDeps([17,1,2,10,7,5,6,11,18,8,19,20,3,4,21,12])).then(t=>({default:t.Stats}))),xo=r.lazy(()=>se(()=>import("./Settings-CVDw7NUH.js"),__vite__mapDeps([22,1,2,10,7,5,6,11,23,24,25,12])).then(t=>({default:t.Settings}))),bo=r.lazy(()=>se(()=>import("./ExercisePanel-yvLf91DL.js"),__vite__mapDeps([26,2,10,7,1,5,6,12,27])).then(t=>({default:t.ExercisePanel}))),ho=r.lazy(()=>se(()=>import("./Leaderboard-Dusqv63F.js"),__vite__mapDeps([28,2,10,7,1,5,6,11,29,15,20,9,12,30,31])).then(t=>({default:t.Leaderboard}))),yo=r.lazy(()=>se(()=>import("./Achievements-CfBOcESC.js"),__vite__mapDeps([32,2,10,7,1,5,6,11,21,12])).then(t=>({default:t.Achievements}))),vo=r.lazy(()=>se(()=>import("./WorkoutSession-DZLfA1Aj.js"),__vite__mapDeps([33,2,10,7,1,5,6,18,8,19,26,12,27,34])).then(t=>({default:t.WorkoutSession}))),wo=r.lazy(()=>se(()=>import("./CustomExercisesModal-BRC5rwRS.js"),__vite__mapDeps([35,2,10,7,1,5,6,12])).then(t=>({default:t.CustomExercisesModal}))),So=r.lazy(()=>se(()=>import("./CategoryManagerModal-DiVOUUcj.js"),__vite__mapDeps([36,2,10,7,1,5,6,12])).then(t=>({default:t.CategoryManagerModal}))),ko=r.lazy(()=>se(()=>import("./AdminPanel-DSs6GNe4.js"),__vite__mapDeps([37,2,10,7,1,5,6,29,8,23,24,12,30])).then(t=>({default:t.AdminPanel})));function jo({currentCatKey:t,effectiveSlide:a,selectedExercise:n,selectedExerciseId:s,dailyGoal:c,currentCount:p,isExerciseDone:d,dayNumber:o,today:g}){const i=G(w=>w.startDate),l=G(w=>w.completions),f=G(w=>w.getDayNumber),u=G(w=>w.updateExerciseCount),m=Re(w=>w.settings),x=Ne(w=>w.resumeCloudSync),y=St(w=>w.stats),{getConfig:b}=It(),{isPro:k}=qe(),{customExercisesHook:j,customCategoriesHook:N,defaultCustomExercises:A,exercisesByUserCategory:F}=$e(),v=B(w=>w.modals),T=B(w=>w.closeModal),z=B(w=>w.openStore),I=B(w=>w.closeSettings),M=B(w=>w.openStoreDirectly),Y=B(w=>w.customExModalCatId),O=B(w=>w.closeCustomExercises),E=B(w=>w.openAchievements),P=B(w=>w.closeAchievements),V=B(w=>w.highlightedBadgeId),W=B(w=>w.sessionMode),_=B(w=>w.setSessionInProgress);return e.jsxs(e.Fragment,{children:[v.calendar&&e.jsx(r.Suspense,{fallback:null,children:e.jsx(fo,{startDate:i,completions:l,exercises:fe(t)?F[t]||[]:{[R.BODYWEIGHT]:le,[R.WEIGHTS]:Oe,[R.CARDIO]:qa,[R.CUSTOM]:A}[t],isCustom:t===R.CUSTOM||fe(t),getDayNumber:f,onClose:()=>T("calendar"),settings:m,getConfig:b})}),v.stats&&e.jsx(r.Suspense,{fallback:null,children:e.jsx(mo,{initialCategory:fe(t)?t:{[R.BODYWEIGHT]:"standard",[R.WEIGHTS]:"weights",[R.CARDIO]:"cardio",[R.CUSTOM]:"custom"}[t],onClose:()=>T("stats"),onOpenAchievements:w=>E(w),onOpenStore:z})}),v.settings&&e.jsx(r.Suspense,{fallback:null,children:e.jsx(xo,{defaultShowStore:M,onClose:I})}),v.counter&&n&&e.jsx(r.Suspense,{fallback:null,children:e.jsx(bo,{exerciseConfig:n,onClose:()=>{T("counter"),x?.()},dailyGoal:c,currentCount:p,onUpdateCount:w=>{const{weight:U,difficulty:J}=b(s,g);u(g,s,w,c,U,J)},isCompleted:d,dayNumber:o})}),v.leaderboard&&e.jsx(r.Suspense,{fallback:null,children:e.jsx(ho,{onClose:()=>T("leaderboard"),activeSlide:a})}),v.achievements&&e.jsx(r.Suspense,{fallback:null,children:e.jsx(yo,{completions:l,exercises:le,onClose:P,settings:m,getDayNumber:f,highlightedBadgeId:V,computedStats:y})}),v.session&&e.jsx(r.Suspense,{fallback:null,children:e.jsx(vo,{onClose:()=>{T("session"),x?.()},today:g,dayNumber:o,activeSlide:a,sessionMode:W,setSessionInProgress:_})}),v.customExercises&&k&&e.jsx(r.Suspense,{fallback:null,children:e.jsx(wo,{onClose:()=>{O(),x?.()},customExercisesHook:j,customCategoriesHook:N,computedStats:y,categoryId:Y})}),v.categoryManager&&k&&e.jsx(r.Suspense,{fallback:null,children:e.jsx(So,{onClose:()=>T("categoryManager"),customCategoriesHook:N,exercisesByUserCategory:F,defaultCustomExercises:A})}),v.admin&&e.jsx(r.Suspense,{fallback:null,children:e.jsx(ko,{onClose:()=>T("admin")})})]})}const qt="lucasm2.054800@gmail.com";function Co(t){return!t||!qt?!1:t===qt}function Eo(){const{t}=q(),[a,n]=r.useState(!1),s=r.useCallback(()=>{n(!0)},[]),c=vt(),p=Co(c?.user?.email),d=G(h=>h.getDayNumber),o=G(h=>h.completions),g=G(h=>h.startDate),i=G(h=>h.userStartDate),l=G(h=>h.getExerciseCount),f=G(h=>h.loadFromCloud),u=G(h=>h.syncWithCloud),m=G(h=>h.hasGuestData),x=G(h=>h.clearAnonymousData),y=G(h=>h.mergeWithAnonymousData),b=Re(h=>h.settings),k=Re(h=>h.updateSettings),j=Ne(h=>h.conflictData),N=Ne(h=>h.onResolveConflict),A=St(h=>h.stats),{getConfig:F}=It(),{isPro:v}=qe(),{customExercises:T,customExercisesMap:z,customCategories:I,exercisesByUserCategory:M}=$e(),Y=B(h=>h.openModal),O=B(h=>h.openAchievements),E=B(h=>h.closeTopModal),P=B(h=>h.modalStack.length>0),V=B(h=>h.sessionInProgress),W=B(h=>h.setSessionInProgress),_=B(h=>h.openSession),w=r.useCallback(()=>{$n(),W(!1),n(!1)},[W]),U=r.useCallback(h=>N(h,{loadFromCloud:f,syncWithCloud:u,hasGuestData:m,clearAnonymousData:x,mergeWithAnonymousData:y,updateSettings:k}),[N,f,u,m,x,y,k]),{showAnnouncement:J,announcement:ue,dismissAnnouncement:ge}=ro(),Z=r.useMemo(()=>ur(I),[I]),ve=r.useMemo(()=>gr(I),[I]),me=Z.indexOf(R.BODYWEIGHT),[ae,we]=r.useState(me),Le=r.useMemo(()=>{const h=new Set;return h.add(ae),ae>0&&h.add(ae-1),ae<Z.length-1&&h.add(ae+1),h},[ae,Z.length]),Se=r.useRef(null),De=r.useCallback(h=>{h.forEach(_e=>{if(_e.isIntersecting){const at=parseInt(_e.target.getAttribute("data-slide-index"),10);isNaN(at)||we(at)}})},[]);r.useEffect(()=>{const h=Se.current;if(!h)return;const _e=new IntersectionObserver(De,{root:h,threshold:.5});return Array.from(h.children).forEach(Tt=>{Tt.classList.contains("dashboard-slide-container")&&_e.observe(Tt)}),()=>_e.disconnect()},[Z,Le,De]),r.useEffect(()=>{const h=Se.current;h&&requestAnimationFrame(()=>h.scrollTo({top:h.clientHeight*me,behavior:"instant"}))},[me]);const et=h=>h===R.WEIGHTS?Ie(Ae.WEIGHTS,{isPro:v}):h===R.CUSTOM?Ie(Ae.CUSTOM_EXERCISES,{isPro:v}):fe(h)?Ie(Ae.CUSTOM_CATEGORIES,{isPro:v}):!0,C=Z[ae],D=et(C)?ae:me,H=Z[D],{today:$,isCounterTransitioning:X,prevDayNumber:L,showDayConfetti:Q,setShowDayConfetti:re}=so(),{classicSelected:xe,weightsSelected:ke,customSelected:be,userCatSelected:je,globalSelectedId:ce,selectedExercise:de,handleSelectExercise:pa}=io(H,T,z,M);r.useEffect(()=>{fn(()=>b),an(()=>b)},[b]);const{showAchievement:At,AchievementToast:ua}=ao(h=>{Y("stats"),setTimeout(()=>O(h),100)}),{achievement:tt,clearAchievement:Rt}=no(A,t);r.useEffect(()=>{tt?.id&&(At(tt.id),Rt())},[tt,At,Rt]);const Be=r.useMemo(()=>d($),[d,$]),ga=o[$]?.[ce]?.isCompleted||!1,fa=l($,ce),ma=F(ce,$).difficulty,xa=Fe(de,Be,ma)||1,ba=H===R.CARDIO?(A.exerciseReps?.running||0)+(A.exerciseReps?.cycling||0):A.exerciseReps?.[ce]||0,zt=i||g,ha=$<zt;return oa(E,P),r.useEffect(()=>(P?(document.body.style.overflow="hidden",document.body.style.touchAction="none",document.documentElement.style.overflow="hidden"):(document.body.style.overflow="",document.body.style.touchAction="",document.documentElement.style.overflow=""),()=>{document.body.style.overflow="",document.body.style.touchAction="",document.documentElement.style.overflow=""}),[P]),e.jsxs(e.Fragment,{children:[e.jsx(Dn,{conflictData:j,onResolveConflict:U}),J&&e.jsx(oo,{announcement:ue,onDismiss:ge}),e.jsx(Tn,{}),e.jsx(ln,{active:Q,colors:["#6d28d9","#8b5cf6","#0ea5e9","#f093fb","#fbbf24","#10b981"],onDone:()=>re(!1),reducedParticles:b?.performanceMode==="low"}),ua,e.jsx(eo,{dayNumber:Be,today:$,getExerciseCount:l,getConfig:F,completions:o}),e.jsxs("div",{className:"flex-col full-height fade-in gap-responsive",style:{paddingBottom:"clamp(1px, 0.3vh, 6px)"},children:[e.jsx(gn,{}),e.jsx(pn,{}),e.jsx(Bn,{isAdmin:p,streakActive:A.streakActive,streakFrozen:A.streakFrozen,displayStreak:A.displayStreak,selectedExercise:de,totalReps:ba}),V&&!P&&e.jsx(ia,{onResume:()=>_("running"),onDiscard:s}),!P&&e.jsx(Qr,{placement:"dashboard"}),e.jsxs("main",{className:"flex-1 flex-col pos-relative",style:{minHeight:0},children:[e.jsx("div",{ref:Se,style:{flex:1,overflowY:P?"hidden":"auto",overflowX:"hidden",scrollSnapType:"y mandatory",display:"flex",flexDirection:"column",width:"100%",scrollbarWidth:"none",msOverflowStyle:"none"},children:e.jsx(go,{fullCategoryOrder:Z,renderedSlides:Le,isFuture:ha,effectiveStart:zt,dayNumber:Be,today:$,isCounterTransitioning:X,prevDayNumber:L,classicSelected:xe,weightsSelected:ke,customSelected:be,userCatSelected:je,handleSelectExercise:pa,customCategories:I})}),e.jsx(fr,{fullCategoryOrder:Z,activeSlide:ae,customCategories:I,scrollContainerRef:Se,anyModalOpen:P})]}),e.jsx(qn,{selectedExercise:de,activeCategoryColor:ve[Z[D]]}),e.jsx(jo,{currentCatKey:H,effectiveSlide:D,selectedExercise:de,selectedExerciseId:ce,dailyGoal:xa,currentCount:fa,isExerciseDone:ga,dayNumber:Be,today:$}),e.jsx(_n,{open:a,message:t("dashboard.discardConfirm"),onConfirm:w,onCancel:()=>n(!1),destructive:!0,confirmLabel:t("dashboard.discard")})]})]})}const Mo=Object.freeze(Object.defineProperty({__proto__:null,Dashboard:Eo},Symbol.toStringTag,{value:"Module"}));export{hn as A,R as C,Mo as D,Qr as E,Nn as G,Ye as Z,gr as a,ur as b,pr as c,bt as d,ln as e,On as f,$n as g,_o as h,fe as i,B as j,Pn as l,Pt as s,It as u};
