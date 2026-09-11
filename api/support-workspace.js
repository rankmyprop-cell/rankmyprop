"use strict";

const { firestore, staffOrCeoIdentity } = require("./_lib/clients");
const { HttpError, handler, json, method } = require("./_lib/http");
const { serialize, stripPii } = require("./_lib/pii");

const COLLECTIONS = Object.freeze({
  firms: "firms",
  offers: "offers",
  brandAssets: "brandAssets",
  claims: "claims",
  claimRequests: "claimRequests",
  reviews: "reviews",
  firmReviews: "firmReviews",
  firmReviewProfiles: "firmReviewProfiles",
  firmRatingStats: "firmRatingStats",
  giveaways: "giveaways",
  upcomingEvents: "upcomingEvents",
  purchases: "purchases",
  bonusOffers: "bonusOffers",
  propNewsPosts: "propNewsPosts",
  propNewsVideos: "propNewsVideos",
  tradingGuidesPosts: "tradingGuidesPosts",
  tradingGuidesVideos: "tradingGuidesVideos",
  fundingStrategiesPosts: "fundingStrategiesPosts",
  fundingStrategiesVideos: "fundingStrategiesVideos",
  tradingPsychologyPosts: "tradingPsychologyPosts",
  tradingPsychologyVideos: "tradingPsychologyVideos",
  beginnerTutorialsPosts: "beginnerTutorialsPosts",
  beginnerTutorialsVideos: "beginnerTutorialsVideos"
});

const GROUPS = Object.freeze({
  portalContent: ["pageHeadingsParagraphs", "pageCopy", "pageSeoContent", "pageFaqs"],
  issues: ["supportTickets", "reviewReports"],
  accountClaims: ["accountClaims", "claims", "claimRequests"],
  firmDetailCms: ["firms", "firmReviewProfiles", "firmRatingStats", "firmReviews", "offers"],
  propNewsCms: ["propNewsPosts", "propNewsVideos", "pageFaqs"],
  tradingGuidesCms: ["tradingGuidesPosts", "tradingGuidesVideos", "pageFaqs"],
  fundingStrategiesCms: ["fundingStrategiesPosts", "fundingStrategiesVideos", "pageFaqs"],
  tradingPsychologyCms: ["tradingPsychologyPosts", "tradingPsychologyVideos", "pageFaqs"],
  beginnerTutorialsCms: ["beginnerTutorialsPosts", "beginnerTutorialsVideos", "pageFaqs"],
  purchasesCms: ["purchases", "bonusOffers"]
});

module.exports = handler(async (req, res) => {
  method(req, ["GET"]);
  const actor = await staffOrCeoIdentity(req);
  const key = String(req.query?.collection || "");
  const collectionName = COLLECTIONS[key];
  const grouped = GROUPS[key];
  if (!collectionName && !grouped) throw new HttpError(403, "This workspace collection is not allowed.", "collection_forbidden");

  const limit = Math.max(1, Math.min(500, Number(req.query?.limit || 250)));
  const names = grouped || [collectionName];
  const snapshots = await Promise.all(names.map((name) => firestore().collection(name).limit(limit).get()));
  const rows = snapshots.flatMap((snapshot, index) => snapshot.docs.map((doc) => ({
    id: doc.id,
    _workspaceCollection: names[index] === "reviewReports"
      ? "issueReports"
      : names[index],
    ...serialize(doc.data())
  })));
  return json(res, 200, {
    ok: true,
    collection: key,
    rows: actor.role === "support" ? stripPii(rows) : rows,
    loadedAt: new Date().toISOString()
  });
});
