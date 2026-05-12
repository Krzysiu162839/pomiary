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
const pomiaryRef    = db.collection("pomiary");
const configRef     = db.collection("config").doc("parts");
const auth          = firebase.auth();

/* ========================= STATE ========================= */

let configModeli   = {};
let numeryCzesci   = {};
let configRysunkow = {};

let aktualny    = null;
let dane        = [];
let unsubscribe = null;

const menu    = document.getElementById("menu");
const overlay = document.getElementById("menuOverlay");

/* ========================= DEFAULT CONFIG ========================= */

const DEFAULT_CONFIG = {
  configModeli: {
    SX2e: ["TRIM-CTR PLR LWR,LH","NazwaCzesci2","NazwaCzesci3","NazwaCzesci4","NazwaCzesci5"],
    NX5:  ["NazwaCzesci6","NazwaCzesci7","NazwaCzesci8","NazwaCzesci9","NazwaCzesci10"]
  },
  numeryCzesci: {
    "TRIM-CTR PLR LWR,LH": "85835-HF000",
    "NazwaCzesci2":  "NumerCzesci2",
    "NazwaCzesci3":  "NumerCzesci3",
    "NazwaCzesci4":  "NumerCzesci4",
    "NazwaCzesci5":  "NumerCzesci5",
    "NazwaCzesci6":  "NumerCzesci6",
    "NazwaCzesci7":  "NumerCzesci7",
    "NazwaCzesci8":  "NumerCzesci8",
    "NazwaCzesci9":  "NumerCzesci9",
    "NazwaCzesci10": "NumerCzesci10"
  },
  configRysunkow: {
    "TRIM-CTR PLR LWR,LH": [
      {w:"Area 1",  typy:[{type:"G",spec:"SPEC 1",LCL:2.5,UCL:3.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
      {w:"Area 2",  typy:[{type:"G",spec:"SPEC 1",LCL:2.5,UCL:3.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
      {w:"Area 3",  typy:[{type:"G",spec:"SPEC 1",LCL:2.5,UCL:3.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
      {w:"Area 4",  typy:[{type:"G",spec:"SPEC 1",LCL:-0.5,UCL:0.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
      {w:"Area 5",  typy:[{type:"G",spec:"SPEC 1",LCL:-0.5,UCL:0.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
      {w:"Area 6",  typy:[{type:"G",spec:"SPEC 1",LCL:-0.5,UCL:0.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
      {w:"Area 7",  typy:[{type:"G",spec:"SPEC 1",LCL:2.5,UCL:3.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
      {w:"Area 8",  typy:[{type:"G",spec:"SPEC 1",LCL:2.5,UCL:3.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
      {w:"Area 9",  typy:[{type:"G",spec:"SPEC 1",LCL:2.5,UCL:3.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
      {w:"Area 10", typy:[{type:"G",spec:"SPEC 1",LCL:0,UCL:1},{type:"F",spec:"SPEC 2",LCL:0,UCL:1}]},
      {w:"Area 11", typy:[{type:"G",spec:"SPEC 1",LCL:0,UCL:1},{type:"F",spec:"SPEC 2",LCL:0,UCL:1}]},
      {w:"Area 12", typy:[{type:"G",spec:"SPEC 1",LCL:0,UCL:1},{type:"F",spec:"SPEC 2",LCL:0,UCL:1}]},
      {w:"Area 13", typy:[{type:"G",spec:"SPEC 1",LCL:0,UCL:1},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
    ],
    "NazwaCzesci2": [
      {w:"Area 1", typy:[{type:"G",spec:"SPEC 1",LCL:2.5,UCL:3.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
      {w:"Area 2", typy:[{type:"G",spec:"SPEC 1",LCL:2.5,UCL:3.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
    ],
    "NazwaCzesci6": [
      {w:"Area 1", typy:[{type:"G",spec:"SPEC 1",LCL:2.5,UCL:3.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
      {w:"Area 2", typy:[{type:"G",spec:"SPEC 1",LCL:2.5,UCL:3.5},{type:"F",spec:"SPEC 2",LCL:-0.5,UCL:0.5}]},
    ]
  }
};

/* ========================= ID GENERATOR ========================= */

function generatePomiarId() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
  return `POM-${date}-${time}-${rand}`;
}

/* ========================= AUTH ========================= */

auth.onAuthStateChanged(user => {
  if (!user) { window.location.href = "login.html"; return; }
  const id = user.email.split("@")[0];
  const operatorInput = document.getElementById("operatorInput");
  operatorInput.value = id;
  operatorInput.disabled = true;
  loadConfig();
});

/* ========================= CONFIG LOAD/SAVE ========================= */

async function loadConfig() {
  try {
    const snap = await configRef.get();
    if (snap.exists) {
      const d = snap.data();
      configModeli   = d.configModeli   || DEFAULT_CONFIG.configModeli;
      numeryCzesci   = d.numeryCzesci   || DEFAULT_CONFIG.numeryCzesci;
      configRysunkow = d.configRysunkow || DEFAULT_CONFIG.configRysunkow;
    } else {
      configModeli   = DEFAULT_CONFIG.configModeli;
      numeryCzesci   = DEFAULT_CONFIG.numeryCzesci;
      configRysunkow = DEFAULT_CONFIG.configRysunkow;
      await saveConfig();
    }
  } catch (e) {
    console.warn("Config load error, using defaults", e);
    configModeli   = DEFAULT_CONFIG.configModeli;
    numeryCzesci   = DEFAULT_CONFIG.numeryCzesci;
    configRysunkow = DEFAULT_CONFIG.configRysunkow;
  }
  init();
}

async function saveConfig() {
  await configRef.set({ configModeli, numeryCzesci, configRysunkow });
}

/* ========================= INIT ========================= */

function init() {
  document.getElementById("menuBtn").onclick = toggleMenu;
  document.getElementById("homeBtn").onclick = goHome;
  document.getElementById("saveBtn").onclick = zapisz;
  document.getElementById("closeModalX").onclick = zamknijModal;

  overlay.onclick = closeMenu;

  document.getElementById("exportAllBtn").onclick = () => exportCSV(dane, "history_all");
  document.getElementById("exportPartBtn").onclick = () =>
    exportCSV(dane.filter(d => d.rysunek === aktualny), `history_${aktualny || "part"}`);

  document.getElementById("exportAllPdfBtn").onclick = () =>
    exportBulkPDF(dane.slice().reverse(), "history_all");
  document.getElementById("exportPartPdfBtn").onclick = () =>
    exportBulkPDF(dane.filter(d => d.rysunek === aktualny).slice().reverse(), `history_${aktualny || "part"}`);

  createMenu();

  const dateFilter = document.getElementById("dateFilter");
  dateFilter.value = new Date().toISOString().split("T")[0];
  dateFilter.onchange = () => listenData();

  listenData();
}

/* ========================= FIRESTORE ========================= */

function listenData() {
  const selectedDate = document.getElementById("dateFilter").value;
  if (unsubscribe) unsubscribe();
  unsubscribe = pomiaryRef
    .where("dateKey", "==", selectedDate)
    .onSnapshot(snapshot => {
      dane = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderHistoria();
      renderHistoriaAll();
    });
}

/* ========================= HELPERS ========================= */

function getModel(r) {
  return Object.keys(configModeli).find(m => configModeli[m].includes(r)) || "UNKNOWN";
}
function toggleMenu() {
  const isOpen = menu.classList.toggle("open");
  overlay.classList.toggle("show", isOpen);
}
function closeMenu() {
  menu.classList.remove("open");
  overlay.classList.remove("show");
}
function goHome() {
  document.getElementById("home").style.display = "block";
  document.getElementById("app").style.display = "none";
  closeMenu();
}

/* ========================= MENU ========================= */

function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

function createMenu() {
  menu.innerHTML = "";

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
  logoutBtn.onclick = () => auth.signOut().then(() => { window.location.href = "login.html"; });
  userBox.appendChild(userLabel);
  userBox.appendChild(logoutBtn);
  menu.appendChild(userBox);

  const searchBox = document.createElement("div");
  searchBox.className = "menu-search-box";
  const searchWrapper = document.createElement("div");
  searchWrapper.className = "menu-search-wrapper";
  const searchIcon = document.createElement("span");
  searchIcon.className = "menu-search-icon";
  searchIcon.textContent = "🔍";
  const searchInput = document.createElement("input");
  searchInput.id = "menuSearch";
  searchInput.placeholder = "Search parts...";
  searchInput.autocomplete = "off";
  searchInput.spellcheck = false;
  searchWrapper.appendChild(searchIcon);
  searchWrapper.appendChild(searchInput);
  searchBox.appendChild(searchWrapper);
  menu.appendChild(searchBox);

  const itemsContainer = document.createElement("div");
  itemsContainer.id = "menuItems";
  menu.appendChild(itemsContainer);

  renderMenuItems(itemsContainer, "");
  searchInput.addEventListener("input", () => renderMenuItems(itemsContainer, searchInput.value.trim()));
}

function renderMenuItems(container, query) {
  container.innerHTML = "";
  const q = query.toLowerCase();
  let anyResult = false;

  Object.entries(configModeli).forEach(([model, list]) => {
    const filtered = q
      ? list.filter(r =>
          r.toLowerCase().includes(q) ||
          (numeryCzesci[r] || "").toLowerCase().includes(q) ||
          model.toLowerCase().includes(q)
        )
      : list;
    if (filtered.length === 0) return;
    anyResult = true;

    const h = document.createElement("div");
    h.className = "menu-header" + (q ? " expanded" : "");
    h.innerHTML = `<span>${highlight(`📦 ${model}`, query)}</span><span class="arrow">▼</span>`;

    const listDiv = document.createElement("div");
    listDiv.className = "menu-list" + (q ? " open" : "");
    h.onclick = () => {
      const isOpen = listDiv.classList.toggle("open");
      h.classList.toggle("expanded", isOpen);
    };

    filtered.forEach(r => {
      const item = document.createElement("div");
      item.className = "menu-list-item" + (r === aktualny ? " active" : "");
      item.innerHTML = highlight(`${r} | ${numeryCzesci[r] || "—"}`, query);
      item.onclick = () => {
        otworz(r);
        closeMenu();
        document.querySelectorAll(".menu-list-item").forEach(el => el.classList.remove("active"));
        item.classList.add("active");
      };
      listDiv.appendChild(item);
    });

    container.appendChild(h);
    container.appendChild(listDiv);
  });

  if (!anyResult) {
    const noRes = document.createElement("div");
    noRes.className = "menu-no-results";
    noRes.textContent = `No results for "${query}"`;
    container.appendChild(noRes);
  }
}

/* ========================= OPEN ========================= */

function otworz(r) {
  aktualny = r;
  document.getElementById("home").style.display = "none";
  const appEl = document.getElementById("app");
  appEl.style.display = "block";
  appEl.style.animation = "none";
  requestAnimationFrame(() => { appEl.style.animation = "fadeInUp 0.35s ease both"; });

  document.getElementById("modelHeader").textContent =
    `Project: ${getModel(r)} | Part: ${r} | NR: ${numeryCzesci[r] || "—"}`;

  const rysunekImg = document.getElementById("rysunekImg");
  rysunekImg.src = `Rysunki/${r}.jpg`;
  rysunekImg.style.width = "100%";
  rysunekImg.style.height = "100%";
  rysunekImg.style.objectFit = "contain";

  const formCard = document.querySelector("#app .card:first-child");
  if (formCard) formCard.classList.add("has-save-btn");

  const form = document.getElementById("form");
  form.innerHTML = "";
  const cfg = configRysunkow[r];
  if (!cfg) {
    form.innerHTML = `<div style="color:red;font-weight:700;padding:10px;">❌ No config for: ${r}</div>`;
    return;
  }

  cfg.forEach((area, i) => {
    const card = document.createElement("div");
    card.className = "strefa-card";
    card.style.animationDelay = `${i * 0.04}s`;

    const title = document.createElement("div");
    title.className = "strefa-title";
    title.textContent = `📍 ${area.w}`;

    const grid = document.createElement("div");
    grid.className = "strefa-grid";

    area.typy.forEach(t => {
      const wrapper = document.createElement("div");
      wrapper.className = "dim-wrapper";

      // SPEC label above input
      if (t.spec) {
        const specLabel = document.createElement("div");
        specLabel.className = "spec-label";
        specLabel.textContent = t.spec;
        wrapper.appendChild(specLabel);
      }

      const typeRow = document.createElement("div");
      typeRow.className = "type-row";

      const typeBadge = document.createElement("span");
      typeBadge.className = "type-badge";
      typeBadge.textContent = t.type;

      const input = document.createElement("input");
      input.className = "dim-input";
      input.placeholder = `${t.LCL} – ${t.UCL}`;
      input.dataset.area = area.w;
      input.dataset.type = t.type;
      input.dataset.lcl = t.LCL;
      input.dataset.ucl = t.UCL;
      input.inputMode = "decimal";
      input.addEventListener("input", () => {
        const v = parseFloat(input.value);
        const ok = v >= t.LCL && v <= t.UCL;
        input.classList.remove("ok","nok");
        if (!isNaN(v)) input.classList.add(ok ? "ok" : "nok");
      });

      typeRow.appendChild(typeBadge);
      typeRow.appendChild(input);
      wrapper.appendChild(typeRow);
      grid.appendChild(wrapper);
    });

    card.appendChild(title);
    card.appendChild(grid);
    form.appendChild(card);
  });

  renderHistoria();
}

/* ========================= SAVE ========================= */

async function zapisz() {
  if (!aktualny) return;
  const operator = document.getElementById("operatorInput").value;
  const inputs = document.querySelectorAll(".dim-input");
  const anyFilled = Array.from(inputs).some(i => i.value.trim() !== "");
  if (!anyFilled) { showToast("❌ Enter at least one measurement!"); return; }

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.textContent = "⏳ Saving...";
  saveBtn.disabled = true;

  const pomiarId = generatePomiarId();
  const pom = {
    pomiarId,
    data: new Date().toLocaleString(),
    dateKey: new Date().toISOString().split("T")[0],
    rysunek: aktualny,
    numer: numeryCzesci[aktualny] || "—",
    model: getModel(aktualny),
    operator,
    status: "OK",
    wymiary: {},
    nokList: []
  };

  inputs.forEach(el => {
    const v = parseFloat(el.value);
    if (isNaN(v)) return;
    const lcl  = parseFloat(el.dataset.lcl);
    const ucl  = parseFloat(el.dataset.ucl);
    const area = el.dataset.area;
    const type = el.dataset.type;
    const ok   = v >= lcl && v <= ucl;
    if (!pom.wymiary[area]) pom.wymiary[area] = {};
    pom.wymiary[area][type] = { wartosc: v, LCL: lcl, UCL: ucl, status: ok ? "OK" : "NOK" };
    if (!ok) { pom.status = "NOK"; pom.nokList.push(`${area}-${type}`); }
  });

  pom.nokCount = pom.nokList.length;
  await pomiaryRef.add(pom);

  saveBtn.textContent = "💾 Save";
  saveBtn.disabled = false;
  showToast(`✅ Saved! ID: ${pomiarId}`);
  inputs.forEach(i => { i.value = ""; i.classList.remove("ok","nok"); });
}

/* ========================= HISTORY ========================= */

function renderHistoria() {
  const tb = document.querySelector("#historia tbody");
  tb.innerHTML = "";
  dane.filter(d => d.rysunek === aktualny).slice().reverse().forEach(d => tb.appendChild(buildRow(d)));
}

function renderHistoriaAll() {
  const tb = document.querySelector("#historiaAll tbody");
  tb.innerHTML = "";
  dane.slice().reverse().forEach(d => tb.appendChild(buildRow(d)));
}

function buildRow(d) {
  const tr = document.createElement("tr");
  const encoded = encodeURIComponent(JSON.stringify(d));
  const idCell = d.pomiarId
    ? `<span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#3b82f6;white-space:nowrap;">${d.pomiarId}</span>`
    : `<span style="color:#cbd5e1;font-size:11px;">—</span>`;
  tr.innerHTML = `
    <td>${idCell}</td>
    <td style="white-space:nowrap">${d.data}</td>
    <td>${d.model}</td>
    <td>${d.rysunek}</td>
    <td>${d.numer}</td>
    <td>${d.operator}</td>
    <td class="${d.status==='OK'?'ok':'nok'}">${d.status}</td>
    <td>${d.nokCount}</td>
    <td><button onclick="pokaz('${encoded}')">🔍</button></td>
  `;
  return tr;
}

/* ========================= CSV EXPORT ========================= */

function exportCSV(rows, filename) {
  if (!rows.length) { showToast("❌ No data to export"); return; }
  const headers = ["ID","Date","Model","Part","Part No.","Operator","Status","NOK Count","NOK List"];
  const lines = [headers.join(",")];
  rows.slice().reverse().forEach(d => {
    lines.push([
      d.pomiarId || "",
      `"${d.data}"`,
      d.model,
      `"${d.rysunek}"`,
      d.numer,
      d.operator,
      d.status,
      d.nokCount,
      `"${(d.nokList||[]).join("; ")}"`
    ].join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ========================= MODAL: Measurement Details ========================= */

let currentModalData = null;

function pokaz(json) {
  const d = JSON.parse(decodeURIComponent(json));
  currentModalData = d;
  document.getElementById("modal").classList.add("show");
  document.body.style.overflow = "hidden";
  document.getElementById("modalImg").src = `Rysunki/${d.rysunek}.jpg`;

  const idBadge = d.pomiarId ? `
    <div style="display:flex;align-items:center;gap:10px;background:linear-gradient(90deg,#0f172a,#1e3a5f);color:white;border-radius:10px;padding:10px 14px;margin-bottom:10px;">
      <span style="font-size:16px;">🔖</span>
      <div>
        <div style="font-size:10px;opacity:0.6;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Measurement ID</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;letter-spacing:0.04em;color:#93c5fd;">${d.pomiarId}</div>
      </div>
    </div>` : "";

  document.getElementById("modalInfo").innerHTML = `
    ${idBadge}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;margin-bottom:12px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
      <div><span style="color:#64748b;">Part:</span> <b>${d.rysunek}</b></div>
      <div><span style="color:#64748b;">Part No.:</span> <b>${d.numer}</b></div>
      <div><span style="color:#64748b;">Project:</span> <b>${d.model}</b></div>
      <div><span style="color:#64748b;">Date:</span> <b>${d.data}</b></div>
      <div><span style="color:#64748b;">Operator:</span> <b>${d.operator}</b></div>
      <div><span style="color:#64748b;">Status:</span> <b style="color:${d.status==="OK"?"#22c55e":"#ef4444"};">${d.status}</b></div>
    </div>
  `;

  const tb = document.getElementById("modalTable");
  tb.innerHTML = "";
  // Build a lookup: area+type -> spec from configRysunkow
  const specLookup = {};
  const rCfg = configRysunkow[d.rysunek] || [];
  rCfg.forEach(area => {
    area.typy.forEach(t => {
      specLookup[`${area.w}||${t.type}`] = t.spec || "—";
    });
  });

  Object.entries(d.wymiary).forEach(([w, typy]) => {
    Object.entries(typy).forEach(([type, v]) => {
      const spec = specLookup[`${w}||${type}`] || "—";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${w}</td>
        <td>${type}</td>
        <td><span class="spec-badge-sm">${spec}</span></td>
        <td>${v.wartosc}</td>
        <td>${v.LCL}</td>
        <td>${v.UCL}</td>
        <td style="color:${v.status==="OK"?"#22c55e":"#ef4444"};font-weight:700">${v.status}</td>
      `;
      tb.appendChild(tr);
    });
  });
}

function zamknijModal() {
  document.getElementById("modal").classList.remove("show");
  document.body.style.overflow = "";
}

/* ========================= KEYBOARD & CLICK OUTSIDE ========================= */

document.addEventListener("keydown", e => {
  if (e.key === "Escape") zamknijModal();
});

document.getElementById("modal").addEventListener("click", e => {
  if (!document.getElementById("modalBox").contains(e.target)) zamknijModal();
});

/* ========================= TOAST ========================= */

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.background = msg.startsWith("❌") ? "#ef4444" : "#22c55e";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ========================= PDF ========================= */

document.getElementById("pdfBtn").onclick = async () => {
  const d = currentModalData;
  if (!d) return;

  const pdfBtn = document.getElementById("pdfBtn");
  pdfBtn.textContent = "⏳ Generating...";
  pdfBtn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth  = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPage = (needed = 10) => {
      if (y + needed > pageHeight - 16) {
        pdf.addPage();
        y = margin;
        drawFooter();
      }
    };

    const drawFooter = () => {
      pdf.setFillColor(11, 18, 32);
      pdf.rect(0, pageHeight - 10, pageWidth, 10, "F");
      pdf.setTextColor(148, 163, 184);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 3.5);
      if (d.pomiarId) pdf.text(d.pomiarId, pageWidth - margin, pageHeight - 3.5, { align: "right" });
    };

    pdf.setFillColor(11, 18, 32);
    pdf.rect(0, 0, pageWidth, 22, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("MEASUREMENT REPORT", margin, 10);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("System Pomiarów B1", margin, 16);
    y = 30;

    if (d.pomiarId) {
      checkPage(18);
      pdf.setFillColor(15, 30, 60);
      pdf.roundedRect(margin, y, contentWidth, 14, 3, 3, "F");
      pdf.setFillColor(59, 130, 246);
      pdf.roundedRect(margin, y, 4, 14, 2, 2, "F");
      pdf.setTextColor(148, 163, 184);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text("MEASUREMENT ID", margin + 9, y + 5);
      pdf.setTextColor(147, 197, 253);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(d.pomiarId, margin + 9, y + 11.5);
      y += 20;
    }

    const infoItems = [
      ["Part", d.rysunek], ["Part No.", d.numer],
      ["Project", d.model], ["Date", d.data],
      ["Operator", d.operator], ["Status", d.status],
    ];
    const colW = contentWidth / 2;
    pdf.setFontSize(9);
    infoItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x  = margin + col * colW;
      const iy = y + row * 9;
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(x, iy - 4, colW - 2, 8, 2, 2, "F");
      pdf.setTextColor(100, 116, 139);
      pdf.setFont("helvetica", "normal");
      pdf.text(item[0] + ":", x + 3, iy);
      if (item[0] === "Status") {
        pdf.setTextColor(...(item[1] === "OK" ? [34,197,94] : [239,68,68]));
        pdf.setFont("helvetica", "bold");
      } else {
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
      }
      pdf.text(String(item[1]), x + 3 + pdf.getTextWidth(item[0] + ": "), iy);
    });
    y += Math.ceil(infoItems.length / 2) * 9 + 8;

    const loadedImg = await new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `Rysunki/${d.rysunek}.jpg`;
    });

    if (loadedImg) {
      const aspectRatio = loadedImg.naturalWidth / loadedImg.naturalHeight;
      const imgMaxH = 60;
      const imgMaxW = contentWidth * 0.55;
      let imgW = imgMaxW;
      let imgH = imgW / aspectRatio;
      if (imgH > imgMaxH) { imgH = imgMaxH; imgW = imgH * aspectRatio; }
      checkPage(imgH + 14);
      const canvas = document.createElement("canvas");
      canvas.width  = loadedImg.naturalWidth;
      canvas.height = loadedImg.naturalHeight;
      canvas.getContext("2d").drawImage(loadedImg, 0, 0);
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const imgX = margin + (contentWidth - imgW) / 2;
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(imgX - 3, y - 3, imgW + 6, imgH + 6, 3, 3, "F");
      pdf.addImage(imgData, "JPEG", imgX, y, imgW, imgH);
      y += imgH + 10;
    }

    checkPage(16);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text("Measurement Data", margin, y);
    y += 5;

    const cols = ["Area", "Type", "SPEC", "Value", "LCL", "UCL", "Status"];
    const colWidths = [46, 16, 26, 20, 20, 20, 34];
    const rowH = 8;

    // Build spec lookup for single-record PDF
    const specLookupSingle = {};
    (configRysunkow[d.rysunek] || []).forEach(area => {
      area.typy.forEach(t => {
        specLookupSingle[`${area.w}||${t.type}`] = t.spec || "—";
      });
    });

    const drawTableHeader = () => {
      checkPage(rowH + 2);
      pdf.setFillColor(11, 18, 32);
      pdf.rect(margin, y, contentWidth, rowH, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      let cx = margin;
      cols.forEach((col, ci) => {
        pdf.text(col, cx + colWidths[ci] / 2, y + 5.5, { align: "center" });
        cx += colWidths[ci];
      });
      y += rowH;
    };

    drawTableHeader();

    let rowIndex = 0;
    Object.entries(d.wymiary).forEach(([w, typy]) => {
      Object.entries(typy).forEach(([type, v]) => {
        if (y + rowH > pageHeight - 16) {
          drawFooter();
          pdf.addPage();
          y = margin;
          drawTableHeader();
        }
        const isOk = v.status === "OK";
        const spec = specLookupSingle[`${w}||${type}`] || "—";
        const bg   = rowIndex % 2 === 0 ? [255,255,255] : [248,250,252];
        pdf.setFillColor(...bg);
        pdf.rect(margin, y, contentWidth, rowH, "F");
        const cells = [w, type, spec, String(v.wartosc), String(v.LCL), String(v.UCL), v.status];
        let cx = margin;
        cells.forEach((cell, ci) => {
          if (ci === 6) {
            pdf.setTextColor(...(isOk ? [34,197,94] : [239,68,68]));
            pdf.setFont("helvetica", "bold");
          } else {
            pdf.setTextColor(15, 23, 42);
            pdf.setFont("helvetica", "normal");
          }
          pdf.setFontSize(7.5);
          pdf.text(cell, cx + colWidths[ci] / 2, y + 5.5, { align: "center" });
          cx += colWidths[ci];
        });
        pdf.setDrawColor(229, 231, 235);
        pdf.line(margin, y + rowH, margin + contentWidth, y + rowH);
        y += rowH;
        rowIndex++;
      });
    });

    pdf.setDrawColor(203, 213, 225);

    if (d.nokList && d.nokList.length) {
      y += 6;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(239, 68, 68);
      const nokHeader = `NOK Dimensions (${d.nokList.length}): `;
      const nokText = d.nokList.join(", ");
      const maxTextW = contentWidth - 10;
      const nokLines = pdf.splitTextToSize(nokHeader + nokText, maxTextW);
      const nokBoxH = nokLines.length * 5.5 + 7;
      checkPage(nokBoxH + 4);
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(margin, y, contentWidth, nokBoxH, 3, 3, "F");
      pdf.setDrawColor(252, 202, 202);
      pdf.roundedRect(margin, y, contentWidth, nokBoxH, 3, 3, "S");
      pdf.text(nokLines, margin + 5, y + 6);
      y += nokBoxH + 4;
    }

    drawFooter();
    pdf.save(`pomiar_${d.pomiarId || Date.now()}.pdf`);

  } catch (err) {
    console.error("PDF error:", err);
    showToast("❌ PDF generation failed");
  }

  pdfBtn.textContent = "📄 Download PDF";
  pdfBtn.disabled = false;
};

/* ========================= BULK PDF EXPORT ========================= */

async function exportBulkPDF(rows, filename) {
  if (!rows.length) { showToast("❌ No data to export"); return; }

  const btn = document.getElementById("exportAllPdfBtn") || document.getElementById("exportPartPdfBtn");
  const origText = btn ? btn.textContent : "";
  if (btn) { btn.textContent = "⏳ Generating..."; btn.disabled = true; }

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth  = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const drawPageFooter = (pageLabel) => {
      pdf.setFillColor(11, 18, 32);
      pdf.rect(0, pageHeight - 10, pageWidth, 10, "F");
      pdf.setTextColor(148, 163, 184);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 3.5);
      pdf.text(pageLabel, pageWidth - margin, pageHeight - 3.5, { align: "right" });
    };

    // Cover page
    pdf.setFillColor(11, 18, 32);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("MEASUREMENT REPORT", pageWidth / 2, 100, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(148, 163, 184);
    pdf.text("System Pomiarów B1", pageWidth / 2, 114, { align: "center" });
    pdf.setFontSize(9);
    pdf.text(`Total records: ${rows.length}`, pageWidth / 2, 130, { align: "center" });
    pdf.text(`Export date: ${new Date().toLocaleString()}`, pageWidth / 2, 140, { align: "center" });
    drawPageFooter(`${rows.length} records`);

    for (let ri = 0; ri < rows.length; ri++) {
      const d = rows[ri];
      pdf.addPage();
      let y = margin;

      const checkPage = (needed = 10) => {
        if (y + needed > pageHeight - 16) {
          drawPageFooter(`${ri + 1} / ${rows.length}`);
          pdf.addPage();
          y = margin;
        }
      };

      // Record header bar
      pdf.setFillColor(11, 18, 32);
      pdf.rect(0, 0, pageWidth, 22, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(`Record ${ri + 1} / ${rows.length}`, margin, 10);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      if (d.pomiarId) pdf.text(d.pomiarId, pageWidth - margin, 10, { align: "right" });
      pdf.text("System Pomiarów B1", margin, 16);
      y = 28;

      // Info grid
      const infoItems = [
        ["Part", d.rysunek], ["Part No.", d.numer],
        ["Project", d.model], ["Date", d.data],
        ["Operator", d.operator], ["Status", d.status],
      ];
      const colW = contentWidth / 2;
      pdf.setFontSize(9);
      infoItems.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x  = margin + col * colW;
        const iy = y + row * 9;
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(x, iy - 4, colW - 2, 8, 2, 2, "F");
        pdf.setTextColor(100, 116, 139);
        pdf.setFont("helvetica", "normal");
        pdf.text(item[0] + ":", x + 3, iy);
        if (item[0] === "Status") {
          pdf.setTextColor(...(item[1] === "OK" ? [34,197,94] : [239,68,68]));
          pdf.setFont("helvetica", "bold");
        } else {
          pdf.setTextColor(15, 23, 42);
          pdf.setFont("helvetica", "bold");
        }
        pdf.text(String(item[1]), x + 3 + pdf.getTextWidth(item[0] + ": "), iy);
      });
      y += Math.ceil(infoItems.length / 2) * 9 + 8;

      // Measurement table
      checkPage(16);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Measurement Data", margin, y);
      y += 5;

      const cols = ["Area", "Type", "SPEC", "Value", "LCL", "UCL", "Status"];
      const colWidths = [46, 16, 26, 20, 20, 20, 34];
      const rowH = 8;

      const drawTableHeader = () => {
        checkPage(rowH + 2);
        pdf.setFillColor(11, 18, 32);
        pdf.rect(margin, y, contentWidth, rowH, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        let cx = margin;
        cols.forEach((col, ci) => {
          pdf.text(col, cx + colWidths[ci] / 2, y + 5.5, { align: "center" });
          cx += colWidths[ci];
        });
        y += rowH;
      };
      drawTableHeader();

      // Build spec lookup for this part
      const specLookup = {};
      const rCfg = configRysunkow[d.rysunek] || [];
      rCfg.forEach(area => {
        area.typy.forEach(t => {
          specLookup[`${area.w}||${t.type}`] = t.spec || "—";
        });
      });

      let rowIndex = 0;
      Object.entries(d.wymiary || {}).forEach(([w, typy]) => {
        Object.entries(typy).forEach(([type, v]) => {
          if (y + rowH > pageHeight - 16) {
            drawPageFooter(`${ri + 1} / ${rows.length}`);
            pdf.addPage();
            y = margin;
            drawTableHeader();
          }
          const isOk = v.status === "OK";
          const spec = specLookup[`${w}||${type}`] || "—";
          const bg = rowIndex % 2 === 0 ? [255,255,255] : [248,250,252];
          pdf.setFillColor(...bg);
          pdf.rect(margin, y, contentWidth, rowH, "F");
          const cells = [w, type, spec, String(v.wartosc), String(v.LCL), String(v.UCL), v.status];
          let cx = margin;
          cells.forEach((cell, ci) => {
            if (ci === 6) {
              pdf.setTextColor(...(isOk ? [34,197,94] : [239,68,68]));
              pdf.setFont("helvetica", "bold");
            } else {
              pdf.setTextColor(15, 23, 42);
              pdf.setFont("helvetica", "normal");
            }
            pdf.setFontSize(7.5);
            pdf.text(cell, cx + colWidths[ci] / 2, y + 5.5, { align: "center" });
            cx += colWidths[ci];
          });
          pdf.setDrawColor(229, 231, 235);
          pdf.line(margin, y + rowH, margin + contentWidth, y + rowH);
          y += rowH;
          rowIndex++;
        });
      });

      // NOK box with wrapping
      if (d.nokList && d.nokList.length) {
        y += 6;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(239, 68, 68);
        const nokText = `NOK Dimensions (${d.nokList.length}): ${d.nokList.join(", ")}`;
        const nokLines = pdf.splitTextToSize(nokText, contentWidth - 10);
        const nokBoxH = nokLines.length * 5.5 + 7;
        checkPage(nokBoxH + 4);
        pdf.setFillColor(254, 242, 242);
        pdf.roundedRect(margin, y, contentWidth, nokBoxH, 3, 3, "F");
        pdf.setDrawColor(252, 202, 202);
        pdf.roundedRect(margin, y, contentWidth, nokBoxH, 3, 3, "S");
        pdf.text(nokLines, margin + 5, y + 6);
        y += nokBoxH + 4;
      }

      drawPageFooter(`${ri + 1} / ${rows.length}`);
    }

    pdf.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
    showToast(`✅ PDF exported (${rows.length} records)`);
  } catch (err) {
    console.error("Bulk PDF error:", err);
    showToast("❌ PDF generation failed");
  }

  if (btn) { btn.textContent = origText; btn.disabled = false; }
}