  const firebaseConfig = {
    apiKey: "AIzaSyANr1kiQuEzA03fhyyNTLSr9d7nQt8dWWU",
    authDomain: "system-b1.firebaseapp.com",
    projectId: "system-b1",
    storageBucket: "system-b1.firebasestorage.app",
    messagingSenderId: "410034258273",
    appId: "1:410034258273:web:393aefd413d4f9ca328520"
  };
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const pomiaryRef = db.collection("pomiary");
const auth = firebase.auth();

/* ========================= CONFIG ========================= */

const configModeli = {
  SX2e: ["TRIM-CTR PLR LWR,LH","NazwaCzesci2","NazwaCzesci3","NazwaCzesci4","NazwaCzesci5"],
  NX5: ["NazwaCzesci6","NazwaCzesci7","NazwaCzesci8","NazwaCzesci9","NazwaCzesci10"]
};

const numeryCzesci = {
  "TRIM-CTR PLR LWR,LH":"85835-HF000",
  "NazwaCzesci2":"NumerCzesci2",
  "NazwaCzesci3":"NumerCzesci3",
  "NazwaCzesci4":"NumerCzesci4",
  "NazwaCzesci5":"NumerCzesci5",
  "NazwaCzesci6":"NumerCzesci6",
  "NazwaCzesci7":"NumerCzesci7",
  "NazwaCzesci8":"NumerCzesci8",
  "NazwaCzesci9":"NumerCzesci9",
  "NazwaCzesci10":"NumerCzesci10"
};

const configRysunkow = {
  "TRIM-CTR PLR LWR,LH":[
    {w:"Area 1", typy:[{type:"G",LCL:2.5,UCL:3.5},{type:"F",LCL:-0.5,UCL:0.5}]},
    {w:"Area 2", typy:[{type:"G",LCL:2.5,UCL:3.5},{type:"F",LCL:-0.5,UCL:0.5}]},
    {w:"Area 3", typy:[{type:"G",LCL:2.5,UCL:3.5},{type:"F",LCL:-0.5,UCL:0.5}]},
    {w:"Area 4", typy:[{type:"G",LCL:-0.5,UCL:0.5},{type:"F",LCL:-0.5,UCL:0.5}]},
    {w:"Area 5", typy:[{type:"G",LCL:-0.5,UCL:0.5},{type:"F",LCL:-0.5,UCL:0.5}]},
    {w:"Area 6", typy:[{type:"G",LCL:-0.5,UCL:0.5},{type:"F",LCL:-0.5,UCL:0.5}]},
    {w:"Area 7", typy:[{type:"G",LCL:2.5,UCL:3.5},{type:"F",LCL:-0.5,UCL:0.5}]},
    {w:"Area 8", typy:[{type:"G",LCL:2.5,UCL:3.5},{type:"F",LCL:-0.5,UCL:0.5}]},
    {w:"Area 9", typy:[{type:"G",LCL:2.5,UCL:3.5},{type:"F",LCL:-0.5,UCL:0.5}]},
    {w:"Area 10", typy:[{type:"G",LCL:0,UCL:1},{type:"F",LCL:0,UCL:1}]},
    {w:"Area 11", typy:[{type:"G",LCL:0,UCL:1},{type:"F",LCL:0,UCL:1}]},
    {w:"Area 12", typy:[{type:"G",LCL:0,UCL:1},{type:"F",LCL:0,UCL:1}]},
    {w:"Area 13", typy:[{type:"G",LCL:0,UCL:1},{type:"F",LCL:-0.5,UCL:0.5}]},
  ],
  "NazwaCzesci2":[
    {w:"Area 1", typy:[{type:"G",LCL:2.5,UCL:3.5},{type:"F",LCL:-0.5,UCL:0.5}]},
    {w:"Area 2", typy:[{type:"G",LCL:2.5,UCL:3.5},{type:"F",LCL:-0.5,UCL:0.5}]},
  ],
  "NazwaCzesci6":[
    {w:"Area 1", typy:[{type:"G",LCL:2.5,UCL:3.5},{type:"F",LCL:-0.5,UCL:0.5}]},
    {w:"Area 2", typy:[{type:"G",LCL:2.5,UCL:3.5},{type:"F",LCL:-0.5,UCL:0.5}]},
  ]
};

/* ========================= STATE ========================= */

let aktualny = null;
let dane = [];
let unsubscribe = null;

const menu = document.getElementById("menu");
const form = document.getElementById("form");

/* ========================= AUTH (START APP) ========================= */

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const id = user.email.split("@")[0];

  const operatorInput = document.getElementById("operatorInput");
  operatorInput.value = id;
  operatorInput.disabled = true;

  init(); // 🔥 start dopiero po loginie
});

/* ========================= INIT ========================= */

function init(){

  document.getElementById("menuBtn").onclick = toggleMenu;
  document.getElementById("homeBtn").onclick = goHome;
  document.getElementById("saveBtn").onclick = zapisz;
  document.getElementById("closeModalX").onclick = zamknijModal;

  createMenu();

  const dateFilter = document.getElementById("dateFilter");
  const today = new Date().toISOString().split("T")[0];
  dateFilter.value = today;

  dateFilter.onchange = () => listenData();

  listenData();
}

/* ========================= FIRESTORE ========================= */

function listenData(){
  const selectedDate = document.getElementById("dateFilter").value;

  if (unsubscribe) unsubscribe();

  unsubscribe = pomiaryRef
    .where("dateKey", "==", selectedDate)
    .onSnapshot(snapshot => {
      dane = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      renderHistoria();
      renderHistoriaAll();
    });
}

/* ========================= HELPERS ========================= */

function getModel(r){
  return Object.keys(configModeli)
    .find(m => configModeli[m].includes(r)) || "UNKNOWN";
}

function toggleMenu(){
  menu.classList.toggle("open");
}

function goHome(){
  document.getElementById("home").style.display = "block";
  document.getElementById("app").style.display = "none";
}

/* ========================= MENU ========================= */

function createMenu(){
  menu.innerHTML = "";

  /* ===== USER + LOGOUT ===== */

  const userBox = document.createElement("div");
  userBox.className = "menu-user";

  const user = auth.currentUser;
  const id = user.email.split("@")[0];

  const userLabel = document.createElement("div");
  userLabel.className = "menu-user-label";
  userLabel.textContent = `👤 ${id}`;

  const logoutBtn = document.createElement("div");
  logoutBtn.className = "menu-logout";
  logoutBtn.textContent = "🚪 Log out";

  logoutBtn.onclick = () => {
    auth.signOut().then(() => {
      window.location.href = "login.html";
    });
  };

  userBox.appendChild(userLabel);
  userBox.appendChild(logoutBtn);
  menu.appendChild(userBox);

  /* ===== RESZTA MENU ===== */

  Object.entries(configModeli).forEach(([model,list])=>{
    const h = document.createElement("div");
    h.className = "menu-header";
    h.textContent = `📦 ${model}`;

    const listDiv = document.createElement("div");
    listDiv.className = "menu-list";
    listDiv.style.display = "none";

    h.onclick = () => {
      listDiv.style.display =
        listDiv.style.display === "block" ? "none" : "block";
    };

    list.forEach(r=>{
      const item = document.createElement("div");
      item.textContent = `${r} | ${numeryCzesci[r]}`;
      item.onclick = () => otworz(r);
      listDiv.appendChild(item);
    });

    menu.appendChild(h);
    menu.appendChild(listDiv);
  });
}

/* ========================= OPEN ========================= */

function otworz(r){
  aktualny = r;

  document.getElementById("home").style.display = "none";
  document.getElementById("app").style.display = "block";

  document.getElementById("modelHeader").textContent =
    `Project: ${getModel(r)} | Part: ${r} | NR: ${numeryCzesci[r]}`;

  document.getElementById("rysunekImg").src = `Rysunki/${r}.jpg`;

  form.innerHTML = "";

  const cfg = configRysunkow[r];
  if(!cfg){
    form.innerHTML = `<div style="color:red;font-weight:700">❌ Brak konfiguracji dla: ${r}</div>`;
    return;
  }

  cfg.forEach(area=>{
    const card = document.createElement("div");
    card.className = "strefa-card";

    const title = document.createElement("div");
    title.className = "strefa-title";
    title.textContent = `📍 ${area.w}`;

    const grid = document.createElement("div");
    grid.className = "strefa-grid";

    area.typy.forEach(t=>{
      const input = document.createElement("input");
      input.className = "dim-input";
      input.placeholder = `${t.type} (${t.LCL} - ${t.UCL})`;

      input.dataset.area = area.w;
      input.dataset.type = t.type;
      input.dataset.lcl = t.LCL;
      input.dataset.ucl = t.UCL;

      input.addEventListener("input", () => {
        const v = parseFloat(input.value);
        const ok = v >= t.LCL && v <= t.UCL;

        input.classList.remove("ok","nok");
        if(!isNaN(v)) input.classList.add(ok ? "ok" : "nok");
      });

      grid.appendChild(input);
    });

    card.appendChild(title);
    card.appendChild(grid);
    form.appendChild(card);
  });

  renderHistoria();
}

/* ========================= SAVE ========================= */

async function zapisz(){
  if(!aktualny) return;

  const operator = document.getElementById("operatorInput").value;

  const inputs = document.querySelectorAll(".dim-input");

  const anyFilled = Array.from(inputs).some(i => i.value.trim() !== "");
  if(!anyFilled){
    alert("❌ Wpisz przynajmniej jeden pomiar!");
    return;
  }

  const pom = {
    data: new Date().toLocaleString(),
    dateKey: new Date().toISOString().split("T")[0],
    rysunek: aktualny,
    numer: numeryCzesci[aktualny],
    model: getModel(aktualny),
    operator,
    status: "OK",
    wymiary: {},
    nokList: []
  };

  inputs.forEach(el=>{
    const v = parseFloat(el.value);
    if(isNaN(v)) return;

    const lcl = parseFloat(el.dataset.lcl);
    const ucl = parseFloat(el.dataset.ucl);
    const area = el.dataset.area;
    const type = el.dataset.type;

    const ok = v >= lcl && v <= ucl;

    if(!pom.wymiary[area]) pom.wymiary[area] = {};
    pom.wymiary[area][type] = {
      wartosc: v,
      LCL: lcl,
      UCL: ucl,
      status: ok ? "OK" : "NOK"
    };

    if(!ok){
      pom.status = "NOK";
      pom.nokList.push(`${area}-${type}`);
    }
  });

  pom.nokCount = pom.nokList.length;

  await pomiaryRef.add(pom);

  showToast("✅ Pomiar zapisany");

  inputs.forEach(i=>{
    i.value = "";
    i.classList.remove("ok","nok");
  });
}

/* ========================= HISTORY ========================= */

function renderHistoria(){
  const tb = document.querySelector("#historia tbody");
  tb.innerHTML = "";

  dane
    .filter(d => d.rysunek === aktualny)
    .slice().reverse()
    .forEach(d => tb.appendChild(buildRow(d)));
}

function renderHistoriaAll(){
  const tb = document.querySelector("#historiaAll tbody");
  tb.innerHTML = "";

  dane
    .slice().reverse()
    .forEach(d => tb.appendChild(buildRow(d)));
}

function buildRow(d){
  const tr = document.createElement("tr");

  const encoded = encodeURIComponent(JSON.stringify(d));

  tr.innerHTML = `
    <td>${d.data}</td>
    <td>${d.model}</td>
    <td>${d.rysunek}</td>
    <td>${d.numer}</td>
    <td>${d.operator}</td>
    <td class="${d.status==="OK"?"ok":"nok"}">${d.status}</td>
    <td>${d.nokCount}</td>
    <td><button onclick="pokaz('${encoded}')">🔍</button></td>
  `;

  return tr;
}

/* ========================= MODAL ========================= */

let currentModalData = null;

function pokaz(json){
  const d = JSON.parse(decodeURIComponent(json));
  currentModalData = d;

  const modal = document.getElementById("modal");
  modal.classList.add("show");
  document.body.style.overflow = "hidden";

  document.getElementById("modalImg").src = `Rysunki/${d.rysunek}.jpg`;

  document.getElementById("modalInfo").innerHTML = `
    <div style="display:grid;gap:6px;font-size:14px">
      <div><b>Part:</b> ${d.rysunek}</div>
      <div><b>Part No.:</b> ${d.numer}</div>
      <div><b>Project:</b> ${d.model}</div>
      <div><b>Date:</b> ${d.data}</div>
      <div><b>Operator:</b> ${d.operator}</div>
      <div><b>Status:</b>
        <span style="color:${d.status==="OK"?"#22c55e":"#ef4444"};font-weight:700">${d.status}</span>
      </div>
    </div>
  `;

  const tb = document.getElementById("modalTable");
  tb.innerHTML = "";

  Object.entries(d.wymiary).forEach(([w, typy])=>{
    Object.entries(typy).forEach(([type, v])=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${w} (${type})</td>
        <td>${v.wartosc}</td>
        <td>${v.LCL}</td>
        <td>${v.UCL}</td>
        <td style="color:${v.status==="OK"?"#22c55e":"#ef4444"}">${v.status}</td>
      `;
      tb.appendChild(tr);
    });
  });
}

function zamknijModal(){
  document.getElementById("modal").classList.remove("show");
  document.body.style.overflow = "";
}

/* ========================= UX ========================= */

document.addEventListener("keydown",(e)=>{
  if(e.key === "Escape") zamknijModal();
});

document.getElementById("modal").addEventListener("click",(e)=>{
  const box = document.getElementById("modalBox");
  if(!box.contains(e.target)) zamknijModal();
});

function showToast(msg){
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


/* ========================= PDF ========================= */

document.getElementById("pdfBtn").onclick = async () => {
  const modalBox = document.getElementById("modalBox");

  const clone = modalBox.cloneNode(true);
  const btn = clone.querySelector("#pdfBtn");
  if (btn) btn.remove();

  const temp = document.createElement("div");
  temp.style.position = "absolute";
  temp.style.left = "-9999px";
  temp.style.width = "900px";
  temp.appendChild(clone);
  document.body.appendChild(temp);

  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true
  });

  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p","mm","a4");

  const pageWidth = 210;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  pdf.addImage(imgData,"PNG",0,0,pageWidth,imgHeight);
  pdf.save(`pomiar_${Date.now()}.pdf`);

  document.body.removeChild(temp);
};
