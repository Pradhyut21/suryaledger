import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BolnaWebCall} from '@bolna/web-call';
import {Sun, LayoutDashboard, ClipboardList, BookOpen, ArrowUpRight, ArrowRight, Mic, Play, Square, Check, CheckCheck, FileDown, ChevronRight, AlertTriangle, Radio, X, RotateCcw, Send, Phone, ShieldCheck, Quote, Search, CircleHelp, Settings2, Volume2, FileText, Clock, Zap, Leaf, CheckCircle2} from 'lucide-react';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import './styles.css';
import './readability.css';

const JOBS = [
 {id:'BLR-042',name:'Meera Residency',area:'Whitefield, Bengaluru',size:'5.0 kWp',tech:'Arjun Rao',initials:'AR',asset:'INV-204',issue:'Low generation',time:'10:40 AM'},
 {id:'BLR-018',name:'Ananya Enclave',area:'Jayanagar, Bengaluru',size:'3.2 kWp',tech:'Kavya Nair',initials:'KN',asset:'INV-118',issue:'Inverter offline',time:'11:20 AM'},
 {id:'BLR-067',name:'Greenfield House',area:'Yelahanka, Bengaluru',size:'6.0 kWp',tech:'Dev Patel',initials:'DP',asset:'INV-367',issue:'Routine service',time:'12:15 PM'}
];
const labels = {site_id:'Site reference',equipment_id:'Equipment ID',issue:'Observed issue',action:'Work performed',post_repair_test:'Post-repair observation',customer_acknowledgement:'Customer acknowledgement'};
const initialResult = {status:'needs_evidence',fields:{},missing:Object.entries(labels).map(([field,label])=>({field,label})),conflicts:[],history:[],nextQuestion:'Tell me the site ID, equipment ID, and what you observed.',readyForReview:false};
const storageKey='suryaledger-demo-v1';
function load(){try{return JSON.parse(localStorage.getItem(storageKey))||{}}catch{return {}}}
function uid(){return crypto.randomUUID()}
const stateText={needs_evidence:'Needs evidence',hold:'Review conflict',ready_for_review:'Ready for review'};

function App(){
 const [records,setRecords]=useState(load), [selected,setSelected]=useState('BLR-042'),[tab,setTab]=useState('workspace'),[text,setText]=useState(''),[busy,setBusy]=useState(false),[replaying,setReplaying]=useState(false),[listening,setListening]=useState(false),[dialog,setDialog]=useState(null),[toast,setToast]=useState(''),[health,setHealth]=useState({}),[callState,setCallState]=useState('idle'),[query,setQuery]=useState(''),[view,setView]=useState('all');
 const callRef=useRef(null),recRef=useRef(null),cancelReplay=useRef(false),recordsRef=useRef(records),transcriptRef=useRef(null),liveKeyRef=useRef(null),settleTimer=useRef(null);
 const [liveKey,setLiveKey]=useState(null);
 const job=JOBS.find(j=>j.id===selected), record=records[selected]||{turns:[],result:initialResult,approved:null}, result=record.result||initialResult, turns=record.turns||[], approved=record.approved;
 useEffect(()=>{recordsRef.current=records;try{localStorage.setItem(storageKey,JSON.stringify(records))}catch{setToast('Browser storage is full. Export your report before leaving.')}},[records]);
 useEffect(()=>{fetch('/api/health').then(r=>r.json()).then(setHealth).catch(()=>setHealth({ok:false}));return()=>{cancelReplay.current=true;recRef.current?.stop();callRef.current?.stop();clearTimeout(settleTimer.current)}},[]);
 useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(t)}},[toast]);
 useEffect(()=>{transcriptRef.current?.scrollTo({top:transcriptRef.current.scrollHeight,behavior:'smooth'})},[turns.length]);
 const update=(jobId,patch)=>setRecords(prev=>({...prev,[jobId]:{...(prev[jobId]||{turns:[],result:initialResult}),...patch}}));
 async function analyze(jobId,newTurns){
  const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({turns:newTurns,expectedSiteId:jobId})});
  if(!response.ok){let data=await response.json().catch(()=>({}));throw new Error(data.error||'The report could not be checked. Your current draft is still here.')}
  return response.json();
 }
 async function addReport(value,jobId=selected,base){
  if(!value.trim())return;
  setBusy(true);
  try{
   const current=base||recordsRef.current[jobId]?.turns||[];
   const next=[...current,{id:uid(),role:'technician',text:value.trim(),at:new Date().toISOString()}];
   const checked=await analyze(jobId,next);
   if(checked.nextQuestion&&!checked.readyForReview)next.push({id:uid(),role:'assistant',text:checked.nextQuestion,at:new Date().toISOString()});
   update(jobId,{turns:next,result:checked,approved:null});setText('');return next;
  }catch(e){setToast(e.message);throw e}finally{setBusy(false)}
 }
 async function replay(conflict=false){
  if(replaying||busy)return;
  setTab('workspace');liveKeyRef.current=null;setLiveKey(null);clearTimeout(settleTimer.current);setReplaying(true);cancelReplay.current=false;
  const jobId=selected;update(jobId,{turns:[],result:initialResult,approved:null});
  const lines=conflict?[
   `Site ${jobId}. Equipment ${job.asset}. The inverter was offline. I replaced the inverter.`,
   'The old inverter is still installed. I did not replace the inverter.',
  ]:[
   `Site ${jobId}. Equipment ${job.asset}. I observed low generation. I cleaned the panels.`,
   'The job is done. I have not tested it yet.',
   'After the repair, I tested the output at 4.2 kW.',
   'The customer confirmed the work and acknowledged the service.'
  ];
  let next=[];
  try{for(const line of lines){if(cancelReplay.current)break;next=await addReport(line,jobId,next);await new Promise(resolve=>setTimeout(resolve,950))}}catch{}finally{setReplaying(false)}
 }
 function dictate(){
  if(listening){recRef.current?.stop();return}
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){setDialog('microphone');return}
  const recognition=new Recognition();recognition.lang='en-IN';recognition.continuous=false;recognition.interimResults=true;recRef.current=recognition;
  recognition.onstart=()=>setListening(true);
  recognition.onresult=e=>setText(Array.from(e.results).map(r=>r[0].transcript).join(' '));
  recognition.onerror=e=>{setToast(`Microphone: ${e.error}. You can type your report below.`);setListening(false)};
  recognition.onend=()=>setListening(false);recognition.start();
 }
 async function startCall(){
  if(callState!=='idle'){callRef.current?.stop();return}
  if(!health.bolnaConfigured||!health.toolConfigured){setDialog('setup');return}
  try{
   setCallState('connecting');
   const routeKey=`${selected}_${uid()}`;
   liveKeyRef.current=routeKey;setLiveKey({key:routeKey,site:selected});clearTimeout(settleTimer.current);
   const call=new BolnaWebCall({sessionUrl:'/api/bolna/session',userData:{job_id:routeKey,site_id:selected}});callRef.current=call;
   call.on('call-start',()=>setCallState('active'));
   call.on('call-end',()=>{setCallState('idle');setToast('Call ended. Syncing final report updates…');settleTimer.current=setTimeout(()=>{if(liveKeyRef.current===routeKey){setLiveKey(null);liveKeyRef.current=null}},12000)});
   call.on('error',e=>{setCallState('idle');setLiveKey(null);liveKeyRef.current=null;setToast(typeof e==='string'?e:(e.message||'Voice connection failed. Check the Bolna setup guide.'))});
   await call.start();
  }catch(e){setCallState('idle');setLiveKey(null);liveKeyRef.current=null;setToast(e.message||'Could not start the voice session.')}
 }
 useEffect(()=>{
  if(!liveKey)return;
  const jobId=liveKey.site;let stopped=false;
  const interval=setInterval(async()=>{try{
   const r=await fetch(`/api/jobs/${encodeURIComponent(liveKey.key)}/report`);if(!r.ok)return;const data=await r.json();if(stopped||liveKeyRef.current!==liveKey.key||!data.turns?.length||!data.report)return;
   if(data.updatedAt!==recordsRef.current[jobId]?.liveUpdatedAt)update(jobId,{turns:data.turns,result:data.report,approved:null,liveUpdatedAt:data.updatedAt});
  }catch{}},2000);return()=>{stopped=true;clearInterval(interval)};
 },[liveKey]);
 function exportReport(){
  const payload={product:'SuryaLedger',schemaVersion:1,exportedAt:new Date().toISOString(),sampleData:true,job,turns,result,supervisorReview:approved,notice:'Synthetic demo job. Statements are technician-reported; this record does not certify physical repair or electrical safety.'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`SuryaLedger-${selected}.json`;a.hidden=true;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1500);setToast('Service packet exported as JSON.');
 }
 function readback(){
  if(!('speechSynthesis' in window)){setToast('Speech playback is unavailable in this browser.');return}
  const content=Object.entries(labels).map(([field,label])=>`${label}: ${result.fields?.[field]?.value||'Not yet reported'}.`).join(' ');
  speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(`${content} ${result.summary||''} Supervisor review is required.`);speech.lang='en-IN';speechSynthesis.speak(speech);
 }
 function reset(){cancelReplay.current=true;liveKeyRef.current=null;setLiveKey(null);clearTimeout(settleTimer.current);update(selected,{turns:[],result:initialResult,approved:null});setDialog(null);setToast('This demo report has been reset.')}
 const count=Object.values(result.fields||{}).filter(Boolean).length;
 const pending=JOBS.filter(j=>!records[j.id]?.approved).length;
 const shownJobs=JOBS.filter(j=>(`${j.name} ${j.id} ${j.area}`.toLowerCase().includes(query.toLowerCase()))&&(view==='all'||!records[j.id]?.approved));
 return <div className="app-shell">
  <aside className="sidebar">
   <a className="brand" href="#" onClick={e=>{e.preventDefault();setTab('workspace')}}><span className="brand-symbol"><Sun size={22}/></span><span>Surya<span className="brand-light">Ledger</span><small>SERVICE, ON RECORD.</small></span></a>
   <div className="workspace-label">WORKSPACE <span className="live-dot"/> DEMO</div>
   <nav aria-label="Main navigation">
    <button className={tab==='workspace'?'nav-item selected':'nav-item'} onClick={()=>setTab('workspace')}><LayoutDashboard size={19}/>Service desk<span className="nav-number">03</span></button>
    <button className={tab==='evidence'?'nav-item selected':'nav-item'} onClick={()=>setTab('evidence')}><ClipboardList size={19}/>Evidence ledger</button>
    <button className={tab==='guide'?'nav-item selected':'nav-item'} onClick={()=>setTab('guide')}><BookOpen size={19}/>Field guide<ArrowUpRight size={15}/></button>
   </nav>
   <div className="sidebar-note"><span className="note-icon"><Leaf size={22}/></span><h3>After the install,<br/>the work continues.</h3><p>A clearer service record.<br/>One conversation at a time.</p><div className="tiny-solar"><Sun size={35}/><span/><span/><span/></div></div>
   <button className="setup-nav" onClick={()=>setDialog('setup')}><Settings2 size={17}/>Voice connection<span className={health.bolnaConfigured?'dot green':'dot'}/></button>
   <div className="profile"><div className="avatar small">SL</div><div><strong>Demo workspace</strong><small>Local · synthetic jobs</small></div><ShieldCheck size={17}/></div>
  </aside>
  <main>
   <header className="topbar"><div>Workspace <ChevronRight size={14}/><strong>{tab==='workspace'?'Service desk':tab==='evidence'?'Evidence ledger':'Field guide'}</strong></div><span className="build-label"><span className="dot green"/> Buildathon edition <span className="divider"/> OCT 2026</span><button className="icon-button" aria-label="Help" onClick={()=>setTab('guide')}><CircleHelp size={20}/></button></header>
   <div className="page">
    <div className="page-heading"><div><div className="eyebrow">THE LAST MILE OF SOLAR SERVICE</div><h1>{tab==='workspace'?'Good work. Clear records.':tab==='evidence'?'Every fact has a source.':'Built for the last conversation.'}</h1><p>{tab==='workspace'?'From a technician’s voice to a record your team can review.':tab==='evidence'?'Follow the report back to the exact words that support it.':'A focused closeout workflow for rooftop solar service teams.'}</p></div><button className="button light" onClick={exportReport}><FileDown size={16}/>Export packet</button></div>
    {tab==='workspace'&&<>
     <section className="hero"><div className="hero-copy"><span className="hero-chip"><Radio size={14}/>VOICE IN. EVIDENCE OUT.</span><h2>The visit ends.<br/>The record shouldn’t go quiet.</h2><p>Capture the work. Catch the gaps. Hand over a service record<br className="desktop"/> with the original words attached.</p><button className="button lime" disabled={busy||replaying} onClick={()=>replay(false)}><Play size={15} fill="currentColor"/>{replaying?'Running demo…':'See a service come together'}<ArrowRight size={16}/></button><span className="hero-foot">Interactive replay · sample data · no API key needed</span></div><div className="solar-art" aria-hidden="true"><div className="sun-halo"><div className="sun-core"/></div><div className="orbit o1"/><div className="orbit o2"/><div className="panel-array">{Array.from({length:6},(_,i)=><div key={i} className="solar-panel"><i/><i/><i/><i/><i/><i/></div>)}</div><div className="art-tag"><span className="dot green"/> A complete story, for every site.</div><span className="art-coord">12.9716° N &nbsp; 77.5946° E</span></div></section>
     <div className="stats"><div><span className="stat-icon mint"><ClipboardList size={19}/></span><div><small>Sample service visits</small><strong>03 <span>in this workspace</span></strong></div></div><div><span className="stat-icon yellow"><Clock size={19}/></span><div><small>Awaiting review</small><strong>{String(pending).padStart(2,'0')} <span>human approval required</span></strong></div></div><div><span className="stat-icon lavender"><Quote size={19}/></span><div><small>Current evidence</small><strong>{count}<span>of 6 fields captured</span></strong></div></div></div>
     <div className="section-title"><div><h2>Today’s service desk <span className="pill">Sample jobs</span></h2><p>Choose a visit to capture, clarify, and review.</p></div><div className="list-tools"><button className={view==='all'?'filter selected':'filter'} onClick={()=>setView('all')}>All visits</button><button className={view==='pending'?'filter selected':'filter'} onClick={()=>setView('pending')}>Pending</button><div className="search-box"><Search size={15}/><input aria-label="Search sample jobs" placeholder="Find a site" value={query} onChange={e=>setQuery(e.target.value)}/></div></div></div>
     <div className="job-list">{shownJobs.map(j=><button key={j.id} className={`job-card ${selected===j.id?'active':''}`} disabled={replaying||callState!=='idle'} onClick={()=>{setSelected(j.id);setText('')}}><div className="job-top"><span className="site-id">{j.id}</span><span className={`job-state ${records[j.id]?.approved?'approved':''}`}><span className="dot"/>{records[j.id]?.approved?'Reviewed':records[j.id]?.result?.readyForReview?'For review':'Draft'}</span></div><h3>{j.name}<ArrowUpRight size={16}/></h3><p>{j.area}</p><div className="job-bottom"><span><Zap size={13}/>{j.size}</span><span>{j.issue}</span></div><div className="job-person"><span className="avatar mini">{j.initials}</span><strong>{j.tech}</strong><span>{j.time}</span></div></button>)}{!shownJobs.length&&<div className="empty-list">No visits match this filter.</div>}</div>
    </>}
    {tab!=='guide'&&<section className="report-section">
     <div className="report-heading"><div><span className="eyebrow">ACTIVE VISIT / {selected}</span><h2>{job.name} <span className={`status-badge ${approved?'approved':result.status}`}>{approved?'Supervisor reviewed':stateText[result.status]||'Needs evidence'}</span></h2><p>{job.tech} <span>·</span> {job.asset} <span>·</span> {job.size} rooftop system</p></div><div className="report-actions"><button className="text-button" disabled={!turns.length} onClick={readback}><Volume2 size={16}/>Read back</button><button className="icon-button" disabled={replaying||callState!=='idle'} aria-label="Reset this report" onClick={()=>setDialog('reset')}><RotateCcw size={16}/></button></div></div>
     <div className="report-grid"><div className="conversation"><div className="panel-heading"><div><Radio size={16}/><h3>Visit conversation</h3></div><span className="mono">{turns.filter(t=>t.role==='technician').length} NOTES</span></div>
      <div className="transcript" ref={transcriptRef}>{!turns.length?<div className="conversation-empty"><span><Mic size={26}/></span><h3>Start with what happened.</h3><p>Speak or type a service note. We’ll ask for<br/>the details the record still needs.</p><div className="example">“Site {selected}. Equipment {job.asset}.<br/>I observed low generation…”</div><button onClick={()=>replay(false)} disabled={replaying||busy} className="text-button">Try the sample conversation<ArrowRight size={14}/></button></div>:turns.map((turn,i)=><article key={turn.id} id={`turn-${turn.id}`} className={`turn ${turn.role}`}><span className="turn-avatar">{turn.role==='technician'?job.initials:<Sun size={15}/>}</span><div><div className="turn-label">{turn.role==='technician'?job.tech:'SuryaLedger'}<span>{String(i+1).padStart(2,'0')}</span></div><p>{turn.text}</p></div></article>)}</div>
      <form className="composer" onSubmit={e=>{e.preventDefault();addReport(text).catch(()=>{})}}><textarea aria-label="Technician service note" value={text} onChange={e=>setText(e.target.value)} placeholder={listening?'Listening… review the words before sending.':'Type a service note, or use the microphone…'} disabled={busy||replaying} rows={3}/><div className="composer-actions"><button type="button" className={`mic-button ${listening?'listening':''}`} onClick={dictate} disabled={busy||replaying}><Mic size={15}/>{listening?'Stop dictation':'Dictate'}</button><span>{listening?'Microphone active':'Review words before sending'}</span><button className="send-button" type="submit" disabled={!text.trim()||busy||replaying} aria-label="Add note">{busy?<span className="spinner"/>:<ArrowRight size={18}/>}</button></div></form>
      <div className="voice-bar"><span><Phone size={14}/>{callState==='active'?'Live Bolna call':callState==='connecting'?'Connecting…':'Prefer a conversation?'}</span><button disabled={replaying||callState==='connecting'} onClick={startCall}>{callState==='idle'?'Start Bolna call':'End call'}{callState==='idle'?<ArrowUpRight size={13}/>:<Square size={12}/>}</button></div>
     </div><div className="evidence-panel"><div className="panel-heading"><div><ShieldCheck size={17}/><h3>Record evidence</h3></div><span className="progress-label">{count}/6</span></div><div className="progress-track"><span style={{width:`${count/6*100}%`}}/></div><div className="evidence-list">{Object.entries(labels).map(([field,label])=>{const fact=result.fields?.[field];const conflict=result.conflicts?.find(c=>c.field===field);return <button key={field} className={`evidence-row ${fact?'captured':''} ${conflict?'conflicted':''}`} onClick={()=>fact?setDialog({type:'evidence',field,fact}):setToast(result.missing?.find(m=>m.field===field)?.question||`The technician still needs to report ${label.toLowerCase()}.`)}><span className="field-check">{conflict?<AlertTriangle size={13}/>:fact?<Check size={13}/>:<span/>}</span><div><span>{label}</span><strong>{fact?String(fact.value):'Awaiting technician'}</strong>{fact&&<small><Quote size={10}/>Source note {turns.findIndex(t=>t.id===(fact.turnId||fact.turn_id))+1||'↗'}</small>}</div><ChevronRight size={14}/></button>})}</div>
      {!!result.conflicts?.length&&<div className="conflict-box"><AlertTriangle size={17}/><div><strong>Conflicting statements</strong>{result.conflicts.map((c,i)=><div key={i}><p>{c.message}</p>{c.turnIds?.map(id=>{const source=turns.find(t=>t.id===id);return source?<button key={id} className="conflict-source" onClick={()=>document.getElementById(`turn-${id}`)?.scrollIntoView({behavior:'smooth',block:'center'})}>“{source.text}”</button>:null})}</div>)}</div></div>}
      <div className={`review-box ${result.readyForReview?'ready':''}`}><div><ShieldCheck size={18}/><strong>{approved?'Human review recorded':result.readyForReview?'Ready for a human review':'A complete record comes first.'}</strong></div><p>{approved?`Reviewed locally by ${approved.name}. The source statements remain attached.`:result.readyForReview?'All six required fields have source statements. Confirm the readback before marking this record reviewed.':result.nextQuestion||'Capture the visit details to prepare a service record.'}</p>{result.readyForReview&&!approved&&<button className="button dark full" onClick={()=>setDialog('review')}><CheckCheck size={16}/>Review service record</button>}{approved&&<button className="button light full" onClick={()=>window.print()}><FileText size={15}/>Print reviewed record</button>}</div>
     </div></div>
     <div className="report-footer"><span><ShieldCheck size={13}/>Statements are traceable to the transcript. Physical repair requires human verification.</span><button className="text-button" onClick={()=>replay(true)} disabled={replaying||busy||callState!=='idle'}>Try a conflicting report<ArrowRight size={13}/></button></div>
    </section>}
    {tab==='evidence'&&<section className="audit-trail"><h2>Revision history</h2><p>Earlier statements stay visible when a correction changes the record. Quotes refer to the submitted text.</p>{!result.history?.length?<p>Capture a service note to start the evidence ledger.</p>:result.history.map((item,i)=><article className="audit-entry" key={`${item.turnId}-${i}`}><strong>{labels[item.field]||item.field}</strong><div><p>“{item.quote}”</p><small>Source note {turns.findIndex(t=>t.id===item.turnId)+1} · {item.correction?'Explicit change or negation':'Technician statement'}</small></div><span className={`audit-state ${item.superseded?'superseded':''}`}>{item.superseded?'Superseded':item.value===null?'Withdrawn':'Current'}</span></article>)}</section>}
    {tab==='guide'&&<div className="guide-grid"><GuideCard n="01" title="Capture the visit" text="Use browser dictation, type a note, or connect a Bolna web call. A report starts with the site reference and equipment ID."/><GuideCard n="02" title="Ask for the missing detail" text="Six required fields keep the closeout focused. Negated observations and conflicting identifiers hold the record for clarification."/><GuideCard n="03" title="Review the original words" text="Click any captured field to inspect its source quote. Read the report back, confirm it, then export a JSON packet or print a service record."/><div className="guide-wide"><h2>A working prototype, with clear boundaries.</h2><p>All three sites are synthetic demo records. The local parser supports explicit English phrases and a small set of Hinglish phrases; it is not a general multilingual model. Browser dictation depends on browser support and may send audio to its speech provider. A configured Bolna agent provides live conversational voice; its end-to-end behavior needs testing with your key and a public HTTPS tool endpoint. Bolna tool text is model-mediated; source quotes refer to submitted text and are not independently verified against a recording.</p><p>Source quotes show what a technician reported. They do not prove that work occurred, certify electrical safety, or validate a warranty claim. Supervisor review is an explicit local workflow step. Production authentication, durable storage and organization isolation are future work.</p><button className="button dark" onClick={()=>setDialog('setup')}>Connect Bolna<ArrowUpRight size={15}/></button></div></div>}
    <footer className="page-footer"><span><Sun size={14}/>SuryaLedger</span><span>Built for the work after the install.</span><span>Prototype · Local data</span></footer>
   </div>
  </main>
  {toast&&<div className="toast" role="status"><CheckCircle2 size={17}/>{toast}<button aria-label="Dismiss notification" onClick={()=>setToast('')}><X size={15}/></button></div>}
  {dialog&&<div className="modal-backdrop" onClick={()=>setDialog(null)}><section className="modal" role="dialog" aria-modal="true" aria-label="Report details" onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" aria-label="Close dialog" onClick={()=>setDialog(null)}><X size={20}/></button>
   {dialog==='setup'?<><span className="modal-icon"><Phone/></span><div className="eyebrow">LIVE VOICE CONNECTION</div><h2>Your Bolna agent, connected.</h2><p>The replay works now. To use live voice, add these values to a local <code>.env</code> file and restart the server.</p><pre>BOLNA_API_KEY=your_key<br/>BOLNA_AGENT_ID=your_agent_id<br/>BOLNA_TOOL_TOKEN=your_random_secret<br/>BOLNA_PUBLIC_BASE_URL=https://your-tunnel</pre><p>Configure the report tool using <code>docs/BOLNA.md</code>. The key stays on your server. A live call sends audio through Bolna and its configured providers.</p><div className="modal-note">Status: {health.bolnaConfigured&&health.toolConfigured?'Server credentials and tool token configured; live call not yet verified.':'Server voice credentials or report-tool token not configured.'}</div><button className="button dark full" onClick={()=>{setDialog(null);replay(false)}}>Explore the replay first<Play size={15}/></button></>:dialog==='review'?<ReviewDialog record={record} onConfirm={name=>{update(selected,{approved:{name,at:new Date().toISOString(),confirmedReadback:true}});setDialog(null);setToast('Supervisor review recorded. Export the service packet for handover.')}}/>:dialog==='reset'?<><h2>Reset this demo report?</h2><p>This removes the current notes and local review for {selected}. Export the packet first if you want to keep it.</p><button className="button dark full" onClick={reset}>Reset report<RotateCcw size={16}/></button></>:dialog==='microphone'?<><span className="modal-icon"><Mic/></span><h2>Dictation needs a supported browser.</h2><p>Open the local app in Chrome or Edge, allow microphone access, and try again. You can also type any supported service note or run the sample replay.</p><button className="button dark full" onClick={()=>setDialog(null)}>Continue with text</button></>:dialog.type==='evidence'?<><span className="modal-icon"><Quote/></span><div className="eyebrow">SOURCE EVIDENCE</div><h2>{labels[dialog.field]}</h2><div className="fact-value">{String(dialog.fact.value)}</div><blockquote>“{dialog.fact.quote}”</blockquote><p>Technician statement · note {turns.findIndex(t=>t.id===(dialog.fact.turnId||dialog.fact.turn_id))+1}</p><p className="subtle">This quote supports the report field. A supervisor must verify the real-world observation.</p><button className="button dark full" onClick={()=>{const id=dialog.fact.turnId||dialog.fact.turn_id;setDialog(null);setTimeout(()=>document.getElementById(`turn-${id}`)?.scrollIntoView({behavior:'smooth',block:'center'}),50)}}>Go to source note<ArrowRight size={16}/></button></>:null}
  </section></div>}
  <div className="print-record"><h1>SuryaLedger · Service record</h1><p>{job.name} · {selected} · {job.asset}</p>{Object.entries(labels).map(([k,v])=><p key={k}><strong>{v}:</strong> {result.fields?.[k]?.value||'Missing'}<br/><small>Source: {result.fields?.[k]?.quote||'—'}</small></p>)}<p>Review: {approved?`${approved.name}, ${approved.at}`:'Pending human review'}</p><p>Sample data. Technician-reported statements; no physical verification or safety certification.</p></div>
 </div>
}
function GuideCard({n,title,text}){return <article className="guide-card"><span>{n}</span><h2>{title}</h2><p>{text}</p></article>}
function ReviewDialog({record,onConfirm}){const [name,setName]=useState(''),[checked,setChecked]=useState(false);return <><span className="modal-icon"><ShieldCheck/></span><div className="eyebrow">SUPERVISOR REVIEW</div><h2>Read it. Confirm it. Record it.</h2><p>{record.result.summary||'Review the captured fields and their source statements before confirming.'}</p><dl className="review-facts">{Object.entries(labels).map(([field,label])=><div key={field}><dt>{label}</dt><dd>{record.result.fields?.[field]?.value||'Not reported'}</dd></div>)}</dl><label className="form-label">Reviewer name<input placeholder="Your name" value={name} maxLength={80} onChange={e=>setName(e.target.value)}/></label><label className="checkbox"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/>I reviewed the readback and source statements. This is a record review, not a safety certification.</label><button className="button dark full" disabled={!checked||!name.trim()} onClick={()=>onConfirm(name.trim())}>Confirm human review<CheckCheck size={16}/></button></>}
createRoot(document.getElementById('root')).render(<App/>);
