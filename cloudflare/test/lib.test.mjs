import test from "node:test";
import assert from "node:assert/strict";
import { categories, safeClickUrl, extractDocumentFields } from "../src/lib.js";

test("push categories are allow-listed", () => assert.deepEqual(categories(["offers", "Offers", "bad", "firms"]), ["offers", "firms"]));
test("click URLs stay on RankMyProp", () => {
  assert.equal(safeClickUrl("/offers/upcomers"), "/offers/upcomers");
  assert.throws(() => safeClickUrl("https://example.com"));
});
test("document compatibility fields preserve Firestore query keys", () => {
  assert.deepEqual(extractDocumentFields({ userUid: "u1", firmSlug: "upcomers", status: "Approved" }), {
    uid: "u1", email: null, slug: "upcomers", status: "Approved", createdAt: null, updatedAt: null,
  });
});
