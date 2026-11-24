const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const evidencePath = path.join(root, 'public', 'seo-evidence.json');
const firmsDataPath = path.join(root, 'public', 'firms-data.js');

// 1. Process seo-evidence.json
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

// Detach all existing firms from India
let detachedCount = 0;
const detachedNames = [];
for (const [slug, firm] of Object.entries(evidence.firms || {})) {
  if (slug === 'trade-bridges') continue;
  if (firm.bestRegions?.india === true || firm.country === 'India' || (Array.isArray(firm.tags) && firm.tags.some(t => String(t).toLowerCase().includes('india')))) {
    if (!firm.bestRegions) firm.bestRegions = {};
    firm.bestRegions.india = false;
    if (firm.country === 'India') {
      firm.country = 'Global';
    }
    if (Array.isArray(firm.tags)) {
      firm.tags = firm.tags.filter(t => !String(t).toLowerCase().includes('india'));
    }
    detachedCount++;
    detachedNames.push(firm.name || slug);
  }
}

// Define Trade Bridges exact data
const tradeBridgesFirm = {
  slug: "trade-bridges",
  name: "Trade Bridges",
  website: "https://tradebridges.in",
  buyLink: "https://tradebridges.in",
  detailsLink: "/prop-firms/trade-bridges",
  tagline: "We Fund. You Trade.",
  founded: "2025",
  years: 1,
  founder: "Akash Motwani — trader and investor with over 5 years of experience",
  hq: "Lucknow, Uttar Pradesh, India",
  country: "India",
  incorporationDate: "23 December 2025",
  registrationTypeAndNumber: "Not yet confirmed",
  regulatoryStatus: "Not registered or regulated by any financial authority",
  verticals: ["India-based", "funded trading evaluation programme"],
  mission: "To create opportunities for skilled Indian traders by providing structured trading programmes, transparent rules, and performance-based profit-sharing opportunities.",
  bio: "Trade Bridges was established in 2025 with the objective of providing Indian traders with access to structured funded trading evaluation programmes, helping traders demonstrate their skills through structured challenges and performance-based reward programmes.",
  overviewShort: "Trade Bridges was established in 2025 with the objective of providing Indian traders with access to structured funded trading evaluation programmes, helping traders demonstrate their skills through structured challenges and performance-based reward programmes.",
  overviewLong: "Trade Bridges was established in 2025 with the objective of providing Indian traders with access to structured funded trading evaluation programmes, helping traders demonstrate their skills through structured challenges and performance-based reward programmes. Founder Akash Motwani brings over 5 years of trading and investment experience.",
  logo: "",
  score: null,
  reviewCount: 0,
  verified: false,
  payoutAssurance: false,
  sortOrder: 1,
  ranking: 1,
  listingType: "best",
  showListed: false,
  showBestGlobal: false,
  showFirmProfile: true,
  showRules: true,
  showReviews: false,
  showOffers: false,
  showComparison: false,
  markets: ["Funded Trading Evaluation Programme"],
  tags: ["India-based", "Funded Trading Evaluation Programme"],
  bestRegions: {
    india: true,
    us: false,
    uk: false,
    australia: false,
    china: false,
    pakistan: false,
    nigeria: false,
    south_africa: false
  },
  bestCategories: {
    highest_rated: false,
    beginner: false,
    futures: false,
    trusted: false,
    fast_payout: false,
    hft: false,
    cheapest: false,
    instant_funding: true
  },
  lastVerified: "2026-11-24",
  source: "Trade Bridges company documents",
  cardMetrics: {
    payoutCycle: "14 Days",
    minTradingDays: "5 Days (2-Step, 1-Step)",
    newsTrading: "Not allowed",
    timeLimit: "Unlimited",
    eaAllowed: "Not allowed",
    startingPrice: "Not specified"
  },
  keyMetrics: [
    { label: "Founded", value: "2025" },
    { label: "Profit Split", value: "80% - 90%" },
    { label: "Payout Cycle", value: "Every 14 days" },
    { label: "Minimum Payout", value: "₹5,000" },
    { label: "Daily Loss Limit", value: "4% - 5%" },
    { label: "Maximum Drawdown", value: "7% - 10%" }
  ],
  tradingConditions: [
    { label: "Daily Drawdown", value: "4% - 5% (Not specified if balance or equity for 1-Step/2-Step)" },
    { label: "Maximum Drawdown", value: "7% - 10% (Instant: 7% EOD; 1-Step/2-Step: type not specified)" },
    { label: "News Trading", value: "Not allowed" },
    { label: "Weekend Positions", value: "Not allowed" },
    { label: "Overnight Positions", value: "Not allowed" },
    { label: "Copy Trading", value: "Not allowed" },
    { label: "EA / Automated Bots", value: "Not allowed" },
    { label: "Account Sharing", value: "Strictly prohibited" },
    { label: "Multiple Accounts", value: "Allowed" },
    { label: "Consistency Rule", value: "30% (Applies to all models including Instant Funding)" }
  ],
  firmDetails: [
    { label: "Company Name", value: "Trade Bridges" },
    { label: "Headquarters", value: "Lucknow, Uttar Pradesh, India" },
    { label: "Founder / CEO", value: "Akash Motwani — trader and investor with over 5 years of experience" },
    { label: "Incorporation Date", value: "23 December 2025" },
    { label: "Registration Type & Number", value: "Not yet confirmed" },
    { label: "Regulatory Status", value: "Not registered or regulated by any financial authority" },
    { label: "Trading Platform", value: "Trade Bridges proprietary platform (desktop and mobile; live market data and charts)" },
    { label: "Purchase Methods", value: "UPI; card payments also listed" },
    { label: "Currency", value: "INR only (International payments not accepted)" },
    { label: "Payout Methods", value: "UPI, bank transfer (Processing: 24–48 hours; Mandatory KYC)" },
    { label: "Minimum Age", value: "18" },
    { label: "Eligibility", value: "All countries eligible subject to applicable laws and company policies (Note: INR only, international payments not accepted)" },
    { label: "Refund Policy", value: "Governed by official refund policy (https://tradebridges.in)" },
    { label: "Activation / Hidden Fees", value: "None" }
  ],
  programs: [
    {
      program: "2-Step Evaluation",
      model: "2-Step",
      target: "12% (Phase 1), 6% (Phase 2)",
      phase1: "12%",
      phase2: "6%",
      dailyLoss: "5% (Not specified if balance or equity)",
      maxDrawdown: "10% (Not specified if static or trailing)",
      consistencyRule: "30%",
      minDays: "5 days",
      maxDays: "Unlimited",
      payoutCycle: "14 days",
      split: "80%"
    },
    {
      program: "1-Step Evaluation",
      model: "1-Step",
      target: "12%",
      phase1: "12%",
      phase2: "N/A",
      dailyLoss: "5% (Not specified if balance or equity)",
      maxDrawdown: "8% (Not specified if static or trailing)",
      consistencyRule: "30%",
      minDays: "5 days",
      maxDays: "Unlimited",
      payoutCycle: "14 days",
      split: "80%"
    },
    {
      program: "Instant Funding",
      model: "Instant Funding",
      target: "None listed",
      phase1: "None listed",
      phase2: "N/A",
      dailyLoss: "4%",
      maxDrawdown: "7% EOD",
      consistencyRule: "30%",
      minDays: "Not specified for Instant Funding",
      maxDays: "Unlimited",
      payoutCycle: "14 days",
      split: "Up to 90%"
    }
  ],
  evaluationPrograms: [
    {
      program: "2-Step Evaluation",
      model: "2-Step",
      target: "12% (Phase 1), 6% (Phase 2)",
      phase1: "12%",
      phase2: "6%",
      dailyLoss: "5%",
      maxDrawdown: "10%",
      consistencyRule: "30%",
      minDays: "5 days",
      maxDays: "Unlimited",
      payoutCycle: "14 days",
      split: "80%",
      allocation: "Not specified",
      leverage: "Not specified"
    },
    {
      program: "1-Step Evaluation",
      model: "1-Step",
      target: "12%",
      phase1: "12%",
      dailyLoss: "5%",
      maxDrawdown: "8%",
      consistencyRule: "30%",
      minDays: "5 days",
      maxDays: "Unlimited",
      payoutCycle: "14 days",
      split: "80%",
      allocation: "Not specified",
      leverage: "Not specified"
    },
    {
      program: "Instant Funding",
      model: "Instant Funding",
      target: "None listed",
      phase1: "None listed",
      dailyLoss: "4%",
      maxDrawdown: "7% EOD",
      consistencyRule: "30%",
      minDays: "Not specified for Instant Funding",
      maxDays: "Unlimited",
      payoutCycle: "14 days",
      split: "Up to 90%",
      allocation: "Not specified",
      leverage: "Not specified"
    }
  ]
};

evidence.firms['trade-bridges'] = tradeBridgesFirm;
if (!evidence.reviews) evidence.reviews = {};
evidence.reviews['trade-bridges'] = [];

fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), 'utf8');
console.log(`[seo-evidence] Detached ${detachedCount} firms from India: ${detachedNames.join(', ')}`);
console.log(`[seo-evidence] Added Trade Bridges as the sole India firm.`);

// 2. Process firms-data.js
let firmsDataContent = fs.readFileSync(firmsDataPath, 'utf8');

// Replace bestRegions: { india: true } on any non-Trade-Bridges firms
firmsDataContent = firmsDataContent.replace(/bestRegions:\s*\{\s*india:\s*true\s*\}/g, 'bestRegions: { india: false }');
firmsDataContent = firmsDataContent.replace(/handle:\s*"@blueberryfundedindia"/g, 'handle: "@blueberryfunded"');

// Check if Trade Bridges is already in DEFAULT_BEST_FIRMS
if (!firmsDataContent.includes('slug: "trade-bridges"') && !firmsDataContent.includes('name: "Trade Bridges"')) {
  const tradeBridgesJsCode = `  {
    name: "Trade Bridges",
    slug: "trade-bridges",
    id: "trade-bridges",
    website: "https://tradebridges.in",
    buyLink: "https://tradebridges.in",
    detailsLink: "/prop-firms/trade-bridges",
    tagline: "We Fund. You Trade.",
    founded: 2025,
    years: 1,
    founder: "Akash Motwani — trader and investor with over 5 years of experience",
    hq: "Lucknow, Uttar Pradesh, India",
    country: "India",
    incorporationDate: "23 December 2025",
    registrationTypeAndNumber: "Not yet confirmed",
    regulatoryStatus: "Not registered or regulated by any financial authority",
    markets: ["Funded Trading Evaluation Programme"],
    tags: ["India-based", "Funded Trading Evaluation Programme"],
    bio: "Trade Bridges was established in 2025 with the objective of providing Indian traders with access to structured funded trading evaluation programmes, helping traders demonstrate their skills through structured challenges and performance-based reward programmes.",
    logo: "",
    score: null,
    reviewCount: 0,
    verified: false,
    payoutAssurance: false,
    sortOrder: 1,
    listingType: "best",
    showListed: false,
    showBestGlobal: false,
    showFirmProfile: true,
    showRules: true,
    showReviews: false,
    showOffers: false,
    showComparison: false,
    bestRegions: { india: true },
    lastVerified: "2026-11-24",
    source: "Trade Bridges company documents",
    cardMetrics: {
      payoutCycle: "14 Days",
      minTradingDays: "5 Days (2-Step, 1-Step)",
      newsTrading: "Not allowed",
      timeLimit: "Unlimited",
      eaAllowed: "Not allowed",
      startingPrice: "Not specified"
    },
    keyMetrics: [
      { label: "Founded", value: "2025" },
      { label: "Profit Split", value: "80% - 90%" },
      { label: "Payout Cycle", value: "Every 14 days" },
      { label: "Minimum Payout", value: "₹5,000" },
      { label: "Daily Loss Limit", value: "4% - 5%" },
      { label: "Maximum Drawdown", value: "7% - 10%" }
    ],
    tradingConditions: [
      { label: "News Trading", value: "Not allowed" },
      { label: "Weekend Positions", value: "Not allowed" },
      { label: "Overnight Positions", value: "Not allowed" },
      { label: "Copy Trading", value: "Not allowed" },
      { label: "EA / Automated Bots", value: "Not allowed" },
      { label: "Consistency Rule", value: "30%" }
    ],
    firmDetails: [
      { label: "Company Name", value: "Trade Bridges" },
      { label: "Headquarters", value: "Lucknow, Uttar Pradesh, India" },
      { label: "Founder / CEO", value: "Akash Motwani — trader and investor with over 5 years of experience" },
      { label: "Incorporation Date", value: "23 December 2025" },
      { label: "Registration Type & Number", value: "Not yet confirmed" },
      { label: "Regulatory Status", value: "Not registered or regulated by any financial authority" },
      { label: "Trading Platform", value: "Trade Bridges proprietary platform" },
      { label: "Purchase Methods", value: "UPI; card payments also listed" },
      { label: "Currency", value: "INR only" }
    ],
    evaluationPrograms: [
      {
        program: "2-Step Evaluation",
        model: "2-Step",
        target: "12% (Phase 1), 6% (Phase 2)",
        phase1: "12%",
        phase2: "6%",
        dailyLoss: "5%",
        maxDrawdown: "10%",
        consistencyRule: "30%",
        minDays: "5 days",
        maxDays: "Unlimited",
        payoutCycle: "14 days",
        split: "80%",
        allocation: "Not specified",
        leverage: "Not specified"
      },
      {
        program: "1-Step Evaluation",
        model: "1-Step",
        target: "12%",
        phase1: "12%",
        dailyLoss: "5%",
        maxDrawdown: "8%",
        consistencyRule: "30%",
        minDays: "5 days",
        maxDays: "Unlimited",
        payoutCycle: "14 days",
        split: "80%",
        allocation: "Not specified",
        leverage: "Not specified"
      },
      {
        program: "Instant Funding",
        model: "Instant Funding",
        target: "None listed",
        phase1: "None listed",
        dailyLoss: "4%",
        maxDrawdown: "7% EOD",
        consistencyRule: "30%",
        minDays: "Not specified for Instant Funding",
        maxDays: "Unlimited",
        payoutCycle: "14 days",
        split: "Up to 90%",
        allocation: "Not specified",
        leverage: "Not specified"
      }
    ],
    active: true
  },
`;
  firmsDataContent = firmsDataContent.replace('export const DEFAULT_BEST_FIRMS = [', `export const DEFAULT_BEST_FIRMS = [\n${tradeBridgesJsCode}`);
}

fs.writeFileSync(firmsDataPath, firmsDataContent, 'utf8');
console.log(`[firms-data] firms-data.js updated idempotently.`);
