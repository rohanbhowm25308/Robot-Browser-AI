const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icons=()=>window.lucide&&lucide.createIcons();
async function api(p,o={}){o.headers={"X-RB":"1",...(o.headers||{})};const r=await fetch(p,o);let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||("HTTP "+r.status));return j}
const post=(p,b)=>api(p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b||{})});
const md=t=>esc(t).replace(/```(?:\w+)?\n?([\s\S]*?)```/g,"<pre>$1</pre>").replace(/^### (.*)$/gm,"<h4>$1</h4>").replace(/^## (.*)$/gm,"<h3>$1</h3>").replace(/^# (.*)$/gm,"<h2>$1</h2>").replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/^[-*] (.*)$/gm,"• $1").replace(/\n/g,"<br>");
const NAV=[["home","Home","home"],["browser","Browser","globe"],["chat","AI Chat","message-square"],["missions","Missions","list-checks"],["research","Research","search"],["code","Code Surgeon","code-xml"],["gtm","GTM Architect","bar-chart-3"],["busted","BUSTED AI","shield-alert"],["-"],["history","History","clock"],["downloads","Downloads","download"],["bookmarks","Bookmarks","bookmark"],["settings","Settings","settings"]];
$("#nav").innerHTML=NAV.map(n=>n[0]=="-"?"<hr>":`<a data-view="${n[0]}"><i data-lucide="${n[2]}"></i><span>${n[1]}</span></a>`).join("");
const QS=[["Research the Web","Find and compare information.","search","research"],["Create Report","Generate reports and spreadsheets.","file-text","research"],["Analyze Content","Analyze images, websites and files.","bar-chart-3","busted"],["Automate Tasks","Perform multi-step tasks automatically.","play","research"],["Code Surgeon","Debug, fix and improve code.","code-xml","code"],["GTM Architect","Research, plan and create marketing content.","trending-up","gtm"],["Screenshot to Action","Upload a screenshot and get a plan.","image","#shot"],["Voice Command","Speak your task.","mic","#voice"]];
$("#qs").innerHTML=QS.map((q,i)=>`<div class="fc" data-q="${i}"><i data-lucide="${q[2]}" style="color:var(--ac2)"></i><b>${q[0]}</b><small>${q[1]}</small><i data-lucide="arrow-right" class="arr"></i></div>`).join("");
$("#pills").innerHTML=["Search","Research","Create","Analyze","Automate"].map(p=>`<button data-p="${p}"><i data-lucide="${{Search:"search",Research:"book-open",Create:"pen-square",Analyze:"bar-chart-2",Automate:"play"}[p]}"></i>${p}</button>`).join("");
const SUG=["Research 3 AI startups and create a spreadsheet","Analyze this website","Create a marketing plan","Find and fix code issues","Help me automate a task"];
$("#sugg").innerHTML=SUG.map(s=>`<button>${esc(s)}</button>`).join("");
let CUR=null,POLL=null;const LOAD={};
function go(v){$$(".view").forEach(s=>s.classList.toggle("on",s.id=="v-"+v));$$("#nav a").forEach(a=>a.classList.toggle("on",a.dataset.view==v));if(v!="missions")clearInterval(POLL);LOAD[v]&&LOAD[v]();icons()}
document.addEventListener("click",e=>{const a=e.target.closest("[data-view],[data-go]");if(a)go(a.dataset.view||a.dataset.go)});
$("#toggleSide").onclick=()=>document.body.classList.toggle("noside");$("#toggleComp").onclick=()=>document.body.classList.toggle("nocomp");
// ----- chat -----
const CHAT=[{r:"a",c:"Hi! I'm Robot AI.\n\nI can research websites (with your approval), analyze screenshots and files, debug code, and draft GTM plans.\n\nWhat would you like to do?"}];
function renderChat(){$$(".msgs").forEach(m=>{m.innerHTML=CHAT.map(x=>`<div class="m ${x.r=="u"?"u":""}">${md(x.c)}</div>`).join("");m.scrollTop=m.scrollHeight})}
const MISSION_RE=/(research|compare|spreadsheet|excel|report).*/i;
async function say(text){text=text.trim();if(!text)return;
 if(MISSION_RE.test(text)&&/(research|compare)/i.test(text)){CHAT.push({r:"u",c:text},{r:"a",c:"That looks like a multi-step research task. I created a plan for you to review — nothing runs until you approve."});renderChat();return startMission(text)}
 CHAT.push({r:"u",c:text});CHAT.push({r:"a",c:"Thinking..."});renderChat();
 try{const j=await post("/api/chat",{use_memory:localStorage.getItem("memon")=="1",messages:CHAT.slice(0,-1).map(x=>({role:x.r=="u"?"user":"assistant",content:x.c}))});CHAT[CHAT.length-1].c=j.reply}catch(e){CHAT[CHAT.length-1].c="Error: "+e.message}renderChat()}
$$(".chatform").forEach(f=>f.onsubmit=e=>{e.preventDefault();const i=$("input",f);const t=i.value;i.value="";say(t)});
$("#cmdForm").onsubmit=e=>{e.preventDefault();const t=$("#cmdIn").value;$("#cmdIn").value="";if(/^(https?:\/\/|www\.)/i.test(t.trim()))return openUrl(t.trim());say(t)};
$("#sugg").onclick=e=>{if(e.target.tagName=="BUTTON")say(e.target.textContent)};
$("#pills").onclick=e=>{const b=e.target.closest("button");if(!b)return;const p=b.dataset.p;$("#cmdIn").value={Search:"",Research:"Research 3 ",Create:"Create a marketing plan for ",Analyze:"Analyze ",Automate:"Automate "}[p];$("#cmdIn").focus()};
$("#qs").onclick=e=>{const c=e.target.closest(".fc");if(!c)return;const t=QS[c.dataset.q][3];if(t=="#shot")$(".shot").click();else if(t=="#voice")$(".mic").click();else go(t)};
// ----- voice -----
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,chunks=[],srObj=null;
const micState=on=>$$(".mic").forEach(x=>x.style.color=on?"var(--red)":"");
const note=t=>{CHAT.push({r:"a",c:t});renderChat()};
async function whisper(){try{const s=await navigator.mediaDevices.getUserMedia({audio:true});rec=new MediaRecorder(s);chunks=[];rec.ondataavailable=e=>chunks.push(e.data);
 rec.onstop=async()=>{s.getTracks().forEach(t=>t.stop());micState(false);const fd=new FormData();fd.append("audio",new Blob(chunks,{type:rec.mimeType}),"voice.webm");try{const j=await api("/api/transcribe",{method:"POST",body:fd});say(j.text)}catch(e){note("Voice error: "+e.message)}};rec.start();micState(true);note("Listening... click the mic again to stop.")}catch(e){note("Microphone unavailable: "+e.message)}}
$$(".mic").forEach(b=>b.onclick=()=>{if(rec&&rec.state=="recording"){rec.stop();return}if(srObj){srObj.stop();return}
 if(SR){srObj=new SR();srObj.lang="en-IN";srObj.interimResults=false;
  srObj.onresult=e=>say(e.results[0][0].transcript);
  srObj.onerror=e=>{srObj=null;micState(false);if(["network","service-not-allowed","audio-capture","language-not-supported"].includes(e.error))whisper();else if(!["no-speech","aborted"].includes(e.error))note("Voice error: "+e.error+" (allow microphone access in the address bar)")};
  srObj.onend=()=>{srObj=null;micState(false)};
  try{srObj.start();micState(true);note("Listening... speak now.")}catch(e){srObj=null;whisper()}}else whisper()});
// ----- screenshot -----
$$(".shot").forEach(i=>i.onchange=async()=>{const f=i.files[0];if(!f)return;CHAT.push({r:"u",c:"[Screenshot] "+f.name},{r:"a",c:"Analyzing screenshot..."});renderChat();
 const fd=new FormData();fd.append("file",f);fd.append("prompt",$("#cmdIn").value||"Describe this screenshot and list the actions a browser agent could take.");
 try{const j=await api("/api/vision",{method:"POST",body:fd});CHAT[CHAT.length-1].c=j.reply+"\n\n(These are suggestions. Nothing was executed.)"}catch(e){CHAT[CHAT.length-1].c="Error: "+e.message}renderChat();i.value=""});
$$(".bfile").forEach(i=>i.onchange=()=>{if(i.files[0]){go("busted");bustedUpload(i.files[0]);i.value=""}});
// ----- browser -----
let HIST=[],HI=-1;
const PX=u=>"/proxy?url="+encodeURIComponent(u);
function showStart(){$("#start").classList.remove("hidden");$("#frame").classList.add("hidden")}
function loadFrame(u,push=true){$("#start").classList.add("hidden");$("#frame").classList.remove("hidden");$("#frame").src=PX(u);$("#addrIn").value=u;if(push){HIST=HIST.slice(0,HI+1);HIST.push(u);HI++}}
function openUrl(u,push=true){if(!/^https?:\/\//i.test(u))u="https://"+u;go("browser");loadFrame(u,push)}
function searchWeb(q){openUrl("https://html.duckduckgo.com/html/?q="+encodeURIComponent(q))}
$("#frame").addEventListener("load",()=>{try{const l=$("#frame").contentWindow.location;if(l.pathname!="/proxy")return;const sp=new URLSearchParams(l.search);const p=sp.get("url")||(sp.get("__to")?sp.get("__to")+"?"+[...sp].filter(x=>x[0]!="__to").map(x=>encodeURIComponent(x[0])+"="+encodeURIComponent(x[1])).join("&"):null);if(p&&p!=HIST[HI]){$("#addrIn").value=p;HIST=HIST.slice(0,HI+1);HIST.push(p);HI++}}catch(e){}});
$("#addr").onsubmit=e=>{e.preventDefault();const v=$("#addrIn").value.trim();if(!v)return;/^[\w-]+(\.[\w-]+)+(\/.*)?$|^https?:\/\//i.test(v)?openUrl(v):searchWeb(v)};
$("#bBack").onclick=()=>{if(HI>0){HI--;openUrl(HIST[HI],false)}else{go("browser");showStart()}};$("#bFwd").onclick=()=>{if(HI<HIST.length-1){HI++;openUrl(HIST[HI],false)}};$("#bRef").onclick=()=>{const f=$("#frame");if(f.src)f.src=f.src;LOAD[$(".view.on").id.slice(2)]?.()};
$("#newTab").onclick=()=>{const u=$("#addrIn").value;if(u)window.open(u,"_blank","noopener")};
$("#xrayBtn").onclick=async()=>{const u=$("#addrIn").value;const b=$("#xray");b.classList.remove("hidden");if(!u){b.textContent="Enter a URL in the address bar first.";return}b.textContent="Scanning...";
 try{const j=await post("/api/xray",{url:u});b.innerHTML=`<h3>${esc(j.title)}</h3><p class="muted">${esc(j.description)}</p><p>Forms: <b>${j.forms.length}</b> · Tables: <b>${j.tables}</b> · Links: <b>${j.links}</b> · Scripts: <b>${j.scripts}</b> · Images: <b>${j.images}</b> (${j.images_missing_alt} missing alt text)</p>${j.forms.map(f=>`<p>Form → ${esc(f.method.toUpperCase())} ${esc(f.action||"(same page)")}: ${esc(f.fields.join(", "))}</p>`).join("")}<p>Headings: ${esc(j.headings.join(" | "))}</p>`}catch(e){b.innerHTML=`<span class="err">${esc(e.message)}</span>`}};
const BM=()=>JSON.parse(localStorage.getItem("bm")||"[]");
$("#bBm").onclick=()=>{const u=$("#addrIn").value.trim();if(!u)return;const b=BM();if(!b.includes(u)){b.push(u);localStorage.setItem("bm",JSON.stringify(b))}CHAT.push({r:"a",c:"Bookmarked: "+u});renderChat()};
LOAD.bookmarks=()=>{const b=BM();$("#bms").innerHTML=b.map((u,i)=>`<div class="tr" style="grid-template-columns:1fr auto"><span data-open="${esc(u)}">${esc(u)}</span><button class="btn" data-rm="${i}">Remove</button></div>`).join("")||'<p class="muted">No bookmarks yet.</p>'};
$("#bms").onclick=e=>{const o=e.target.closest("[data-open]");if(o)openUrl(o.dataset.open);const r=e.target.closest("[data-rm]");if(r){const b=BM();b.splice(+r.dataset.rm,1);localStorage.setItem("bm",JSON.stringify(b));LOAD.bookmarks()}};
// ----- missions -----
const statusBadge=s=>`<span class="badge b-${s}">${s.replace(/_/g," ")}</span>`;
async function missionRows(el,limit){try{const l=await api("/api/missions");el.innerHTML=l.slice(0,limit||99).map(m=>`<div class="tr" data-m="${m.id}"><b>${esc(m.name)}</b><span class="muted">${esc(m.prompt.slice(0,70))}</span>${statusBadge(m.status)}<small>${esc(m.created)}</small></div>`).join("")||'<p class="muted">No missions yet. Start one from Research. Only real, backend-recorded missions appear here.</p>';return l}catch(e){el.textContent=e.message}}
LOAD.home=()=>missionRows($("#recent"),4);LOAD.history=()=>missionRows($("#hist"));LOAD.missions=async()=>{await missionRows($("#mlist"));if(CUR)renderMission()};
document.addEventListener("click",e=>{const m=e.target.closest("[data-m]");if(m)openMission(m.dataset.m)});
async function startMission(p,c){try{const j=await post("/api/missions",{prompt:p,council:c||"full"});openMission(j.id)}catch(e){$("#rErr").textContent=e.message;go("research")}}
$("#rGo").onclick=()=>{$("#rErr").textContent="";startMission($("#rPrompt").value,$("#rCouncil").value)};
function openMission(id){CUR=id;go("missions");renderMission();clearInterval(POLL);POLL=setInterval(renderMission,1500)}
async function renderMission(){if(!CUR)return;let m;try{m=await api("/api/missions/"+CUR)}catch(e){return}missionRows($("#mlist"));
 const s=m.status,p=m.plan,live=["running","paused","awaiting_user"].includes(s);
 const btn=(a,l,c="")=>`<button class="btn ${c}" data-act="${a}">${l}</button>`;
 let ctl=s=="awaiting_approval"?btn("approve","Approve & run","pri")+btn("cancel","Reject","red"):s=="running"?btn("pause","Pause / take over")+btn("cancel","Cancel","red"):s=="paused"?btn("resume","Resume","pri")+btn("cancel","Cancel","red"):s=="awaiting_user"?btn("allow","Allow","pri")+btn("deny","Deny","red")+btn("cancel","Cancel","red"):(s=="incomplete"||s=="failed")&&p.checkpoint?btn("continue","Continue from checkpoint (+12 steps)","pri")+btn("fork","Fork with changes"):btn("fork","Fork with changes");
 const last=[...m.log].reverse().find(l=>l.url);
 $("#mdetail").innerHTML=`<div class="sh"><h3 style="margin:0">${esc(m.name)}</h3>${statusBadge(s)}</div><p class="muted">${esc(m.prompt)}</p>
 <div class="ghost"><b>Ghost Twin preview — what the agent intends to do</b><ol>${(p.steps||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ol><b>Outputs:</b> ${esc((p.outputs||[]).join(", "))}<br><b>${p.kind=="agent"?"Mode":"AI Council"}:</b> ${esc(p.kind=="agent"?"Browser Agent":(p.council||"full"))}${p.max_steps?`<br><b>Step limit:</b> ${p.max_steps}`:""}${(p.criteria||[]).length?`<br><b>Success criteria (checked by the system, not by the agent):</b><ul>${p.criteria.map(c=>`<li>${esc(c.description||c.type)}</li>`).join("")}</ul>`:""}${p.assumptions?`<br><b>Assumptions:</b> ${esc(p.assumptions)}`:""}<br><b>Safety scope:</b><ul>${(p.risks||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
 ${p.pending&&s=="awaiting_user"?`<div class="iss red"><b>Waiting for your decision:</b> ${esc(p.pending.text)}</div>`:""}${ctl}${s=="paused"&&last?` <a class="btn" target="_blank" rel="noopener" href="${esc(last.url)}">Open current page myself</a>`:""}
 ${m.artifact?`<p><a class="btn pri" href="/api/files/${esc(m.artifact)}">Download ${esc(m.artifact)}</a></p>`:""}
 <h4>Proof of work (replayable timeline)</h4><div class="tl">${m.log.map(l=>`<div class="${l.status}"><b>${esc(l.step)}</b> ${esc(l.msg)}<small>${esc(l.t)}${l.url?` · <a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.url.slice(0,60))}</a>`:""}</small>${l.shot?`<img class="thumb" src="/api/files/${esc(l.shot)}">`:""}</div>`).join("")||'<small class="muted">Nothing executed yet.</small>'}</div>`;
 renderPlanTab(m);if(!live&&s!="awaiting_approval")clearInterval(POLL)}
$("#mdetail").onclick=async e=>{const b=e.target.closest("[data-act]");if(!b)return;try{if(b.dataset.act=="fork"){const q=prompt("Edit the task for the forked mission:",$("#mdetail p.muted").textContent);if(!q)return;const as=prompt("Optional: what should change? (e.g. assume a premium audience, India only, pricing under $50)","")||"";const j=await post(`/api/missions/${CUR}/fork`,{prompt:q,assumptions:as});return openMission(j.id)}
 await post(`/api/missions/${CUR}/${b.dataset.act}`);renderMission();clearInterval(POLL);POLL=setInterval(renderMission,1500)}catch(er){alert(er.message)}};
function renderPlanTab(m){$("#tab-plan").innerHTML=`<div class="card"><b>${esc(m.name)}</b><br>${statusBadge(m.status)}<ol>${(m.plan.steps||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ol><button class="btn" data-m="${m.id}">Open mission</button></div>`}
$("#tab-plan").innerHTML='<p class="muted">No active plan. Start a research mission to see its steps here.</p>';
// ----- code -----
$("#cGo").onclick=async()=>{$("#cErr").textContent="";$("#cOut").innerHTML="Analyzing...";try{const j=await post("/api/code",{code:$("#cCode").value,lang:$("#cLang").value,task:$("#cTask").value,tests:$("#cTests").value,run:$("#cRun").checked});
 $("#cOut").innerHTML=`<p>${esc(j.summary)}</p>${j.verdict?`<div class="iss ${j.verdict_ok?"green":"yellow"}"><b>${esc(j.verdict)}</b> <small>(tests: ${esc(j.tests_source)})</small><pre>Original: ${esc(j.test_original?.status)}\n${esc(j.test_original?.output)}\n\nFixed: ${esc(j.test_fixed?.status)}\n${esc(j.test_fixed?.output)}</pre></div>`:`<div class="iss gray"><b>Not verified by tests.</b> Syntax checks and AI review are not proof. Tick "Run tests" to verify.</div>`}${(j.issues||[]).map(i=>`<div class="iss yellow"><b>${esc(i.severity||"")}</b> line ${esc(i.line??"?")}: ${esc(i.problem)}<br>Fix: ${esc(i.fix)}</div>`).join("")}${j.original_syntax?`<p>Syntax check (real <code>ast.parse</code>): original = ${esc(j.original_syntax)}, fixed = ${esc(j.fixed_syntax)}</p>`:""}<h4>Diff (review before applying)</h4><pre>${esc(j.diff||"No changes")}</pre><h4>Fixed code</h4><pre>${esc(j.fixed_code)}</pre><h4>Tests used</h4><pre>${esc(j.tests||"")}</pre>`}catch(e){$("#cOut").innerHTML="";$("#cErr").textContent=e.message}};
// ----- gtm -----
$("#gGo").onclick=async()=>{$("#gErr").textContent="";$("#gOut").textContent="Building plan...";try{const j=await post("/api/gtm",{product:$("#gIn").value});$("#gOut").innerHTML=md(j.markdown)+`<p><a class="btn pri" href="/api/files/${esc(j.file)}">Download .md</a></p>`}catch(e){$("#gOut").innerHTML="";$("#gErr").textContent=e.message}};
// ----- BUSTED -----
let BR=null;const LBL={green:"Verified",red:"Confirmed error",yellow:"Suspicious / review",gray:"Cannot verify"};
function showBusted(r){BR=r;const cnt=s=>r.checks.filter(c=>c.status==s).length;
 $("#bOut").innerHTML=`<div class="iss gray"><b>Not proof of authenticity.</b> BUSTED shows consistency checks and evidence-backed findings only. Verified means the checks passed, not that the file is genuine.</div><h3>${esc(r.filename)} ${r.rows?`<small class="muted">${r.rows} rows</small>`:""}</h3><div class="row" style="align-items:center"><div class="score">${r.score}%</div><div><b>Validation checks passed</b> <small>(automated checks only - not an authenticity or trust score)</small><br><small>${["green","red","yellow","gray"].map(s=>`<span class="st ${s}"></span>${cnt(s)} ${LBL[s]}`).join(" &nbsp; ")}</small></div></div>
 <h4>Checks</h4>${r.checks.map(c=>`<div><span class="st ${c.status}"></span><b>${esc(c.name)}</b> <small>${esc(c.detail)}</small></div>`).join("")}
 <h4>Detected issues</h4>${r.issues.map(i=>`<div class="iss ${i.status}">${i.fix?`<input type="checkbox" class="fixbox" data-id="${i.id}" checked> `:""}<b>${esc(i.title)}</b><br>${esc(i.detail)}${i.fix?`<br><small>Suggested correction: ${esc(i.fix.column)} → ${esc(i.fix.value)} (row ${i.fix.row+2})</small>`:""}</div>`).join("")||"<p>No issues found.</p>"}
 ${r.issues.some(i=>i.fix)?'<button class="btn pri" id="applyFix">Apply selected corrections &amp; recheck</button>':""}
 <a class="btn" href="/api/busted/report/${r.id}">Download report</a>${r.corrected?` <a class="btn pri" href="/api/files/${esc(r.corrected)}">Download corrected file</a>`:""}
 <h4>Integrity timeline</h4><div class="tl">${r.history.map(h=>`<div class="ok">${esc(h.event)}<small>${esc(h.t)}</small></div>`).join("")}</div><small class="muted">Green means configured checks passed — not that the document is authentic. Gray means there was not enough evidence.</small>`;icons()}
async function bustedUpload(f){go("busted");$("#bErr").textContent="";$("#bOut").textContent="Investigating...";const fd=new FormData();fd.append("file",f);try{showBusted(await api("/api/busted/analyze",{method:"POST",body:fd}))}catch(e){$("#bOut").innerHTML="";$("#bErr").textContent=e.message}}
$("#bFile").onchange=e=>e.target.files[0]&&bustedUpload(e.target.files[0]);
$("#bDemo").onclick=async()=>{$("#bErr").textContent="";try{showBusted(await post("/api/busted/demo"))}catch(e){$("#bErr").textContent=e.message}};
$("#bOut").onclick=async e=>{if(e.target.id!="applyFix")return;const ids=$$(".fixbox:checked").map(x=>+x.dataset.id);try{showBusted(await post("/api/busted/correct",{id:BR.id,ids}))}catch(er){$("#bErr").textContent=er.message}};
// ----- downloads / settings / tools / assets -----
async function files(){return api("/api/files")}
LOAD.downloads=async()=>{const f=await files();$("#dls").innerHTML=f.map(x=>`<div class="tr" style="grid-template-columns:1fr auto auto"><span>${esc(x.name)}</span><small>${(x.size/1024).toFixed(1)} KB</small><a class="btn" href="/api/files/${esc(x.name)}">Download</a></div>`).join("")||'<p class="muted">No generated files yet.</p>'};
LOAD.settings=async()=>{const h=await api("/api/health");$("#setBox").innerHTML=`<p>Groq API key: <b style="color:var(--${h.groq_key_set?"ok":"red"})">${h.groq_key_set?"configured":"MISSING — add GROQ_API_KEY to .env and restart"}</b></p><p>Chat model: ${esc(h.model)}<br>Vision model: ${esc(h.vision_model)}<br>Speech model: ${esc(h.stt_model)}</p><p class="muted">Built with AdaL by Sylph (development tool). AdaL is not a runtime dependency.</p>`};
async function sideTabs(){const h=await api("/api/health").catch(()=>({}));$("#tab-tools").innerHTML=[["Web research agent","Search + page fetch (public pages only)"],["Excel writer + verifier","openpyxl write, then read-back check"],["Vision (screenshots)",h.vision_model||""],["Voice (Whisper)",h.stt_model||""],["BUSTED AI","CSV/Excel/PDF/DOCX/TXT/images"],["Code Surgeon","LLM review + real syntax check"],["LLM chat",h.groq_key_set?h.model:"No GROQ_API_KEY set"]].map(t=>`<div class="m" style="margin-bottom:6px"><b>${t[0]}</b><br><small>${esc(t[1])}</small></div>`).join("");
 const f=await files().catch(()=>[]);$("#tab-assets").innerHTML=f.map(x=>`<div class="m" style="margin-bottom:6px"><a href="/api/files/${esc(x.name)}" style="color:var(--ac2)">${esc(x.name)}</a></div>`).join("")||'<p class="muted">No assets yet.</p>'}
$("#ctabs").onclick=e=>{const b=e.target.closest("button");if(!b)return;$$("#ctabs button").forEach(x=>x.classList.toggle("on",x==b));$$(".tab").forEach(t=>t.classList.toggle("on",t.id=="tab-"+b.dataset.t));if(["tools","assets"].includes(b.dataset.t))sideTabs()};
renderChat();go("home");icons();

$("#trustBtn").onclick=async()=>{const u=$("#addrIn").value;const b=$("#xray");b.classList.remove("hidden");if(!u){b.textContent="Enter a URL in the address bar first.";return}b.textContent="Scanning page...";
 try{const j=await post("/api/trust",{url:u});const c={green:"var(--ok)",yellow:"var(--yel)",red:"var(--red)"}[j.level];b.innerHTML=`<h3>Trust Radar: <span style="color:${c}">${j.level.toUpperCase()}</span></h3>${j.flags.map(f=>`<div class="iss ${f.level}">${esc(f.msg)}</div>`).join("")||"<p>No warning signs found. This is a heuristic scan, not a guarantee of safety.</p>"}`}catch(e){b.innerHTML=`<span class="err">${esc(e.message)}</span>`}};
LOAD.settings=async()=>{const h=await api("/api/health");const on=localStorage.getItem("memon")=="1";
 $("#setBox").innerHTML=`<p>Groq API key: <b style="color:var(--${h.groq_key_set?"ok":"red"})">${h.groq_key_set?"configured":"MISSING - add GROQ_API_KEY to .env and restart"}</b></p><p>Chat: ${esc(h.model)} · Vision: ${esc(h.vision_model)} · Speech: ${esc(h.stt_model)}<br>Browser automation: <b>${esc(h.browser_mode)}</b> (${h.headless?"headless":"visible window"})</p>
 <h3>Agent Memory</h3><p class="muted">Stored only in your local database. Used in chat only when enabled. Never store passwords here.</p><label><input type="checkbox" id="memOn" ${on?"checked":""}> Use memory in chat</label>
 <div class="row"><input id="memIn" placeholder="e.g. I prefer concise answers; my startup targets Indian SMBs"><button class="btn" id="memAdd">Add</button></div><div id="memList"></div><button class="btn red" id="memClear">Delete all memory</button>
 <p class="muted">Built with AdaL by Sylph (development tool; not a runtime dependency).</p>`;
 const draw=async()=>{const l=await api("/api/memory");$("#memList").innerHTML=l.map(m=>`<div class="mem"><span>${esc(m.text)}</span><button class="btn" data-del="${m.id}">Delete</button></div>`).join("")||'<p class="muted">No memory saved.</p>'};draw();
 $("#memOn").onchange=e=>localStorage.setItem("memon",e.target.checked?"1":"0");
 $("#memAdd").onclick=async()=>{const t=$("#memIn").value;if(!t.trim())return;await post("/api/memory",{text:t});$("#memIn").value="";draw()};
 $("#memList").onclick=async e=>{const d=e.target.closest("[data-del]");if(d){await api("/api/memory?id="+d.dataset.del,{method:"DELETE"});draw()}};
 $("#memClear").onclick=async()=>{if(confirm("Delete all saved memory?")){await api("/api/memory",{method:"DELETE"});draw()}}};
renderChat();

$("#snapBtn").onclick=async()=>{const u=$("#addrIn").value;const b=$("#xray");b.classList.remove("hidden");if(!u){b.textContent="Enter a URL first.";return}b.textContent="Rendering in Chromium...";
 try{const r=await fetch("/api/snapshot?url="+encodeURIComponent(u));if(!r.ok){const e=await r.json();throw new Error(e.error||r.status)}const url=URL.createObjectURL(await r.blob());b.innerHTML=`<img style="max-width:100%;border-radius:8px" src="${url}">`}catch(e){b.innerHTML=`<span class="err">${esc(e.message)}</span>`}};
const _set=LOAD.settings;LOAD.settings=async()=>{await _set();$("#setBox").insertAdjacentHTML("afterbegin",`<button class="btn pri" id="selfBtn">Run self-test (Groq, search, Chromium)</button><div id="selfOut"></div><hr style="border-color:var(--bd)">`);
 $("#selfBtn").onclick=async()=>{$("#selfOut").textContent="Running tests (up to 40s)...";try{const r=await api("/api/selftest");$("#selfOut").innerHTML=r.map(x=>`<div class="iss ${x.ok?"green":"red"}"><b>${x.ok?"PASS":"FAIL"}</b> ${esc(x.name)} <small>${x.ms}ms</small><br>${esc(x.detail)}</div>`).join("")}catch(e){$("#selfOut").textContent=e.message}}};

$("#aGo").onclick=async()=>{$("#aErr").textContent="";try{const r=await post("/api/agent",{goal:$("#aGoal").value,start_url:$("#aUrl").value,criteria:$("#aCrit").value,max_steps:$("#aSteps").value});openMission(r.id)}catch(e){$("#aErr").textContent=e.message}};

const DEMO=[["Example Domain","https://example.com","Simple page, good first test"],["Wikipedia: AI","https://en.wikipedia.org/wiki/Artificial_intelligence","Long article in the reader"],["Python.org","https://www.python.org","Docs and news"],["Hacker News","https://news.ycombinator.com","Tech news links"],["MDN Web Docs","https://developer.mozilla.org","Web documentation"],["Netlify","https://www.netlify.com","Try X-Ray and Trust Radar"],["BBC News","https://www.bbc.com/news","Headlines"],["Search: AI startups India","search:AI startups in India","Runs a web search"]];
$("#tiles").innerHTML=DEMO.map((d,i)=>`<div class="fc" data-demo="${i}"><i data-lucide="${d[1].startsWith("search:")?"search":"globe"}" style="color:var(--ac2)"></i><b>${esc(d[0])}</b><small>${esc(d[2])}</small></div>`).join("");
$("#tiles").onclick=e=>{const c=e.target.closest("[data-demo]");if(!c)return;const u=DEMO[c.dataset.demo][1];u.startsWith("search:")?searchWeb(u.slice(7)):openUrl(u)};
$("#startBtn").onclick=showStart;icons();

api("/api/health").then(h=>{if(h.browser_mode!=="playwright"){["#aGo","#snapBtn"].forEach(q=>{const b=$(q);b.disabled=true;b.title="Needs Chromium (not enabled in this deployment)"});$("#aErr").textContent="Browser Agent and Chromium snapshot are disabled in this deployment (no Chromium). Everything else works."}}).catch(()=>{});
