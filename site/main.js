(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s) => document.querySelector(s);

  // Mobile menu: full height panel, links arrive one after another.
  const btn = $("#menuBtn"), menu = $("#mobileMenu");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add("open")); }
    else { menu.classList.remove("open"); setTimeout(() => { if (!menu.classList.contains("open")) menu.hidden = true; }, 300); }
  };
  btn.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });

  // Sections rise into place once.
  const reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) reveals.forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -10% 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  // Tagline: each word lights up as it crosses a line 40% up the screen.
  const tag = $("#tagline");
  const lines = tag.innerHTML.split(/<br\s*\/?>/i);
  tag.innerHTML = lines.map((l) => l.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ")).join("<br>");
  const words = tag.querySelectorAll(".w");
  if (reduce || !("IntersectionObserver" in window)) words.forEach((w) => w.classList.add("on"));
  else {
    const idx = new Map([...words].map((w, i) => [w, i]));
    const wo = new IntersectionObserver((entries) => {
      // Words crossing together (one line) still light up one after another, in reading order.
      let n = 0;
      entries.sort((a, b) => idx.get(a.target) - idx.get(b.target)).forEach((en) => {
        const on = en.isIntersecting || en.boundingClientRect.top < 0;
        if (on === en.target.classList.contains("on")) return;
        en.target.style.transitionDelay = on ? n++ * 70 + "ms" : "0ms";
        en.target.classList.toggle("on", on);
      });
    }, { rootMargin: "0px 0px -40% 0px", threshold: 1 });
    words.forEach((w) => wo.observe(w));
  }

  // Current section in the nav.
  const links = [...document.querySelectorAll(".nav-links a")];
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => {
        const on = a.getAttribute("href") === "#" + en.target.id;
        a.classList.toggle("current", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    }), { rootMargin: "-45% 0px -50% 0px" });
    ["platforms", "how", "download", "faq"].forEach((id) => { const el = document.getElementById(id); if (el) so.observe(el); });
  }

  // Download links: the latest GitHub release, so the page never needs editing for a new version.
  // The links already in the page (the release it was published with) stay if GitHub can't be reached.
  const REPO = "Mkuz1/mk-tv-car-launcher";
  const size = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " KB");
  const cards = document.querySelectorAll(".dl[data-asset]");
  cards.forEach((c) => c.classList.add("loading"));
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((rel) => {
      const v = String(rel.tag_name || "").replace(/^v/, "");
      if (v) document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = el.textContent.replace(/\d+(\.\d+)+/, v); });
      if (rel.published_at) $("#relDate").textContent = new Date(rel.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      cards.forEach((c) => {
        const a = (rel.assets || []).find((x) => x.name.startsWith(c.dataset.asset) && x.name.endsWith(".apk"));
        if (!a) return;
        c.querySelector(".dl-btn").href = a.browser_download_url;
        c.querySelector(".dl-size").textContent = size(a.size);
        c.querySelector(".dl-file").textContent = a.name;
      });
      const zip = (rel.assets || []).find((x) => x.name.startsWith("google-play-bundles"));
      if (zip) $("#bundleLink").href = zip.browser_download_url;
    })
    .catch(() => {})
    .finally(() => cards.forEach((c) => c.classList.remove("loading")));
})();
