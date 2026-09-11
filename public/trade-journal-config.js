const runtime = typeof window !== "undefined" && window.__TRADE_JOURNAL_CONFIG__
  ? window.__TRADE_JOURNAL_CONFIG__
  : {};

export const tradeJournalConfig = Object.freeze({
  collectionName: String(runtime.collectionName || "tradeJournalEntries"),
  userMapField: String(runtime.userMapField || "tradeJournalEntriesMap"),
  cloudinaryCloudName: String(runtime.cloudinaryCloudName || "do04yawk7"),
  cloudinaryUploadPreset: String(runtime.cloudinaryUploadPreset || "RANKMYPROP")
});
