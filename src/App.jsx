import { useState, useEffect, useRef } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, getDocs, addDoc, deleteDoc, query, orderBy, limit, writeBatch } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import './App.css';

const DEF_CATS=["Bank Details","Call Sheets","Case Studies","IT-Geeks Policies","Manager Profiles","Passwords","Proposals","Quick Links","Service Deck","W9 Forms"];
const C={bg:"#e8e0d0",surface:"#f5f0e6",surfaceWarm:"#ede7da",sidebar:"#ddd5c5",border:"#cec4b2",borderLight:"#ddd5c6",accent:"#a0856b",accentDark:"#7a6650",accentLight:"#f0e8db",red:"#c43a2f",redBg:"#f8e8e6",blue:"#4a6fa5",blueBg:"#e8eef5",green:"#5a8a5e",greenBg:"#e8f0e8",amber:"#b8860b",amberBg:"#f5eedd",purple:"#7554b8",text:"#3a3226",textSec:"#6b5e4f",textMuted:"#9e8e7d",shadow:"0 1px 4px rgba(74,63,51,0.06)",shadowMd:"0 4px 16px rgba(74,63,51,0.08)"};

function gid(){return"i"+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function fdt(iso){if(!iso)return"—";const d=new Date(iso);return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})+", "+d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}

// Firestore helpers (modular SDK)
async function fsGetAll(col){try{const snap=await getDocs(collection(db,col));return snap.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.error("fsGet",col,e);return[]}}
async function fsSetDoc(col,id,data){try{await setDoc(doc(db,col,id),data,{merge:true})}catch(e){console.error("fsSet",e)}}
async function fsDelDoc(col,id){try{await deleteDoc(doc(db,col,id))}catch(e){console.error("fsDel",e)}}
async function fsAddDoc(col,data){try{const ref=await addDoc(collection(db,col),data);return ref.id}catch(e){console.error("fsAdd",e);return null}}

// Category icons
const catIcons={"Bank Details":'<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 14h4"/>',"Call Sheets":'<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>',"Case Studies":'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',"IT-Geeks Policies":'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',"Manager Profiles":'<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',"Passwords":'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',"Proposals":'<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',"Quick Links":'<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>',"Service Deck":'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',"W9 Forms":'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>'};
const catColors={"Bank Details":"#4a6fa5","Call Sheets":"#5a8a5e","Case Studies":"#b8860b","IT-Geeks Policies":"#c43a2f","Manager Profiles":"#7554b8","Passwords":"#c43a2f","Proposals":"#a0856b","Quick Links":"#4a6fa5","Service Deck":"#5a8a5e","W9 Forms":"#b8860b"};
const catBgs={"Bank Details":"#e8eef5","Call Sheets":"#e8f0e8","Case Studies":"#f5eedd","IT-Geeks Policies":"#f8e8e6","Manager Profiles":"#f0ecf5","Passwords":"#f8e8e6","Proposals":"#f0e8db","Quick Links":"#e8eef5","Service Deck":"#e8f0e8","W9 Forms":"#f5eedd"};

function Ic({d,size=18,sw=1.7}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:d}}/>}
const ic={home:'<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',cat:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',users:'<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>',log:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',dl:'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',ul:'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',out:'<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',ext:'<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',file:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>',lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',edit:'<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>',trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>',x:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',tag:'<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',clip:'<path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>',back:'<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',check:'<polyline points="20 6 9 17 4 12"/>'};

// UI Components
function Toast({message,type,onClose}){useEffect(()=>{const t=setTimeout(onClose,3000);return()=>clearTimeout(t)},[onClose]);return <div style={{position:"fixed",top:20,right:20,zIndex:9999,padding:"11px 20px",background:type==="success"?C.green:type==="error"?C.red:C.blue,color:"#fff",borderRadius:4,fontSize:13,fontWeight:500,fontFamily:"'DM Mono',monospace",boxShadow:C.shadowMd,animation:"toastIn .3s ease"}}>{message}</div>}
function Modal({title,onClose,children,width=520}){return <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(58,50,38,0.25)",backdropFilter:"blur(2px)"}} onClick={onClose}><div className="card" style={{width:"92%",maxWidth:width,maxHeight:"85vh",overflow:"auto",padding:"24px 28px"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h3 style={{margin:0,fontSize:16,fontWeight:600,fontFamily:"'Libre Baskerville',serif"}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",display:"flex"}}><Ic d={ic.x} size={18} sw={2}/></button></div>{children}</div></div>}
function FF({label,ch}){return <div style={{marginBottom:16}}><label style={{display:"block",fontSize:11,fontWeight:500,color:C.textSec,marginBottom:6,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:".08em"}}>{label}</label>{ch}</div>}
const iS={width:"100%",padding:"10px 14px",background:"#faf6ef",border:`1px solid ${C.border}`,borderRadius:4,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
function Btn({children,variant="primary",size="md",icon,disabled,style:cs,...p}){const sz={sm:{padding:"4px 10px",fontSize:12},md:{padding:"8px 16px",fontSize:13},lg:{padding:"10px 22px",fontSize:14}}[size];const vr={primary:{background:C.accent,color:"#fff",border:"none"},blue:{background:C.blue,color:"#fff",border:"none"},secondary:{background:C.surfaceWarm,color:C.text,border:`1px solid ${C.border}`},danger:{background:C.red,color:"#fff",border:"none"},ghost:{background:"transparent",color:C.textSec,border:`1px solid ${C.border}`},success:{background:C.green,color:"#fff",border:"none"}}[variant];return <button disabled={disabled} {...p} style={{...sz,...vr,borderRadius:4,cursor:disabled?"not-allowed":"pointer",fontWeight:500,display:"inline-flex",alignItems:"center",gap:5,fontFamily:"'DM Mono',monospace",transition:"all .15s",opacity:disabled?.4:1,...(cs||{})}}>{icon&&<span style={{display:"flex"}}>{icon}</span>}{children}</button>}
function RoleBadge({role}){const m={Admin:{bg:C.accentLight,c:C.accentDark},"Sales Rep":{bg:C.greenBg,c:C.green}};const c=m[role]||m["Sales Rep"];return <span style={{padding:"2px 10px",borderRadius:2,fontSize:11,fontWeight:500,background:c.bg,color:c.c,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:".05em"}}>{role}</span>}
function TypeIcon({type}){const m={password:{i:ic.lock,bg:C.redBg,c:C.red},link:{i:ic.ext,bg:C.blueBg,c:C.blue},file:{i:ic.file,bg:C.amberBg,c:C.amber}};const c=m[type]||m.link;return <div style={{width:36,height:36,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:c.bg,color:c.c,flexShrink:0}}><Ic d={c.i} size={15} sw={2}/></div>}
function GoogleIcon(){return <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}

// CSV
function parseCSV(t){const ls=t.split("\n").map(l=>l.trim()).filter(Boolean);if(ls.length<2)return[];const h=ls[0].split(",").map(x=>x.replace(/^"|"$/g,"").trim().toLowerCase());return ls.slice(1).map(l=>{const v=[];let c="",q=false;for(let i=0;i<l.length;i++){if(l[i]==='"')q=!q;else if(l[i]===','&&!q){v.push(c.trim());c=""}else c+=l[i]}v.push(c.trim());const o={};h.forEach((x,i)=>{o[x]=(v[i]||"").replace(/^"|"$/g,"")});return o})}
function csvToRes(rows,email,cats){return rows.filter(r=>r.name).map(r=>{let type="link";const cat=(r.category||"").trim();const rt=(r.type||"").trim().toLowerCase();if(cat.toLowerCase()==="passwords"||rt==="password"||rt==="pwd")type="password";else if(rt==="file"||rt==="document"||rt==="pdf")type="file";else if(rt==="link"||rt==="url")type="link";else{const v=(r.value||r.url||"").trim();if(v.startsWith("http"))type="link";else if(v.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv|zip)$/i))type="file";else if(cat.toLowerCase().includes("password"))type="password"}return{category:cats.includes(cat)?cat:"Quick Links",name:r.name,type,value:r.value||r.url||r.password||"",description:r.description||"",addedBy:email,addedAt:new Date().toISOString()}})}
function csvToUsers(rows){return rows.filter(r=>r.email&&r.name).map(r=>({email:r.email.trim().toLowerCase(),name:r.name.trim(),role:["Admin","Sales Rep"].includes(r.role)?r.role:"Sales Rep"}))}

// Login Screen
function LoginScreen({setToast}){
  const [loading,setLoading]=useState(false);
  const doLogin=async()=>{
    setLoading(true);
    try{
      const result=await signInWithPopup(auth,googleProvider);
      if(!result.user.email.endsWith("@itgeeks.com")){
        await signOut(auth);
        setToast({message:"Access restricted to @itgeeks.com",type:"error"});
      }
    }catch(err){
      console.error("Login error:",err);
      if(err.code!=="auth/popup-closed-by-user")setToast({message:"Login failed",type:"error"});
    }
    setLoading(false);
  };
  return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:460,position:"relative"}}>
      <div style={{position:"absolute",top:-8,left:20,right:20,height:40,background:"#d4cbb8",borderRadius:"6px 6px 0 0",transform:"translateY(-100%)"}}/>
      <div style={{position:"absolute",top:-4,left:10,right:10,height:40,background:"#dfd7c6",borderRadius:"6px 6px 0 0",transform:"translateY(-100%)"}}/>
      <div className="card" style={{padding:"40px 44px"}}>
        <div style={{position:"absolute",top:20,right:24}}><span className="stamp">Confidential</span></div>
        <div style={{position:"absolute",top:-12,left:60,color:C.textMuted,opacity:.4,transform:"rotate(15deg)"}}><Ic d={ic.clip} size={32} sw={1.2}/></div>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-block",padding:"6px 16px",border:`1.5px solid ${C.border}`,borderRadius:30,marginBottom:14}}><span style={{fontFamily:"'Libre Baskerville',serif",fontSize:14,fontWeight:700}}>ITG</span></div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.textMuted,textTransform:"uppercase",letterSpacing:".1em"}}>ITGeeks Resource Hub</div>
        </div>
        <h1 style={{fontFamily:"'Libre Baskerville',serif",fontSize:26,fontWeight:700,marginBottom:8,textAlign:"center"}}>"RESOURCE HUB"</h1>
        <p style={{textAlign:"center",fontSize:13,color:C.textMuted,marginBottom:28,fontFamily:"'DM Mono',monospace"}}>@itgeeks.com access only</p>
        <button onClick={doLogin} disabled={loading} style={{width:"100%",padding:"14px 20px",background:"#faf6ef",border:`1.5px solid ${C.border}`,borderRadius:4,cursor:loading?"wait":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12,fontSize:14,fontWeight:500,color:C.text,fontFamily:"inherit",boxShadow:C.shadow,opacity:loading?.7:1}}>
          {loading?<div className="spinner"/>:<><GoogleIcon/> Sign in with Google</>}
        </button>
        <div style={{marginTop:24,borderTop:`1px solid ${C.border}`,paddingTop:14,textAlign:"center"}}><p style={{fontSize:11,color:C.textMuted,lineHeight:1.7,fontFamily:"'DM Mono',monospace"}}>New users auto-assigned Sales Rep.<br/>Contact Admin for role changes.</p></div>
      </div>
    </div>
  </div>;
}

// ═══════════════════
// MAIN APP
// ═══════════════════
export default function App(){
  const [authUser,setAuthUser]=useState(undefined);
  const [user,setUser]=useState(null);
  const [users,setUsers]=useState([]);
  const [res,setRes]=useState([]);
  const [logs,setLogs]=useState([]);
  const [cats,setCats]=useState(DEF_CATS);
  const [toast,setToast]=useState(null);
  const [tab,setTab]=useState("home");
  const [search,setSearch]=useState("");
  const [activeCat,setActiveCat]=useState(null);
  const [showAddRes,setShowAddRes]=useState(false);
  const [showEditRes,setShowEditRes]=useState(null);
  const [showDel,setShowDel]=useState(null);
  const [showAddUser,setShowAddUser]=useState(false);
  const [showFlush,setShowFlush]=useState(false);
  const [showAccess,setShowAccess]=useState(null);
  const [logFilter,setLogFilter]=useState("All");
  const [newCat,setNewCat]=useState("");
  const [copyAnimId,setCopyAnimId]=useState(null);
  const [dataLoaded,setDataLoaded]=useState(false);
  const impRef=useRef(null);const userImpRef=useRef(null);

  // Firebase auth listener
  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async(fbUser)=>{
      if(fbUser&&fbUser.email?.endsWith("@itgeeks.com")){
        setAuthUser(fbUser);
        const userSnap=await getDoc(doc(db,"users",fbUser.email));
        if(userSnap.exists()){
          setUser({id:fbUser.email,...userSnap.data()});
        }else{
          const newUser={email:fbUser.email,name:fbUser.displayName||fbUser.email.split("@")[0],role:"Sales Rep",createdAt:new Date().toISOString()};
          await setDoc(doc(db,"users",fbUser.email),newUser);
          setUser({id:fbUser.email,...newUser});
        }
        await fsAddDoc("logs",{user:fbUser.email,action:"Login",detail:`${fbUser.displayName||fbUser.email} signed in`,timestamp:new Date().toISOString()});
      }else{
        setAuthUser(null);setUser(null);
      }
    });
    return()=>unsub();
  },[]);

  // Load data
  useEffect(()=>{
    if(!user)return;
    let alive=true;
    (async()=>{
      const [u,r,cSnap]=await Promise.all([
        fsGetAll("users"),fsGetAll("resources"),
        getDoc(doc(db,"config","categories"))
      ]);
      const logQ=query(collection(db,"logs"),orderBy("timestamp","desc"),limit(200));
      const logSnap=await getDocs(logQ);
      const l=logSnap.docs.map(d=>({id:d.id,...d.data()}));
      if(!alive)return;
      setUsers(u);setRes(r);setLogs(l);
      if(cSnap.exists()&&cSnap.data().list){setCats(cSnap.data().list)}else{
        await setDoc(doc(db,"config","categories"),{list:DEF_CATS});
      }
      setDataLoaded(true);
    })();
    return()=>{alive=false};
  },[user]);

  const isAdmin=user?.role==="Admin";

  const addLog=async(action,detail)=>{
    const entry={user:user.email,action,detail,timestamp:new Date().toISOString()};
    const id=await fsAddDoc("logs",entry);
    if(id)setLogs(prev=>[{id,...entry},...prev].slice(0,200));
  };

  const handleLogout=async()=>{
    await addLog("Logout",user.name+" signed out");
    await signOut(auth);
    setUser(null);setTab("home");setDataLoaded(false);
  };

  const copyPwd=(r)=>{
    try{navigator.clipboard.writeText(r.value)}catch{const t=document.createElement("textarea");t.value=r.value;t.style.cssText="position:fixed;opacity:0";document.body.appendChild(t);t.select();document.execCommand("copy");document.body.removeChild(t)}
    setCopyAnimId(r.id);setTimeout(()=>setCopyAnimId(null),600);
    setTimeout(()=>{try{navigator.clipboard.writeText("")}catch{}},10000);
    setToast({message:"Password copied",type:"success"});addLog("Copy Password",r.name);
  };
  const accessRes=(r)=>{
    if(r.type==="password"){copyPwd(r);return}
    addLog(r.type==="link"?"Access Link":"Download",r.name);
    window.open(r.value,"_blank");
  };

  const addResource=async(d)=>{const data={...d,addedBy:user.email,addedAt:new Date().toISOString()};const id=await fsAddDoc("resources",data);if(id){setRes(prev=>[...prev,{id,...data}]);setShowAddRes(false);setToast({message:"Added",type:"success"});addLog("Add",d.name)}};
  const editResource=async(d)=>{await fsSetDoc("resources",d.id,d);setRes(prev=>prev.map(r=>r.id===d.id?{...r,...d}:r));setShowEditRes(null);setToast({message:"Updated",type:"success"});addLog("Edit",d.name)};
  const deleteResource=async(id)=>{const it=res.find(r=>r.id===id);await fsDelDoc("resources",id);setRes(prev=>prev.filter(r=>r.id!==id));setShowDel(null);setToast({message:"Deleted",type:"success"});addLog("Delete",it?.name)};

  const addUser=async(d)=>{
    if(!d.email.endsWith("@itgeeks.com")){setToast({message:"@itgeeks.com only",type:"error"});return}
    const exists=await getDoc(doc(db,"users",d.email));
    if(exists.exists()){setToast({message:"User exists",type:"error"});return}
    await setDoc(doc(db,"users",d.email),{email:d.email,name:d.name,role:d.role,createdAt:new Date().toISOString()});
    setUsers(prev=>[...prev,{id:d.email,...d}]);setShowAddUser(false);setToast({message:"Added",type:"success"});addLog("Add User",d.name);
  };
  const deleteUser=async(id)=>{
    if(id===user.email){setToast({message:"Can't remove yourself",type:"error"});return}
    const usr=users.find(u=>u.id===id);await fsDelDoc("users",id);
    setUsers(prev=>prev.filter(u=>u.id!==id));setToast({message:"Removed",type:"success"});addLog("Remove",usr?.name);
  };
  const saveAccess=async(uid,access)=>{
    await fsSetDoc("users",uid,{access});
    setUsers(prev=>prev.map(u=>u.id===uid?{...u,access}:u));
    if(uid===user.email||uid===user.id)setUser(prev=>({...prev,access}));
    addLog("Access Update",`Updated access for ${uid}`);
    setToast({message:"Access updated",type:"success"});
  };
  const handleUserImport=async(e)=>{
    const f=e.target.files[0];if(!f)return;
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      try{
        const rows=parseCSV(ev.target.result);const nu=csvToUsers(rows);
        const existingEmails=new Set(users.map(u=>u.email||u.id));
        const valid=nu.filter(u=>u.email.endsWith("@itgeeks.com")&&!existingEmails.has(u.email));
        const batch=writeBatch(db);
        valid.forEach(u=>{batch.set(doc(db,"users",u.email),{...u,createdAt:new Date().toISOString()})});
        await batch.commit();
        setUsers(prev=>[...prev,...valid.map(u=>({id:u.email,...u}))]);
        setToast({message:`${valid.length} added, ${nu.length-valid.length} skipped`,type:valid.length?"success":"error"});
        if(valid.length)addLog("Bulk Import",`${valid.length} users`);
      }catch{setToast({message:"Parse error",type:"error"})}
    };reader.readAsText(f);
    if(userImpRef.current)userImpRef.current.value="";
  };

  const expJSON=()=>{const b=new Blob([JSON.stringify({resources:res.map(({id,...r})=>r),categories:cats,exportDate:new Date().toISOString()},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`itgeeks_${new Date().toISOString().slice(0,10)}.json`;a.click();addLog("Export","JSON");setToast({message:"Exported",type:"success"})};
  const expCSV=()=>{const h=["category","name","type","value","description"];const rows=res.map(r=>h.map(k=>`"${String(r[k]||"").replace(/"/g,'""')}"`).join(","));const b=new Blob([h.join(",")+"\n"+rows.join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`itgeeks_${new Date().toISOString().slice(0,10)}.csv`;a.click();addLog("Export","CSV");setToast({message:"Exported",type:"success"})};
  const handleImport=async(e)=>{
    const f=e.target.files[0];if(!f)return;
    const ext=f.name.split(".").pop().toLowerCase();const reader=new FileReader();
    if(ext==="json"){reader.onload=async(ev)=>{try{const d=JSON.parse(ev.target.result);if(d.resources){const batch=writeBatch(db);const newRes=[];d.resources.forEach(r=>{const ref=doc(collection(db,"resources"));batch.set(ref,r);newRes.push({id:ref.id,...r})});await batch.commit();setRes(prev=>[...prev,...newRes]);if(d.categories){const merged=[...new Set([...cats,...d.categories])].sort();setCats(merged);await setDoc(doc(db,"config","categories"),{list:merged})}addLog("Import",`${newRes.length} resources`);setToast({message:`${newRes.length} imported`,type:"success"})}}catch{setToast({message:"Parse error",type:"error"})}};reader.readAsText(f)}
    else if(ext==="csv"){reader.onload=async(ev)=>{try{const nw=csvToRes(parseCSV(ev.target.result),user.email,cats);if(!nw.length){setToast({message:"No valid rows",type:"error"});return}const batch=writeBatch(db);const newRes=[];nw.forEach(r=>{const ref=doc(collection(db,"resources"));batch.set(ref,r);newRes.push({id:ref.id,...r})});await batch.commit();setRes(prev=>[...prev,...newRes]);addLog("Import",`${newRes.length} from CSV`);setToast({message:`${newRes.length} imported`,type:"success"})}catch{setToast({message:"Parse error",type:"error"})}};reader.readAsText(f)}
    else setToast({message:"JSON or CSV only",type:"error"});
    if(impRef.current)impRef.current.value="";
  };
  const flushAll=async()=>{
    const resBatch=writeBatch(db);res.forEach(r=>resBatch.delete(doc(db,"resources",r.id)));await resBatch.commit();
    const logSnap=await getDocs(collection(db,"logs"));const logBatch=writeBatch(db);logSnap.docs.forEach(d=>logBatch.delete(d.ref));await logBatch.commit();
    await setDoc(doc(db,"config","categories"),{list:DEF_CATS});
    setRes([]);setLogs([]);setCats(DEF_CATS);setShowFlush(false);setToast({message:"All data flushed",type:"success"});
  };
  const addCategory=async()=>{const n=newCat.trim();if(!n||cats.includes(n))return;const upd=[...cats,n].sort();setCats(upd);setNewCat("");await setDoc(doc(db,"config","categories"),{list:upd});setToast({message:`"${n}" added`,type:"success"});addLog("Add Category",n)};
  const removeCategory=async(c)=>{const upd=cats.filter(x=>x!==c);setCats(upd);await setDoc(doc(db,"config","categories"),{list:upd});setToast({message:"Removed",type:"success"})};

  const fLogs=(logFilter==="All"?logs:logs.filter(l=>l.action===logFilter)).slice(0,100);

  // Loading
  if(authUser===undefined)return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div className="spinner"/></div>;
  if(!authUser||!user)return <><LoginScreen setToast={setToast}/>{toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}</>;
  if(!dataLoaded)return <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}><div className="spinner"/><p style={{color:C.textMuted,fontSize:13,fontFamily:"'DM Mono',monospace"}}>Loading resources...</p></div>;

  // Access control filtering (runs AFTER user is confirmed)
  const visibleRes=isAdmin?res:(()=>{const a=user.access||{};return res.filter(r=>!(a.hiddenCategories||[]).includes(r.category)&&!(a.hiddenResources||[]).includes(r.id))})();
  const visibleCats=isAdmin?cats:cats.filter(c=>!((user.access||{}).hiddenCategories||[]).includes(c));
  const filtered=visibleRes.filter(r=>(activeCat?r.category===activeCat:true)&&(!search||r.name?.toLowerCase().includes(search.toLowerCase())||r.description?.toLowerCase().includes(search.toLowerCase())));
  const catItems=activeCat?filtered:[];
  const grouped=activeCat?{}:filtered.reduce((a,r)=>{(a[r.category]=a[r.category]||[]).push(r);return a},{});

  const nav=[{id:"home",l:"Home",i:ic.home},{id:"resources",l:"Files",i:ic.cat},...(isAdmin?[{id:"users",l:"Users",i:ic.users},{id:"logs",l:"Logs",i:ic.log},{id:"ie",l:"Export",i:ic.dl},{id:"settings",l:"Config",i:ic.gear}]:[])];

  return <>
  <div style={{display:"flex",minHeight:"100vh",background:C.bg,color:C.text}}>
    <aside style={{width:78,background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:18,flexShrink:0}}>
      <div style={{padding:"5px 12px",border:`1.5px solid ${C.border}`,borderRadius:20,marginBottom:24}}><span style={{fontFamily:"'Libre Baskerville',serif",fontSize:12,fontWeight:700}}>ITG</span></div>
      <nav style={{flex:1,display:"flex",flexDirection:"column",gap:2,width:"100%"}}>{nav.map(n=><div key={n.id} className="nv" onClick={()=>{setTab(n.id);if(n.id==="resources")setActiveCat(null)}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 4px",cursor:"pointer",borderRadius:4,margin:"0 6px",color:tab===n.id?C.accentDark:C.textMuted,background:tab===n.id?C.accentLight:"transparent"}}><Ic d={n.i} size={18}/><span style={{fontSize:9,fontWeight:500,fontFamily:"'DM Mono',monospace",textTransform:"uppercase"}}>{n.l}</span></div>)}</nav>
      <div style={{paddingBottom:14}}><div className="nv" onClick={handleLogout} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 4px",cursor:"pointer",borderRadius:4,margin:"0 6px",color:C.red}}><Ic d={ic.out} size={18}/><span style={{fontSize:9,fontFamily:"'DM Mono',monospace"}}>EXIT</span></div></div>
    </aside>
    <main style={{flex:1,overflow:"auto",padding:"20px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <span className="stamp">Confidential</span>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:C.surface,borderRadius:4,border:`1px solid ${C.borderLight}`}}>
          {authUser.photoURL&&<img src={authUser.photoURL} style={{width:28,height:28,borderRadius:4}} referrerPolicy="no-referrer"/>}
          {!authUser.photoURL&&<div style={{width:28,height:28,borderRadius:4,background:C.accentLight,color:C.accentDark,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,fontFamily:"'Libre Baskerville',serif"}}>{user.name?.charAt(0)}</div>}
          <div><div style={{fontSize:12,fontWeight:600}}>{user.name}</div><div style={{fontSize:10,color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>{user.email}</div></div>
          <RoleBadge role={user.role}/>
        </div>
      </div>

      {/* HOME */}
      {tab==="home"&&<div style={{animation:"fadeUp .25s ease"}}>
        <h2 style={{fontFamily:"'Libre Baskerville',serif",fontSize:22,fontWeight:700,margin:"0 0 4px"}}>Welcome, {user.name?.split(" ")[0]}</h2>
        <p style={{color:C.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace",margin:"0 0 20px"}}>DASHBOARD OVERVIEW</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))",gap:12,marginBottom:24}}>
          {[{l:"Total",v:visibleRes.length,c:C.blue},...(isAdmin?[{l:"Passwords",v:visibleRes.filter(r=>r.type==="password").length,c:C.red}]:[]),{l:"Links",v:visibleRes.filter(r=>r.type==="link").length,c:C.green},{l:"Files",v:visibleRes.filter(r=>r.type==="file").length,c:C.amber}].map(s=><div key={s.l} className="card" style={{padding:"16px 18px"}}><div style={{fontSize:10,color:C.textMuted,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>{s.l}</div><div style={{fontSize:28,fontWeight:700,color:s.c,fontFamily:"'Libre Baskerville',serif"}}>{s.v}</div></div>)}
        </div>
        <div className="card" style={{padding:"16px 18px"}}><h3 style={{fontSize:13,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:".05em",margin:"0 0 12px"}}>Recent Files</h3>
          {visibleRes.length===0?<p style={{color:C.textMuted,fontSize:13,padding:"20px 0",textAlign:"center"}}>No resources yet.{isAdmin?" Add from Files section.":" Admin will add resources soon."}</p>:
          visibleRes.slice(-5).reverse().map(r=><div key={r.id} className="rh" onClick={()=>accessRes(r)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 10px",borderRadius:4,cursor:"pointer",marginBottom:2}}><div style={{display:"flex",alignItems:"center",gap:10}}><TypeIcon type={r.type}/><div><div style={{fontSize:13,fontWeight:500}}>{r.name}</div><div style={{fontSize:11,color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>{r.category}</div></div></div></div>)}
        </div>
      </div>}

      {/* FOLDER GRID */}
      {tab==="resources"&&!activeCat&&<div style={{animation:"fadeUp .25s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div><h2 style={{fontFamily:"'Libre Baskerville',serif",fontSize:22,fontWeight:700}}>Folders</h2><p style={{color:C.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace",margin:"3px 0 0"}}>{(isAdmin?cats:visibleCats).length} CATEGORIES</p></div>
          {isAdmin&&<Btn icon={<Ic d={ic.plus} size={14} sw={2.2}/>} onClick={()=>setShowAddRes(true)}>ADD</Btn>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))",gap:16}}>
          {(isAdmin?cats:visibleCats).map(cat=>{const items=visibleRes.filter(r=>r.category===cat);const color=catColors[cat]||C.accent;const bg=catBgs[cat]||C.accentLight;return <div key={cat} className="card folder-card" onClick={()=>setActiveCat(cat)} style={{padding:"20px 22px"}}><div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}><div style={{width:44,height:44,borderRadius:10,background:bg,color,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={catIcons[cat]||ic.file} size={22} sw={1.5}/></div><span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.textMuted,padding:"2px 8px",background:C.surfaceWarm,borderRadius:10}}>{items.length}</span></div><h3 style={{fontSize:15,fontWeight:600,marginBottom:4}}>{cat}</h3><p style={{fontSize:12,color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>{items.length} item{items.length!==1?"s":""}</p></div>})}
        </div>
      </div>}

      {/* CATEGORY DRILL-DOWN */}
      {tab==="resources"&&activeCat&&<div style={{animation:"fadeUp .25s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>{setActiveCat(null);setSearch("")}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:4,padding:"6px 8px",cursor:"pointer",display:"flex",color:C.textSec}}><Ic d={ic.back} size={16} sw={2}/></button>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:32,height:32,borderRadius:8,background:catBgs[activeCat]||C.accentLight,color:catColors[activeCat]||C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={catIcons[activeCat]||ic.file} size={16} sw={1.5}/></div>
              <div><h2 style={{fontFamily:"'Libre Baskerville',serif",fontSize:20,fontWeight:700,margin:0}}>{activeCat}</h2><p style={{color:C.textMuted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>{catItems.length} ITEMS</p></div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{position:"relative"}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.textMuted,display:"flex"}}><Ic d={ic.search} size={14} sw={2}/></span><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...iS,paddingLeft:32,width:180}}/></div>
            {isAdmin&&<Btn icon={<Ic d={ic.plus} size={14} sw={2.2}/>} onClick={()=>setShowAddRes(true)}>ADD</Btn>}
          </div>
        </div>
        <div className="card" style={{padding:0}}>
          {catItems.length===0?<div style={{padding:40,textAlign:"center",color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>NO ITEMS</div>:
          catItems.map((r,i)=><div key={r.id} className="rh" style={{display:"flex",alignItems:"center",padding:"13px 18px",borderBottom:i<catItems.length-1?`1px solid ${C.borderLight}`:"none",gap:14}}>
            <TypeIcon type={r.type}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:1}}>{r.name}</div>
              <div style={{fontSize:12,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.description||"—"}</div>
              {r.type==="password"&&<div className={copyAnimId===r.id?"dot-anim":""} style={{fontSize:13,color:C.textMuted,marginTop:2,letterSpacing:3,userSelect:"none",fontFamily:"'DM Mono',monospace",display:"flex",alignItems:"center",gap:8}}>
                {copyAnimId===r.id?<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" style={{strokeDasharray:20,animation:"checkDraw .3s ease forwards"}}/></svg><span style={{color:C.green,fontSize:11,fontWeight:600}}>COPIED</span></>:"●●●●●●●●●●"}
              </div>}
            </div>
            <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
              {r.type==="password"&&<Btn variant="ghost" size="sm" icon={<Ic d={copyAnimId===r.id?ic.check:ic.copy} size={12} sw={2}/>} onClick={()=>copyPwd(r)} className={copyAnimId===r.id?"copy-anim":""}>{copyAnimId===r.id?"DONE":"COPY"}</Btn>}
              {r.type!=="password"&&<Btn variant="ghost" size="sm" icon={<Ic d={ic.ext} size={12} sw={2}/>} onClick={()=>accessRes(r)}>OPEN</Btn>}
              {isAdmin&&<><Btn variant="ghost" size="sm" icon={<Ic d={ic.edit} size={12} sw={2}/>} onClick={()=>setShowEditRes(r)} style={{color:C.textMuted}}/><Btn variant="ghost" size="sm" icon={<Ic d={ic.trash} size={12} sw={2}/>} onClick={()=>setShowDel(r.id)} style={{color:C.red}}/></>}
            </div>
          </div>)}
        </div>
      </div>}

      {/* USERS */}
      {tab==="users"&&isAdmin&&<div style={{animation:"fadeUp .25s ease"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}><h2 style={{fontFamily:"'Libre Baskerville',serif",fontSize:22,fontWeight:700}}>Personnel</h2><div style={{display:"flex",gap:8}}><input ref={userImpRef} type="file" accept=".csv" onChange={handleUserImport} style={{display:"none"}}/><Btn variant="secondary" icon={<Ic d={ic.ul} size={14} sw={2}/>} onClick={()=>userImpRef.current?.click()}>BULK CSV</Btn><Btn icon={<Ic d={ic.plus} size={14} sw={2.2}/>} onClick={()=>setShowAddUser(true)}>ADD</Btn></div></div>
        <div className="card" style={{overflow:"visible"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{borderBottom:`2px solid ${C.border}`}}>{["Name","Email","Role","Access",""].map(h=><th key={h} style={{textAlign:"left",padding:"10px 16px",fontSize:10,fontWeight:500,color:C.textMuted,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:".08em"}}>{h}</th>)}</tr></thead><tbody>{users.map(u=>{const hc=(u.access?.hiddenCategories||[]).length;const hr=(u.access?.hiddenResources||[]).length;const full=!hc&&!hr;return <tr key={u.id} className="rh" style={{borderBottom:`1px solid ${C.borderLight}`}}><td style={{padding:"10px 16px",fontWeight:500}}>{u.name}</td><td style={{padding:"10px 16px",color:C.textSec,fontFamily:"'DM Mono',monospace",fontSize:12}}>{u.email||u.id}</td><td style={{padding:"10px 16px"}}><RoleBadge role={u.role}/></td><td style={{padding:"10px 16px"}}>{u.role==="Admin"?<span style={{fontSize:10,color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>FULL</span>:<Btn variant={full?"ghost":"secondary"} size="sm" onClick={()=>setShowAccess(u)} style={full?{}:{background:C.amberBg,borderColor:C.amber+"40",color:C.amber}}>{full?"FULL ACCESS":`${hc+hr} HIDDEN`}</Btn>}</td><td style={{padding:"10px 16px"}}>{(u.email||u.id)!==user.email?<Btn variant="ghost" size="sm" onClick={()=>deleteUser(u.id)} style={{color:C.red}}>REMOVE</Btn>:<span style={{fontSize:10,color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>YOU</span>}</td></tr>})}</tbody></table></div>
        <div className="card" style={{marginTop:14,padding:16}}><p style={{fontSize:12,color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>CSV: name, email, role — no password (SSO). Duplicates skipped.</p></div>
      </div>}

      {/* LOGS */}
      {tab==="logs"&&isAdmin&&<div style={{animation:"fadeUp .25s ease"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}><h2 style={{fontFamily:"'Libre Baskerville',serif",fontSize:22,fontWeight:700}}>Activity Log</h2><div style={{display:"flex",gap:8}}><select value={logFilter} onChange={e=>setLogFilter(e.target.value)} style={{...iS,width:"auto"}}><option value="All">All</option>{[...new Set(logs.map(l=>l.action))].map(a=><option key={a} value={a}>{a}</option>)}</select></div></div>
        <div className="card" style={{overflow:"visible"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,tableLayout:"fixed"}}><colgroup><col style={{width:"22%"}}/><col style={{width:"24%"}}/><col style={{width:"16%"}}/><col style={{width:"38%"}}/></colgroup><thead><tr style={{borderBottom:`2px solid ${C.border}`}}>{["When","Who","Action","Detail"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 16px",fontSize:10,color:C.textMuted,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:".08em"}}>{h}</th>)}</tr></thead><tbody>{fLogs.length===0?<tr><td colSpan={4} style={{padding:30,textAlign:"center",color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>EMPTY</td></tr>:fLogs.map(l=>{const ac=l.action?.includes("Delete")||l.action?.includes("Remove")?C.red:l.action?.includes("Login")||l.action?.includes("Logout")?C.amber:l.action?.includes("Copy")?C.purple:C.blue;return <tr key={l.id} className="rh" style={{borderBottom:`1px solid ${C.borderLight}`}}><td style={{padding:"9px 16px",color:C.textMuted,fontFamily:"'DM Mono',monospace",fontSize:11}}>{fdt(l.timestamp)}</td><td style={{padding:"9px 16px",color:C.textSec,fontFamily:"'DM Mono',monospace",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.user}</td><td style={{padding:"9px 16px"}}><span style={{padding:"2px 8px",borderRadius:2,fontSize:10,fontWeight:600,background:`${ac}18`,color:ac,fontFamily:"'DM Mono',monospace"}}>{l.action}</span></td><td style={{padding:"9px 16px",color:C.textSec,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.detail}</td></tr>})}</tbody></table></div>
      </div>}

      {/* IMPORT/EXPORT */}
      {tab==="ie"&&isAdmin&&<div style={{animation:"fadeUp .25s ease"}}><h2 style={{fontFamily:"'Libre Baskerville',serif",fontSize:22,fontWeight:700,margin:"0 0 20px"}}>Import & Export</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))",gap:12,marginBottom:20}}>{[{t:"JSON",d:"Full backup",c:C.blue,bg:C.blueBg,fn:expJSON,v:"blue"},{t:"CSV",d:"For Sheets",c:C.green,bg:C.greenBg,fn:expCSV,v:"success"},{t:"Import",d:"JSON or CSV",c:C.amber,bg:C.amberBg,fn:()=>impRef.current?.click(),v:"secondary"}].map(x=><div key={x.t} className="card" style={{padding:18}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:32,height:32,borderRadius:6,background:x.bg,color:x.c,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={ic.dl}/></div><h3 style={{fontSize:13,fontWeight:600}}>{x.t}</h3></div><p style={{fontSize:12,color:C.textMuted,marginBottom:10}}>{x.d}</p><Btn variant={x.v} onClick={x.fn}>{x.t==="Import"?"UPLOAD":"DOWNLOAD"}</Btn></div>)}</div>
        <input ref={impRef} type="file" accept=".json,.csv" onChange={handleImport} style={{display:"none"}}/>
        <div className="card" style={{padding:18,borderColor:`${C.red}40`}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:32,height:32,borderRadius:6,background:C.redBg,color:C.red,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={ic.trash} size={14} sw={2}/></div><h3 style={{fontSize:13,fontWeight:600,color:C.red}}>Flush All</h3></div><p style={{fontSize:12,color:C.textSec,marginBottom:10}}>Delete everything permanently.</p><Btn variant="danger" onClick={()=>setShowFlush(true)}>FLUSH</Btn></div>
      </div>}

      {/* SETTINGS */}
      {tab==="settings"&&isAdmin&&<div style={{animation:"fadeUp .25s ease"}}><h2 style={{fontFamily:"'Libre Baskerville',serif",fontSize:22,fontWeight:700,margin:"0 0 20px"}}>Configuration</h2>
        <div className="card" style={{padding:20,marginBottom:16}}><h3 style={{fontSize:14,fontWeight:600,margin:"0 0 12px"}}>Categories</h3><div style={{display:"flex",gap:8,marginBottom:16}}><input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCategory()} placeholder="New category..." style={{...iS,flex:1}}/><Btn onClick={addCategory} disabled={!newCat.trim()}>ADD</Btn></div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{cats.map(c=>{const n=res.filter(r=>r.category===c).length;return <div key={c} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",background:C.surfaceWarm,borderRadius:4,border:`1px solid ${C.border}`,fontSize:12,fontWeight:500}}><div style={{width:16,height:16,borderRadius:4,background:catBgs[c]||C.accentLight,color:catColors[c]||C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={catIcons[c]||ic.file} size={10} sw={1.5}/></div>{c}<span style={{fontSize:10,color:C.textMuted}}>({n})</span>{n===0&&<button onClick={()=>removeCategory(c)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",display:"flex"}}><Ic d={ic.x} size={12} sw={2}/></button>}</div>})}</div>
        </div>
        <div className="card" style={{padding:20,marginBottom:16}}><h3 style={{fontSize:14,fontWeight:600,margin:"0 0 8px"}}>Database</h3><p style={{fontSize:12,color:C.textMuted,lineHeight:1.6}}>Firebase Firestore connected. All data shared in real-time.</p><div style={{marginTop:10,padding:"6px 12px",background:C.greenBg,borderRadius:2,fontSize:11,fontWeight:500,color:C.green,fontFamily:"'DM Mono',monospace",display:"inline-block"}}>FIREBASE CONNECTED</div></div>
        <div className="card" style={{padding:20}}><h3 style={{fontSize:14,fontWeight:600,margin:"0 0 8px"}}>Authentication</h3><p style={{fontSize:12,color:C.textMuted}}>Google SSO via Firebase Auth. @itgeeks.com only.</p><div style={{marginTop:10,padding:"6px 12px",background:C.greenBg,borderRadius:2,fontSize:11,fontWeight:500,color:C.green,fontFamily:"'DM Mono',monospace",display:"inline-block"}}>SSO ACTIVE</div></div>
      </div>}
    </main>
  </div>

  {showAddRes&&<ResModal t="Add Resource" cats={cats} defCat={activeCat} onClose={()=>setShowAddRes(false)} onSave={addResource}/>}
  {showEditRes&&<ResModal t="Edit" cats={cats} r={showEditRes} onClose={()=>setShowEditRes(null)} onSave={editResource}/>}
  {showDel&&<Modal title="Delete" onClose={()=>setShowDel(null)} width={400}><p style={{fontSize:13,color:C.textSec,marginBottom:18}}>Permanently delete?</p><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={()=>setShowDel(null)}>CANCEL</Btn><Btn variant="danger" onClick={()=>deleteResource(showDel)}>DELETE</Btn></div></Modal>}
  {showFlush&&<Modal title="Flush All" onClose={()=>setShowFlush(false)} width={440}><div style={{padding:14,background:C.redBg,borderRadius:4,marginBottom:18}}><p style={{margin:0,fontSize:13,color:C.red,fontWeight:500}}>Deletes everything:</p><ul style={{margin:"8px 0 0 18px",fontSize:13,color:C.textSec,lineHeight:1.8}}><li>All resources</li><li>All logs</li><li>Reset categories</li></ul></div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={()=>setShowFlush(false)}>CANCEL</Btn><Btn variant="danger" onClick={flushAll}>FLUSH</Btn></div></Modal>}
  {showAddUser&&<UserModal onClose={()=>setShowAddUser(false)} onSave={addUser}/>}
  {showAccess&&<AccessModal user={showAccess} cats={cats} resources={res} onClose={()=>setShowAccess(null)} onSave={(access)=>{saveAccess(showAccess.id,access);setShowAccess(null)}}/>}
  {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
  </>;
}

function ResModal({t,r:resource,cats,defCat,onClose,onSave}){
  const [name,setName]=useState(resource?.name||"");const [cat,setCat]=useState(resource?.category||defCat||cats[0]||"");const [type,setType]=useState(resource?.type||"link");const [val,setVal]=useState(resource?.value||"");const [desc,setDesc]=useState(resource?.description||"");
  return <Modal title={t} onClose={onClose}>
    <FF label="Name" ch={<input value={name} onChange={e=>setName(e.target.value)} placeholder="Resource name" style={iS}/>}/>
    <FF label="Category" ch={<select value={cat} onChange={e=>setCat(e.target.value)} style={{...iS,cursor:"pointer"}}>{cats.map(c=><option key={c} value={c}>{c}</option>)}</select>}/>
    <FF label="Type" ch={<select value={type} onChange={e=>setType(e.target.value)} style={{...iS,cursor:"pointer"}}><option value="link">Link</option><option value="password">Password</option><option value="file">File</option></select>}/>
    <FF label={type==="password"?"Password":type==="link"?"URL":"Filename"} ch={<input value={val} onChange={e=>setVal(e.target.value)} style={iS}/>}/>
    <FF label="Description" ch={<input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Brief note" style={iS}/>}/>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={onClose}>CANCEL</Btn><Btn onClick={()=>{if(!name.trim()||!val.trim())return;onSave({...(resource?{id:resource.id}:{}),name:name.trim(),category:cat,type,value:val.trim(),description:desc.trim()})}} disabled={!name.trim()||!val.trim()}>SAVE</Btn></div>
  </Modal>;
}
function UserModal({onClose,onSave}){
  const [name,setName]=useState("");const [email,setEmail]=useState("");const [role,setRole]=useState("Sales Rep");
  return <Modal title="Add User" onClose={onClose}>
    <FF label="Name" ch={<input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={iS}/>}/>
    <FF label="Email" ch={<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@itgeeks.com" style={iS}/>}/>
    <FF label="Role" ch={<select value={role} onChange={e=>setRole(e.target.value)} style={{...iS,cursor:"pointer"}}><option value="Admin">Admin</option><option value="Sales Rep">Sales Rep</option></select>}/>
    <p style={{fontSize:11,color:C.textMuted,fontFamily:"'DM Mono',monospace",marginBottom:12}}>SSO — no password needed.</p>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={onClose}>CANCEL</Btn><Btn onClick={()=>{if(!name.trim()||!email.trim())return;onSave({name:name.trim(),email:email.trim().toLowerCase(),role})}} disabled={!name.trim()||!email.trim()}>ADD</Btn></div>
  </Modal>;
}
function AccessModal({user:targetUser,cats,resources,onClose,onSave}){
  const [hiddenCats,setHiddenCats]=useState(targetUser.access?.hiddenCategories||[]);
  const [hiddenRes,setHiddenRes]=useState(targetUser.access?.hiddenResources||[]);
  const [expandedCat,setExpandedCat]=useState(null);
  const toggleCat=(cat)=>{if(hiddenCats.includes(cat)){setHiddenCats(prev=>prev.filter(c=>c!==cat));const catResIds=resources.filter(r=>r.category===cat).map(r=>r.id);setHiddenRes(prev=>prev.filter(id=>!catResIds.includes(id)))}else{setHiddenCats(prev=>[...prev,cat])}};
  const toggleRes=(id)=>{if(hiddenRes.includes(id))setHiddenRes(prev=>prev.filter(x=>x!==id));else setHiddenRes(prev=>[...prev,id])};
  return <Modal title={`Access — ${targetUser.name}`} onClose={onClose} width={600}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"10px 14px",background:C.surfaceWarm,borderRadius:4}}>
      <div style={{width:32,height:32,borderRadius:4,background:C.accentLight,color:C.accentDark,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,fontFamily:"'Libre Baskerville',serif"}}>{targetUser.name?.charAt(0)}</div>
      <div><div style={{fontSize:13,fontWeight:600}}>{targetUser.name}</div><div style={{fontSize:11,color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>{targetUser.email||targetUser.id}</div></div>
      <RoleBadge role={targetUser.role}/>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      <Btn variant="success" size="sm" onClick={()=>{setHiddenCats([]);setHiddenRes([])}}>GRANT ALL</Btn>
      <Btn variant="danger" size="sm" onClick={()=>{setHiddenCats([...cats]);setHiddenRes([])}}>HIDE ALL</Btn>
    </div>
    <p style={{fontSize:11,color:C.textMuted,fontFamily:"'DM Mono',monospace",marginBottom:12}}>CATEGORY ACCESS</p>
    <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:16}}>
      {cats.map(cat=>{const catHidden=hiddenCats.includes(cat);const catRes=resources.filter(r=>r.category===cat);const hiddenInCat=catRes.filter(r=>hiddenRes.includes(r.id)).length;const isExp=expandedCat===cat;
        return <div key={cat}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:catHidden?C.redBg:C.surface,border:`1px solid ${catHidden?C.red+"30":C.borderLight}`,borderRadius:4,cursor:"pointer"}} onClick={()=>setExpandedCat(isExp?null:cat)}>
            <input type="checkbox" checked={!catHidden} onChange={e=>{e.stopPropagation();toggleCat(cat)}} onClick={e=>e.stopPropagation()} style={{accentColor:C.green,width:16,height:16,cursor:"pointer"}}/>
            <div style={{width:24,height:24,borderRadius:4,background:catBgs[cat]||C.accentLight,color:catColors[cat]||C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={catIcons[cat]||ic.file} size={12} sw={1.5}/></div>
            <div style={{flex:1}}><span style={{fontSize:13,fontWeight:500,color:catHidden?C.red:C.text}}>{cat}</span><span style={{fontSize:11,color:C.textMuted,marginLeft:6}}>({catRes.length})</span></div>
            {!catHidden&&catRes.length>0&&<span style={{fontSize:10,color:hiddenInCat?C.amber:C.textMuted,fontFamily:"'DM Mono',monospace"}}>{hiddenInCat?`${hiddenInCat} HIDDEN`:"ALL VISIBLE"}</span>}
            {!catHidden&&catRes.length>0&&<span style={{fontSize:10,color:C.textMuted,transform:isExp?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▼</span>}
          </div>
          {isExp&&!catHidden&&catRes.length>0&&<div style={{marginLeft:20,borderLeft:`2px solid ${C.borderLight}`,paddingLeft:12,marginTop:4,marginBottom:4}}>
            {catRes.map(r=>{const rH=hiddenRes.includes(r.id);return <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:4,background:rH?C.redBg+"80":"transparent"}}>
              <input type="checkbox" checked={!rH} onChange={()=>toggleRes(r.id)} style={{accentColor:C.green,width:14,height:14,cursor:"pointer"}}/>
              <TypeIcon type={r.type}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:500,color:rH?C.red:C.text}}>{r.name}</div></div>
              <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:rH?C.red:C.green}}>{rH?"HIDDEN":"VISIBLE"}</span>
            </div>})}
          </div>}
        </div>})}
    </div>
    <div style={{padding:"10px 14px",background:C.surfaceWarm,borderRadius:4,marginBottom:16}}><p style={{fontSize:11,color:C.textMuted,fontFamily:"'DM Mono',monospace",margin:0}}>{cats.length-hiddenCats.length}/{cats.length} categories, {hiddenRes.length} resources hidden</p></div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={onClose}>CANCEL</Btn><Btn onClick={()=>onSave({hiddenCategories:hiddenCats,hiddenResources:hiddenRes})}>SAVE ACCESS</Btn></div>
  </Modal>;
}
