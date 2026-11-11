/* Capa PWA del Simulador Variforma: biblioteca, ejemplos, SW, share/file handlers. */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  const EXAMPLES = [
    {
      id: "example:copa",
      name: "O9000_copa_demo_v2_4_1.NCD",
      label: "Copa O9000 (generado)",
      hint: "Programa de demostración con mandril y pestañado.",
      url: "examples/O9000_copa_demo_v2_4_1.NCD"
    }
  ];
  const DB_NAME = "variforma-sim";
  const DB_STORE = "library";
  const LS_KEY = "variforma-sim-library";
  const LAST_KEY = "variforma-sim-library-last";
  const MAX_RECENT = 40;

  function $(id) { return document.getElementById(id); }
  function toast(msg, ms) {
    if (typeof window.toast === "function") window.toast(msg, ms);
  }
  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true
      || document.referrer.indexOf("android-app://") === 0;
  }
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  /* ---------- IndexedDB con respaldo en localStorage ---------- */
  function idb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("no idb"));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          const st = db.createObjectStore(DB_STORE, { keyPath: "id" });
          st.createIndex("lastOpenedAt", "lastOpenedAt");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function lsAll() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function lsWrite(items) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch (e) {}
  }
  async function libAll() {
    try {
      const db = await idb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readonly");
        const req = tx.objectStore(DB_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return lsAll();
    }
  }
  async function libPut(rec) {
    try {
      const db = await idb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).put(rec);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      // espejo reducido en localStorage por si IDB se borra (sin el texto si es enorme)
      const items = lsAll().filter((x) => x.id !== rec.id);
      items.unshift(rec);
      lsWrite(items.slice(0, MAX_RECENT));
    } catch (e) {
      const items = lsAll().filter((x) => x.id !== rec.id);
      items.unshift(rec);
      lsWrite(items.slice(0, MAX_RECENT));
    }
  }
  async function libDelete(id) {
    try {
      const db = await idb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).delete(id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {}
    lsWrite(lsAll().filter((x) => x.id !== id));
    try {
      if (localStorage.getItem(LAST_KEY) === id) localStorage.removeItem(LAST_KEY);
    } catch (e2) {}
  }
  function fileId(name) {
    return "file:" + String(name || "programa.NCD").replace(/\s+/g, " ").trim();
  }
  async function remember(name, text, source) {
    const now = Date.now();
    const id = fileId(name);
    let prev = null;
    try { prev = (await libAll()).find((x) => x.id === id); } catch (e) {}
    const rec = {
      id: id,
      name: name || (prev && prev.name) || "programa.NCD",
      text: String(text == null ? (prev && prev.text) : text),
      source: source || (prev && prev.source) || "user",
      updatedAt: now,
      lastOpenedAt: now,
      size: String(text == null ? (prev && prev.text) : text).length
    };
    await libPut(rec);
    try { localStorage.setItem(LAST_KEY, rec.id); } catch (e) {}
    // recortar
    const all = (await libAll()).sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
    for (const extra of all.slice(MAX_RECENT)) {
      if (String(extra.source) !== "example") await libDelete(extra.id);
    }
    return rec;
  }

  /* ---------- UI biblioteca / avisos ---------- */
  function ensureUi() {
    if ($("libSheet")) return;
    const style = document.createElement("style");
    style.textContent = [
      ".pwa-update{display:none;position:fixed;top:0;left:0;right:0;z-index:40;background:#1a4a7a;color:#e8edf4;",
      "padding:10px 12px;padding-top:max(10px,env(safe-area-inset-top));font-size:14px;gap:8px;align-items:center;flex-wrap:wrap;}",
      ".pwa-update.show{display:flex;}",
      ".pwa-update .btn{min-height:44px;}",
      ".pwa-sheet-back{display:none;position:fixed;inset:0;z-index:35;background:rgba(0,0,0,.5);align-items:flex-end;justify-content:center;}",
      ".pwa-sheet-back.show{display:flex;}",
      ".pwa-sheet{width:100%;max-width:560px;max-height:86vh;overflow:auto;background:#161b24;border:1px solid #2a3340;",
      "border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));}",
      "@media(min-width:700px){.pwa-sheet-back{align-items:center;}.pwa-sheet{border-radius:16px;max-height:80vh;}}",
      ".pwa-sheet h2{margin:0 0 8px;font-size:18px;}",
      ".pwa-sheet h3{margin:16px 0 8px;font-size:12px;color:#93a0b3;text-transform:uppercase;letter-spacing:.05em;}",
      ".pwa-item{display:flex;gap:10px;align-items:center;min-height:48px;padding:8px 10px;border:1px solid #2a3340;border-radius:8px;margin:0 0 8px;background:#1c2330;cursor:pointer;}",
      ".pwa-item:hover{border-color:#3b9eff;}",
      ".pwa-item .meta{flex:1;min-width:0;}",
      ".pwa-item .nm{font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".pwa-item .ht{color:#93a0b3;font-size:13px;}",
      ".pwa-item .del{flex:none;min-width:44px;min-height:44px;}",
      ".pwa-hint{padding:8px 10px;background:rgba(59,158,255,.12);border:1px solid #2b6ea8;border-radius:8px;font-size:14px;margin:0 0 10px;}",
      "html.layout-mobile #btnLibrary,html.layout-mobile #btnInstall{min-height:44px;min-width:44px;}"
    ].join("");
    document.head.appendChild(style);

    const upd = document.createElement("div");
    upd.className = "pwa-update";
    upd.id = "pwaUpdate";
    upd.innerHTML = '<span>Hay una nueva versión del simulador.</span>'
      + '<button type="button" class="btn primary" id="pwaUpdateNow">Actualizar</button>'
      + '<button type="button" class="btn" id="pwaUpdateLater">Después</button>';
    document.body.appendChild(upd);

    const sheet = document.createElement("div");
    sheet.className = "pwa-sheet-back";
    sheet.id = "libSheet";
    sheet.hidden = true;
    sheet.innerHTML = '<div class="pwa-sheet" role="dialog" aria-modal="true" aria-labelledby="libTitle">'
      + '<h2 id="libTitle">Biblioteca</h2>'
      + '<div class="pwa-hint" id="libInstallHint" hidden></div>'
      + '<h3>Ejemplos incluidos</h3><div id="libExamples"></div>'
      + '<h3>Recientes</h3><div id="libRecent"></div>'
      + '<button type="button" class="btn" id="libClose" style="width:100%;margin-top:8px">Cerrar</button>'
      + "</div>";
    document.body.appendChild(sheet);

    $("libClose").addEventListener("click", closeLibrary);
    sheet.addEventListener("click", (e) => { if (e.target === sheet) closeLibrary(); });
    $("pwaUpdateNow").addEventListener("click", applyUpdate);
    $("pwaUpdateLater").addEventListener("click", () => $("pwaUpdate").classList.remove("show"));
  }

  function openLibrary() {
    ensureUi();
    renderLibrary();
    const el = $("libSheet");
    el.hidden = false;
    el.classList.add("show");
    const hint = $("libInstallHint");
    if (!isStandalone() && isIOS()) {
      hint.hidden = false;
      hint.textContent = "Para instalarla en el iPhone: en Safari, toque Compartir y luego «Añadir a pantalla de inicio».";
    } else if (!isStandalone() && !deferredPrompt) {
      hint.hidden = false;
      hint.textContent = "En Chrome para Android, use el menú «Añadir a la pantalla de inicio» o el botón Instalar si aparece.";
    } else {
      hint.hidden = true;
    }
  }
  function closeLibrary() {
    const el = $("libSheet");
    if (!el) return;
    el.classList.remove("show");
    el.hidden = true;
  }

  function fmtWhen(ts) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
    } catch (e) { return ""; }
  }

  async function renderLibrary() {
    const exRoot = $("libExamples");
    const recRoot = $("libRecent");
    if (!exRoot || !recRoot) return;
    exRoot.innerHTML = EXAMPLES.map((ex) =>
      '<div class="pwa-item" data-example="' + ex.id + '"><div class="meta"><div class="nm">'
      + escape(ex.label) + '</div><div class="ht">' + escape(ex.hint) + "</div></div></div>"
    ).join("");
    exRoot.querySelectorAll(".pwa-item").forEach((el) => {
      el.addEventListener("click", () => openExample(el.getAttribute("data-example")));
    });
    const items = (await libAll())
      .filter((x) => !String(x.id).startsWith("example:"))
      .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
    if (!items.length) {
      recRoot.innerHTML = '<div class="ht">Todavía no hay programas guardados. Ábralos con «Abrir archivo» o un ejemplo.</div>';
      return;
    }
    recRoot.innerHTML = items.map((it) =>
      '<div class="pwa-item" data-id="' + escapeAttr(it.id) + '"><div class="meta"><div class="nm">'
      + escape(it.name) + '</div><div class="ht">' + escape(fmtWhen(it.lastOpenedAt))
      + (it.size ? " · " + it.size + " caracteres" : "") + '</div></div>'
      + '<button type="button" class="btn del" data-del="' + escapeAttr(it.id) + '" title="Quitar de recientes">✕</button></div>'
    ).join("");
    recRoot.querySelectorAll(".pwa-item").forEach((el) => {
      el.addEventListener("click", (ev) => {
        if (ev.target.closest("[data-del]")) return;
        openRecent(el.getAttribute("data-id"));
      });
    });
    recRoot.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        await libDelete(btn.getAttribute("data-del"));
        renderLibrary();
      });
    });
  }
  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) { return escape(s); }

  async function openExample(id) {
    const ex = EXAMPLES.find((x) => x.id === id);
    if (!ex) return;
    try {
      const res = await fetch(ex.url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      window.openProgram(text, ex.name, false);
      await remember(ex.name, text, "example");
      closeLibrary();
      toast("Ejemplo abierto: " + ex.label);
    } catch (err) {
      toast("No se pudo cargar el ejemplo (¿está sin conexión y aún no se almacenó?).");
    }
  }
  async function openRecent(id) {
    const rec = (await libAll()).find((x) => x.id === id);
    if (!rec || rec.text == null) { toast("No se encontró el programa."); return; }
    window.openProgram(rec.text, rec.name, false);
    await remember(rec.name, rec.text, rec.source || "user");
    closeLibrary();
    toast("Abierto " + rec.name);
  }

  /* ---------- Enlazar con el simulador ---------- */
  function hookSimulator() {
    if (typeof window.openProgram === "function" && !window.openProgram.__pwaHooked) {
      const orig = window.openProgram;
      const wrapped = function (text, name, preloaded) {
        const r = orig.apply(this, arguments);
        remember(name || "programa.NCD", text, preloaded ? "example" : "user").catch(() => {});
        return r;
      };
      wrapped.__pwaHooked = true;
      window.openProgram = wrapped;
    }
    if (typeof window.saveNcd === "function" && !window.saveNcd.__pwaHooked) {
      const orig = window.saveNcd;
      const wrapped = function () {
        try {
          const name = (typeof window.editFileName === "function")
            ? window.editFileName(window.originalName || "programa.NCD")
            : (window.originalName || "programa.NCD");
          const text = ($("ed") && $("ed").value) || "";
          remember(name, text, "user").catch(() => {});
        } catch (e) {}
        return orig.apply(this, arguments);
      };
      wrapped.__pwaHooked = true;
      window.saveNcd = wrapped;
    }
  }

  /* ---------- share_target y file_handlers ---------- */
  async function consumeShareTarget() {
    try {
      const inbox = await caches.open("variforma-share-inbox");
      const res = await inbox.match("incoming");
      if (!res) return false;
      await inbox.delete("incoming");
      const rawName = res.headers.get("X-Filename");
      const name = rawName ? decodeURIComponent(rawName) : "compartido.NCD";
      const text = await res.text();
      if (typeof window.openProgram === "function") {
        window.openProgram(text, name, false);
        toast("Abierto desde compartir: " + name);
      }
      return true;
    } catch (e) { return false; }
  }

  function installFileHandler() {
    if (!("launchQueue" in window) || !window.launchQueue) return;
    window.launchQueue.setConsumer(async (params) => {
      const files = (params && params.files) || [];
      for (const handle of files) {
        try {
          const file = await handle.getFile();
          const text = await file.text();
          window.openProgram(text, file.name, false);
          toast("Abierto " + file.name);
        } catch (e) {
          toast("No se pudo abrir el archivo recibido.");
        }
      }
    });
  }

  /* ---------- Service worker y actualización ---------- */
  let waitingWorker = null;
  function showUpdate(worker) {
    waitingWorker = worker || waitingWorker;
    ensureUi();
    $("pwaUpdate").classList.add("show");
  }
  function applyUpdate() {
    if (waitingWorker) waitingWorker.postMessage("SKIP_WAITING");
    $("pwaUpdate").classList.remove("show");
  }
  async function registerSw() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) showUpdate(nw);
        });
      });
      setInterval(() => { try { reg.update(); } catch (e) {} }, 60 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") { try { reg.update(); } catch (e) {} }
      });
    } catch (err) {
      console.warn("SW no se registró:", err);
    }
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (window.__pwaRefreshing) return;
      window.__pwaRefreshing = true;
      location.reload();
    });
  }

  /* ---------- Instalar ---------- */
  let deferredPrompt = null;
  function setupInstall() {
    const btn = $("btnInstall");
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (btn && !isStandalone()) { btn.hidden = false; }
    });
    if (btn) {
      btn.addEventListener("click", async () => {
        if (!deferredPrompt) {
          openLibrary();
          return;
        }
        deferredPrompt.prompt();
        try { await deferredPrompt.userChoice; } catch (e) {}
        deferredPrompt = null;
        btn.hidden = true;
      });
    }
    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      if (btn) btn.hidden = true;
      toast("Simulador instalado. Ábralo desde la pantalla de inicio.");
    });
    if (isStandalone() && btn) btn.hidden = true;
  }

  async function restoreLast() {
    if (new URLSearchParams(location.search).has("share-target")) return;
    try {
      const lastId = localStorage.getItem(LAST_KEY);
      if (!lastId) return;
      const rec = (await libAll()).find((x) => x.id === lastId);
      if (rec && rec.text) {
        // no reentrar al hook de remember de forma ruidosa: openProgram lo guardará
        const orig = window.openProgram;
        if (typeof orig === "function") orig(rec.text, rec.name, false);
      }
    } catch (e) {}
  }

  function addHeaderButtons() {
    const actions = document.querySelector(".hdr-actions");
    if (!actions || $("btnLibrary")) return;
    const lib = document.createElement("button");
    lib.type = "button";
    lib.className = "btn";
    lib.id = "btnLibrary";
    lib.textContent = "Biblioteca";
    lib.title = "Ejemplos y programas recientes";
    lib.addEventListener("click", openLibrary);
    const inst = document.createElement("button");
    inst.type = "button";
    inst.className = "btn primary";
    inst.id = "btnInstall";
    inst.textContent = "Instalar";
    inst.title = "Añadir a la pantalla de inicio";
    inst.hidden = true;
    const openBtn = $("btnOpen") || $("btnSave") || actions.firstElementChild;
    if (openBtn && openBtn.parentNode === actions) {
      actions.insertBefore(lib, openBtn);
      actions.insertBefore(inst, openBtn);
    } else {
      actions.appendChild(lib);
      actions.appendChild(inst);
    }
  }

  async function boot() {
    ensureUi();
    addHeaderButtons();
    hookSimulator();
    setupInstall();
    installFileHandler();
    await registerSw();
    const fromShare = new URLSearchParams(location.search).has("share-target");
    if (fromShare) {
      hookSimulator();
      const ok = await consumeShareTarget();
      if (ok) {
        history.replaceState({}, "", "./");
        return;
      }
    }
    // Si el simulador ya abrió un PRELOADED, no pisarlo.
    const hasPre = window.PRELOADED && window.PRELOADED.text;
    if (!hasPre) await restoreLast();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.__pwa = {
    openLibrary: openLibrary,
    closeLibrary: closeLibrary,
    examples: EXAMPLES,
    remember: remember,
    libAll: libAll,
    libDelete: libDelete,
    openExample: openExample,
    consumeShareTarget: consumeShareTarget,
    isStandalone: isStandalone
  };
})();
