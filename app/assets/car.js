// Car home screen (car/AndroidManifest.xml), touch first, in English or Arabic. Swipe left from Home for
// Drive (a big Google map and Now Playing, like CarPlay). Home: time, Wi-Fi, Cast,
// Settings, sidebar apps, an azkar widget (the travel dua when a trip starts), the Qibla compass, and prayer times for where the car is, with day / night modes.
// The App Drawer button opens every app in pages, with the TV home's options menu: Move, Add to
// Folder, Hide, Delete, folders with Rename and Remove.
// Smoothness: nothing is blurred live (the wallpaper is pre-blurred), only transform/opacity animate,
// and the app list is re-read only when an app was installed or removed.
(function () {
  const C = window.CONFIG;
  const D = window.DASH;
  const TV = window.TV || window.MOCK_TV;
  const $ = (id) => document.getElementById(id);
  const LONG_PRESS_MS = 480;
  // Saved through Android preferences (the page's localStorage can lose recent writes).
  const store = {
    get(k, d) { try { const v = JSON.parse(TV.getPref(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { TV.setPref(k, JSON.stringify(v)); } catch (e) {} },
  };
  const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const has = (cls) => document.body.classList.contains(cls);

  /* ---------------- language: English or Arabic ---------------- */
  const STR = {
    en: {
      apps: "Apps", moveHint: "Drag the app, or tap where it should go", done: "Done",
      move: "Move", addFolder: "Add to Folder", addSidebar: "Add to Sidebar", removeSidebar: "Remove from Sidebar",
      hide: "Hide", del: "Delete", showHidden: (n) => `Show ${n} hidden`, rename: "Rename", removeFolder: "Remove Folder",
      moveOut: "Move Out", newFolder: "New Folder", typeName: "Type a Name…", folderName: "Folder name",
      replace: (x) => `Replace ${x}`, moveUp: "Move Up", moveDown: "Move Down", moveLeft: "Move Left", moveRight: "Move Right",
      prayerTimes: (c) => `${c} Prayer Times`, prayerTimesNoCity: "Prayer Times",
      next: (name, mins) => `${name} in ${D.inMinutes(mins)}`,
      home: "Home", work: "Work", mosque: "Mosque", fuel: "Petrol", qibla: "Qibla",
      setHere: "Set to Current Location", typeAddress: "Type an Address", clear: "Clear",
      homeAddress: "Home address", workAddress: "Work address", noMaps: "Google Maps isn't installed",
      noFix: "Waiting for the car's GPS…", saved: (x) => `${x} saved`,
      qiblaTitle: "Qibla Direction", ahead: "Qibla is straight ahead", behind: "Qibla is behind you",
      turnRight: (d) => `Qibla ${d}° to your right`, turnLeft: (d) => `Qibla ${d}° to your left`,
      fromNorth: (d, c) => `Qibla ${d}° from North (${c})`, driveHint: "Drive a little and the compass turns with the car",
      makkah: (km) => `Makkah · ${km} km`,
      day: "Day", comfort: "Eye comfort", night: "Night", nightOn: "Night mode · tap ☀ for day", dayOn: "Day mode",
      travel: "Travel dua", lang: "ع",
      newPair: "New Pair", removePair: "Remove a Pair", pickTitle: "Choose two apps", cancel: "Cancel",
      pickFirst: "First app: on the left", pickSecond: "Second app: on the right", openSplit: "Open Side by Side",
      helperOn: "Turn On Split Helper", helperHint: "Not side by side? Turn on MK Split Screen in Accessibility",
      appMissing: "One of these apps isn't installed",
      helperGet: "Install mk-split-helper.apk from the Releases page, then turn it on here",
      mapsHome: "Use Google Maps Home", mapsWork: "Use Google Maps Work",
      openMaps: "Google Maps", offline: "No internet connection: the map shows when the car is online. Navigation still opens in Google Maps.",
      nothing: "Nothing playing", nowPlaying: "Now Playing",
      needHelper: "To see what's playing, install MK Car Helper (mk-split-helper.apk, version 1.1 or later). The buttons already work.",
      needAccess: "To see what's playing, allow MK Car Helper in Notification access. The buttons already work.", allow: "Allow",
      castTitle: "Cast from your phone",
      castText: "AirPlay and Google Cast need a receiver app on the head unit: Apple and Google don't let apps like this one receive casts by themselves. Install AirScreen (AirPlay, Google Cast, Miracast and DLNA) and the Cast button opens it. Already have one (ZLink, Autokit, EasyConnection…)? It opens that.",
      castGet: "Get AirScreen",
      notifications: "Notifications", clearAll: "Clear", cast: "Cast", split: "Split", settings: "Settings",
      noNotifs: "No notifications", notifHelper: "To see your notifications here, install MK Car Helper (mk-split-helper.apk, 1.2 or later).",
      notifAccess: "To see your notifications here, allow MK Car Helper in Notification access.", now: "now",
      ago: (m) => (m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`), allowAll: "Brightness for all apps: allow",
      androidPanel: "Android panel", updates: "Updates", files: "File Transfer", xfOn: "On: your phone can open the car's files", xfOff: "Off",
      xfStep1: "Connect your phone to the <b>same Wi-Fi</b> as the car (your iPhone's hotspot works).",
      xfStep1Hot: (s, p) => `Join the car's Wi-Fi <b>${s}</b> (password <b>${p}</b>): scan the first code.`,
      xfStep2: "Scan the code with the <b>camera</b> and open the page.", xfStep3: "Browse the car's folders, <b>Upload here</b>, download, rename or delete.",
      xfNoWifi: "The car isn't on Wi-Fi. Connect it to your phone's hotspot, or create the car's own Wi-Fi.",
      xfStart: "Start", xfStop: "Stop sharing", xfHotOn: "Create car Wi-Fi", xfHotOff: "Stop car Wi-Fi",
      xfHotNote: "The car's own Wi-Fi has no internet; while it's on, the car may leave your hotspot.",
      xfStorage: "Allow storage access on this screen when Android asks, then the files appear.",
      xfReceived: (n, f, s) => `Received ${n} (${s}) in ${f}`, xfDeleted: (n) => `Deleted ${n}`,
      xfJoin: "Car Wi-Fi", xfOpen: "Open files", xfHotFail: "Couldn't create the car's Wi-Fi (turn on Location and try again)",
    },
    ar: {
      apps: "التطبيقات", moveHint: "اسحب التطبيق أو اضغط حيث تريد نقله", done: "تم",
      move: "نقل", addFolder: "إضافة إلى مجلد", addSidebar: "إضافة إلى الشريط", removeSidebar: "إزالة من الشريط",
      hide: "إخفاء", del: "حذف", showHidden: (n) => `إظهار المخفي (${n})`, rename: "إعادة تسمية", removeFolder: "إلغاء المجلد",
      moveOut: "إخراج من المجلد", newFolder: "مجلد جديد", typeName: "كتابة اسم…", folderName: "اسم المجلد",
      replace: (x) => `استبدال ${x}`, moveUp: "نقل للأعلى", moveDown: "نقل للأسفل", moveLeft: "نقل لليسار", moveRight: "نقل لليمين",
      prayerTimes: (c) => `مواقيت الصلاة · ${c}`, prayerTimesNoCity: "مواقيت الصلاة",
      next: (name, mins) => { const h = Math.floor(mins / 60), m = mins % 60; return `${name} بعد ${h ? h + " س " : ""}${m} د`; },
      home: "المنزل", work: "العمل", mosque: "أقرب مسجد", fuel: "محطة وقود", qibla: "القبلة",
      setHere: "تعيين الموقع الحالي", typeAddress: "كتابة العنوان", clear: "مسح",
      homeAddress: "عنوان المنزل", workAddress: "عنوان العمل", noMaps: "خرائط Google غير مثبتة",
      noFix: "بانتظار موقع السيارة…", saved: (x) => `تم حفظ ${x}`,
      qiblaTitle: "اتجاه القبلة", ahead: "القبلة أمامك", behind: "القبلة خلفك",
      turnRight: (d) => `القبلة ${d}° إلى يمينك`, turnLeft: (d) => `القبلة ${d}° إلى يسارك`,
      fromNorth: (d) => `القبلة ${d}° من الشمال`, driveHint: "تحرّك قليلاً لتدور البوصلة مع اتجاه السيارة",
      makkah: (km) => `مكة المكرمة · ${km} كم`,
      day: "نهار", comfort: "راحة العين", night: "ليل", nightOn: "الوضع الليلي · اضغط ☀ للنهار", dayOn: "الوضع النهاري",
      travel: "دعاء السفر", lang: "EN",
      newPair: "زوج جديد", removePair: "حذف زوج", pickTitle: "اختر تطبيقين", cancel: "إلغاء",
      pickFirst: "التطبيق الأول: على اليسار", pickSecond: "التطبيق الثاني: على اليمين", openSplit: "فتح جنباً إلى جنب",
      helperOn: "تشغيل مساعد تقسيم الشاشة", helperHint: "لم تنقسم الشاشة؟ شغّل MK Split Screen من إعدادات تسهيل الاستخدام",
      appMissing: "أحد التطبيقين غير مثبت",
      helperGet: "ثبّت mk-split-helper.apk من صفحة الإصدارات ثم شغّله من هنا",
      mapsHome: "المنزل من خرائط Google", mapsWork: "العمل من خرائط Google",
      openMaps: "خرائط Google", offline: "لا يوجد اتصال بالإنترنت: تظهر الخريطة عند اتصال السيارة. الملاحة تعمل في خرائط Google.",
      nothing: "لا يوجد تشغيل", nowPlaying: "قيد التشغيل",
      needHelper: "لعرض ما يتم تشغيله، ثبّت MK Car Helper (‏mk-split-helper.apk الإصدار 1.1 أو أحدث). الأزرار تعمل الآن.",
      needAccess: "لعرض ما يتم تشغيله، اسمح لـ MK Car Helper في الوصول إلى الإشعارات. الأزرار تعمل الآن.", allow: "سماح",
      castTitle: "البث من هاتفك",
      castText: "يحتاج AirPlay وGoogle Cast إلى تطبيق استقبال على شاشة السيارة، فلا تسمح Apple وGoogle لتطبيقات مثل هذا بالاستقبال بنفسها. ثبّت AirScreen ‏(AirPlay وGoogle Cast وMiracast وDLNA) وسيفتحه زر البث. إن كان لديك تطبيق آخر (ZLink أو Autokit أو EasyConnection…) فسيفتحه.",
      castGet: "تنزيل AirScreen",
      notifications: "الإشعارات", clearAll: "مسح", cast: "بث", split: "تقسيم", settings: "الإعدادات",
      noNotifs: "لا توجد إشعارات", notifHelper: "لعرض إشعاراتك هنا، ثبّت MK Car Helper ‏(mk-split-helper.apk الإصدار 1.2 أو أحدث).",
      notifAccess: "لعرض إشعاراتك هنا، اسمح لـ MK Car Helper في الوصول إلى الإشعارات.", now: "الآن",
      ago: (m) => (m < 60 ? `قبل ${m} د` : `قبل ${Math.floor(m / 60)} س`), allowAll: "سطوع لكل التطبيقات: سماح",
      androidPanel: "لوحة Android", updates: "التحديثات", files: "نقل الملفات", xfOn: "يعمل: يمكن لهاتفك فتح ملفات السيارة", xfOff: "متوقف",
      xfStep1: "صِل هاتفك <b>بنفس شبكة Wi-Fi</b> المتصلة بها السيارة (نقطة اتصال الآيفون تعمل).",
      xfStep1Hot: (s, p) => `اتصل بشبكة السيارة <b>${s}</b> (كلمة المرور <b>${p}</b>): امسح الرمز الأول.`,
      xfStep2: "امسح الرمز <b>بالكاميرا</b> وافتح الصفحة.", xfStep3: "تصفّح مجلدات السيارة، <b>ارفع هنا</b>، نزّل، أعد التسمية أو احذف.",
      xfNoWifi: "السيارة غير متصلة بشبكة Wi-Fi. صِلها بنقطة اتصال هاتفك، أو أنشئ شبكة السيارة.",
      xfStart: "تشغيل", xfStop: "إيقاف المشاركة", xfHotOn: "إنشاء شبكة السيارة", xfHotOff: "إيقاف شبكة السيارة",
      xfHotNote: "شبكة السيارة بلا إنترنت، وقد تنفصل السيارة عن نقطة الاتصال أثناء تشغيلها.",
      xfStorage: "اسمح بالوصول إلى التخزين عندما يطلب Android، ثم تظهر الملفات.",
      xfReceived: (n, f, s) => `تم استلام ${n} (${s}) في ${f}`, xfDeleted: (n) => `تم حذف ${n}`,
      xfJoin: "شبكة السيارة", xfOpen: "فتح الملفات", xfHotFail: "تعذّر إنشاء شبكة السيارة (شغّل الموقع وحاول مجدداً)",
    },
  };
  let lang = store.get("car.lang", /^ar/.test(navigator.language || "") ? "ar" : "en");
  const T = (k, ...args) => { const v = STR[lang][k]; return typeof v === "function" ? v(...args) : v; };
  const ampm = (d) => (lang === "ar" ? (d.getHours() < 12 ? "ص" : "م") : D.ampm(d));

  /* ---------------- scaling ---------------- */
  // Designed 720 units tall on a landscape screen of any width (1920x720, 1280x720, 1024x600...),
  // 720 units wide on a portrait one (the dock moves to the bottom).
  let S = 1, SW = 1920, SH = 720;
  function fit() {
    // Android WebView reports innerWidth in device pixels; clientWidth is the real CSS width.
    const W = document.documentElement.clientWidth || innerWidth;
    const H = document.documentElement.clientHeight || innerHeight;
    const portrait = H > W;
    S = portrait ? W / 720 : H / 720;
    SW = Math.round(W / S); SH = Math.round(H / S);
    document.body.classList.toggle("portrait", portrait);
    document.body.classList.toggle("narrow", !portrait && SW < 1500);
    const el = $("stage");
    el.style.width = SW + "px";
    el.style.height = SH + "px";
    el.style.transform = `scale(${S})`;
    measure();
    fitDock();
    renderGrid();
    if (openItem) renderFolder();
    fitAzkarText();
    placeAlert();
  }
  addEventListener("resize", fit);
  // The prayer banner sits over the azkar card, so the clock and prayer list stay in view.
  function placeAlert() {
    const az = $("azkar"), main = $("main"), el = $("alert");
    const left = main.offsetLeft + az.offsetLeft, w = Math.min(640, az.offsetWidth - 40);
    el.style.width = w + "px";
    el.style.left = left + (az.offsetWidth - w) / 2 + "px";
    el.style.top = main.offsetTop + az.offsetTop + 20 + "px";
  }

  /* ---------------- dock: time, Wi-Fi, recent apps ---------------- */
  function wifiIcon(net) {
    if (net.type === "ethernet") {
      return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v4h3v8h-4v6H8v-6H4V7h3z"/></svg>';
    }
    if (net.type !== "wifi") {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/><path d="M3 3l18 18"/></svg>';
    }
    // Arcs light up with signal strength (0-4).
    const on = (n) => (net.level >= n ? "currentColor" : "rgba(127,127,127,.45)");
    return `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round">
      <path d="M2 8.5a15 15 0 0 1 20 0" stroke="${on(4)}"/><path d="M5.5 12a10 10 0 0 1 13 0" stroke="${on(3)}"/>
      <path d="M9 15.5a5 5 0 0 1 6 0" stroke="${on(2)}"/><circle cx="12" cy="19" r="1.6" fill="${on(1)}" stroke="none"/></svg>`;
  }
  let netKey = "";
  function updateNetwork() {
    let net = { type: "none", level: 0 };
    try { net = JSON.parse(TV.network()); } catch (e) {}
    const key = net.type + net.level;
    if (key !== netKey) { netKey = key; $("dkWifi").innerHTML = wifiIcon(net); }
  }

  // Sidebar apps: the ones you keep there (hold an app in the drawer → Add to Sidebar), up to
  // C.dockMax. Until you choose, the first apps of the home order.
  let dockKey = "";
  function dockPkgs() {
    const saved = store.get("car.dock", null);
    if (saved) return saved;
    return items.filter((it) => it.type === "app").slice(0, 3).map((it) => it.app.pkg);
  }
  const inDock = (pkg) => dockPkgs().includes(pkg);
  function setDock(pkgs) {
    store.set("car.dock", pkgs.slice(0, C.dockMax));
    renderDock();
  }
  function renderDock() {
    const byPkg = Object.fromEntries(installed.map((a) => [a.pkg, a]));
    const shown = dockPkgs().filter((p) => byPkg[p]).map((p) => byPkg[p]).slice(0, C.dockMax);
    const key = shown.map((a) => a.pkg).join();
    if (key === dockKey) return;
    dockKey = key;
    $("dkRecents").innerHTML = shown.map((a) =>
      `<button class="recent${a.small ? " small" : ""}" data-pkg="${escapeHtml(a.pkg)}" aria-label="${escapeHtml(a.label)}">${a.icon ? `<img src="${a.icon}" alt="" decoding="async">` : ""}</button>`).join("");
    fitDock();
  }
  // A full sidebar (four apps and every button) gets a little tighter instead of running off the screen.
  function fitDock() {
    const d = $("dock");
    d.classList.remove("tight");
    if (has("portrait")) return;
    if (d.scrollHeight > d.clientHeight + 1) d.classList.add("tight");
  }
  // Opening a navigation app (from the drawer, sidebar or favorites) starts a trip: travel dua.
  const NAV_APPS = new Set([
    "com.google.android.apps.maps", "com.google.android.apps.mapslite", "com.waze", "com.here.app.maps",
    "com.sygic.aura", "net.osmand", "net.osmand.plus", "ru.yandex.yandexnavi", "ru.yandex.yandexmaps",
    "app.organicmaps", "com.mapswithme.maps.pro", "com.tomtom.gplay.navapp", "com.baidu.BaiduMap", "com.autonavi.minimap",
  ]);
  function launch(a) {
    TV.launch(a.pkg);
    if (NAV_APPS.has(a.pkg) || a.category === 6) startTrip();
  }

  /* ---------------- apps, folders and their saved layout ---------------- */
  // layout (saved): entries are an app package, or a folder {id, name, apps: [packages]}.
  // items (shown): {type: "app", app} or {type: "folder", f, apps: [app]} — hidden/uninstalled apps left out.
  let installed = [], layout = [], items = [], appsStamp = -1;
  function loadApps(reread = true) {
    if (reread) {
      try { appsStamp = TV.appsStamp(); } catch (e) {}
      try { installed = JSON.parse(TV.apps()) || []; } catch (e) { installed = []; }
    }
    const hidden = new Set(store.get("home.hidden", []));
    const exclude = new Set(C.homeExclude);
    const visible = installed.filter((a) => !exclude.has(a.package || a.pkg) && !hidden.has(a.pkg));
    const byPkg = Object.fromEntries(visible.map((a) => [a.pkg, a]));
    layout = store.get("home.layout", null) || C.homeOrder.slice();
    const used = new Set();
    items = [];
    for (const e of layout) {
      if (typeof e === "string") {
        if (byPkg[e] && !used.has(e)) { used.add(e); items.push({ type: "app", app: byPkg[e] }); }
      } else if (e && Array.isArray(e.apps)) {
        const apps = e.apps.filter((p) => byPkg[p] && !used.has(p)).map((p) => byPkg[p]);
        apps.forEach((a) => used.add(a.pkg));
        if (apps.length) items.push({ type: "folder", f: e, apps });
      }
    }
    visible.filter((a) => !used.has(a.pkg)).sort((a, b) => a.label.localeCompare(b.label))
      .forEach((a) => items.push({ type: "app", app: a }));
  }
  // Save what is on screen, then rebuild from the saved layout (empty folders disappear).
  // Changes made here don't need the installed apps read again.
  function commit(reread = false) {
    layout = items.map((it) => (it.type === "app" ? it.app.pkg : it.f));
    store.set("home.layout", layout);
    const openId = openItem && openItem.f.id;
    loadApps(reread);
    renderGrid();
    renderDock();
    if (openId) {
      openItem = items.find((it) => it.type === "folder" && it.f.id === openId) || null;
      if (openItem) renderFolder(); else closeFolder();
    }
  }

  const CATEGORY_NAMES = {
    en: { 0: "Games", 1: "Music", 2: "Entertainment", 3: "Photos", 4: "Social", 5: "News", 6: "Navigation", 7: "Productivity" },
    ar: { 0: "ألعاب", 1: "موسيقى", 2: "ترفيه", 3: "صور", 4: "تواصل", 5: "أخبار", 6: "ملاحة", 7: "إنتاجية" },
  };
  function folderNameFor(apps) {
    const vendor = (p) => p.split(".").slice(0, 2).join(".");
    if (apps.every((a) => vendor(a.pkg) === "com.google")) return "Google";
    return CATEGORY_NAMES[lang][apps[0].category] || (lang === "ar" ? "مجلد" : "Folder");
  }

  /* ---------------- app drawer pages ---------------- */
  const G = { vw: 0, vh: 0, cols: 5, rows: 2, per: 10, icon: 116, cellW: 174, cellH: 160, pages: 1 };
  function measure() {
    const vp = $("viewport");
    G.vw = vp.offsetWidth; G.vh = vp.offsetHeight;
    G.rows = Math.max(1, Math.min(5, Math.floor(G.vh / 240)));
    G.icon = Math.round(Math.max(80, Math.min(118, (G.vh / G.rows) * 0.56)));
    G.cellW = Math.round(G.icon * 1.5);
    G.cellH = G.icon + 10 + 26;
    G.cols = Math.max(2, Math.min(10, Math.floor(G.vw / (G.icon * 1.6))));
    G.per = G.cols * G.rows;
    document.documentElement.style.setProperty("--icon", G.icon + "px");
  }

  function artHtml(a) {
    if (!a.icon) return `<div class="art"></div>`;
    // Older apps without an adaptive icon: shown smaller on the grey square, not stretched.
    return `<div class="art${a.small ? " small" : ""}"><img src="${a.icon}" alt="" decoding="async"></div>`;
  }
  function tileHtml(it, i) {
    if (it.type === "app") return `<div class="app" data-i="${i}">${artHtml(it.app)}<div class="name">${escapeHtml(it.app.label)}</div></div>`;
    const minis = it.apps.slice(0, 9).map((a) => `<div class="mini">${a.icon ? `<img src="${a.icon}" alt="" decoding="async">` : ""}</div>`).join("");
    return `<div class="app folder" data-i="${i}"><div class="art"><div class="minis">${minis}</div></div><div class="name">${escapeHtml(it.f.name)}</div></div>`;
  }

  let page = 0;
  function renderGrid() {
    G.pages = Math.max(1, Math.ceil(items.length / G.per));
    let html = "";
    for (let p = 0; p < G.pages; p++) {
      const tiles = items.slice(p * G.per, (p + 1) * G.per).map((it, k) => tileHtml(it, p * G.per + k)).join("");
      html += `<div class="page" style="left:${p * G.vw}px;width:${G.vw}px;` +
        `grid-template-columns:repeat(${G.cols},${G.cellW}px);grid-template-rows:repeat(${G.rows},${G.cellH}px)">${tiles}</div>`;
    }
    $("pages").innerHTML = html;
    $("dots").innerHTML = Array.from({ length: G.pages }, (_, p) => `<button class="dot" data-p="${p}"></button>`).join("");
    $("dots").classList.toggle("one", G.pages < 2);
    view.main.idx = Math.min(view.main.idx, Math.max(0, items.length - 1));
    goPage(Math.min(page, G.pages - 1), false);
    renderFocus();
  }
  function setTrack(offset) {
    $("pages").style.transform = `translate3d(${Math.round(-page * G.vw + offset)}px,0,0)`;
  }
  function goPage(p, glide = true) {
    page = Math.max(0, Math.min(G.pages - 1, p));
    $("pages").classList.toggle("glide", glide);
    setTrack(0);
    [...$("dots").children].forEach((d, i) => d.classList.toggle("on", i === page));
  }

  /* ---------------- drawer open / close ---------------- */
  let fullTimer = null;
  function openDrawer() {
    if (has("drawer-open")) return;
    clearTimeout(fullTimer);
    document.body.classList.remove("drawer-shut");
    document.body.classList.add("drawer-open");
    // Once the drawer covers it, the home page stops being painted at all.
    fullTimer = setTimeout(() => document.body.classList.add("drawer-full"), 360);
    ctx = "main";
    zone = "grid";
    renderFocus();
  }
  function closeDrawer(instant = false) {
    if (!has("drawer-open")) return;
    clearTimeout(fullTimer);
    if (zone === "move") endMove();
    if (openItem) closeFolder();
    if (!$("pop").hidden) closePop();
    document.body.classList.remove("drawer-full");
    document.body.classList.toggle("drawer-shut", instant);
    document.body.classList.remove("drawer-open");
    zone = "grid";
    renderFocus();
  }

  /* ---------------- folder ---------------- */
  let openItem = null, fcols = 4;
  const folderList = () => openItem.apps.map((a) => ({ type: "app", app: a }));
  function renderFolder() {
    // A glass platter over the drawer, up to three rows tall; more rows scroll.
    const main = $("main");
    fcols = Math.max(2, Math.min(G.cols - 1, Math.ceil(Math.sqrt(openItem.apps.length * 1.6))));
    const w = Math.min(main.offsetWidth - 60, fcols * G.cellW + (fcols + 1) * 30 + 40);
    const h = Math.min(main.offsetHeight - 30, 104 + Math.min(3, Math.ceil(openItem.apps.length / fcols)) * (G.cellH + 22) + 34);
    const pl = document.querySelector(".fd-platter");
    pl.style.width = w + "px";
    pl.style.height = h + "px";
    pl.style.left = main.offsetLeft + (main.offsetWidth - w) / 2 + "px";
    pl.style.top = main.offsetTop + (main.offsetHeight - h) / 2 + "px";
    $("fdTitle").textContent = openItem.f.name;
    const g = $("fdGrid");
    g.style.gridTemplateColumns = `repeat(${fcols},${G.cellW}px)`;
    g.style.gridAutoRows = G.cellH + "px";
    g.innerHTML = folderList().map(tileHtml).join("");
    view.folder.idx = Math.min(view.folder.idx, Math.max(0, openItem.apps.length - 1));
    renderFocus();
  }
  function openFolder(it) {
    openItem = it;
    ctx = "folder";
    view.folder.idx = 0;
    renderFolder();
    $("fdScroll").scrollTop = 0;
    document.body.classList.add("folder-open");
  }
  function closeFolder() {
    ctx = "main";
    openItem = null;
    document.body.classList.remove("folder-open");
    renderFocus();
  }

  /* ---------------- focus (keys) and move ---------------- */
  // ctx: which grid ("main" drawer pages or the open "folder").
  // zone: "grid" | "dock" | "pop" (options menu) | "move" | "prompt" (rename dialog open)
  let ctx = "main", zone = "grid", popIdx = 0, popActions = [], dockIdx = 0;
  const view = { main: { idx: 0 }, folder: { idx: 0 } };
  const cur = () => view[ctx];
  const list = () => (ctx === "main" ? items : folderList());
  const tileEl = (c, i) => (c === "main" ? $("pages") : $("fdGrid")).querySelector(`.app[data-i="${i}"]`);
  const dockEls = () => [$("dkWifi"), ...$("dkRecents").children, $("dkSplit"), $("dkSettings"), $("dkDrawer")];
  let lastFocus = null, lastMoving = null;

  function renderFocus() {
    const el = has("drawer-open") ? tileEl(ctx, cur().idx) : null;
    const focus = el && (zone === "grid" || zone === "pop" || zone === "prompt") ? el : null;
    const moving = el && zone === "move" ? el : null;
    if (lastFocus !== focus) { if (lastFocus) lastFocus.classList.remove("focused"); if (focus) focus.classList.add("focused"); lastFocus = focus; }
    if (lastMoving !== moving) { if (lastMoving) lastMoving.classList.remove("moving"); if (moving) moving.classList.add("moving"); lastMoving = moving; }
    dockEls().forEach((d, i) => d.classList.toggle("focused", zone === "dock" && i === dockIdx));
    [...$("popItems").children].forEach((b, i) => b.classList.toggle("focused", i === popIdx));
    $("moveBar").hidden = zone !== "move";
    if (has("keys") && el) {
      if (ctx === "main" && Math.floor(cur().idx / G.per) !== page) goPage(Math.floor(cur().idx / G.per));
      if (ctx === "folder") el.scrollIntoView({ block: "nearest" });
    }
  }

  function moveFocus(dir) {
    const n = list().length;
    if (!n) return;
    const v = cur();
    if (ctx === "folder") {
      const col = v.idx % fcols;
      if (dir === "left" && col > 0) v.idx--;
      else if (dir === "right" && col < fcols - 1 && v.idx + 1 < n) v.idx++;
      else if (dir === "down" && v.idx + fcols < n) v.idx += fcols;
      else if (dir === "up" && v.idx - fcols >= 0) v.idx -= fcols;
      return;
    }
    const p = Math.floor(v.idx / G.per), k = v.idx % G.per, col = k % G.cols, row = Math.floor(k / G.cols);
    if (dir === "left") {
      if (col > 0) v.idx--;
      else if (p > 0) v.idx = (p - 1) * G.per + row * G.cols + G.cols - 1;
      else { zone = "dock"; dockIdx = dockEls().length - 1; }
    } else if (dir === "right") {
      if (col < G.cols - 1 && v.idx + 1 < n) v.idx++;
      else if (p < G.pages - 1) v.idx = Math.min(n - 1, (p + 1) * G.per + row * G.cols);
    } else if (dir === "down") {
      if (row < G.rows - 1 && v.idx + G.cols < n) v.idx += G.cols;
      else if (row < G.rows - 1 && Math.floor((n - 1 - p * G.per) / G.cols) > row) v.idx = n - 1;
    } else if (dir === "up" && row > 0) v.idx -= G.cols;
  }

  // Move mode: shift the app/folder being moved to another place within its grid.
  function moveTo(to) {
    const arr = ctx === "main" ? items : openItem.apps;
    const v = cur(), n = arr.length;
    to = Math.max(0, Math.min(n - 1, to));
    if (to === v.idx) return;
    const [x] = arr.splice(v.idx, 1);
    arr.splice(to, 0, x);
    v.idx = to;
    if (ctx === "main") {
      renderGrid();
      goPage(Math.floor(to / G.per));
    } else {
      // Keep any hidden apps in the folder after the visible ones.
      const shown = new Set(openItem.apps.map((a) => a.pkg));
      openItem.f.apps = openItem.apps.map((a) => a.pkg).concat(openItem.f.apps.filter((p) => !shown.has(p)));
      renderFolder();
    }
    renderFocus();
  }
  function moveByKey(dir) {
    const cols = ctx === "main" ? G.cols : fcols;
    const d = { left: -1, right: 1, up: -cols, down: cols }[dir];
    if (d) moveTo(cur().idx + d);
  }
  function endMove() {
    zone = "grid";
    renderFocus();
    commit();
  }

  /* ---------------- options menu (hold an app) ---------------- */
  const ICON = {
    move: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7l-4 5 4 5M17 7l4 5-4 5M3 12h18"/></svg>',
    hide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6 0 10 7 10 7a17.6 17.6 0 0 1-3.2 3.9M6.6 6.6C3.9 8.4 2 12 2 12s4 7 10 7a9.9 9.9 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    show: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
    rename: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>',
    ungroup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/><path d="M14 4h6v6M10 20H4v-6"/></svg>',
    keyboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 15.5h6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="18" rx="2"/><path d="M15 12h6M18 9v6"/></svg>',
    unpin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="18" rx="2"/><path d="M15 12h6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    split: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="2.5" y="4" width="8.5" height="16" rx="2.2"/><rect x="13" y="4" width="8.5" height="16" rx="2.2"/></svg>',
    access: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4.5" r="2.2"/><path d="M4 8.5l8 1.5 8-1.5.4 1.8-5.4 1.4V15l2 6.2-1.8.6L13 16h-2l-2.2 5.8-1.8-.6L9 15v-3.3L3.6 10.3z"/></svg>',
    mapsPin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
    apps: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="5" r="2.2"/><circle cx="12" cy="5" r="2.2"/><circle cx="19" cy="5" r="2.2"/><circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="12" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/></svg>',
  };

  // Above the app (below when there's no room); beside a sidebar app on a landscape screen.
  let popAnchor = null;
  function placePop() {
    const el = popAnchor || tileEl(ctx, cur().idx);
    if (!el) return;
    const pop = $("pop"), st = $("stage").getBoundingClientRect();
    const r = (el.querySelector(".art") || el).getBoundingClientRect();
    const side = !!popAnchor && !!popAnchor.closest("#dock") && !has("portrait");
    pop.classList.toggle("side", side);
    if (side) {
      const cy = (r.top + r.height / 2 - st.top) / S, h = pop.offsetHeight;
      const top = Math.max(14, Math.min(SH - 14 - h, cy - h / 2));
      pop.classList.remove("below");
      // Beside the sidebar: to its right, or to its left when the sidebar is on the right (Arabic).
      pop.style.left = (has("rtl") ? (r.left - st.left) / S - 24 - pop.offsetWidth : (r.right - st.left) / S + 24) + "px";
      pop.style.top = top + "px";
      const tail = pop.querySelector(".pop-tail");
      tail.style.left = "";
      tail.style.top = Math.max(24, Math.min(h - 24, cy - top)) + "px";
      return;
    }
    pop.querySelector(".pop-tail").style.top = "";
    const cx = (r.left + r.width / 2 - st.left) / S;
    const top = (r.top - st.top) / S, bottom = (r.bottom - st.top) / S;
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const left = Math.max(20, Math.min(SW - 20 - w, cx - w / 2));
    const below = top - 24 - h < 10;
    pop.classList.toggle("below", below);
    pop.style.left = left + "px";
    pop.style.top = (below ? bottom + 24 : top - 24 - h) + "px";
    pop.querySelector(".pop-tail").style.left = Math.max(30, Math.min(w - 30, cx - left)) + "px";
  }
  function showPop(actions, anchor = null) {
    popActions = actions;
    popAnchor = anchor;
    $("popItems").innerHTML = actions.map(([t, icon, , cls]) =>
      `<button class="pop-item ${cls || ""}">${icon}<span>${escapeHtml(t)}</span></button>`).join("");
    popIdx = 0;
    zone = "pop";
    document.body.classList.add("popping");
    renderFocus();
    placePop();
    $("pop").hidden = false;
  }
  function closePop() {
    $("pop").hidden = true;
    document.body.classList.remove("popping");
    if (zone === "pop") zone = "grid";
    renderFocus();
  }
  function startMove() {
    closePop();
    zone = "move";
    renderFocus();
  }
  function hideApp(a) {
    store.set("home.hidden", store.get("home.hidden", []).concat(a.pkg));
    closePop();
    commit();
  }
  function showHidden() {
    store.set("home.hidden", []);
    closePop();
    commit();
  }
  function del(a) {
    closePop();
    TV.uninstall(a.pkg); // the system asks to confirm; the list updates when we're back
  }

  function openPop() {
    const it = list()[cur().idx];
    if (!it) return;
    const hiddenCount = store.get("home.hidden", []).length;
    const actions = [];
    if (it.type === "folder") {
      actions.push([T("rename"), ICON.rename, () => startRename(it)]);
      actions.push([T("move"), ICON.move, startMove]);
      actions.push([T("removeFolder"), ICON.ungroup, () => ungroup(it)]);
    } else if (ctx === "main") {
      const a = it.app;
      actions.push([T("move"), ICON.move, startMove]);
      actions.push([T("addFolder"), ICON.folder, () => folderChoices(a)]);
      actions.push(sidebarAction(a));
      actions.push([T("hide"), ICON.hide, () => hideApp(a)]);
      if (!a.system) actions.push([T("del"), ICON.trash, () => del(a), "danger"]);
    } else {
      const a = it.app;
      actions.push([T("move"), ICON.move, startMove]);
      actions.push([T("moveOut"), ICON.out, () => moveOut(a)]);
      actions.push(sidebarAction(a));
      actions.push([T("hide"), ICON.hide, () => hideApp(a)]);
      if (!a.system) actions.push([T("del"), ICON.trash, () => del(a), "danger"]);
    }
    if (hiddenCount && it.type === "app") actions.push([T("showHidden", hiddenCount), ICON.show, showHidden]);
    showPop(actions);
  }

  // Sidebar: add (replacing one when it's full) or remove; reorder from the sidebar itself.
  function sidebarAction(a) {
    if (inDock(a.pkg)) return [T("removeSidebar"), ICON.unpin, () => { setDock(dockPkgs().filter((p) => p !== a.pkg)); closePop(); }];
    return [T("addSidebar"), ICON.pin, () => {
      const pkgs = dockPkgs();
      if (pkgs.length < C.dockMax) { setDock(pkgs.concat(a.pkg)); return closePop(); }
      const byPkg = Object.fromEntries(installed.map((x) => [x.pkg, x]));
      showPop(pkgs.map((p, i) => [T("replace", byPkg[p] ? byPkg[p].label : p), ICON.pin, () => {
        const next = pkgs.slice(); next[i] = a.pkg; setDock(next); closePop();
      }]));
    }];
  }
  function dockMenu(btn) {
    const pkgs = dockPkgs(), i = pkgs.indexOf(btn.dataset.pkg);
    if (i < 0) return;
    const swap = (j) => { const next = pkgs.slice(); [next[i], next[j]] = [next[j], next[i]]; setDock(next); closePop(); };
    const portrait = has("portrait"), actions = [];
    // On a portrait screen the sidebar runs along the bottom (right to left in Arabic).
    const back = portrait ? (lang === "ar" ? ["moveRight", ICON.right] : ["moveLeft", ICON.left]) : ["moveUp", ICON.up];
    const fwd = portrait ? (lang === "ar" ? ["moveLeft", ICON.left] : ["moveRight", ICON.right]) : ["moveDown", ICON.down];
    if (i > 0) actions.push([T(back[0]), back[1], () => swap(i - 1)]);
    if (i < pkgs.length - 1) actions.push([T(fwd[0]), fwd[1], () => swap(i + 1)]);
    actions.push([T("removeSidebar"), ICON.unpin, () => { setDock(pkgs.filter((p) => p !== btn.dataset.pkg)); closePop(); }, "danger"]);
    showPop(actions, btn);
  }

  // "Add to Folder": a new folder in this app's place, or any existing folder.
  function folderChoices(a) {
    const folders = items.filter((x) => x.type === "folder");
    showPop([
      [T("newFolder"), ICON.plus, () => newFolder(a)],
      ...folders.map((f) => [f.f.name, ICON.folder, () => addToFolder(a, f)]),
    ]);
  }
  function newFolder(a) {
    const i = items.findIndex((x) => x.type === "app" && x.app.pkg === a.pkg);
    const f = { id: "f" + Date.now().toString(36), name: folderNameFor([a]), apps: [a.pkg] };
    items[i] = { type: "folder", f, apps: [a] };
    closePop();
    commit();
  }
  function addToFolder(a, folder) {
    items = items.filter((x) => !(x.type === "app" && x.app.pkg === a.pkg));
    folder.f.apps = folder.f.apps.filter((p) => p !== a.pkg).concat(a.pkg);
    view.main.idx = Math.max(0, items.indexOf(folder));
    closePop();
    commit();
  }
  function moveOut(a) {
    const folder = openItem;
    folder.f.apps = folder.f.apps.filter((p) => p !== a.pkg);
    items.splice(items.indexOf(folder) + 1, 0, { type: "app", app: a });
    closePop();
    commit();
  }
  function ungroup(folder) {
    items.splice(items.indexOf(folder), 1, ...folder.apps.map((a) => ({ type: "app", app: a })));
    closePop();
    commit();
  }

  // Rename: one-tap names in the menu, or "Type a Name…" for the keyboard.
  const NAME_IDEAS = {
    en: ["Navigation", "Music", "Islamic", "Phone", "Entertainment", "Tools"],
    ar: ["الملاحة", "الموسيقى", "إسلامي", "الهاتف", "الترفيه", "أدوات"],
  };
  function startRename(folder) {
    const rename = (name) => { folder.f.name = name; closePop(); commit(); };
    showPop([
      [T("typeName"), ICON.keyboard, () => {
        closePop();
        zone = "prompt"; // the native dialog has the keys until it closes
        window.onPrompt = (text) => {
          zone = "grid";
          if (text && text.trim()) { folder.f.name = text.trim().slice(0, 24); commit(); } else renderFocus();
        };
        TV.promptText(T("folderName"), folder.f.name);
      }],
      ...NAME_IDEAS[lang].filter((n) => n !== folder.f.name).map((n) => [n, ICON.rename, () => rename(n)]),
    ]);
  }

  /* ---------------- touch ---------------- */
  // Tap opens, hold opens the menu, swipe sideways turns the page. In move mode, drag the
  // jiggling app (hold it at an edge to change page) or tap where it should go.
  let press = null, edgeTimer = null, frame = 0, pending = null;
  const keysOff = () => document.body.classList.remove("keys");

  function nearestTile(c, x, y, skip) {
    let best = null, bestD = Infinity;
    const root = c === "main" ? $("pages").children[page] : $("fdGrid");
    if (!root) return null;
    for (const el of root.querySelectorAll(".app")) {
      if (el === skip) continue;
      const r = el.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
      if (d < bestD) { bestD = d; best = el; }
    }
    return best;
  }

  function onDown(e, c) {
    if (e.button > 0 || zone === "prompt" || press) return;
    keysOff();
    const el = e.target.closest(".app");
    const i = el ? +el.dataset.i : -1;
    press = { c, el, i, x0: e.clientX, y0: e.clientY, t0: performance.now(), mode: null, long: false, id: e.pointerId };
    if (zone === "move") {
      if (el && c === ctx && i === cur().idx) { press.mode = "drag"; el.classList.add("lifted"); }
      return;
    }
    if (!el) return;
    el.classList.add("pressed");
    press.timer = setTimeout(() => {
      if (!press || press.el !== el || press.mode) return;
      press.long = true;
      el.classList.remove("pressed");
      ctx = c; cur().idx = i;
      openPop();
    }, LONG_PRESS_MS);
  }

  // Finger movement is applied once per frame.
  function onMove(e) {
    if (!press || e.pointerId !== press.id) return;
    pending = e;
    if (!frame) frame = requestAnimationFrame(applyMove);
  }
  function applyMove() {
    frame = 0;
    const e = pending;
    if (!press || !e) return;
    const dx = (e.clientX - press.x0) / S, dy = (e.clientY - press.y0) / S;
    if (press.mode === "drag") {
      press.el.style.transform = `translate3d(${dx}px,${dy}px,0) scale(1.12)`;
      dragEdge(e);
      return;
    }
    if (!press.mode && Math.hypot(dx, dy) > 10) {
      clearTimeout(press.timer);
      if (press.el) press.el.classList.remove("pressed");
      if (press.long) return;
      press.mode = press.c === "main" && Math.abs(dx) > Math.abs(dy) ? "swipe" : "scroll";
      if (press.mode === "swipe") { $("pages").classList.remove("glide"); press.x0 = e.clientX; }
      return;
    }
    if (press.mode === "swipe") {
      const atEnd = (page === 0 && dx > 0) || (page === G.pages - 1 && dx < 0);
      setTrack(atEnd ? dx / 3 : dx);
      press.vx = (e.clientX - (press.lx || press.x0)) / Math.max(1, performance.now() - (press.lt || press.t0));
      press.lx = e.clientX; press.lt = performance.now();
    }
  }

  function onUp(e) {
    if (!press || e.pointerId !== press.id) return;
    const p = press;
    press = null;
    cancelAnimationFrame(frame); frame = 0;
    clearTimeout(p.timer);
    clearTimeout(edgeTimer); edgeTimer = null;
    if (p.el) p.el.classList.remove("pressed");
    const dx = (e.clientX - p.x0) / S;
    if (p.mode === "swipe") {
      const v = (p.vx || 0) / S; // stage units per ms
      let to = page;
      if ((dx < -G.vw * 0.18 || v < -0.35) && page < G.pages - 1) to++;
      else if ((dx > G.vw * 0.18 || v > 0.35) && page > 0) to--;
      goPage(to);
      return;
    }
    if (p.mode === "drag") {
      p.el.classList.remove("lifted");
      p.el.style.transform = "";
      const target = nearestTile(p.c, e.clientX, e.clientY, p.el);
      if (target && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 20 * S) moveTo(+target.dataset.i);
      return;
    }
    if (p.long || p.mode || e.type === "pointercancel") return;
    if (zone === "move") {
      // Tap a place (or an app) in the same grid to move the jiggling app there.
      if (p.c !== ctx) return;
      const target = p.el || nearestTile(p.c, e.clientX, e.clientY);
      if (target) moveTo(+target.dataset.i);
      return;
    }
    if (!p.el) return;
    ctx = p.c; cur().idx = p.i;
    activate();
  }

  // Holding the dragged app at the left/right edge turns the page and takes it along.
  function dragEdge(e) {
    if (press.c !== "main") return;
    const r = $("viewport").getBoundingClientRect();
    const edge = 70 * S;
    const dir = e.clientX < r.left + edge ? -1 : e.clientX > r.right - edge ? 1 : 0;
    if (!dir) { clearTimeout(edgeTimer); edgeTimer = null; return; }
    if (edgeTimer) return;
    edgeTimer = setTimeout(() => {
      edgeTimer = null;
      const to = page + dir;
      if (!press || press.mode !== "drag" || to < 0 || to * G.per >= items.length + (dir > 0 ? G.per : 0)) return;
      press = null;
      moveTo(dir > 0 ? Math.min(items.length - 1, to * G.per) : to * G.per + G.per - 1);
    }, 600);
  }

  function activate() {
    const it = list()[cur().idx];
    if (!it) return;
    if (it.type === "folder") openFolder(it);
    else launch(it.app);
  }

  function bindGrid(el, c) {
    el.addEventListener("pointerdown", (e) => onDown(e, c));
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  }
  bindGrid($("viewport"), "main");
  bindGrid($("fdGrid"), "folder");
  // A finger lifted outside the grid (slid onto the dock) still ends the press.
  addEventListener("pointerup", (e) => press && onUp(e));

  $("folder").addEventListener("pointerdown", (e) => {
    if (e.target === $("folder") && zone !== "prompt") { if (zone === "move") endMove(); closeFolder(); }
  });
  $("scrim").addEventListener("pointerdown", (e) => { e.preventDefault(); closePop(); });
  $("popItems").addEventListener("click", (e) => {
    const b = e.target.closest(".pop-item");
    if (!b) return;
    const a = popActions[[...$("popItems").children].indexOf(b)];
    if (a) a[2]();
  });
  $("moveDone").addEventListener("click", endMove);
  $("dots").addEventListener("click", (e) => { const d = e.target.closest(".dot"); if (d) goPage(+d.dataset.p); });
  $("drClose").addEventListener("click", () => closeDrawer());

  // Dock
  // Sidebar apps: tap opens, hold for Move Up / Move Down / Remove.
  let dockHold = null, dockHeld = false;
  $("dkRecents").addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".recent");
    if (!b || zone === "prompt") return;
    dockHeld = false;
    clearTimeout(dockHold);
    dockHold = setTimeout(() => { dockHeld = true; if (zone === "move") endMove(); dockMenu(b); }, LONG_PRESS_MS);
  });
  for (const ev of ["pointerup", "pointercancel", "pointerleave"]) $("dkRecents").addEventListener(ev, () => clearTimeout(dockHold));
  $("dkRecents").addEventListener("click", (e) => {
    const b = e.target.closest(".recent");
    if (!b || dockHeld) return;
    const a = installed.find((x) => x.pkg === b.dataset.pkg);
    if (a) launch(a);
  });
  $("dkWifi").addEventListener("click", () => TV.openWifiSettings());
  $("dkSettings").addEventListener("click", () => TV.openSettings());
  $("dkDrawer").addEventListener("click", () => (has("drawer-open") ? closeDrawer() : openDrawer()));
  // Tap the azkar card for the next dhikr (or to leave the travel dua).
  $("azkar").addEventListener("click", () => {
    if (travelUntil > Date.now()) { travelUntil = 0; restoreAzkarTitle(); showDhikr(); return; }
    azIndex++;
    showDhikr();
  });

  /* ---------------- keys: steering-wheel buttons, rotary knob, keyboard ---------------- */
  const KEYS = {
    37: "left", 38: "up", 39: "right", 40: "down", 13: "ok", 23: "ok", 66: "ok",
    27: "back", 8: "back", 4: "back", 82: "options", 93: "options",
  };
  const NAMED = { ArrowLeft: "left", ArrowUp: "up", ArrowRight: "right", ArrowDown: "down", Enter: "ok", Escape: "back", GoBack: "back", ContextMenu: "options" };
  let okDownAt = 0, longTimer = null, longFired = false;

  document.addEventListener("keydown", (e) => {
    if (zone === "prompt") return;
    const k = NAMED[e.key] || KEYS[e.keyCode];
    if (!k) return;
    e.preventDefault();
    document.body.classList.add("keys");
    if (k === "ok") {
      // Holding OK opens the menu, like holding a finger on the icon.
      if (okDownAt) {
        if (!longFired && zone === "grid" && has("drawer-open") && Date.now() - okDownAt > 300) { clearTimeout(longTimer); longFired = true; openPop(); }
        return;
      }
      okDownAt = Date.now();
      longFired = false;
      if (zone === "grid" && has("drawer-open")) longTimer = setTimeout(() => { longFired = true; openPop(); }, LONG_PRESS_MS + 150);
      return;
    }
    handle(k);
  });
  document.addEventListener("keyup", (e) => {
    if (zone === "prompt") return;
    const k = NAMED[e.key] || KEYS[e.keyCode];
    if (k !== "ok") return;
    e.preventDefault();
    if (!okDownAt) return; // release of a press we didn't see start (e.g. Enter that closed rename)
    clearTimeout(longTimer);
    const wasLong = longFired;
    okDownAt = 0;
    longFired = false;
    if (!wasLong) handle("ok");
  });

  function handle(k) {
    if (zone === "grid" && !has("drawer-open")) zone = "dock"; // home: the keys move along the dock
    if (zone === "grid") {
      if (k === "ok") activate();
      else if (k === "options") openPop();
      else if (k === "back") {
        if (ctx === "folder") return closeFolder();
        return closeDrawer();
      } else moveFocus(k);
    } else if (zone === "dock") {
      const els = dockEls(), portrait = has("portrait");
      const prev = portrait ? "left" : "up", next = portrait ? "right" : "down", out = portrait ? "up" : "right";
      if (k === prev) dockIdx = Math.max(0, dockIdx - 1);
      else if (k === next) dockIdx = Math.min(els.length - 1, dockIdx + 1);
      else if ((k === out || k === "back") && has("drawer-open")) zone = "grid";
      else if (k === "back") dockIdx = els.length - 1;
      else if (k === "ok" && els[dockIdx]) { const el = els[dockIdx]; el.click(); if (el === $("dkDrawer") && has("drawer-open")) zone = "grid"; }
    } else if (zone === "pop") {
      if (k === "left" || k === "up") popIdx = Math.max(0, popIdx - 1);
      else if (k === "right" || k === "down") popIdx = Math.min(popActions.length - 1, popIdx + 1);
      else if (k === "back") return closePop();
      else if (k === "ok") return popActions[popIdx][2]();
    } else if (zone === "move") {
      if (k === "ok" || k === "back" || k === "options") return endMove();
      moveByKey(k);
    }
    renderFocus();
  }

  /* ---------------- time and Sharjah prayer times ---------------- */
  const DATE_OPTS = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  let dateFmt = new Intl.DateTimeFormat("en-GB", DATE_OPTS);
  let hijriFmt;
  try { hijriFmt = new Intl.DateTimeFormat("ar-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "long", year: "numeric" }); } catch (e) {}
  let today = null, tomorrow = null, lastDay = -1, lastMinute = -1;
  const now = () => new Date(Date.now() + (C.previewShiftMinutes || 0) * 60000);

  function tick() {
    const t = now();
    if (t.getDate() !== lastDay) {
      lastDay = t.getDate();
      today = prayerTimes(t, C);
      const n = new Date(t); n.setDate(n.getDate() + 1);
      tomorrow = prayerTimes(n, C);
      $("pDate").textContent = dateFmt.format(t);
      $("pHijri").textContent = hijriFmt ? hijriFmt.format(t) : "";
      $("prList").innerHTML = D.PRAYERS.map(([k, en, ar]) =>
        `<li data-k="${k}"><span class="en">${en}</span><span class="ar">${ar}</span><span class="tm">${D.hm(today[k])} <small>${ampm(today[k])}</small></span></li>`).join("");
      renderPlace();
      scheduleAlerts(t);
      lastMinute = -1;
    }
    renderAzProgress();
    checkAzkarPeriod(t);
    if (t.getMinutes() === lastMinute) return; // everything below changes once a minute
    lastMinute = t.getMinutes();
    $("clock").textContent = $("pTime").textContent = D.hm(t);
    $("clockAmpm").textContent = $("pAmpm").textContent = ampm(t);
    const next = D.nextPrayer(t, today, tomorrow);
    for (const li of $("prList").children) {
      const k = li.dataset.k;
      li.classList.toggle("next", k === next.key);
      li.classList.toggle("past", today[k] <= t && k !== next.key);
    }
    $("prNext").textContent = T("next", lang === "ar" ? PRAYER_AR[next.key] : next.name, next.minutes);
    renderAlert(t);
    autoNight(t);
    $("chips").innerHTML = D.dayReminders(t, today, C).map((c) => `<div class="chip">${c}</div>`).join("");
    updateNetwork();
  }

  /* ---------------- prayer times follow the car ---------------- */
  const PIN = '<svg class="pin" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';
  function renderPlace() {
    $("prLabel").innerHTML = (C.location === "gps" && C.located ? PIN : "") + escapeHtml(C.city ? T("prayerTimes", C.city) : T("prayerTimesNoCity"));
  }
  // New GPS positions are saved by the app; check once a minute and recompute when the car has moved.
  function checkCarLocation() {
    if (C.location !== "gps") return;
    let loc = null;
    try { loc = JSON.parse(TV.carLocation()); } catch (e) {}
    if (loc && window.applyCarLocation(C, loc)) { lastDay = -1; tick(); }
  }

  /* ---------------- silent prayer banner ---------------- */
  // On the home screen: a soft glass banner, no sound. In other apps: the same words as a silent
  // notification banner, scheduled with the system (PrayerAlert.java).
  const MOSQUE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5c.3 1.6 1.3 2.6 2.6 3.4C16.4 7 17.5 8.5 17.5 10.5V11h-11v-.5c0-2 1.1-3.5 2.9-4.6 1.3-.8 2.3-1.8 2.6-3.4zM5 12.5h14V21h-4.5v-4a2.5 2.5 0 0 0-5 0v4H5zM2 9.5a1 1 0 0 1 2 0V21H2zm18 0a1 1 0 0 1 2 0V21h-2z"/></svg>';
  const PRAYER_AR = { fajr: "الفجر", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء" };
  const arMinutes = (n) => n === 1 ? "دقيقة واحدة" : n === 2 ? "دقيقتان"
    : `${D.toArabicDigits(n)} ${n <= 10 ? "دقائق" : "دقيقة"}`;
  // [Arabic line, second line]: English, or the time in Arabic for the Arabic interface.
  const at2 = (t) => (lang === "ar" ? `الساعة ${D.hm(t)} ${ampm(t)}` : null);
  const soonText = (k, en, mins, t) => [`باقٍ ${arMinutes(mins)} على صلاة ${PRAYER_AR[k]}`, at2(t) || `${en} in ${mins} minute${mins === 1 ? "" : "s"} · ${D.hm(t)} ${D.ampm(t)}`];
  const nowText = (k, en, t) => [`حان الآن موعد صلاة ${PRAYER_AR[k]}`, at2(t) || `It's time for ${en} prayer · ${D.hm(t)} ${D.ampm(t)}`];
  let alertKey = "";
  function renderAlert(t) {
    const pa = C.prayerAlert, el = $("alert");
    let lines = null, mode = "", key = "";
    for (const [k, en] of D.PRAYERS) {
      if (!PRAYER_AR[k]) continue;
      const at = today[k], diff = at - t;
      if (diff > 0 && diff <= pa.minutesBefore * 60000) {
        const mins = Math.ceil(diff / 60000);
        lines = soonText(k, en, mins, at); mode = "soon"; key = k + mins;
      } else if (diff <= 0 && -diff < pa.minutesAfter * 60000) {
        lines = nowText(k, en, at); mode = "now"; key = k + "now";
      }
    }
    if (!pa.enabled || !lines) { el.hidden = true; alertKey = ""; return; }
    if (key === alertKey) return;
    alertKey = key;
    el.classList.toggle("now", mode === "now");
    placeAlert();
    el.innerHTML = `<div class="al-icon">${MOSQUE}</div><div class="al-text"><div class="al-ar" dir="rtl">${lines[0]}</div><div class="al-en">${lines[1]}</div></div>`;
    el.hidden = false;
  }
  function scheduleAlerts(t) {
    const pa = C.prayerAlert;
    if (!pa.enabled) { try { TV.schedulePrayerAlerts("[]"); } catch (e) {} return; }
    const list = [];
    for (const day of [today, tomorrow]) {
      for (const [k, en] of D.PRAYERS) {
        if (!PRAYER_AR[k]) continue;
        const at = day[k];
        const soon = soonText(k, en, pa.minutesBefore, at), now = nowText(k, en, at);
        list.push({ at: +at - pa.minutesBefore * 60000, title: soon[0], text: soon[1], minutes: pa.minutesBefore });
        list.push({ at: +at, title: now[0], text: now[1], minutes: pa.minutesAfter });
      }
    }
    try { TV.schedulePrayerAlerts(JSON.stringify(list.filter((a) => a.at > +t))); } catch (e) {}
  }

  /* ---------------- azkar widget ---------------- */
  // Morning, general or evening azkar by the time of day; each dhikr stays long enough to read.
  let azPeriod = null, azIndex = 0, azTimer = null, azStart = 0, azDwell = 0;
  function periodFor(t) {
    const h = t.getHours(), a = C.azkar;
    if (h >= a.morningFrom && h < a.generalFrom) return "morning";
    if (h >= a.generalFrom && h < a.eveningFrom) return "general";
    return "evening";
  }
  function checkAzkarPeriod(t) {
    const p = periodFor(t);
    if (p === azPeriod) return;
    azPeriod = p; azIndex = 0;
    const set = AZKAR[p];
    $("azTitle").textContent = set.title;
    $("azSub").textContent = set.subtitle;
    showDhikr(false);
  }
  function restoreAzkarTitle() {
    const set = AZKAR[azPeriod];
    $("azTitle").textContent = set.title;
    $("azSub").textContent = set.subtitle;
  }
  const REPEAT_AR = { 1: "مرة واحدة", 2: "مرتان", 3: "ثلاث مرات", 4: "أربع مرات", 7: "سبع مرات", 10: "عشر مرات", 100: "مائة مرة" };
  function showDhikr(animate = true) {
    if (travelUntil > Date.now()) return renderTravel();
    $("azkar").classList.remove("travel");
    const list = AZKAR[azPeriod].items;
    azIndex = (azIndex + list.length) % list.length;
    const item = list[azIndex];
    const body = $("azBody");
    const apply = () => {
      body.textContent = item.t;
      $("azRepeat").textContent = item.n > 1 ? REPEAT_AR[item.n] || `${item.n} مرات` : "";
      $("azCount").textContent = `${azIndex + 1} / ${list.length}`;
      fitAzkarText();
      body.classList.remove("fade");
    };
    if (animate) { body.classList.add("fade"); setTimeout(apply, 450); } else apply();
    azDwell = Math.min(75, Math.max(14, 6 + item.t.length * 0.09)) * 1000;
    azStart = Date.now();
    renderAzProgress();
    clearTimeout(azTimer);
    azTimer = setTimeout(() => { azIndex++; showDhikr(); }, azDwell);
  }
  // Moved once a second, not animated continuously, so the screen rests between updates.
  function renderAzProgress() {
    const pct = azDwell ? Math.min(1, (Date.now() - azStart) / azDwell) : 0;
    $("azBar").style.transform = `scaleX(${pct.toFixed(3)})`;
  }
  function fitAzkarText() {
    const body = $("azBody");
    if (!body.textContent) return;
    let size = 44;
    body.style.fontSize = size + "px";
    while (size > 22 && body.scrollHeight > body.clientHeight + 2) {
      size -= 2;
      body.style.fontSize = size + "px";
    }
  }

  /* ---------------- day / eye comfort / night ---------------- */
  // Day (normal), eye comfort (warmer, dimmer) or night (warmest, darkest): the page gets a warm dark
  // layer and the backlight is lowered while the home screen is in front (some head units ignore
  // that; the layer still works). Night comes on by itself at Maghrib and day at sunrise; a tap on
  // the buttons wins until the next sunrise or Maghrib.
  const BRIGHTNESS = [-1, 0.35, 0.08];
  let comfort = 0;
  function setComfort(level, save = true) {
    comfort = Math.max(0, Math.min(2, level));
    document.body.classList.remove("comfort-1", "comfort-2");
    if (comfort) document.body.classList.add("comfort-" + comfort);
    [...$("modeSeg").children].forEach((b) => b.classList.toggle("on", +b.dataset.m === comfort));
    try { TV.setBrightness(BRIGHTNESS[comfort]); } catch (e) {}
    if (save) store.set("car.comfort", comfort);
  }
  $("modeSeg").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) { e.stopPropagation(); setComfort(+b.dataset.m); }
  });
  function autoNight(t) {
    if (!C.nightAuto || !today) return;
    const period = t >= today.maghrib || t < today.sunrise ? "night" : "day";
    const last = store.get("car.period", null);
    if (last === period) return;
    store.set("car.period", period);
    setComfort(period === "night" ? C.nightLevel : 0);
    if (last) toast(T(period === "night" ? "nightOn" : "dayOn")); // not on the very first start
  }

  /* ---------------- favorite places, in Google Maps only ---------------- */
  // Home and Work: navigate to the places saved as Home and Work in your Google Maps (hold to use
  // another place instead: where the car is now, or a typed address).
  // Mosque and petrol: the nearest ones around the car. Each opens Google Maps and starts a trip.
  const near = () => `${C.latitude},${C.longitude}`;
  function maps(uri) {
    let ok = false;
    try { ok = TV.openMaps(uri); } catch (e) {}
    if (!ok) return toast(T("noMaps"));
    startTrip();
  }
  const favs = () => store.get("car.favs", {});
  function setFav(f, place) {
    const all = favs();
    if (place) all[f] = place; else delete all[f];
    store.set("car.favs", all);
    renderFavs();
  }
  function renderFavs() {
    const all = favs();
    document.querySelectorAll(".dv-fav").forEach((b) => b.classList.toggle("custom", !!all[b.dataset.f]));
  }
  function favTap(b) {
    const f = b.dataset.f;
    if (f === "qibla") return openQibla();
    if (f === "mosque") return maps(`geo:${near()}?q=${encodeURIComponent("mosque")}`);
    if (f === "fuel") return maps(`geo:${near()}?q=${encodeURIComponent("petrol station")}`);
    const p = favs()[f];
    // Google Maps knows "Home" and "Work" as the places saved in your account.
    if (!p) return maps("google.navigation:q=" + (f === "home" ? "Home" : "Work"));
    maps("google.navigation:q=" + (p.addr ? encodeURIComponent(p.addr) : `${p.lat},${p.lon}`));
  }
  function favMenu(b) {
    const f = b.dataset.f;
    if (f !== "home" && f !== "work") return;
    const actions = [];
    actions.push([T("setHere"), ICON.pin, () => {
      closePop();
      if (C.location !== "gps" || !C.located) return toast(T("noFix"));
      setFav(f, { lat: +C.latitude.toFixed(6), lon: +C.longitude.toFixed(6) });
      toast(T("saved", T(f)));
    }]);
    actions.push([T("typeAddress"), ICON.keyboard, () => {
      closePop();
      zone = "prompt";
      window.onPrompt = (text) => {
        zone = "grid";
        if (text && text.trim()) { setFav(f, { addr: text.trim() }); toast(T("saved", T(f))); }
      };
      TV.promptText(T(f + "Address"), (favs()[f] || {}).addr || "");
    }]);
    if (favs()[f]) actions.push([T(f === "home" ? "mapsHome" : "mapsWork"), ICON.mapsPin, () => { setFav(f, null); closePop(); }]);
    showPop(actions, b);
  }
  // On the Drive screen's map: tap to go; hold Home or Work to use another place.
  let favHold = null, favHeld = false;
  const bar = document.querySelector(".dv-bar");
  bar.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".dv-fav");
    if (!b) return;
    favHeld = false;
    clearTimeout(favHold);
    favHold = setTimeout(() => { favHeld = true; favMenu(b); }, LONG_PRESS_MS);
  });
  for (const ev of ["pointerup", "pointercancel", "pointerleave"]) bar.addEventListener(ev, () => clearTimeout(favHold));
  bar.addEventListener("click", (e) => {
    const b = e.target.closest(".dv-fav");
    if (b && !favHeld) favTap(b);
  });
  $("qiblaBtn").addEventListener("click", (e) => { e.stopPropagation(); openQibla(); });

  /* ---------------- Qibla compass ---------------- */
  // The direction of the Kaaba from the car. The dial turns with the car: from the head unit's
  // compass when it has one, otherwise from the GPS direction of travel once the car is moving;
  // standing still without a compass, north is up.
  const KAABA = [21.4225, 39.8262], rad = Math.PI / 180;
  function qiblaBearing(lat, lon) {
    const f1 = lat * rad, f2 = KAABA[0] * rad, dl = (KAABA[1] - lon) * rad;
    const b = Math.atan2(Math.sin(dl), Math.cos(f1) * Math.tan(f2) - Math.sin(f1) * Math.cos(dl)) / rad;
    return (b + 360) % 360;
  }
  function makkahKm(lat, lon) {
    const f1 = lat * rad, f2 = KAABA[0] * rad, df = f2 - f1, dl = (KAABA[1] - lon) * rad;
    const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
  const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  let compass = null, compassAt = 0, qbTimer = null, roseAngle = 0;
  function onOrientation(e) {
    if (e.alpha == null || (e.type === "deviceorientation" && !e.absolute)) return;
    compass = (360 - e.alpha) % 360;
    compassAt = Date.now();
  }
  function heading() {
    if (Date.now() - compassAt < 2000) return compass;
    let m = null;
    try { m = JSON.parse(TV.carMotion()); } catch (e) {}
    if (m && m.bearing >= 0 && m.speed > 2 && Date.now() - m.at < 10000) return m.bearing; // moving > 7 km/h
    return null;
  }
  function updateQibla() {
    const q = qiblaBearing(C.latitude, C.longitude), h = heading();
    // Turn the dial the short way round, so it never spins a full circle at north.
    const target = h == null ? 0 : -h;
    roseAngle += ((target - roseAngle) % 360 + 540) % 360 - 180;
    $("qbRose").style.transform = `rotate(${roseAngle.toFixed(1)}deg)`;
    $("qbKaaba").setAttribute("transform", `rotate(${q.toFixed(1)} 100 100)`);
    const deg = Math.round(q);
    if (h == null) {
      $("qbMain").textContent = T("fromNorth", deg, COMPASS[Math.round(q / 45) % 8]);
      $("qbSub").textContent = T("driveHint");
    } else {
      const d = Math.round(((q - h) % 360 + 540) % 360 - 180);
      $("qbMain").textContent = Math.abs(d) <= 10 ? T("ahead") : Math.abs(d) >= 160 ? T("behind")
        : d > 0 ? T("turnRight", d) : T("turnLeft", -d);
      $("qbSub").textContent = T("makkah", makkahKm(C.latitude, C.longitude).toLocaleString("en"));
    }
  }
  function openQibla() {
    if (!$("qbTicks").childElementCount) {
      let ticks = "";
      for (let a = 0; a < 360; a += 10) ticks += `<line x1="100" y1="${a % 90 ? 12 : 10}" x2="100" y2="${a % 90 ? 18 : 22}" transform="rotate(${a} 100 100)"/>`;
      $("qbTicks").innerHTML = ticks;
    }
    addEventListener("deviceorientationabsolute", onOrientation);
    addEventListener("deviceorientation", onOrientation);
    document.body.classList.add("qibla-open");
    updateQibla();
    clearInterval(qbTimer);
    qbTimer = setInterval(updateQibla, 500);
  }
  function closeQibla() {
    document.body.classList.remove("qibla-open");
    clearInterval(qbTimer);
    removeEventListener("deviceorientationabsolute", onOrientation);
    removeEventListener("deviceorientation", onOrientation);
  }
  $("qbClose").addEventListener("click", closeQibla);
  $("qibla").addEventListener("pointerdown", (e) => { if (e.target === $("qibla")) closeQibla(); });

  /* ---------------- travel dua ---------------- */
  // When a trip starts (a navigation app opened from here), the azkar card shows the travel dua for
  // 15 minutes (tap it to go back to the azkar), and a silent banner shows it over the map. At most
  // once an hour, so short stops don't repeat it.
  const TRAVEL_DUA = "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، ﴿سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ ۝ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ﴾، " +
    "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ، " +
    "اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالْخَلِيفَةُ فِي الأَهْلِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ، وَكَآبَةِ الْمَنْظَرِ، وَسُوءِ الْمُنْقَلَبِ فِي الْمَالِ وَالأَهْلِ";
  const TRAVEL_MS = 15 * 60000;
  let travelUntil = 0;
  function startTrip() {
    if (Date.now() - store.get("car.duaAt", 0) < 60 * 60000) return;
    store.set("car.duaAt", Date.now());
    travelUntil = Date.now() + TRAVEL_MS;
    showDhikr(false);
    try { TV.notifyTravelDua("دعاء السفر", TRAVEL_DUA); } catch (e) {}
  }
  function renderTravel() {
    $("azkar").classList.add("travel");
    $("azTitle").textContent = "دعاء السفر";
    $("azSub").textContent = T("travel");
    $("azCount").textContent = "";
    $("azRepeat").textContent = "";
    $("azBody").textContent = TRAVEL_DUA;
    $("azBody").classList.remove("fade");
    fitAzkarText();
    azStart = travelUntil - TRAVEL_MS;
    azDwell = TRAVEL_MS;
    renderAzProgress();
    clearTimeout(azTimer);
    azTimer = setTimeout(() => { travelUntil = 0; azPeriod = null; checkAzkarPeriod(now()); }, Math.max(0, travelUntil - Date.now()));
  }

  /* ---------------- split screen: two apps side by side ---------------- */
  // The Split button in the sidebar lists your saved pairs (e.g. Google Maps + YouTube); "New Pair"
  // picks two apps. Android opens them side by side, the first on the left.
  const MAX_PAIRS = 6;
  const pairs = () => store.get("car.pairs", []);
  const appByPkg = (p) => installed.find((a) => a.pkg === p);
  const pairName = ([a, b]) => `${(appByPkg(a) || { label: a }).label} + ${(appByPkg(b) || { label: b }).label}`;
  function splitMenu() {
    const list = pairs().filter(([a, b]) => appByPkg(a) && appByPkg(b));
    const actions = list.map((p) => [pairName(p), ICON.split, () => { closePop(); openPair(p); }]);
    actions.push([T("newPair"), ICON.plus, () => { closePop(); openPicker(); }]);
    if (list.length) actions.push([T("removePair"), ICON.trash, () => showPop(list.map((p) => [pairName(p), ICON.trash, () => {
      store.set("car.pairs", pairs().filter((x) => x.join() !== p.join()));
      closePop();
    }, "danger"]), $("dkSplit")), "danger"]);
    let helper = true;
    try { helper = TV.splitHelperOn(); } catch (e) {}
    // The helper is a separate small app (some head units refuse apps with an accessibility service).
    if (!helper) actions.push([T("helperOn"), ICON.access, () => {
      closePop();
      let installed = false;
      try { installed = TV.splitHelperInstalled(); } catch (e) {}
      if (installed) TV.openAccessibilitySettings(); else toast(T("helperGet"));
    }]);
    showPop(actions, $("dkSplit"));
  }
  function openPair([a, b]) {
    let r = "missing";
    try { r = TV.launchSplit(a, b); } catch (e) {}
    if (r === "missing") return toast(T("appMissing"));
    if (r === "tried") setTimeout(() => toast(T("helperHint")), 2500);
    const nav = (p) => { const x = appByPkg(p); return x && (NAV_APPS.has(p) || x.category === 6); };
    if (nav(a) || nav(b)) startTrip();
  }

  // Picker: tap two apps (1 = left, 2 = right), then Open Side by Side; the pair is saved.
  let picked = [];
  function openPicker() {
    picked = [];
    const all = [];
    for (const it of items) (it.type === "app" ? [it.app] : it.apps).forEach((a) => all.push(a));
    $("pkGrid").innerHTML = all.map((a) => `<button class="pk-app" data-pkg="${escapeHtml(a.pkg)}">` +
      `${artHtml(a)}<div class="name">${escapeHtml(a.label)}</div><span class="pk-badge"></span></button>`).join("");
    const main = $("main"), pl = document.querySelector(".pk-panel");
    pl.style.left = main.offsetLeft + 20 + "px";
    pl.style.top = main.offsetTop + 10 + "px";
    pl.style.width = main.offsetWidth - 40 + "px";
    pl.style.height = main.offsetHeight - 20 + "px";
    renderPicked();
    document.body.classList.add("picker-open");
  }
  function closePicker() { document.body.classList.remove("picker-open"); }
  function renderPicked() {
    document.querySelectorAll(".pk-app").forEach((b) => {
      const i = picked.indexOf(b.dataset.pkg);
      b.classList.toggle("sel", i >= 0);
      b.querySelector(".pk-badge").textContent = i >= 0 ? i + 1 : "";
    });
    $("pkSub").textContent = T(picked.length ? "pickSecond" : "pickFirst");
    $("pkGo").disabled = picked.length < 2;
  }
  $("pkGrid").addEventListener("click", (e) => {
    const b = e.target.closest(".pk-app");
    if (!b) return;
    const p = b.dataset.pkg, i = picked.indexOf(p);
    if (i >= 0) picked.splice(i, 1);
    else if (picked.length < 2) picked.push(p);
    else picked[1] = p;
    renderPicked();
  });
  $("pkCancel").addEventListener("click", closePicker);
  $("picker").addEventListener("pointerdown", (e) => { if (e.target === $("picker")) closePicker(); });
  $("pkGo").addEventListener("click", () => {
    if (picked.length < 2) return;
    const p = picked.slice();
    store.set("car.pairs", [p].concat(pairs().filter((x) => x.join() !== p.join())).slice(0, MAX_PAIRS));
    closePicker();
    openPair(p);
  });
  $("dkSplit").addEventListener("click", () => { if (zone === "move") endMove(); splitMenu(); });

  /* ---------------- Drive screen: swipe left from Home, like CarPlay ---------------- */
  // A big Google map around the car (60%) with Google Maps shortcuts, and Now Playing for whatever
  // plays in any app. Swipe right (or tap the dots, or press Home) to go back.
  let screen = 0;
  function setScreen(n) {
    screen = n;
    document.body.classList.toggle("drive", n === 1);
    [...$("screenDots").children].forEach((b, i) => b.classList.toggle("on", i === n));
    $("home").style.transform = $("drive").style.transform = "";
    if (n === 1) { showMap(); renderMedia(); try { TV.mediaCommand("state", 0); } catch (e) {} }
  }
  $("screenDots").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setScreen(+b.dataset.s); });
  // Swipe with the finger: both screens follow it, then settle.
  let sw = null;
  for (const el of [$("home"), $("drive")]) {
    el.addEventListener("pointerdown", (e) => {
      if (has("drawer-open") || e.button > 0) return;
      sw = { x0: e.clientX, y0: e.clientY, id: e.pointerId, on: false, t0: performance.now() };
    });
  }
  addEventListener("pointermove", (e) => {
    if (!sw || e.pointerId !== sw.id) return;
    const dx = (e.clientX - sw.x0) / S, dy = (e.clientY - sw.y0) / S;
    if (!sw.on) {
      if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      sw.on = true;
      document.body.classList.add("swiping");
    }
    const w = $("main").offsetWidth + 28, base = screen === 1 ? -w : 0;
    let x = base + dx;
    if (x > 0) x /= 3; if (x < -w) x = -w + (x + w) / 3;
    $("home").style.transform = `translate3d(${x}px,0,0)`;
    $("drive").style.transform = `translate3d(${x + w}px,0,0)`;
  }, { passive: true });
  const swipeEnd = (e) => {
    if (!sw || e.pointerId !== sw.id) return;
    const s0 = sw;
    sw = null;
    if (!s0.on) return;
    document.body.classList.remove("swiping");
    const dx = (e.clientX - s0.x0) / S, fast = Math.abs(dx) / Math.max(1, performance.now() - s0.t0) > 0.5;
    const to = (dx < -140 || (fast && dx < 0)) ? 1 : (dx > 140 || (fast && dx > 0)) ? 0 : screen;
    setScreen(to);
    // The finger lifted on a button: that's not a tap.
    addEventListener("click", eatClick, true);
    setTimeout(() => removeEventListener("click", eatClick, true), 350);
  };
  const eatClick = (c) => { c.stopPropagation(); c.preventDefault(); };
  addEventListener("pointerup", swipeEnd);
  addEventListener("pointercancel", swipeEnd);

  // The map: Google's embedded map around the car, loaded when the Drive screen is first shown and
  // moved to the car again when it has gone a few hundred metres (or on the recenter button).
  let mapAt = null;
  // The WebView's own navigator.onLine is wrong on some head units: ask Android.
  const isOnline = () => { try { return TV.online(); } catch (e) { return navigator.onLine !== false; } };
  function showMap(force = false) {
    const wasOff = !$("dvOffline").hidden;
    $("dvOffline").hidden = isOnline();
    if (wasOff && $("dvOffline").hidden) force = true; // back online: load it again
    const here = [C.latitude, C.longitude];
    const moved = !mapAt || Math.hypot((here[0] - mapAt[0]) * 111, (here[1] - mapAt[1]) * 111 * Math.cos(here[0] * Math.PI / 180)) > 0.4;
    if (!force && !moved) return;
    mapAt = here;
    $("mapFrame").src = `https://maps.google.com/maps?q=${here[0].toFixed(5)},${here[1].toFixed(5)}&z=15&hl=${lang}&output=embed`;
  }
  $("mapFrame").addEventListener("load", () => { if ($("mapFrame").src && isOnline()) $("dvOffline").hidden = true; });
  addEventListener("online", () => { if (screen === 1) showMap(true); });
  $("dvCenter").addEventListener("click", () => showMap(true));
  $("dvMaps").addEventListener("click", () => { let ok = false; try { ok = TV.openMaps(`geo:${near()}`); } catch (e) {} if (!ok) toast(T("noMaps")); });
  function renderSpeed() {
    let m = null;
    try { m = JSON.parse(TV.carMotion()); } catch (e) {}
    const fresh = m && m.speed >= 0 && Date.now() - m.at < 8000;
    $("dvSpeed").hidden = !fresh;
    if (fresh) $("dvKmh").textContent = Math.round(m.speed * 3.6);
  }

  // Now Playing: what plays in any app, from the MK Car Helper (Notification access); the buttons
  // work even without it (media keys go to the app playing).
  const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
  const PAUSE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z"/></svg>';
  const NOTE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3v11.6A3.5 3.5 0 1 0 11 17.7V8h6V3z"/></svg>';
  const CAST_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/><path d="M3 12a8 8 0 0 1 8 8M3 16a4 4 0 0 1 4 4"/><circle cx="3.5" cy="19.5" r=".8" fill="currentColor"/></svg>';
  const MEDIA_APPS = ["com.google.android.youtube", "com.google.android.apps.youtube.music", "com.spotify.music", "com.anghami",
    "com.apple.android.music", "com.soundcloud.android", "deezer.android.app", "com.amazon.mp3", "net.mbc.shahid", "com.netflix.mediaclient",
    "com.google.android.apps.podcasts", "au.com.shiftyjelly.pocketcasts", "com.audible.application", "tunein.player", "com.android.fmradio"];
  let media = {}, playingGuess = null;
  const fmt = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  window.onMedia = () => {
    try { media = JSON.parse(TV.mediaState()) || {}; } catch (e) { media = {}; }
    playingGuess = null;
    if (screen === 1) renderMedia();
    if (has("cc-open")) renderCCMedia();
  };
  const isPlaying = () => (playingGuess != null ? playingGuess : media.state === 3 || media.state === 6);
  function renderMedia() {
    const a = media.pkg && appByPkg(media.pkg);
    $("mdApp").innerHTML = media.pkg ? `${a && a.icon ? `<img src="${a.icon}" alt="">` : ""}<span>${escapeHtml(a ? a.label : T("nowPlaying"))}</span>` : `<span>${escapeHtml(T("nowPlaying"))}</span>`;
    $("mdTitle").textContent = media.title || (media.pkg ? (a ? a.label : "") : T("nothing"));
    $("mdArtist").textContent = media.artist || media.album || "";
    const art = $("mdArt");
    if (media.art) { art.style.backgroundImage = `url("${media.art}")`; art.innerHTML = ""; }
    else { art.style.backgroundImage = ""; art.innerHTML = a && a.icon ? `<img src="${a.icon}" alt="" style="width:46%;height:46%;border-radius:22%">` : NOTE_ICON; }
    $("mdPlay").innerHTML = isPlaying() ? PAUSE_ICON : PLAY_ICON;
    renderProgress();
    // Without the helper, or without its access: say how to see what's playing.
    let acc = { helper: 0, access: false };
    try { acc = JSON.parse(TV.mediaAccess()); } catch (e) {}
    const hint = $("mdHint");
    if (acc.helper >= 2 && acc.access) hint.hidden = true;
    else {
      hint.hidden = false;
      hint.innerHTML = escapeHtml(T(acc.helper >= 2 ? "needAccess" : "needHelper")) + (acc.helper >= 2 ? `<br><button id="mdAllow">${escapeHtml(T("allow"))}</button>` : "");
      if ($("mdAllow")) $("mdAllow").addEventListener("click", () => { try { TV.openMediaAccess(); } catch (e) {} });
    }
    renderSources();
  }
  function renderProgress() {
    const dur = media.duration || 0;
    $("mdSeek").classList.toggle("none", !(dur > 0));
    if (!(dur > 0)) return;
    let pos = media.position || 0;
    if (isPlaying() && media.positionAt) pos += (Date.now() - media.positionAt) * (media.speed || 1);
    pos = Math.min(dur, Math.max(0, pos));
    $("mdBar").style.width = (pos / dur * 100).toFixed(2) + "%";
    $("mdPos").textContent = fmt(pos);
    $("mdDur").textContent = fmt(dur);
  }
  // Media apps to start something, the app playing first, and Cast at the end.
  function renderSources() {
    const list = [];
    if (media.pkg && appByPkg(media.pkg)) list.push(media.pkg);
    for (const p of MEDIA_APPS) if (list.length < 4 && appByPkg(p) && !list.includes(p)) list.push(p);
    $("mdSources").innerHTML = list.map((p) => { const a = appByPkg(p); return `<button class="md-src" data-p="${escapeHtml(p)}">${a.icon ? `<img src="${a.icon}" alt="">` : ""}</button>`; }).join("") +
      `<button class="md-src cast" id="mdCast" aria-label="Cast">${CAST_ICON}</button>`;
  }
  $("mdSources").addEventListener("click", (e) => {
    const b = e.target.closest(".md-src");
    if (!b) return;
    if (b.id === "mdCast") return cast();
    const a = appByPkg(b.dataset.p);
    if (a) launch(a);
  });
  const cmd = (c, v = 0) => { try { TV.mediaCommand(c, v); } catch (e) {} };
  $("mdPlay").addEventListener("click", () => { const was = isPlaying(); cmd("toggle"); playingGuess = !was; $("mdPlay").innerHTML = playingGuess ? PAUSE_ICON : PLAY_ICON; });
  $("mdPrev").addEventListener("click", () => cmd("previous"));
  $("mdNext").addEventListener("click", () => cmd("next"));
  $("mdSeek").addEventListener("click", (e) => {
    if (!(media.duration > 0)) return;
    const r = $("mdSeek").querySelector(".md-bar").getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    cmd("seek", f * media.duration);
    media.position = f * media.duration; media.positionAt = Date.now();
    renderProgress();
  });
  $("mdArt").addEventListener("click", () => cmd("open"));
  $("mdTitle").addEventListener("click", () => cmd("open"));
  let tickN = 0;
  setInterval(() => {
    if (paused || screen !== 1) return;
    renderProgress();
    renderSpeed();
    if (++tickN % 10 === 0) showMap(); // follows the car, and the connection coming back
  }, 1000);

  /* ---------------- Cast: AirPlay / Google Cast through a receiver app ---------------- */
  // Apps can't be AirPlay or Google Cast receivers on their own, so Cast opens the receiver app on
  // the head unit (AirScreen, ZLink, Autokit, EasyConnection...); without one it says what to get.
  const CAST_PKGS = ["com.ionitech.airscreen", "com.zjinnova.zlink", "net.easyconn", "com.carlinkit.autokit", "cn.manstep.phonemirrorBox"];
  const CAST_NAME = /air\s?play|air\s?screen|airreceiver|\bcast\b|mirror|zlink|carplay|car\s?link|easy\s?conn|autokit|phone\s?link|tlink|screen\s?share/i;
  const castApps = () => installed.filter((a) => CAST_PKGS.includes(a.package || a.pkg) || CAST_NAME.test(a.label));
  function cast(anchor) {
    const list = castApps();
    if (list.length === 1) return launch(list[0]);
    if (list.length > 1) return showPop(list.map((a) => [a.label, ICON.split, () => { closePop(); launch(a); }]), anchor || null);
    document.body.classList.add("cast-open");
  }
  $("dkCast").addEventListener("click", () => cast($("dkCast")));
  $("ciClose").addEventListener("click", () => document.body.classList.remove("cast-open"));
  $("castInfo").addEventListener("click", (e) => { if (e.target === $("castInfo")) document.body.classList.remove("cast-open"); });
  $("ciGet").addEventListener("click", () => {
    document.body.classList.remove("cast-open");
    try { TV.openUrl("market://details?id=com.ionitech.airscreen"); } catch (e) {}
  });

  /* ---------------- Control Center: swipe down from the top, like an iPhone ---------------- */
  // Your notifications (from the MK Car Helper: tap to open, ✕ to dismiss, Clear for all) and big
  // controls: Wi-Fi, Bluetooth, Cast, Split, Now Playing, brightness, volume, day/night, Settings.
  // Android's own pull-down shade is part of the system; it can't be restyled by a launcher.
  let cc = null;
  const ccOpen = () => has("cc-open");
  function openCC() {
    if (ccOpen()) return;
    closePop();
    document.body.classList.add("cc-open");
    document.body.classList.remove("cc-drag");
    $("ccSheet").style.transform = "";
    try { notes = JSON.parse(TV.notifications()) || []; } catch (e) {}
    try { TV.notifCommand("notifs", ""); } catch (e) {}
    renderNotifs();
    renderQuick();
    renderCCMedia();
  }
  function closeCC() {
    document.body.classList.remove("cc-open", "cc-drag");
    $("ccSheet").style.transform = "";
  }
  $("ccPull").addEventListener("click", openCC);
  $("dkCC").addEventListener("click", openCC);
  // The helper (1.3+) opens this instead of Android's shade pulled down over the home screen.
  window.openCC = () => { if (!has("xfer-open")) { closeDrawer(true); openCC(); } };
  $("ccSys").addEventListener("click", () => { closeCC(); try { TV.systemShade(); } catch (e) {} });
  $("ccUpd").addEventListener("click", () => { closeCC(); if (window.MKUpdate) window.MKUpdate.check(); });
  // Pulled from the top edge: the sheet follows the finger.
  addEventListener("pointerdown", (e) => {
    if (ccOpen() || has("drawer-open") || has("picker-open") || has("qibla-open") || e.clientY / S > 80) return;
    cc = { y0: e.clientY, id: e.pointerId, on: false };
  }, true);
  addEventListener("pointermove", (e) => {
    if (!cc || e.pointerId !== cc.id) return;
    const dy = (e.clientY - cc.y0) / S;
    if (!cc.on) { if (dy < 18) return; cc.on = true; sw = null; document.body.classList.add("cc-drag"); }
    const h = $("cc").offsetHeight;
    $("ccSheet").style.transform = `translate3d(0,${Math.min(0, dy - h)}px,0)`;
    $("cc").style.setProperty("--cc-o", Math.min(1, dy / h * 1.4).toFixed(3));
  }, { passive: true });
  const ccEnd = (e) => {
    if (!cc || e.pointerId !== cc.id) return;
    const c = cc; cc = null;
    if (!c.on) return;
    document.body.classList.remove("cc-drag");
    $("ccSheet").style.transform = "";
    if ((e.clientY - c.y0) / S > 130) openCC();
    addEventListener("click", eatClick, true);
    setTimeout(() => removeEventListener("click", eatClick, true), 350);
  };
  addEventListener("pointerup", ccEnd);
  addEventListener("pointercancel", ccEnd);
  // Pushed up (or a tap on the dark edge): closes.
  let ccUp = null;
  $("ccSheet").addEventListener("pointerdown", (e) => {
    // Not on a slider, nor on the notification list while it has more to scroll.
    if (e.target.closest(".cc-slider")) return;
    const l = e.target.closest(".cc-list");
    if (l && l.scrollHeight > l.clientHeight + 2) return;
    ccUp = { y0: e.clientY, id: e.pointerId };
  });
  addEventListener("pointermove", (e) => {
    if (!ccUp || e.pointerId !== ccUp.id) return;
    const dy = Math.min(0, (e.clientY - ccUp.y0) / S);
    if (dy < -12) { document.body.classList.add("cc-drag"); $("ccSheet").style.transform = `translate3d(0,${dy}px,0)`; }
  }, { passive: true });
  addEventListener("pointerup", (e) => {
    if (!ccUp || e.pointerId !== ccUp.id) return;
    const dy = (e.clientY - ccUp.y0) / S; ccUp = null;
    document.body.classList.remove("cc-drag");
    if (dy < -90) { closeCC(); addEventListener("click", eatClick, true); setTimeout(() => removeEventListener("click", eatClick, true), 350); }
    else $("ccSheet").style.transform = "";
  });
  $("cc").addEventListener("click", (e) => { if (e.target === $("cc") || e.target === $("ccSheet") || e.target.classList.contains("cc-grid")) closeCC(); });

  // Notifications
  let notes = [];
  window.onNotifs = () => {
    try { notes = JSON.parse(TV.notifications()) || []; } catch (e) { notes = []; }
    if (ccOpen()) renderNotifs();
  };
  const XICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function renderNotifs() {
    let acc = { helper: 0, access: false };
    try { acc = JSON.parse(TV.mediaAccess()); } catch (e) {}
    const list = $("ccList");
    $("ccClear").hidden = !(acc.helper >= 3 && acc.access && notes.some((n) => n.clear));
    $("ccSys").hidden = !(acc.helper >= 4);
    $("ccUpd").hidden = !window.MKUpdate;
    if (acc.helper < 3 || !acc.access) {
      list.innerHTML = `<div class="cc-empty">${escapeHtml(T(acc.helper < 3 ? "notifHelper" : "notifAccess"))}${acc.helper >= 3 ? `<br><button id="ccAllow">${escapeHtml(T("allow"))}</button>` : ""}</div>`;
      if ($("ccAllow")) $("ccAllow").addEventListener("click", () => { closeCC(); try { TV.openMediaAccess(); } catch (e) {} });
      return;
    }
    if (!notes.length) { list.innerHTML = `<div class="cc-empty">${escapeHtml(T("noNotifs"))}</div>`; return; }
    list.innerHTML = notes.map((n) => {
      const a = appByPkg(n.pkg), mins = Math.floor((Date.now() - n.time) / 60000);
      const when = mins < 1 ? T("now") : T("ago", mins);
      const icon = a && a.icon ? `<img src="${a.icon}" alt="">` : escapeHtml((n.app || "?").slice(0, 1));
      return `<div class="cc-n" data-k="${escapeHtml(n.key)}"><div class="ic">${icon}</div><div class="bd"><div class="top"><b>${escapeHtml(n.app)}</b><span>${when}</span></div>` +
        `<div class="tt">${escapeHtml(n.title)}</div><div class="tx">${escapeHtml(n.text)}</div></div>` +
        (n.clear ? `<button class="x" aria-label="Dismiss">${XICON}</button>` : "") + `</div>`;
    }).join("");
  }
  $("ccList").addEventListener("click", (e) => {
    const card = e.target.closest(".cc-n");
    if (!card) return;
    const key = card.dataset.k;
    if (e.target.closest(".x")) {
      card.classList.add("gone");
      setTimeout(() => { notes = notes.filter((n) => n.key !== key); renderNotifs(); }, 220);
      try { TV.notifCommand("ndismiss", key); } catch (er) {}
      return;
    }
    closeCC();
    try { TV.notifCommand("nopen", key); } catch (er) {}
  });
  $("ccClear").addEventListener("click", () => {
    notes = notes.filter((n) => !n.clear);
    renderNotifs();
    try { TV.notifCommand("nclear", ""); } catch (e) {}
  });

  // Quick controls
  let quick = {};
  function renderQuick() {
    try { quick = JSON.parse(TV.quickState()) || {}; } catch (e) { quick = {}; }
    $("ccWifi").classList.toggle("on", !!quick.wifi);
    $("ccBt").classList.toggle("on", quick.bt === 1);
    $("ccBt").hidden = quick.bt === -1;
    setSlider($("ccBright"), quick.brightness != null ? quick.brightness : 0.5);
    setSlider($("ccVol"), quick.maxVolume ? quick.volume / quick.maxVolume : 0.5);
    const names = ["day", "comfort", "night"];
    $("ccModeIcon").innerHTML = $("modeSeg").children[comfort].innerHTML;
    $("ccModeName").textContent = T(names[comfort]);
    $("ccMode").classList.toggle("on", comfort > 0);
    let xs = {};
    try { xs = JSON.parse(TV.transferState()); } catch (e) {}
    $("ccFiles").classList.toggle("on", !!xs.on);
  }
  const later = (f) => setTimeout(() => { if (ccOpen()) f(); }, 900);
  $("ccWifi").addEventListener("click", () => { try { if (!TV.setWifi(!quick.wifi)) closeCC(); } catch (e) {} quick.wifi = !quick.wifi; $("ccWifi").classList.toggle("on", !!quick.wifi); later(renderQuick); });
  $("ccBt").addEventListener("click", () => { try { if (!TV.setBluetooth(quick.bt !== 1)) closeCC(); } catch (e) {} quick.bt = quick.bt === 1 ? 0 : 1; $("ccBt").classList.toggle("on", quick.bt === 1); later(renderQuick); });
  $("ccCast").addEventListener("click", () => { closeCC(); cast(); });
  $("ccFiles").addEventListener("click", () => { closeCC(); openXfer(); });
  $("ccSettings").addEventListener("click", () => { closeCC(); try { TV.openSettings(); } catch (e) {} });
  $("ccMode").addEventListener("click", () => { setComfort((comfort + 1) % 3); renderQuick(); });
  function setSlider(el, f) {
    f = Math.max(0, Math.min(1, f));
    el.querySelector(".cc-fill").style.height = (f * 100).toFixed(1) + "%";
    el.classList.toggle("low", f < 0.16);
  }
  // Brightness and volume: drag up and down on the tall sliders.
  for (const el of [$("ccBright"), $("ccVol")]) {
    let drag = null, sentAt = 0;
    const apply = (e, final) => {
      const r = el.getBoundingClientRect(), f = Math.max(0, Math.min(1, (r.bottom - e.clientY) / r.height));
      setSlider(el, f);
      if (!final && performance.now() - sentAt < 70) return;
      sentAt = performance.now();
      try {
        if (el.dataset.k === "vol") TV.setVolume(Math.round(f * (quick.maxVolume || 15)));
        else if (!TV.setSystemBrightness(f)) {
          TV.setBrightness(Math.max(0.05, f)); // only the home screen, until allowed for all apps
          if (final && !quick.askedWrite) { quick.askedWrite = true; toast(T("allowAll")); TV.openWriteSettings(); }
        }
      } catch (er) {}
    };
    el.addEventListener("pointerdown", (e) => { drag = e.pointerId; el.setPointerCapture && el.setPointerCapture(e.pointerId); apply(e); });
    el.addEventListener("pointermove", (e) => { if (drag === e.pointerId) apply(e); });
    el.addEventListener("pointerup", (e) => { if (drag === e.pointerId) { apply(e, true); drag = null; } });
    el.addEventListener("pointercancel", () => { drag = null; });
  }
  // Now Playing, small
  function renderCCMedia() {
    $("ccMTitle").textContent = media.title || (media.pkg ? (appByPkg(media.pkg) || {}).label || "" : T("nothing"));
    $("ccMArtist").textContent = media.artist || "";
    $("ccMPlay").innerHTML = isPlaying() ? PAUSE_ICON : PLAY_ICON;
  }
  document.querySelector(".cc-mctrls").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.c === "toggle") { playingGuess = !isPlaying(); $("ccMPlay").innerHTML = playingGuess ? PAUSE_ICON : PLAY_ICON; }
    cmd(b.dataset.c);
  });

  /* ---------------- File Transfer: the car's files in your phone's browser ---------------- */
  // Starts a small web server on the head unit (only while on). The phone, on the same Wi-Fi (your
  // iPhone's hotspot, or the car's own Wi-Fi made here), scans the QR code and gets a file browser:
  // upload into any folder, download, new folder, rename, delete. A new key each time it starts.
  let xs = {}, xfLog = [];
  const qrImg = (text) => {
    try { const q = qrcode(0, "M"); q.addData(text); q.make(); return `<img src="${q.createDataURL(8, 0)}" alt="">`; } catch (e) { return ""; }
  };
  const fsize = (n) => (n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(1) + " MB");
  function openXfer() {
    document.body.classList.add("xfer-open");
    try { xs = JSON.parse(TV.transferStart()); } catch (e) { xs = {}; }
    renderXfer();
    // The address can take a moment (Wi-Fi, the car's hotspot): look again shortly.
    setTimeout(() => { if (has("xfer-open")) { try { xs = JSON.parse(TV.transferState()); } catch (e) {} renderXfer(); } }, 1500);
  }
  function closeXfer() { document.body.classList.remove("xfer-open"); }
  function renderXfer() {
    const ip = (xs.ips || [])[0], hot = xs.hotspot;
    const url = xs.on && ip ? `http://${ip}:${xs.port}/?k=${xs.key}` : "";
    $("xfSub").textContent = xs.on ? T("xfOn") : T("xfOff");
    const qrs = [];
    if (hot) {
      const esc2 = (v) => String(v || "").replace(/([\\;,:"])/g, "\\$1");
      qrs.push(`<div class="xf-qr"><div class="box">${qrImg(`WIFI:T:WPA;S:${esc2(hot.ssid)};P:${esc2(hot.pass)};;`)}</div><span>${escapeHtml(T("xfJoin"))}</span></div>`);
    }
    qrs.push(url ? `<div class="xf-qr"><div class="box">${qrImg(url)}</div><span>${escapeHtml(T("xfOpen"))}</span></div>` : `<div class="xf-off">${escapeHtml(xs.on ? T("xfNoWifi") : T("xfOff"))}</div>`);
    $("xfQrs").innerHTML = qrs.join("");
    $("xfQrs").classList.toggle("two", qrs.length > 1);
    const step1 = hot ? T("xfStep1Hot", escapeHtml(hot.ssid || ""), escapeHtml(hot.pass || "")) : T("xfStep1");
    $("xfSteps").innerHTML = `<li>${step1}</li><li>${T("xfStep2")}</li><li>${T("xfStep3")}</li>` + (xs.on && !xs.storage ? `<li>${T("xfStorage")}</li>` : "");
    $("xfUrl").innerHTML = url ? `<b>http://${escapeHtml(ip)}:${xs.port}</b>` + (hot ? "" : "") : hot ? "" : escapeHtml(T("xfHotNote"));
    $("xfLog").innerHTML = xfLog.slice(-4).reverse().map((l) => `<div>${escapeHtml(l)}</div>`).join("");
    $("xfToggle").textContent = T(xs.on ? "xfStop" : "xfStart");
    $("xfHotspot").textContent = T(hot ? "xfHotOff" : "xfHotOn");
  }
  window.onTransfer = (e) => {
    xfLog.push(e.what === "received" ? T("xfReceived", e.name, e.folder, fsize(e.size)) : T("xfDeleted", e.name));
    if (e.what === "received") toast(T("xfReceived", e.name, e.folder, fsize(e.size)));
    if (has("xfer-open")) renderXfer();
  };
  window.onHotspot = (err) => {
    if (err) toast(T("xfHotFail"));
    try { xs = JSON.parse(TV.transferState()); } catch (e) {}
    if (has("xfer-open")) renderXfer();
    setTimeout(() => { try { xs = JSON.parse(TV.transferState()); } catch (e) {} if (has("xfer-open")) renderXfer(); }, 2500);
  };
  $("xfToggle").addEventListener("click", () => {
    if (xs.on) { try { TV.transferStop(); } catch (e) {} try { xs = JSON.parse(TV.transferState()); } catch (e) { xs = {}; } renderXfer(); }
    else openXfer();
  });
  $("xfHotspot").addEventListener("click", () => { try { TV.hotspot(!xs.hotspot); } catch (e) {} });
  $("xfClose").addEventListener("click", closeXfer);
  $("xfer").addEventListener("click", (e) => { if (e.target === $("xfer")) closeXfer(); });

  /* ---------------- toast: a short note at the bottom ---------------- */
  let toastTimer = null;
  function toast(text) {
    const el = $("toast");
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  /* ---------------- language switch ---------------- */
  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.classList.toggle("rtl", lang === "ar");
    document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = T(el.dataset.t); });
    $("langBtn").textContent = T("lang");
    $("langBtn").classList.toggle("arabic", lang === "en"); // the button shows the other language
    ["day", "comfort", "night"].forEach((k, i) => $("modeSeg").children[i].setAttribute("aria-label", T(k)));
    dateFmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-GB", DATE_OPTS);
    lastDay = -1; // re-render the dates, prayer list and banner texts
    alertKey = "";
    if (azPeriod && travelUntil <= Date.now()) restoreAzkarTitle();
    fit();
  }
  $("langBtn").addEventListener("click", () => {
    lang = lang === "ar" ? "en" : "ar";
    store.set("car.lang", lang);
    applyLang();
    tick();
  });

  // Called from MainActivity.
  let paused = false;
  window.onTvPause = () => {
    paused = true;
    clearTimeout(azTimer); // nothing changes on screen while another app is in front
  };
  window.onTvBack = () => {
    if (has("xfer-open")) return closeXfer();
    if (has("cc-open")) return closeCC();
    if (has("picker-open")) return closePicker();
    if (has("qibla-open")) return closeQibla();
    if (zone === "prompt" || (!has("drawer-open") && zone !== "pop")) return; // Back on the home page does nothing
    handle("back");
  };
  window.onTvHome = () => {
    if (zone === "prompt") return;
    closeDrawer(true);
    closeCC();
    setScreen(0);
    document.body.classList.remove("cast-open");
    zone = "grid";
    view.main.idx = 0;
    goPage(0, false);
    renderFocus();
  };
  window.onTvResume = () => {
    if (!paused) return;
    paused = false;
    if (zone === "prompt") return;
    // Read the apps again only if one was installed, removed or updated meanwhile.
    let stamp = appsStamp;
    try { stamp = TV.appsStamp(); } catch (e) {}
    if (stamp !== appsStamp) commit(true);
    lastMinute = -1;
    checkCarLocation();
    tick();
    showDhikr(false);
    if (screen === 1) { showMap(); try { TV.mediaCommand("state", 0); } catch (e) {} }
  };

  /* ---------------- start ---------------- */
  const logo = (C.logoText || "").trim();
  $("logo").hidden = !logo;
  $("logo").innerHTML = D.logoHtml(logo);
  renderPlace();
  setInterval(() => { if (!paused) checkCarLocation(); }, 60000);
  $("dkDrawer").innerHTML = ICON.apps;
  setComfort(store.get("car.comfort", 0), false);
  renderFavs();
  loadApps();
  applyLang();
  renderDock();
  setScreen(0);
  window.onMedia();
  tick();
  setInterval(() => { if (!paused) tick(); }, 1000);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); renderGrid(); fitAzkarText(); placeAlert(); });
})();
