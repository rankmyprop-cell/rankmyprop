(() => {
  const links = [
    ["dashboard-admin.html", "Admin Home"],
    ["admin-support-access.html", "Support Access"],
    ["admin-activity.html", "Activity Log"],
    ["admin-clients.html", "Client Access"],
    ["admin-moderation.html", "Moderation"],
    ["admin-reviews.html", "Reviews Hub"],
    ["admin-purchases.html", "Purchases"],
    ["admin-announcements.html", "Announcement Hub"],
    ["admin-push.html", "Push Notifications"],
    ["admin-community.html", "Community Posts"],
    ["admin-giveaways.html", "Giveaways CMS"],
    ["admin-events.html", "Upcoming Events"],
    ["admin-offers.html", "Offers Control"],
    ["admin-firm-details.html", "Firm Detail CMS"],
    ["admin-filters.html", "Filters Control"],
    ["admin-propnews.html", "Prop News CMS"],
    ["admin-trading-guides.html", "Trading Guides CMS"],
    ["admin-funding-strategies.html", "Funding Strategies CMS"],
    ["admin-trading-psychology.html", "Trading Psychology CMS"],
    ["admin-beginner-tutorials.html", "Beginner Tutorials CMS"],
    ["admin-blog-banner.html", "Blog Sidebar Banner"],
    ["admin-website-popup.html", "Website Popup"],
    ["admin-games.html", "Games & Live Quiz"],
    ["admin-content-cms.html", "Page Copy CMS"],
    ["admin-faqs.html", "FAQ CMS"],
    ["admin-newsletter.html", "Newsletter"]
  ];

  const rawFile = (location.pathname.split("/").pop() || "").toLowerCase();
  const file = rawFile && !rawFile.includes(".") ? `${rawFile}.html` : rawFile;
  if (!file.startsWith("admin-") && file !== "dashboard-admin.html") return;

  // Reuse the Operations Console visual system across every admin module.
  // This only adds presentation classes/styles; page structure, field order,
  // identifiers and all existing admin behaviour remain untouched.
  if (!document.getElementById("adminOperationsTheme")) {
    const theme = document.createElement("link");
    theme.id = "adminOperationsTheme";
    theme.rel = "stylesheet";
    theme.href = "/operations-console.css";
    document.head.appendChild(theme);
  }
  document.body.classList.add("operations-admin-theme");
  const adminApp = document.querySelector(".app");
  const adminSidebar = adminApp?.querySelector(":scope > .sidebar");
  const adminMain = adminApp?.querySelector(":scope > .main");
  const adminTop = adminMain?.querySelector(":scope > .top");
  adminApp?.classList.add("preview-app");
  adminSidebar?.classList.add("preview-sidebar");
  adminMain?.classList.add("preview-main");
  adminTop?.classList.add("preview-top");

  const LANG_KEY = "rmp_admin_lang";
  const textState = new WeakMap();
  const attrState = new WeakMap();
  const titleState = { orig: document.title || "", rendered: document.title || "" };

  const exactHi = {
    "rmp admin": "RMP एडमिन",
    "admin modules": "एडमिन मॉड्यूल्स",
    "search modules...": "मॉड्यूल खोजें...",
    "search page...": "पेज खोजें...",
    "loading...": "लोड हो रहा...",
    "log out": "लॉग आउट",
    "admin home": "एडमिन होम",
    "support access": "सपोर्ट एक्सेस",
    "activity log": "एक्टिविटी लॉग",
    "client access": "क्लाइंट एक्सेस",
    "moderation": "मॉडरेशन",
    "reviews hub": "रिव्यू हब",
    "purchases": "खरीद",
    "announcement hub": "घोषणा हब",
    "community posts": "कम्युनिटी पोस्ट",
    "giveaways cms": "गिवअवे CMS",
    "upcoming events": "आगामी इवेंट्स",
    "offers control": "ऑफर्स कंट्रोल",
    "firm detail cms": "फर्म डिटेल CMS",
    "filters control": "फ़िल्टर कंट्रोल",
    "prop news cms": "प्रॉप न्यूज़ CMS",
    "trading guides cms": "ट्रेडिंग गाइड्स CMS",
    "funding strategies cms": "फंडिंग स्ट्रैटेजीज़ CMS",
    "trading psychology cms": "ट्रेडिंग साइकोलॉजी CMS",
    "beginner tutorials cms": "बिगिनर ट्यूटोरियल्स CMS",
    "page copy cms": "पेज कॉपी CMS",
    "faq cms": "FAQ CMS",
    "newsletter": "न्यूज़लेटर",
    "english": "English",
    "hindi": "हिंदी",
    "logo file upload": "लोगो फ़ाइल अपलोड",
    "banner file upload": "बैनर फ़ाइल अपलोड",
    "overview title": "ओवरव्यू शीर्षक",
    "overview long title": "ओवरव्यू लॉन्ग शीर्षक",
    "overviewlong title": "ओवरव्यू लॉन्ग शीर्षक",
    "overview short": "ओवरव्यू शॉर्ट",
    "overviewshort": "ओवरव्यू शॉर्ट",
    "overview long (paragraphs with blank line)": "ओवरव्यू लॉन्ग (पैराग्राफ, खाली लाइन से अलग करें)",
    "overviewlong (paragraphs with blank line)": "ओवरव्यू लॉन्ग (पैराग्राफ, खाली लाइन से अलग करें)",
    "platforms (comma)": "प्लेटफ़ॉर्म (कॉमा से अलग)",
    "payment methods (comma)": "पेमेंट मेथड्स (कॉमा से अलग)",
    "restricted countries (comma)": "प्रतिबंधित देश (कॉमा से अलग)",
    "why choose (one per line)": "क्यों चुनें (हर लाइन में एक)"
    ,"performance json": "परफॉर्मेंस JSON"
    ,"radar metrics json (max 5)": "रडार मेट्रिक्स JSON (अधिकतम 5)"
    ,"stats json": "स्टैट्स JSON"
    ,"key metrics json": "की मेट्रिक्स JSON"
    ,"listing card metrics json": "लिस्टिंग कार्ड मेट्रिक्स JSON"
    ,"trading conditions json": "ट्रेडिंग कंडीशंस JSON"
    ,"firm details json": "फर्म डिटेल्स JSON"
    ,"leverage rows json": "लेवरेज रोज़ JSON"
    ,"commissions json": "कमीशंस JSON"
    ,"evaluation programs json": "इवैल्यूएशन प्रोग्राम्स JSON"
    ,"rules panel json": "रूल्स पैनल JSON"
    ,"challenges panel json": "चैलेंजेस पैनल JSON"
    ,"spreads panel json": "स्प्रेड्स पैनल JSON"
    ,"announcements panel json": "अनाउंसमेंट्स पैनल JSON"
    ,"bold": "बोल्ड"
    ,"italic": "इटैलिक"
    ,"highlight": "हाइलाइट"
  };

  const phraseHi = [
    ["Sort: Ranking", "क्रम: रैंकिंग"],
    ["Sort: Name", "क्रम: नाम"],
    ["Sort: Followers", "क्रम: फ़ॉलोअर्स"],
    ["All Countries", "सभी देश"],
    ["All Tags", "सभी टैग"],
    ["Search firms...", "फर्म खोजें..."],
    ["Search modules...", "मॉड्यूल खोजें..."],
    ["Search page...", "पेज खोजें..."],
    ["No file chosen", "कोई फ़ाइल चयनित नहीं"],
    ["Bold", "बोल्ड"],
    ["Italic", "इटैलिक"],
    ["Highlight", "हाइलाइट"],
    ["Publish State", "पब्लिश स्थिति"],
    ["Unpublish Until", "अनपब्लिश तक"],
    ["Listing Visibility Toggles", "लिस्टिंग विजिबिलिटी टॉगल्स"],
    ["Best Prop Country Toggles", "बेस्ट प्रॉप देश टॉगल्स"],
    ["Best Prop Category Toggles", "बेस्ट प्रॉप कैटेगरी टॉगल्स"],
    ["Payout Assurance Tick", "पेआउट एश्योरेंस टिक"],
    ["Show in Listed Props", "लिस्टेड प्रॉप्स में दिखाएं"],
    ["Show in Best Prop (Global)", "बेस्ट प्रॉप (ग्लोबल) में दिखाएं"],
    ["Save Now & Add New", "अभी सहेजें और नया जोड़ें"],
    ["Add New", "नया जोड़ें"],
    ["Save", "सहेजें"],
    ["Delete", "हटाएं"],
    ["Create", "बनाएं"],
    ["Update", "अपडेट"],
    ["Reset", "रीसेट"],
    ["Cancel", "रद्द करें"],
    ["Yes", "हाँ"],
    ["No", "नहीं"],
    ["Draft", "ड्राफ्ट"],
    ["Published", "प्रकाशित"],
    ["Unpublished", "अप्रकाशित"],
    ["Active", "सक्रिय"],
    ["Inactive", "निष्क्रिय"],
    ["Ranking", "रैंकिंग"],
    ["Followers", "फ़ॉलोअर्स"],
    ["Likes", "लाइक्स"],
    ["Firm", "फर्म"],
    ["Firms", "फर्म्स"],
    ["Details", "विवरण"],
    ["Detail", "विवरण"],
    ["Rules", "रूल्स"],
    ["Rule", "रूल"],
    ["Discount", "डिस्काउंट"],
    ["Reviews", "रिव्यू"],
    ["Review", "रिव्यू"],
    ["Offers", "ऑफर्स"],
    ["Offer", "ऑफर"],
    ["Filters", "फ़िल्टर"],
    ["Filter", "फ़िल्टर"],
    ["Country", "देश"],
    ["Countries", "देश"],
    ["Tag", "टैग"],
    ["Tags", "टैग"],
    ["Control", "कंट्रोल"],
    ["Panel", "पैनल"],
    ["Content", "कंटेंट"],
    ["Copy", "कॉपी"],
    ["Title", "शीर्षक"],
    ["Heading", "हेडिंग"],
    ["Paragraph", "पैराग्राफ"],
    ["Sidebar", "साइडबार"],
    ["Module", "मॉड्यूल"],
    ["Page", "पेज"],
    ["Post", "पोस्ट"],
    ["Posts", "पोस्ट्स"],
    ["News", "न्यूज़"],
    ["Guide", "गाइड"],
    ["Guides", "गाइड्स"],
    ["Strategy", "स्ट्रैटेजी"],
    ["Strategies", "स्ट्रैटेजीज़"],
    ["Psychology", "साइकोलॉजी"],
    ["Tutorial", "ट्यूटोरियल"],
    ["Tutorials", "ट्यूटोरियल्स"],
    ["Client", "क्लाइंट"],
    ["Access", "एक्सेस"],
    ["Community", "कम्युनिटी"],
    ["Announcement", "घोषणा"],
    ["Events", "इवेंट्स"],
    ["Event", "इवेंट"],
    ["Purchase", "खरीद"],
    ["Email", "ईमेल"],
    ["Website", "वेबसाइट"],
    ["Link", "लिंक"],
    ["Slug", "स्लग"],
    ["Name", "नाम"],
    ["New", "नया"],
    ["Selected", "चयनित"],
    ["Selector", "सेलेक्टर"],
    ["Top", "शीर्ष"],
    ["Bottom", "नीचे"],
    ["Left", "बायां"],
    ["Right", "दायां"],
    ["Visible", "दृश्य"],
    ["Hidden", "छिपा"],
    ["Enabled", "सक्षम"],
    ["Disabled", "अक्षम"],
    ["Manual", "मैनुअल"],
    ["Override", "ओवरराइड"],
    ["Score", "स्कोर"],
    ["Trusted", "विश्वसनीय"],
    ["Markets", "मार्केट्स"],
    ["Platform", "प्लेटफ़ॉर्म"],
    ["Platforms", "प्लेटफ़ॉर्म"],
    ["Payment", "पेमेंट"],
    ["Methods", "मेथड्स"],
    ["Restricted", "प्रतिबंधित"],
    ["Upload", "अपलोड"],
    ["File", "फ़ाइल"],
    ["Preview", "प्रीव्यू"],
    ["Overview", "ओवरव्यू"],
    ["Welcome", "स्वागत"],
    ["Profile", "प्रोफाइल"],
    ["Published", "प्रकाशित"],
    ["Draft", "ड्राफ्ट"],
    ["Unpublished", "अप्रकाशित"]
  ].sort((a, b) => b[0].length - a[0].length);

  function getLang() {
    const v = String(localStorage.getItem(LANG_KEY) || "en").toLowerCase();
    return v === "hi" ? "hi" : "en";
  }

  function setLang(v) {
    const lang = v === "hi" ? "hi" : "en";
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
  }

  function norm(s = "") {
    return String(s).toLowerCase().trim().replace(/\s+/g, " ");
  }

  function escRe(s = "") {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function shouldSkip(s = "") {
    const v = String(s || "").trim();
    if (!v) return true;
    if (!/[A-Za-z]/.test(v)) return true;
    if (/https?:\/\//i.test(v)) return true;
    if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(v)) return true;
    if (/^\/[A-Za-z0-9/_-]+$/.test(v)) return true;
    if (/[{}\[\]]/.test(v)) return true;
    return false;
  }

  function toHindi(text = "") {
    const raw = String(text);
    if (!raw || shouldSkip(raw)) return raw;

    const lead = (raw.match(/^\s*/) || [""])[0];
    const trail = (raw.match(/\s*$/) || [""])[0];
    const core = raw.slice(lead.length, raw.length - trail.length);
    if (!core) return raw;

    const ex = exactHi[norm(core)];
    if (ex) return `${lead}${ex}${trail}`;

    let out = core;
    for (const [en, hi] of phraseHi) {
      out = out.replace(new RegExp(`\\b${escRe(en)}\\b`, "gi"), hi);
    }
    return `${lead}${out}${trail}`;
  }

  function tr(text = "", lang = "en") {
    const s = String(text ?? "");
    return lang === "hi" ? toHindi(s) : s;
  }

  function syncTextNode(node, lang) {
    const st = textState.get(node) || { orig: node.nodeValue || "", rendered: node.nodeValue || "" };
    if (node.nodeValue !== st.rendered) st.orig = node.nodeValue;
    const next = lang === "hi" ? tr(st.orig, "hi") : st.orig;
    if (node.nodeValue !== next) node.nodeValue = next;
    st.rendered = next;
    textState.set(node, st);
  }

  function syncAttr(el, attr, lang) {
    const cur = el.getAttribute(attr);
    if (cur == null) return;
    const key = `${attr}__state`;
    const all = attrState.get(el) || {};
    const st = all[key] || { orig: cur, rendered: cur };
    if (cur !== st.rendered) st.orig = cur;
    const next = lang === "hi" ? tr(st.orig, "hi") : st.orig;
    if (cur !== next) el.setAttribute(attr, next);
    st.rendered = next;
    all[key] = st;
    attrState.set(el, all);
  }

  function applyLang(lang = "en") {
    const active = lang === "hi" ? "hi" : "en";
    document.documentElement.setAttribute("lang", active === "hi" ? "hi" : "en");

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node || !node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        const t = p.tagName;
        if (t === "SCRIPT" || t === "STYLE" || t === "NOSCRIPT" || t === "TEXTAREA" || t === "PRE" || t === "CODE") return NodeFilter.FILTER_REJECT;
        if (p.closest("textarea,pre,code,[data-i18n-skip]")) return NodeFilter.FILTER_REJECT;
        if (p.closest("tbody td")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let node;
    while ((node = walker.nextNode())) syncTextNode(node, active);

    document.querySelectorAll("input[placeholder],select[placeholder],button[title],input[title],select[title]").forEach((el) => {
      syncAttr(el, "placeholder", active);
      syncAttr(el, "title", active);
    });

    if (document.title !== titleState.rendered) titleState.orig = document.title;
    const nextTitle = active === "hi" ? tr(titleState.orig, "hi") : titleState.orig;
    if (document.title !== nextTitle) document.title = nextTitle;
    titleState.rendered = nextTitle;

    const btnEn = document.getElementById("adminLangEn");
    const btnHi = document.getElementById("adminLangHi");
    if (btnEn) {
      btnEn.style.opacity = active === "en" ? "1" : "0.78";
      btnEn.style.borderColor = active === "en" ? "rgba(122,116,255,.68)" : "rgba(255,255,255,.18)";
      btnEn.style.background = active === "en" ? "rgba(122,116,255,.2)" : "rgba(255,255,255,.02)";
    }
    if (btnHi) {
      btnHi.style.opacity = active === "hi" ? "1" : "0.78";
      btnHi.style.borderColor = active === "hi" ? "rgba(122,116,255,.68)" : "rgba(255,255,255,.18)";
      btnHi.style.background = active === "hi" ? "rgba(122,116,255,.2)" : "rgba(255,255,255,.02)";
    }
  }

  function mountLangToggle() {
    const topActions = document.querySelector(".top .top-actions");
    if (!topActions || document.getElementById("adminLangToggle")) return;

    const wrap = document.createElement("div");
    wrap.id = "adminLangToggle";
    wrap.style.display = "inline-flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "6px";
    wrap.style.padding = "4px";
    wrap.style.border = "1px solid rgba(255,255,255,.14)";
    wrap.style.borderRadius = "10px";
    wrap.style.background = "rgba(255,255,255,.04)";
    wrap.innerHTML = `
      <button id="adminLangEn" type="button" class="btn" style="padding:6px 10px;font-size:12px;line-height:1">English</button>
      <button id="adminLangHi" type="button" class="btn" style="padding:6px 10px;font-size:12px;line-height:1">हिंदी</button>
    `;

    const first = topActions.firstElementChild;
    if (first) topActions.insertBefore(wrap, first);
    else topActions.appendChild(wrap);

    wrap.querySelector("#adminLangEn")?.addEventListener("click", () => setLang("en"));
    wrap.querySelector("#adminLangHi")?.addEventListener("click", () => setLang("hi"));
  }

  const sidebar = document.querySelector(".app > .sidebar");
  if (sidebar) {
    const nav = links.map(([href, label]) => {
      const active = href.toLowerCase() === file ? " active" : "";
      return `<a class="side-link${active}" data-admin-link href="${href}">${label}</a>`;
    }).join("");
    sidebar.innerHTML = `
      <div class="brand"><span class="brand-dot"></span><b>RMP Admin</b></div>
      <input id="adminSideSearch" class="side-search" placeholder="Search modules..." />
      <div class="menu-group-title">Admin Modules</div>
      ${nav}
      <a class="side-link" href="#" id="logoutBtn">Log out</a>
    `;

    const s = sidebar.querySelector("#adminSideSearch");
    const items = Array.from(sidebar.querySelectorAll("[data-admin-link]"));
    if (s) {
      s.addEventListener("input", () => {
        const q = s.value.trim().toLowerCase();
        items.forEach((el) => {
          el.style.display = !q || el.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
    }

    const logoutBtn = sidebar.querySelector("#logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          const m = await import("./dashboard-common.js");
          if (m && typeof m.logout === "function") await m.logout();
        } catch (_) {}
        location.href = "login.html";
      });
    }
  }

  const topActions = document.querySelector(".top .top-actions");
  if (topActions && !document.getElementById("adminGlobalSearch")) {
    const wrap = document.createElement("div");
    wrap.style.display = "inline-flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "8px";
    wrap.innerHTML = `<input id="adminGlobalSearch" class="side-search" placeholder="Search page..." style="height:34px;min-width:220px;margin:0;" />`;
    topActions.prepend(wrap);

    const search = wrap.querySelector("#adminGlobalSearch");
    const panels = Array.from(document.querySelectorAll(".main .panel"));
    const tables = Array.from(document.querySelectorAll(".main table tbody"));

    if (search) {
      search.addEventListener("input", () => {
        const q = search.value.trim().toLowerCase();
        if (!q) {
          panels.forEach((p) => (p.style.display = ""));
          tables.forEach((tb) => {
            Array.from(tb.querySelectorAll("tr")).forEach((tr) => (tr.style.display = ""));
          });
          return;
        }

        panels.forEach((p) => {
          const txt = p.textContent.toLowerCase();
          const tableRows = Array.from(p.querySelectorAll("tbody tr"));
          if (!tableRows.length) {
            p.style.display = txt.includes(q) ? "" : "none";
            return;
          }
          let any = false;
          tableRows.forEach((tr) => {
            const hit = tr.textContent.toLowerCase().includes(q);
            tr.style.display = hit ? "" : "none";
            if (hit) any = true;
          });
          p.style.display = any || txt.includes(q) ? "" : "none";
        });
      });
    }
  }

  mountLangToggle();

  const postCmsPages = new Set([
    "admin-propnews.html",
    "admin-trading-guides.html",
    "admin-funding-strategies.html",
    "admin-trading-psychology.html",
    "admin-beginner-tutorials.html"
  ]);

  if (postCmsPages.has(file)) {
    const form = document.getElementById("postForm");
    const saveBtn = document.getElementById("savePostBtn");
    if (form && saveBtn && !document.getElementById("addNewPostBtn")) {
      const cancelBtn = document.getElementById("cancelPostBtn");
      const notice = document.getElementById("notice");
      const actions = saveBtn.closest(".top-actions") || saveBtn.parentElement;
      let dirty = false;

      const setDirty = () => { dirty = true; };
      const setClean = () => { dirty = false; };

      form.addEventListener("input", setDirty);
      form.addEventListener("change", setDirty);
      cancelBtn?.addEventListener("click", () => setTimeout(setClean, 0));
      form.addEventListener("submit", () => setTimeout(setClean, 900));

      if (notice) {
        const nObs = new MutationObserver(() => {
          const t = String(notice.textContent || "").toLowerCase();
          if (t.includes("post added") || t.includes("post updated")) setClean();
        });
        nObs.observe(notice, { childList: true, subtree: true, characterData: true });
      }

      function centerMsg(text) {
        const x = document.createElement("div");
        x.textContent = text;
        x.style.cssText = "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99999;background:linear-gradient(180deg,#7a74ff,#5b55ff);color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;box-shadow:0 14px 36px rgba(0,0,0,.42)";
        document.body.appendChild(x);
        setTimeout(() => x.remove(), 1300);
      }

      function resetToNew() {
        if (cancelBtn) cancelBtn.click();
        else {
          form.reset();
          const idField = form.elements?.namedItem?.("docId");
          if (idField) idField.value = "";
        }
        setClean();
        window.scrollTo({ top: 0, behavior: "smooth" });
        centerMsg("Added");
      }

      function askAddNew() {
        const ov = document.createElement("div");
        ov.style.cssText = "position:fixed;inset:0;background:rgba(2,4,12,.72);display:grid;place-items:center;z-index:100000;padding:16px";
        ov.innerHTML = `
          <div style="width:min(460px,100%);background:#0f1327;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:16px">
            <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:8px">Add New Post</div>
            <div style="font-size:13px;color:#aab0c9;line-height:1.5;margin-bottom:14px">Are you sure you want to add new without saving current changes?</div>
            <div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap">
              <button data-k="cancel" style="border:1px solid rgba(255,255,255,.2);background:transparent;color:#e5e7eb;border-radius:8px;padding:8px 12px;cursor:pointer">Cancel</button>
              <button data-k="yes" style="border:1px solid rgba(255,255,255,.2);background:#1b2446;color:#fff;border-radius:8px;padding:8px 12px;cursor:pointer">Yes</button>
              <button data-k="save" style="border:1px solid #6366f1;background:#6366f1;color:#fff;border-radius:8px;padding:8px 12px;cursor:pointer">Save Now & Add New</button>
            </div>
          </div>
        `;
        const close = () => ov.remove();
        ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
        ov.querySelector('[data-k="cancel"]')?.addEventListener("click", close);
        ov.querySelector('[data-k="yes"]')?.addEventListener("click", () => { close(); resetToNew(); });
        ov.querySelector('[data-k="save"]')?.addEventListener("click", () => {
          if (!form.reportValidity()) return;
          close();
          const done = () => { resetToNew(); };
          if (notice) {
            const obs = new MutationObserver(() => {
              const t = String(notice.textContent || "").toLowerCase();
              if (t.includes("post added") || t.includes("post updated")) {
                obs.disconnect();
                done();
              }
            });
            obs.observe(notice, { childList: true, subtree: true, characterData: true });
            setTimeout(() => obs.disconnect(), 5000);
          }
          saveBtn.click();
          setTimeout(done, 1300);
        });
        document.body.appendChild(ov);
        applyLang(getLang());
      }

      if (actions) {
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.id = "addNewPostBtn";
        addBtn.className = "btn";
        addBtn.textContent = "Add New";
        addBtn.addEventListener("click", () => {
          if (dirty) { askAddNew(); return; }
          resetToNew();
        });
        actions.insertBefore(addBtn, saveBtn.nextSibling);
      }
    }
  }

  const observer = new MutationObserver(() => {
    const lang = getLang();
    if (lang !== "hi") return;
    if (observer._t) clearTimeout(observer._t);
    observer._t = setTimeout(() => applyLang("hi"), 40);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title"] });

  applyLang(getLang());
})();
