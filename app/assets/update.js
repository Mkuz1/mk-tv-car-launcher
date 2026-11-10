// In-app updates, for the TV, car and phone home screens: once a day (and when asked) the app looks
// for a newer release (Updater.java). A Liquid Glass card offers it; Update downloads the right APK,
// checks it and opens Android's install screen. On the car, MK Car Helper is updated first.
// Works with touch and with a TV remote (left / right, OK, Back). Not in Google Play builds.
(function () {
  const TV = window.TV || window.MOCK_TV;
  if (!TV || !TV.appVersion) return;
  let me = {};
  try { me = JSON.parse(TV.appVersion()); } catch (e) {}
  if (!me.can) return;

  const ar = () => document.documentElement.lang === "ar";
  const S = {
    en: {
      title: "Update available", latest: "You're up to date", checking: "Checking for updates…",
      have: (n, a, b) => `${n} ${a} (you have ${b})`, later: "Later", update: "Update", close: "Close", retry: "Try Again",
      downloading: (p) => (p >= 0 ? `Downloading… ${p}%` : "Downloading…"), installing: "Confirm the update in Android's window",
      permission: "Allow this app to install updates (the switch Android just opened), then tap Update again.",
      done: "Updated", error: (m) => `The update didn't finish: ${m}`, offline: "Couldn't check for updates. Is the device online?",
      current: (n, v) => `${n} ${v}`,
      ready: "Ready to install", saved: (f) => `Saved in Download: ${f}`,
      openIt: "Open it in your file manager (ES Explorer) to install, as you installed the app.",
      storage: "Allow storage access (Android just asked), then tap Update again.",
    },
    ar: {
      title: "تحديث متوفر", latest: "لديك أحدث إصدار", checking: "جارٍ البحث عن تحديثات…",
      have: (n, a, b) => `${n} ${a} (لديك ${b})`, later: "لاحقاً", update: "تحديث", close: "إغلاق", retry: "إعادة المحاولة",
      downloading: (p) => (p >= 0 ? `جارٍ التنزيل… ${p}%` : "جارٍ التنزيل…"), installing: "أكّد التحديث في نافذة Android",
      permission: "اسمح لهذا التطبيق بتثبيت التحديثات (من الإعداد الذي فتحه Android)، ثم اضغط تحديث مرة أخرى.",
      done: "تم التحديث", error: (m) => `لم يكتمل التحديث: ${m}`, offline: "تعذّر البحث عن تحديثات. هل الجهاز متصل بالإنترنت؟",
      current: (n, v) => `${n} ${v}`,
      ready: "جاهز للتثبيت", saved: (f) => `حُفظ في مجلد التنزيلات: ${f}`,
      openIt: "افتحه بمدير الملفات (ES Explorer) لتثبيته، كما ثبّت التطبيق أول مرة.",
      storage: "اسمح بالوصول إلى التخزين (طلبه Android الآن)، ثم اضغط تحديث مرة أخرى.",
    },
  };
  const T = (k, ...a) => { const v = S[ar() ? "ar" : "en"][k]; return typeof v === "function" ? v(...a) : v; };
  const NAMES = { "com.mk.homedash": "MK TV Launcher", "com.mk.carlauncher": "MK Car Launcher", "com.mk.phonelauncher": "MK Launcher", "com.mk.splithelper": "MK Car Helper" };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem("upd." + k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("upd." + k, JSON.stringify(v)); } catch (e) {} },
  };

  const css = document.createElement("style");
  css.textContent = `
    #mkUpd { position: fixed; left: 50%; bottom: max(24px, 4vh); z-index: 9999; width: min(560px, calc(100vw - 32px)); transform: translate(-50%, calc(100% + 80px)); visibility: hidden;
      transition: transform .45s cubic-bezier(.2,.8,.2,1), visibility 0s .45s; border-radius: 28px; padding: 20px 22px 16px; color: #fff;
      font: 500 clamp(15px, 2.1vh, 22px)/1.35 Inter, Roboto, system-ui, sans-serif;
      background: linear-gradient(160deg, rgba(255,255,255,.20), rgba(255,255,255,.07) 45%, rgba(255,255,255,.05)), rgba(26,32,40,.92);
      box-shadow: inset 0 1.5px 0 rgba(255,255,255,.55), inset 0 0 0 1px rgba(255,255,255,.14), 0 18px 46px rgba(0,0,0,.45); }
    #mkUpd.on { transform: translate(-50%, 0); visibility: visible; transition: transform .45s cubic-bezier(.2,.8,.2,1); }
    #mkUpd .u-t { font-weight: 800; font-size: 1.25em; display: flex; align-items: center; gap: 10px; }
    #mkUpd .u-t i { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(180deg, #F4D597, #DDB066); flex: 0 0 auto;
      display: flex; align-items: center; justify-content: center; color: #1B1407; font-style: normal; font-size: 18px; }
    #mkUpd .u-l { margin-top: 6px; color: rgba(255,255,255,.78); }
    #mkUpd .u-bar { height: 6px; border-radius: 3px; background: rgba(255,255,255,.18); margin-top: 12px; overflow: hidden; display: none; }
    #mkUpd .u-bar b { display: block; height: 100%; width: 0; background: #0A84FF; transition: width .2s; }
    #mkUpd.busy .u-bar { display: block; }
    #mkUpd .u-b { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }
    #mkUpd button { font: inherit; font-weight: 700; color: #fff; border: 0; border-radius: 999px; min-height: 48px; padding: 0 24px; background: rgba(255,255,255,.14);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.3); outline: none; transition: transform .15s; }
    #mkUpd button.main { background: linear-gradient(180deg, #fff, #E9ECF1); color: #111; }
    #mkUpd button.focus { box-shadow: 0 0 0 3px #E2BC74; transform: scale(1.04); }
    #mkUpd button:active { transform: scale(.95); }
    html[lang=ar] #mkUpd { font-family: "Amiri", serif; }`;
  document.head.appendChild(css);
  const card = document.createElement("div");
  card.id = "mkUpd";
  card.setAttribute("dir", "auto");
  document.body.appendChild(card);

  let info = null, queue = [], manual = false, focus = 1, btns = [], saved = [];
  const open = () => card.classList.contains("on");
  function show(title, lines, buttons, busy = false) {
    card.innerHTML = `<div class="u-t"><i>↑</i><span>${esc(title)}</span></div>` + lines.map((l) => `<div class="u-l">${esc(l)}</div>`).join("") +
      `<div class="u-bar"><b></b></div><div class="u-b">${buttons.map(([t, , main], i) => `<button data-i="${i}" class="${main ? "main" : ""}">${esc(t)}</button>`).join("")}</div>`;
    btns = buttons;
    focus = Math.max(0, buttons.findIndex((b) => b[2]));
    card.classList.toggle("busy", busy);
    card.classList.add("on");
    markFocus();
  }
  function hide() { card.classList.remove("on"); }
  function markFocus() { [...card.querySelectorAll("button")].forEach((b, i) => b.classList.toggle("focus", i === focus && document.body.dataset.remote === "1")); }
  card.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) btns[+b.dataset.i][1](); });

  // What's newer, as lines.
  function lines() {
    const out = [];
    for (const k of ["self", "helper"]) {
      const a = info && info[k];
      if (a && a.newer) out.push(T("have", NAMES[a.package] || a.package, a.name, a.current));
    }
    return out;
  }
  window.onUpdateInfo = (i) => {
    info = i;
    store.set("checkedAt", Date.now());
    if (i.error) { if (manual) show(T("offline"), [], [[T("close"), hide, true]]); manual = false; return; }
    const l = lines();
    if (!l.length) {
      if (manual) show(T("latest"), [T("current", NAMES[i.self && i.self.package] || "", me.version)], [[T("close"), hide, true]]);
      manual = false;
      return;
    }
    // Shown by itself once per new version; asking again always shows it.
    const key = (i.tag || "") + l.join();
    if (!manual && store.get("dismissed", "") === key) return;
    manual = false;
    show(T("title"), l, [[T("later"), () => { store.set("dismissed", key); hide(); }], [T("update"), start, true]]);
  };
  function start() {
    // The helper first: updating this app ends it.
    queue = [];
    saved = [];
    if (info && info.helper && info.helper.newer) queue.push("helper");
    if (info && info.self && info.self.newer) queue.push("self");
    next();
  }
  function next() {
    const w = queue.shift();
    if (!w) return hide();
    show(T("title"), [T("downloading", -1)], [[T("later"), hide]], true);
    try { TV.installUpdate(w); } catch (e) {}
  }
  window.onUpdateStatus = (s) => {
    const bar = card.querySelector(".u-bar b");
    if (s.state === "downloading") {
      const p = +s.detail;
      const l = card.querySelector(".u-l");
      if (l) l.textContent = T("downloading", p);
      if (bar && p >= 0) bar.style.width = p + "%";
    } else if (s.state === "installing") {
      show(T("title"), [T("installing")], [[T("close"), hide]], true);
      if (card.querySelector(".u-bar b")) card.querySelector(".u-bar b").style.width = "100%";
    } else if (s.state === "saved") {
      // Car: the APK waits in Download for the file manager.
      saved.push(String(s.detail || "").split("/").pop());
      if (queue.length) return next();
      show(T("ready"), saved.map((f) => T("saved", f)).concat(T("openIt")), [[T("close"), hide, true]]);
    } else if (s.state === "storage") {
      show(T("title"), [T("storage")], [[T("later"), hide], [T("update"), start, true]]);
    } else if (s.state === "permission") {
      show(T("title"), [T("permission")], [[T("later"), hide], [T("update"), start, true]]);
    } else if (s.state === "done") {
      if (queue.length) next(); else show(T("done"), [], [[T("close"), hide, true]]);
    } else if (s.state === "error") {
      show(T("title"), [T("error", s.detail || "")], [[T("close"), hide], [T("retry"), start, true]]);
    }
  };

  // A TV remote: left / right between the buttons, OK presses, Back closes. Nothing else gets the keys.
  const KEYS = { 37: "left", 39: "right", 13: "ok", 23: "ok", 66: "ok", 27: "back", 4: "back" };
  const keyOf = (e) => ({ ArrowLeft: "left", ArrowRight: "right", Enter: "ok", Escape: "back", GoBack: "back" })[e.key] || KEYS[e.keyCode];
  for (const type of ["keydown", "keyup"]) {
    addEventListener(type, (e) => {
      if (!open()) return;
      const k = keyOf(e);
      if (!k && !/^Arrow/.test(e.key || "")) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (type !== "keydown") return;
      document.body.dataset.remote = "1";
      if (k === "left") focus = Math.max(0, focus - 1);
      else if (k === "right") focus = Math.min(btns.length - 1, focus + 1);
      else if (k === "ok" && btns[focus]) return btns[focus][1]();
      else if (k === "back") return hide();
      markFocus();
    }, true);
  }
  // Back (the page's own handler) closes the card first.
  const wrapBack = () => {
    const prev = window.onTvBack;
    if (prev && prev.__mkUpd) return;
    const f = () => (open() ? hide() : prev && prev());
    f.__mkUpd = true;
    window.onTvBack = f;
  };
  wrapBack();

  function check(isManual) {
    manual = !!isManual;
    if (manual) show(T("checking"), [], [[T("close"), hide]]);
    try { TV.checkUpdate(); } catch (e) {}
  }
  // Once a day: a few seconds after the start, and when the home screen comes back.
  const daily = () => { if (Date.now() - store.get("checkedAt", 0) > 20 * 3600000) check(false); };
  setTimeout(daily, 8000);
  const prevResume = window.onTvResume;
  window.onTvResume = function () { if (prevResume) prevResume.apply(this, arguments); setTimeout(daily, 3000); wrapBack(); };

  window.MKUpdate = { check: () => check(true), version: me.version };
})();
