// Phone home screen (phone/AndroidManifest.xml), in English or Arabic. Like an iPhone home screen:
// pages of apps, folders and widgets with a dock, then the App Library. Hold an app for its menu, or
// hold and drag to arrange: the others slide out of the way, edges change page, dropping on an app
// makes a folder. Widgets: the M&D logo, clock and Hijri date, prayer times, next-prayer ring, Hijri calendar,
// tasbih, verse, dua and hadith of the day, Names of Allah, Sunnah reminders, prayer tracker, khatma, iftar &
// suhoor, moon phase, azkar, Qibla, places, weather, and other apps' widgets (AppWidgets.java), all resizable and
// placed anywhere (empty cells are kept). Until it is the
// Home app it asks to be (Android's own dialog).
// Made for foldables: the grid follows the screen (4 columns folded, 6-8 unfolded) without reloading.
// Smoothness: nothing is blurred live (the wallpaper is pre-blurred), tiles move with transform only,
// finger movement is applied once per frame, and the app list is re-read only when apps change.
(function () {
  const C = window.CONFIG;
  const D = window.DASH;
  const TV = window.TV || window.MOCK_TV;
  const $ = (id) => document.getElementById(id);
  const LONG_PRESS_MS = 450;
  const store = {
    get(k, d) { try { const v = JSON.parse(TV.getPref(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { TV.setPref(k, JSON.stringify(v)); } catch (e) {} },
  };
  const local = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const has = (cls) => document.body.classList.contains(cls);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- language ---------------- */
  const STR = {
    en: {
      done: "Done", widgets: "Widgets", settings: "Settings", search: "App Library", add: "Add",
      editHome: "Edit Home Screen", removeHome: "Remove from Home Screen", deleteApp: "Delete App", addHome: "Add to Home Screen",
      removeWidget: "Remove Widget", rename: "Rename", removeFolder: "Remove Folder", folderName: "Folder name",
      language: "Language", alerts: "Prayer banners", alertsSub: "A silent banner before and at each prayer",
      on: "On", off: "Off", qiblaTitle: "Qibla Direction", ahead: "Qibla is straight ahead", behind: "Qibla is behind you",
      turnRight: (d) => `Turn ${d}° right`, turnLeft: (d) => `Turn ${d}° left`, fromNorth: (d, c) => `Qibla ${d}° from North (${c})`,
      holdFlat: "Hold the phone flat; the compass turns with it", makkah: (km) => `Makkah · ${km} km`,
      next: (n, m) => `${n} in ${D.inMinutes(m)}`, prayerTimes: (c) => (c ? `${c} Prayer Times` : "Prayer Times"),
      home: "Home", work: "Work", mosque: "Mosque", fuel: "Petrol", noMaps: "Google Maps isn't installed",
      wClock: "Clock & Date", wClockD: "Time with the Gregorian and Hijri dates", wPrayer: "Prayer Times", wPrayerD: "The next prayer and today's times, for where you are",
      wAzkar: "Azkar", wAzkarD: "Morning, general and evening azkar; tap for the next", wQibla: "Qibla", wQiblaD: "Which way to Makkah; tap for the compass",
      wPlaces: "Places", wPlacesD: "Home, Work, nearest mosque and petrol in Google Maps", wWeather: "Weather", wWeatherD: "Now and the next days",
      small: "Small", medium: "Medium", large: "Large", wide: "Wide", newFolder: "Folder",
      edit: "Edit", addWidget: "Add Widget", customize: "Customize", cancel: "Cancel", searchShort: "Search",
      suggestions: "Suggestions", recent: "Recently Added", searchWeb: (q) => `Search the web for “${q}”`, apps: "Apps", noResults: "No results",
      wLogo: "M&D", wLogoD: "The M&D logo with the Hijri date", wHijri: "Hijri Calendar", wHijriD: "Today's Hijri date and the days to Ramadan, Eid and more",
      wCount: "Next Prayer", wCountD: "A ring counting down to the next prayer", wTasbih: "Tasbih", wTasbihD: "Tap to count: SubhanAllah, Alhamdulillah, Allahu Akbar",
      wAyah: "Verse of the Day", wAyahD: "A verse from the Quran each day; tap for another", wNames: "Names of Allah", wNamesD: "One of the 99 Names each day, with its meaning; tap for the next",
      wSunnah: "Sunnah Reminders", wSunnahD: "Fasting days, Friday, Duha, the last third of the night",
      wDua: "Dua of the Day", wDuaD: "A dua from the Quran and Sunnah each day; tap for another", wHadith: "Hadith of the Day", wHadithD: "A short hadith with its source; tap for another",
      wTracker: "Prayer Tracker", wTrackerD: "Tick off each prayer today and keep your streak", wKhatma: "Quran Khatma", wKhatmaD: "Track your reading to a full khatma: tap to add a page",
      wFast: "Iftar & Suhoor", wFastD: "Countdown to Iftar (Maghrib) or the end of Suhoor (Fajr)", wMoon: "Moon Phase", wMoonD: "Tonight's moon with the Hijri day",
      resetKhatma: "Restart Khatma", addAppWidget: "Add App Widget", appWidgets: "App Widgets", noAppWidgets: "No app widgets found on this phone",
      iftar: "Iftar", suhoor: "Suhoor ends", streak: (n) => `${n} day${n === 1 ? "" : "s"} in a row`, pageOf: (n) => `Page ${n} of 604`, juzN: (n) => `Juz ${n}`,
      todayPages: (n) => `${n} page${n === 1 ? "" : "s"} today`, plusPage: "+1 page", plusJuz: "+1 juz",
      islamic: "Islamic", general: "General", resetCount: "Reset Counter", today: "Today", inDays: (n) => (n === 1 ? "Tomorrow" : `in ${n} days`),
      setHome: "Make MK Launcher your Home app", setHomeSub: "So the Home button and swiping up always bring you here, with your pages, widgets and prayer times.",
      setHomeBtn: "Set as Home app", notNow: "Not now", homeApp: "Home app", homeAppOn: "MK Launcher is your Home app", homeAppOff: "Not your Home app yet", setBtn: "Set",
      arrange: "Arrange apps", arrangeSub: "Sorts the apps and folders on your pages (widgets stay)", byName: "A–Z", byUse: "Most used", byNew: "Newest",
      undo: "Undo", arranged: "Apps arranged", undone: "Arrangement undone",
      newApps: "New apps", newAppsSub: "Where a newly installed app goes", inOrder: "In A–Z order", atEnd: "Last page",
      backup: "Layout backup", backupSub: "Your pages, folders and dock are also saved automatically to Downloads › MK Launcher",
      backupNow: "Back up", restore: "Restore", backedUp: "Saved to Downloads › MK Launcher", backupFail: "Couldn't save the backup",
      restored: "Layout restored", badBackup: "That file isn't an MK Launcher backup",
      updates: "Updates", updatesSub: (v) => `MK Launcher ${v}`, checkNow: "Check",
      restoreTitle: "Restore your layout?", restoreSub: "If you used MK Launcher before, pick “MK Launcher layout.json” in Downloads › MK Launcher to get your pages, folders and dock back.",
      groups: ["Social", "Entertainment", "Photo & Video", "Productivity & Finance", "Travel", "News & Reading", "Games", "Utilities"],
    },
    ar: {
      done: "تم", widgets: "الأدوات", settings: "الإعدادات", search: "مكتبة التطبيقات", add: "إضافة",
      editHome: "تعديل الشاشة الرئيسية", removeHome: "إزالة من الشاشة الرئيسية", deleteApp: "حذف التطبيق", addHome: "إضافة إلى الشاشة الرئيسية",
      removeWidget: "إزالة الأداة", rename: "إعادة تسمية", removeFolder: "إلغاء المجلد", folderName: "اسم المجلد",
      language: "اللغة", alerts: "تنبيهات الصلاة", alertsSub: "تنبيه صامت قبل كل صلاة وعند دخول وقتها",
      on: "تشغيل", off: "إيقاف", qiblaTitle: "اتجاه القبلة", ahead: "القبلة أمامك", behind: "القبلة خلفك",
      turnRight: (d) => `${d}° إلى اليمين`, turnLeft: (d) => `${d}° إلى اليسار`, fromNorth: (d) => `القبلة ${d}° من الشمال`,
      holdFlat: "أمسك الهاتف أفقياً لتدور البوصلة معه", makkah: (km) => `مكة المكرمة · ${km} كم`,
      next: (n, m) => { const h = Math.floor(m / 60), mm = m % 60; return `${n} بعد ${h ? h + " س " : ""}${mm} د`; },
      prayerTimes: (c) => (c ? `مواقيت الصلاة · ${c}` : "مواقيت الصلاة"),
      home: "المنزل", work: "العمل", mosque: "مسجد", fuel: "وقود", noMaps: "خرائط Google غير مثبتة",
      wClock: "الساعة والتاريخ", wClockD: "الوقت مع التاريخ الميلادي والهجري", wPrayer: "مواقيت الصلاة", wPrayerD: "الصلاة القادمة ومواقيت اليوم حسب موقعك",
      wAzkar: "الأذكار", wAzkarD: "أذكار الصباح والمساء والأذكار العامة؛ اضغط للتالي", wQibla: "القبلة", wQiblaD: "اتجاه مكة المكرمة؛ اضغط للبوصلة",
      wPlaces: "الأماكن", wPlacesD: "المنزل والعمل وأقرب مسجد ومحطة وقود في خرائط Google", wWeather: "الطقس", wWeatherD: "الآن والأيام القادمة",
      small: "صغير", medium: "متوسط", large: "كبير", wide: "عريض", newFolder: "مجلد",
      edit: "تعديل", addWidget: "إضافة أداة", customize: "تخصيص", cancel: "إلغاء", searchShort: "بحث",
      suggestions: "اقتراحات", recent: "أضيفت مؤخراً", searchWeb: (q) => `ابحث في الويب عن «${q}»`, apps: "التطبيقات", noResults: "لا توجد نتائج",
      wLogo: "M&D", wLogoD: "شعار M&D مع التاريخ الهجري", wHijri: "التقويم الهجري", wHijriD: "التاريخ الهجري والأيام المتبقية لرمضان والعيد وغيرها",
      wCount: "الصلاة القادمة", wCountD: "حلقة تعدّ الوقت حتى الصلاة القادمة", wTasbih: "المسبحة", wTasbihD: "اضغط للتسبيح: سبحان الله، الحمد لله، الله أكبر",
      wAyah: "آية اليوم", wAyahD: "آية من القرآن الكريم كل يوم؛ اضغط لآية أخرى", wNames: "أسماء الله الحسنى", wNamesD: "اسم من الأسماء الحسنى كل يوم مع معناه؛ اضغط للتالي",
      wSunnah: "تذكير بالسنن", wSunnahD: "أيام الصيام والجمعة والضحى والثلث الأخير من الليل",
      wDua: "دعاء اليوم", wDuaD: "دعاء من القرآن والسنة كل يوم؛ اضغط لدعاء آخر", wHadith: "حديث اليوم", wHadithD: "حديث قصير مع مصدره؛ اضغط لحديث آخر",
      wTracker: "متابعة الصلوات", wTrackerD: "سجّل كل صلاة اليوم وحافظ على استمرارك", wKhatma: "ختمة القرآن", wKhatmaD: "تابع قراءتك حتى الختمة: اضغط لإضافة صفحة",
      wFast: "الإفطار والسحور", wFastD: "العد التنازلي للإفطار (المغرب) أو نهاية السحور (الفجر)", wMoon: "طور القمر", wMoonD: "قمر الليلة مع اليوم الهجري",
      resetKhatma: "بدء ختمة جديدة", addAppWidget: "إضافة أداة تطبيق", appWidgets: "أدوات التطبيقات", noAppWidgets: "لا توجد أدوات تطبيقات على هذا الهاتف",
      iftar: "الإفطار", suhoor: "نهاية السحور", streak: (n) => `${n} يوماً متتالية`, pageOf: (n) => `الصفحة ${n} من ٦٠٤`, juzN: (n) => `الجزء ${n}`,
      todayPages: (n) => `${n} صفحة اليوم`, plusPage: "+ صفحة", plusJuz: "+ جزء",
      islamic: "إسلامية", general: "عامة", resetCount: "تصفير العداد", today: "اليوم", inDays: (n) => (n === 1 ? "غداً" : n === 2 ? "بعد يومين" : `بعد ${n} ${n <= 10 ? "أيام" : "يوماً"}`),
      setHome: "اجعل MK Launcher التطبيق الرئيسي", setHomeSub: "ليعيدك زر الرئيسية دائماً إلى صفحاتك وأدواتك ومواقيت الصلاة.",
      setHomeBtn: "تعيين كتطبيق رئيسي", notNow: "ليس الآن", homeApp: "التطبيق الرئيسي", homeAppOn: "MK Launcher هو التطبيق الرئيسي", homeAppOff: "ليس التطبيق الرئيسي بعد", setBtn: "تعيين",
      arrange: "ترتيب التطبيقات", arrangeSub: "يرتّب التطبيقات والمجلدات في صفحاتك (تبقى الأدوات مكانها)", byName: "أ–ي", byUse: "الأكثر استخداماً", byNew: "الأحدث",
      undo: "تراجع", arranged: "تم ترتيب التطبيقات", undone: "تم التراجع عن الترتيب",
      newApps: "التطبيقات الجديدة", newAppsSub: "أين يوضع التطبيق المثبت حديثاً", inOrder: "حسب الترتيب الأبجدي", atEnd: "الصفحة الأخيرة",
      backup: "نسخة احتياطية للتخطيط", backupSub: "تُحفظ صفحاتك ومجلداتك والشريط السفلي تلقائياً أيضاً في التنزيلات › MK Launcher",
      backupNow: "نسخ احتياطي", restore: "استعادة", backedUp: "تم الحفظ في التنزيلات › MK Launcher", backupFail: "تعذّر حفظ النسخة الاحتياطية",
      restored: "تمت استعادة التخطيط", badBackup: "هذا الملف ليس نسخة احتياطية من MK Launcher",
      updates: "التحديثات", updatesSub: (v) => `MK Launcher ${v}`, checkNow: "تحقق",
      restoreTitle: "استعادة تخطيطك؟", restoreSub: "إذا استخدمت MK Launcher من قبل، اختر «MK Launcher layout.json» من التنزيلات › MK Launcher لاستعادة صفحاتك ومجلداتك.",
      groups: ["تواصل اجتماعي", "ترفيه", "صور وفيديو", "إنتاجية ومال", "سفر", "أخبار وقراءة", "ألعاب", "أدوات"],
    },
  };
  let lang = store.get("phone.lang", /^ar/.test(navigator.language || "") ? "ar" : "en");
  const T = (k, ...a) => { const v = STR[lang][k]; return typeof v === "function" ? v(...a) : v; };
  const ampm = (d) => (lang === "ar" ? (d.getHours() < 12 ? "ص" : "م") : D.ampm(d));

  /* ---------------- screen metrics (follow folding, unfolding and turning) ---------------- */
  const M = { W: 0, H: 0, top: 24, bottom: 0, left: 0, right: 0, cols: 4, rows: 6, cellW: 90, cellH: 100, icon: 60, gridLeft: 0, gridTop: 0, dockH: 96, dockMax: 4 };
  function readInsets() {
    try { const i = JSON.parse(TV.insets()); M.top = i.top; M.bottom = i.bottom; M.left = i.left; M.right = i.right; } catch (e) {}
  }
  function measure() {
    M.W = document.documentElement.clientWidth || innerWidth;
    M.H = document.documentElement.clientHeight || innerHeight;
    const w = M.W - M.left - M.right;
    // Folded phone: 4 columns; unfolded / tablet: 6; very wide: 8.
    M.cols = w < 520 ? 4 : w < 900 ? 6 : 8;
    M.cellW = Math.min(w / M.cols, M.cols === 4 ? 110 : 130);
    M.icon = Math.round(clamp(M.cellW * 0.66, 48, 72));
    M.dockH = M.icon + 30;
    M.dockMax = M.cols === 4 ? 4 : M.cols === 6 ? 6 : 7;
    M.gridTop = M.top + 44; // room for the edit bar
    const gridH = M.H - M.gridTop - (M.bottom + 10 + M.dockH + 46);
    M.rows = Math.max(3, Math.floor(gridH / (M.icon + 40)));
    M.cellH = Math.min(gridH / M.rows, M.cellW * 1.35);
    M.gridLeft = M.left + (w - M.cols * M.cellW) / 2;
    const st = document.documentElement.style;
    st.setProperty("--top", M.top + "px"); st.setProperty("--bottom", M.bottom + "px");
    st.setProperty("--left", M.left + "px"); st.setProperty("--right", M.right + "px");
    st.setProperty("--icon", M.icon + "px"); st.setProperty("--cell-w", M.cellW + "px"); st.setProperty("--cell-h", M.cellH + "px");
    st.setProperty("--dock-h", M.dockH + "px");
    st.setProperty("--lib-cols", String(M.cols));
    st.setProperty("--box-cols", String(M.cols === 4 ? 2 : M.cols === 6 ? 3 : 4));
  }

  /* ---------------- apps ---------------- */
  let installed = [], byPkg = {}, appsStamp = -1;
  function loadApps() {
    try { appsStamp = TV.appsStamp(); } catch (e) {}
    try { installed = JSON.parse(TV.apps()) || []; } catch (e) { installed = []; }
    const exclude = new Set(C.homeExclude);
    installed = installed.filter((a) => !exclude.has(a.package || a.pkg)).sort((a, b) => a.label.localeCompare(b.label));
    byPkg = Object.fromEntries(installed.map((a) => [a.pkg, a]));
  }
  // Recently opened apps feed Search and the App Library's Suggestions.
  const uses = store.get("phone.uses", {});
  function launch(pkg) {
    TV.launch(pkg);
    uses[pkg] = (uses[pkg] || 0) + 1;
    store.set("phone.uses", uses);
    store.set("phone.recent", [pkg].concat(store.get("phone.recent", []).filter((p) => p !== pkg)).slice(0, 12));
    setTimeout(() => { if (isLibrary()) renderLibrary(); }, 500);
  }

  /* ---------------- layout model ---------------- */
  // Saved as {pages: [[item]], dock: [pkg]}. Items: {t:"a", id, p} app, {t:"f", id, name, apps:[pkg]}
  // folder, {t:"w", id, k: kind, s: size} widget ({k:"app", wid, pkg, label} for another app's widget),
  // {t:"g", id} an empty cell, so things can sit anywhere on a page. Every app sits somewhere on the pages (like an
  // iPhone) unless you removed it from the Home Screen; the App Library always has all of them.
  const SIZES = { s: [2, 2], m: [4, 2], l: [4, 4], w: [4, 1] };
  let L = null, removed = new Set();
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const appItem = (p) => ({ t: "a", id: "a:" + p, p });
  function defaultLayout() {
    const dial = installed.find((a) => a.dialer);
    const dock = [...new Set([dial && dial.pkg].concat(C.dockApps).filter((p) => p && byPkg[p]))].slice(0, 4);
    const rest = installed.map((a) => a.pkg).filter((p) => !dock.includes(p));
    return {
      pages: [[{ t: "w", id: uid("w"), k: "logo", s: "w" }, { t: "w", id: uid("w"), k: "clock", s: "m" }, { t: "w", id: uid("w"), k: "prayer", s: "m" }, ...rest.map(appItem)]],
      dock,
    };
  }
  // Drop uninstalled apps, add new ones to the last page.
  function reconcile() {
    const seen = new Set();
    for (const page of L.pages) {
      for (let i = page.length - 1; i >= 0; i--) {
        const it = page[i];
        if (it.t === "a") { if (!byPkg[it.p] || seen.has(it.p)) page.splice(i, 1); else seen.add(it.p); }
        else if (it.t === "f") {
          it.apps = it.apps.filter((p) => byPkg[p] && !seen.has(p));
          it.apps.forEach((p) => seen.add(p));
          if (!it.apps.length) page.splice(i, 1);
        }
      }
    }
    L.dock = L.dock.filter((p) => byPkg[p] && !seen.has(p));
    L.dock.forEach((p) => seen.add(p));
    if (!L.pages.length) L.pages.push([]);
    const fresh = installed.filter((a) => !seen.has(a.pkg) && !removed.has(a.pkg)).map((a) => appItem(a.pkg));
    for (const it of fresh) {
      // A new app goes into its A–Z place among the apps on your pages (or at the end, if you chose that).
      let at = null;
      if (store.get("phone.newApps", "abc") === "abc") {
        const name = byPkg[it.p].label;
        for (let p = 0; p < L.pages.length && !at; p++) {
          const i = L.pages[p].findIndex((x) => x.t === "a" && byPkg[x.p] && byPkg[x.p].label.localeCompare(name, undefined, { sensitivity: "base" }) > 0);
          if (i >= 0) at = [p, i];
        }
      }
      if (at) L.pages[at[0]].splice(at[1], 0, it);
      else L.pages[L.pages.length - 1].push(it);
    }
  }
  function save() {
    store.set("phone.layout", L);
    store.set("phone.removed", [...removed]);
    clearTimeout(backupT);
    backupT = setTimeout(() => writeBackup(false), 8000);
  }
  // A copy in Downloads/MK Launcher survives even uninstalling the launcher (restore it in Customize).
  let backupT = null;
  function writeBackup(say) {
    let ok = false;
    try { ok = TV.backupLayout(JSON.stringify({ app: "MK Launcher", v: 1, at: Date.now(), layout: L, removed: [...removed], lang })); } catch (e) {}
    if (say) toast(T(ok ? "backedUp" : "backupFail"));
  }
  window.onLayoutPicked = (text) => {
    let d = null;
    try { d = JSON.parse(text); } catch (e) {}
    if (!d || d.app !== "MK Launcher" || !d.layout || !Array.isArray(d.layout.pages)) return toast(T("badBackup"));
    L = { pages: d.layout.pages, dock: d.layout.dock || [] };
    removed = new Set(d.removed || []);
    reconcile();
    save();
    closeSheets();
    render();
    goPage(0, false);
    toast(T("restored"));
  };
  // Sort the apps and folders on your pages: by name, by how often you open them, or newest first.
  let undoL = null;
  function arrange(mode) {
    undoL = JSON.parse(JSON.stringify({ L, page }));
    const items = [], pages = L.pages.map((pg) => pg.filter((it) => it.t === "w"));
    for (const pg of L.pages) for (const it of pg) if (it.t === "a" || it.t === "f") { delete it.ov; items.push(it); }
    const name = (it) => (it.t === "f" ? it.name : (byPkg[it.p] || { label: it.p }).label);
    const used = (it) => (it.t === "f" ? it.apps.reduce((n, p) => n + (uses[p] || 0), 0) : uses[it.p] || 0);
    const when = (it) => (it.t === "f" ? Math.max(0, ...it.apps.map((p) => (byPkg[p] && byPkg[p].installed) || 0)) : (byPkg[it.p] && byPkg[it.p].installed) || 0);
    const abc = (a, b) => name(a).localeCompare(name(b), undefined, { sensitivity: "base" });
    items.sort(mode === "use" ? (a, b) => used(b) - used(a) || abc(a, b) : mode === "new" ? (a, b) => when(b) - when(a) || abc(a, b) : abc);
    let p = 0;
    for (const it of items) {
      for (;;) {
        if (!pages[p]) pages[p] = [];
        pages[p].push(it);
        if (!flow(pages[p]).over.length) break;
        pages[p].pop();
        p++;
      }
    }
    L.pages = pages.filter((pg, i) => i === 0 || pg.length);
    save();
    render();
    goPage(0, false);
  }

  /* ---------------- grid flow ---------------- */
  // Items fill each page in order, row by row, widgets taking their size; an item that doesn't fit
  // moves to the start of the next page while smaller ones after it still fill the gaps (so folding
  // the phone just pushes things along, nothing is lost and no page is left half empty).
  // Unfolded (6 columns) a 4-wide widget spans the whole width instead of leaving a strip beside it.
  const span = (it) => {
    if (it.t !== "w") return [1, 1];
    const w = SIZES[it.s][0];
    return [w === 4 && M.cols === 6 ? 6 : Math.min(w, M.cols), Math.min(SIZES[it.s][1], M.rows)];
  };
  // Empty cells belong to the grid they were made on (4 columns folded, 6-8 unfolded): on the other
  // one they're left out, so unfolding never scatters holes around the page.
  const gap = () => ({ t: "g", id: uid("g"), c: M.cols });
  const offGrid = (it) => it.t === "g" && (it.c || 4) !== M.cols;
  function flow(items) {
    const occ = Array.from({ length: M.rows }, () => new Array(M.cols).fill(false));
    const placed = [], over = [];
    for (const it of items) {
      if (offGrid(it)) continue;
      const [w, h] = span(it);
      let spot = null;
      for (let r = 0; r + h <= M.rows && !spot; r++) {
        for (let c = 0; c + w <= M.cols && !spot; c++) {
          let free = true;
          for (let y = r; y < r + h && free; y++) for (let x = c; x < c + w && free; x++) if (occ[y][x]) free = false;
          if (free) spot = [r, c];
        }
      }
      if (!spot) { over.push(it); continue; }
      for (let y = spot[0]; y < spot[0] + h; y++) for (let x = spot[1]; x < spot[1] + w; x++) occ[y][x] = true;
      placed.push({ it, r: spot[0], c: spot[1], w, h });
    }
    return { placed, over };
  }
  let flows = [];
  function normalize() {
    flows = [];
    for (let p = 0; p < L.pages.length; p++) {
      // Things pushed onto the next page only because this one was full (folded) come back when
      // there's room again (unfolded), so folding and unfolding gives back the same pages.
      const next = L.pages[p + 1];
      while (!drag && next && next.length) {
        const i = next.findIndex((it) => !offGrid(it)), it = next[i];
        if (!it || !it.ov || flow(L.pages[p].concat(it)).over.length) break;
        next.splice(i, 1);
        L.pages[p].push(it);
      }
      const f = flow(L.pages[p]);
      // Empty cells that don't fit, or come after everything, mean nothing.
      const over = f.over.filter((it) => it.t !== "g");
      over.forEach((it) => { it.ov = 1; });
      if (f.over.length) { const keep = new Set(f.over); L.pages[p] = L.pages[p].filter((it) => !keep.has(it)); }
      if (over.length) {
        if (!L.pages[p + 1]) L.pages[p + 1] = [];
        L.pages[p + 1].unshift(...over);
      }
      const pg = L.pages[p];
      while (pg.length && pg[pg.length - 1].t === "g") pg.pop();
      flows.push(f.placed.filter((x) => x.it.t !== "g" && pg.includes(x.it)));
    }
    // A page emptied that way goes away (outside edit mode, where you may be making one).
    if (!drag && !has("editing")) {
      for (let p = L.pages.length - 1; p > 0; p--) {
        if (!L.pages[p].some((it) => it.t !== "g")) { L.pages.splice(p, 1); flows.splice(p, 1); }
      }
    }
  }
  const pos = (x) => [M.gridLeft + x.c * M.cellW, M.gridTop + x.r * M.cellH];

  // Free placement: a page written back from where things are, row by row, with an empty cell (gap)
  // wherever nothing sits. Laid out again it gives exactly the same places.
  function serialize(placed) {
    const at = new Map(), cover = Array.from({ length: M.rows }, () => new Array(M.cols).fill(false));
    for (const x of placed) {
      at.set(x.r * M.cols + x.c, x.it);
      for (let y = x.r; y < x.r + x.h; y++) for (let c = x.c; c < x.c + x.w; c++) if (cover[y]) cover[y][c] = true;
    }
    const out = [];
    for (let r = 0; r < M.rows; r++) for (let c = 0; c < M.cols; c++) {
      const it = at.get(r * M.cols + c);
      if (it) out.push(it); else if (!cover[r][c]) out.push(gap());
    }
    while (out.length && out[out.length - 1].t === "g") out.pop();
    return out;
  }
  // What's on page p and where, without the item `skip` (its place left empty).
  function solid(p, skip) {
    return flow(L.pages[p] || []).placed.filter((x) => x.it.t !== "g" && (!skip || x.it.id !== skip));
  }
  const fits = (placed, r, c, w, h) => r >= 0 && c >= 0 && r + h <= M.rows && c + w <= M.cols &&
    !placed.some((x) => r < x.r + x.h && x.r < r + h && c < x.c + x.w && x.c < c + w);
  // Takes an item off its page leaving its place empty (the others stay where they are), or out of the dock.
  function lift(id) {
    const at = locate(id);
    if (!at) return null;
    if (at.where === "page") L.pages[at.p] = serialize(solid(at.p, id));
    else L.dock.splice(at.i, 1);
    return at;
  }
  // Puts an item exactly at row r, column c of page p if that area is free. false if it isn't.
  function placeAt(item, p, r, c) {
    const [w, h] = span(item);
    const at = locate(item.id);
    const placed = solid(p, item.id);
    if (!fits(placed, r, c, w, h)) return false;
    if (at && !(at.where === "page" && at.p === p)) lift(item.id);
    placed.push({ it: item, r, c, w, h });
    L.pages[p] = serialize(placed);
    return true;
  }
  // The first free area on page p an item fits in, [r, c], or null.
  function freeSpot(item, p) {
    const [w, h] = span(item), placed = solid(p, item.id);
    for (let r = 0; r < M.rows; r++) for (let c = 0; c < M.cols; c++) if (fits(placed, r, c, w, h)) return [r, c];
    return null;
  }

  /* ---------------- rendering ---------------- */
  // One element per item, kept across renders, so moving an item animates it to its new place.
  const els = new Map();
  let page = 0;
  const homeCount = () => L.pages.length;
  const isLibrary = () => page === homeCount();

  function artHtml(a) {
    if (!a || !a.icon) return `<div class="art"></div>`;
    return `<div class="art${a.small ? " small" : ""}"><img src="${a.icon}" alt="" decoding="async"></div>`;
  }
  function folderArt(f) {
    const minis = f.apps.slice(0, 9).map((p) => `<div class="mini">${byPkg[p] && byPkg[p].icon ? `<img src="${byPkg[p].icon}" alt="">` : ""}</div>`).join("");
    return `<div class="art folder"><div class="minis">${minis}</div></div>`;
  }
  function tileInner(it) {
    if (it.t === "a") { const a = byPkg[it.p]; return `<div class="icon-wrap">${artHtml(a)}<span class="minus"></span></div><div class="label">${escapeHtml(a ? a.label : it.p)}</div>`; }
    if (it.t === "f") return `<div class="icon-wrap">${folderArt(it)}<span class="minus"></span></div><div class="label">${escapeHtml(it.name)}</div>`;
    return `<div class="wcard${it.k === "app" ? " aw" : ""}" data-k="${it.k}" data-s="${it.s}"${it.k === "app" ? ` data-wid="${it.wid}"` : ""}></div><span class="minus"></span><span class="rsz"></span>`;
  }
  function elFor(it) {
    let el = els.get(it.id);
    const key = it.t === "f" ? it.name + "|" + it.apps.slice(0, 9).join() : it.t === "w" ? it.k + it.s : it.p;
    if (!el) {
      el = document.createElement("div");
      el.className = "tile" + (it.t === "w" ? " widget" : "");
      el.dataset.id = it.id;
      els.set(it.id, el);
    }
    if (el.dataset.key !== key) {
      el.dataset.key = key;
      el.innerHTML = tileInner(it);
      if (it.t === "w") mountWidget(el.querySelector(".wcard"), it);
    }
    return el;
  }
  function pageEl(p) {
    let el = $("track").children[p];
    if (!el || !el.classList.contains("home-page")) {
      el = document.createElement("div");
      el.className = "page home-page";
      $("track").insertBefore(el, $("track").children[p] || null);
    }
    return el;
  }
  function render() {
    normalize();
    const alive = new Set();
    // Home pages
    let pages = $("track").querySelectorAll(".home-page");
    for (let i = pages.length - 1; i >= homeCount(); i--) pages[i].remove();
    for (let p = 0; p < homeCount(); p++) {
      const pe = pageEl(p);
      pe.style.left = p * M.W + "px";
      pe.style.width = M.W + "px";
      for (const x of flows[p]) {
        const el = elFor(x.it);
        alive.add(x.it.id);
        const fresh = el.parentNode !== pe;
        if (fresh) { el.classList.add("no-anim"); pe.appendChild(el); }
        const [px, py] = pos(x);
        if (x.it.t === "w") { el.style.width = x.w * M.cellW + "px"; el.style.height = x.h * M.cellH + "px"; }
        el.style.transform = `translate3d(${px}px,${py}px,0)`;
        if (fresh) { el.offsetWidth; el.classList.remove("no-anim"); }
      }
    }
    renderDock(alive);
    for (const [id, el] of els) if (!alive.has(id) && !(drag && drag.item.id === id)) { unmountWidget(el); el.remove(); els.delete(id); }
    libraryPage();
    renderDots();
    goPage(Math.min(page, homeCount()), false);
  }
  // Dock: its apps spread evenly; a dragged app opens a gap where it would land.
  function renderDock(alive) {
    const box = $("dockApps"), n = Math.max(1, L.dock.length);
    const inner = M.W - M.left - M.right - 20;
    L.dock.forEach((p, i) => {
      const it = appItem(p);
      const el = elFor(it);
      alive.add(it.id);
      const fresh = el.parentNode !== box;
      if (fresh) { el.classList.add("no-anim"); box.appendChild(el); }
      const x = (i + 0.5) * (inner / n) - M.cellW / 2, y = 0;
      el.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (fresh) { el.offsetWidth; el.classList.remove("no-anim"); }
    });
  }
  function renderDots() {
    let html = "";
    for (let p = 0; p < homeCount(); p++) html += `<button class="dot" data-p="${p}"></button>`;
    html += `<button class="dot lib" data-p="${homeCount()}"></button>`;
    $("dots").innerHTML = html;
    markDots();
  }
  function markDots() { [...$("dots").children].forEach((d, i) => d.classList.toggle("on", i === page)); }

  /* ---------------- pages: swipe ---------------- */
  function setTrack(offset) { $("track").style.transform = `translate3d(${Math.round(-page * M.W + offset)}px,0,0)`; }
  function goPage(p, glide = true) {
    page = clamp(p, 0, homeCount());
    if (glide) awQuiet = Date.now() + 450;
    $("track").classList.toggle("glide", glide);
    setTrack(0);
    markDots();
    document.body.classList.toggle("library", isLibrary());
    if (!isLibrary()) { const s = $("libSearch"); if (s) s.blur(); }
    updateQiblaWidgets();
  }

  /* ---------------- App Library ---------------- */
  // Like iOS: a search field, then boxes: Suggestions, Recently Added and one per kind of app (three
  // big icons and a cluster that opens the rest). Searching shows every app A to Z.
  let libQuery = "", libSearching = false;
  function libraryPage() {
    let el = $("track").querySelector(".library-page");
    if (!el) {
      el = document.createElement("div");
      el.className = "page library-page";
      el.innerHTML = `<div class="lib-head"><label class="lib-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="libSearch" type="search" autocomplete="off"></label><button class="lib-cancel" id="libCancel"></button></div><div class="lib-scroll" id="libScroll"></div>`;
      $("track").appendChild(el);
      $("libSearch").addEventListener("input", (e) => { libQuery = e.target.value.trim().toLowerCase(); renderLibrary(); });
      $("libSearch").addEventListener("focus", () => { libSearching = true; document.body.classList.add("lib-searching"); renderLibrary(); });
      $("libCancel").addEventListener("click", () => { $("libSearch").value = ""; libQuery = ""; $("libSearch").blur(); libSearching = false; document.body.classList.remove("lib-searching"); renderLibrary(); });
      $("libScroll").addEventListener("click", (e) => { const m = e.target.closest(".lb-more"); if (m) openGroup(+m.dataset.g); });
    }
    el.style.left = homeCount() * M.W + "px";
    el.style.width = M.W + "px";
    $("libSearch").placeholder = T("search");
    $("libCancel").textContent = T("cancel");
    renderLibrary();
  }
  const GROUP_OF = { 4: 0, 1: 1, 2: 1, 3: 2, 7: 3, 6: 4, 5: 5, 0: 6 };
  let libGroups = [];
  function recentApps() {
    const rec = store.get("phone.recent", []).filter((p) => byPkg[p]);
    for (const a of installed) { if (rec.length >= 8) break; if (!rec.includes(a.pkg)) rec.push(a.pkg); }
    return rec;
  }
  function renderLibrary() {
    const libIcon = (p) => `<div class="tile lib-app" data-pkg="${escapeHtml(p)}"><div class="icon-wrap">${artHtml(byPkg[p])}</div></div>`;
    if (libSearching || libQuery) {
      const list = installed.filter((a) => !libQuery || a.label.toLowerCase().includes(libQuery));
      $("libScroll").innerHTML = list.length ? `<div class="lib-list">` + list.map((a) =>
        `<div class="tile lib-app" data-pkg="${escapeHtml(a.pkg)}"><div class="icon-wrap">${artHtml(a)}</div><div class="label">${escapeHtml(a.label)}</div></div>`).join("") + `</div>`
        : `<div class="sp-empty">${T("noResults")}</div>`;
      return;
    }
    const groups = [[T("suggestions"), recentApps().slice(0, 4)]];
    const added = installed.filter((a) => a.installed).sort((a, b) => b.installed - a.installed).slice(0, 7).map((a) => a.pkg);
    if (added.length) groups.push([T("recent"), added]);
    const byGroup = T("groups").map(() => []);
    for (const a of installed) byGroup[GROUP_OF[a.category] != null ? GROUP_OF[a.category] : 7].push(a.pkg);
    byGroup.forEach((pk, i) => { if (pk.length) groups.push([T("groups")[i], pk]); });
    libGroups = groups;
    $("libScroll").innerHTML = `<div class="lib-boxes">` + groups.map(([name, pk], g) => {
      const big = pk.length > 4 ? pk.slice(0, 3) : pk.slice(0, 4);
      const more = pk.length > 4 ? `<div class="lb-more" data-g="${g}">${pk.slice(3, 7).map((p) => artHtml(byPkg[p])).join("")}</div>` : "";
      return `<div class="lib-box"><div class="lb-tile">${big.map(libIcon).join("")}${more}</div><div class="lb-name">${escapeHtml(name)}</div></div>`;
    }).join("") + `</div>`;
  }
  // A box's cluster: all its apps, in a folder-like glass platter (tap to open, drag to a home page).
  function openGroup(g) {
    const [name, pk] = libGroups[g] || [];
    if (!pk) return;
    openF = { name, apps: pk.slice(), lib: true };
    renderFolder();
    document.body.classList.add("folder-open");
  }

  /* ---------------- Search (swipe down) ---------------- */
  function openSpot() {
    closeMenu();
    document.body.classList.add("spot-open");
    $("spInput").value = "";
    renderSpot();
    $("spInput").focus();
  }
  function closeSpot() {
    $("spInput").blur();
    document.body.classList.remove("spot-open");
  }
  function renderSpot() {
    const q = $("spInput").value.trim(), ql = q.toLowerCase();
    const tile = (a) => `<div class="tile" data-pkg="${escapeHtml(a.pkg)}"><div class="icon-wrap">${artHtml(a)}</div><div class="label">${escapeHtml(a.label)}</div></div>`;
    if (!q) {
      $("spResults").innerHTML = `<div class="sp-head">${T("suggestions")}</div><div class="sp-apps">${recentApps().slice(0, M.cols * 2).map((p) => tile(byPkg[p])).join("")}</div>`;
      return;
    }
    const apps = installed.filter((a) => a.label.toLowerCase().includes(ql))
      .sort((a, b) => (a.label.toLowerCase().startsWith(ql) ? 0 : 1) - (b.label.toLowerCase().startsWith(ql) ? 0 : 1));
    $("spResults").innerHTML = (apps.length ? `<div class="sp-head">${T("apps")}</div><div class="sp-apps">${apps.slice(0, M.cols * 3).map(tile).join("")}</div>` : "") +
      `<button class="sp-row" id="spWeb"><i><svg viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC04" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5L6.4 10C7.2 7.7 9.4 5.9 12 5.9z"/></svg></i><span>${escapeHtml(T("searchWeb", q))}</span></button>`;
  }
  $("spInput").addEventListener("input", renderSpot);
  $("spInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { const first = $("spResults").querySelector(".tile"); if (first) { launch(first.dataset.pkg); closeSpot(); } } });
  $("spCancel").addEventListener("click", closeSpot);
  $("spResults").addEventListener("click", (e) => {
    const t = e.target.closest(".tile");
    if (t) { launch(t.dataset.pkg); return closeSpot(); }
    if (e.target.closest("#spWeb")) {
      try { TV.openUrl("https://www.google.com/search?q=" + encodeURIComponent($("spInput").value.trim())); } catch (er) {}
      closeSpot();
    }
  });
  $("spot").addEventListener("pointerdown", (e) => { if (e.target === $("spot") || e.target === $("spResults")) closeSpot(); });
  $("searchPill").addEventListener("click", openSpot);

  /* ---------------- edit mode ---------------- */
  function enterEdit() {
    if (has("editing")) return;
    document.body.classList.add("editing");
    if (openF && !openF.lib) $("fdName").readOnly = false;
  }
  function exitEdit() {
    if (!has("editing")) return;
    document.body.classList.remove("editing");
    if (openF) { commitName(); $("fdName").blur(); $("fdName").readOnly = true; }
    // Empty pages go away, like on an iPhone.
    const keep = L.pages.filter((p) => p.some((it) => it.t !== "g"));
    L.pages = keep.length ? keep : [[]];
    save();
    render();
  }

  /* ---------------- find items ---------------- */
  function locate(id) {
    for (let p = 0; p < L.pages.length; p++) { const i = L.pages[p].findIndex((x) => x.id === id); if (i >= 0) return { where: "page", p, i, item: L.pages[p][i] }; }
    const d = L.dock.findIndex((p) => "a:" + p === id);
    if (d >= 0) return { where: "dock", i: d, item: appItem(L.dock[d]) };
    return null;
  }
  function takeOut(id) {
    const at = locate(id);
    if (!at) return null;
    if (at.where === "page") L.pages[at.p].splice(at.i, 1); else L.dock.splice(at.i, 1);
    return at;
  }

  /* ---------------- touch: tap, hold, swipe, drag ---------------- */
  let press = null, frame = 0, pending = null, swipeT = null;
  function tileFrom(e) { return e.target.closest(".tile"); }
  function onDown(e) {
    if (e.button > 0 || press || drag) return;
    const el = tileFrom(e);
    press = { el, x0: e.clientX, y0: e.clientY, t0: performance.now(), id: e.pointerId, mode: null, long: false,
      minus: !!e.target.closest(".minus"), rsz: !!e.target.closest(".rsz"), lib: el && el.classList.contains("lib-app"), inFolder: !!e.target.closest("#folder"),
      inDock: !!e.target.closest("#dock") };
    if (el) el.classList.add("pressed");
    press.timer = setTimeout(() => {
      if (!press || press.mode) return;
      press.long = true;
      if (press.el) press.el.classList.remove("pressed");
      if (!press.el) { if (!press.inFolder && !isLibrary()) enterEdit(); return; }
      if (has("editing") && !press.lib) return; // in edit mode a hold just waits for the drag
      openMenuFor(press.el);
    }, LONG_PRESS_MS);
  }
  function onMove(e) {
    if (!press || e.pointerId !== press.id) return;
    pending = e;
    if (!frame) frame = requestAnimationFrame(applyMove);
  }
  function applyMove() {
    frame = 0;
    const e = pending;
    if (!press || !e) return;
    const dx = e.clientX - press.x0, dy = e.clientY - press.y0;
    if (drag) return dragMove(e);
    if (!press.mode && Math.hypot(dx, dy) > 9) {
      clearTimeout(press.timer);
      if (press.el) press.el.classList.remove("pressed");
      // Holding an app and moving: edit mode, drag it (in edit mode no hold is needed).
      if (press.el && (press.long || (has("editing") && !press.lib))) {
        closeMenu();
        if (!press.lib) enterEdit();
        press.mode = "drag";
        return startDrag(press.el, e);
      }
      press.mode = Math.abs(dx) > Math.abs(dy) && !press.inFolder ? "swipe"
        // Down on a home page: Search, like on an iPhone.
        : dy > 0 && !press.inFolder && !isLibrary() && !has("editing") && !press.inDock ? "pull" : "scroll";
      if (press.mode === "swipe") { $("track").classList.remove("glide"); press.x0 = e.clientX; document.body.classList.add("swiping"); }
      return;
    }
    if (press.mode === "swipe") {
      const atEnd = (page === 0 && dx > 0) || (page === homeCount() && dx < 0);
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
    if (p.el) p.el.classList.remove("pressed");
    if (drag) return endDrag(e);
    if (p.mode === "pull") { if (e.clientY - p.y0 > 40) openSpot(); return; }
    if (p.mode === "swipe") {
      clearTimeout(swipeT);
      swipeT = setTimeout(() => document.body.classList.remove("swiping"), 700);
      const dx = e.clientX - p.x0, v = p.vx || 0;
      let to = page;
      if ((dx < -M.W * 0.18 || v < -0.4) && page < homeCount()) to++;
      else if ((dx > M.W * 0.18 || v > 0.4) && page > 0) to--;
      return goPage(to);
    }
    if (p.mode || p.long || e.type === "pointercancel") return;
    tap(p);
  }
  function tap(p) {
    if (!p.el) { if (has("editing") && !p.inFolder) exitEdit(); return; }
    if (p.lib) return launch(p.el.dataset.pkg);
    const id = p.el.dataset.id;
    const at = locate(id) || folderLocate(id);
    if (!at) return;
    if (has("editing")) {
      if (p.minus) return minusTap(p.el, at.item);
      if (p.rsz && at.item.t === "w") return resizeWidget(at.item, nextSize(at.item));
      if (at.item.t === "f") openFolder(at.item);
      return;
    }
    const it = at.item;
    if (it.t === "a") launch(it.p);
    else if (it.t === "f") openFolder(it);
    else widgetTap(p.el, it);
  }
  for (const el of [$("viewport"), $("dock"), $("folder")]) el.addEventListener("pointerdown", onDown);
  // Moves are followed everywhere: once the hold menu is up, the finger is over its backdrop.
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerup", onUp);
  addEventListener("pointercancel", (e) => { if (drag && press && e.pointerId === press.id) return; onUp(e); });
  $("dots").addEventListener("click", (e) => { const d = e.target.closest(".dot"); if (d) goPage(+d.dataset.p); });

  /* ---------------- drag and drop (the iPhone way) ---------------- */
  // The dragged tile floats above everything; its place in the grid stays as an invisible gap that
  // moves as you go, so the other apps slide aside. Holding over an app for a moment makes a folder.
  let drag = null;
  function startDrag(el, e) {
    const r = el.getBoundingClientRect();
    let item, origin;
    let src = el;
    if (el.classList.contains("lib-app")) {
      // From the App Library: onto the last home page (moved there if it was on a page already).
      const p = el.dataset.pkg;
      if (openF && openF.lib) { document.body.classList.remove("folder-open"); openF = null; }
      src = null;
      const at = locate("a:" + p);
      item = at ? at.item : appItem(p);
      if (at) takeOut(item.id);
      removed.delete(p);
      L.pages[homeCount() - 1].push(item);
      goPage(homeCount() - 1);
      origin = "library";
    } else if (el.closest("#folder")) {
      origin = "folder";
      item = appItem(el.dataset.id.slice(2));
    } else {
      item = (locate(el.dataset.id) || {}).item;
      origin = "home";
    }
    if (!item) return;
    delete item.ov; // placed by hand from now on
    let float, offX = e.clientX - r.left, offY = e.clientY - r.top;
    if (src) {
      float = el.cloneNode(true);
      float.classList.remove("pressed", "ghost");
      float.style.width = r.width + "px"; float.style.height = r.height + "px";
    } else {
      // A Library icon (no label, any size): float a home-screen tile centred on the icon.
      float = document.createElement("div");
      float.className = "tile";
      float.innerHTML = tileInner(item);
      const ir = el.querySelector(".icon-wrap").getBoundingClientRect();
      offX = e.clientX - (ir.left + ir.width / 2 - M.cellW / 2);
      offY = e.clientY - (ir.top + ir.height / 2 - 6 - M.icon / 2);
    }
    $("dragLayer").appendChild(float);
    drag = { item, origin, float, offX, offY, folderHover: null, hoverAt: 0, lastTarget: null, edge: null };
    placeFloat(e.clientX, e.clientY);
    if (origin === "folder") return;
    render();
    ghost(true);
  }
  function ghost(on) {
    const el = els.get(drag.item.id);
    if (el) el.classList.toggle("ghost", on);
  }
  function placeFloat(x, y) {
    drag.float.style.transform = `translate3d(${x - drag.offX}px,${y - drag.offY}px,0)`;
  }
  function dragMove(e) {
    const x = e.clientX, y = e.clientY;
    placeFloat(x, y);
    if (drag.origin === "folder") {
      // Out of the folder's glass: back onto the home page, still in your finger.
      const r = $("fdPlatter").getBoundingClientRect();
      if (x < r.left - 10 || x > r.right + 10 || y < r.top - 10 || y > r.bottom + 10) leaveFolderWithDrag();
      else folderReorder(x, y);
      return;
    }
    // Page edges: wait a moment, then turn the page (past the last one, a new empty page).
    const edge = x < 26 ? -1 : x > M.W - 26 ? 1 : 0;
    if (edge !== (drag.edge && drag.edge.dir)) {
      clearTimeout(drag.edge && drag.edge.t);
      drag.edge = edge ? { dir: edge, t: setTimeout(() => turnPageWithDrag(edge), 550) } : null;
    }
    const dockTop = M.H - M.bottom - 10 - M.dockH;
    if (y > dockTop - 6 && drag.item.t === "a") return hoverDock(x);
    hoverPage(x, y);
  }
  function turnPageWithDrag(dir) {
    if (!drag) return;
    drag.edge = null;
    const to = page + dir;
    if (to < 0 || to > homeCount()) return;
    lift(drag.item.id);
    if (to === homeCount()) L.pages.push([]);
    // Onto the new page: in its first free place, or at the start if it's full (the rest moves along).
    const spot = freeSpot(drag.item, to);
    if (!spot || !placeAt(drag.item, to, spot[0], spot[1])) L.pages[to].unshift(drag.item);
    drag.lastTarget = null;
    goPage(to);
    render();
    ghost(true);
  }
  // Which item sits under the finger on this page, and is the finger near its middle?
  function hoverPage(x, y) {
    if (isLibrary()) return;
    const placed = flows[page] || [];
    const col = Math.floor((x - M.gridLeft) / M.cellW), row = Math.floor((y - M.gridTop) / M.cellH);
    // Over an empty part of the page: it goes exactly there, nothing else moves (a widget by where
    // its top-left corner is).
    const [sw, sh] = span(drag.item);
    const tr = drag.item.t === "w" ? clamp(Math.round((y - drag.offY - M.gridTop) / M.cellH), 0, M.rows - sh) : row;
    const tc = drag.item.t === "w" ? clamp(Math.round((x - drag.offX - M.gridLeft) / M.cellW), 0, M.cols - sw) : col;
    if (row >= 0 && row < M.rows && col >= 0 && col < M.cols && fits(solid(page, drag.item.id), tr, tc, sw, sh)) {
      folderHover(null);
      const key = "cell:" + page + ":" + tr + ":" + tc;
      if (key === drag.lastTarget) return;
      drag.lastTarget = key;
      clearTimeout(drag.moveT);
      drag.moveT = setTimeout(() => {
        if (!drag || !placeAt(drag.item, page, tr, tc)) return;
        render();
        ghost(true);
      }, 120);
      return;
    }
    let under = null;
    for (const p of placed) if (row >= p.r && row < p.r + p.h && col >= p.c && col < p.c + p.w) under = p;
    if (under && under.it.id === drag.item.id) under = null;
    // Over another app's or folder's icon: a folder (iPhone). Nothing moves out of the way then,
    // so the icon stays under your finger; apps only slide aside when you're between icons.
    if (under && drag.item.t === "a" && under.it.t !== "w") {
      const [ux, uy] = pos(under);
      const cx = ux + M.cellW / 2, cy = uy + 6 + M.icon / 2, half = M.icon * 0.62;
      if (Math.abs(x - cx) < half && Math.abs(y - cy) < half) { clearTimeout(drag.moveT); drag.lastTarget = null; return folderHover(under.it); }
    }
    folderHover(null);
    // Otherwise: the gap moves to that place.
    let index;
    const list = L.pages[page].filter((it) => it.id !== drag.item.id);
    if (under) {
      // Onto an app's place: moving forward, the ones in between slide back (like an iPhone).
      const full = L.pages[page], from = full.findIndex((it) => it.id === drag.item.id);
      index = list.indexOf(under.it) + (from >= 0 && from < full.indexOf(under.it) ? 1 : 0);
    }
    else {
      index = 0;
      // An empty cell: after everything that comes before it in reading order.
      for (const p of placed) if (p.it.id !== drag.item.id && (p.r < row || (p.r === row && p.c < col))) index = Math.max(index, list.indexOf(p.it) + 1);
    }
    const key = page + ":" + index;
    if (key === drag.lastTarget) return;
    drag.lastTarget = key;
    clearTimeout(drag.moveT);
    drag.moveT = setTimeout(() => {
      if (!drag) return;
      takeOut(drag.item.id);
      L.pages[page].splice(clamp(index, 0, L.pages[page].length), 0, drag.item);
      render();
      ghost(true);
    }, 160);
  }
  function hoverDock(x) {
    folderHover(null);
    const inDock = L.dock.includes(drag.item.p);
    if (!inDock && L.dock.length >= M.dockMax) return;
    const n = L.dock.length + (inDock ? 0 : 1), inner = M.W - M.left - M.right - 20;
    const index = clamp(Math.floor((x - M.left - 10) / (inner / n)), 0, n - 1);
    const key = "dock:" + index;
    if (key === drag.lastTarget) return;
    drag.lastTarget = key;
    clearTimeout(drag.moveT);
    drag.moveT = setTimeout(() => {
      if (!drag) return;
      takeOut(drag.item.id);
      L.dock.splice(index, 0, drag.item.p);
      render();
      ghost(true);
    }, 90);
  }
  function folderHover(target) {
    const id = target ? target.id : null;
    if (drag.folderHover && drag.folderHover.id === id) return;
    if (drag.folderHover) { clearTimeout(drag.folderHover.t); const el = els.get(drag.folderHover.id); if (el) el.classList.remove("folder-target"); }
    drag.folderHover = null;
    if (!target) return;
    drag.folderHover = { id, ready: false, t: setTimeout(() => {
      if (!drag || !drag.folderHover || drag.folderHover.id !== id) return;
      drag.folderHover.ready = true;
      const el = els.get(id);
      if (el) el.classList.add("folder-target");
    }, 300) };
  }
  function endDrag() {
    const d = drag;
    clearTimeout(d.moveT);
    clearTimeout(d.edge && d.edge.t);
    if (d.origin === "folder") return endFolderDrag();
    if (d.folderHover && d.folderHover.ready) {
      // Dropped on an app: a new folder; on a folder: into it.
      const target = (locate(d.folderHover.id) || {}).item;
      let made = null;
      if (target) {
        takeOut(d.item.id);
        const at = locate(target.id);
        if (target.t === "f") target.apps.push(d.item.p);
        else L.pages[at.p][at.i] = made = { t: "f", id: uid("f"), name: folderName([target.p, d.item.p]), apps: [target.p, d.item.p] };
        const el = els.get(target.id);
        if (el) el.classList.remove("folder-target");
      }
      d.float.remove();
      drag = null;
      save();
      render();
      // Like an iPhone: a new folder opens with both apps and its name ready to change.
      if (made) openFolder(made, true);
      return;
    }
    // Fly to the gap, then land.
    drag = null;
    render();
    const el = els.get(d.item.id);
    if (!el || !el.parentNode) { d.float.remove(); save(); return; }
    // Where the gap ends up (its final place, not where its slide animation is right now).
    const m = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(el.style.transform) || [0, 0, 0];
    const cr = el.parentNode.getBoundingClientRect();
    const tx = (el.parentNode.classList.contains("home-page") ? (homePageIndex(el.parentNode) - page) * M.W : cr.left) + +m[1];
    const ty = (el.parentNode.classList.contains("home-page") ? 0 : cr.top) + +m[2];
    d.float.classList.add("dropping");
    d.float.style.transform = `translate3d(${tx}px,${ty}px,0)`;
    const land = () => { d.float.remove(); el.classList.remove("ghost"); };
    d.float.addEventListener("transitionend", land, { once: true });
    setTimeout(land, 400);
    save();
  }
  const homePageIndex = (pe) => [...$("track").querySelectorAll(".home-page")].indexOf(pe);
  // While holding or dragging an app, a finger move must not scroll the App Library or a folder.
  document.addEventListener("touchmove", (e) => {
    if (drag || (press && (press.long || press.mode === "drag"))) e.preventDefault();
  }, { passive: false });

  const CATEGORY = {
    en: { 0: "Games", 1: "Music", 2: "Entertainment", 3: "Photos", 4: "Social", 5: "News", 6: "Navigation", 7: "Productivity" },
    ar: { 0: "ألعاب", 1: "موسيقى", 2: "ترفيه", 3: "صور", 4: "تواصل", 5: "أخبار", 6: "ملاحة", 7: "إنتاجية" },
  };
  function folderName(pkgs) {
    const cats = pkgs.map((p) => byPkg[p] && byPkg[p].category);
    return (cats[0] != null && cats[0] === cats[1] && CATEGORY[lang][cats[0]]) || T("newFolder");
  }

  /* ---------------- folders ---------------- */
  let openF = null;
  const FCOLS = () => (M.cols === 4 ? 3 : 4);
  function folderLocate(id) {
    if (!openF || !id.startsWith("a:") || !openF.apps.includes(id.slice(2))) return null;
    return { where: "folder", item: appItem(id.slice(2)) };
  }
  // Opens zooming out of the folder's icon, like an iPhone. rename: the name ready to type (a folder
  // just made by dropping an app on another).
  let fdClosing = null;
  function openFolder(f, rename = false) {
    clearTimeout(fdClosing);
    openF = f;
    renderFolder();
    const pl = $("fdPlatter"), from = folderIconRect(f);
    pl.classList.remove("anim");
    if (from) { pl.style.transform = zoomFrom(from); pl.classList.add("mini"); }
    document.body.classList.add("folder-open");
    requestAnimationFrame(() => {
      pl.classList.add("anim");
      pl.classList.remove("mini");
      pl.style.transform = "none";
    });
    if (rename) {
      $("fdName").focus();
      $("fdName").select();
    }
  }
  function closeFolder() {
    if (!openF) return;
    const f = openF, wasLib = f.lib;
    commitName();
    $("fdName").blur();
    const pl = $("fdPlatter"), to = folderIconRect(f);
    pl.classList.add("anim");
    if (to) { pl.style.transform = zoomFrom(to); pl.classList.add("mini"); }
    document.body.classList.remove("folder-open");
    openF = null;
    clearTimeout(fdClosing);
    fdClosing = setTimeout(() => { pl.classList.remove("anim"); detachFolderTiles(); }, 320);
    if (wasLib) return;
    save();
    render();
  }
  // The platter's transform that shrinks it onto the folder icon.
  function zoomFrom(r) {
    const pl = $("fdPlatter"), w = parseFloat(pl.style.width), h = parseFloat(pl.style.height);
    const x = parseFloat(pl.style.left), y = parseFloat(pl.style.top);
    return `translate3d(${r.left - x}px,${r.top - y}px,0) scale(${r.width / w},${r.height / h})`;
  }
  function folderIconRect(f) {
    const el = f.id && els.get(f.id);
    const icon = el && el.querySelector(".icon-wrap");
    return icon && icon.isConnected ? icon.getBoundingClientRect() : null;
  }
  // Folder tiles are kept (not rebuilt) between openings, so their icons don't decode again.
  const fdEls = new Map();
  function detachFolderTiles() { if (!openF) [...$("fdGrid").children].forEach((el) => el.remove()); }
  function renderFolder() {
    const fc = FCOLS(), w = Math.min(M.W - 48, fc * M.cellW + 40);
    const rows = Math.max(1, Math.min(4, Math.ceil(openF.apps.length / fc)));
    const h = Math.min(M.H * 0.6, rows * M.cellH + 40);
    const pl = $("fdPlatter");
    pl.style.width = w + "px"; pl.style.height = h + "px";
    pl.style.left = (M.W - w) / 2 + "px"; pl.style.top = (M.H - h) / 2 + "px";
    $("fdTitle").style.top = (M.H - h) / 2 - 66 + "px";
    if (document.activeElement !== $("fdName")) $("fdName").value = openF.name;
    $("fdName").readOnly = !!openF.lib || !has("editing");
    const g = $("fdGrid"), left = (w - fc * M.cellW) / 2;
    const keep = new Set(), fresh = [];
    openF.apps.forEach((p, i) => {
      const key = (openF.lib ? "L" : "F") + p;
      keep.add(key);
      let el = fdEls.get(key);
      if (!el) {
        el = document.createElement("div");
        el.className = "tile" + (openF.lib ? " lib-app" : "");
        el.dataset.id = "a:" + p;
        el.dataset.pkg = p;
        el.dataset.key = key;
        el.innerHTML = tileInner(appItem(p));
        fdEls.set(key, el);
      }
      if (el.parentNode !== g) { el.classList.add("no-anim"); g.appendChild(el); fresh.push(el); }
      el.style.transform = `translate3d(${left + (i % fc) * M.cellW}px,${20 + Math.floor(i / fc) * M.cellH}px,0)`;
    });
    [...g.children].forEach((el) => { if (!keep.has(el.dataset.key)) el.remove(); });
    // Newly shown tiles jump to their place; later moves animate.
    if (fresh.length) requestAnimationFrame(() => fresh.forEach((el) => el.classList.remove("no-anim")));
  }
  // The name, edited in place.
  function commitName() {
    if (!openF || openF.lib) return;
    const v = $("fdName").value.trim().slice(0, 24);
    if (v && v !== openF.name) { openF.name = v; save(); render(); }
    else $("fdName").value = openF.name;
  }
  $("fdName").addEventListener("keydown", (e) => { if (e.key === "Enter") $("fdName").blur(); });
  $("fdName").addEventListener("blur", commitName);
  $("fdName").addEventListener("pointerdown", (e) => e.stopPropagation());
  function folderReorder(x, y) {
    const g = $("fdGrid").getBoundingClientRect(), fc = FCOLS(), left = (g.width - fc * M.cellW) / 2;
    const col = clamp(Math.floor((x - g.left - left) / M.cellW), 0, fc - 1), row = Math.max(0, Math.floor((y - g.top - 20 + $("fdGrid").scrollTop) / M.cellH));
    const to = clamp(row * fc + col, 0, openF.apps.length - 1), from = openF.apps.indexOf(drag.item.p);
    if (to === from || from < 0) return;
    openF.apps.splice(from, 1);
    openF.apps.splice(to, 0, drag.item.p);
    renderFolder();
    const el = $("fdGrid").querySelector(`.tile[data-id="${CSS.escape(drag.item.id)}"]`);
    if (el) el.classList.add("ghost");
  }
  function leaveFolderWithDrag() {
    const f = openF;
    f.apps = f.apps.filter((p) => p !== drag.item.p);
    document.body.classList.remove("folder-open");
    openF = null;
    // The folder keeps its place; with no apps left it goes away.
    if (!f.apps.length) { const at = locate(f.id); if (at) L.pages[at.p].splice(at.i, 1); }
    drag.origin = "home";
    L.pages[page].push(drag.item);
    render();
    ghost(true);
  }
  function endFolderDrag() {
    const d = drag;
    drag = null;
    d.float.remove();
    const el = $("fdGrid").querySelector(".ghost");
    if (el) el.classList.remove("ghost");
    save();
  }

  $("folder").addEventListener("click", (e) => { if (e.target === $("folder") && !drag) closeFolder(); });

  /* ---------------- menus ---------------- */
  const IC = {
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
    rename: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>',
    apps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><path d="M17.25 13.5v7.5M13.5 17.25H21"/></svg>',
    resize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M14 10h-4v4M10 10l7 7M17 13v4h-4"/></svg>',
    ungroup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>',
  };
  let menuActions = [];
  function showMenu(actions, rect) {
    menuActions = actions;
    const m = $("menu");
    m.innerHTML = actions.map(([t, icon, , cls]) => `<button class="mi ${cls || ""}"><span>${escapeHtml(t)}</span>${icon}</button>`).join("");
    const w = m.offsetWidth || 240, h = actions.length * 48 + 12;
    const below = rect.bottom + 10 + h < M.H - M.bottom;
    m.style.left = clamp(rect.left + rect.width / 2 - w / 2, 10, M.W - w - 10) + "px";
    m.style.top = (below ? rect.bottom + 10 : Math.max(M.top + 6, rect.top - 10 - h)) + "px";
    m.style.transformOrigin = below ? "50% 0" : "50% 100%";
    document.body.classList.add("menu-open");
    m.hidden = false;
  }
  function closeMenu() { $("menu").hidden = true; document.body.classList.remove("menu-open"); }
  $("menu").addEventListener("click", (e) => {
    const b = e.target.closest(".mi");
    if (!b) return;
    const a = menuActions[[...$("menu").children].indexOf(b)];
    closeMenu();
    if (a) a[2]();
  });
  $("scrim").addEventListener("pointerdown", (e) => { e.preventDefault(); closeMenu(); });
  function openMenuFor(el) {
    const r = el.querySelector(".wcard, .icon-wrap").getBoundingClientRect();
    if (el.classList.contains("lib-app")) {
      const p = el.dataset.pkg, a = byPkg[p];
      const acts = [];
      if (!locate("a:" + p)) acts.push([T("addHome"), IC.plus, () => { removed.delete(p); L.pages[homeCount() - 1].push(appItem(p)); save(); render(); goPage(homeCount() - 1); }]);
      if (a && !a.system) acts.push([T("deleteApp"), IC.trash, () => TV.uninstall(p), "danger"]);
      if (acts.length) showMenu(acts, r);
      return;
    }
    const at = locate(el.dataset.id) || folderLocate(el.dataset.id);
    if (!at) return;
    const it = at.item, acts = [];
    if (it.t === "f") acts.push([T("rename"), IC.rename, () => { enterEdit(); openFolder(it, true); }], [T("removeFolder"), IC.ungroup, () => ungroup(it)]);
    if (it.t === "w" && it.k === "tasbih") acts.push([T("resetCount"), IC.ungroup, resetTasbih]);
    if (it.t === "w") for (const sz of sizesOf(it)) if (sz !== it.s) acts.push([T({ s: "small", m: "medium", l: "large", w: "wide" }[sz]), IC.resize, () => resizeWidget(it, sz)]);
    if (it.t === "w" && it.k === "khatma") acts.push([T("resetKhatma"), IC.ungroup, resetKhatma]);
    if (it.t === "w") acts.push([T("removeWidget"), IC.minus, () => removeItem(it), "danger"]);
    if (!at.where.startsWith("folder")) acts.push([T("editHome"), IC.edit, enterEdit]);
    if (it.t === "a") {
      acts.push([T("removeHome"), IC.minus, () => removeApp(it.p)]);
      if (byPkg[it.p] && !byPkg[it.p].system) acts.push([T("deleteApp"), IC.trash, () => TV.uninstall(it.p), "danger"]);
    }
    showMenu(acts, r);
  }
  function minusTap(el, it) {
    const r = el.querySelector(".wcard, .icon-wrap").getBoundingClientRect();
    if (it.t === "w") return removeItem(it);
    if (it.t === "f") return showMenu([[T("removeFolder"), IC.ungroup, () => ungroup(it)]], r);
    const acts = [[T("removeHome"), IC.minus, () => removeApp(it.p)]];
    if (byPkg[it.p] && !byPkg[it.p].system) acts.push([T("deleteApp"), IC.trash, () => TV.uninstall(it.p), "danger"]);
    showMenu(acts, r);
  }
  function removeItem(it) {
    if (it.k === "app") { try { TV.deleteAppWidget(it.wid); } catch (e) {} }
    lift(it.id); save(); render();
  }
  // Widget sizes: each widget's own list; other apps' widgets take any.
  const sizesOf = (it) => (it.k === "app" ? ["s", "m", "w", "l"] : (WIDGETS[it.k] || { sizes: [it.s] }).sizes);
  const nextSize = (it) => { const l = sizesOf(it); return l[(l.indexOf(it.s) + 1) % l.length]; };
  // A new size, keeping its top-left corner if there's room there (nearby if not; else the rest moves).
  function resizeWidget(it, sz) {
    const at = locate(it.id);
    if (!at || at.where !== "page" || sz === it.s) return;
    const me = flow(L.pages[at.p]).placed.find((x) => x.it.id === it.id);
    const placed = solid(at.p, it.id);
    it.s = sz;
    const [w, h] = span(it);
    let spot = null;
    if (me) {
      const c0 = clamp(me.c, 0, M.cols - w), r0 = clamp(me.r, 0, M.rows - h);
      if (fits(placed, r0, c0, w, h)) spot = [r0, c0];
      for (let dr = 0; !spot && dr < M.rows; dr++) for (const r of [r0 + dr, r0 - dr]) for (let c = 0; c + w <= M.cols && !spot; c++) if (fits(placed, r, c, w, h)) spot = [r, c];
    }
    if (spot) { placed.push({ it, r: spot[0], c: spot[1], w, h }); L.pages[at.p] = serialize(placed); }
    save();
    render();
    const el = els.get(it.id);
    if (el) { const c = el.querySelector(".wcard"); if (c) { c.dataset.s = sz; drawWidget(c); } }
  }
  function removeApp(p) {
    if (openF) { openF.apps = openF.apps.filter((x) => x !== p); renderFolder(); }
    else takeOut("a:" + p);
    removed.add(p);
    save();
    render();
  }
  function ungroup(f) {
    const at = locate(f.id);
    if (!at) return;
    L.pages[at.p].splice(at.i, 1, ...f.apps.map(appItem));
    if (openF === f) closeFolder();
    save();
    render();
  }

  /* ---------------- widgets ---------------- */
  // Each widget renders into its glass card; one shared clock updates them all once a minute.
  const WIDGETS = {
    clock: { sizes: ["s", "m"], name: "wClock", desc: "wClockD" },
    prayer: { sizes: ["m", "l"], name: "wPrayer", desc: "wPrayerD" },
    azkar: { sizes: ["m", "l"], name: "wAzkar", desc: "wAzkarD" },
    qibla: { sizes: ["s"], name: "wQibla", desc: "wQiblaD" },
    places: { sizes: ["w", "m"], name: "wPlaces", desc: "wPlacesD" },
    weather: { sizes: ["s", "m"], name: "wWeather", desc: "wWeatherD" },
    logo: { sizes: ["w", "s", "m"], name: "wLogo", desc: "wLogoD", islamic: true },
    hijri: { sizes: ["s", "m"], name: "wHijri", desc: "wHijriD", islamic: true },
    countdown: { sizes: ["s", "m"], name: "wCount", desc: "wCountD", islamic: true },
    tasbih: { sizes: ["s", "m"], name: "wTasbih", desc: "wTasbihD", islamic: true },
    ayah: { sizes: ["m", "l"], name: "wAyah", desc: "wAyahD", islamic: true },
    names: { sizes: ["s", "m"], name: "wNames", desc: "wNamesD", islamic: true },
    sunnah: { sizes: ["m", "l"], name: "wSunnah", desc: "wSunnahD", islamic: true },
    dua: { sizes: ["m", "l"], name: "wDua", desc: "wDuaD", islamic: true },
    hadith: { sizes: ["m", "l"], name: "wHadith", desc: "wHadithD", islamic: true },
    tracker: { sizes: ["m", "w"], name: "wTracker", desc: "wTrackerD", islamic: true },
    khatma: { sizes: ["s", "m"], name: "wKhatma", desc: "wKhatmaD", islamic: true },
    fasting: { sizes: ["s", "m"], name: "wFast", desc: "wFastD", islamic: true },
    moon: { sizes: ["s", "m"], name: "wMoon", desc: "wMoonD", islamic: true },
  };
  for (const k of ["prayer", "azkar", "qibla"]) WIDGETS[k].islamic = true;
  const I = window.ISLAMIC;
  // Tasbih count, and how far the verse and Name widgets have been tapped on today.
  let tas = store.get("phone.tasbih", { n: 0, total: 0, day: "" });
  const dayNo = (t) => Math.floor((t - new Date(t.getFullYear(), 0, 0)) / 86400000) + t.getFullYear() * 366;
  let ayahShift = 0, nameShift = 0, duaShift = 0, hadithShift = 0;
  const dayKey = (t) => `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`;
  // Prayer tracker: the prayers ticked off on each of the last days.
  let track = store.get("phone.tracker", {});
  function trackStreak(t) {
    let n = 0;
    const d = new Date(t);
    if ((track[dayKey(d)] || []).length < 5) d.setDate(d.getDate() - 1); // today still in progress
    while ((track[dayKey(d)] || []).length >= 5 && n < 999) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function toggleTrack(k) {
    const key = dayKey(now()), l = track[key] || [];
    track[key] = l.includes(k) ? l.filter((x) => x !== k) : l.concat(k);
    const keep = Object.keys(track).sort((a, b) => new Date(b) - new Date(a)).slice(0, 400);
    track = Object.fromEntries(keep.map((x) => [x, track[x]]));
    store.set("phone.tracker", track);
    redraw("tracker");
  }
  // Khatma: the page reached (0-604) and the pages read today.
  let kh = store.get("phone.khatma", { page: 0, day: "", today: 0 });
  const juzOf = (pg) => (pg < 22 ? 1 : Math.min(30, Math.floor((pg - 22) / 20) + 2));
  function addPages(n) {
    const key = dayKey(now());
    if (kh.day !== key) { kh.day = key; kh.today = 0; }
    const before = kh.page;
    kh.page = Math.min(604, kh.page + n);
    kh.today += kh.page - before;
    store.set("phone.khatma", kh);
    redraw("khatma");
    if (kh.page === 604 && before < 604) toast(lang === "ar" ? "ختمة مباركة! تقبّل الله منك" : "Khatma complete! May Allah accept it");
  }
  function resetKhatma() { kh = { page: 0, day: dayKey(now()), today: 0 }; store.set("phone.khatma", kh); redraw("khatma"); }
  function moonSvg(m) {
    const r = 46, k = m.lit, rx = Math.abs(2 * k - 1) * r;
    const lit = k < 0.01 ? "" : k > 0.99 ? `<circle cx="50" cy="50" r="${r}" fill="url(#mlit)"/>` :
      `<path d="M50 ${50 - r} A${r} ${r} 0 0 1 50 ${50 + r} A${rx.toFixed(1)} ${r} 0 0 ${k > 0.5 ? 1 : 0} 50 ${50 - r}Z" fill="url(#mlit)"${m.waxing ? "" : ' transform="translate(100 0) scale(-1 1)"'}/>`;
    return `<svg class="mn-svg" viewBox="0 0 100 100"><defs><radialGradient id="mlit" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#FFF6DD"/><stop offset="1" stop-color="#E2C27E"/></radialGradient></defs>` +
      `<circle cx="50" cy="50" r="${r}" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/>${lit}</svg>`;
  }
  const MOON_NAMES = [["New Moon", "محاق"], ["Waxing Crescent", "هلال"], ["First Quarter", "تربيع أول"], ["Waxing Gibbous", "أحدب متزايد"],
    ["Full Moon", "بدر"], ["Waning Gibbous", "أحدب متناقص"], ["Last Quarter", "تربيع ثانٍ"], ["Waning Crescent", "هلال متناقص"]];
  // Other apps' widgets: their last picture, shown whenever the real widget is hidden.
  const awShots = {};
  const ring = (pct, cls) => `<svg class="ring-svg ${cls || ""}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="trk"/><circle cx="50" cy="50" r="44" class="val${pct <= 0.004 ? " zero" : ""}" pathLength="100" stroke-dasharray="${(pct * 100).toFixed(1)} 100"/></svg>`;
  const mounted = new Set();
  function mountWidget(card, it) { mounted.add(card); drawWidget(card); }
  function unmountWidget(el) { el.querySelectorAll(".wcard").forEach((c) => mounted.delete(c)); }
  function drawAll() { for (const c of mounted) if (c.isConnected) drawWidget(c); else mounted.delete(c); }
  const dateFmt = () => new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-GB", { weekday: "long", day: "numeric", month: "long" });
  let hijriFmt;
  try { hijriFmt = new Intl.DateTimeFormat("ar-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "long", year: "numeric" }); } catch (e) {}
  const PRAYER_AR = { fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء" };
  const PIN_ICONS = {
    home: ["#5AA9FF", "#2F7BE0", '<path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/>'],
    work: ["#A58BFF", "#6F55E0", '<path d="M9 4h6a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V6a2 2 0 0 1 2-2zm0 3h6V6H9z"/>'],
    mosque: ["#3FC48A", "#1F8F5E", '<path d="M12 2.5c.3 1.6 1.3 2.6 2.6 3.4C16.4 7 17.5 8.5 17.5 10.5V11h-11v-.5c0-2 1.1-3.5 2.9-4.6 1.3-.8 2.3-1.8 2.6-3.4zM5 12.5h14V21h-4.5v-4a2.5 2.5 0 0 0-5 0v4H5zM2 9.5a1 1 0 0 1 2 0V21H2zm18 0a1 1 0 0 1 2 0V21h-2z"/>'],
    fuel: ["#FF9F5A", "#E06A2F", '<path d="M5 3h9a1 1 0 0 1 1 1v8h1.5a2.5 2.5 0 0 1 2.5 2.5V18a1 1 0 0 0 2 0V9.4l-2.7-2.7 1.4-1.4L22.6 9c.3.3.4.6.4 1v8a3 3 0 0 1-6 0v-3.5a.5.5 0 0 0-.5-.5H15v6h1v2H3v-2h1V4a1 1 0 0 1 1-1zm1 2v5h7V5z"/>'],
  };
  function drawWidget(card) {
    const k = card.dataset.k, s = card.dataset.s, t = now();
    if (!today) return;
    // Text is sized to fit, which needs the card on screen: not yet, then right after.
    if (!card.isConnected) return requestAnimationFrame(() => card.isConnected && drawWidget(card));
    if (k === "clock") {
      const next = D.nextPrayer(t, today, tomorrow);
      card.innerHTML = `<div class="w-fill"><div class="w-time">${D.hm(t)}<small>${ampm(t)}</small></div>` +
        `<div class="w-date">${escapeHtml(dateFmt().format(t))}</div><div class="w-hijri">${hijriFmt ? hijriFmt.format(t) : ""}</div></div>` +
        (s === "m" ? `<div class="w-row"><span class="w-label">${escapeHtml(C.city || "")}</span><span class="w-gold">${escapeHtml(T("next", lang === "ar" ? PRAYER_AR[next.key] : next.name, next.minutes))}</span></div>` : "");
    } else if (k === "prayer") {
      const next = D.nextPrayer(t, today, tomorrow);
      const name = (k2, en) => (lang === "ar" ? PRAYER_AR[k2] : en);
      const head = `<div class="w-row"><span class="w-label">${escapeHtml(T("prayerTimes", C.city))}</span><span class="w-gold">${escapeHtml(T("next", name(next.key, next.name), next.minutes))}</span></div>`;
      if (s === "m") {
        // How far we are from the last prayer to the next one.
        const order = D.PRAYERS.filter(([k2]) => k2 !== "sunrise").map(([k2]) => k2);
        const ni = order.indexOf(next.key);
        const prev = ni > 0 ? today[order[ni - 1]] : new Date(+today.isha - (next.time > today.isha ? 0 : 86400000));
        const pct = Math.max(0, Math.min(1, (t - prev) / (next.time - prev)));
        card.innerHTML = head + `<div class="w-fill"><div class="w-big">${escapeHtml(name(next.key, next.name))} <span style="color:var(--gold-soft)">${D.hm(next.time)}</span> <span class="w-sub" style="display:inline">${ampm(next.time)}</span></div>` +
          `<div class="pr-bar"><i style="width:${(pct * 100).toFixed(1)}%"></i></div></div>` +
          `<div class="pr-row">${D.PRAYERS.filter(([k2]) => k2 !== "sunrise").map(([k2, en]) => `<div class="${k2 === next.key ? "next" : ""}">${escapeHtml(name(k2, en))}<b>${D.hm(today[k2])}</b></div>`).join("")}</div>`;
      } else {
        card.innerHTML = head + `<ol class="pr-list">${D.PRAYERS.map(([k2, en, ar]) => `<li class="${k2 === next.key ? "next" : today[k2] <= t ? "past" : ""}"><span class="en">${en}</span><span class="ar">${ar}</span><span class="tm">${D.hm(today[k2])} <small>${ampm(today[k2])}</small></span></li>`).join("")}</ol>`;
      }
    } else if (k === "azkar") {
      const set = AZKAR[azPeriod(t)], item = set.items[azIndex % set.items.length];
      card.innerHTML = `<div class="az-head"><span class="t">${set.title}</span><span class="c">${(azIndex % set.items.length) + 1} / ${set.items.length}</span></div><div class="az-text" dir="rtl"></div>`;
      const body = card.querySelector(".az-text");
      body.textContent = item.t;
      fitText(body, Math.round(Math.min(card.clientHeight * (s === "l" ? 0.09 : 0.15), 34)), 12);
    } else if (k === "qibla") {
      card.innerHTML = `<div class="w-row"><span class="w-label">${escapeHtml(T("wQibla"))}</span><span class="w-gold">${Math.round(qiblaBearing())}°</span></div><div class="qb-mini"><div class="ring"><div class="arrow"></div></div></div>`;
      updateQiblaWidgets();
    } else if (k === "places") {
      card.innerHTML = `<div class="places">${["home", "work", "mosque", "fuel"].map((f) => { const [a, b, path] = PIN_ICONS[f]; return `<button class="place" data-f="${f}"><i style="background:linear-gradient(180deg,${a},${b})"><svg viewBox="0 0 24 24" fill="#fff">${path}</svg></i>${escapeHtml(T(f))}</button>`; }).join("")}</div>`;
    } else if (k === "weather") {
      const w = local.get("weather");
      if (!w) { card.innerHTML = `<div class="w-label">${escapeHtml(T("wWeather"))}</div><div class="wx-temp">--°</div>`; return; }
      const c = w.data.current, dd = w.data.daily;
      card.innerHTML = `<div class="w-row"><span class="w-label">${escapeHtml(C.city || T("wWeather"))}</span><span class="w-label">${escapeHtml(D.WMO[c.weather_code] || "")}</span></div>` +
        `<div class="wx-now">${D.weatherIcon(c.weather_code, c.is_day === 1)}<span class="wx-temp">${Math.round(c.temperature_2m)}°</span></div>` +
        (s === "m" ? `<div class="wx-days">${dd.time.map((d, i) => `<div><span>${D.dayName(d, i)}</span>${D.weatherIcon(dd.weather_code[i])}${Math.round(dd.temperature_2m_max[i])}°</div>`).join("")}</div>` : "");
    } else drawIslamic(card, k, s, t);
  }
  function drawIslamic(card, k, s, t) {
    const h = I.hijri(t);
    if (k === "logo") {
      const hij = hijriFmt ? `<div class="lg-hijri">${hijriFmt.format(t)}</div>` : "";
      card.innerHTML = `<div class="lg"><div class="lg-mark">${D.logoHtml(C.logoText || "M&D")}</div>` +
        (s === "w" ? "" : `<div class="lg-salam">السَّلَامُ عَلَيْكُمْ</div>`) + hij + `</div>`;
    } else if (k === "hijri") {
      const months = ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
      const en = ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul-Qa'dah", "Dhul-Hijjah"];
      if (!h) { card.innerHTML = `<div class="w-label">${escapeHtml(T("wHijri"))}</div>`; return; }
      const big = `<div class="hj-day"><b>${h.d}</b><div><div class="hj-month">${months[h.m - 1]}</div><div class="w-sub">${lang === "ar" ? `${h.y} هـ` : `${en[h.m - 1]} ${h.y} AH`}</div></div></div>`;
      const ups = I.upcoming(t).slice(0, s === "m" ? 3 : 1);
      card.innerHTML = `<div class="w-label">${escapeHtml(dateFmt().format(t))}</div><div class="w-fill">${big}</div>` +
        `<div class="hj-ups">${ups.map((o) => `<div><span>${escapeHtml(lang === "ar" ? o.ar : o.en)}</span><b>${escapeHtml(o.days ? T("inDays", o.days) : T("today"))}</b></div>`).join("")}</div>`;
    } else if (k === "countdown") {
      const next = D.nextPrayer(t, today, tomorrow);
      const order = D.PRAYERS.filter(([k2]) => k2 !== "sunrise").map(([k2]) => k2);
      const ni = order.indexOf(next.key);
      const prev = ni > 0 ? today[order[ni - 1]] : new Date(+today.isha - (next.time > today.isha ? 0 : 86400000));
      const pct = Math.max(0, Math.min(1, (t - prev) / (next.time - prev)));
      const hh = Math.floor(next.minutes / 60), mm = next.minutes % 60;
      const name = lang === "ar" ? PRAYER_AR[next.key] : next.name;
      const center = `<div class="cd-in"><div class="cd-left">${hh ? hh + ":" + String(mm).padStart(2, "0") : mm + (lang === "ar" ? " د" : "m")}</div><div class="cd-name">${escapeHtml(name)}</div></div>`;
      card.innerHTML = `<div class="cd ${s}"><div class="cd-ring">${ring(pct)}${center}</div>` +
        (s === "m" ? `<div class="cd-side"><div class="w-label">${escapeHtml(T("wCount"))}</div><div class="w-big">${escapeHtml(name)}</div><div class="w-gold">${D.hm(next.time)} ${ampm(next.time)}</div><div class="w-sub">${escapeHtml(C.city || "")}</div></div>` : "") + `</div>`;
    } else if (k === "tasbih") {
      const key = t.toDateString();
      if (tas.day !== key) tas = { n: 0, total: 0, day: key };
      let n = tas.n, i = 0;
      while (i < 2 && n >= I.TASBIH[i].n) { n -= I.TASBIH[i].n; i++; }
      const z = I.TASBIH[i];
      card.innerHTML = `<div class="tb ${s}"><div class="tb-ring">${ring(n / z.n, "gold")}<div class="tb-in"><b>${n}</b><span>/ ${z.n}</span></div></div>` +
        `<div class="tb-side"><div class="tb-zikr">${z.a}</div>${s === "m" ? `<div class="w-sub">${z.t}</div><div class="tb-dots">${I.TASBIH.map((x, j) => `<i class="${j < i ? "done" : j === i ? "on" : ""}"></i>`).join("")}</div>` : ""}` +
        `<div class="tb-total">${lang === "ar" ? `اليوم: ${tas.total}` : `Today: ${tas.total}`}</div></div></div>`;
    } else if (k === "ayah") {
      const v = I.AYAT[(dayNo(t) + ayahShift) % I.AYAT.length];
      card.innerHTML = `<div class="az-head"><span class="t">${lang === "ar" ? "آية اليوم" : ""}</span><span class="c">${lang === "ar" ? "" : escapeHtml(T("wAyah"))}</span></div>` +
        `<div class="ay-text" dir="rtl">﴿${v.a}﴾</div>` + (s === "l" || lang !== "ar" ? `<div class="ay-mean">${escapeHtml(v.m)}</div>` : "") + `<div class="ay-ref">${v.r}</div>`;
      const body = card.querySelector(".ay-text");
      fitText(body, Math.round(Math.min(card.clientHeight * (s === "l" ? 0.11 : 0.17), 40)), 12);
    } else if (k === "names") {
      const i = (dayNo(t) + nameShift) % I.NAMES.length, n = I.NAMES[i];
      card.innerHTML = `<div class="w-row"><span class="w-label">${escapeHtml(T("wNames"))}</span><span class="w-label">${i + 1} / 99</span></div>` +
        `<div class="w-fill nm"><div class="nm-ar">${n.a}</div>${s === "m" ? `<div class="nm-t">${escapeHtml(n.t)}</div>` : ""}<div class="nm-m">${escapeHtml(n.m)}</div></div>`;
    } else if (k === "sunnah") {
      let list = I.reminders(t, today, tomorrow);
      // A large card also shows the coming occasions.
      if (s === "l") list = list.concat(I.upcoming(t).map((o) => [`${o.ar} · ${o.days ? STR.ar.inDays(o.days) : "اليوم"}`, `${o.en} ${o.days ? (o.days === 1 ? "tomorrow" : `in ${o.days} days`) : "today"}`]));
      list = list.slice(0, s === "l" ? 7 : 3);
      card.innerHTML = `<div class="w-row"><span class="w-label">${escapeHtml(T("wSunnah"))}</span><span class="w-gold">${hijriFmt ? hijriFmt.format(t) : ""}</span></div>` +
        `<ul class="sn">${list.map(([ar, en]) => `<li><i></i><div><div class="sn-ar" dir="rtl">${ar}</div>${lang === "ar" ? "" : `<div class="sn-en">${escapeHtml(en)}</div>`}</div></li>`).join("")}</ul>`;
    } else if (k === "dua" || k === "hadith") {
      const list = k === "dua" ? I.DUAS : I.HADITH, v = list[(dayNo(t) + (k === "dua" ? duaShift : hadithShift)) % list.length];
      card.innerHTML = `<div class="w-row"><span class="w-label">${escapeHtml(T(k === "dua" ? "wDua" : "wHadith"))}</span><span class="w-label gold-l">${v.r}</span></div>` +
        `<div class="ay-text" dir="rtl">${k === "hadith" ? "«" + v.a + "»" : v.a}</div>` + (s === "l" || lang !== "ar" ? `<div class="ay-mean">${escapeHtml(v.m)}</div>` : "");
      fitText(card.querySelector(".ay-text"), Math.round(Math.min(card.clientHeight * (s === "l" ? 0.12 : 0.17), 48)), 12);
    } else if (k === "tracker") {
      const done = track[dayKey(t)] || [], st = trackStreak(t);
      const keys = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
      card.innerHTML = (s === "w" ? "" : `<div class="w-row"><span class="w-label">${escapeHtml(T("wTracker"))}</span><span class="w-gold">${done.length} / 5</span></div>`) +
        `<div class="pt">${keys.map((k2) => { const due = today[k2] <= t, on = done.includes(k2);
          return `<button class="pt-p${on ? " on" : due ? " due" : ""}" data-p="${k2}"><i>${on ? "✓" : ""}</i><span>${escapeHtml(lang === "ar" ? PRAYER_AR[k2] : D.PRAYERS.find((x) => x[0] === k2)[1])}</span></button>`; }).join("")}</div>` +
        (s === "w" ? "" : `<div class="pt-streak">${st ? "🔥 " + escapeHtml(T("streak", st)) : escapeHtml(dateFmt().format(t))}</div>`);
    } else if (k === "khatma") {
      if (kh.day !== dayKey(t)) { kh.day = dayKey(t); kh.today = 0; }
      const pct = kh.page / 604;
      card.innerHTML = `<div class="tb ${s}"><div class="tb-ring">${ring(pct, "gold")}<div class="tb-in"><b>${Math.round(pct * 100)}<small>%</small></b><span>${escapeHtml(T("juzN", juzOf(Math.max(1, kh.page))))}</span></div></div>` +
        `<div class="tb-side"><div class="tb-zikr kh-t">${escapeHtml(T("wKhatma"))}</div>` +
        (s === "m" ? `<div class="w-sub">${escapeHtml(T("pageOf", kh.page))}</div><div class="w-sub">${escapeHtml(T("todayPages", kh.today))}</div><div class="kh-b"><button data-n="1">${T("plusPage")}</button><button data-n="20">${T("plusJuz")}</button></div>` : "") + `</div></div>`;
    } else if (k === "fasting") {
      const iftarNow = t >= today.fajr && t < today.maghrib;
      const target = iftarNow ? today.maghrib : t < today.fajr ? today.fajr : tomorrow.fajr;
      const from = iftarNow ? today.fajr : t < today.fajr ? new Date(+today.maghrib - 86400000) : today.maghrib;
      const mins = Math.max(0, Math.ceil((target - t) / 60000)), hh = Math.floor(mins / 60), mm = mins % 60;
      const label = T(iftarNow ? "iftar" : "suhoor"), sTime = iftarNow ? tomorrow.fajr : target;
      card.innerHTML = `<div class="cd ${s}"><div class="cd-ring">${ring(Math.max(0, Math.min(1, (t - from) / (target - from))))}<div class="cd-in"><div class="cd-left">${hh ? hh + ":" + String(mm).padStart(2, "0") : mm + (lang === "ar" ? " د" : "m")}</div><div class="cd-name">${escapeHtml(label)}</div></div></div>` +
        (s === "m" ? `<div class="cd-side"><div class="w-label">${escapeHtml(T("wFast"))}</div><div class="fs-row${iftarNow ? " on" : ""}"><span>${escapeHtml(T("iftar"))}</span><b>${D.hm(today.maghrib)} ${ampm(today.maghrib)}</b></div>` +
          `<div class="fs-row${iftarNow ? "" : " on"}"><span>${escapeHtml(T("suhoor"))}</span><b>${D.hm(sTime)} ${ampm(sTime)}</b></div></div>` : "") + `</div>`;
    } else if (k === "moon") {
      const m = I.moon(t), n = MOON_NAMES[Math.round(m.age / 29.530588853 * 8) % 8];
      card.innerHTML = `<div class="mn ${s}">${moonSvg(m)}<div class="mn-side"><div class="mn-name">${escapeHtml(lang === "ar" ? n[1] : n[0])}</div>` +
        `<div class="w-sub">${h ? (lang === "ar" ? `${h.d} من الشهر الهجري` : `Hijri day ${h.d}`) : ""}</div>` + (s === "m" ? `<div class="w-sub">${Math.round(m.lit * 100)}% ${lang === "ar" ? "مضاء" : "lit"}</div>` : "") + `</div></div>`;
    } else if (k === "app") {
      const it = itemByWid(+card.dataset.wid), shot = awShots[card.dataset.wid];
      const v = shot ? "shot:" + shot.length : "ph";
      if (card.dataset.v === v) return;
      card.dataset.v = v;
      const a = it && byPkg[it.pkg];
      card.innerHTML = shot ? `<img class="aw-shot" src="${shot}" alt="">` :
        `<div class="aw-ph">${a && a.icon ? `<img src="${a.icon}" alt="">` : ""}<span>${escapeHtml(it ? it.label : "")}</span></div>`;
    }
  }
  function itemByWid(wid) {
    for (const pg of L.pages) for (const it of pg) if (it.k === "app" && it.wid === wid) return it;
    return null;
  }
  function redraw(k) { for (const c of mounted) if (c.dataset.k === k) drawWidget(c); }
  function resetTasbih() { tas = { n: 0, total: 0, day: now().toDateString() }; store.set("phone.tasbih", tas); redraw("tasbih"); }
  function fitText(el, max, min) {
    let size = max;
    el.style.fontSize = size + "px";
    while (size > min && el.scrollHeight > el.clientHeight + 1) { size -= 1; el.style.fontSize = size + "px"; }
  }
  function widgetTap(el, it) {
    if (it.k === "azkar") { azIndex++; azChanged(); }
    else if (it.k === "tasbih") {
      tas.n = (tas.n + 1) % 100; tas.total++;
      store.set("phone.tasbih", tas);
      redraw("tasbih");
      try { navigator.vibrate && navigator.vibrate(tas.n === 0 || tas.n === 33 || tas.n === 66 ? [30, 60, 30] : 12); } catch (e) {}
    }
    else if (it.k === "ayah") { ayahShift++; redraw("ayah"); }
    else if (it.k === "dua") { duaShift++; redraw("dua"); }
    else if (it.k === "hadith") { hadithShift++; redraw("hadith"); }
    else if (it.k === "tracker") { const b = pressTarget && pressTarget.closest(".pt-p"); if (b) toggleTrack(b.dataset.p); }
    else if (it.k === "khatma") { const b = pressTarget && pressTarget.closest(".kh-b button"); addPages(b ? +b.dataset.n : 1); }
    else if (it.k === "names") { nameShift++; redraw("names"); }

    else if (it.k === "qibla") openSheet("qiblaSheet");
    else if (it.k === "places") {
      const b = pressTarget && pressTarget.closest(".place");
      if (b) place(b.dataset.f);
    }
  }
  let pressTarget = null;
  document.addEventListener("pointerdown", (e) => { pressTarget = e.target; }, true);
  function place(f) {
    const near = `${C.latitude},${C.longitude}`;
    const uri = f === "home" ? "google.navigation:q=Home" : f === "work" ? "google.navigation:q=Work"
      : `geo:${near}?q=${encodeURIComponent(f === "mosque" ? "mosque" : "petrol station")}`;
    let ok = false;
    try { ok = TV.openMaps(uri); } catch (e) {}
    if (!ok) toast(T("noMaps"));
  }

  // Azkar: all azkar widgets show the same dhikr, changing every so often (tap one for the next).
  let azIndex = 0, azTimer = null, azLast = null;
  function azPeriod(t) {
    const h = t.getHours(), a = C.azkar;
    return h >= a.morningFrom && h < a.generalFrom ? "morning" : h >= a.generalFrom && h < a.eveningFrom ? "general" : "evening";
  }
  function azChanged() {
    for (const c of mounted) if (c.dataset.k === "azkar") drawWidget(c);
    clearTimeout(azTimer);
    const set = AZKAR[azPeriod(now())], item = set.items[azIndex % set.items.length];
    azTimer = setTimeout(() => { azIndex++; azChanged(); }, Math.min(75, Math.max(14, 6 + item.t.length * 0.09)) * 1000);
  }

  // Widget gallery: every widget in its sizes, shown as it will look; tap Add.
  function openWidgetSheet() {
    const avail = Math.min(M.W - 40, 680);
    const entries = Object.entries(WIDGETS).sort((a, b) => !!b[1].islamic - !!a[1].islamic);
    let lastGroup = null;
    $("widgetList").innerHTML = entries.map(([k, w]) => (lastGroup !== !!w.islamic ? `<div class="wg-group">${T((lastGroup = !!w.islamic) ? "islamic" : "general")}</div>` : "") + `<div class="wg-item"><div class="wg-name">${escapeHtml(T(w.name))}</div><div class="wg-desc">${escapeHtml(T(w.desc))}</div><div class="wg-sizes">` +
      w.sizes.map((s) => {
        const [cw, ch] = SIZES[s], unit = Math.min(M.cellW, (avail - 20) / 4);
        return `<div class="wg-size"><div class="wg-preview" style="width:${cw * unit - 14}px;height:${ch * Math.min(M.cellH, unit * 1.1) - 14}px"><div class="wcard" data-k="${k}" data-s="${s}"></div></div><button class="wg-add" data-k="${k}" data-s="${s}">${T("add")} · ${T({ s: "small", m: "medium", l: "large", w: "wide" }[s])}</button></div>`;
      }).join("") + `</div></div>`).join("");
    $("widgetList").querySelectorAll(".wcard").forEach((c) => drawWidget(c));
    $("widgetSheet").querySelector(".sh-title").textContent = T("widgets");
    $("widgetSheet").dataset.mode = "";
    openSheet("widgetSheet");
  }
  $("widgetList").addEventListener("click", (e) => {
    const b = e.target.closest(".wg-add");
    if (!b || b.classList.contains("aw-add")) return;
    addWidget({ t: "w", id: uid("w"), k: b.dataset.k, s: b.dataset.s });
  });
  // Into the first free place on this page, or at its top if there's none (the rest moves along).
  function addWidget(it) {
    delete it.ov;
    const p = isLibrary() ? homeCount() - 1 : page;
    const spot = freeSpot(it, p);
    if (!spot || !placeAt(it, p, spot[0], spot[1])) L.pages[p].unshift(it);
    closeSheets();
    enterEdit();
    save();
    render();
    goPage(p);
  }

  /* ---------------- other apps' widgets ---------------- */
  // The gallery lists every app widget on the phone with its preview; Add asks Android (and the
  // widget's own setup screen, if it has one), then it lands on the page like any widget.
  let awPending = null;
  function awSize(pv) {
    if (pv.cw && pv.ch) return pv.ch <= 1 ? "w" : pv.cw <= 2 && pv.ch <= 2 ? "s" : pv.ch <= 2 ? "m" : "l";
    return pv.h <= 90 ? "w" : pv.w <= 2 * M.cellW + 10 ? "s" : pv.h <= 2 * M.cellH + 20 ? "m" : "l";
  }
  function openAppWidgetSheet() {
    let list = [];
    try { list = JSON.parse(TV.appWidgetProviders()) || []; } catch (e) {}
    list.sort((a, b) => a.app.localeCompare(b.app) || a.label.localeCompare(b.label));
    let lastApp = null;
    $("widgetList").innerHTML = list.length ? list.map((pv, i) => {
      const head = pv.app !== lastApp ? `<div class="aw-app">${byPkg[pv.pkg] && byPkg[pv.pkg].icon ? `<img src="${byPkg[pv.pkg].icon}" alt="">` : ""}<span>${escapeHtml((lastApp = pv.app))}</span></div>` : "";
      const sz = awSize(pv);
      return head + `<div class="aw-item"><div class="aw-prev" data-i="${i}"></div><div class="aw-info"><div class="wg-name">${escapeHtml(pv.label)}</div>` +
        `<div class="wg-desc">${escapeHtml(T({ s: "small", m: "medium", l: "large", w: "wide" }[sz]))}</div><button class="wg-add aw-add" data-i="${i}">${T("add")}</button></div></div>`;
    }).join("") : `<div class="sp-empty">${T("noAppWidgets")}</div>`;
    $("widgetSheet").querySelector(".sh-title").textContent = T("appWidgets");
    $("widgetSheet").dataset.mode = "apps";
    awList = list;
    openSheet("widgetSheet");
    // Previews load a few at a time, so the sheet opens at once.
    const prevs = [...$("widgetList").querySelectorAll(".aw-prev")];
    let n = 0;
    const next = () => {
      if (openSheetId !== "widgetSheet" || n >= prevs.length) return;
      for (const el of prevs.slice(n, n + 3)) {
        let src = "";
        try { src = TV.appWidgetPreview(awList[+el.dataset.i].prov); } catch (e) {}
        if (src) el.innerHTML = `<img src="${src}" alt="">`;
      }
      n += 3;
      setTimeout(next, 30);
    };
    setTimeout(next, 260);
  }
  let awList = [];
  $("widgetList").addEventListener("click", (e) => {
    const b = e.target.closest(".aw-add");
    if (!b) return;
    const pv = awList[+b.dataset.i];
    awPending = { pv, size: awSize(pv) };
    try { TV.bindAppWidget(pv.prov); } catch (er) {}
  });
  window.onAppWidgetBound = (wid, ok) => {
    const pv = awPending && awPending.pv;
    if (!ok || !pv) { awPending = null; return; }
    const size = awPending.size;
    awPending = null;
    addWidget({ t: "w", id: uid("w"), k: "app", s: size, wid, pkg: pv.pkg, label: pv.label, prov: pv.prov });
  };
  window.onAppWidgetShot = (wid, src) => {
    awShots[wid] = src;
    for (const c of mounted) if (c.dataset.k === "app" && +c.dataset.wid === wid) drawWidget(c);
  };
  // A hold on the real widget: the same menu as any widget.
  window.onAppWidgetHold = (wid) => {
    for (const c of mounted) if (c.dataset.k === "app" && +c.dataset.wid === wid && c.isConnected) {
      const tile = c.closest(".tile");
      if (tile) openMenuFor(tile);
      return;
    }
  };
  // Where the real widgets go: over their cards on the page you're looking at, unless something
  // is moving or covers the page (then they hide and their picture shows).
  let awLast = "", awQuiet = 0, awShown = [];
  function syncAppWidgets() {
    const calm = !paused && !drag && !(press && press.mode) && !isLibrary() && Date.now() > awQuiet &&
      !["editing", "menu-open", "sheet-open", "spot-open", "folder-open", "swiping"].some(has);
    const list = [];
    if (calm) for (const c of mounted) {
      if (c.dataset.k !== "app" || !c.isConnected) continue;
      const pg = c.closest(".home-page");
      if (!pg || homePageIndex(pg) !== page) continue;
      const r = c.getBoundingClientRect();
      if (r.width < 4) continue;
      list.push({ id: +c.dataset.wid, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: 24 });
    }
    const j = JSON.stringify(list);
    if (j === awLast) return;
    awLast = j;
    awShown = list.map((o) => o.id);
    try { TV.placeAppWidgets(j); } catch (e) {}
    for (const id of awShown) setTimeout(() => { try { TV.appWidgetShot(id); } catch (e) {} }, 1500);
  }
  setInterval(syncAppWidgets, 120);
  setInterval(() => { for (const id of awShown) { try { TV.appWidgetShot(id); } catch (e) {} } }, 60000);
  $("editBtn").addEventListener("click", () => showMenu([
    [T("addWidget"), IC.plus, openWidgetSheet],
    [T("addAppWidget"), IC.apps, openAppWidgetSheet],
    [T("customize"), IC.edit, openSettings],
  ], $("editBtn").getBoundingClientRect()));
  $("doneBtn").addEventListener("click", exitEdit);

  /* ---------------- sheets ---------------- */
  let openSheetId = null;
  function openSheet(id) {
    closeSheets();
    openSheetId = id;
    $(id).classList.add("open");
    document.body.classList.add("sheet-open");
    if (id === "qiblaSheet") startCompass();
  }
  function closeSheets() {
    if (!openSheetId) return;
    $(openSheetId).classList.remove("open");
    document.body.classList.remove("sheet-open");
    if (openSheetId === "qiblaSheet") stopCompass();
    openSheetId = null;
  }
  $("sheetScrim").addEventListener("click", closeSheets);
  // Drag a sheet down by its top to close it.
  document.querySelectorAll(".sheet").forEach((sh) => {
    let y0 = null;
    sh.addEventListener("pointerdown", (e) => { if (e.target.closest(".grabber, .sh-title")) y0 = e.clientY; });
    sh.addEventListener("pointermove", (e) => { if (y0 != null) sh.style.transform = `translateY(${Math.max(0, e.clientY - y0)}px)`; });
    const up = (e) => { if (y0 == null) return; const dy = e.clientY - y0; y0 = null; sh.style.transform = ""; if (dy > 90) closeSheets(); };
    sh.addEventListener("pointerup", up);
    sh.addEventListener("pointercancel", up);
  });

  function openSettings() {
    const alertsOn = C.prayerAlert.enabled, isHome = defaultHome(), newApps = store.get("phone.newApps", "abc");
    $("settingsList").innerHTML =
      `<div class="set-row"><div><div class="set-name">${T("homeApp")}</div><div class="set-sub">${T(isHome ? "homeAppOn" : "homeAppOff")}</div></div>` +
      (isHome ? `<div class="set-ok">✓</div>` : `<button class="set-btn" id="setHomeRow">${T("setBtn")}</button>`) + `</div>` +
      `<div class="set-row"><div><div class="set-name">${T("language")}</div></div><div class="seg" id="segLang"><button data-v="en" class="${lang === "en" ? "on" : ""}">English</button><button data-v="ar" class="${lang === "ar" ? "on" : ""}">العربية</button></div></div>` +
      `<div class="set-row"><div><div class="set-name">${T("alerts")}</div><div class="set-sub">${T("alertsSub")}</div></div><div class="seg" id="segAlerts"><button data-v="1" class="${alertsOn ? "on" : ""}">${T("on")}</button><button data-v="0" class="${alertsOn ? "" : "on"}">${T("off")}</button></div></div>` +
      `<div class="set-row col"><div><div class="set-name">${T("arrange")}</div><div class="set-sub">${T("arrangeSub")}</div></div><div class="set-btns" id="rowArrange"><button class="set-btn" data-m="abc">${T("byName")}</button><button class="set-btn" data-m="use">${T("byUse")}</button><button class="set-btn" data-m="new">${T("byNew")}</button>${undoL ? `<button class="set-btn ghost" data-m="undo">${T("undo")}</button>` : ""}</div></div>` +
      `<div class="set-row col"><div><div class="set-name">${T("newApps")}</div><div class="set-sub">${T("newAppsSub")}</div></div><div class="seg" id="segNew"><button data-v="abc" class="${newApps === "abc" ? "on" : ""}">${T("inOrder")}</button><button data-v="end" class="${newApps === "end" ? "on" : ""}">${T("atEnd")}</button></div></div>` +
      (window.MKUpdate ? `<div class="set-row"><div><div class="set-name">${T("updates")}</div><div class="set-sub">${T("updatesSub", window.MKUpdate.version)}</div></div><button class="set-btn" id="rowUpdate">${T("checkNow")}</button></div>` : "") +
      `<div class="set-row col"><div><div class="set-name">${T("backup")}</div><div class="set-sub">${T("backupSub")}</div></div><div class="set-btns" id="rowBackup"><button class="set-btn" data-b="save">${T("backupNow")}</button><button class="set-btn ghost" data-b="load">${T("restore")}</button></div></div>`;
    if ($("rowUpdate")) $("rowUpdate").addEventListener("click", () => { closeSheets(); window.MKUpdate.check(); });
    $("rowArrange").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.m === "undo") {
        if (undoL) { L = undoL.L; save(); render(); goPage(undoL.page, false); undoL = null; toast(T("undone")); }
      } else { arrange(b.dataset.m); toast(T("arranged")); }
      openSettings();
    });
    $("segNew").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { store.set("phone.newApps", b.dataset.v); openSettings(); } });
    $("rowBackup").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.b === "save") writeBackup(true);
      else { try { TV.restoreLayout(); } catch (er) {} }
    });
    if ($("setHomeRow")) $("setHomeRow").addEventListener("click", () => { closeSheets(); askHome(); });
    $("segLang").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { lang = b.dataset.v; store.set("phone.lang", lang); applyLang(); openSettings(); } });
    $("segAlerts").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      C.prayerAlert.enabled = b.dataset.v === "1";
      store.set("phone.alerts", C.prayerAlert.enabled);
      lastDay = -1; tick(); openSettings();
    });
    if (openSheetId !== "settingsSheet") openSheet("settingsSheet");
  }


  /* ---------------- Qibla ---------------- */
  const KAABA = [21.4225, 39.8262], rad = Math.PI / 180;
  function qiblaBearing() {
    const f1 = C.latitude * rad, f2 = KAABA[0] * rad, dl = (KAABA[1] - C.longitude) * rad;
    return (Math.atan2(Math.sin(dl), Math.cos(f1) * Math.tan(f2) - Math.sin(f1) * Math.cos(dl)) / rad + 360) % 360;
  }
  function makkahKm() {
    const f1 = C.latitude * rad, f2 = KAABA[0] * rad, df = f2 - f1, dl = (KAABA[1] - C.longitude) * rad;
    const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
  let heading = null, headingAt = 0, roseAngle = 0, compassOn = false;
  function onOrientation(e) {
    if (e.alpha == null || (e.type === "deviceorientation" && !e.absolute && e.webkitCompassHeading == null)) return;
    heading = e.webkitCompassHeading != null ? e.webkitCompassHeading : (360 - e.alpha) % 360;
    headingAt = Date.now();
    if (openSheetId === "qiblaSheet") drawCompass();
    updateQiblaWidgets();
  }
  function listenOrientation(on) {
    if (on === compassOn) return;
    compassOn = on;
    for (const ev of ["deviceorientationabsolute", "deviceorientation"]) (on ? addEventListener : removeEventListener)(ev, onOrientation);
  }
  function startCompass() {
    if (!$("qbTicks").childElementCount) {
      let t = "";
      for (let a = 0; a < 360; a += 10) t += `<line x1="100" y1="${a % 90 ? 12 : 10}" x2="100" y2="${a % 90 ? 18 : 22}" transform="rotate(${a} 100 100)"/>`;
      $("qbTicks").innerHTML = t;
    }
    listenOrientation(true);
    drawCompass();
  }
  function stopCompass() { updateQiblaWidgets(); }
  const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  function drawCompass() {
    const q = qiblaBearing(), h = Date.now() - headingAt < 2000 ? heading : null;
    const target = h == null ? 0 : -h;
    roseAngle += ((target - roseAngle) % 360 + 540) % 360 - 180;
    $("qbRose").style.transform = `rotate(${roseAngle.toFixed(1)}deg)`;
    $("qbKaaba").setAttribute("transform", `rotate(${q.toFixed(1)} 100 100)`);
    if (h == null) { $("qbMain").textContent = T("fromNorth", Math.round(q), COMPASS[Math.round(q / 45) % 8]); $("qbSub").textContent = T("holdFlat"); return; }
    const d = Math.round(((q - h) % 360 + 540) % 360 - 180);
    $("qbMain").textContent = Math.abs(d) <= 8 ? T("ahead") : Math.abs(d) >= 165 ? T("behind") : d > 0 ? T("turnRight", d) : T("turnLeft", -d);
    $("qbSub").textContent = T("makkah", makkahKm().toLocaleString("en"));
  }
  // Small Qibla widgets turn with the phone while their page is on screen.
  function updateQiblaWidgets() {
    let visible = false;
    for (const c of mounted) {
      if (c.dataset.k !== "qibla" || !c.isConnected) continue;
      const pg = c.closest(".home-page");
      if (pg && [...$("track").children].indexOf(pg) === page) visible = true;
      const arrow = c.querySelector(".arrow");
      if (arrow) arrow.style.transform = `rotate(${(qiblaBearing() - (Date.now() - headingAt < 2000 ? heading : 0)).toFixed(1)}deg)`;
    }
    listenOrientation(visible || openSheetId === "qiblaSheet");
  }

  /* ---------------- prayer times, banner, location ---------------- */
  let today = null, tomorrow = null, lastDay = -1, lastMinute = -1;
  const now = () => new Date(Date.now() + (C.previewShiftMinutes || 0) * 60000);
  function tick() {
    const t = now();
    if (t.getDate() !== lastDay) {
      lastDay = t.getDate();
      today = prayerTimes(t, C);
      const n = new Date(t); n.setDate(n.getDate() + 1);
      tomorrow = prayerTimes(n, C);
      scheduleAlerts(t);
      lastMinute = -1;
    }
    if (t.getMinutes() === lastMinute) return;
    lastMinute = t.getMinutes();
    drawAll();
    renderAlert(t);
    if (azLast !== azPeriod(t)) { azLast = azPeriod(t); azIndex = 0; azChanged(); }
  }
  const MOSQUE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5c.3 1.6 1.3 2.6 2.6 3.4C16.4 7 17.5 8.5 17.5 10.5V11h-11v-.5c0-2 1.1-3.5 2.9-4.6 1.3-.8 2.3-1.8 2.6-3.4zM5 12.5h14V21h-4.5v-4a2.5 2.5 0 0 0-5 0v4H5zM2 9.5a1 1 0 0 1 2 0V21H2zm18 0a1 1 0 0 1 2 0V21h-2z"/></svg>';
  const arMinutes = (n) => (n === 1 ? "دقيقة واحدة" : n === 2 ? "دقيقتان" : `${D.toArabicDigits(n)} ${n <= 10 ? "دقائق" : "دقيقة"}`);
  const at2 = (t) => (lang === "ar" ? `الساعة ${D.hm(t)} ${ampm(t)}` : null);
  const soonText = (k, en, m, t) => [`باقٍ ${arMinutes(m)} على صلاة ${PRAYER_AR[k]}`, at2(t) || `${en} in ${m} minute${m === 1 ? "" : "s"} · ${D.hm(t)} ${D.ampm(t)}`];
  const nowText = (k, en, t) => [`حان الآن موعد صلاة ${PRAYER_AR[k]}`, at2(t) || `It's time for ${en} prayer · ${D.hm(t)} ${D.ampm(t)}`];
  let alertKey = "";
  function renderAlert(t) {
    const pa = C.prayerAlert, el = $("alert");
    let lines = null, mode = "", key = "";
    for (const [k, en] of D.PRAYERS) {
      if (k === "sunrise") continue;
      const at = today[k], diff = at - t;
      if (diff > 0 && diff <= pa.minutesBefore * 60000) { const m = Math.ceil(diff / 60000); lines = soonText(k, en, m, at); mode = "soon"; key = k + m; }
      else if (diff <= 0 && -diff < pa.minutesAfter * 60000) { lines = nowText(k, en, at); mode = "now"; key = k + "now"; }
    }
    if (!pa.enabled || !lines) { el.hidden = true; alertKey = ""; return; }
    if (key === alertKey) return;
    alertKey = key;
    el.classList.toggle("now", mode === "now");
    el.innerHTML = `<div class="al-icon">${MOSQUE}</div><div class="al-text"><div class="al-ar" dir="rtl">${lines[0]}</div><div class="al-en">${lines[1]}</div></div>`;
    el.hidden = false;
  }
  $("alert").addEventListener("click", () => { $("alert").hidden = true; });
  function scheduleAlerts(t) {
    const pa = C.prayerAlert;
    if (!pa.enabled) { try { TV.schedulePrayerAlerts("[]"); } catch (e) {} return; }
    const list = [];
    for (const day of [today, tomorrow]) for (const [k, en] of D.PRAYERS) {
      if (k === "sunrise") continue;
      const at = day[k], soon = soonText(k, en, pa.minutesBefore, at), nw = nowText(k, en, at);
      list.push({ at: +at - pa.minutesBefore * 60000, title: soon[0], text: soon[1], minutes: pa.minutesBefore });
      list.push({ at: +at, title: nw[0], text: nw[1], minutes: pa.minutesAfter });
    }
    try { TV.schedulePrayerAlerts(JSON.stringify(list.filter((a) => a.at > +t))); } catch (e) {}
  }
  function checkLocation() {
    if (C.location !== "gps") return;
    let loc = null;
    try { loc = JSON.parse(TV.carLocation()); } catch (e) {}
    if (loc && window.applyCarLocation(C, loc)) { lastDay = -1; tick(); refreshWeather(true); }
  }
  async function loadWeather() {
    try {
      const r = await fetch(D.weatherUrl(C), { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      local.set("weather", { at: Date.now(), data: await r.json() });
      for (const c of mounted) if (c.dataset.k === "weather") drawWidget(c);
    } catch (e) {}
  }
  function refreshWeather(force) {
    const w = local.get("weather");
    if (force || !w || Date.now() - w.at > C.weatherMinutes * 60000) loadWeather();
  }

  /* ---------------- default Home app ---------------- */
  // Until it's the Home app, ask: when the launcher opens, and again a day after "Not now".
  function defaultHome() { try { return TV.isDefaultHome(); } catch (e) { return true; } }
  function askHome() { try { TV.requestDefaultHome(); } catch (e) {} }
  function checkHome(force) {
    if (defaultHome()) { if (openSheetId === "homeSheet") closeSheets(); return; }
    if (!force && Date.now() - store.get("phone.homeSnooze", 0) < 86400000) return;
    if (openSheetId || has("editing") || has("spot-open") || openF) return;
    $("homeLogo").innerHTML = D.logoHtml(C.logoText || "M&D");
    openSheet("homeSheet");
  }
  $("restoreYes").addEventListener("click", () => { closeSheets(); try { TV.restoreLayout(); } catch (e) {} });
  $("restoreNo").addEventListener("click", () => { closeSheets(); setTimeout(() => checkHome(true), 400); });
  $("homeSet").addEventListener("click", () => { closeSheets(); askHome(); });
  $("homeLater").addEventListener("click", () => { store.set("phone.homeSnooze", Date.now()); closeSheets(); });

  /* ---------------- toast ---------------- */
  let toastT = null;
  function toast(text) { const el = $("toast"); el.textContent = text; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3000); }

  /* ---------------- language ---------------- */
  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.classList.toggle("rtl", lang === "ar");
    document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = T(el.dataset.t); });
    if ($("libSearch")) $("libSearch").placeholder = T("search");
    lastDay = -1; alertKey = "";
    tick();
    drawAll();
  }

  /* ---------------- relayout: fold, unfold, turn, system bars ---------------- */
  let relayoutT = null;
  function relayout() {
    clearTimeout(relayoutT);
    relayoutT = setTimeout(() => {
      readInsets();
      measure();
      $("track").classList.remove("glide");
      els.forEach((el) => el.classList.add("no-anim"));
      render();
      $("track").offsetWidth;
      els.forEach((el) => el.classList.remove("no-anim"));
      if (openF) renderFolder();
      drawAll();
    }, 60);
  }
  addEventListener("resize", relayout);
  window.onInsets = relayout;

  /* ---------------- system buttons ---------------- */
  let paused = false;
  window.onTvPause = () => { paused = true; listenOrientation(false); clearTimeout(azTimer); };
  window.onTvResume = () => {
    if (!paused) return;
    paused = false;
    let stamp = appsStamp;
    try { stamp = TV.appsStamp(); } catch (e) {}
    if (stamp !== appsStamp) { loadApps(); reconcile(); save(); render(); }
    checkLocation();
    lastMinute = -1;
    tick();
    azChanged();
    refreshWeather(false);
    updateQiblaWidgets();
    setTimeout(() => checkHome(false), 500);
  };
  window.onTvHome = () => {
    closeMenu(); closeSheets();
    if (has("spot-open")) return closeSpot();
    if (openF) return closeFolder();
    if (has("editing")) return exitEdit();
    goPage(0);
  };
  window.onTvBack = () => {
    if (!$("menu").hidden) return closeMenu();
    if (has("spot-open")) return closeSpot();
    if (openSheetId) return closeSheets();
    if (openF) return closeFolder();
    if (has("editing")) return exitEdit();
    if (page !== 0) goPage(0);
  };

  /* ---------------- start ---------------- */
  C.prayerAlert.enabled = store.get("phone.alerts", C.prayerAlert.enabled);
  readInsets();
  measure();
  loadApps();
  removed = new Set(store.get("phone.removed", []));
  const firstRun = !store.get("phone.layout", null);
  L = store.get("phone.layout", null) || defaultLayout();
  // Once: the M&D logo at the top of the first page, for layouts made before it existed.
  if (!store.get("phone.logoAdded", false)) {
    if (!L.pages.some((pg) => pg.some((it) => it.t === "w" && it.k === "logo"))) L.pages[0].unshift({ t: "w", id: uid("w"), k: "logo", s: "w" });
    store.set("phone.logoAdded", true);
  }
  // Once: pages filled before 1.6.1 were filled automatically, so their apps may flow back when unfolded.
  if (!store.get("phone.ovMigrated", false)) {
    L.pages.slice(1).forEach((pg) => pg.forEach((it) => { if (it.t === "a") it.ov = 1; }));
    store.set("phone.ovMigrated", true);
  }
  reconcile();
  save();
  applyLang();
  render();
  tick();
  azChanged();
  setInterval(() => { if (!paused) tick(); }, 1000);
  setInterval(() => { if (!paused) checkLocation(); }, 60000);
  refreshWeather(false);
  setInterval(() => { if (!paused) refreshWeather(false); }, 10 * 60000);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
  // A fresh install: offer to bring back a layout saved by an earlier one; else ask to be the Home app.
  if (firstRun) setTimeout(() => openSheet("restoreSheet"), 700);
  else setTimeout(() => checkHome(true), 900);
})();
