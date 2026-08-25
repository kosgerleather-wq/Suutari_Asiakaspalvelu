const bag="https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80";
const shoe="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80";
const boot="https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=500&q=80";

let jobs=[];
let requests=[];
let requestSeq={store:146,whatsapp:87,email:33,post:20};
let customerSeq=421;
let jobSeq=153;

let supabaseClient = null;

function initSupabase() {
  const url = localStorage.getItem("suutari_db_url");
  const key = localStorage.getItem("suutari_db_key");
  if(url && key && typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(url, key);
    return true;
  }
  return false;
}

function saveState(){
  localStorage.setItem("suutari_jobs",JSON.stringify(jobs));
  localStorage.setItem("suutari_requests",JSON.stringify(requests));
  localStorage.setItem("suutari_seqs",JSON.stringify({requestSeq,customerSeq,jobSeq}));
}

async function dbInsertJob(j) {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from("jobs").insert([j]);
      if(error) console.error("Supabase insert job error:", error);
    } catch(err) {
      console.error(err);
    }
  }
}

async function dbUpdateJobStatus(id, status) {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from("jobs").update({ status }).eq("id", id);
      if(error) console.error("Supabase update job error:", error);
    } catch(err) {
      console.error(err);
    }
  }
}

async function dbUpdateJobAfterImage(id, img_after) {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from("jobs").update({ img_after }).eq("id", id);
      if(error) console.error("Supabase update job after_image error:", error);
    } catch(err) {
      console.error(err);
    }
  }
}

async function dbUpsertRequest(r) {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from("requests").upsert([r]);
      if(error) console.error("Supabase upsert request error:", error);
    } catch(err) {
      console.error(err);
    }
  }
}

async function syncFromDb() {
  if(!supabaseClient) return false;
  try {
    const { data: jobData, error: jobErr } = await supabaseClient.from("jobs").select("*").order("created_at", { ascending: false });
    if(jobErr) throw jobErr;
    const { data: reqData, error: reqErr } = await supabaseClient.from("requests").select("*");
    if(reqErr) throw reqErr;

    if(jobData && jobData.length > 0) {
      jobs = jobData;
    }
    if(reqData && reqData.length > 0) {
      requests = reqData;
    }
    saveState();
    return true;
  } catch(err) {
    console.error("Database sync failed:", err.message);
    return false;
  }
}

async function initData(){
  const storedJobs=localStorage.getItem("suutari_jobs");
  const storedRequests=localStorage.getItem("suutari_requests");
  const storedSeqs=localStorage.getItem("suutari_seqs");
  if(storedJobs && storedRequests){
    jobs=JSON.parse(storedJobs);
    requests=JSON.parse(storedRequests);
    if(storedSeqs){
      const seqs=JSON.parse(storedSeqs);
      requestSeq=seqs.requestSeq||requestSeq;
      customerSeq=seqs.customerSeq||customerSeq;
      jobSeq=seqs.jobSeq||jobSeq;
    }
  }else{
    jobs=[
      {id:"#1052",name:"Anna Virtanen",product:"Marimekko käsilaukku",work:"Vetoketjun vaihto",price:45,date:"28.08.2026",status:"active",loc:"A3-07",img:bag,note:"Musta vetoketju. Asiakas hyväksyi hinta-arvion."},
      {id:"#1042",name:"Liisa Korhonen",product:"Nahkalaukku",work:"Kahvan korjaus",price:55,date:"21.08.2026",status:"late",loc:"A2-03",img:bag,note:"Kahva vaatii vahvistuksen."},
      {id:"#1046",name:"Matti Laine",product:"Nahkakenkä",work:"Pohjallisen vaihto",price:35,date:"27.08.2026",status:"waiting",loc:"B1-04",img:shoe,note:"Materiaali saapuu tiistaina."},
      {id:"#1047",name:"Sara Niemi",product:"Saapas",work:"Vetoketju",price:40,date:"30.08.2026",status:"active",loc:"C2-01",img:boot,note:"Uusi vetoketju tilattu."},
      {id:"#1048",name:"Jukka Virtanen",product:"Nahkatakki",work:"Vetoketjun vaihto",price:60,date:"30.08.2026",status:"ready",loc:"B3-02",img:bag,note:"Valmis, asiakas viestitetty."}
    ];
    requests=[
      {id:1,name:"Anna Virtanen",product:"Marimekko käsilaukku",work:"Vetoketjun vaihto",status:"answered",img:bag,msg:"Voisitteko korjata tämän laukun vetoketjun?",reply:"Arvio noin 45 €."},
      {id:2,name:"Sara Niemi",product:"Laukku",work:"Vetoketjun korjaus",status:"bring",img:bag,msg:"Tuon laukun huomenna.",reply:"Sopii hyvin, tervetuloa! 😊"},
      {id:3,name:"Laura K.",product:"Saapas",work:"Vetoketju",status:"new",img:boot,msg:"Onko mahdollista korjata tämän saappaan vetoketju?",reply:""},
      {id:4,name:"Pekka T.",product:"Nahkatakki",work:"Vetoketjun vaihto",status:"new",img:bag,msg:"Paljonko uuden vetoketjun vaihto maksaa?",reply:""},
      {id:5,name:"Camilla R.",product:"Lompakko",work:"Vetoketju",status:"arrived",img:bag,msg:"Tuotu tänään.",reply:""}
    ];
    saveState();
  }

  // Try to connect to Supabase and pull fresh data
  if (initSupabase()) {
    console.log("Supabase connected! Syncing...");
    await syncFromDb();
  }
}

const statusLabel={active:"Työn alla",waiting:"Odottaa",ready:"Noudettavissa",late:"Myöhässä"};

function showPage(id){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===id));
  scrollTo({top:0,behavior:"smooth"});
  if(id==="jobs")renderJobs();
  if(id==="inbox")renderInbox();
  if(id==="calendar")renderCalendar();
  if(id==="customers")renderCustomers();
  if(id==="reports")renderReports();
  if(id==="shelves")renderShelves();
  if(id==="social")renderSocial();
  if(id==="settings") {
    document.getElementById("dbUrl").value = localStorage.getItem("suutari_db_url") || "";
    document.getElementById("dbKey").value = localStorage.getItem("suutari_db_key") || "";
    document.getElementById("connStatus").style.display = "none";
    document.getElementById("geminiKey").value = localStorage.getItem("suutari_gemini_key") || "";
    document.getElementById("aiStatus").style.display = "none";
    document.getElementById("aiInstructions").value = localStorage.getItem("suutari_ai_instructions") || "";
    document.getElementById("aiInstructionsStatus").style.display = "none";
    document.getElementById("settingsUser").value = localStorage.getItem("suutari_admin_user") || "suutari";
    document.getElementById("settingsPass").value = "";
    document.getElementById("authSettingsStatus").style.display = "none";
  }
}
document.querySelectorAll("[data-page]").forEach(x=>x.onclick=()=>showPage(x.dataset.page));

function jobLine(j){return `<div class="job-line" onclick="openJob('${j.id}')"><img class="thumb" src="${j.img}"><div><b>${j.id} · ${j.name}</b><small>${j.product} · ${j.work}</small></div><div class="job-price">${j.price} €<small>${statusLabel[j.status]}</small></div></div>`}

function renderHome(){
  document.getElementById("priority").innerHTML=jobs.slice(0,3).map(j=>`<div class="priority" onclick="openJob('${j.id}')"><div class="priority-top"><span class="pill ${j.status==='late'?'red':j.status==='waiting'?'orange':'teal'}">${j.status==='late'?'MYÖHÄSSÄ':j.status==='waiting'?'ODOTTAA':'AKTIIVINEN'}</span><b>${j.loc}</b></div><h3>${j.id} · ${j.name}</h3><p>${j.product}<br>${j.work} · ${j.price} €<br>Toimitus: ${j.date}</p></div>`).join("");
  document.getElementById("today").innerHTML=jobs.slice(0,4).map(jobLine).join("");
}

function renderInbox(){
  const groups=[["new","Uusi"],["answered","Vastattu"],["bring","Asiakas tuo"],["arrived","Tuote saapui"],["converted","Työn alla"]];
  document.getElementById("kanban").innerHTML=groups.map(g=>{let a=requests.filter(r=>r.status===g[0]);return `<div class="column"><div class="column-head"><span>${g[1]}</span><b>${a.length}</b></div>${a.map(r=>`<div class="request" onclick="openRequest(${r.id})"><img src="${r.img}"><b>${r.name}</b><p>${r.msg}</p><span class="pill ${g[0]==='new'?'orange':g[0]==='bring'?'teal':'blue'}">${r.work}</span></div>`).join("")}</div>`}).join("");
}

function openRequest(id){
  const r=requests.find(x=>x.id===id);
  document.getElementById("modalBody").innerHTML=`<h2>${r.name}</h2><p style="color:#78858d;font-size:12px">${r.product} · ${r.work}</p><div class="detail-grid" style="margin-top:15px"><div><img src="${r.img}" style="width:100%;height:180px;object-fit:cover;border-radius:11px"><div class="card" style="margin-top:10px"><b style="font-size:11px">Asiakkaan viesti</b><p style="font-size:12px;line-height:1.5">${r.msg}</p><b style="font-size:11px">Vastauksesi</b><p style="font-size:12px;color:#60747d">${r.reply||"Ei vielä vastattu."}</p></div></div><div class="detail"><b style="font-size:11px">Kyselyn tila</b><div class="timeline"><div class="step done"><i></i><div><b>Kysely saapui</b><small>WhatsApp</small></div></div><div class="step ${r.status!=='new'?'done':''}"><i></i><div><b>Vastattu</b><small>Arvio / hinta annettu</small></div></div><div class="step ${r.status==='bring'||r.status==='arrived'?'done':''}"><i></i><div><b>Asiakas tuo</b><small>Seuranta</small></div></div><div class="step ${r.status==='arrived'?'active':''}"><i></i><div><b>Tuote saapui</b><small>Valmis työtilaukseksi</small></div></div></div></div></div><div class="modal-actions"><button class="cancel" onclick="closeModal()">Sulje</button><button class="save" onclick="convertRequest(${r.id})">📦 TUOTE SAAPUI → LUO TYÖ</button></div>`;
  document.getElementById("modal").classList.remove("hidden");
}

function convertRequest(id){
  let r=requests.find(x=>x.id===id);
  r.status="converted";
  saveState();
  dbUpsertRequest(r);
  closeModal();
  openIntake(r);
}

function openRequestForm(){
  document.getElementById("modalBody").innerHTML=`<h2>Uusi asiakastiedustelu</h2><p style="font-size:12px;color:#78858d">Tallenna WhatsApp-kysely nopeasti.</p><div class="form"><div class="field"><label>Nimi</label><input id="reqName" placeholder="Anna Virtanen"></div><div class="field"><label>Puhelin</label><input id="reqPhone" placeholder="040..."></div><div class="field"><label>Tuote</label><input id="reqProd" placeholder="Käsilaukku"></div><div class="field"><label>Työ</label><input id="reqWork" placeholder="Vetoketjun vaihto"></div><div class="field full"><label>Viesti</label><textarea id="reqMsg" placeholder="Viestin sisältö..."></textarea></div></div><div class="modal-actions"><button class="cancel" onclick="closeModal()">Peruuta</button><button class="save" onclick="saveRequestForm()">TALLENNA KYSELY</button></div>`;
  document.getElementById("modal").classList.remove("hidden");
}

function saveRequestForm(){
  const name=document.getElementById("reqName").value.trim()||"Uusi asiakas";
  const phone=document.getElementById("reqPhone").value.trim();
  const product=document.getElementById("reqProd").value.trim()||"Tuote";
  const work=document.getElementById("reqWork").value.trim()||"Korjaus";
  const msg=document.getElementById("reqMsg").value.trim();
  const newReq = {id:Date.now(),name,product,work,msg,status:"new",reply:"",source:"whatsapp",request_id:makeRequestId("whatsapp"),customer_id:makeCustomerId(),created_at:new Date().toISOString().slice(0,10),price:""};
  requests.unshift(newReq);
  saveState();
  dbUpsertRequest(newReq);
  closeModal();
  renderInbox();
}

let intakeImageBase64 = null;

function previewIntakeImage(e) {
  const f = e.target.files?.[0];
  if(!f) return;
  
  const preview = document.getElementById("intakePreview");
  const content = document.getElementById("intakeDropContent");
  
  preview.src = URL.createObjectURL(f);
  preview.style.display = "block";
  content.style.display = "none";
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    intakeImageBase64 = evt.target.result;
  };
  reader.readAsDataURL(f);
}

function openIntake(prefill=null){
  let initialImgStyle = "display:none;";
  let initialContentStyle = "display:block;";
  if (prefill && prefill.img) {
    intakeImageBase64 = prefill.img;
    initialImgStyle = "display:block; max-width: 100%; max-height: 200px; border-radius: 8px; margin-top: 5px;";
    initialContentStyle = "display:none;";
  } else {
    intakeImageBase64 = null;
  }

  document.getElementById("modalBody").innerHTML=`<h2>📦 Uusi vastaanotto</h2><p style="font-size:12px;color:#78858d">Asiakas toi tuotteen. Luo työ alle 10 sekunnissa.</p>
<div class="form">
  <div class="field"><label>Asiakas</label><input id="n" value="${prefill?.name||""}" placeholder="Nimi"></div>
  <div class="field"><label>Puhelin</label><input id="p" value="${prefill?.phone||""}" placeholder="040..."></div>
  <div class="field"><label>Tuote</label><input id="prod" value="${prefill?.product||""}" placeholder="Marimekko käsilaukku"></div>
  <div class="field"><label>Korjaus</label><input id="work" value="${prefill?.work||""}" placeholder="Vetoketjun vaihto"></div>
  <div class="field"><label>Hinta (€)</label><input id="price" type="number" value="45"></div>
  <div class="field"><label>Toimitus</label><input id="date" type="date" value="2026-08-28"></div>
  <div class="field full"><label>Hylly / sijainti</label><input id="loc" value="A1-01" placeholder="A3-07"></div>
  <div class="field full">
    <label>Kuva</label>
    <label class="dropzone" id="intakeDropzone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: var(--bg); min-height: 100px; position: relative;">
      <input type="file" id="jobFile" accept="image/*" style="display:none" onchange="previewIntakeImage(event)">
      <div id="intakeDropContent" style="text-align:center; color: var(--text-muted); font-size: 13px; ${initialContentStyle}">
        📷 Ota kuva / valitse tiedosto<br>
        <small style="font-size:11px;">Ennen-kuva suositeltava</small>
      </div>
      <img id="intakePreview" src="${prefill?.img||""}" style="${initialImgStyle}">
    </label>
  </div>
  <div class="field full"><label>Sisäinen huomautus</label><textarea id="note">${prefill?"Siirretty WhatsApp-tiedustelusta.":""}</textarea></div>
</div>
<div class="modal-actions"><button class="cancel" onclick="closeModal()">Peruuta</button><button class="save" onclick="saveJob()">LUO TYÖ + ANNA SEURANTAKOODI</button></div>`;
  document.getElementById("modal").classList.remove("hidden");
}

function saveJob(){
  let d=document.getElementById("date").value;
  let j={
    id:"#"+(1050+jobs.length),
    name:document.getElementById("n").value||"Uusi asiakas",
    phone:document.getElementById("p").value||"",
    product:document.getElementById("prod").value||"Tuote",
    work:document.getElementById("work").value||"Korjaus",
    price:+document.getElementById("price").value||0,
    date:d?d.split("-").reverse().join("."):"28.08.2026",
    status:"active",
    loc:document.getElementById("loc").value||"A1-01",
    img:intakeImageBase64 || bag,
    note:document.getElementById("note").value
  };
  jobs.unshift(j);
  saveState();
  dbInsertJob(j);
  closeModal();
  renderHome();
  openJob(j.id);
  intakeImageBase64 = null;
}

let currentJobFilter = "all";
function setJobFilter(filter, btn) {
  currentJobFilter = filter;
  document.querySelectorAll("#jobs .chips button").forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  renderJobs();
}

function renderJobs(){
  let q=(document.getElementById("search")?.value||"").toLowerCase();
  let a=jobs.filter(j=>(j.id+j.name+j.product+j.work).toLowerCase().includes(q));
  if(currentJobFilter === "active") a = a.filter(j => j.status === "active" || j.status === "late");
  if(currentJobFilter === "waiting") a = a.filter(j => j.status === "waiting");
  if(currentJobFilter === "ready") a = a.filter(j => j.status === "ready");

  document.getElementById("jobsTable").innerHTML=`<div class="table-head"><div>Nro</div><div>Asiakas</div><div>Tuote / Työ</div><div>Toimitus</div><div>Hinta</div><div>Tila</div></div>`+a.map(j=>`<div class="table-row" onclick="openJob('${j.id}')"><div><b>${j.id}</b></div><div><b>${j.name}</b><small>${j.loc}</small></div><div><b>${j.product}</b><small>${j.work}</small></div><div>${j.date}</div><div><b>${j.price} €</b></div><div><span class="pill ${j.status==='late'?'red':j.status==='waiting'?'orange':'teal'}">${statusLabel[j.status]}</span></div></div>`).join("");
}

function uploadDetailAfterImage(e, id) {
  const f = e.target.files?.[0];
  if(!f) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const base64 = evt.target.result;
    const j = jobs.find(x => x.id === id);
    if(j) {
      j.img_after = base64;
      saveState();
      document.getElementById("detailAfterPreview").src = base64;
      document.getElementById("detailAfterPreview").style.opacity = 1;
      dbUpdateJobAfterImage(id, base64);
    }
  };
  reader.readAsDataURL(f);
}

function openJob(id){
  const j=jobs.find(x=>x.id===id);
  document.getElementById("jobNo").textContent=j.id;
  const steps = ["Vastaanotettu","Tarkastus","Työn alla","Laadunvalvonta","Valmis noudettavaksi","Luovutettu"];
  
  const trackUrl = `${window.location.origin}/track.html?code=${encodeURIComponent(j.id)}`;
  const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackUrl)}`;

  document.getElementById("jobDetail").innerHTML=`<div class="detail-grid">
    <div class="detail">
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:15px;">
        <div style="position:relative;">
          <img src="${j.img}" style="width:110px;height:110px;object-fit:cover;border-radius:8px;border:1px solid #e6edef;">
          <span style="position:absolute;bottom:4px;left:4px;background:rgba(15,45,74,0.85);color:white;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700">ENNEN</span>
        </div>
        <div style="position:relative;cursor:pointer;" onclick="document.getElementById('detailAfterFile').click()">
          <img src="${j.img_after || 'bag.png'}" id="detailAfterPreview" style="width:110px;height:110px;object-fit:cover;border-radius:8px;border:1px solid #e6edef;opacity:${j.img_after ? 1 : 0.4};">
          <span style="position:absolute;bottom:4px;left:4px;background:rgba(16,185,129,0.85);color:white;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700">JÄLKEEN</span>
          <input type="file" id="detailAfterFile" accept="image/*" style="display:none" onchange="uploadDetailAfterImage(event, '${j.id}')">
        </div>
      </div>
      <div>
        <h2 style="margin:0 0 5px;font-size:18px">${j.name}</h2>
        <p style="font-size:12px;color:#7d8990;margin:0 0 5px;">${j.product}</p>
        <span class="pill teal">${j.loc}</span>
      </div>
      <hr style="border:0;border-top:1px solid #e6edef;margin:18px 0">
      <b style="font-size:11px">Työ</b><p style="font-size:13px">${j.work} · <strong>${j.price} €</strong></p>
      <b style="font-size:11px">Toimitus</b><p style="font-size:13px">${j.date}</p>
      <b style="font-size:11px">Sisäinen huomautus</b><p style="font-size:12px;color:#71818a">${j.note}</p>
      <hr style="border:0;border-top:1px solid #e6edef;margin:18px 0">
      <div style="display:flex;gap:15px;align-items:center;">
        <img src="${qrLink}" style="width:75px;height:75px;border-radius:8px;border:1px solid #e6edef;">
        <div>
          <b style="font-size:11px">Asiakkaan seuranta (QR)</b>
          <p style="font-size:11px;color:#71818a;margin:4px 0 0">Skannaa QR tai avaa linkki: <a href="track.html?code=${j.id}" target="_blank">${j.id}</a></p>
        </div>
      </div>
    </div>
    <div class="detail"><b style="font-size:11px">Työnkulku</b><div class="timeline">${steps.map((s,i)=>`<div class="step ${i<3?"done":i===3&&j.status==="ready"?"active":""}"><i></i><div><b>${s}</b><small>${i===0?"23.08.2026":i===2?"Nyt":i===4?j.date:""}</small></div></div>`).join("")}</div><button class="save" style="width:100%;border:0;border-radius:9px;padding:12px;margin-top:8px;cursor:pointer" onclick="openStatus('${j.id}')">PÄIVITÄ TILA</button></div>
  </div>`;
  showPage("job");
}

function openStatus(id){
  const j=jobs.find(x=>x.id===id);
  document.getElementById("modalBody").innerHTML=`<h2>Muuta tilaa · ${j.id}</h2><p style="font-size:12px;color:#78858d">${j.name} · ${j.product}</p><div style="display:grid;gap:7px;margin-top:15px">${[["waiting","⏳ Materiaalia odotetaan"],["active","🔧 Työn alla"],["ready","✅ Valmis noudettavaksi"],["done","✔ Luovutettu"]].map(x=>`<button class="wide-btn" onclick="setStatus('${j.id}','${x[0]}')">${x[1]}</button>`).join("")}</div>`;
  document.getElementById("modal").classList.remove("hidden");
}

function setStatus(id,s){
  const j = jobs.find(job=>job.id===id);
  j.status=s;
  saveState();
  dbUpdateJobStatus(id, s);
  closeModal();
  openJob(id);
  renderHome();

  if (s === "ready" || s === "waiting") {
    setTimeout(() => {
      openNotificationModal(id, s);
    }, 300);
  }
}

function openNotificationModal(jobId, status) {
  const j = jobs.find(x => x.id === jobId);
  if(!j) return;
  
  const phone = j.phone || "0400000000"; 
  const name = j.name || "Asiakas";
  const product = j.product || "tuote";
  const work = j.work || "korjaustyö";
  
  const trackUrl = `${window.location.origin}/track.html?code=${encodeURIComponent(j.id)}`;
  
  let msg = "";
  if (status === "ready") {
    msg = `Hei ${name}! Tuotteesi ${product} (${work}) on nyt valmis ja noudettavissa liikkeestämme. Tervetuloa! Seuraa tilauksen tilaa täältä: ${trackUrl}`;
  } else if (status === "waiting") {
    msg = `Hei ${name}! Tuotteesi ${product} (${work}) odottaa tällä hetkellä tarvittavia materiaaleja. Voit seurata tilaa täältä: ${trackUrl}`;
  }
  
  const encodedMsg = encodeURIComponent(msg);
  const waLink = `https://wa.me/${phone.replace(/[^0-9+]/g, "")}?text=${encodedMsg}`;
  const smsLink = `sms:${phone.replace(/[^0-9+]/g, "")}?&body=${encodedMsg}`;
  
  document.getElementById("modalBody").innerHTML = `
    <h2 style="margin-bottom:5px">💬 Lähetä asiakasviesti</h2>
    <p style="font-size:12px;color:#78858d;margin-bottom:15px">Lähetä tilapäivitys asiakkaalle ilman lisäkuluja.</p>
    
    <div class="card" style="margin-bottom:15px;background:#f5f8f9;padding:12px;border-radius:8px">
      <b style="font-size:11px;color:#60747d">Viestiluonnos (Suomi)</b>
      <p style="font-size:13px;line-height:1.5;margin:8px 0 0" id="notifyMsgText">${msg}</p>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px">
      <a href="${waLink}" target="_blank" class="wide-btn" style="background:#25d366;color:white;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;font-weight:600;padding:12px;border-radius:9px;border:0;">
        💬 WhatsApp
      </a>
      <a href="${smsLink}" class="wide-btn" style="background:#007aff;color:white;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;font-weight:600;padding:12px;border-radius:9px;border:0;">
        ✉️ SMS-viesti
      </a>
    </div>
    <button class="wide-btn" onclick="closeModal()" style="margin-top:12px;width:100%">Sulje</button>
  `;
  document.getElementById("modal").classList.remove("hidden");
}

function renderCalendar(){let g=document.getElementById("calGrid"),html="";for(let i=0;i<6;i++)html+='<div class="day"></div>';for(let d=1;d<=31;d++){let count=jobs.filter(j=>j.date.startsWith(String(d).padStart(2,"0")+".")).length;html+=`<div class="day ${d===23?'today':''}"><strong>${d}</strong>${count?`<span class="dot ${count>1?'r':'o'}"></span>`:""}</div>`}g.innerHTML=html}

function renderCustomers(){
  const customerMap = {};
  
  jobs.forEach(j => {
    const name = (j.name || "Uusi asiakas").trim();
    const phone = (j.phone || "").trim();
    const key = name.toLowerCase() + "|" + phone;
    
    if (!customerMap[key]) {
      customerMap[key] = {
        name: name,
        phone: phone,
        visits: 0,
        totalSpent: 0
      };
    }
    
    customerMap[key].visits += 1;
    customerMap[key].totalSpent += Number(j.price) || 0;
  });
  
  const customerList = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
  
  document.getElementById("customersGrid").innerHTML = customerList.map(c => {
    const initial = c.name ? c.name.charAt(0).toUpperCase() : "?";
    return `
      <div class="customer">
        <div class="person">
          <div class="person-icon" style="display:flex;align-items:center;justify-content:center;font-weight:bold;background:var(--primary-light);color:var(--primary);">${initial}</div>
          <div>
            <h3>${c.name}</h3>
            <p>${c.visits} käyntiä ${c.phone ? `· ${c.phone}` : ""}</p>
          </div>
        </div>
        <div class="money">${c.totalSpent} €</div>
        <p>Yhteensä</p>
      </div>
    `;
  }).join("");
}

function closeModal(){document.getElementById("modal").classList.add("hidden")}
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")closeModal()}

// Initialize Data and UI
initData();

/* V5: workshop-specific inbox override */
let waFilter="all";
function setWaFilter(f,btn){
  waFilter=f; document.querySelectorAll(".wa-filter").forEach(x=>x.classList.remove("active")); btn.classList.add("active"); renderWhatsappV5();
}

function renderWhatsappV5(){
  const q=(document.getElementById("chatSearch")?.value||"").toLowerCase();
  let a=requests.filter(r=>(r.name+r.product+r.work+r.msg).toLowerCase().includes(q));
  if(waFilter==="new")a=a.filter(r=>r.status==="new");
  if(waFilter==="bring")a=a.filter(r=>r.status==="bring");
  if(waFilter==="arrived")a=a.filter(r=>r.status==="arrived");
  const list=document.getElementById("chatList"); if(!list)return;
  list.innerHTML=a.map((r,i)=>`<div class="chat-item ${i===0?'active':''}" onclick="openWorkshopChat(${r.id},this)">
   <div class="chat-avatar">${r.name[0]}</div>
   <div class="chat-text"><b>${r.name}</b><p>${r.msg}</p><span class="pill ${r.status==='new'?'orange':r.status==='bring'?'teal':r.status==='arrived'?'blue':'teal'}">${r.status==="new"?"Uusi":r.status==="bring"?"Asiakas tuo":r.status==="arrived"?"Tuote saapui":"Vastattu"}</span></div>
   <div class="chat-time">${i<2?"18:2"+i:"eilen"}</div>
  </div>`).join("");
  if(a.length)openWorkshopChat(a[0].id,list.firstElementChild);
  else document.getElementById("chatWindow").innerHTML='<div class="empty-chat"><div class="wa-icon">⌕</div><h2>Kyselyä ei löytynyt</h2><p>Muuta suodatinta tai hakua.</p></div>';
}

function openWorkshopChat(id,el){
  document.querySelectorAll(".chat-item").forEach(x=>x.classList.remove("active")); if(el)el.classList.add("active");
  const r=requests.find(x=>x.id===id);
  const linked=jobs.find(j=>j.name===r.name);
  const status=r.status==="new"?"Uusi":r.status==="bring"?"Asiakas tuo":r.status==="arrived"?"Tuote saapui":r.status==="converted"?"Luotu työksi":"Vastattu";
  document.getElementById("chatWindow").innerHTML=`
  <div class="chat-head"><div class="chat-avatar">${r.name[0]}</div><div><b>${r.name}</b><small>${r.product} · ${r.work}</small></div><span class="chat-status">${status}</span></div>
  <div class="customer-context"><span>👜</span><strong>${r.product}</strong><span>· ${r.work}</span><span class="context-badge">${linked?linked.id:"Kysely #"+r.id}</span></div>
  <div class="messages">
    <div class="msg in">${r.msg}<small>18:21</small></div>
    ${r.reply?`<div class="msg out">${r.reply}<small>18:24 ✓✓</small></div>`:''}
    ${r.status==="bring"?`<div class="msg in">Tuon sen huomenna.<small>18:26</small></div>`:''}
    ${r.status==="arrived"?`<div class="msg in">Tuotu tänään. 😊<small>10:14</small></div>`:''}
  </div>
  ${r.status==="new"?`<div class="ai-suggest"><b>✨ AI-vastaussuositus</b>Hei! Kiitos kuvista ja viestistäsi! 😊 ${r.work} onnistuu. Lopullinen hinta varmistetaan, kun näemme tuotteen liikkeessä.<br><button class="side-action alt" onclick="useAiReplyV5(${r.id})">Käytä vastausta</button></div>`:''}
  <div class="quick-reply-row">
    <button class="quick-reply" onclick="sendTemplate(${r.id},'price')">💶 Hintatiedot</button>
    <button class="quick-reply" onclick="sendTemplate(${r.id},'bring')">📦 Tuomista varten</button>
    <button class="quick-reply" onclick="sendTemplate(${r.id},'ready')">✅ Valmis-viesti</button>
    <button class="quick-reply" onclick="sendTemplate(${r.id},'hours')">Aukioloajat</button>
  </div>
  <div class="chat-compose"><input id="waInput" placeholder="Kirjoita WhatsApp-viesti..."><button class="send-btn" onclick="sendManual(${r.id})">➤</button></div>`;
  
  document.getElementById("chatSide").innerHTML=`
    <div class="side-title">Työnkulku</div>
    <div class="workflow-box"><div class="wf-title">Kysely → Toimitus</div><div class="wf-track">
     <div class="wf-node done"><i>✓</i>Viesti</div><div class="wf-line"></div>
     <div class="wf-node ${r.status==="new"?"current":"done"}"><i>${r.status==="new"?"2":"✓"}</i>Vastaus</div><div class="wf-line"></div>
     <div class="wf-node ${r.status==="bring"?"current":(r.status==="arrived"||r.status==="converted")?"done":""}"><i>3</i>Tuo</div><div class="wf-line"></div>
     <div class="wf-node ${r.status==="arrived"||r.status==="converted"?"current":""}"><i>4</i>Tuote</div>
    </div></div>
    <div class="side-title">Asiakas</div>
    <div class="side-card"><b>${r.name}</b><p>WhatsApp<br>${r.product}</p></div>
    <div class="side-title">Työ</div>
    <div class="side-card"><b>${r.work}</b><p>Hinta: <strong>${linked?linked.price+" €":"45–60 €"}</strong><br>${linked?"📍 Hylly "+linked.loc:"📅 Odottaa tuotetta"}</p></div>
    ${r.status==="new"?`<button class="side-action" onclick="markBring(${r.id})">📅 ASIAKAS TUO</button>`:""}
    ${r.status==="bring"?`<button class="side-action" onclick="markArrived(${r.id})">📦 TUOTE SAAPUI</button>`:""}
    ${r.status==="arrived"?`<button class="side-action" onclick="openIntake(requests.find(x=>x.id===${r.id}))">🔧 LUO TYÖ</button>`:""}
    ${linked?`<button class="side-action alt" onclick="openJob('${linked.id}')">⚒ Avaa työ ${linked.id}</button>`:""}
    <div class="side-title" style="margin-top:14px">Pikavastaukset</div>
    <div class="template-list"><div class="template" onclick="sendTemplate(${r.id},'price')">Hinta-arvio</div><div class="template" onclick="sendTemplate(${r.id},'bring')">Tuonti</div><div class="template" onclick="sendTemplate(${r.id},'ready')">Valmis</div></div>`;
}

function markBring(id){let r=requests.find(x=>x.id===id);r.status="bring";r.reply="Hei! Tervetuloa tuomaan tuotteen meille. 😊";saveState();dbUpsertRequest(r);renderWhatsappV5()}
function markArrived(id){let r=requests.find(x=>x.id===id);r.status="arrived";saveState();dbUpsertRequest(r);renderWhatsappV5();openWorkshopChat(id)}
function useAiReplyV5(id){let r=requests.find(x=>x.id===id);r.reply=`Hei! Kiitos kuvista ja viestistäsi! 😊 ${r.work} onnistuu. Lopullinen hinta varmistetaan, kun näemme tuotteen liikkeessä.`;r.status="answered";saveState();dbUpsertRequest(r);renderWhatsappV5()}
function sendTemplate(id,type){
  let r=requests.find(x=>x.id===id), text={
    price:"Hei! Kiitos viestistäsi! 😊 Hinta-arvio on noin 45–60 €. Lopullinen hinta varmistetaan liikkeessä.",
    bring:"Hei! Tervetuloa tuomaan tuotteen meille, kun sinulle sopii. 😊",
    ready:"Hei! 😊 Työsi on valmis ja voit noutaa sen liikkeestämme.",
    hours:"Hei! Olemme avoinna arkisin. Tervetuloa!"
  }[type];
  r.reply=text;r.status=type==="ready"?"ready":type==="bring"?"bring":"answered";saveState();dbUpsertRequest(r);renderWhatsappV5();
}
function sendManual(id){const inp=document.getElementById("waInput");if(!inp||!inp.value.trim())return;let r=requests.find(x=>x.id===id);r.reply=inp.value;r.status="answered";saveState();dbUpsertRequest(r);renderWhatsappV5()}
renderWhatsappV5();

/* V6 Manual WhatsApp import */
function openImportModal(){document.getElementById("importModal").style.display="grid";document.getElementById("extracted").style.display="none";}
function closeImportModal(){document.getElementById("importModal").style.display="none";}
function setImportTab(tab,btn){document.querySelectorAll(".itab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");document.getElementById("imageImport").style.display=tab==="image"?"block":"none";document.getElementById("textImport").style.display=tab==="text"?"block":"none";}
let uploadedImageBase64 = null;
let uploadedImageMimeType = null;

function previewImportImage(e){
  const f=e.target.files?.[0];
  if(!f)return;
  uploadedImageMimeType = f.type;
  const img=document.getElementById("importPreview");
  img.src=URL.createObjectURL(f);
  img.style.display="block";
  document.getElementById("dropContent").style.display="none";
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    uploadedImageBase64 = evt.target.result.split(",")[1];
  };
  reader.readAsDataURL(f);
}

function guessFields(text){
  text=(text||"").trim(); const t=text.toLowerCase();
  let product=/laukku|bag|käsilaukku/.test(t)?"Käsilaukku":/kenkä|shoe|keng/.test(t)?"Kengät":/takki|jacket/.test(t)?"Takki":"Tuote";
  let work=/vetoketju|zipper/.test(t)?"Vetoketjun korjaus":/pohja|sole/.test(t)?"Pohjan korjaus":/sauma|ommel/.test(t)?"Dikiö / Sauma":"Korjausarvio";
  return {product,work};
}

function fillExtracted(text,defaults={}){
  const g=guessFields(text);
  document.getElementById("exName").value=defaults.name||"";
  document.getElementById("exPhone").value=defaults.phone||"";
  document.getElementById("exProduct").value=defaults.product||g.product;
  document.getElementById("exWork").value=defaults.work||g.work;
  document.getElementById("exPrice").value=defaults.price||"";
  document.getElementById("exReplyText").value=defaults.reply||"";
  document.getElementById("exMessage").value=text||"WhatsApp-viestistä tuotu kysely.";
  document.getElementById("extracted").style.display="block";
}

async function showExtracted(){
  const apiKey = localStorage.getItem("suutari_gemini_key");
  
  if (!apiKey) {
    fillExtracted("", {name: "", phone: "", product: "", work: "", price: "", reply: ""});
    return;
  }

  const btn = document.querySelector("#imageImport .analyze-btn");
  const oldText = btn.textContent;
  btn.textContent = "Analysoidaan... ⌛";
  btn.disabled = true;
  
  let result = null;
  if (uploadedImageBase64 && uploadedImageMimeType) {
    result = await analyzeImageWithAI(uploadedImageBase64, uploadedImageMimeType);
  }
  
  btn.textContent = oldText;
  btn.disabled = false;
  
  if (result) {
    fillExtracted("", {
      name: result.name || "Asiakas",
      phone: result.phone || "",
      product: result.product || "",
      work: result.work || "",
      price: result.price || "",
      reply: result.reply || ""
    });
  } else {
    fillExtracted("", {name: "", phone: "", product: "", work: "", price: "", reply: ""});
  }
}

async function extractFromText(){
  const t=document.getElementById("pasteMessage").value;
  if(!t.trim()){alert("Liitä WhatsApp-viesti.");return;}
  
  const apiKey = localStorage.getItem("suutari_gemini_key");
  if (!apiKey) {
    const g = guessFields(t);
    fillExtracted(t, {name: "Asiakas", phone: "", product: g.product, work: g.work, price: "", reply: ""});
    return;
  }

  const btn = document.querySelector("#textImport .analyze-btn");
  const oldText = btn.textContent;
  btn.textContent = "Analysoidaan... ⌛";
  btn.disabled = true;
  
  let result = null;
  if (apiKey) {
    result = await parseMessageWithAI(t);
  }
  
  btn.textContent = oldText;
  btn.disabled = false;
  
  if (result) {
    fillExtracted(t, {
      name: result.name || "Asiakas",
      phone: result.phone || "",
      product: result.product || "",
      work: result.work || "",
      price: result.price || "",
      reply: result.reply || ""
    });
  } else {
    const g = guessFields(t);
    fillExtracted(t, {name: "Asiakas", phone: "", product: g.product, work: g.work, price: "", reply: ""});
  }
}
function saveImportedRequest(){
  const name=document.getElementById("exName").value.trim()||"Uusi asiakas";
  const product=document.getElementById("exProduct").value.trim()||"Tuote";
  const work=document.getElementById("exWork").value.trim()||"Korjausarvio";
  const msg=document.getElementById("exMessage").value.trim();
  const status=document.getElementById("exStatus").value;
  const newReq = {id:Date.now(),name,product,work,msg,status,reply:"",source:"whatsapp",request_id:makeRequestId("whatsapp"),customer_id:makeCustomerId(),created_at:new Date().toISOString().slice(0,10),price:""};
  requests.unshift(newReq);
  saveState();
  dbUpsertRequest(newReq);
  closeImportModal();waFilter="all";renderWhatsappV5();
  const page=document.querySelector('[data-page="inbox"]');if(page)page.click();
}

/* V7 data model + reports/export */
const SOURCE_META={store:{code:"S",label:"Myymälä",icon:"🏪"},whatsapp:{code:"W",label:"WhatsApp",icon:"💬"},email:{code:"E",label:"Sähköposti",icon:"✉️"},post:{code:"P",label:"Posti",icon:"📦"}};
function makeRequestId(source){requestSeq[source]=(requestSeq[source]||0)+1;return `${SOURCE_META[source].code}-2026-${String(requestSeq[source]).padStart(6,"0")}`}
function makeCustomerId(){customerSeq++;return `C-2026-${String(customerSeq).padStart(6,"0")}`}
function makeJobId(){jobSeq++;return `J-2026-${String(jobSeq).padStart(6,"0")}`}
function normalizeRequests(){requests.forEach(r=>{r.source=r.source||"whatsapp";r.request_id=r.request_id||makeRequestId(r.source);r.customer_id=r.customer_id||makeCustomerId();r.created_at=r.created_at||"2026-08-24";if(r.status==="converted"&&!r.job_id)r.job_id=makeJobId();if(r.price===undefined)r.price=""})}
function addDemoSources(){let b=requests[0]||{name:"Anna Virtanen",product:"Käsilaukku",work:"Vetoketjun korjaus",msg:"Hei!",status:"new"};let d=[{...b,id:90001,name:"Mikko Laine",product:"Kengät",work:"Pohjan korjaus",msg:"Voitteko korjata pohjan?",status:"converted",source:"store",request_id:"S-2026-000146",customer_id:"C-2026-000422",created_at:"2026-08-22",job_id:"J-2026-00153",price:75},{...b,id:90002,name:"Sara Niemi",product:"Laukku",work:"Sauman korjaus",msg:"Paljonko maksaa?",status:"answered",source:"email",request_id:"E-2026-000033",customer_id:"C-2026-000423",created_at:"2026-08-23",price:""},{...b,id:90003,name:"John Smith",product:"Nahkatakki",work:"Vetoketjun vaihto",msg:"Lähetän takin postissa.",status:"bring",source:"post",request_id:"P-2026-000020",customer_id:"C-2026-000424",created_at:"2026-08-24",price:90}];d.forEach(x=>{if(!requests.some(r=>r.request_id===x.request_id))requests.push(x)});normalizeRequests();saveState();}
addDemoSources();
function getExportData(){let f=document.getElementById("exportFrom")?.value||"",t=document.getElementById("exportTo")?.value||"",s=document.getElementById("exportSource")?.value||"all",st=document.getElementById("exportStatus")?.value||"all";return requests.filter(r=>(!f||(r.created_at||"")>=f)&&(!t||(r.created_at||"")<=t)&&(s==="all"||r.source===s)&&(st==="all"||r.status===st))}

function renderReports(){
  normalizeRequests();
  let d=getExportData(),total=requests.length,conv=requests.filter(r=>r.job_id).length,rev=requests.reduce((a,r)=>a+(Number(r.price)||0),0);
  document.getElementById("rTotal").textContent=total;
  document.getElementById("rConverted").textContent=conv;
  document.getElementById("rPending").textContent=total-conv;
  document.getElementById("rConversion").textContent=(total?Math.round(conv/total*100):0)+"% konversio";
  document.getElementById("rRevenue").textContent="€"+rev;
  
  let src=document.getElementById("sourceStats"),mx=Math.max(1,...Object.keys(SOURCE_META).map(s=>requests.filter(r=>r.source===s).length));
  src.innerHTML=Object.keys(SOURCE_META).map(s=>{let n=requests.filter(r=>r.source===s).length,m=SOURCE_META[s];return `<div class="source-row"><span>${m.icon} ${m.label}</span><div class="bar"><i style="width:${n/mx*100}%"></i></div><b>${n}</b></div>`}).join("");
  
  let sts=[["new","Uusi"],["answered","Vastattu"],["bring","Asiakas tuo"],["arrived","Tuote saapui"],["converted","Työn alla"],["ready","Valmis"],["delivered","Luovutettu"]],sm=Math.max(1,...sts.map(x=>requests.filter(r=>r.status===x[0]).length));
  document.getElementById("statusStats").innerHTML=sts.map(x=>{let n=requests.filter(r=>r.status===x[0]).length;return `<div class="status-row"><span>${x[1]}</span><div class="bar"><i style="width:${n/sm*100}%"></i></div><b>${n}</b></div>`}).join("");
  
  document.getElementById("exportTable").innerHTML=d.map(r=>`<tr><td>${r.request_id}</td><td><span class="source-pill">${SOURCE_META[r.source]?.icon||""} ${SOURCE_META[r.source]?.label||r.source}</span></td><td>${r.customer_id||""}</td><td>${r.created_at||""}</td><td>${r.product||""}</td><td>${r.work||""}</td><td><span class="status-pill">${r.status||""}</span></td><td>${r.price!==""&&r.price!=null?"€"+r.price:""}</td><td>${r.job_id||"—"}</td></tr>`).join("")||'<tr><td colspan="9" class="empty-row">Ei hakuehtoja vastaavia tietoja.</td></tr>';
  document.getElementById("previewCount").textContent=d.length+" tilausta";
}

function csvRows(){let d=getExportData();return [["Request ID","Source","Customer ID","Date","Product","Service","Status","Price","Job ID"],...d.map(r=>[r.request_id,r.source,r.customer_id,r.created_at,r.product,r.work,r.status,r.price,r.job_id||""])]}
function exportCSV(){let rows=csvRows(),csv="\uFEFF"+rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n"),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="tehtaankatu_suutari_export.csv";a.click()}
function exportExcel(){let rows=csvRows(),table="<table><tr>"+rows[0].map(x=>`<th>${x}</th>`).join("")+"</tr>"+rows.slice(1).map(r=>"<tr>"+r.map(x=>`<td>${x??""}</td>`).join("")+"</tr>").join("")+"</table>",a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff<html><meta charset='UTF-8'><body>"+table+"</body></html>"],{type:"application/vnd.ms-excel"}));a.download="tehtaankatu_suutari_export.xls";a.click()}
["exportFrom","exportTo","exportSource","exportStatus"].forEach(id=>document.getElementById(id)?.addEventListener("change",renderReports));

// Settings operations
function saveSettings() {
  const url = document.getElementById("dbUrl").value.trim();
  const key = document.getElementById("dbKey").value.trim();
  localStorage.setItem("suutari_db_url", url);
  localStorage.setItem("suutari_db_key", key);
  const statusEl = document.getElementById("connStatus");
  statusEl.style.display = "block";

  if (typeof supabase === 'undefined') {
    statusEl.textContent = "Asetukset tallennettu, mutta Supabase SDK-kirjastoa ei ole ladattu. Varmista verkkoyhteys.";
    statusEl.style.color = "red";
    return;
  }

  if(url && key) {
    initSupabase();
    statusEl.textContent = "Asetukset tallennettu! Yritetään yhdistää...";
    statusEl.style.color = "var(--teal)";
    syncFromDb().then(success => {
      if(success) {
        statusEl.textContent = "Yhdistetty ja synkronoitu Supabasen kanssa!";
        statusEl.style.color = "var(--teal)";
        renderHome();
      } else {
        statusEl.textContent = "Yhteys onnistui, mutta taulujen alustus puuttuu Supabasesta. Suorita SQL-alustuskoodi.";
        statusEl.style.color = "orange";
      }
    });
  } else {
    supabaseClient = null;
    statusEl.textContent = "Supabase otettu pois käytöstä. Käytetään paikallista demo-tilaa.";
    statusEl.style.color = "var(--text-muted)";
  }
}

async function testConnection() {
  const url = document.getElementById("dbUrl").value.trim();
  const key = document.getElementById("dbKey").value.trim();
  const statusEl = document.getElementById("connStatus");
  statusEl.style.display = "block";
  statusEl.textContent = "Yhdistetään...";
  statusEl.style.color = "var(--text-muted)";
  
  if (typeof supabase === 'undefined') {
    statusEl.textContent = "Yhteys epäonnistui: Supabase SDK-kirjastoa ei ladattu. Varmista verkkoyhteys.";
    statusEl.style.color = "red";
    return;
  }

  try {
    const client = supabase.createClient(url, key);
    const { error } = await client.from("jobs").select("count");
    if(error) throw error;
    statusEl.textContent = "Yhteys muodostettu onnistuneesti! Tietokanta vastaa.";
    statusEl.style.color = "var(--teal)";
  } catch(err) {
    statusEl.textContent = "Yhteys epäonnistui (Varmista SQL-alustus): " + err.message;
    statusEl.style.color = "red";
  }
}

function copySQLSetup() {
  const sql = `-- Create requests table\\nCREATE TABLE IF NOT EXISTS requests (\\n    id BIGINT PRIMARY KEY,\\n    name TEXT,\\n    product TEXT,\\n    work TEXT,\\n    status TEXT,\\n    img TEXT,\\n    msg TEXT,\\n    reply TEXT,\\n    source TEXT,\\n    request_id TEXT UNIQUE,\\n    customer_id TEXT,\\n    created_at TEXT,\\n    price TEXT,\\n    job_id TEXT\\n);\\n\\n-- Create jobs table\\nCREATE TABLE IF NOT EXISTS jobs (\\n    id TEXT PRIMARY KEY,\\n    name TEXT,\\n    phone TEXT,\\n    product TEXT,\\n    work TEXT,\\n    price NUMERIC,\\n    date TEXT,\\n    status TEXT,\\n    loc TEXT,\\n    img TEXT,\\n    img_after TEXT,\\n    note TEXT,\\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\\n);\\n\\n-- Enable Row Level Security (RLS)\\nALTER TABLE requests ENABLE ROW LEVEL SECURITY;\\nALTER TABLE jobs ENABLE ROW LEVEL SECURITY;\\n\\n-- Create policies for public access\\nCREATE POLICY "Allow public read" ON requests FOR SELECT USING (true);\\nCREATE POLICY "Allow public insert" ON requests FOR INSERT WITH CHECK (true);\\nCREATE POLICY "Allow public update" ON requests FOR UPDATE USING (true);\\n\\nCREATE POLICY "Allow public read" ON jobs FOR SELECT USING (true);\\nCREATE POLICY "Allow public insert" ON jobs FOR INSERT WITH CHECK (true);\\nCREATE POLICY "Allow public update" ON jobs FOR UPDATE USING (true);\\n\\n-- SECURITY UPDATE: Secure lookup function for customers (hides phone and names)\\nCREATE OR REPLACE FUNCTION get_job_status(job_id TEXT)\\nRETURNS TABLE(id TEXT, product TEXT, work TEXT, status TEXT, date TEXT, img TEXT, img_after TEXT) AS $$\\nBEGIN\\n  RETURN QUERY\\n  SELECT j.id, j.product, j.work, j.status, j.date, j.img, j.img_after\\n  FROM jobs j\\n  WHERE j.id = job_id;\\nEND;\\n$$ LANGUAGE plpgsql SECURITY DEFINER;\\n\\n-- Grant execute permissions\\nGRANT EXECUTE ON FUNCTION get_job_status(TEXT) TO anon;\\nGRANT EXECUTE ON FUNCTION get_job_status(TEXT) TO authenticated;`;
  navigator.clipboard.writeText(sql.replace(/\\n/g, '\n')).then(() => {
    alert("SQL-alustuskoodi kopioitu leikepöydälle!");
  });
}

function saveGeminiSettings() {
  const key = document.getElementById("geminiKey").value.trim();
  localStorage.setItem("suutari_gemini_key", key);
  const statusEl = document.getElementById("aiStatus");
  statusEl.style.display = "block";
  if(key) {
    statusEl.textContent = "AI-asetukset tallennettu! Voit nyt käyttää automaattista tekoälyanalyysiä.";
    statusEl.style.color = "var(--teal)";
  } else {
    statusEl.textContent = "AI-avain poistettu. Käytetään manuaalisia oletuksia.";
    statusEl.style.color = "var(--text-muted)";
  }
}

async function parseMessageWithAI(text) {
  const apiKey = localStorage.getItem("suutari_gemini_key");
  if (!apiKey) return null;
  
  const instructions = localStorage.getItem("suutari_ai_instructions") || "";
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
  
  const prompt = `Lue seuraava WhatsApp-keskustelu tai viesti ja poimi siitä tiedot JSON-muodossa. 
Vastaa AINOASTAAN puhtaalla JSON-objektilla, älä käytä markdown-koodiblokkeja tai mitään selityksiä.

Tässä ovat ateljeen omistajan antamat hinnasto- ja työsäännöt, joita sinun on EHDOTTOMASTI noudatettava tehdessäsi hinta-arviota ja vastausta:
${instructions}

JSON-objektin on oltava täsmälleen seuraavassa muodossa:
{
  "name": "Asiakkaan nimi (jos löytyy, muuten tyhjä)",
  "phone": "Asiakkaan puhelinnumero (jos löytyy, muuten tyhjä)",
  "product": "Tuote Finceksi (esim. Käsilaukku, Nahkakengät, Takki)",
  "work": "Tarvittava korjaustyö Finceksi lyhyesti (esim. Vetoketjun korjaus, Koron korjaus)",
  "price": "Arvioitu hinta numeroina (esim. 45)",
  "reply": "Kunnioittava ja ystävällinen vastaus viestiin Fince. Ehdota arvioitua hintaa ja toivota heidät tervetulleiksi tuomaan tuote Tehtaankatu 18 -liikkeeseemme."
}

Viesti:
"${text}"`;

  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await res.json();
      if (res.ok && data.candidates && data.candidates[0]) {
        const resultText = data.candidates[0].content.parts[0].text.trim();
        let cleanText = resultText.trim();
        const firstBracket = cleanText.indexOf('{');
        const lastBracket = cleanText.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1) {
          cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        }
        return JSON.parse(cleanText);
      }
    } catch (err) {
      console.warn(`Model ${model} failed on parse message, trying next...`, err);
    }
  }
  
  alert("Google Gemini API Virhe: Mikään käytettävissä olevista malleista (Gemini 1.5 Flash, Gemini Pro) ei vastannut. Varmista, että API-avaimesi on luotu oikein Google AI Studiossa.");
  return null;
}

async function analyzeImageWithAI(base64Data, mimeType) {
  const apiKey = localStorage.getItem("suutari_gemini_key");
  if (!apiKey) return null;
  
  const instructions = localStorage.getItem("suutari_ai_instructions") || "";
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
  
  const prompt = `Olet suutarin ja nahan korjauksen ammattilainen. Analysoi tämä kuva vauriosta/tuotteesta ja poimi tiedot JSON-muodossa. 
Vastaa AINOASTAAN puhtaalla JSON-objektilla, älä käytä markdown-koodiblokkeja tai mitään selityksiä.

Tässä ovat ateljeen omistajan antamat hinnasto- ja työsäännöt, joita sinun on EHDOTTOMASTI noudatettava tehdessäsi hinta-arviota ja vastausta:
${instructions}

JSON-objektin on oltava täsmälleen seuraavassa muodossa:
{
  "name": "Asiakas",
  "phone": "",
  "product": "Tunnistettu tuote Finceksi (esim. Käsilaukku, Kengät, Saappaat)",
  "work": "Tarvittava korjaustyö kuvan perusteella Finceksi lyhyesti (esim. Vetoketjun vaihto, Koron uusiminen, Sauman tikkaus)",
  "price": "Arvioitu hinta numeroina (esim. 45)",
  "reply": "Kunnioittava ja ystävällinen vastaus asiakkaan kuvaan Fince. Ehdota vaurion perusteella arvioitua hintaa ja toivota heidät tervetulleiksi tuomaan tuote Tehtaankatu 18 -liikkeeseemme."
}

Jos et pysty tunnistamaan tuotetta tai työtä varmasti, arvaa parhaan kykysi mukaan.`;

  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }]
        })
      });
      const data = await res.json();
      if (res.ok && data.candidates && data.candidates[0]) {
        const resultText = data.candidates[0].content.parts[0].text.trim();
        let cleanText = resultText.trim();
        const firstBracket = cleanText.indexOf('{');
        const lastBracket = cleanText.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1) {
          cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        }
        return JSON.parse(cleanText);
      }
    } catch (err) {
      console.warn(`Model ${model} failed on image analysis, trying next...`, err);
    }
  }
  
  alert("Google Gemini API Virhe: Kuvan analysointi epäonnistui kaikilla saatavilla olevilla malleilla. Varmista API-avain.");
  return null;
}

let afterImageBase64 = null;

function loadAfterImage(e) {
  const f = e.target.files?.[0];
  if(!f) return;
  
  const preview = document.getElementById("afterImgPreview");
  const dropText = document.getElementById("afterDropText");
  
  preview.src = URL.createObjectURL(f);
  preview.style.display = "block";
  dropText.style.display = "none";
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    afterImageBase64 = evt.target.result;
    
    const select = document.getElementById("socialJobSelect");
    const jobId = select.value;
    if (jobId) {
      const j = jobs.find(x => x.id === jobId);
      if (j) {
        j.img_after = afterImageBase64;
        saveState();
        dbUpdateJobAfterImage(jobId, afterImageBase64);
      }
    }
  };
  reader.readAsDataURL(f);
}

function renderSocial() {
  document.getElementById("postMon").checked = localStorage.getItem("social_post_mon") === "true";
  document.getElementById("postWed").checked = localStorage.getItem("social_post_wed") === "true";
  document.getElementById("postFri").checked = localStorage.getItem("social_post_fri") === "true";
  updateSocialProgress();

  const relevantJobs = jobs.filter(j => j.status === "ready" || j.status === "done" || j.status === "active");
  const select = document.getElementById("socialJobSelect");
  
  if (relevantJobs.length === 0) {
    select.innerHTML = `<option value="">Ei aktiivisia tai valmiita töitä</option>`;
    return;
  }
  
  select.innerHTML = relevantJobs.map(j => `<option value="${j.id}">${j.id} - ${j.name} (${j.product})</option>`).join("");
  loadJobForSocial();
}

function updateSocialProgress() {
  localStorage.setItem("social_post_mon", document.getElementById("postMon").checked);
  localStorage.setItem("social_post_wed", document.getElementById("postWed").checked);
  localStorage.setItem("social_post_fri", document.getElementById("postFri").checked);
  
  const count = [document.getElementById("postMon").checked, document.getElementById("postWed").checked, document.getElementById("postFri").checked].filter(Boolean).length;
  
  const ideaText = document.getElementById("socialIdeaText");
  if (count === 0) {
    ideaText.textContent = "Maanantai suositus: Jaa Google Mapsissa uusi hyödyllinen vinkki (esim. nahanhoito syksyllä).";
  } else if (count === 1) {
    ideaText.textContent = "Keskiviikko suositus: Jaa lyhyt kuva tai tarina meneillään olevasta työstänne (🔧 Työn alla).";
  } else if (count === 2) {
    ideaText.textContent = "Perjantai suositus: Luo upea \"Ennen & Jälkeen\" -kuva ja julkaise se viikonlopuksi!";
  } else {
    ideaText.textContent = "✨ Upeaa työtä! Viikon julkaisutavoite (3 postausta) on saavutettu!";
  }
}

function loadJobForSocial() {
  const select = document.getElementById("socialJobSelect");
  const jobId = select.value;
  if (!jobId) return;
  
  const j = jobs.find(x => x.id === jobId);
  if (!j) return;
  
  document.getElementById("beforeImgPreview").src = j.img || "bag.png";
  
  const afterPreview = document.getElementById("afterImgPreview");
  const afterDropText = document.getElementById("afterDropText");
  
  if (j.img_after) {
    afterImageBase64 = j.img_after;
    afterPreview.src = j.img_after;
    afterPreview.style.display = "block";
    afterDropText.style.display = "none";
  } else {
    afterImageBase64 = null;
    afterPreview.src = "";
    afterPreview.style.display = "none";
    afterDropText.style.display = "block";
  }
  
async function generateAISocialPost() {
  const select = document.getElementById("socialJobSelect");
  const jobId = select.value;
  if (!jobId) {
    alert("Valitse ensin työ listasta.");
    return;
  }
  
  const j = jobs.find(x => x.id === jobId);
  if (!j) return;
  
  const apiKey = localStorage.getItem("suutari_gemini_key");
  if (!apiKey) {
    const fallbackText = `🔨 Ennen & Jälkeen - Korjaus valmis!\n\nTeimme upean korjauksen tähän tuotteeseen: ${j.product} (${j.work}). Kengät tai laukku ovat nyt valmiina uusiin seikkailuihin! \n\nTervetuloa huoltamaan suosikkituotteesi ateljeehenne.\n\n📍 Tehtaankatu 18, Helsinki\n#suutari #helsinki #kenkähuolto`;
    document.getElementById("aiCaptionText").textContent = fallbackText;
    document.getElementById("aiCaptionCard").style.display = "block";
    return;
  }
  
  const btn = document.getElementById("btnGenerateSocial");
  const oldText = btn.textContent;
  btn.textContent = "AI kirjoittaa... 🪄";
  btn.disabled = true;
  
  const prompt = `Olet ammattitaitoinen suutari ja sisällöntuottaja Tehtaankatu Suutari -liikkeelle Helsingissä.
Kirjoita mukaansatempaava ja ammattimainen sosiaalisen median julkaisuteksti (Instagram, Facebook tai Google Maps) Fince seuraavasta valmiista työstä:
- Tuote: ${j.product}
- Tehty korjaus: ${j.work}
- Hinta: ${j.price} €

Sisällytä tekstiin sopivia emojiyhdistelmiä (kuten 🔨, 🥾, 👜, ✨), osoite "Tehtaankatu 18, Helsinki" sekä suosittuja hashtageja (kuten #suutari #helsinki #kenkähuolto #nahkatyöt). Pidä sävy ystävällisenä, paikallisena ja laatuun keskittyvänä. Vastaa AINOASTAAN valmiilla julkaisutekstillä.`;

  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
  let success = false;
  
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await res.json();
      if (res.ok && data.candidates && data.candidates[0]) {
        const caption = data.candidates[0].content.parts[0].text.trim();
        document.getElementById("aiCaptionText").textContent = caption;
        document.getElementById("aiCaptionCard").style.display = "block";
        success = true;
        break;
      }
    } catch (err) {
      console.warn(`Social generator model ${model} failed, trying next...`, err);
    }
  }
  
  if (!success) {
    alert("AI-tekstin luominen epäonnistui. Käytetään valmista pohjaa.");
    const fallbackText = `🔨 Ennen & Jälkeen - Korjaus valmis!\n\nTeimme upean korjauksen tähän tuotteeseen: ${j.product} (${j.work}). Kengät tai laukku ovat nyt valmiina uusiin seikkailuihin! \n\nTervetuloa huoltamaan suosikkituotteesi ateljeehenne.\n\n📍 Tehtaankatu 18, Helsinki\n#suutari #helsinki #kenkähuolto`;
    document.getElementById("aiCaptionText").textContent = fallbackText;
    document.getElementById("aiCaptionCard").style.display = "block";
  }
  
  btn.textContent = oldText;
  btn.disabled = false;
}

function combineImages() {
  const select = document.getElementById("socialJobSelect");
  const jobId = select.value;
  if (!jobId) return;
  
  const j = jobs.find(x => x.id === jobId);
  if (!j) return;
  
  const beforeSrc = j.img || "bag.png";
  const afterSrc = afterImageBase64 || "bag.png";
  
  const canvas = document.getElementById("combinedCanvas");
  const ctx = canvas.getContext("2d");
  
  const imgBefore = new Image();
  const imgAfter = new Image();
  
  let loadedCount = 0;
  function onImageLoaded() {
    loadedCount++;
    if (loadedCount === 2) {
      const width = 1200;
      const height = 600;
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(imgBefore, 0, 0, width/2, height);
      ctx.drawImage(imgAfter, width/2, 0, width/2, height);
      
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(width/2, 0);
      ctx.lineTo(width/2, height);
      ctx.stroke();
      
      ctx.fillStyle = "rgba(15, 45, 74, 0.85)";
      ctx.font = "bold 24px 'Inter', sans-serif";
      
      ctx.fillRect(15, 15, 120, 40);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("ENNEN", 30, 44);
      
      ctx.fillStyle = "rgba(16, 185, 129, 0.85)";
      ctx.fillRect(width/2 + 15, 15, 140, 40);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("JÄLKEEN", width/2 + 30, 44);
      
      const wm = document.getElementById("watermarkText").value || "Tehtaankatu Suutari";
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, height - 50, width, 50);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 18px 'Inter', sans-serif";
      ctx.fillText(wm, 25, height - 18);
      ctx.fillText("✨ Tehty Suomessa", width - 200, height - 18);
      
      document.getElementById("combinedCanvasCard").style.display = "block";
    }
  }
  
  imgBefore.onload = onImageLoaded;
  imgAfter.onload = onImageLoaded;
  
  imgBefore.src = beforeSrc;
  imgAfter.src = afterSrc;
}

function downloadCombinedImage() {
  const canvas = document.getElementById("combinedCanvas");
  const select = document.getElementById("socialJobSelect");
  const jobId = select.value || "suutari";
  
  const link = document.createElement("a");
  link.download = `ennen_jalkeen_${jobId}.jpg`;
  link.href = canvas.toDataURL("image/jpeg", 0.9);
  link.click();
}

let selectedShelf = null;

function renderShelves() {
  const rows = ["A", "B", "C"];
  const numCells = 8;

  rows.forEach(r => {
    let cellsHtml = "";
    for (let i = 1; i <= numCells; i++) {
      const cellCode = `${r}${i}`;
      
      const shelfJobs = jobs.filter(j => j.status !== "done" && j.loc.trim().toUpperCase().startsWith(cellCode));
      const jobCount = shelfJobs.length;
      const hasLate = shelfJobs.some(j => j.status === "late");
      
      let classes = "shelf-cell";
      if (selectedShelf === cellCode) classes += " selected";
      if (hasLate) classes += " late";
      else if (jobCount > 0) classes += " filled";
      
      cellsHtml += `
        <div class="${classes}" onclick="selectShelf('${cellCode}')">
          ${cellCode}
          ${jobCount > 0 ? `<span class="badge">${jobCount}</span>` : ""}
        </div>
      `;
    }
    document.getElementById(`row${r}Cells`).innerHTML = cellsHtml;
  });
  
  if (selectedShelf) {
    showShelfDetails(selectedShelf);
  } else {
    document.getElementById("selectedShelfTitle").textContent = "Valitse hylly";
    document.getElementById("shelfJobList").innerHTML = `
      <div class="empty-row" style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px 0;">
        Klikkaa hyllysolua nähdäksesi sen sisällön.
      </div>
    `;
  }
}

function selectShelf(shelfCode) {
  selectedShelf = shelfCode;
  renderShelves();
}

function showShelfDetails(shelfCode) {
  document.getElementById("selectedShelfTitle").textContent = `Hylly ${shelfCode}`;
  
  const shelfJobs = jobs.filter(j => j.status !== "done" && j.loc.trim().toUpperCase().startsWith(shelfCode));
  
  if (shelfJobs.length === 0) {
    document.getElementById("shelfJobList").innerHTML = `
      <div class="empty-row" style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px 0;">
        Hylly on tyhjä.
      </div>
    `;
    return;
  }
  
  document.getElementById("shelfJobList").innerHTML = shelfJobs.map(j => `
    <div class="shelf-job-row" onclick="openJob('${j.id}')">
      <div>
        <b style="font-size:14px;display:block;">${j.id} · ${j.name}</b>
        <small style="font-size:11px;color:var(--text-muted)">${j.product} (${j.loc})</small>
      </div>
      <div>
        <span class="pill ${j.status==='late'?'red':j.status==='waiting'?'orange':'teal'}">${statusLabel[j.status] || j.status}</span>
      </div>
    </div>
  `).join("");
}

function saveAIInstructions() {
  const text = document.getElementById("aiInstructions").value;
  localStorage.setItem("suutari_ai_instructions", text);
  const status = document.getElementById("aiInstructionsStatus");
  status.textContent = "AI-ohjeet tallennettu onnistuneesti!";
  status.style.color = "var(--teal)";
  status.style.display = "block";
}

function sendWhatsAppReply() {
  const phone = document.getElementById("exPhone").value.replace(/[^0-9+]/g, "") || "0400000000";
  const replyText = encodeURIComponent(document.getElementById("exReplyText").value);
  const link = `https://wa.me/${phone}?text=${replyText}`;
  window.open(link, "_blank");
}

function convertRequestToJob() {
  const prefill = {
    name: document.getElementById("exName").value,
    phone: document.getElementById("exPhone").value,
    product: document.getElementById("exProduct").value,
    work: document.getElementById("exWork").value,
    price: document.getElementById("exPrice").value,
    img: uploadedImageBase64 || null
  };
  closeModal();
  openIntake(prefill);
}

function checkAuth() {
  const loggedIn = sessionStorage.getItem("suutari_auth");
  const loginScreen = document.getElementById("loginScreen");
  if (loggedIn === "true") {
    loginScreen.style.display = "none";
  } else {
    loginScreen.style.display = "flex";
  }
}

function login() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();
  const storedUser = localStorage.getItem("suutari_admin_user") || "suutari";
  const storedPass = localStorage.getItem("suutari_admin_pass") || "suutari2026";
  const errEl = document.getElementById("loginError");

  if (user === storedUser && pass === storedPass) {
    sessionStorage.setItem("suutari_auth", "true");
    document.getElementById("loginScreen").style.display = "none";
    errEl.style.display = "none";
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    initData();
  } else {
    errEl.style.display = "block";
  }
}

function logout() {
  sessionStorage.removeItem("suutari_auth");
  checkAuth();
}

function saveAuthSettings() {
  const user = document.getElementById("settingsUser").value.trim();
  const pass = document.getElementById("settingsPass").value.trim();
  const status = document.getElementById("authSettingsStatus");
  status.style.display = "block";

  if (!user) {
    status.textContent = "Käyttäjätunnus ei voi olla tyhjä!";
    status.style.color = "var(--red)";
    return;
  }

  localStorage.setItem("suutari_admin_user", user);
  if (pass) {
    localStorage.setItem("suutari_admin_pass", pass);
  }
  
  status.textContent = "Kirjautumisasetukset tallennettu onnistuneesti!";
  status.style.color = "var(--teal)";
  document.getElementById("settingsPass").value = "";
}

checkAuth();
