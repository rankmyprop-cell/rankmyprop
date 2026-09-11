import { db } from "./dashboard-common.js";
import { bindLogout, enforceAdmin } from "./admin-common.js";
import { collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

(function () {
  "use strict";

  const TOTAL_USERS = 12842;
  const PAGE_SIZE = 25;
  const countries = [
    { name: "India", code: "+91", cities: ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Jaipur"], first: ["Aarav","Vivaan","Aditya","Arjun","Rohan","Kabir","Ishaan","Ananya","Diya","Ira","Meera","Saanvi"], last: ["Sharma","Patel","Singh","Mehta","Gupta","Kapoor","Reddy","Nair"] },
    { name: "Pakistan", code: "+92", cities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"], first: ["Ahmed","Hamza","Bilal","Usman","Saad","Zain","Ayesha","Fatima","Hira","Mariam","Zara"], last: ["Khan","Malik","Ahmed","Sheikh","Qureshi","Siddiqui","Chaudhry"] },
    { name: "United States", code: "+1", cities: ["New York", "Austin", "Chicago", "Miami", "Seattle", "San Diego"], first: ["Liam","Noah","Ethan","Mason","James","Olivia","Emma","Ava","Mia","Sophia"], last: ["Smith","Johnson","Brown","Davis","Wilson","Taylor","Anderson"] },
    { name: "United Arab Emirates", code: "+971", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"], first: ["Omar","Zayed","Yousef","Khalid","Ali","Noura","Layla","Amira","Maha"], last: ["Al Mansoori","Al Farsi","Haddad","Nasser","Rahman","Saeed"] },
    { name: "Australia", code: "+61", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"], first: ["Oliver","Jack","William","Henry","Leo","Charlotte","Amelia","Isla","Grace"], last: ["Williams","Thompson","Walker","Harris","Martin","Clark"] },
    { name: "China", code: "+86", cities: ["Shanghai", "Beijing", "Shenzhen", "Guangzhou", "Chengdu"], first: ["Wei","Jun","Ming","Hao","Tao","Mei","Li","Xinyi","Jia","Lan"], last: ["Wang","Li","Zhang","Liu","Chen","Yang","Huang"] }
  ];
  const firms = ["FundedNext", "Finotive Funding", "FX2 Funding", "Blueberry Funded", "Atlas Funded", "Goat Funded Trader", "FunderPro", "Top One Trader"];
  const styles = ["Scalper", "Day Trader", "Swing Trader", "News Trader", "Algorithmic Trader"];
  const tiers = ["Starter", "Growth Partner", "Pro Partner", "Elite Partner"];
  const emailDomains = ["gmail.com","gmail.com","gmail.com","gmail.com","gmail.com","gmail.com","gmail.com","gmail.com","outlook.com","yahoo.com","icloud.com","proton.me"];
  const emailAliasFirst = ["Aarav","Ananya","Fatima","Ahmed","Layla","Saeed","Maya","Noah","Emma","Oliver","Amelia","Wei","Lan","Zara","Rohan","Sophia","Mariam","Khalid"];
  const emailAliasLast = ["Sharma","Ahmed","Khan","Saeed","Chen","Patel","Smith","Brown","Malik","Williams","Haddad","Mehta","Taylor","Wang","Nair","Clark"];
  const signupVolumes = [15,52,45,4,1,37,18,76,9,23,61,12,5,44,28,84,7,16,1000,11,58,6,25,91,14,3,47,21,68,10,35,8,72,19,27,54,13,5,42,17,63,24,9,39,6,51,20,31,12,73,4,26,48,15,7,60,22,34,11,43];
  const recentPurchasePattern = [1,2,1,0,0,0,1,0,2,0,0,0,0,0,0,0,2,1,3,1,1,1,1,0,0,1,0,2,0,0,1,0,0,0,1,2,0,0,1,0];
  const state = { view: "admin-home", users: [], baselineUsers: [], liveUsers: [], liveConnected: false, dataReady: false, page: 1, search: "", country: "all", status: "all", moduleUi: {} };
  const viewHost = document.getElementById("adminView");
  const titleEl = document.getElementById("pageTitle");
  const subtitleEl = document.getElementById("pageSubtitle");
  const nav = document.getElementById("adminNav");
  const toast = document.getElementById("adminToast");
  const dialog = document.getElementById("clientDialog");
  const dialogBody = document.getElementById("clientDialogBody");
  const recordDialog = document.getElementById("recordDialog");
  const recordDialogBody = document.getElementById("recordDialogBody");
  const adminEmail = document.getElementById("adminEmail");
  const clientCountBadge = document.getElementById("clientCountBadge");

  const moduleConfigs = {
    "support-access": { title: "Support Access", subtitle: "Manage support IDs, account access and pending support submissions.", stats: [["Open Tickets","126"],["Pending Access","18"],["Resolved Today","47"],["Avg. Response","14 min"]], records: ["Password reset request","Dashboard access issue","Purchase verification","Cashback status query","Account email update","Referral tracking issue"] },
    moderation: { title: "Moderation", subtitle: "Review pending claims, cashback requests and community submissions.", stats: [["Pending Claims","27"],["Cashback Queue","184"],["Flagged Items","9"],["Approved Today","63"]], records: ["$100K account claim","Payout proof verification","Cashback request #RMP-8301","Duplicate review check","Identity verification","Suspicious activity report"] },
    reviews: { title: "Reviews Hub", subtitle: "Review trader feedback, proof files and publication status.", stats: [["Pending Reviews","63"],["Published","4,218"],["Flagged","14"],["Avg. Rating","4.3"]], records: ["FundedNext payout experience","Finotive instant account review","FX2 customer support review","Blueberry Funded rules feedback","Atlas Funded first payout","FunderPro challenge experience"] },
    purchases: { title: "Purchases", subtitle: "Monitor tracked challenge purchases and order values.", stats: [["Orders Today","7"],["Gross Value","$643"],["Pending","1"],["Refunded","0"]], records: [
      { title:"FunderPro $5K Account", status:"Approved", updatedHours:1, meta1:"$39 fee", meta2:"$5K account", notes:"FunderPro account purchased today." },
      { title:"FunderPro $5K Account", status:"Approved", updatedHours:2, meta1:"$39 fee", meta2:"$5K account", notes:"Second FunderPro account purchased today." },
      { title:"TraderScale $5K Account", status:"Approved", updatedHours:3, meta1:"$49 fee", meta2:"$5K account", notes:"TraderScale starter account purchased today." },
      { title:"TraderScale $15K Account", status:"Pending", updatedHours:4, meta1:"$89 fee", meta2:"$15K account", notes:"TraderScale growth account pending confirmation." },
      { title:"Goat Funded Trader $50K", status:"Approved", updatedHours:5, meta1:"$219 fee", meta2:"$50K account", notes:"Goat Funded Trader account purchased today." },
      { title:"Atlas Funded $10K Account", status:"Approved", updatedHours:6, meta1:"$79 fee", meta2:"$10K account", notes:"Atlas Funded account purchased today." },
      { title:"FX2 Funding $25K Account", status:"Approved", updatedHours:7, meta1:"$129 fee", meta2:"$25K account", notes:"FX2 Funding account purchased today." }
    ] },
    announcements: { title: "Announcement Hub", subtitle: "Create and manage announcements shown across the user dashboard.", stats: [["Published","8"],["Scheduled","3"],["Drafts","5"],["Total Views","48.2K"]], records: ["August cashback boost","New payout guarantee policy","Platform maintenance notice","Atlas Funded listing update","Community giveaway launch","Referral tier changes"] },
    community: { title: "Community Posts", subtitle: "Moderate community discussions and featured trader posts.", stats: [["Posts","2,482"],["Pending","31"],["Reports","7"],["Active Today","516"]], records: ["My first funded payout","Best rules for swing trading","August challenge journal","Platform execution comparison","Tax discussion for traders","Community milestone"] },
    giveaways: { title: "Giveaways CMS", subtitle: "Manage giveaway campaigns, rules, entries and winners.", stats: [["Active","3"],["Entries","18,940"],["Scheduled","2"],["Winners","46"]], records: ["$100K August Challenge","FundedNext Starter Giveaway","FX2 Community Draw","Trading Journal Contest","Discord Milestone Reward","Weekly Cashpoints Drop"] },
    events: { title: "Upcoming Events", subtitle: "Manage live sessions, webinars and community events.", stats: [["Upcoming","7"],["Registrations","3,842"],["Live Now","1"],["Completed","58"]], records: ["Prop Firm Rules Masterclass","Payout Proof Live Review","Funded Trader AMA","Risk Management Workshop","Platform Comparison Session","Community Market Outlook"] },
    offers: { title: "Offers Control", subtitle: "Control discount codes, offer links, expiry and placement.", stats: [["Active Offers","24"],["Expiring Soon","4"],["Clicks Today","6,814"],["Conversions","9.8%"]], records: ["FundedNext 15% OFF","Finotive 20% OFF","FX2 Funding 10% OFF","Blueberry 25% OFF","Atlas Funded 12% OFF","FunderPro Summer Code"] },
    filters: { title: "Filters Control", subtitle: "Configure directory filters, labels and selectable values.", stats: [["Filter Groups","18"],["Active Values","94"],["Firm Rules","312"],["Updated Today","7"]], records: ["Trading platform filters","Account size values","Payout cycle options","Drawdown types","Country restrictions","Strategy permissions"] },
    "prop-news": { title: "Prop News CMS", subtitle: "Create and manage prop-trading news articles and videos.", stats: [["Published","386"],["Drafts","14"],["Scheduled","6"],["Views This Month","148K"]], records: ["Industry payout update","New firm launch coverage","Rule change analysis","Platform partnership news","Monthly market wrap","Trader interview"] },
    "trading-guides": { title: "Trading Guides CMS", subtitle: "Manage evergreen trading guides and educational resources.", stats: [["Published","92"],["Drafts","8"],["Categories","12"],["Monthly Reads","84K"]], records: ["Daily drawdown guide","Passing a two-step challenge","Choosing account size","News trading rules","Platform execution basics","Payout preparation checklist"] },
    "funding-strategies": { title: "Funding Strategies CMS", subtitle: "Manage funded-account strategy articles and updates.", stats: [["Published","61"],["Drafts","5"],["Featured","8"],["Monthly Reads","47K"]], records: ["Scaling multiple accounts","Conservative challenge plan","Instant funding roadmap","Payout compounding strategy","Risk per trade framework","Consistency rule planning"] },
    "trading-psychology": { title: "Trading Psychology CMS", subtitle: "Manage psychology lessons and performance resources.", stats: [["Published","48"],["Drafts","7"],["Series","6"],["Completions","22K"]], records: ["Recovering after a loss","Avoiding revenge trading","Challenge pressure management","Building execution discipline","Handling payout anxiety","Daily review routine"] },
    "beginner-tutorials": { title: "Beginner Tutorials CMS", subtitle: "Manage step-by-step tutorials for new prop traders.", stats: [["Published","74"],["Drafts","11"],["Learning Paths","9"],["Completions","31K"]], records: ["What is a prop firm?","Reading challenge rules","Setting up MetaTrader","Calculating position size","Understanding drawdown","Submitting payout proof"] },
    activity: { title: "Recent Activity", subtitle: "Track important account and platform events.", stats: [["Events Today","4,821"],["Signups","286"],["Purchases","7"],["Alerts","12"]], records: ["New client registration","Challenge purchase completed","Review submitted","Cashback request opened","Referral reward issued","Admin record updated"] },
    newsletter: { title: "Newsletter", subtitle: "Manage subscribers, segments and campaign exports.", stats: [["Subscribers","38,462"],["Active","36,901"],["Open Rate","42.7%"],["Growth","+8.4%"]], records: ["Weekly Prop Digest","August Offers Roundup","Rules Update Alert","Payout Proof Highlights","Beginner Learning Series","Community Event Invite"] },
    "firm-details": { title: "Firm Detail CMS", subtitle: "Manage public firm profiles, programs, metrics and visibility.", stats: [["Listed Firms","14"],["Published","13"],["Drafts","1"],["Updated Today","4"]], records: ["Finotive Funding","FundedFun","FXIFY","Goat Funded Trader","FundedNext","Blueberry Funded"] },
    "page-copy": { title: "Page Copy CMS", subtitle: "Manage headings, descriptions and reusable public-page copy.", stats: [["Managed Pages","66"],["Content Blocks","412"],["Draft Changes","18"],["Published Today","9"]], records: ["Homepage hero","Best Prop Firms intro","Reviews directory heading","Offers page FAQ","Compare page description","Rules hub content"] }
  };

  function seeded(index, salt = 0) {
    let value = Math.sin((index + 1) * 9301 + salt * 49297) * 233280;
    return value - Math.floor(value);
  }
  function pick(list, index, salt) { return list[Math.floor(seeded(index, salt) * list.length) % list.length]; }
  function money(value) { return `$${Math.round(value).toLocaleString("en-US")}`; }
  function isoDate(daysBack) { const date = new Date(Date.UTC(2026, 7, 4)); date.setUTCDate(date.getUTCDate() - daysBack); return date.toISOString().slice(0, 10); }
  function escapeHtml(value = "") { return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]); }
  function initials(user) { return `${user.firstName[0] || ""}${user.lastName[0] || ""}`.toUpperCase(); }

  function signupVolumeForDay(day) {
    return signupVolumes[day] || 4 + Math.floor(seeded(day,91) * 72);
  }

  function joinedDayForIndex(index) {
    let remaining = index;
    let day = 0;
    while (remaining >= signupVolumeForDay(day)) {
      remaining -= signupVolumeForDay(day);
      day += 1;
    }
    return day;
  }

  function buildUsers() {
    const usedEmails = new Set();
    return Array.from({ length: TOTAL_USERS }, (_, index) => {
      const country = countries[index % countries.length];
      const firstName = pick(country.first, index, 1);
      const lastName = pick(country.last, index, 2);
      const city = pick(country.cities, index, 3);
      const joinedDaysAgo = joinedDayForIndex(index);
      const purchases = joinedDaysAgo <= 3 ? recentPurchasePattern[index % recentPurchasePattern.length] : 0;
      const useProfileName = seeded(index,30) < .72;
      const emailFirst = useProfileName ? firstName : pick(emailAliasFirst,index,31);
      const emailLast = useProfileName ? lastName : pick(emailAliasLast,index,32);
      let emailNumber = 1 + Math.floor(seeded(index,33) * 997);
      const domain = pick(emailDomains,index,34);
      let email = `${emailFirst}${emailNumber}${emailLast}`.toLowerCase().replace(/[^a-z0-9@.]/g,"") + `@${domain}`;
      while (usedEmails.has(email)) {
        emailNumber = emailNumber % 997 + 1;
        email = `${emailFirst}${emailNumber}${emailLast}`.toLowerCase().replace(/[^a-z0-9@.]/g,"") + `@${domain}`;
      }
      usedEmails.add(email);
      const referrals = Math.floor(seeded(index, 5) * 38);
      const banned = index > 0 && index % 173 === 0;
      const inactive = !banned && index % 7 === 0;
      const status = banned ? "Banned" : inactive ? "Inactive" : "Active";
      const points = Math.floor(seeded(index, 6) * 7200);
      const totalSpend = purchases * (39 + Math.floor(seeded(index, 7) * 420));
      return {
        id: `RMP-${String(TOTAL_USERS - index).padStart(6, "0")}`,
        firstName, lastName,
        email,
        whatsapp: `${country.code} ${String(7000000000 + ((index * 7919) % 2999999999)).slice(0,10)}`,
        country: country.name, city, address: `${18 + index % 220}, ${city} Central`,
        status, banned, onboardingCompleted: index % 11 !== 0,
        _createdMs: Date.UTC(2026,7,4) - joinedDaysAgo * 86400000,
        joined: isoDate(joinedDaysAgo), lastActive: isoDate(Math.min(joinedDaysAgo, index % (inactive ? 92 : 14))),
        activeFirm: pick(firms,index,9), traderStyle: pick(styles,index,10), yearsInProp: 1 + index % 8,
        purchases, totalSpend, cashback: Math.floor(totalSpend * (.02 + seeded(index,11) * .05)),
        claims: Math.floor(seeded(index,12) * 5), reviews: Math.floor(seeded(index,13) * 8), referrals,
        lifetimePayout: Math.floor(seeded(index,14) * 82000), fundedAccounts: Math.floor(seeded(index,15) * 6),
        balanceDisplay: money(seeded(index,16) * 5800), cashpointsDisplay: points.toLocaleString("en-US"), accountsValueDisplay: money(Math.floor(seeded(index,17) * 8) * 25000),
        referralCommissionPct: 8 + index % 8, referralTierName: tiers[Math.min(3, Math.floor(referrals / 10))],
        leaderboardManualRank: 1 + (index * 37) % TOTAL_USERS, leaderboardManualPoints: points
      };
    });
  }

  function timestampMillis(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    if (typeof value?.seconds === "number") return value.seconds * 1000;
    const parsed = new Date(value || 0).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function dateFromTimestamp(value) {
    const millis = timestampMillis(value);
    return millis ? new Date(millis).toISOString().slice(0,10) : isoDate(0);
  }

  function normalizeClientIdentity(snapshot) {
    const data = snapshot.data() || {};
    const fullName = String(data.fullName || "").trim();
    const firstName = String(data.firstName || fullName.split(" ")[0] || "").trim();
    const lastName = String(data.lastName || fullName.split(" ").slice(1).join(" ") || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    if (!email || !email.includes("@") || (!firstName && !lastName)) return null;
    return { id:snapshot.id, firstName:firstName || "Trader", lastName, email, _createdMs:timestampMillis(data.updatedAt || data.createdAt) };
  }

  function normalizeLiveUser(snapshot) {
    const data = snapshot.data() || {};
    const country = String(data.country || "").trim();
    if (!country) return null;
    const identity = normalizeClientIdentity(snapshot) || { firstName:"New", lastName:"Client", email:"Email pending" };
    const createdMs = timestampMillis(data.createdAt || data.updatedAt);
    const joinedDaysAgo = Math.max(0,Math.floor((Date.UTC(2026,7,4) - (createdMs || Date.UTC(2026,7,4))) / 86400000));
    const rawPurchases = Math.max(0,Number(data.purchases ?? data.purchaseCount ?? 0) || 0);
    const purchases = joinedDaysAgo < 10 ? Math.min(1,rawPurchases) : Math.min(4,rawPurchases);
    const banned = Boolean(data.banned);
    return {
      id: snapshot.id,
      live: true,
      isNew: createdMs > 0 && Date.now() - createdMs <= 86400000,
      _createdMs: createdMs,
      firstName: identity.firstName,
      lastName: identity.lastName,
      email: identity.email,
      whatsapp: String(data.whatsapp || "Hidden"),
      country,
      city: String(data.city || "Not provided"),
      address: String(data.address || "Not provided"),
      status: banned ? "Banned" : "Active",
      banned,
      onboardingCompleted: Boolean(data.onboardingCompleted),
      joined: dateFromTimestamp(data.createdAt || data.updatedAt),
      lastActive: dateFromTimestamp(data.lastActive || data.updatedAt || data.createdAt),
      activeFirm: String(data.activeFirm || "Not selected"),
      traderStyle: String(data.traderStyle || "Not selected"),
      yearsInProp: Number(data.yearsInProp || 0),
      purchases,
      totalSpend: Number(data.totalSpend || 0),
      cashback: Number(data.cashback || 0),
      claims: Number(data.claims || 0),
      reviews: Number(data.reviews || 0),
      referrals: Number(data.referrals || 0),
      lifetimePayout: Number(data.lifetimePayout || 0),
      fundedAccounts: Number(data.fundedAccounts || 0),
      balanceDisplay: String(data.balanceDisplay || "$0"),
      cashpointsDisplay: String(data.cashpointsDisplay || "0"),
      accountsValueDisplay: String(data.accountsValueDisplay || "$0"),
      referralCommissionPct: Number(data.referralCommissionPct || 0),
      referralTierName: String(data.referralTierName || "Starter"),
      leaderboardManualRank: Number(data.leaderboardManualRank || 0),
      leaderboardManualPoints: Number(data.leaderboardManualPoints || 0)
    };
  }

  async function connectLiveRegistrations() {
    const usersCollection = collection(db,"users");
    const baselineRef = doc(db,"siteSettings","operationsConsoleEligibleClientBaseline");
    let baselineEligibleCount = null;
    try {
      const baselineSnapshot = await getDoc(baselineRef);
      if (baselineSnapshot.exists() && Number.isFinite(Number(baselineSnapshot.data().eligibleUserCount))) baselineEligibleCount = Number(baselineSnapshot.data().eligibleUserCount);
    } catch (error) {
      console.warn("Operations console baseline could not be persisted.",error);
    }

    let previousEligibleIds = null;
    onSnapshot(usersCollection,async (snapshot) => {
      const liveUsers = [];
      const pendingClientIdentities = [];
      snapshot.forEach(userSnapshot => {
        const normalized = normalizeLiveUser(userSnapshot);
        if (normalized) {
          liveUsers.push(normalized);
          return;
        }
        const identity = normalizeClientIdentity(userSnapshot);
        if (identity) pendingClientIdentities.push(identity);
      });
      liveUsers.sort((a,b) => b._createdMs - a._createdMs);
      pendingClientIdentities.sort((a,b) => b._createdMs - a._createdMs);
      const eligibleIds = new Set(liveUsers.map(user => user.id));
      const additions = previousEligibleIds ? liveUsers.filter(user => !previousEligibleIds.has(user.id)) : [];
      if (baselineEligibleCount === null) {
        baselineEligibleCount = liveUsers.length;
        try {
          await setDoc(baselineRef,{ eligibleUserCount:baselineEligibleCount, displayUserCount:TOTAL_USERS, createdAt:serverTimestamp() },{ merge:true });
        } catch (error) {
          console.warn("Eligible client baseline could not be saved.",error);
        }
      }
      const baselineGeneratedCount = Math.max(0,TOTAL_USERS - baselineEligibleCount);
      const baselineDisplayUsers = state.baselineUsers.slice(0,baselineGeneratedCount).map((user,index) => {
        const identity = pendingClientIdentities[index];
        return identity ? { ...user, firstName:identity.firstName, lastName:identity.lastName, email:identity.email } : user;
      });
      state.liveUsers = liveUsers;
      state.users = [...liveUsers,...baselineDisplayUsers].sort((a,b) => (b._createdMs || 0) - (a._createdMs || 0));
      state.liveConnected = true;
      state.dataReady = true;
      if(additions.length) state.page = 1;
      previousEligibleIds = eligibleIds;
      clientCountBadge.textContent = state.users.length.toLocaleString("en-US");
      if (state.view === "client-access") renderClients();
      if (state.view === "admin-home") renderHome();
      if (additions.length) showToast(`${additions.length} new client${additions.length===1?"":"s"} added live`);
    },(error) => {
      state.liveConnected = false;
      state.dataReady = true;
      console.error("Live registration feed unavailable.",error);
      showToast("Live registration feed could not connect");
      if (state.view === "client-access") renderClients();
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1900);
  }
  function statusMarkup(status) { return `<span class="status ${String(status).toLowerCase()}">${escapeHtml(status)}</span>`; }
  function statCards(items) { return `<section class="cards">${items.map(([label,value,detail]) => `<article class="card"><h3>${escapeHtml(label)}</h3><div class="metric-value">${escapeHtml(value)}</div>${detail ? `<small class="metric-detail">${escapeHtml(detail)}</small>` : ""}</article>`).join("")}</section>`; }

  function renderHome() {
    const quick = [
      ["client-access","CA","Client Access","Search and inspect 12,842 user profiles."], ["support-access","SA","Support Access","Manage access and support submissions."], ["moderation","MO","Moderation","Review claims, cashback and reports."],
      ["reviews","RH","Reviews Hub","Moderate trader reviews and proof."], ["offers","OF","Offers Control","Manage discounts and partner links."], ["firm-details","FD","Firm Detail CMS","Update firm programs and profile data."],
      ["prop-news","PN","Prop News CMS","Create and manage news content."], ["activity","RA","Recent Activity","Monitor platform-wide events."], ["newsletter","NL","Newsletter","Manage subscribers and campaigns."]
    ];
    viewHost.innerHTML = `${statCards([["Total Users",state.users.length.toLocaleString("en-US"),"Registered clients with live signup updates"],["Cashback Requests","184","38 added this week"],["Pending Claims","27","9 require verification"],["Pending Reviews","63","Average queue time 4h"]])}
      <section class="panel"><div class="panel-head"><div><h3>Quick Admin Actions</h3><p>Open a management workspace.</p></div></div><div class="quick-grid">${quick.map(([view,icon,title,text]) => `<a class="quick-card" href="#${view}" data-open-view="${view}"><span>${icon}</span><h3>${title}</h3><p>${text}</p></a>`).join("")}</div></section>
      <section class="panel"><div class="panel-head"><div><h3>Recent Platform Activity</h3><p>Latest events across clients and content.</p></div><button class="btn" data-open-view="activity">View all</button></div>${activityRows()}</section>`;
  }

  function activityRows() {
    const rows = [["NU","New user joined","Aarav Sharma completed onboarding","2 min ago"],["RV","Review submitted","FX2 Funding review entered moderation","8 min ago"],["PO","Purchase tracked","Blueberry Funded $100K challenge","13 min ago"],["CB","Cashback request","Request RMP-CB-9482 needs review","21 min ago"],["PN","Article published","August prop-firm rules update","34 min ago"]];
    return `<div class="activity-feed">${rows.map(([icon,title,text,time]) => `<div class="activity-row"><span class="activity-icon">${icon}</span><div><strong>${title}</strong><p>${text}</p></div><time>${time}</time></div>`).join("")}</div>`;
  }

  function filteredUsers() {
    const query = state.search.trim().toLowerCase();
    return state.users.filter((user) => {
      if (state.country !== "all" && user.country !== state.country) return false;
      if (state.status !== "all" && user.status.toLowerCase() !== state.status) return false;
      return !query || `${user.id} ${user.firstName} ${user.lastName} ${user.email} ${user.country}`.toLowerCase().includes(query);
    });
  }

  function renderClients() {
    if (!state.dataReady) {
      viewHost.innerHTML = clientAccessSkeleton();
      return;
    }
    const rows = filteredUsers();
    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    state.page = Math.min(state.page, pageCount);
    const start = (state.page - 1) * PAGE_SIZE;
    const visible = rows.slice(start, start + PAGE_SIZE);
    viewHost.innerHTML = `${statCards([["Total Clients",state.users.length.toLocaleString("en-US"),"Registered client profiles in the system"],["Active",state.users.filter(u=>u.status==="Active").length.toLocaleString("en-US"),"Frequent purchasers who log in, explore offers and stay active across the website."],["Onboarding Pending",state.users.filter(u=>!u.onboardingCompleted).length.toLocaleString("en-US"),"Profile completion required"],["Banned",state.users.filter(u=>u.banned).length.toLocaleString("en-US"),"Restricted accounts"]])}
      <section class="panel">
        <div class="panel-head"><div><h3>All Clients</h3><p>Search, filter and open complete user records.</p></div><div class="panel-actions"><button class="btn-primary" id="exportUsers">Export CSV</button></div></div>
        <div class="toolbar"><input id="clientSearch" value="${escapeHtml(state.search)}" placeholder="Search UID, email or name…" /><select id="countryFilter"><option value="all">All countries</option>${countries.map(c=>`<option ${state.country===c.name?"selected":""}>${c.name}</option>`).join("")}</select><select id="statusFilter"><option value="all">All statuses</option>${["active","inactive","banned"].map(s=>`<option value="${s}" ${state.status===s?"selected":""}>${s[0].toUpperCase()+s.slice(1)}</option>`).join("")}</select><button class="btn" id="resetClientFilters">Reset filters</button></div>
        <div class="table-wrap"><table><thead><tr><th>Client</th><th>UID</th><th>Country</th><th>WhatsApp</th><th>Joined</th><th>Purchases</th><th>Status</th><th>Action</th></tr></thead><tbody>${visible.length ? visible.map(user => `<tr><td><div class="client-cell"><span class="client-avatar">${initials(user)}</span><div><strong>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}${user.isNew?'<span class="new-client-label">NEW</span>':""}</strong><small>${escapeHtml(user.email)}</small></div></div></td><td>${user.id}</td><td>${escapeHtml(user.country)}</td><td><span class="private-value" aria-label="WhatsApp number hidden">••••••••••••</span></td><td>${user.joined}</td><td>${user.purchases}</td><td>${statusMarkup(user.status)}</td><td><div class="row-actions"><button class="btn" data-open-user="${user.id}">Open</button><button class="btn ${user.banned?"":"btn-danger"}" data-toggle-ban="${user.id}">${user.banned?"Unban":"Ban"}</button></div></td></tr>`).join("") : `<tr><td colspan="8"><div class="empty-state">No clients match these filters.</div></td></tr>`}</tbody></table></div>
        ${paginationMarkup(rows.length,pageCount,start,visible.length)}
      </section>`;
  }

  function clientAccessSkeleton() {
    const rows = Array.from({length:9},(_,index) => `<tr class="skeleton-row" aria-hidden="true"><td><div class="skeleton-client"><span class="skeleton-block skeleton-avatar"></span><div><span class="skeleton-block skeleton-name"></span><span class="skeleton-block skeleton-email"></span></div></div></td><td><span class="skeleton-block skeleton-uid"></span></td><td><span class="skeleton-block skeleton-country"></span></td><td><span class="skeleton-block skeleton-phone"></span></td><td><span class="skeleton-block skeleton-date"></span></td><td><span class="skeleton-block skeleton-number"></span></td><td><span class="skeleton-block skeleton-status"></span></td><td><span class="skeleton-block skeleton-action"></span></td></tr>`).join("");
    return `<section class="cards skeleton-cards" aria-label="Loading client statistics">${Array.from({length:4},()=>`<article class="card"><span class="skeleton-block skeleton-card-title"></span><span class="skeleton-block skeleton-card-value"></span><span class="skeleton-block skeleton-card-copy"></span></article>`).join("")}</section><section class="panel skeleton-panel" aria-busy="true"><div class="panel-head"><div><span class="skeleton-block skeleton-heading"></span><span class="skeleton-block skeleton-subheading"></span></div></div><div class="skeleton-toolbar"><span class="skeleton-block"></span><span class="skeleton-block"></span><span class="skeleton-block"></span><span class="skeleton-block"></span></div><div class="table-wrap"><table><thead><tr><th>Client</th><th>UID</th><th>Country</th><th>WhatsApp</th><th>Joined</th><th>Purchases</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div><div class="skeleton-loading-note"><span class="skeleton-spinner"></span>Loading client records…</div></section>`;
  }

  function paginationMarkup(total,pageCount,start,visibleCount) {
    const pages = [...new Set([1,state.page-1,state.page,state.page+1,pageCount].filter(p=>p>=1&&p<=pageCount))];
    return `<div class="pagination"><span>Showing ${total ? start+1 : 0}–${start+visibleCount} of ${total.toLocaleString("en-US")} clients</span><div class="pagination-controls"><button class="page-button" data-page="${state.page-1}" ${state.page===1?"disabled":""}>←</button>${pages.map((page,index)=>`${index&&page-pages[index-1]>1?"<span>…</span>":""}<button class="page-button ${page===state.page?"active":""}" data-page="${page}">${page}</button>`).join("")}<button class="page-button" data-page="${state.page+1}" ${state.page===pageCount?"disabled":""}>→</button></div></div>`;
  }

  function ensureModuleRecords(view) {
    const config = moduleConfigs[view];
    const statuses = ["Published","Pending","Approved","Draft","Active","Rejected"];
    config.records = config.records.map((record,index) => typeof record === "string" ? {
      title: record, status: statuses[index % statuses.length], updatedHours: index + 1,
      meta1: `RMP-${String(index + 1).padStart(4,"0")}`, meta2: `${index + 1}h ago`, notes: config.subtitle
    } : record);
    return config.records;
  }

  function moduleUi(view) {
    if (!state.moduleUi[view]) state.moduleUi[view] = { search:"", status:"all", sort:"newest" };
    return state.moduleUi[view];
  }

  function renderModule(view) {
    const config = moduleConfigs[view];
    const ui = moduleUi(view);
    let records = ensureModuleRecords(view).map((record,index) => ({ ...record, sourceIndex:index }));
    const query = ui.search.trim().toLowerCase();
    records = records.filter(record => (!query || `${record.title} ${record.notes} ${record.meta1} ${record.meta2}`.toLowerCase().includes(query)) && (ui.status === "all" || record.status.toLowerCase() === ui.status));
    records.sort((a,b) => ui.sort === "oldest" ? b.updatedHours - a.updatedHours : ui.sort === "az" ? a.title.localeCompare(b.title) : a.updatedHours - b.updatedHours);
    viewHost.innerHTML = `${statCards(config.stats)}<section class="panel"><div class="panel-head"><div><h3>${escapeHtml(config.title)} Records</h3><p>${records.length} records shown • changes are saved in this preview session.</p></div><div class="panel-actions"><button class="btn" data-action="export">Export</button><button class="btn-primary" data-record-create="${view}">Create new</button></div></div><div class="toolbar"><input id="moduleSearch" value="${escapeHtml(ui.search)}" placeholder="Search ${escapeHtml(config.title.toLowerCase())}…" /><select id="moduleStatus"><option value="all">All statuses</option>${["active","approved","pending","published","draft","rejected"].map(status=>`<option value="${status}" ${ui.status===status?"selected":""}>${status[0].toUpperCase()+status.slice(1)}</option>`).join("")}</select><select id="moduleSort"><option value="newest" ${ui.sort==="newest"?"selected":""}>Newest first</option><option value="oldest" ${ui.sort==="oldest"?"selected":""}>Oldest first</option><option value="az" ${ui.sort==="az"?"selected":""}>A–Z</option></select><button class="btn" data-module-reset>Reset</button></div><div class="module-grid" id="moduleRecords">${records.length ? records.map(record=>`<article class="module-record"><header><h3>${escapeHtml(record.title)}</h3>${statusMarkup(record.status)}</header><p>${escapeHtml(record.notes || config.subtitle)}</p><div class="module-meta"><div><span>${view==="purchases"?"Order value":"Primary value"}</span><strong>${escapeHtml(record.meta1 || "—")}</strong></div><div><span>${view==="purchases"?"Account size":"Updated"}</span><strong>${escapeHtml(record.meta2 || `${record.updatedHours}h ago`)}</strong></div></div><div class="row-actions" style="margin-top:12px"><button class="btn" data-record-mode="open" data-record-view="${view}" data-record-index="${record.sourceIndex}">Open</button><button class="btn" data-record-mode="edit" data-record-view="${view}" data-record-index="${record.sourceIndex}">Edit</button></div></article>`).join("") : `<div class="empty-state">No records match these filters.</div>`}</div></section>`;
  }

  function openRecord(view,index,mode) {
    const config = moduleConfigs[view];
    const records = ensureModuleRecords(view);
    const creating = index < 0;
    const record = creating ? { title:"", status:"Draft", updatedHours:0, meta1:"", meta2:"", notes:"" } : records[index];
    if (!record) return;
    const readOnly = mode === "open";
    document.getElementById("recordDialogKicker").textContent = config.title.toUpperCase();
    document.getElementById("recordDialogTitle").textContent = creating ? `Create ${config.title} Record` : readOnly ? "Record Details" : "Edit Record";
    recordDialogBody.innerHTML = `<div class="record-form-body"><div class="record-summary"><div><span>Workspace</span><strong>${escapeHtml(config.title)}</strong></div><div><span>Record</span><strong>${creating?"New record":`#${index+1}`}</strong></div><div><span>Mode</span><strong>${creating?"Create":readOnly?"View":"Edit"}</strong></div></div><div class="preview-form-grid">
      <label class="preview-field full"><span>Title</span><input name="title" value="${escapeHtml(record.title)}" ${readOnly?"readonly":""}></label>
      <label class="preview-field"><span>Status</span><select name="status" ${readOnly?"disabled":""}>${["Active","Approved","Pending","Published","Draft","Rejected"].map(status=>`<option ${record.status===status?"selected":""}>${status}</option>`).join("")}</select></label>
      <label class="preview-field"><span>Updated hours ago</span><input name="updatedHours" type="number" min="0" value="${Number(record.updatedHours)||0}" ${readOnly?"readonly":""}></label>
      <label class="preview-field"><span>Primary value</span><input name="meta1" value="${escapeHtml(record.meta1||"")}" ${readOnly?"readonly":""}></label>
      <label class="preview-field"><span>Secondary value</span><input name="meta2" value="${escapeHtml(record.meta2||"")}" ${readOnly?"readonly":""}></label>
      <label class="preview-field full"><span>Notes / description</span><textarea name="notes" ${readOnly?"readonly":""}>${escapeHtml(record.notes||"")}</textarea></label>
      </div></div><div class="dialog-actions"><button class="btn" value="cancel">Close</button>${readOnly?"":`<button class="btn-primary" type="button" data-save-record data-record-view="${view}" data-record-index="${creating?-1:index}">${creating?"Create record":"Save changes"}</button>`}</div>`;
    recordDialog.showModal();
  }

  function openClient(userId) {
    const user = state.users.find(row => row.id === userId);
    if (!user) return;
    document.getElementById("clientDialogTitle").textContent = `${user.firstName} ${user.lastName}`;
    dialogBody.innerHTML = `<div class="client-profile"><div class="profile-fields"><div class="preview-form-grid">
      ${field("UID",user.id,"uid",true)}${field("Email",user.email,"email")}${field("First Name",user.firstName,"firstName")}${field("Last Name",user.lastName,"lastName")}${field("WhatsApp",user.whatsapp,"whatsapp",true,true)}${field("Country",user.country,"country")}${field("City",user.city,"city")}${field("Address",user.address,"address")}${field("Active Firm",user.activeFirm,"activeFirm")}${field("Trader Style",user.traderStyle,"traderStyle")}${field("Years In Prop",user.yearsInProp,"yearsInProp")}${field("Referral Tier",user.referralTierName,"referralTierName")}
      </div></div><div class="snapshot-stack"><article class="snapshot-card"><h3>Client Activity Snapshot</h3><div class="snapshot-grid">${[["Purchases",user.purchases],["Total Spend",money(user.totalSpend)],["Cashback",money(user.cashback)],["Claims",user.claims],["Reviews",user.reviews],["Referrals",user.referrals],["Funded Accounts",user.fundedAccounts],["Lifetime Payout",money(user.lifetimePayout)]].map(([k,v])=>`<div><span>${k}</span><strong>${v}</strong></div>`).join("")}</div></article><article class="snapshot-card"><h3>Account Status</h3><div class="snapshot-grid"><div><span>Status</span><strong>${user.status}</strong></div><div><span>Onboarding</span><strong>${user.onboardingCompleted?"Complete":"Pending"}</strong></div><div><span>Joined</span><strong>${user.joined}</strong></div><div><span>Last Active</span><strong>${user.lastActive}</strong></div></div></article></div></div><div class="dialog-actions"><button class="btn" value="cancel">Cancel</button><button class="btn-primary" type="button" data-save-user="${user.id}">Save Client Profile</button></div>`;
    dialog.showModal();
  }
  function field(label,value,name,readonly=false,isPrivate=false) { return `<label class="preview-field"><span>${label}</span><input type="${isPrivate?"password":"text"}" class="${isPrivate?"private-input":""}" name="${name}" value="${escapeHtml(value)}" ${readonly?"readonly":""}/></label>`; }

  function setView(view, updateHash = true) {
    if (view === "logout") { showToast("Logout preview completed"); return; }
    if (view === "client-dashboard") { titleEl.textContent = "Client Dashboard"; subtitleEl.textContent = "Client dashboard navigation preview."; viewHost.innerHTML = `${statCards([["Account Balance","$8,420"],["Cashpoints","4,860"],["Active Accounts","3"],["Lifetime Payout","$24,800"]])}<section class="panel"><div class="panel-head"><div><h3>Client Dashboard Preview</h3><p>This navigation remains inside the isolated prototype.</p></div><button class="btn-primary" data-open-view="admin-home">Return to Admin</button></div>${activityRows()}</section>`; }
    else if (view === "admin-home") { titleEl.textContent = "Admin Home"; subtitleEl.textContent = "Full client monitoring and content control panel."; renderHome(); }
    else if (view === "client-access") { titleEl.textContent = "Client Access"; subtitleEl.textContent = "Monitor user account activity and edit profile values."; renderClients(); }
    else if (moduleConfigs[view]) { titleEl.textContent = moduleConfigs[view].title; subtitleEl.textContent = moduleConfigs[view].subtitle; renderModule(view); }
    else { setView("admin-home",updateHash); return; }
    state.view = view;
    nav.querySelectorAll("[data-view]").forEach(link => link.classList.toggle("active", link.dataset.view === view));
    if (updateHash && location.hash !== `#${view}`) history.replaceState(null,"",`#${view}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  nav.addEventListener("click", event => { const link = event.target.closest("[data-view]"); if (!link) return; event.preventDefault(); setView(link.dataset.view); });
  viewHost.addEventListener("click", async event => {
    const openView = event.target.closest("[data-open-view]"); if (openView) return setView(openView.dataset.openView);
    const openUser = event.target.closest("[data-open-user]"); if (openUser) return openClient(openUser.dataset.openUser);
    const ban = event.target.closest("[data-toggle-ban]"); if (ban) { const user=state.users.find(row=>row.id===ban.dataset.toggleBan); if(user){ user.banned=!user.banned; user.status=user.banned?"Banned":"Active"; if(user.live) await setDoc(doc(db,"users",user.id),{banned:user.banned,bannedAt:user.banned?serverTimestamp():null,updatedAt:serverTimestamp()},{merge:true}); renderClients(); showToast(user.banned?"Client banned":"Client unbanned"); } return; }
    const page = event.target.closest("[data-page]"); if(page&&!page.disabled){ state.page=Number(page.dataset.page)||1; renderClients(); return; }
    if (event.target.closest("#resetClientFilters")) { state.search=""; state.country="all"; state.status="all"; state.page=1; renderClients(); return; }
    if (event.target.closest("#exportUsers")) return showToast("12,842 client records prepared for export");
    const createRecord = event.target.closest("[data-record-create]"); if (createRecord) return openRecord(createRecord.dataset.recordCreate,-1,"create");
    const recordAction = event.target.closest("[data-record-mode]"); if (recordAction) return openRecord(recordAction.dataset.recordView,Number(recordAction.dataset.recordIndex),recordAction.dataset.recordMode);
    if (event.target.closest("[data-module-reset]")) { state.moduleUi[state.view]={search:"",status:"all",sort:"newest"}; renderModule(state.view); return; }
    const action=event.target.closest("[data-action]"); if(action) showToast(`${action.dataset.action[0].toUpperCase()+action.dataset.action.slice(1)} action opened`);
  });
  viewHost.addEventListener("input", event => {
    if(event.target.id==="clientSearch"){ const cursor=event.target.selectionStart; state.search=event.target.value; state.page=1; renderClients(); const input=document.getElementById("clientSearch"); input?.focus(); input?.setSelectionRange(cursor,cursor); }
    if(event.target.id==="moduleSearch"){ const cursor=event.target.selectionStart; moduleUi(state.view).search=event.target.value; renderModule(state.view); const input=document.getElementById("moduleSearch"); input?.focus(); input?.setSelectionRange(cursor,cursor); }
  });
  viewHost.addEventListener("change", event => {
    if(event.target.id==="countryFilter"){state.country=event.target.value;state.page=1;renderClients();}
    if(event.target.id==="statusFilter"){state.status=event.target.value;state.page=1;renderClients();}
    if(event.target.id==="moduleStatus"){moduleUi(state.view).status=event.target.value;renderModule(state.view);}
    if(event.target.id==="moduleSort"){moduleUi(state.view).sort=event.target.value;renderModule(state.view);}
  });
  dialogBody.addEventListener("click", async event => { const save=event.target.closest("[data-save-user]"); if(!save)return; const user=state.users.find(row=>row.id===save.dataset.saveUser); if(!user)return; const updates={}; new FormData(document.getElementById("clientForm")).forEach((value,key)=>{if(key!=="uid"){user[key]=String(value);updates[key]=String(value)}}); if(user.live) await setDoc(doc(db,"users",user.id),{...updates,updatedAt:serverTimestamp()},{merge:true}); dialog.close(); renderClients(); showToast(user.live?"Live client profile updated":"Client profile updated for this session"); });
  recordDialogBody.addEventListener("click", event => {
    const save=event.target.closest("[data-save-record]"); if(!save)return;
    const view=save.dataset.recordView;
    const index=Number(save.dataset.recordIndex);
    const values=Object.fromEntries(new FormData(document.getElementById("recordForm")).entries());
    const record={ title:String(values.title||"Untitled record"), status:String(values.status||"Draft"), updatedHours:Math.max(0,Number(values.updatedHours)||0), meta1:String(values.meta1||"—"), meta2:String(values.meta2||"—"), notes:String(values.notes||"") };
    const records=ensureModuleRecords(view);
    if(index<0) records.unshift(record); else Object.assign(records[index],record);
    recordDialog.close();
    renderModule(view);
    showToast(index<0?"New record created":"Record changes saved");
  });
  document.getElementById("globalSearchButton").addEventListener("click",()=>{setView("client-access");requestAnimationFrame(()=>document.getElementById("clientSearch")?.focus())});
  window.addEventListener("hashchange",()=>setView(location.hash.slice(1)||"admin-home",false));

  state.baselineUsers = buildUsers();
  state.users = [...state.baselineUsers];
  setView(location.hash.slice(1) || "admin-home", false);
  bindLogout("logoutBtn");
  enforceAdmin(async user => {
    adminEmail.textContent = "shubhamsingh@rankmyprop.in";
    try {
      await connectLiveRegistrations();
    } catch (error) {
      state.liveConnected = false;
      state.dataReady = true;
      console.error("Unable to start the live registration feed.",error);
      showToast("Live registration feed could not connect");
      if(state.view==="client-access") renderClients();
    }
  });
})();
