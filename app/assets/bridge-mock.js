// Stand-in for the Android "TV" bridge when previewing in a desktop browser.
(function () {
  if (window.TV) return;
  const banner = (label, bg, fg = "#fff") => "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="${bg}"/><text x="160" y="104" font-family="Helvetica" font-weight="700" font-size="38" fill="${fg}" text-anchor="middle">${label}</text></svg>`);
  let apps = [
    ["com.google.android.youtube.tv", "YouTube", "#FFFFFF", "#FF0033"], ["com.netflix.ninja", "Netflix", "#000", "#E50914"],
    ["com.amazon.amazonvideo.livingroom", "Prime Video", "#0F171E", "#00A8E1"], ["co.learn_quran.tv_mushaf", "Mushaf", "#0E3B2E", "#E2BC74"],
    ["com.digitalseva.iptvplayer", "IPTV", "#1B1B3A"], ["com.google.android.youtube.tvmusic", "YT Music", "#111", "#FF0033"],
    ["com.google.android.videos", "Google TV", "#202124"], ["com.android.vending", "Play Store", "#1F2A2E"],
    ["com.sony.dtv.tvx", "TV", "#101820"], ["com.tcl.browser", "Browser", "#23395B"],
    ["com.lonelycatgames.Xplore", "X-plore", "#2D2D2D", "#F5C66B"], ["com.mushaf.myapp", "Quran", "#163A2F"],
    ["com.sony.dtv.timers", "Timers", "#333"], ["com.mk.homedash", "MK TV & Car Launcher", "#0E2A2B"],
  ].map(([pkg, label, bg, fg]) => ({ pkg, label, banner: true, system: pkg.startsWith("com.sony") || pkg === "com.android.vending", icon: banner(label, bg, fg) }));
  // Car build: square app icons, like the head unit's launcher apps.
  const flavor = /car\.html$/.test(location.pathname) || /flavor=car/.test(location.search) ? "car"
    : /phone\.html$/.test(location.pathname) ? "phone" : "tv";
  if (flavor === "car" || flavor === "phone") {
    const square = (label, bg, fg = "#fff") => "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" fill="${bg}"/><text x="96" y="${label.length > 2 ? 112 : 124}" font-family="Helvetica" font-weight="700" font-size="${label.length > 2 ? 44 : 72}" fill="${fg}" text-anchor="middle">${label}</text></svg>`);
    apps = [
      ["com.google.android.apps.maps", "Maps", "Maps", "#34A853"], ["com.waze", "Waze", "W", "#33CCFF"],
      ["com.spotify.music", "Spotify", "S", "#1DB954", "#000"], ["com.google.android.apps.youtube.music", "YT Music", "▶", "#FF0033"],
      ["com.google.android.dialer", "Phone", "☎", "#34C759"], ["com.google.android.apps.messaging", "Messages", "✉", "#1A73E8"],
      ["com.whatsapp", "WhatsApp", "W", "#25D366"], ["co.learn_quran.mushaf", "Quran", "ق", "#0E3B2E", "#E2BC74"],
      ["com.google.android.apps.podcasts", "Podcasts", "P", "#8E44AD"], ["com.android.chrome", "Chrome", "C", "#FBBC04", "#202124"],
      ["com.android.vending", "Play Store", "▲", "#01875F"], ["com.google.android.youtube", "YouTube", "▶", "#FFFFFF", "#FF0033"],
      ["com.netflix.mediaclient", "Netflix", "N", "#000", "#E50914"], ["com.android.settings", "Settings", "⚙", "#5F6368"],
      ["com.google.android.calendar", "Calendar", "25", "#4285F4"], ["com.android.fmradio", "Radio", "FM", "#C2185B"],
      ["com.audible.application", "Audible", "A", "#F7991C", "#000"], ["com.google.android.apps.photos", "Photos", "✿", "#EA4335"],
      ["com.android.documentsui", "Files", "F", "#1E88E5"], ["com.android.camera2", "Camera", "◉", "#37474F"],
      ["com.mk.carlauncher", "MK TV & Car Launcher", "MK", "#0E2A2B"],
    ].concat(flavor === "phone" ? [
      ["com.android.chrome2", "Gmail", "M", "#EA4335"], ["com.instagram.android", "Instagram", "◎", "#C13584"],
      ["com.snapchat.android", "Snapchat", "☺", "#FFFC00", "#000"], ["com.twitter.android", "X", "X", "#000"],
      ["com.android.calculator2", "Calculator", "=", "#FF9500"], ["com.android.deskclock", "Clock", "◷", "#222"],
      ["com.google.android.keep", "Keep", "K", "#FBBC04", "#202124"], ["com.android.contacts", "Contacts", "☻", "#4285F4"],
      ["com.careem.acma", "Careem", "C", "#4CAF50"], ["com.talabat", "Talabat", "t", "#FF5A00"],
      ["com.emiratesnbd.android", "Emirates NBD", "E", "#0B2D71"], ["ae.gov.dubaipolice", "Dubai Police", "P", "#00563F"],
      ["com.android.camera", "Gallery", "▣", "#6A1B9A"], ["com.zoom.us", "Zoom", "Z", "#2D8CFF"],
    ] : []).map(([pkg, label, mark, bg, fg]) => ({ pkg, label, banner: false, small: false, system: /android\.(settings|fmradio|camera2|documentsui|vending)/.test(pkg), icon: square(mark, bg, fg) }));
  }
  const q = new URLSearchParams(location.search).get("photos");
  window.MOCK_TV = {
    apps: () => JSON.stringify(apps),
    flavor: () => flavor,
    appsStamp: () => 0,
    setBrightness: (v) => console.log("brightness", v),
    appWidgetProviders: () => JSON.stringify([
      { prov: "com.google.android.gm/.Widget", label: "Gmail", pkg: "com.google.android.gm", app: "Gmail", w: 250, h: 180 },
      { prov: "com.google.android.calendar/.Month", label: "Month", pkg: "com.google.android.calendar", app: "Calendar", w: 250, h: 250, cw: 4, ch: 4 },
      { prov: "com.spotify.music/.Small", label: "Player", pkg: "com.spotify.music", app: "Spotify", w: 250, h: 60 },
    ]),
    appWidgetPreview: () => "",
    bindAppWidget: (prov) => setTimeout(() => window.onAppWidgetBound && window.onAppWidgetBound(Math.floor(Math.random() * 1000), true), 300),
    placeAppWidgets: (json) => { window.__aw = json; },
    appWidgetShot: () => {},
    deleteAppWidget: (id) => console.log("delete widget", id),
    mediaState: () => JSON.stringify(/media=0/.test(location.search) ? {} : { pkg: "com.spotify.music", title: "Al-Fatiha Recitation", artist: "Mishary Rashid Alafasy", album: "Quran", duration: 245000, state: 3, speed: 1, position: 61000, positionAt: Date.now() - 5000 }),
    transferState: () => JSON.stringify(window.__xs || { on: false, ips: ["172.20.10.3"], storage: true }),
    transferStart: () => { window.__xs = { on: true, port: 8080, key: "a1b2c3d4e5f6", ips: ["172.20.10.3"], storage: true, hotspot: window.__hot || null }; return JSON.stringify(window.__xs); },
    transferStop: () => { window.__xs = { on: false, ips: ["172.20.10.3"], storage: true }; },
    hotspot: (on) => { window.__hot = on ? { ssid: "DIRECT-MK-Car", pass: "x7k2m9q4" } : null; if (window.__xs) window.__xs.hotspot = window.__hot; setTimeout(() => window.onHotspot(null), 200); },
    notifications: () => JSON.stringify([
      { key: "1", pkg: "com.whatsapp", app: "WhatsApp", title: "Mum", text: "Are you coming for dinner tonight? We're making machboos", time: Date.now() - 120000, clear: true },
      { key: "2", pkg: "com.google.android.apps.maps", app: "Maps", title: "Traffic on E11", text: "Heavy traffic ahead, 12 min delay", time: Date.now() - 1500000, clear: true },
      { key: "3", pkg: "com.spotify.music", app: "Spotify", title: "Al-Fatiha Recitation", text: "Mishary Rashid Alafasy", time: Date.now() - 4000000, clear: false },
    ]),
    appVersion: () => JSON.stringify({ can: !/noupdate/.test(location.search), version: "2.8.3", code: 31 }),
    checkUpdate: () => setTimeout(() => window.onUpdateInfo(/latest/.test(location.search)
      ? { tag: "v2.8.3", self: { package: "com.mk.carlauncher", current: "2.8.3", name: "2.8.3", newer: false } }
      : { tag: "v2.8.4", self: { package: "com.mk.carlauncher", current: "2.8.3", name: "2.8.4", newer: true }, helper: { package: "com.mk.splithelper", current: "1.3.1", name: "1.3.2", newer: true } }), 300),
    installUpdate: (w) => { console.log("install", w); let p = 0; const t = setInterval(() => { p += 25; window.onUpdateStatus({ state: "downloading", detail: String(p) }); if (p >= 100) { clearInterval(t); if (/manual=1/.test(location.search)) return window.onUpdateStatus({ state: "saved", detail: "/storage/emulated/0/Download/" + (w === "helper" ? "mk-split-helper-v2.9.1.apk" : "mk-car-launcher-v2.9.1.apk") }); window.onUpdateStatus({ state: "installing" }); setTimeout(() => window.onUpdateStatus({ state: "done" }), 400); } }, 100); },
    checkOnline: () => setTimeout(() => window.onOnline(!/offline=1/.test(location.search)), 200),
    mapsShortcut: (w) => { console.log("maps shortcut", w); return !/noshortcut/.test(location.search); },
    online: () => !/offline=1/.test(location.search),
    systemShade: () => console.log("system shade"),
    notifCommand: (c, k) => console.log("notif", c, k),
    quickState: () => JSON.stringify({ wifi: true, bt: 0, volume: 9, maxVolume: 15, brightness: 0.6, canWrite: false }),
    setWifi: (on) => { console.log("wifi", on); return true; },
    setBluetooth: (on) => { console.log("bt", on); return true; },
    setVolume: (v) => console.log("volume", v),
    setSystemBrightness: (f) => false,
    openWriteSettings: () => console.log("write settings"),
    mediaAccess: () => JSON.stringify({ helper: /helper=0/.test(location.search) ? 0 : 4, access: !/access=0/.test(location.search) }),
    mediaCommand: (c, v) => console.log("media", c, v),
    openMediaAccess: () => console.log("media access settings"),
    backupLayout: (json) => { window.__backup = json; return true; },
    restoreLayout: () => setTimeout(() => window.onLayoutPicked && window.onLayoutPicked(window.__backup || "{}"), 200),
    isDefaultHome: () => /home=1/.test(location.search),
    requestDefaultHome: () => console.log("requestDefaultHome"),
    insets: () => JSON.stringify({ top: 32, bottom: 18, left: 0, right: 0 }),
    carLocation: () => JSON.stringify({ lat: 25.2048, lon: 55.2708, city: "Dubai", country: "AE", at: Date.now() }),
    schedulePrayerAlerts: (json) => console.log("alerts", json),
    carMotion: () => JSON.stringify({ bearing: 120, speed: 14, at: Date.now() }),
    openMaps: (uri) => { console.log("maps", uri); return true; },
    notifyTravelDua: (title) => console.log("travel dua", title),
    launchSplit: (a, b) => { console.log("split", a, b); return "tried"; },
    splitHelperOn: () => false,
    splitHelperInstalled: () => false,
    openAccessibilitySettings: () => console.log("accessibility settings"),
    launch: (p) => { console.log("launch", p); return true; },
    uninstall: (p) => { apps = apps.filter((a) => a.pkg !== p); setTimeout(() => window.onTvResume && window.onTvResume(), 300); },
    openSettings: () => console.log("settings"),
    openWifiSettings: () => console.log("wifi settings"),
    network: () => JSON.stringify({ type: "wifi", level: 3 }),
    photos: () => JSON.stringify(q ? q.split(",") : []),
    photoFolder: () => "",
    settings: () => "null",
    location: () => JSON.stringify({ lat: 25.3463, lon: 55.4209, city: "Sharjah", country: "AE", at: Date.now() }),
    locate: () => {},
    promptText: (title, value) => setTimeout(() => window.onPrompt && window.onPrompt(prompt(title, value)), 0),
    albums: () => "[]",
    albumPhotos: () => JSON.stringify({ at: Date.now(), photos: [] }),
    refreshAlbums: () => {},
    getPref: (k) => localStorage.getItem("pref." + k),
    setPref: (k, v) => localStorage.setItem("pref." + k, v),
  };
})();
