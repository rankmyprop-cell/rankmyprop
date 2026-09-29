const fs = require('fs')
const path = require('path')

const PROJECT_ID = 'rank-my-prop'
const FIRM_ID = 'upcomers'
const FIREBASE_CONFIG = path.join(process.env.HOME, '.config/configstore/firebase-tools.json')

const notMentioned = 'Not mentioned'
const now = new Date()

const programs = [
  {
    program: 'Ash', slug: 'ash', phase1: '2%', phase2: 'Not applicable', target: '2%',
    dailyLoss: '3%', maxDrawdown: '6% dynamic', minimumDays: 'None', timeLimit: 'Unlimited',
    allocation: 'Up to $1,000,000', split: '80% to 100%', leverage: '1:100',
    accountSizes: '$5K, $10K, $25K, $50K, $100K, $200K, $300K, $400K, $500K, $600K, $700K, $800K, $900K, $1M',
    fundedRisk: '3% daily drawdown, 6% dynamic maximum drawdown, 3% maximum single-trade loss',
    payout: '20% Best Day soft payout gate; at least 1% profit before a payout request',
    features: ['Challenge Half Step', 'No minimum trading days', '90% standard profit split; 80% or 100% may be selected at checkout']
  },
  {
    program: 'Ash Turbo', slug: 'ash-turbo', phase1: '2%', phase2: 'Not applicable', target: '2%',
    dailyLoss: '3%', maxDrawdown: '6% dynamic', minimumDays: 'Minimum 1; maximum 7 trading days', timeLimit: '30 calendar days',
    allocation: notMentioned, split: '80% to 100%', leverage: '1:100', accountSizes: notMentioned,
    fundedRisk: '3% daily drawdown, 6% dynamic maximum drawdown, 1.5% maximum single-trade loss',
    payout: '5 qualifying days of at least 0.5%, 1% payout requirement, and 20% Best Day soft payout gate',
    features: ['Turbo Half Step', 'No maximum single-trade loss published for the challenge phase', 'Account-size list not published']
  },
  {
    program: 'Thunderbolt', slug: 'thunderbolt', phase1: '5%', phase2: 'Not applicable', target: '5%',
    dailyLoss: '3%', maxDrawdown: '6% dynamic', minimumDays: 'None', timeLimit: 'Unlimited',
    allocation: 'Up to $1,500,000', split: '80% to 100%', leverage: '1:100',
    accountSizes: '$5K, $10K, $25K, $50K, $100K, $200K, $300K, $400K, $500K, $600K, $700K, $800K, $900K, $1M, $1.25M, $1.5M',
    fundedRisk: '3% daily drawdown, 6% dynamic maximum drawdown, 3% maximum single-trade loss',
    payout: '20% Best Day soft payout gate; at least 1% profit before a payout request',
    features: ['Challenge 1 Step', 'No minimum trading days', '90% standard profit split; 80% or 100% may be selected at checkout']
  },
  {
    program: 'Thunderbolt Turbo', slug: 'thunderbolt-turbo', phase1: '4%', phase2: 'Not applicable', target: '4%',
    dailyLoss: '3%', maxDrawdown: '6% dynamic', minimumDays: 'Minimum 1; maximum 7 trading days', timeLimit: '30 calendar days',
    allocation: notMentioned, split: '80% to 100%', leverage: '1:100', accountSizes: notMentioned,
    fundedRisk: '3% daily drawdown, 6% dynamic maximum drawdown, 1.5% maximum single-trade loss',
    payout: '5 qualifying days of at least 0.5%, 1% payout requirement, and 20% Best Day soft payout gate',
    features: ['Turbo 1 Phase', 'No maximum single-trade loss published for the challenge phase', 'Account-size list not published']
  },
  {
    program: 'Phoenix', slug: 'phoenix', phase1: '4%', phase2: '4%', target: '4% / 4%',
    dailyLoss: '4%', maxDrawdown: '6% static', minimumDays: 'None', timeLimit: 'Unlimited',
    allocation: 'Up to $1,500,000', split: '80% to 100%', leverage: '1:100',
    accountSizes: '$10K, $25K, $50K, $100K, $200K, $300K, $400K, $500K, $600K, $700K, $800K, $900K, $1M, $1.25M, $1.5M',
    fundedRisk: '4% daily drawdown, 6% static maximum drawdown, 3% maximum single-trade loss',
    payout: '20% Best Day soft payout gate; at least 1% profit before a payout request',
    features: ['Challenge 2 Step', 'No minimum trading days', '90% standard profit split; 80% or 100% may be selected at checkout']
  },
  {
    program: 'Ignite', slug: 'ignite', phase1: '5%', phase2: 'Not applicable', target: '5%',
    dailyLoss: '4%', maxDrawdown: '6% static', minimumDays: 'None in challenge; 5 qualifying funded days before first payout', timeLimit: 'Unlimited',
    allocation: 'Up to $1,500,000', split: '80% to 100%', leverage: '1:100',
    accountSizes: '$5K, $10K, $25K, $50K, $100K, $200K, $300K, $400K, $500K, $600K, $700K, $800K, $900K, $1M, $1.25M, $1.5M',
    fundedRisk: '4% daily drawdown, 6% static maximum drawdown, 1.5% maximum single-trade loss',
    payout: '5 qualifying days before the first payout, 20% Best Day soft payout gate, and at least 1% profit before a payout request',
    features: ['Limited Drop 1 Step', 'Available while the drop is open', '15% challenge profit share subject to the published conditions']
  },
  {
    program: 'Ignite Turbo', slug: 'ignite-turbo', phase1: '4%', phase2: 'Not applicable', target: '4%',
    dailyLoss: '4%', maxDrawdown: '6% static', minimumDays: 'Minimum 1; maximum 7 trading days', timeLimit: '30 calendar days',
    allocation: notMentioned, split: '80% to 100%', leverage: '1:100', accountSizes: notMentioned,
    fundedRisk: '4% daily drawdown, 6% static maximum drawdown, 1.5% maximum single-trade loss',
    payout: '5 qualifying days of at least 0.5% before first payout, 1% payout requirement, and 20% Best Day soft payout gate',
    features: ['Turbo 1 Phase', '50% upfront and 50% after passing', 'Account-size list not published']
  },
  {
    program: 'Surge', slug: 'surge', phase1: '5%', phase2: '4%', target: '5% / 4%',
    dailyLoss: '4%', maxDrawdown: '7% static', minimumDays: 'None in challenge; 5 qualifying funded days before first payout', timeLimit: 'Unlimited',
    allocation: 'Up to $1,500,000', split: '80% to 100%', leverage: '1:100',
    accountSizes: '$5K, $10K, $25K, $50K, $100K, $200K, $300K, $400K, $500K, $600K, $700K, $800K, $900K, $1M, $1.25M, $1.5M',
    fundedRisk: '4% daily drawdown, 7% static maximum drawdown, 1.5% maximum single-trade loss',
    payout: '5 qualifying days before the first payout, 20% Best Day soft payout gate, and at least 1% profit before a payout request',
    features: ['Limited Drop 2 Step', 'Available while the drop is open', '15% challenge profit share subject to the published conditions']
  },
  {
    program: 'Vanguard', slug: 'vanguard', phase1: 'Not applicable', phase2: 'Not applicable', target: 'None',
    dailyLoss: '4%', maxDrawdown: '7% dynamic', minimumDays: '6 qualifying days of at least 0.5%', timeLimit: notMentioned,
    allocation: 'Up to $1,500,000', split: '80% to 100%', leverage: '1:100',
    accountSizes: '$2K, $3K, $4K, $5K, $10K, $25K, $50K, $100K, $150K, $200K, $250K, $300K, $500K, $600K, $700K, $800K, $900K, $1M, $1.5M',
    fundedRisk: '4% daily drawdown, 7% dynamic maximum drawdown, 2% maximum single-trade loss',
    payout: '6 qualifying days of at least 0.5%, 20% Best Day soft payout gate, and 1% payout requirement',
    features: ['Instant Funding', 'No evaluation profit target', 'Qualifying-day count resets after payout']
  },
  {
    program: 'Oracle', slug: 'oracle', phase1: 'Not applicable', phase2: 'Not applicable', target: 'None',
    dailyLoss: '4%', maxDrawdown: '5% dynamic', minimumDays: '5 qualifying days of at least 0.5% realised profit', timeLimit: notMentioned,
    allocation: 'Up to $1,500,000', split: '80% to 100%', leverage: '1:100',
    accountSizes: '$5K, $10K, $25K, $50K, $100K, $150K, $200K, $250K, $300K, $350K, $400K, $450K, $500K, $600K, $700K, $800K, $900K, $1M, $1.5M',
    fundedRisk: '4% daily drawdown, 5% dynamic maximum drawdown, 2% maximum single-trade loss',
    payout: '5 qualifying days of at least 0.5% realised profit, 20% Best Day soft payout gate, and 1% payout requirement',
    features: ['Instant Funding', 'No evaluation profit target', 'Qualifying-day count resets after payout']
  },
  {
    program: 'Ember', slug: 'ember', phase1: 'Not applicable', phase2: 'Not applicable', target: 'None',
    dailyLoss: 'None', maxDrawdown: '4% dynamic', minimumDays: '5 qualifying days of at least 0.5%', timeLimit: notMentioned,
    allocation: 'Up to $1,500,000', split: '80% to 100%', leverage: '1:100',
    accountSizes: '$2K, $3K, $4K, $5K, $10K, $25K, $50K, $100K, $150K, $200K, $250K, $300K, $350K, $400K, $450K, $500K, $600K, $700K, $800K, $900K, $1M, $1.5M',
    fundedRisk: 'No daily drawdown; 4% dynamic maximum drawdown; 1.5% maximum single-trade loss',
    payout: '5 qualifying days of at least 0.5%, 20% Best Day soft payout gate, and 1% payout requirement',
    features: ['Limited Drop Instant Funding', 'Available while the drop is open', 'No evaluation profit target']
  },
  {
    program: 'Supernova', slug: 'supernova', phase1: '3%', phase2: 'Not applicable', target: '3%',
    dailyLoss: '2%', maxDrawdown: '3% nonstop dynamic', minimumDays: 'Minimum 7 trades', timeLimit: '24-hour session',
    allocation: 'Up to $200,000', split: '90%', leverage: '1:100',
    accountSizes: '$5K, $10K, $25K, $50K, $100K, $150K, $200K',
    fundedRisk: '2% daily drawdown, 3% nonstop dynamic maximum drawdown, 1% maximum single-trade loss',
    payout: '15% Best Trade consistency rule; payout cap up to $3,000',
    features: ['24-hour Instant Funding', 'Positions may remain open within the 24-hour session', 'Timed-model news-straddling restrictions apply']
  },
  {
    program: 'Hypernova', slug: 'hypernova', phase1: '2%', phase2: 'Not applicable', target: '2%',
    dailyLoss: '2%', maxDrawdown: '3% nonstop dynamic', minimumDays: 'Minimum 7 trades', timeLimit: '4-hour session',
    allocation: 'Up to $200,000', split: '90%', leverage: '1:100',
    accountSizes: '$5K, $10K, $25K, $50K, $100K, $150K, $200K',
    fundedRisk: '2% daily drawdown, 3% nonstop dynamic maximum drawdown, 1% maximum single-trade loss',
    payout: '15% Best Trade consistency rule; payout cap up to $3,000',
    features: ['4-hour Instant Funding', 'Not an ordinary overnight-holding model', 'Timed-model news-straddling restrictions apply']
  },
  {
    program: 'Ultranova', slug: 'ultranova', phase1: '2%', phase2: 'Not applicable', target: '2%',
    dailyLoss: 'None', maxDrawdown: '2% nonstop dynamic', minimumDays: 'Minimum 5 trades', timeLimit: '1-hour session',
    allocation: 'Up to $200,000', split: '90%', leverage: '1:100',
    accountSizes: '$5K, $10K, $25K, $50K, $100K, $150K, $200K',
    fundedRisk: 'No daily drawdown; 2% nonstop dynamic maximum drawdown; 0.5% maximum single-trade loss',
    payout: '20% Best Trade consistency rule; payout cap up to $3,000',
    features: ['1-hour Instant Funding', 'Not an ordinary overnight-holding model', 'Timed-model news-straddling restrictions apply']
  }
]

const timedPrices = [
  ['$5K', '$37.75', '$200'], ['$10K', '$64.75', '$350'], ['$25K', '$119.75', '$600'],
  ['$50K', '$169.75', '$900'], ['$100K', '$299.75', '$1,600'], ['$150K', notMentioned, notMentioned],
  ['$200K', '$579.75', '$3,000']
].map(([size, price, cap]) => `${size}: ${price} (payout cap ${cap})`).join('; ')

const programRules = Object.fromEntries(programs.map((p) => [p.slug, {
  program: p.program,
  slug: p.slug,
  title: `${p.program} Rules`,
  desc: `Published rules for the ${p.program} account model at Upcomers.`,
  notice: 'Verified against the audited Upcomers research record dated 13 September 2026. Recheck the official rulebook before purchase.',
  rules: [
    ['Evaluation phases', p.phase2 === 'Not applicable' ? (p.phase1 === 'Not applicable' ? 'Not applicable' : '1') : '2'],
    ['Profit target', p.target], ['Daily loss', p.dailyLoss], ['Maximum drawdown', p.maxDrawdown],
    ['Minimum trading activity', p.minimumDays], ['Time limit', p.timeLimit], ['Maximum funding', p.allocation],
    ['Published account sizes', p.accountSizes], ['Profit split', p.split], ['Leverage', p.leverage],
    ['Funded-account risk limits', p.fundedRisk], ['Payout conditions', p.payout],
    ['News trading', p.slug.includes('nova') ? 'Timed-model news-straddling restrictions apply' : 'Generally allowed, subject to the published product rules'],
    ['Weekend and overnight holding', p.slug === 'hypernova' || p.slug === 'ultranova' ? 'Not applicable beyond the timed session' : p.slug === 'supernova' ? 'Positions may remain open within the 24-hour session' : 'Allowed, subject to product-specific rules'],
    ['Platforms', 'TradeLocker, MetaTrader 5, Match Trader, and cTrader, subject to location and product availability'],
    ...p.features.map((feature, index) => [`Program note ${index + 1}`, feature])
  ].map(([title, text]) => ({ title, text }))
}]))

const rulesPanelData = {
  sections: {
    'source-and-status': {
      title: 'Source & Program Status',
      desc: 'Current purchasable programs and research status.',
      notice: 'Verified 13 September 2026. The official Upcomers Help Center remains controlling.',
      rules: [
        { title: 'Current models', text: 'Ash, Ash Turbo, Thunderbolt, Thunderbolt Turbo, Phoenix, Ignite, Ignite Turbo, Surge, Vanguard, Oracle, Ember, Supernova, Hypernova, and Ultranova' },
        { title: 'Limited-drop models', text: 'Ignite, Surge, and Ember are available only while their drops remain open' },
        { title: 'Not available for new purchase', text: 'Thunderbolt Legacy, Astral Legacy, Astral, Obsidian, and Eon' },
        { title: 'Temporarily unavailable', text: 'Breakout Control and Rebirth' },
        { title: 'General pricing', text: 'A complete stable no-discount price matrix was not publicly published in the audited source' },
        { title: 'Timed-program 90% split pricing', text: timedPrices }
      ]
    },
    'payouts-and-profit-split': {
      title: 'Payouts & Profit Split',
      desc: 'General payout eligibility and published split terms.',
      notice: 'Model-specific qualifying-day, consistency, and payout-cap rules still apply.',
      rules: [
        { title: 'Minimum profit before payout', text: 'At least 1% of the initial funded balance' },
        { title: 'Minimum withdrawal', text: '$45 after the profit split' },
        { title: 'Request conditions', text: 'All positions closed, KYC and Trader Agreement completed, and all drawdown rules satisfied' },
        { title: 'Standard profit split', text: '90%' },
        { title: 'Checkout split options', text: '80% or 100% may be offered; the selected split changes challenge price and remains linked to the account' },
        { title: 'Best Day Rule', text: 'The largest single trading day may not exceed 20% of the payout basis; this is a soft payout gate rather than an account breach' },
        { title: 'Challenge Phase Bonus', text: '15% after 20% cumulative funded-account growth, subject to the published conditions' }
      ]
    },
    'platforms-and-trading': {
      title: 'Platforms & Trading Policies',
      desc: 'Published platform availability and strategy conditions.',
      notice: 'Availability can depend on product, jurisdiction, and current platform support.',
      rules: [
        { title: 'Platforms', text: 'TradeLocker, MetaTrader 5, Match Trader, and cTrader' },
        { title: 'Bybit', text: 'No new accounts; existing legacy accounts only' },
        { title: 'US restrictions', text: 'Match Trader and cTrader are unavailable to US citizens and residents' },
        { title: 'Copy trading', text: 'Allowed between accounts owned by the same trader; prohibited between different owners' },
        { title: 'Grid trading', text: 'Prohibited' },
        { title: 'Tick scalping', text: 'Subject to the prohibited-strategy policy' },
        { title: 'Expert Advisors and bots', text: 'Allowed subject to policy; shared or mass-distributed tools may be restricted' },
        { title: 'News trading and weekend holding', text: 'Generally allowed on standard CFD programs; timed products have product-specific restrictions' }
      ]
    },
    scaling: {
      title: 'Scaling Plan',
      desc: 'Published funded-account scaling conditions.',
      notice: 'Only eligible models can scale.',
      rules: [
        { title: 'Increase', text: '35% every four months' },
        { title: 'Requirements', text: '15% cumulative growth over four consecutive months, at least two payouts, and a positive ending balance' },
        { title: 'Maximum scaled balance', text: '$4,000,000' },
        { title: 'Eligible models', text: 'Ash, Thunderbolt, Phoenix, Ignite, Surge, Ember, Vanguard, and Oracle' }
      ]
    }
  },
  programRules,
  modelSlugs: programs.map((p) => p.slug),
  violations: ['Account closure', 'Payout denial or reduction', 'Compliance review', 'Disqualification for prohibited strategies'],
  importantNote: {
    text: 'Upcomers rules can change. Review the selected model and the current official Help Center before purchasing or trading.',
    buttonText: 'View official rules'
  }
}

const evaluationPrograms = programs.map((p) => ({
  program: p.program,
  phase1: p.phase1,
  phase2: p.phase2,
  target: p.target,
  dailyLoss: p.dailyLoss,
  maxDrawdown: p.maxDrawdown,
  minimumDays: p.minimumDays,
  timeLimit: p.timeLimit,
  allocation: p.allocation,
  split: p.split,
  leverage: p.leverage,
  features: p.features
}))

const firm = {
  firmId: FIRM_ID,
  name: 'Upcomers',
  slug: FIRM_ID,
  handle: '@upcomers',
  country: notMentioned,
  ranking: 22,
  sortOrder: 22,
  website: '',
  buyLink: '',
  logo: '/assets/firms/upcomers.png',
  logoUrl: '/assets/firms/upcomers.png',
  detailsLink: '/prop-firms/upcomers',
  rulesLink: '/prop-firm-rules/upcomers',
  discountPage: '/offers/upcomers',
  followers: 0,
  tags: ['CFD', 'Forex', 'Instant Funding', '1-Step', '2-Step'],
  markets: ['CFDs'],
  bio: 'Upcomers offers challenge, turbo, instant-funding, limited-drop, and timed CFD account models with published drawdown, payout, and consistency conditions.',
  payoutAssurance: false,
  showFirmProfile: true,
  showHomeTable: true,
  showListed: true,
  showBestGlobal: false,
  showRules: true,
  showReviews: true,
  showOffers: false,
  bestRegions: {},
  bestCategories: { instant_funding: true },
  listingType: 'best',
  publishState: 'published',
  active: true,
  score: 0,
  trustedBy: notMentioned,
  promoText: '',
  reviewCount: 0,
  detailMeta: 'CEO: Not mentioned | Founded: Not mentioned | Headquarters: Not mentioned',
  reviewSnippet: 'No approved Upcomers community reviews are published yet.',
  metaCeo: notMentioned,
  metaMarkets: ['CFDs'],
  metaFounded: notMentioned,
  metaHeadquarters: notMentioned,
  overviewTitle: 'Upcomers Overview',
  overviewLongTitle: 'Upcomers CFD Programs and Trading Rules',
  overviewShort: 'Upcomers currently publishes 14 purchasable CFD account models across standard challenges, Turbo programs, instant funding, limited drops, and one-hour to 24-hour timed programs.',
  overviewLong: 'Upcomers provides a broad CFD prop-trading lineup spanning Ash, Thunderbolt, Phoenix, Ignite, Surge, Vanguard, Oracle, Ember, Supernova, Hypernova, and Ultranova variants. The audited source dated 13 September 2026 identifies 14 currently purchasable models. Profit targets range from none on instant funding to 5% on selected challenges, while published maximum drawdown ranges from 2% nonstop dynamic to 7% static or dynamic depending on the model.\n\nStandard programs use a published 90% profit split, with 80% and 100% checkout options where offered. Payout eligibility is model-specific and can include qualifying profitable days, a 20% Best Day soft gate, or a Best Trade consistency rule on timed products. The general payout request requires at least 1% profit from the initial funded balance, closed positions, completed KYC and Trader Agreement, and compliance with the model drawdown rules.\n\nPublished platforms are TradeLocker, MetaTrader 5, Match Trader, and cTrader. Copy trading is limited to accounts owned by the same trader, grid trading is prohibited, and Expert Advisors remain subject to the firm policy. A complete stable no-discount pricing matrix was not published in the audited source, so unpublished prices are shown as Not mentioned rather than estimated.',
  platforms: ['TradeLocker', 'MetaTrader 5', 'Match Trader', 'cTrader'],
  paymentMethods: [notMentioned],
  restrictedCountries: [notMentioned],
  whyChoose: [
    '14 current CFD account models',
    'Challenge, Turbo, instant-funding, limited-drop, and timed programs',
    'Published leverage up to 1:100',
    'Published maximum funding up to $1.5 million',
    'Scaling ceiling up to $4 million on eligible models',
    'TradeLocker, MetaTrader 5, Match Trader, and cTrader'
  ],
  overview: 'Upcomers publishes a diversified CFD prop-trading range with model-specific targets, dynamic or static drawdown, funded-account risk limits, payout qualification, and consistency rules. This listing uses the audited record dated 13 September 2026. Fields not published in that record are marked Not mentioned.',
  performance: {},
  radarMetrics: [],
  stats: [
    { label: 'Current Models', value: '14' },
    { label: 'Maximum Initial Funding', value: '$1.5M' },
    { label: 'Maximum Scaled Balance', value: '$4M' },
    { label: 'Published Leverage', value: 'Up to 1:100' }
  ],
  keyMetrics: [
    { label: 'Max Allocation', value: '$1,500,000' },
    { label: 'Scaling Ceiling', value: '$4,000,000' },
    { label: 'Profit Split', value: '90% standard; 80% or 100% where offered' },
    { label: 'Payout Cycle', value: 'Model-specific; not publicly stated as one firm-wide cycle' },
    { label: 'News Trading', value: 'Generally allowed; timed-model restrictions apply' },
    { label: 'Minimum Trading Days', value: 'None to 6 qualifying days, by model' },
    { label: 'Time Limit', value: 'Unlimited, 30 days, or 1-24 hour timed sessions' },
    { label: 'Starting Price', value: '$37.75 for published $5K timed 90%-split account' },
    { label: 'EA Allowed', value: 'Allowed subject to policy and tool restrictions' }
  ],
  cardMetrics: {
    payoutCycle: 'Model-specific',
    minTradingDays: 'None to 6 qualifying days',
    newsTrading: 'Allowed; timed restrictions apply',
    timeLimit: 'Unlimited / 30 days / timed',
    eaAllowed: 'Allowed with restrictions',
    startingPrice: '$37.75 timed account'
  },
  tradingConditions: [
    { label: 'Daily Loss', value: 'None to 4%, by model' },
    { label: 'Maximum Loss', value: '2% to 7%, static or dynamic by model' },
    { label: 'Weekend Holding', value: 'Generally allowed; timed-session limits apply' },
    { label: 'News Trading', value: 'Generally allowed; timed-model restrictions apply' },
    { label: 'Copy Trading', value: 'Same-owner accounts only' },
    { label: 'Grid Trading', value: 'Prohibited' },
    { label: 'Expert Advisors', value: 'Allowed subject to policy; shared or mass-distributed tools may be restricted' }
  ],
  firmDetails: [
    { label: 'Company Name', value: 'Upcomers' },
    { label: 'Headquarters', value: notMentioned },
    { label: 'Founded', value: notMentioned },
    { label: 'CEO', value: notMentioned },
    { label: 'Broker', value: notMentioned },
    { label: 'Trustpilot', value: notMentioned },
    { label: 'Official Website', value: notMentioned },
    { label: 'Verification Date', value: '13 September 2026' }
  ],
  leverageRows: [
    { instrument: 'Published program leverage', c1: '1:100', c2: notMentioned, c3: notMentioned, c4: 'Model-specific' }
  ],
  commissions: [{ title: 'Commissions', lines: [notMentioned] }],
  evaluationPrograms,
  challengesPanelData: {
    stats: [
      { label: 'Current Models', value: '14' },
      { label: 'Maximum Initial Funding', value: '$1.5M' },
      { label: 'Maximum Scaled Balance', value: '$4M' },
      { label: 'Published Leverage', value: '1:100' }
    ],
    programs: evaluationPrograms
  },
  rulesPanelData,
  createdAt: now,
  updatedAt: now
}

const firmReviews = {
  firmId: FIRM_ID,
  firmName: 'Upcomers',
  items: [],
  createdAt: now,
  updatedAt: now
}

const ratingStats = {
  firmSlug: FIRM_ID,
  firmName: 'Upcomers',
  useManualOverride: false,
  manualAverageRating: 0,
  manualReviewCount: 0,
  autoAverageRating: 0,
  autoReviewCount: 0,
  averageRating: 0,
  reviewCount: 0,
  createdAt: now,
  updatedAt: now
}

const reviewProfile = {
  firmId: FIRM_ID,
  firmSlug: FIRM_ID,
  firmName: 'Upcomers',
  title: 'Upcomers Reviews & Trader Experiences',
  description: 'Read approved Upcomers trader feedback covering its CFD account models, rules, support, platforms, and payouts.',
  pageHeading: 'Upcomers Reviews & Trader Ratings',
  pageParagraph: 'Read approved Upcomers reviews from traders and share your own experience with its CFD account models, rules, support, platforms, and payouts.',
  communityHeading: 'Trader reviews for Upcomers',
  lastUpdatedLabel: '18 September 2026',
  badgeLabel: 'Review',
  ourReviewTitle: 'Our Review',
  ourReviewSubtitle: 'No Rank My Prop team score has been published for Upcomers yet.',
  overallRating: 0,
  overallLabel: 'Not rated yet',
  overallSub: 'Awaiting verified evidence',
  verdictHeading: 'Rank My Prop Team Verdict',
  verdictBadge: 'Research in progress',
  verdictText: 'Upcomers has been listed from the audited rule record. A qualitative team rating will be added only after sufficient verified evidence is available.',
  verdictDate: now.toISOString(),
  verdictAuthor: 'Rank My Prop Team',
  breakdownHeading: 'Detailed Breakdown',
  breakdown: [],
  prosHeading: 'What We Liked',
  consHeading: 'What Could Be Better',
  pros: ['Broad range of current CFD account models', 'Detailed model-specific rule publication'],
  cons: ['Company background was not published in the audited source', 'A complete firm-wide price matrix was not publicly available'],
  bestForHeading: 'Best For',
  bestForText: 'Traders comparing multiple challenge, instant-funding, and timed CFD account structures.',
  notIdealHeading: 'Not Ideal For',
  notIdealText: 'Traders who require every price and corporate detail to be publicly available before comparison.',
  finalVerdictHeading: 'Our Current Assessment',
  finalVerdictText: 'Rules are listed without an invented score. Verify the current official terms before purchase.',
  finalScore: 0,
  finalLabel: 'Not rated yet',
  createdAt: now,
  updatedAt: now
}

function firestoreValue(value) {
  if (value instanceof Date) return { timestampValue: value.toISOString() }
  if (value === null) return { nullValue: null }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } }
  if (typeof value === 'object') {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, firestoreValue(nested)])) } }
  }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  return { stringValue: String(value) }
}

function firestoreDocument(value) {
  return { fields: Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, firestoreValue(nested)])) }
}

async function request(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch (_) { body = text }
  return { response, body }
}

async function main() {
  const config = JSON.parse(fs.readFileSync(FIREBASE_CONFIG, 'utf8'))
  let accessToken = String(config?.tokens?.access_token || '').trim()
  const expiresAt = Number(config?.tokens?.expires_at || 0)
  if (config?.tokens?.refresh_token && (!accessToken || expiresAt <= Date.now() + 60_000)) {
    const firebaseEntry = fs.realpathSync('/opt/homebrew/bin/firebase')
    const firebaseAuth = require(path.resolve(path.dirname(firebaseEntry), '../auth.js'))
    const refreshed = await firebaseAuth.getAccessToken(config.tokens.refresh_token, config.tokens.scopes || [])
    accessToken = String(refreshed?.access_token || '').trim()
  }
  if (!accessToken) throw new Error('Firebase CLI access token is unavailable. Run firebase login first.')

  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`
  const logoOnly = process.argv.includes('--logo-only')
  const existing = await request(`${base}/firms/${FIRM_ID}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (existing.response.ok && !process.argv.includes('--force') && !logoOnly) {
    throw new Error('Upcomers already exists. Re-run with --force only after reviewing the current record.')
  }
  if (!existing.response.ok && existing.response.status !== 404) {
    throw new Error(`Could not verify existing firm record (${existing.response.status}).`)
  }

  if (logoOnly) {
    const logoFields = { logo: firm.logo, logoUrl: firm.logoUrl }
    const result = await request(`${base}/firms/${FIRM_ID}?updateMask.fieldPaths=logo&updateMask.fieldPaths=logoUrl`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(firestoreDocument(logoFields))
    })
    if (!result.response.ok) throw new Error(`Failed to update Upcomers logo (${result.response.status}).`)
    console.log('Upcomers logo fields updated without changing any other firm data.')
    return
  }

  const writes = [
    ['firms', FIRM_ID, firm],
    ['firmReviews', FIRM_ID, firmReviews],
    ['firmRatingStats', FIRM_ID, ratingStats],
    ['firmReviewProfiles', FIRM_ID, reviewProfile]
  ]

  for (const [collection, id, payload] of writes) {
    const result = await request(`${base}/${collection}/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(firestoreDocument(payload))
    })
    if (!result.response.ok) {
      throw new Error(`Failed to write ${collection}/${id} (${result.response.status}).`)
    }
  }

  console.log(`Upcomers published with ${programs.length} current models, zero seeded reviews, and zero invented rating.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
