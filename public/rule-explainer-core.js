/* ================= MASTER RULE DATABASE ================= */
const RULE_DATA = [
  { id:"daily_drawdown", name:"Daily Drawdown", category:"Drawdown",
    meaning:"The account cannot lose more than the daily limit from start-of-day equity or balance, depending on firm rules.",
    failure:"Traders oversize after one losing trade and breach the cap before the session ends.",
    safe:"Set a personal stop at 70-80% of the allowed daily loss and reduce lot size after two losses." },
  { id:"overall_drawdown", name:"Max / Overall Drawdown", category:"Drawdown",
    meaning:"This is the hard account floor. If equity drops below it at any time, the account fails.",
    failure:"Holding floating losses near news events pushes equity below the max drawdown line.",
    safe:"Keep max exposure small and pre-calculate worst-case drawdown before opening correlated trades." },
  { id:"trailing_drawdown", name:"Trailing Drawdown", category:"Drawdown",
    meaning:"The drawdown threshold moves upward as your account reaches new highs, locking in a higher minimum balance.",
    failure:"Big early profits are followed by aggressive trades that violate the moved threshold.",
    safe:"When you hit a new high, cut risk immediately because your allowable cushion is now tighter." },
  { id:"static_drawdown", name:"Static Drawdown", category:"Drawdown",
    meaning:"The loss limit is fixed and does not move with profits, making risk planning simpler.",
    failure:"Traders assume it trails and misjudge how much room remains on losing days.",
    safe:"Track fixed drawdown in dollar terms and keep a visible risk dashboard for each session." },
  { id:"floating_dd", name:"Floating Drawdown", category:"Drawdown",
    meaning:"The firm checks open PnL in real time, not only closed trades, so temporary loss can trigger violation.",
    failure:"No stop-loss plus volatile candles creates a floating breach even if price later recovers.",
    safe:"Use hard stops and avoid oversized positions around high-impact events." },
  { id:"profit_target", name:"Profit Target", category:"Evaluation",
    meaning:"You must reach a required return percentage within rules to pass evaluation.",
    failure:"Traders chase target with reckless lot sizing near the end of challenge time.",
    safe:"Use steady compounding plan and aim for consistency, not one large all-in day." },
  { id:"min_trading_days", name:"Minimum Trading Days", category:"Evaluation",
    meaning:"Many firms require a minimum number of active trading days before passing or payout.",
    failure:"Traders hit target fast but fail because activity days are below requirement.",
    safe:"Plan a day-by-day schedule with low-risk placeholder trades if needed." },
  { id:"consistency_rule", name:"Consistency Rule", category:"Behavior",
    meaning:"A single day cannot contribute too much of total profit; firms want repeatable behavior.",
    failure:"One lucky spike day creates 60-70% of profit and violates consistency check.",
    safe:"Spread gains across sessions and avoid oversized trades after a strong start." },
  { id:"max_lot", name:"Maximum Lot Size", category:"Execution",
    meaning:"Each order has a maximum lot cap based on account size and firm policy.",
    failure:"Copying signals with fixed lot templates causes accidental lot-limit breach.",
    safe:"Use pre-trade lot validator in your terminal before sending orders." },
  { id:"max_positions", name:"Maximum Open Positions", category:"Execution",
    meaning:"Firms limit how many trades can be open simultaneously.",
    failure:"Layering entries across pairs leads to position-count violation.",
    safe:"Set platform alerts for open position count and close weakest setup first." },
  { id:"max_risk_per_trade", name:"Max Risk Per Trade", category:"Risk",
    meaning:"Some firms cap the percentage risk allowed on one trade idea.",
    failure:"Wide stop-loss with high lot exceeds risk threshold instantly.",
    safe:"Calculate risk in dollars first, then derive lot size from stop distance." },
  { id:"correlation_limit", name:"Correlation Rule", category:"Risk",
    meaning:"Opening highly correlated pairs can be treated as one combined risk bet.",
    failure:"Long EURUSD, GBPUSD and XAUUSD together behaves like one oversized USD trade.",
    safe:"Cap total directional USD exposure instead of evaluating each trade separately." },
  { id:"news_trading", name:"News Trading Rule", category:"Strategy",
    meaning:"Certain firms block trading during high-impact economic releases.",
    failure:"Entering just before NFP or CPI leads to automatic violation.",
    safe:"Check event window rules and pause trading 5-15 minutes around restricted news." },
  { id:"overnight", name:"Overnight Holding Rule", category:"Time",
    meaning:"Some accounts do not allow trades to remain open past market rollover.",
    failure:"Forgetting to close swing positions before rollover causes breach.",
    safe:"Set platform alarm 20 minutes before rollover and flatten restricted trades." },
  { id:"weekend", name:"Weekend Holding Rule", category:"Time",
    meaning:"Positions may need to be closed before Friday market close.",
    failure:"Keeping trades open into weekend gap risk violates firm policy.",
    safe:"Exit or hedge all restricted positions before cutoff time every Friday." },
  { id:"holiday_trading", name:"Holiday Trading Restriction", category:"Time",
    meaning:"Some firms disable trading or tighten limits on major holidays.",
    failure:"Normal-size trades on low-liquidity holiday sessions trigger slippage breaches.",
    safe:"Trade reduced size or skip sessions with abnormal liquidity conditions." },
  { id:"scalping", name:"Scalping Rule", category:"Strategy",
    meaning:"Firms may define minimum hold time or disallow ultra-short latency exploitation.",
    failure:"Rapid in-out trades under firm threshold get flagged as prohibited behavior.",
    safe:"Follow documented minimum hold duration and avoid suspicious execution patterns." },
  { id:"hft", name:"HFT / Latency Arbitrage", category:"Strategy",
    meaning:"Latency or quote-delay exploitation is often prohibited in funded accounts.",
    failure:"Using arbitrage software gets trades cancelled and payout denied.",
    safe:"Use normal discretionary or standard algo execution only." },
  { id:"ea", name:"EA / Bot Rule", category:"Automation",
    meaning:"Some firms allow EAs, others require approval or ban specific bot logic.",
    failure:"Running unapproved bot strategies results in account review failure.",
    safe:"Get written EA approval and keep strategy logs for audit trail." },
  { id:"martingale", name:"Martingale / Grid Rule", category:"Risk",
    meaning:"Averaging losers with increasing size is restricted or banned at many firms.",
    failure:"Lot multiplier sequence spikes drawdown and breaches risk controls.",
    safe:"Use fixed fractional sizing and cut loss instead of adding to losers." },
  { id:"copy_trading", name:"Copy Trading Rule", category:"Compliance",
    meaning:"Cross-account copying may be limited unless all accounts belong to you and are permitted.",
    failure:"Copying from public signal groups triggers policy violation.",
    safe:"Copy only approved internal accounts and keep proof of ownership." },
  { id:"hedging", name:"Hedging Rule", category:"Compliance",
    meaning:"Some firms disallow direct hedge trades across same or linked accounts.",
    failure:"Opening opposite positions across two accounts is flagged as risk bypass.",
    safe:"Use one directional plan per setup and avoid synthetic hedge loopholes." },
  { id:"latency_abuse", name:"Latency Abuse Rule", category:"Compliance",
    meaning:"Profits from delayed feed exploitation can be voided.",
    failure:"Trading only during feed mismatch periods leads to compliance rejection.",
    safe:"Trade liquid sessions with standard brokers and normal execution intent." },
  { id:"ip_vpn", name:"VPN / IP Address Rule", category:"Security",
    meaning:"Frequent IP jumps or suspicious locations can trigger account security checks.",
    failure:"Multiple countries in one day look like account sharing behavior.",
    safe:"Use stable network location and notify support before travel." },
  { id:"multi_account", name:"Multiple Account Policy", category:"Security",
    meaning:"Firms define max funded/evaluation accounts per user and per household.",
    failure:"Opening extra accounts with related identities causes termination.",
    safe:"Read account cap policy before purchase and consolidate under one profile." },
  { id:"kyc_aml", name:"KYC / AML Verification", category:"Legal",
    meaning:"Identity checks are mandatory before payout approval.",
    failure:"Name mismatch between account and payment method delays withdrawals.",
    safe:"Keep documents updated and use same legal identity across all records." },
  { id:"payout_cycle", name:"Payout Cycle", category:"Payout",
    meaning:"Payout windows may be bi-weekly or monthly with minimum trading conditions.",
    failure:"Requesting payout before eligible cycle date gets request rejected.",
    safe:"Track eligibility date and confirm all rule metrics before payout request." },
  { id:"payout_split", name:"Profit Split Rule", category:"Payout",
    meaning:"The firm shares a percentage of net profit after applicable deductions.",
    failure:"Ignoring reset fees or commissions creates mismatch in expected payout.",
    safe:"Calculate net payout after all costs, not only gross balance gain." },
  { id:"payout_denial", name:"Payout Denial Triggers", category:"Payout",
    meaning:"Rule breach, prohibited strategy, or suspicious behavior can void payout.",
    failure:"Traders pass target but violate hidden compliance clauses.",
    safe:"Keep screenshots, journal, and clean execution record for dispute defense." },
  { id:"scaling_plan", name:"Scaling Plan", category:"Growth",
    meaning:"Account size can increase when consistency and payout milestones are met.",
    failure:"Inconsistent high-risk phases delay scaling eligibility.",
    safe:"Treat scaled account like base account; keep same disciplined risk model." },
  { id:"inactivity", name:"Inactivity Rule", category:"Account",
    meaning:"Accounts can be paused or closed if not traded for specified days.",
    failure:"Traders forget activity deadline after a break.",
    safe:"Set calendar reminders and place low-risk maintenance trades when required." },
  { id:"rule_breach_reset", name:"Reset / Retry Policy", category:"Account",
    meaning:"After breach, some firms allow paid reset while others require full repurchase.",
    failure:"Assuming free reset leads to unexpected extra cost.",
    safe:"Know reset fee, cooldown, and retry limits before starting challenge." },
  { id:"challenge_time_limit", name:"Challenge Time Limit", category:"Evaluation",
    meaning:"Evaluation must be completed within a fixed number of calendar days at some firms.",
    failure:"Low activity and delayed execution cause timeout despite no breaches.",
    safe:"Build weekly target milestones and maintain consistent participation." },
  { id:"minimum_profitable_days", name:"Minimum Profitable Days", category:"Evaluation",
    meaning:"A set number of profitable days may be required for pass or payout.",
    failure:"One big day plus many flat days fails profitable-day requirement.",
    safe:"Aim for small repeatable green days instead of jackpot trading." },
  { id:"restricted_instruments", name:"Restricted Instruments", category:"Market",
    meaning:"Certain symbols or asset classes may be banned on specific account types.",
    failure:"Trading unavailable symbols on copied templates triggers violations.",
    safe:"Load approved symbol list in watchlist and remove restricted assets." },
  { id:"leverage_limits", name:"Leverage Limits", category:"Market",
    meaning:"Each instrument/account has fixed leverage caps that affect margin use.",
    failure:"Over-leveraging during volatile sessions causes forced liquidation.",
    safe:"Keep margin usage conservative and monitor free margin above safety buffer." },
  { id:"commissions_swaps", name:"Commissions & Swaps Rule", category:"Cost",
    meaning:"Trading costs impact net performance and can affect target progress.",
    failure:"Ignoring swap on long holds turns profitable setup into net loss.",
    safe:"Include commission and swap in every trade expectancy calculation." },
  { id:"slippage_spread", name:"Spread & Slippage Conditions", category:"Execution",
    meaning:"Execution quality can change during volatility and influence rule safety.",
    failure:"Tight stop in wide spread conditions triggers avoidable stop-outs.",
    safe:"Use volatility-aware stops and avoid entering during spread spikes." },
  { id:"forbidden_strategies", name:"Forbidden Strategies", category:"Compliance",
    meaning:"Some tactics like toxic flow, arbitrage abuse, or account manipulation are banned.",
    failure:"Using copied 'loophole' strategies leads to account cancellation.",
    safe:"Follow transparent, repeatable strategy with clear market rationale." },
  { id:"account_merging", name:"Account Merging Rule", category:"Account",
    meaning:"Combining multiple accounts into one larger account is firm-dependent.",
    failure:"Assuming auto-merge without meeting criteria creates support issues.",
    safe:"Confirm merge criteria, timing, and payout status before requesting merge." },
  { id:"stop_loss_rule", name:"Mandatory Stop Loss Rule", category:"Risk",
    meaning:"Some firms require every trade to have a valid stop-loss at entry.",
    failure:"Manual entries without SL get flagged as risk non-compliance.",
    safe:"Use one-click templates that force SL before order submission." }
];

/* ================= LANGUAGE ENGINE ================= */
const RULE_EXAMPLES = {
  daily_drawdown: "Example: Account size $100,000 and daily loss limit 5%. If your loss reaches $5,000 in one day, stop trading for that day.",
  overall_drawdown: "Example: Account starts at $100,000 with max loss $10,000. If equity touches $90,000, account fails immediately.",
  trailing_drawdown: "Example: If account grows to $103,000 and trail is $3,000, your new floor becomes $100,000.",
  static_drawdown: "Example: Static max loss stays fixed at $10,000 from day one, even after account grows.",
  floating_dd: "Example: Open trade is -$2,200 for a few seconds and rule limit is -$2,000. Breach can happen even before trade closes.",
  profit_target: "Example: If target is 8% on $50,000 account, you must make $4,000 while respecting all risk rules.",
  min_trading_days: "Example: Firm asks for 5 trading days. Even if target is done in 2 days, you still need 3 more valid days.",
  consistency_rule: "Example: If one day profit is $3,000 and total profit is $4,000, many firms mark this as inconsistent.",
  max_lot: "Example: If lot cap is 5 lots and you place 7 lots on one order, that trade can be invalid.",
  max_positions: "Example: Firm allows 8 open trades. Opening 9th trade can trigger violation.",
  max_risk_per_trade: "Example: Account is $100,000 and max risk per trade is 1%. Risk above $1,000 on one idea is not allowed.",
  correlation_limit: "Example: Long EURUSD, GBPUSD, and AUDUSD together can act like one big USD-short position.",
  news_trading: "Example: Rule says no trade 2 minutes before and after NFP. Entry in that window may be disqualified.",
  overnight: "Example: If rollover is 11:55 PM server time, any restricted trade open after that can violate rule.",
  weekend: "Example: Some firms require all positions closed before Friday close to avoid weekend gaps.",
  holiday_trading: "Example: On Christmas week, firms may reduce leverage or block entries in low-liquidity hours.",
  scalping: "Example: Firm may require minimum hold time 60 seconds. Closing in 5 seconds repeatedly can be flagged.",
  hft: "Example: Using latency arbitrage software to exploit delayed quotes is usually banned.",
  ea: "Example: Grid EA without approval can pass target but still fail compliance review.",
  martingale: "Example: 1 lot, 2 lot, 4 lot after losses quickly destroys drawdown limits.",
  copy_trading: "Example: Copying signals from Telegram to funded account without permission can void payout.",
  hedging: "Example: Long EURUSD in one account and short EURUSD in another may be treated as prohibited hedge.",
  latency_abuse: "Example: Entering only when feed mismatch appears can result in trade cancellation.",
  ip_vpn: "Example: Morning login from India and evening login from Europe same day can trigger security review.",
  multi_account: "Example: Firm allows max 2 funded accounts. Buying a 3rd may lead to account merge/termination issue.",
  kyc_aml: "Example: Name on KYC ID and payout wallet must match exactly, otherwise payout can be blocked.",
  payout_cycle: "Example: Payout allowed every 14 days; requesting on day 9 is rejected automatically.",
  payout_split: "Example: With 80/20 split, net $2,000 profit gives trader $1,600 before fees/taxes.",
  payout_denial: "Example: Rule breach discovered in audit can cancel payout even after hitting profit target.",
  scaling_plan: "Example: Three clean payout cycles may increase account from $100k to $200k.",
  inactivity: "Example: No trade for 30 days can move account to inactive state.",
  rule_breach_reset: "Example: After daily loss breach, some firms offer paid reset instead of new challenge purchase.",
  challenge_time_limit: "Example: 30-day challenge means target must be achieved before day 30 cutoff.",
  minimum_profitable_days: "Example: Firm needs 3 profitable days; one giant profit day is not enough.",
  restricted_instruments: "Example: If crypto symbols are blocked on your account type, BTCUSD trade can violate policy.",
  leverage_limits: "Example: FX leverage 1:30 and gold 1:10 means position size must be adjusted per symbol.",
  commissions_swaps: "Example: Overnight hold on high-swap pair can reduce net profit and delay target completion.",
  slippage_spread: "Example: During CPI spread widens from 1 pip to 8 pips, tight SL gets hit instantly.",
  forbidden_strategies: "Example: Tick manipulation or quote abuse strategy can result in full account closure.",
  account_merging: "Example: Two funded accounts can be merged only after meeting payout and consistency conditions.",
  stop_loss_rule: "Example: Market order without stop-loss can trigger instant compliance warning in some firms."
};

function buildLongCopy(entry) {
  return {
    meaning: `${entry.meaning} In easy language: this is a safety boundary, not a suggestion. If you follow this rule daily, your account survives longer and your performance stays consistent. If you ignore it, one bad session can cancel many good days.`,
    failure: `${entry.failure} Most traders fail here for three reasons: (1) they increase lot size after a loss, (2) they do not read timing conditions, and (3) they enter trades without checking remaining risk. Rule breach usually happens fast, especially in volatile sessions.`,
    safe: `${entry.safe} Simple process to stay safe: Step 1 - check remaining risk before every trade. Step 2 - use fixed lot sizing, not emotional sizing. Step 3 - stop trading when your personal limit is hit, even if firm limit is still available. This one habit protects challenge capital.`,
    example: `${RULE_EXAMPLES[entry.id] || `Example: Before placing a trade under "${entry.name}", calculate max loss, verify the rule condition, and only then execute.`} Practical tip: Write this rule in your journal header so you see it before every session.`
  };
}

function localize(entry, lang){
  const long = buildLongCopy(entry);
  if (lang === "en") {
    return long;
  }
  if (lang === "hinglish") {
    return {
      meaning: `${entry.name} ka simple matlab: yeh rule aapke account ke liye safety boundary set karta hai. Is rule ka kaam hai risk ko control karna, overtrading ko rokna, aur account ko long term tak safe rakhna. Isko follow karoge to account stability better rahegi.`,
      failure: `Traders mostly tab fail hote hain jab loss ke baad lot size bada dete hain, rule timing ignore kar dete hain, ya entry se pehle remaining risk check nahi karte. Fast market me yeh mistakes bahut jaldi violation bana deti hain.`,
      safe: `Easy safe plan: Step 1 - har trade se pehle max risk note karo. Step 2 - fixed lot sizing use karo, emotional sizing avoid karo. Step 3 - personal limit hit hote hi trading stop karo. Discipline hi funded account bachata hai.`,
      example: `${entry.name} example: pehle max allowed loss calculate karo, phir uske hisab se lot size set karo, aur rule limit ke paas jaate hi nayi entry band kar do.`
    };
  }
  if (lang === "hi") {
    const hiNameMap = {
      daily_drawdown:"दैनिक ड्रॉडाउन", overall_drawdown:"अधिकतम कुल ड्रॉडाउन", trailing_drawdown:"ट्रेलिंग ड्रॉडाउन",
      static_drawdown:"स्थिर ड्रॉडाउन", floating_dd:"फ्लोटिंग ड्रॉडाउन", profit_target:"लाभ लक्ष्य",
      min_trading_days:"न्यूनतम ट्रेडिंग दिन", consistency_rule:"कंसिस्टेंसी नियम", max_lot:"अधिकतम लॉट साइज़",
      max_positions:"अधिकतम ओपन पोज़िशन", max_risk_per_trade:"प्रति ट्रेड अधिकतम जोखिम", correlation_limit:"कोरिलेशन नियम",
      news_trading:"न्यूज़ ट्रेडिंग नियम", overnight:"ओवरनाइट होल्डिंग नियम", weekend:"वीकेंड होल्डिंग नियम",
      holiday_trading:"हॉलिडे ट्रेडिंग प्रतिबंध", scalping:"स्कैल्पिंग नियम", hft:"एचएफटी / लेटेंसी नियम",
      ea:"ईए / बॉट नियम", martingale:"मार्टिंगेल / ग्रिड नियम", copy_trading:"कॉपी ट्रेडिंग नियम",
      hedging:"हेजिंग नियम", latency_abuse:"लेटेंसी एब्यूज़ नियम", ip_vpn:"वीपीएन / आईपी नियम",
      multi_account:"मल्टी अकाउंट नीति", kyc_aml:"केवाईसी / एएमएल सत्यापन", payout_cycle:"पेआउट चक्र",
      payout_split:"प्रॉफिट स्प्लिट नियम", payout_denial:"पेआउट रिजेक्शन कारण", scaling_plan:"स्केलिंग प्लान",
      inactivity:"निष्क्रियता नियम", rule_breach_reset:"रीसेट / रीट्राई नीति", challenge_time_limit:"चैलेंज समय सीमा",
      minimum_profitable_days:"न्यूनतम लाभकारी दिन", restricted_instruments:"प्रतिबंधित इंस्ट्रूमेंट",
      leverage_limits:"लेवरेज सीमा", commissions_swaps:"कमीशन और स्वैप नियम", slippage_spread:"स्लिपेज और स्प्रेड शर्तें",
      forbidden_strategies:"प्रतिबंधित रणनीतियाँ", account_merging:"अकाउंट मर्जिंग नियम", stop_loss_rule:"अनिवार्य स्टॉप-लॉस नियम"
    };
    const hiRule = hiNameMap[entry.id] || "यह नियम";
    const hiExamples = {
      daily_drawdown:"उदाहरण: यदि खाते का आकार $100,000 है और दैनिक हानि सीमा 5% है, तो $5,000 नुकसान के बाद उसी दिन ट्रेड बंद कर दें।",
      overall_drawdown:"उदाहरण: यदि अधिकतम कुल हानि $10,000 है, तो इक्विटी उस स्तर तक जाते ही खाता फेल माना जाएगा।",
      news_trading:"उदाहरण: यदि नियम NFP से 2 मिनट पहले और 2 मिनट बाद ट्रेड रोकता है, तो उस विंडो में एंट्री नहीं करनी चाहिए।",
      weekend:"उदाहरण: कुछ फर्म शुक्रवार मार्केट बंद होने से पहले सभी पोज़िशन बंद करवाती हैं।",
      payout_cycle:"उदाहरण: पेआउट हर 14 दिन पर है, तो 9वें दिन अनुरोध करने पर रिजेक्ट हो सकता है।"
    };
    return {
      meaning: `${hiRule} का सरल अर्थ: यह नियम आपके खाते की सुरक्षा सीमा तय करता है। इसका उद्देश्य यह है कि ट्रेडर अनुशासन में रहे, जोखिम नियंत्रित रहे और एक ही दिन की गलती से पूरा अकाउंट खराब न हो। इस नियम को हमेशा सख्ती से मानना चाहिए।`,
      failure: `ट्रेडर आमतौर पर इस नियम में इसलिए फेल होते हैं क्योंकि वे नुकसान के बाद लॉट साइज़ बढ़ा देते हैं, नियम की टाइमिंग नहीं पढ़ते, और एंट्री से पहले बची हुई जोखिम सीमा नहीं देखते। तेज़ मार्केट में यह गलती बहुत जल्दी नियम उल्लंघन में बदल जाती है।`,
      safe: `सुरक्षित तरीका: हर ट्रेड से पहले जोखिम राशि लिखें, फिक्स्ड लॉट साइज़ रखें, और अपने निजी स्टॉप-लिमिट पर पहुंचते ही ट्रेडिंग रोक दें। अगर फर्म की सीमा बची भी हो, तब भी अनुशासन से काम करें। यही तरीका चैलेंज अकाउंट को लंबे समय तक सुरक्षित रखता है।`,
      example: `सरल उदाहरण: ${hiExamples[entry.id] || `मान लीजिए आप ${hiRule} के नियम पर ट्रेड कर रहे हैं। पहले अधिकतम अनुमत नुकसान निकालें, फिर उसी के अनुसार लॉट सेट करें, और सीमा के पास पहुँचते ही नई एंट्री बंद कर दें।`}`
    };
  }
  if (lang === "ng") {
    return {
      meaning: `${entry.name} mean say this na safety rule wey protect your account from excess risk. If you follow am every day, your account go last longer and your trading results go dey more stable.`,
      failure: `Why traders dey fail am: dem dey increase lot after loss, dem no check rule timing, and dem no calculate remaining risk before entry. For volatile market, small mistake fit quickly become rule breach.`,
      safe: `How to stay safe: use fixed risk per trade, write your daily limit before session, and stop trading once your personal cap don near. Calm and discipline dey save funded account.`,
      example: `Example: before you open trade under ${entry.name}, calculate your max allowed loss first, set lot size from that number, and avoid new entries when you dey close to limit.`
    };
  }
  if (lang === "fr") {
    return {
      meaning: `Règle ${entry.name} : cette règle fixe une limite de sécurité pour protéger le compte. Son objectif est de contrôler le risque, éviter le sur-trading et maintenir une performance régulière.`,
      failure: `Pourquoi les traders échouent : ils augmentent la taille des positions après une perte, ignorent les horaires de restriction et entrent sans vérifier le risque restant. En forte volatilité, l’erreur devient rapidement une violation.`,
      safe: `Approche prudente : définissez un risque fixe par trade, vérifiez la limite restante avant chaque entrée, et arrêtez la session quand votre seuil personnel est atteint. La discipline protège le capital.`,
      example: `Exemple simple : pour ${entry.name}, calculez d’abord la perte maximale autorisée, adaptez la taille de lot, puis évitez toute nouvelle entrée près de la limite.`
    };
  }
  if (lang === "es") {
    return {
      meaning: `Regla ${entry.name}: esta regla marca un límite de seguridad para proteger la cuenta. Sirve para controlar el riesgo, evitar el sobretrading y mantener resultados consistentes.`,
      failure: `Por qué fallan los traders: aumentan el lote después de perder, ignoran ventanas de tiempo de la regla y entran sin revisar el riesgo restante. En mercados volátiles, el error se convierte rápido en violación.`,
      safe: `Forma segura: usa riesgo fijo por operación, revisa el límite disponible antes de cada entrada y detén la sesión cuando llegues a tu tope personal. La disciplina protege el capital.`,
      example: `Ejemplo simple: con ${entry.name}, primero calcula la pérdida máxima permitida, ajusta el tamaño del lote y evita nuevas entradas cuando estés cerca del límite.`
    };
  }
  if (lang === "ar") {
    return {
      meaning: `قاعدة ${entry.name}: هذه القاعدة تضع حد أمان لحماية الحساب من المخاطرة الزائدة. الهدف منها هو ضبط المخاطر ومنع التداول العشوائي والحفاظ على نتائج مستقرة.`,
      failure: `سبب الفشل المتكرر: المتداول يزيد حجم العقد بعد الخسارة، أو يتجاهل توقيت القاعدة، أو يدخل صفقة بدون حساب المخاطرة المتبقية. في السوق السريع يتحول الخطأ إلى مخالفة بسرعة.`,
      safe: `الطريقة الآمنة: استخدم مخاطرة ثابتة لكل صفقة، وراجع الحد المتبقي قبل كل دخول، وأوقف التداول عند الوصول إلى حدك الشخصي. الانضباط هو حماية رأس المال.`,
      example: `مثال بسيط: في ${entry.name} احسب أولاً أقصى خسارة مسموحة، ثم اضبط حجم العقد بناءً عليها، وتجنب أي دخول جديد عند الاقتراب من الحد.`
    };
  }
  return long;
}

export const SUPPORTED_LANGUAGES = Object.freeze([
  { code: "en", label: "English", speechLocale: "en-US" },
  { code: "hinglish", label: "Hinglish", speechLocale: "en-IN" },
  { code: "hi", label: "Hindi", speechLocale: "hi-IN" },
  { code: "ng", label: "Nigerian English", speechLocale: "en-NG" },
  { code: "fr", label: "French", speechLocale: "fr-FR" },
  { code: "es", label: "Spanish", speechLocale: "es-ES" },
  { code: "ar", label: "Arabic", speechLocale: "ar-SA" }
]);

export function listRules({ category = "" } = {}) {
  const wanted = String(category || "").trim().toLowerCase();
  return RULE_DATA
    .filter((rule) => !wanted || rule.category.toLowerCase() === wanted)
    .map((rule) => ({ ...rule }));
}

export function listCategories() {
  return [...new Set(RULE_DATA.map((rule) => rule.category))].sort();
}

export function getRule(ruleId) {
  const id = String(ruleId || "").trim().toLowerCase();
  const rule = RULE_DATA.find((item) => item.id === id);
  return rule ? { ...rule } : null;
}

export function searchRules(term = "") {
  const query = String(term || "").trim().toLowerCase();
  if (!query) return listRules();
  return RULE_DATA
    .filter((rule) => [rule.id, rule.name, rule.category, rule.meaning, rule.failure, rule.safe]
      .some((value) => String(value || "").toLowerCase().includes(query)))
    .map((rule) => ({ ...rule }));
}

export function explainRule(ruleId, language = "en") {
  const rule = getRule(ruleId);
  if (!rule) throw new Error(`Unknown rule: ${ruleId}`);
  const lang = SUPPORTED_LANGUAGES.some((item) => item.code === language) ? language : "en";
  return {
    rule: { id: rule.id, name: rule.name, category: rule.category },
    language: lang,
    ...localize(rule, lang)
  };
}

export function explanationToText(explanation) {
  if (!explanation) return "";
  return [explanation.meaning, explanation.failure, explanation.safe, explanation.example]
    .filter(Boolean)
    .join(" ");
}

export { RULE_DATA, RULE_EXAMPLES, buildLongCopy, localize };

