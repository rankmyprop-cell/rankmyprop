import {
  SUPPORTED_LANGUAGES,
  explainRule,
  explanationToText,
  listCategories,
  listRules,
  searchRules
} from "./rule-explainer-core.js";
import {
  speakRule,
  pauseSpeech,
  resumeSpeech,
  cancelSpeech
} from "./rule-explainer-speech.js";

const tools = [
  { key: "lotsize", index: "01", title: "Lot Size Calculator", href: "/lotsizecalculator", copy: "Convert a fixed account-risk budget and stop distance into a practical position size.", tag: "Position sizing" },
  { key: "rr", index: "02", title: "Risk-to-Reward", href: "/risk-to-reward-calculator", copy: "Validate entry, stop and target levels before committing capital to a setup.", tag: "Trade planning" },
  { key: "drawdown", index: "03", title: "Drawdown Calculator", href: "/drawdown-calculator", copy: "Monitor daily and maximum loss buffers against a prop account’s limits.", tag: "Breach control" },
  { key: "split", index: "04", title: "Profit Split Calculator", href: "/profit-split-calculator", copy: "Estimate the trader share, firm share, fees and reserve from a payout.", tag: "Payout planning" },
  { key: "consistency", index: "05", title: "Consistency Rule", href: "/consistency-rule-calculator", copy: "See whether the largest winning day fits a firm’s profit-concentration rule.", tag: "Rule check" },
  { key: "recovery", index: "06", title: "Loss Recovery Planner", href: "/lossrecoveryplanner", copy: "Measure the return required to restore equity after a losing period.", tag: "Recovery plan" },
  { key: "rules", index: "07", title: "Rule Explainer", href: "/ruletranslator", copy: "Browse 41 common prop-firm rule topics with explanations, precautions and practical examples.", tag: "Rule library" },
  { key: "journal", index: "08", title: "Trade Journal", href: "/tradejournal", copy: "Log setups, review execution patterns and export a complete performance history.", tag: "Performance" },
];

const definitions = {
  lotsize: {
    title: "Lot Size Calculator",
    seoHeading: "Forex Lot Size Calculator for Prop Firm Traders",
    seoTitle: "Forex Lot Size Calculator | Rank My Prop",
    seoDescription: "Calculate forex lot size from account balance, risk percentage, stop-loss distance and pip value before placing a trade.",
    accent: "Position sizing",
    hero: "Calculate a position size <span>before placing the order.</span>",
    description: "Use account balance, risk percentage, stop-loss distance and pip value to estimate a suitable forex position size.",
    side: ["Live calculation", ["Output", "Lots + units"], ["Model", "Fixed cash risk"], ["Input", "Custom pip value"]],
    panel: ["Trade parameters", "Use the actual pip value for one standard lot in your account currency."],
    form: `
      ${field("Account balance", "balance", "number", "10000", "$", "", "Capital used to calculate the risk budget.")}
      ${field("Risk per trade", "risk", "number", "1", "", "%", "The maximum planned loss for this setup.", ".01")}
      ${field("Stop loss", "stop", "number", "25", "", "pips", "Distance from entry to stop.", ".1")}
      ${field("Pip value / standard lot", "pip", "number", "10", "$", "", "For many USD-quoted FX pairs in a USD account this is about $10; use your broker’s actual value.", ".01")}
    `,
    result: ["Recommended size", "lots", "Standard lots, rounded down to 0.01"],
    rows: [["Cash at risk", "cashRisk"], ["Position units", "units"], ["Risk per pip", "riskPip"], ["Mini lots", "miniLots"]],
    note: "Pip value changes by instrument, quote currency and account currency. Verify the value shown by your trading platform before placing an order.",
    insights: [
      ["⌁", "Risk budget first", "Position size is an output of your risk budget—not a target to maximize."],
      ["↔", "Stop distance matters", "A wider stop carries more cash risk per lot and therefore reduces the allowable size."],
      ["◎", "Use platform values", "Cross-currency pairs, metals, indices and CFDs can have different contract and pip values."]
    ],
    faqs: [
      ["How is the lot size calculated?", "Cash risk equals account balance multiplied by risk percentage. Lots equal cash risk divided by stop-loss pips multiplied by pip value per standard lot."],
      ["Why is the pip value editable?", "The monetary value of a pip depends on the instrument, position size, account currency and conversion rate. An editable field avoids pretending one value works for every market."],
      ["Does this include spread and slippage?", "No. Add a buffer to the stop distance or reduce the final size if spread, commissions or slippage could increase the actual loss."],
      ["Should I always risk 1%?", "No. The correct risk limit depends on your plan and the firm’s rules. The calculator accepts any positive percentage so you can model a smaller risk budget."]
    ]
  },
  rr: {
    title: "Risk-to-Reward Calculator",
    seoHeading: "Risk-to-Reward Calculator for Forex Traders",
    seoTitle: "Risk-to-Reward Calculator | Rank My Prop",
    seoDescription: "Calculate forex reward-to-risk ratio, cash risk, projected reward and theoretical break-even win rate from planned trade prices.",
    accent: "Trade planning",
    hero: "Review the planned <span>risk and reward.</span>",
    description: "Compare entry, stop-loss and target prices, then calculate the reward multiple and theoretical break-even win rate.",
    side: ["Setup quality", ["Output", "R multiple"], ["Includes", "Break-even rate"], ["Direction", "Long or short"]],
    panel: ["Price plan", "Enter the intended prices and position direction. The tool checks their order."],
    form: `
      ${selectField("Direction", "direction", [["long","Long"],["short","Short"]])}
      ${field("Account balance", "balance", "number", "10000", "$", "", "", ".01")}
      ${field("Entry price", "entry", "number", "1.0850", "", "", "", ".00001")}
      ${field("Stop price", "stopPrice", "number", "1.0800", "", "", "", ".00001")}
      ${field("Target price", "target", "number", "1.0950", "", "", "", ".00001")}
      ${field("Risk per trade", "risk", "number", "1", "", "%", "", ".01")}
    `,
    result: ["Reward-to-risk", "ratio", "Potential reward for every 1 unit risked"],
    rows: [["Risk distance", "riskDistance"], ["Reward distance", "rewardDistance"], ["Cash at risk", "cashRisk"], ["Projected reward", "cashReward"], ["Break-even win rate", "breakEven"]],
    note: "This is a planning ratio, not a probability forecast. Trading costs and imperfect fills reduce realized results.",
    insights: [
      ["↗", "Direction-aware", "For a long trade the stop should sit below entry and the target above it; the inverse applies to a short."],
      ["%", "Break-even rate", "A higher reward multiple lowers the theoretical win rate needed before costs, but may be harder to achieve."],
      ["⊕", "Think in R", "Expressing wins and losses as multiples of initial risk makes different setups easier to compare."]
    ],
    faqs: [
      ["What does a 2:1 reward-to-risk ratio mean?", "The planned reward is twice the price distance or cash amount placed at risk. It does not mean the trade is twice as likely to win."],
      ["How is break-even win rate calculated?", "Before costs it is 1 divided by 1 plus the reward-to-risk multiple. A 2R target therefore has a theoretical break-even rate of about 33.33%."],
      ["Does a high ratio guarantee a profitable strategy?", "No. Expectancy depends on the achieved win rate, realized average win, realized average loss and trading costs."],
      ["Why does the tool flag my price order?", "A long setup needs stop below entry and target above entry. A short setup needs stop above entry and target below entry."]
    ]
  },
  drawdown: {
    title: "Drawdown Calculator",
    seoHeading: "Prop Firm Drawdown Calculator",
    seoTitle: "Prop Firm Drawdown Calculator | Rank My Prop",
    seoDescription: "Calculate daily and maximum prop firm drawdown, remaining loss buffers and recovery percentage using clear account references.",
    accent: "Breach control",
    hero: "Check the remaining <span>drawdown allowance.</span>",
    description: "Compare current equity with daily and maximum loss limits using clearly stated reference balances.",
    side: ["Risk monitor", ["Output", "Daily + overall"], ["Method", "Static limits"], ["Warning", "Verify firm rules"]],
    panel: ["Account limits", "This model uses static percentage limits from the selected reference balances."],
    form: `
      ${field("Initial balance", "initial", "number", "100000", "$", "", "", ".01")}
      ${field("Current equity", "equity", "number", "97000", "$", "", "Use equity if the firm includes floating P&L.", ".01")}
      ${field("Day-start balance/equity", "dayStart", "number", "99000", "$", "", "Use the firm’s defined daily reference.", ".01")}
      ${field("Daily loss limit", "dailyLimit", "number", "5", "", "%", "", ".01")}
      ${field("Maximum loss limit", "maxLimit", "number", "10", "", "%", "", ".01")}
      ${selectField("Limit model", "model", [["static","Static percentage"],["trailing","Trailing — estimate only"]], "Firm-specific trailing rules vary; this tool does not recreate every reset rule.")}
    `,
    result: ["Overall drawdown", "overallDd", "From initial balance to current equity"],
    rows: [["Daily drawdown", "dailyDd"], ["Overall buffer left", "overallBuffer"], ["Daily buffer left", "dailyBuffer"], ["Recovery to initial", "recovery"], ["Risk state", "riskState"]],
    note: "Prop firms differ on balance versus equity, intraday versus end-of-day, static versus trailing drawdown, and reset times. Confirm the official rule wording.",
    insights: [
      ["▥", "Two separate limits", "Daily loss and maximum loss can use different reference points and reset behavior."],
      ["◌", "Equity can matter", "Some rules include open P&L, so a position can reduce the available buffer before it is closed."],
      ["!", "Trailing is firm-specific", "A trailing floor may move with balance or equity and sometimes stops trailing after a threshold."]
    ],
    faqs: [
      ["What is the difference between daily and maximum drawdown?", "Daily drawdown measures loss against a daily reference and normally resets at a specified time. Maximum drawdown measures the account against a broader static or trailing floor."],
      ["Why does the calculator use current equity?", "Equity captures both realized balance and open profit or loss. Use balance only if the relevant firm’s rule explicitly ignores floating P&L."],
      ["Does the trailing option reproduce my firm’s exact logic?", "No. It is labelled as an estimate because trailing rules can update intraday or end-of-day and may use different high-water marks."],
      ["What happens when the buffer is negative?", "The entered equity is beyond the modeled limit. Actual breach status must still be confirmed in the firm dashboard and official rules."]
    ]
  },
  split: {
    title: "Profit Split Calculator",
    seoHeading: "Prop Firm Profit Split Calculator",
    seoTitle: "Prop Firm Profit Split Calculator | Rank My Prop",
    seoDescription: "Estimate a prop firm payout with adjustable trader profit share, firm share, processing fee and optional personal reserve.",
    accent: "Payout planning",
    hero: "Estimate the <span>payout breakdown.</span>",
    description: "Calculate the trader share, firm share, processing cost and an optional personal reserve from eligible profit.",
    side: ["Payout desk", ["Output", "Net estimate"], ["Split", "Fully adjustable"], ["Reserve", "Optional"]],
    panel: ["Payout assumptions", "Enter the profit eligible for the current withdrawal window."],
    form: `
      ${field("Eligible gross profit", "profit", "number", "5000", "$", "", "", ".01")}
      ${field("Trader profit share", "share", "number", "80", "", "%", "", ".01")}
      ${field("Processing / withdrawal fee", "fee", "number", "0", "", "%", "Only enter a fee if it applies.", ".01")}
      ${field("Personal tax reserve", "tax", "number", "0", "", "%", "Planning reserve only, not tax advice.", ".01")}
    `,
    result: ["Estimated amount received", "net", "After the entered split and processing fee"],
    rows: [["Trader gross share", "traderShare"], ["Firm share", "firmShare"], ["Processing fee", "feeAmount"], ["Personal reserve", "taxReserve"], ["After reserve", "afterReserve"]],
    note: "Eligibility, caps, minimum payout amounts, payment fees and taxes vary. This calculator only applies the percentages entered.",
    insights: [
      ["÷", "Split the eligible profit", "The profit split normally applies to eligible profit, not the headline account size."],
      ["⇣", "Separate fees", "Processing fees are modeled after the trader share so the deduction is visible."],
      ["◇", "Reserve is personal", "The optional reserve helps cash-flow planning but does not calculate legal tax liability."]
    ],
    faqs: [
      ["How is the trader share calculated?", "Eligible gross profit is multiplied by the trader share percentage. The remaining percentage is shown as the firm share."],
      ["Does the calculator know whether I am payout-eligible?", "No. Eligibility can depend on trading days, consistency, minimum amount, account status and other firm rules."],
      ["Is the tax reserve a tax calculation?", "No. It is an optional personal planning amount. Tax treatment depends on jurisdiction and individual circumstances."],
      ["Why are processing fees separate from the split?", "A profit split allocates profit between trader and firm, while a processing fee may be an additional deduction from the trader’s share."]
    ]
  },
  consistency: {
    title: "Consistency Rule Calculator",
    seoHeading: "Prop Firm Consistency Rule Calculator",
    seoTitle: "Prop Firm Consistency Calculator | Rank My Prop",
    seoDescription: "Calculate best-day profit consistency percentage and the additional net profit required to meet a selected prop firm cap.",
    accent: "Rule check",
    hero: "Check the <span>best-day percentage.</span>",
    description: "Measure the largest winning day against total net profit and calculate the additional profit required for a selected cap.",
    side: ["Consistency monitor", ["Formula", "Best day ÷ total"], ["Output", "Pass / needs profit"], ["Cap", "Firm-defined"]],
    panel: ["Payout window", "Use figures from the same evaluation or payout calculation window."],
    form: `
      ${field("Total net profit", "totalProfit", "number", "2800", "$", "", "Must be positive for a meaningful ratio.", ".01")}
      ${field("Largest winning day", "bestDay", "number", "1200", "$", "", "", ".01")}
      ${field("Maximum allowed", "cap", "number", "50", "", "%", "Enter the exact cap in the firm’s current rules.", ".01")}
      ${field("Required profit target", "profitTarget", "number", "3000", "$", "", "Optional comparison target.", ".01")}
    `,
    result: ["Consistency percentage", "consistency", "Largest day as a share of total net profit"],
    rows: [["Rule status", "status"], ["Minimum total profit", "minimumTotal"], ["Additional profit needed", "additional"], ["Profit target progress", "targetProgress"]],
    note: "Some firms compare the best day with a fixed profit target, while others compare it with total net profit in a payout window. Enter values that match the applicable rule.",
    insights: [
      ["▥", "Use one window", "Do not mix a best day from one payout period with total profit from another."],
      ["≤", "Cap is configurable", "40% and 50% are common examples, but the firm’s current rule controls."],
      ["↗", "More balanced profit", "If the best day is locked, additional smaller profitable days can reduce its share of total profit."]
    ],
    faqs: [
      ["How is consistency percentage calculated?", "For the model used here, largest winning day is divided by total net profit and multiplied by 100."],
      ["How is the additional profit needed calculated?", "Minimum total profit equals largest winning day divided by the allowed decimal cap. The tool subtracts current total profit from that minimum."],
      ["Does a result above the cap always fail an account?", "No. Consequences vary. Some programs increase the profit target or delay payout eligibility rather than immediately closing the account."],
      ["Can losing days increase the percentage?", "Yes. If total net profit falls while the largest winning day stays fixed, that day becomes a larger percentage of total profit."]
    ]
  },
  recovery: {
    title: "Loss Recovery Planner",
    seoHeading: "Trading Loss Recovery Calculator",
    seoTitle: "Trading Loss Recovery Calculator | Rank My Prop",
    seoDescription: "Calculate the percentage return and capital required to recover from a trading drawdown, with simple compounded scenarios.",
    accent: "Recovery planning",
    hero: "Measure the return <span>required after a loss.</span>",
    description: "Compare current equity with a recovery target and review simple compounded-return scenarios.",
    side: ["Equity recovery", ["Output", "Required return"], ["Scenarios", "0.5% / 1% / 2%"], ["Assumption", "Compounded"]],
    panel: ["Recovery baseline", "Compare current equity with a target balance and a realistic average net return."],
    form: `
      ${field("Starting balance", "start", "number", "100000", "$", "", "", ".01")}
      ${field("Current balance", "current", "number", "90000", "$", "", "", ".01")}
      ${field("Recovery target", "targetBalance", "number", "100000", "$", "", "Can be different from starting balance.", ".01")}
      ${field("Average net return / trade", "returnRate", "number", "1", "", "%", "Scenario input, not a forecast.", ".01")}
    `,
    result: ["Return required", "requiredReturn", "Gain needed on current equity to reach the target"],
    rows: [["Current drawdown", "drawdown"], ["Capital to recover", "capitalNeeded"], ["Trades at chosen return", "trades"], ["At 0.5% / trade", "trades05"], ["At 2% / trade", "trades2"]],
    note: "The trade-count scenarios assume a constant positive compounded return with no losses or costs. Real trading paths are uneven; use this only for planning.",
    insights: [
      ["↺", "Losses are asymmetric", "A 10% loss requires an 11.11% gain on the smaller balance to return to even."],
      ["≋", "Avoid forced recovery", "Increasing risk to win losses back faster can reduce the remaining drawdown buffer."],
      ["◇", "Scenario, not promise", "Compounded trade counts show mathematical paths, not expected or guaranteed outcomes."]
    ],
    faqs: [
      ["Why is recovery percentage larger than drawdown percentage?", "After a loss, gains are earned on a smaller capital base. Returning from $90 to $100 needs $10, which is 11.11% of $90."],
      ["How are estimated trades calculated?", "The tool uses a compounded-growth equation based on the entered average net return per trade and rounds up to the next whole trade."],
      ["Does the estimate include losing trades?", "No. It is a clean mathematical scenario. A real sequence with wins, losses and costs will differ."],
      ["Should I raise risk after a drawdown?", "The calculator does not recommend doing so. Any risk change should remain inside a tested plan and the account’s loss limits."]
    ]
  }
};

function field(label, id, type, value, prefix = "", suffix = "", hint = "", step = "1") {
  return `<div class="calc-field">
    <label for="${id}">${label}</label>
    <div class="calc-input-wrap">
      ${prefix ? `<span>${prefix}</span>` : ""}
      <input id="${id}" name="${id}" type="${type}" value="${value}" step="${step}" min="0" class="${prefix ? "has-prefix " : ""}${suffix ? "has-suffix" : ""}">
      ${suffix ? `<span class="after">${suffix}</span>` : ""}
    </div>
    ${hint ? `<small class="calc-field-hint">${hint}</small>` : ""}
  </div>`;
}

function selectField(label, id, options, hint = "") {
  return `<div class="calc-field">
    <label for="${id}">${label}</label>
    <div class="calc-select-wrap">
      <select id="${id}" name="${id}">${options.map(([value, text]) => `<option value="${value}">${text}</option>`).join("")}</select>
      <span class="calc-select-chevron" aria-hidden="true"></span>
    </div>
    ${hint ? `<small class="calc-field-hint">${hint}</small>` : ""}
  </div>`;
}

function n(id) {
  const value = Number(document.getElementById(id)?.value);
  return Number.isFinite(value) ? value : 0;
}

function money(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits }).format(value);
}

function number(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function percent(value, digits = 2) {
  return Number.isFinite(value) ? `${number(value, digits)}%` : "—";
}

function setOut(id, value) {
  const element = document.querySelector(`[data-out="${id}"]`);
  if (element) element.textContent = value;
}

function setNote(text, state = "") {
  const note = document.querySelector(".result-note");
  if (!note) return;
  note.textContent = text;
  note.className = `result-note ${state}`.trim();
}

function calculate(key) {
  if (key === "lotsize") {
    const balance = n("balance"), risk = n("risk"), stop = n("stop"), pip = n("pip");
    const cash = balance * risk / 100;
    const rawLots = stop > 0 && pip > 0 ? cash / (stop * pip) : NaN;
    const lots = Number.isFinite(rawLots) ? Math.floor(rawLots * 100) / 100 : NaN;
    setOut("lots", Number.isFinite(lots) ? `${number(lots)} lots` : "—");
    setOut("cashRisk", money(cash));
    setOut("units", Number.isFinite(lots) ? number(lots * 100000, 0) : "—");
    setOut("riskPip", stop > 0 ? money(cash / stop) : "—");
    setOut("miniLots", Number.isFinite(lots) ? number(lots * 10) : "—");
    setNote(definitions.lotsize.note, cash > balance ? "bad" : "");
  }

  if (key === "rr") {
    const direction = document.getElementById("direction")?.value;
    const entry = n("entry"), stop = n("stopPrice"), target = n("target");
    const valid = direction === "long" ? stop < entry && target > entry : stop > entry && target < entry;
    const riskDistance = Math.abs(entry - stop);
    const rewardDistance = Math.abs(target - entry);
    const ratio = riskDistance > 0 && valid ? rewardDistance / riskDistance : NaN;
    const cashRisk = n("balance") * n("risk") / 100;
    setOut("ratio", Number.isFinite(ratio) ? `1 : ${number(ratio)}` : "Invalid setup");
    setOut("riskDistance", valid ? number(riskDistance, 5) : "—");
    setOut("rewardDistance", valid ? number(rewardDistance, 5) : "—");
    setOut("cashRisk", money(cashRisk));
    setOut("cashReward", Number.isFinite(ratio) ? money(cashRisk * ratio) : "—");
    setOut("breakEven", Number.isFinite(ratio) ? percent(100 / (1 + ratio)) : "—");
    setNote(valid ? definitions.rr.note : `For a ${direction} setup, the stop and target are on the wrong side of entry.`, valid ? "" : "bad");
  }

  if (key === "drawdown") {
    const initial = n("initial"), equity = n("equity"), dayStart = n("dayStart");
    const dailyLimit = n("dailyLimit"), maxLimit = n("maxLimit");
    const overallDd = initial > 0 ? Math.max(0, (initial - equity) / initial * 100) : NaN;
    const dailyDd = dayStart > 0 ? Math.max(0, (dayStart - equity) / dayStart * 100) : NaN;
    const maxFloor = initial * (1 - maxLimit / 100);
    const dailyFloor = dayStart * (1 - dailyLimit / 100);
    const overallBuffer = equity - maxFloor;
    const dailyBuffer = equity - dailyFloor;
    const recovery = equity > 0 && initial > equity ? (initial - equity) / equity * 100 : 0;
    const state = overallBuffer < 0 || dailyBuffer < 0 ? "Beyond modeled limit" : Math.min(overallBuffer, dailyBuffer) < initial * .01 ? "Critical buffer" : "Inside modeled limits";
    setOut("overallDd", percent(overallDd));
    setOut("dailyDd", percent(dailyDd));
    setOut("overallBuffer", money(overallBuffer));
    setOut("dailyBuffer", money(dailyBuffer));
    setOut("recovery", percent(recovery));
    setOut("riskState", state);
    setNote(definitions.drawdown.note, state === "Beyond modeled limit" ? "bad" : state === "Critical buffer" ? "warn" : "good");
  }

  if (key === "split") {
    const profit = n("profit"), share = Math.min(n("share"), 100), fee = n("fee"), tax = n("tax");
    const trader = profit * share / 100;
    const firm = profit - trader;
    const feeAmount = trader * fee / 100;
    const net = trader - feeAmount;
    const reserve = net * tax / 100;
    setOut("net", money(net));
    setOut("traderShare", money(trader));
    setOut("firmShare", money(firm));
    setOut("feeAmount", money(feeAmount));
    setOut("taxReserve", money(reserve));
    setOut("afterReserve", money(net - reserve));
    setNote(definitions.split.note);
  }

  if (key === "consistency") {
    const total = n("totalProfit"), best = n("bestDay"), cap = n("cap"), target = n("profitTarget");
    const value = total > 0 ? best / total * 100 : NaN;
    const minTotal = cap > 0 ? best / (cap / 100) : NaN;
    const additional = Number.isFinite(minTotal) ? Math.max(0, minTotal - total) : NaN;
    const passed = Number.isFinite(value) && value <= cap;
    setOut("consistency", percent(value));
    setOut("status", Number.isFinite(value) ? (passed ? "Within cap" : "More profit needed") : "Enter positive profit");
    setOut("minimumTotal", money(minTotal));
    setOut("additional", money(additional));
    setOut("targetProgress", target > 0 ? percent(total / target * 100) : "—");
    setNote(passed ? "The entered figures are within the selected concentration cap. Confirm every other payout or evaluation condition separately." : definitions.consistency.note, passed ? "good" : "warn");
  }

  if (key === "recovery") {
    const start = n("start"), current = n("current"), target = n("targetBalance"), rate = n("returnRate") / 100;
    const drawdown = start > 0 ? Math.max(0, (start - current) / start * 100) : NaN;
    const capital = Math.max(0, target - current);
    const required = current > 0 ? capital / current * 100 : NaN;
    const tradesFor = (r) => current > 0 && target > current && r > 0 ? Math.ceil(Math.log(target / current) / Math.log(1 + r)) : target <= current ? 0 : NaN;
    setOut("requiredReturn", percent(required));
    setOut("drawdown", percent(drawdown));
    setOut("capitalNeeded", money(capital));
    setOut("trades", Number.isFinite(tradesFor(rate)) ? `${tradesFor(rate)} trades` : "—");
    setOut("trades05", `${tradesFor(.005)} trades`);
    setOut("trades2", `${tradesFor(.02)} trades`);
    setNote(definitions.recovery.note, drawdown >= 8 ? "warn" : "");
  }
}

function emphasizedHeading(value) {
  const words = String(value || "").trim().split(/\s+/);
  if (words.length < 2) return words.join(" ");
  const accentCount = Math.max(2, Math.ceil(words.length * .38));
  const splitAt = Math.max(1, words.length - accentCount);
  return `${words.slice(0, splitAt).join(" ")} <span>${words.slice(splitAt).join(" ")}</span>`;
}

function applyPageSeo(definition) {
  const seoTitle = definition.seoTitle || `${definition.title} | Rank My Prop`;
  const seoHeading = definition.seoHeading || definition.title;
  const description = definition.seoDescription || definition.description;
  const canonicalUrl = `https://www.rankmyprop.in${window.location.pathname.replace(/\.html$/, "")}`;
  document.title = seoTitle;

  const setMeta = (selector, attributes) => {
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      document.head.appendChild(element);
    }
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  };
  setMeta('meta[name="description"]', { name: "description", content: description });
  setMeta('meta[name="robots"]', { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" });
  setMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
  setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "Rank My Prop" });
  setMeta('meta[property="og:title"]', { property: "og:title", content: seoTitle });
  setMeta('meta[property="og:description"]', { property: "og:description", content: description });
  setMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
  setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary" });
  setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: seoTitle });
  setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;

  let schema = document.getElementById("calculatorPageSchema");
  if (!schema) {
    schema = document.createElement("script");
    schema.id = "calculatorPageSchema";
    schema.type = "application/ld+json";
    document.head.appendChild(schema);
  }
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seoHeading,
    headline: seoHeading,
    description,
    url: canonicalUrl,
    dateModified: "2026-07-27",
    isPartOf: { "@type": "WebSite", name: "Rank My Prop", url: "https://www.rankmyprop.in/" },
    publisher: {
      "@type": "Organization",
      name: "Rank My Prop",
      url: "https://www.rankmyprop.in/",
      logo: { "@type": "ImageObject", url: "https://www.rankmyprop.in/assets/Rank%20My%20Prop%20Logo%201.webp" }
    }
  });
}

function pageIntro(definition) {
  return `<header class="calc-page-intro">
    <h1>${emphasizedHeading(definition.seoHeading || definition.title)}</h1>
    <p>${definition.description}</p>
    <small>Last Updated: July 27, 2026</small>
  </header>`;
}

function hero(definition) {
  return `<section class="calc-hero">
    <div class="calc-hero-copy">
      <span class="calc-kicker">${definition.accent}</span>
      <h2>${definition.hero}</h2>
      <p>${definition.workspaceCopy || "Enter the figures below and review the calculation assumptions before using the result."}</p>
    </div>
    <aside class="calc-hero-side">
      <span class="hero-side-label">${definition.side[0]}</span>
      <strong class="hero-side-title">Calculation workspace</strong>
      ${definition.side.slice(1).map(([label, value]) => `<div class="hero-metric"><span>${label}</span><strong>${value}</strong></div>`).join("")}
    </aside>
  </section>`;
}

function renderCalculator(key) {
  const definition = definitions[key];
  applyPageSeo(definition);
  document.getElementById("calculatorRoot").innerHTML = `<main class="calc-page"><div class="calc-shell">
    ${pageIntro(definition)}
    ${hero(definition)}
    <section class="calc-workspace">
      <div class="calc-card">
        <div class="calc-card-head"><div><span>${definition.accent}</span><h2>${definition.panel[0]}</h2><p>${definition.panel[1]}</p></div><button class="calc-reset" type="button">Reset</button></div>
        <form class="calc-form" id="calculatorForm">${definition.form}</form>
      </div>
      <aside class="calc-card calc-results">
        <div class="result-primary"><span>${definition.result[0]}</span><strong data-out="${definition.result[1]}">—</strong><small>${definition.result[2]}</small></div>
        <div class="result-list">${definition.rows.map(([label, output]) => `<div class="result-row"><span>${label}</span><strong data-out="${output}">—</strong></div>`).join("")}</div>
        <div class="result-note">${definition.note}</div>
      </aside>
    </section>
    <section class="calc-insights">${definition.insights.map(([icon, title, copy]) => `<article class="insight-card"><span class="insight-icon">${icon}</span><strong>${title}</strong><p>${copy}</p></article>`).join("")}</section>
    <p class="calc-disclaimer">Educational planning tool only. Outputs depend on the values entered and do not constitute financial, investment, tax or legal advice. Prop-firm terms can change; verify the current official rules before trading or purchasing a challenge.</p>
  </div></main>`;

  const form = document.getElementById("calculatorForm");
  const initial = new FormData(form);
  const refresh = () => calculate(key);
  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  form.addEventListener("submit", (event) => event.preventDefault());
  document.querySelector(".calc-reset")?.addEventListener("click", () => {
    for (const [name, value] of initial.entries()) {
      const input = form.elements.namedItem(name);
      if (input) input.value = value;
    }
    refresh();
  });
  refresh();
}

function renderHub() {
  const hub = {
    title: "Trading Calculators",
    seoHeading: "Free Trading Calculators for Prop Firm Traders",
    seoTitle: "Free Trading Calculators for Prop Traders | Rank My Prop",
    seoDescription: "Use free calculators for forex lot size, risk-to-reward, prop firm drawdown, profit split, consistency rules and trading loss recovery.",
    accent: "Trading tools",
    hero: "Choose the calculator <span>for your current task.</span>",
    description: "Free calculators for position sizing, trade planning, drawdown monitoring, payout estimates, consistency checks and loss recovery.",
    workspaceCopy: "Each tool shows its assumptions and updates the result as the inputs change.",
    side: ["Available tools", ["Calculators", "6"], ["Additional tools", "2"], ["Access", "Free"]]
  };
  applyPageSeo(hub);
  document.getElementById("calculatorRoot").innerHTML = `<main class="calc-page"><div class="calc-shell">
    ${pageIntro(hub)}
    ${hero(hub)}
    <section class="hub-grid">${tools.map((tool) => `<a class="tool-card" href="${tool.href}">
      <span class="tool-card-index">${tool.index} · ${tool.tag}</span>
      <h2>${tool.title}</h2><p>${tool.copy}</p>
      <span class="tool-card-footer"><span>Open tool</span><i>↗</i></span>
    </a>`).join("")}</section>
    <section class="calc-insights">
      <article class="insight-card"><span class="insight-icon">1</span><strong>Plan the maximum loss</strong><p>Start with drawdown limits and cash risk. Position size comes after the risk budget.</p></article>
      <article class="insight-card"><span class="insight-icon">2</span><strong>Validate the setup</strong><p>Use entry, stop and target to inspect the potential payoff before execution.</p></article>
      <article class="insight-card"><span class="insight-icon">3</span><strong>Review the outcome</strong><p>Log the trade in your journal so planned risk can be compared with actual execution.</p></article>
    </section>
  </div></main>`;
}

function renderRules() {
  const rule = {
    title: "Prop Firm Rule Explainer",
    seoHeading: "Prop Firm Rule Explainer",
    seoTitle: "Prop Firm Rule Explainer | Rank My Prop",
    seoDescription: "Browse explanations for 41 common prop firm rules covering drawdown, payouts, consistency, strategies and account restrictions in seven languages.",
    accent: "Prop firm rules",
    hero: "Search common rules and <span>read a plain-language explanation.</span>",
    description: "Browse common prop-firm rules in seven languages, with clear explanations, frequent failure patterns, practical precautions and examples.",
    workspaceCopy: "Choose a rule from the library or search by topic. Explanations are generated from the included rule database.",
    side: ["Rule library", ["Rules", `${listRules().length} topics`], ["Languages", `${SUPPORTED_LANGUAGES.length}`], ["Processing", "On this device"]]
  };
  applyPageSeo(rule);
  document.getElementById("calculatorRoot").innerHTML = `<main class="calc-page"><div class="calc-shell">
    ${pageIntro(rule)}
    ${hero(rule)}
    <section class="rule-workspace rule-layout">
      <div class="calc-card">
        <div class="calc-card-head"><div><span>Rule library</span><h2>Choose what you need explained</h2><p>Filter the complete database by keyword, category and language.</p></div><button class="calc-reset" id="resetRuleFilters" type="button">Reset</button></div>
        <form class="calc-form" id="ruleForm">
          <div class="calc-field full">
            <label for="ruleSearch">Search rules <small id="ruleMatchCount">${listRules().length} matches</small></label>
            <div class="calc-input-wrap"><span>⌕</span><input class="has-prefix" id="ruleSearch" type="search" placeholder="Try drawdown, weekend, news, payout…"></div>
          </div>
          ${selectField("Category", "ruleCategory", [["","All categories"], ...listCategories().map((category) => [category, category])])}
          ${selectField("Language", "ruleLanguage", SUPPORTED_LANGUAGES.map(({ code, label }) => [code, label]))}
          <div class="calc-field full"><label for="ruleSelect">Rule topic</label><div class="calc-select-wrap"><select id="ruleSelect">${listRules().map((item) => `<option value="${item.id}">${item.name} · ${item.category}</option>`).join("")}</select><span class="calc-select-chevron" aria-hidden="true"></span></div><small class="calc-field-hint">Explanations use the included rule library and stay on this device.</small></div>
          <div class="calc-field full rule-language-field">
            <label>Quick language selection <small>7 languages</small></label>
            <div class="rule-language-options" id="ruleLanguageOptions" role="group" aria-label="Explanation language">
              ${SUPPORTED_LANGUAGES.map(({ code, label }) => `<button type="button" data-language="${code}" aria-pressed="${code === "en"}"><span>${code === "hinglish" ? "HI+" : code.toUpperCase()}</span>${label}</button>`).join("")}
            </div>
          </div>
          <div class="calc-actions"><button class="calc-button" id="explainRuleButton" type="submit">Explain selected rule</button><button class="calc-button secondary" id="copyExplanation" type="button">Copy explanation</button></div>
        </form>
        <div class="rule-library">
          <div class="rule-library-head"><strong>Matching rule library</strong><span>Choose a quick topic</span></div>
          <div class="rule-library-list" id="ruleLibraryList"></div>
        </div>
      </div>
      <div class="calc-card rule-output" id="ruleOutput">
        <div class="rule-result-head">
          <div><span class="calc-section-label" id="ruleResultCategory">Drawdown</span><h2 id="ruleResultName">Daily Drawdown</h2></div>
          <span class="rule-language-badge" id="ruleResultLanguage">English</span>
        </div>
        <div class="rule-speech-toolbar" aria-label="Explanation audio controls">
          <button type="button" id="speakRuleButton">▶ Read aloud</button>
          <button type="button" id="pauseSpeechButton">Ⅱ Pause</button>
          <button type="button" id="resumeSpeechButton">↻ Resume</button>
          <button type="button" id="stopSpeechButton">■ Stop</button>
          <span id="speechStatus" aria-live="polite"></span>
        </div>
        <div class="rule-result-grid">
          <article class="rule-result-card meaning"><span>01 · Meaning</span><h3>What the rule means</h3><p id="ruleMeaning"></p></article>
          <article class="rule-result-card failure"><span>02 · Failure pattern</span><h3>Why traders fail it</h3><p id="ruleFailure"></p></article>
          <article class="rule-result-card safe"><span>03 · Safer approach</span><h3>How to stay within it</h3><p id="ruleSafe"></p></article>
          <article class="rule-result-card example"><span>04 · Example</span><h3>Put it into context</h3><p id="ruleExample"></p></article>
        </div>
        <div class="result-note warn">Educational explanation only. Firm definitions, calculation bases, time zones and exceptions vary. Always verify the latest official rule page before trading.</div>
      </div>
    </section>
    <section class="calc-insights">
      <article class="insight-card"><span class="insight-icon">41</span><strong>Complete rule library</strong><p>Drawdown, payout, strategy, evaluation, compliance, execution and account-policy topics are included.</p></article>
      <article class="insight-card"><span class="insight-icon">Aa</span><strong>Seven language modes</strong><p>Switch between English, Hinglish, Hindi, Nigerian English, French, Spanish and Arabic instantly.</p></article>
      <article class="insight-card"><span class="insight-icon">▶</span><strong>Read explanations aloud</strong><p>Supported browsers can speak the complete explanation using the selected language locale.</p></article>
    </section>
    <p class="calc-disclaimer">The Rule Explainer uses a deterministic local knowledge library. It does not parse arbitrary legal documents or automatically know a firm’s latest policy. Verify time-sensitive terms at the official source.</p>
  </div></main>`;

  const searchInput = document.getElementById("ruleSearch");
  const categorySelect = document.getElementById("ruleCategory");
  const languageSelect = document.getElementById("ruleLanguage");
  const ruleSelect = document.getElementById("ruleSelect");
  const matchCount = document.getElementById("ruleMatchCount");
  const libraryList = document.getElementById("ruleLibraryList");
  const languageOptions = document.getElementById("ruleLanguageOptions");
  let currentExplanation = null;

  const syncLanguageOptions = () => {
    languageOptions.querySelectorAll("[data-language]").forEach((button) => {
      const selected = button.dataset.language === languageSelect.value;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  };

  const matchingRules = () => {
    const matches = searchInput.value.trim() ? searchRules(searchInput.value) : listRules();
    return categorySelect.value ? matches.filter((item) => item.category === categorySelect.value) : matches;
  };

  const updateExplanation = () => {
    if (!ruleSelect.value) return;
    currentExplanation = explainRule(ruleSelect.value, languageSelect.value);
    const language = SUPPORTED_LANGUAGES.find((item) => item.code === currentExplanation.language);
    document.getElementById("ruleResultName").textContent = currentExplanation.rule.name;
    document.getElementById("ruleResultCategory").textContent = currentExplanation.rule.category;
    document.getElementById("ruleResultLanguage").textContent = language?.label || "English";
    document.getElementById("ruleMeaning").textContent = currentExplanation.meaning;
    document.getElementById("ruleFailure").textContent = currentExplanation.failure;
    document.getElementById("ruleSafe").textContent = currentExplanation.safe;
    document.getElementById("ruleExample").textContent = currentExplanation.example;
    document.getElementById("ruleOutput").dir = currentExplanation.language === "ar" ? "rtl" : "ltr";
    try { cancelSpeech(); } catch {}
    document.getElementById("speechStatus").textContent = "";
  };

  const refreshLibrary = ({ explain = false } = {}) => {
    const matches = matchingRules();
    const selected = ruleSelect.value;
    ruleSelect.innerHTML = matches.map((item) => `<option value="${item.id}">${item.name} · ${item.category}</option>`).join("");
    if (matches.some((item) => item.id === selected)) ruleSelect.value = selected;
    matchCount.textContent = `${matches.length} ${matches.length === 1 ? "match" : "matches"}`;
    libraryList.innerHTML = matches.length
      ? matches.slice(0, 8).map((item) => `<button type="button" data-rule-id="${item.id}"><span>${item.category}</span><strong>${item.name}</strong><i>↗</i></button>`).join("")
      : `<div class="rule-no-match"><strong>No matching rule</strong><span>Try a broader keyword or reset the category.</span></div>`;
    libraryList.querySelectorAll("[data-rule-id]").forEach((button) => {
      button.addEventListener("click", () => {
        ruleSelect.value = button.dataset.ruleId;
        updateExplanation();
        document.getElementById("ruleOutput").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    if (explain && ruleSelect.value) updateExplanation();
  };

  document.getElementById("ruleForm").addEventListener("submit", (event) => {
    event.preventDefault();
    updateExplanation();
  });
  searchInput.addEventListener("input", () => refreshLibrary({ explain: true }));
  categorySelect.addEventListener("change", () => refreshLibrary({ explain: true }));
  ruleSelect.addEventListener("change", updateExplanation);
  languageSelect.addEventListener("change", () => {
    syncLanguageOptions();
    updateExplanation();
  });
  languageOptions.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => {
      languageSelect.value = button.dataset.language;
      syncLanguageOptions();
      updateExplanation();
    });
  });
  document.getElementById("resetRuleFilters").addEventListener("click", () => {
    searchInput.value = "";
    categorySelect.value = "";
    languageSelect.value = "en";
    syncLanguageOptions();
    refreshLibrary({ explain: true });
  });
  document.getElementById("copyExplanation").addEventListener("click", async (event) => {
    if (!currentExplanation) return;
    try {
      await navigator.clipboard.writeText(`${currentExplanation.rule.name}\n\n${explanationToText(currentExplanation)}`);
      event.currentTarget.textContent = "Copied";
      window.setTimeout(() => { event.currentTarget.textContent = "Copy explanation"; }, 1400);
    } catch {
      event.currentTarget.textContent = "Copy unavailable";
    }
  });
  document.getElementById("speakRuleButton").addEventListener("click", () => {
    try {
      speakRule(ruleSelect.value, languageSelect.value);
      document.getElementById("speechStatus").textContent = "Reading";
    } catch {
      document.getElementById("speechStatus").textContent = "Speech is not supported in this browser";
    }
  });
  document.getElementById("pauseSpeechButton").addEventListener("click", () => {
    try { pauseSpeech(); document.getElementById("speechStatus").textContent = "Paused"; } catch {}
  });
  document.getElementById("resumeSpeechButton").addEventListener("click", () => {
    try { resumeSpeech(); document.getElementById("speechStatus").textContent = "Reading"; } catch {}
  });
  document.getElementById("stopSpeechButton").addEventListener("click", () => {
    try { cancelSpeech(); document.getElementById("speechStatus").textContent = "Stopped"; } catch {}
  });

  refreshLibrary();
  syncLanguageOptions();
  updateExplanation();
}

const page = document.body.dataset.calculator;
if (page === "hub") renderHub();
else if (page === "rules") renderRules();
else if (definitions[page]) renderCalculator(page);
