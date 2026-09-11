export const EDITORIAL_CONTRIBUTORS = Object.freeze({
  zeeshan: Object.freeze({
    id: "zeeshan",
    name: "Zeeshan",
    role: "Prop Firm Research Editor",
    image: "/assets/editorial/zeeshan.jpg",
    expertise: Object.freeze(["Prop firm rules", "Challenge evaluations", "Risk management", "Payout policies"]),
    bio: "Zeeshan contributes to Rank My Prop's editorial research on prop firm evaluations, trading rules, drawdown structures, payout requirements, and account conditions. He focuses on turning complex firm policies into clear, practical guidance that traders can review before purchasing a challenge. His work emphasizes accurate comparisons, responsible risk planning, transparent sourcing, and reader-friendly explanations of the terms that can affect funded account performance."
  }),
  imran: Object.freeze({
    id: "imran",
    name: "Imran",
    role: "Trading Education Contributor",
    image: "/assets/editorial/imran.jpg",
    expertise: Object.freeze(["Trading psychology", "Funding strategies", "Beginner education", "Execution planning"]),
    bio: "Imran contributes educational content for Rank My Prop across trading psychology, funding strategies, beginner guidance, and disciplined execution. He helps translate trading concepts into structured, actionable lessons for readers at different experience levels. His editorial approach prioritizes realistic expectations, consistent decision-making, capital protection, and practical preparation, giving traders a clearer framework for evaluating opportunities and navigating the demands of prop firm challenges."
  })
});

const AUTO_BY_TYPE = Object.freeze({
  "prop-news": "zeeshan",
  "trading-guides": "zeeshan",
  "funding-strategies": "imran",
  "trading-psychology": "imran",
  "beginner-tutorials": "imran"
});

export function contributorById(id = "") {
  return EDITORIAL_CONTRIBUTORS[String(id || "").trim().toLowerCase()] || null;
}

export function automaticContributorId(type = "", category = "") {
  const normalizedType = String(type || "").trim().toLowerCase();
  const normalizedCategory = String(category || "").trim().toLowerCase();
  if (/psycholog|beginner|tutorial|funding strateg/.test(normalizedCategory)) return "imran";
  if (/news|rule|review|comparison|guide|payout|prop firm/.test(normalizedCategory)) return "zeeshan";
  return AUTO_BY_TYPE[normalizedType] || "zeeshan";
}

export function resolveEditorialAssignments(post = {}, type = "") {
  const autoId = automaticContributorId(type, post.category);
  const reviewedSetting = String(post.reviewedBy || "auto").trim().toLowerCase();
  const verifiedSetting = String(post.verifiedBy || "none").trim().toLowerCase();
  return {
    reviewed: reviewedSetting === "none" ? null : contributorById(reviewedSetting === "auto" ? autoId : reviewedSetting),
    verified: verifiedSetting === "none" ? null : contributorById(verifiedSetting === "auto" ? autoId : verifiedSetting)
  };
}
