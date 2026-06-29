import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("./pages/Home.jsx", import.meta.url), "utf8");
const ordersSource = readFileSync(new URL("./pages/Orders.jsx", import.meta.url), "utf8");
const enSource = readFileSync(new URL("./i18n/locales/en.json", import.meta.url), "utf8");

test("player review system is wired into routes, home, orders, and i18n", () => {
  assert.match(appSource, /const Reviews = lazy\(\(\) => import\("\.\/pages\/Reviews\.jsx"\)\)/);
  assert.match(appSource, /<Route path="\/reviews" element=\{<Reviews \/>\} \/>/);
  assert.match(homeSource, /import HomeReviewsSection from "\.\.\/components\/HomeReviewsSection\.jsx";/);
  assert.match(homeSource, /<HomeReviewsSection \/>/);
  assert.match(ordersSource, /import \{ getReviewByOrder \} from "\.\.\/api\/review"/);
  assert.match(ordersSource, /<ReviewSubmitModal/);
  assert.match(enSource, /"reviews"\s*:/);
});
